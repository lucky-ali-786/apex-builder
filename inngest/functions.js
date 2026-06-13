import { inngest } from "./client";
import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import z from "zod";
import { lastAssistantTextMessageContent } from "./life";
import { PROMPT, FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "./prompt";
import prisma from "@/lib/db";
import { MessageRole, MessageType } from "@/lib/generated/prisma/enums";
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

function getRandomGeminiKey() {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No Gemini API keys found in .env!");
  }
  const randomIndex = Math.floor(Math.random() * GEMINI_KEYS.length);
  return GEMINI_KEYS[randomIndex];
}

export const codeagent = inngest.createFunction(
  { id: "code-agent", triggers: { event: 'code-agent/run' },
  cancelOn: [
      {
        event: "code-agent/cancel",
        match: "data.jobId", // Or "data.projectId", depending on how you set it up
      }
    ]
 },
  async ({ event, step }) => {
    const context = await step.run("fetch-context", async () => {
      const project = await prisma.project.findUnique({
        where: { id: event.data.projectId },
        include: {
          messages: {
            where: { type: "RESULT", fragments: { isNot: null } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { fragments: true }
          }
        }
      });

      if (!project) throw new Error("Project not found");

      const latestMessage = project.messages[0];
      const currentFiles = latestMessage?.fragments?.files || {};
      const currentCode = currentFiles["src/App.tsx"] || null;

      return {
        sandboxId: project.sandboxId,
        currentCode,
        currentFiles
      };
    });
    const sandboxId = await step.run("ensure-sandbox", async () => {
      let sid = context.sandboxId;
      let isAlive = false;
      let sandbox;
      if (sid) {
        try {
          sandbox = await Sandbox.connect(sid);

          // Force execution check to avoid false-positives
          await sandbox.commands.run("echo 'alive'", { timeoutMs: 3000 });

          isAlive = true;
          console.log("🟢 Inngest: Sandbox is alive, reconnecting...");
        } catch (error) {
          console.log("🔴 Inngest: Sandbox is dead, creating a new one...");
          isAlive = false;
        }
      }
      if (!isAlive) {
        // 30 Minutes Lifespan
        sandbox = await Sandbox.create("apex-builder-4", {
          timeoutMs: 1000 * 60 * 10
        });
        sid = sandbox.sandboxId;

        // Save the new ID to DB immediately
        await prisma.project.update({
          where: { id: event.data.projectId },
          data: { sandboxId: sid }
        });
      }
      if (context.currentCode) {
        await sandbox.files.write("/home/user/src/App.tsx", context.currentCode);
      }

      // 🚨 THE FIX: Guarantee Vite is running on port 3000
      let viteReady = false;

      // Quick health check: Is port 3000 already responding?
      try {
        const check = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000");
        if (check.stdout && check.stdout.includes("200")) {
          console.log("✅ Inngest: Vite is already running!");
          viteReady = true;
        }
      } catch (err) {
        // Ignore curl errors, port is likely dead
      }

      // If Vite isn't running, start it up and poll
      if (!viteReady) {
        console.log("🚀 Inngest: Starting/Restarting Vite Dev Server...");

        await sandbox.commands.run("cd /home/user && npm run dev -- --port 3000 --host 0.0.0.0", {
          background: true,
          onStdout: (out) => console.log("🟢 VITE:", out?.line || out),
          onStderr: (err) => console.log("🔴 VITE ERR:", err?.line || err)
        });

        console.log("⏳ Inngest: Polling for Vite to boot...");

        // Fast Polling Loop
        for (let i = 0; i < 15; i++) {
          try {
            const check = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000");
            if (check.stdout && check.stdout.includes("200")) {
              console.log("✅ Inngest: Vite is LIVE and ready!");
              viteReady = true;
              break;
            }
          } catch (err) {
          }
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      return sid;
    });

    const codeAgent = createAgent({
      name: "code-agent",
      system: PROMPT,
      description: "You are An expert coding agent",
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: getRandomGeminiKey(),
        maxOutputTokens: 8192 // 🚨 MANDATORY for generating large files without breaking JSON
      }),
      tools: [
        createTool({
          name: "Terminal",
          description: "Use terminal to run commands",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step }) => {
            return await step?.run("Terminal", async () => {
              const buffer = { stdout: "", stderr: "" }
              try {
                const sandbox = await Sandbox.connect(sandboxId)
                const commandsrunner = await sandbox.commands.run(command, {
                  onStdout: (data) => { buffer.stdout += data },
                  onStderr: (data) => { buffer.stderr += data }
                })
                return commandsrunner.stdout
              } catch (error) {
                return `Command line error ${error} \n stdout: ${buffer.stdout} stderr:${buffer.stderr}`
              }
            })
          }
        }),
        createTool({
          name: "create_or_update_files",
          description: "CRITICAL: You MUST use this tool to write code. WARNING: The 'content' string MUST be raw text. DO NOT wrap the code in ```tsx or any markdown formatting inside the tool parameters. Ensure all quotes are properly escaped.",
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() }))
          }),
          handler: async ({ files }, { step, network }) => {
            const newfiles = await step?.run("create_or_update_files", async () => {
              try {
                const updatedfiles = { ...(network?.state?.data?.files || {}) };
                const sandbox = await Sandbox.connect(sandboxId);

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedfiles[file.path] = file.content;
                }
                return updatedfiles;
              } catch (error) {
                return "Error: " + error;
              }
            });

            if (typeof newfiles === "object") {
              network.state.data.files = newfiles;
              return `Successfully updated ${files.length} file(s). You MUST now output the <task_summary> tag.`;
            }

            return newfiles;
          }
        }),
        createTool({
          name: "create_or_update_file", // 🚨 1. Changed to singular

          // 🚨 2. The Magic Prompt Injection to stop the API crash
          description: "CRITICAL MANDATORY TOOL: You MUST use this tool to write code. WARNING: You must properly JSON-escape all string values in the 'content' argument (newlines as \\n, quotes as \\\", backslashes as \\\\). DO NOT wrap the code in markdown.",

          // 🚨 3. Simplified Schema (No more arrays!)
          parameters: z.object({
            path: z.string().describe("The relative path, e.g., src/App.tsx"),
            content: z.string().describe("The raw, properly escaped code content.")
          }),

          handler: async ({ path, content }, { step, network }) => {
            console.log(`\n================ [ TOOL TRIGGERED ] ================`);
            console.log(`🛠️ TOOL: create_or_update_file`);
            console.log(`📄 Attempting to write file:`, path);

            const result = await step?.run("create_or_update_file", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);

                // Write the single file
                await sandbox.files.write(path, content);

                // Update network state safely
                const currentFiles = { ...(network?.state?.data?.files || {}) };
                currentFiles[path] = content;

                console.log("🟢 TOOL: Sandbox file write successful!");
                return { success: true, files: currentFiles };
              } catch (error) {
                console.log("🔴 TOOL ERR:", error.message);
                return { success: false, error: String(error) };
              }
            });

            if (result?.success) {
              network.state.data.files = result.files;
              return `Successfully updated ${path}. You MUST now output the <task_summary> tag.`;
            }

            return `Error writing file: ${result?.error}. Please try again.`;
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          console.log("\n================ [ LIFECYCLE ] ================");
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              console.log("🎯 LIFECYCLE: <task_summary> tag found! Saving to state.");
              network.state.data.summary = lastAssistantMessageText;
            } else {
              console.log("🔍 LIFECYCLE: No <task_summary> tag found in this response.");
            }
          }
          return result;
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 5,
      router: async ({ network, result }) => {
        console.log("\n================ [ ROUTER TICK ] ================");

        if (network.state.data.summary) {
          console.log("✅ ROUTER: Summary found! Exiting loop.");
          return;
        }

        if (!result) {
          console.log("🟦 ROUTER: First tick. Starting codeAgent...");
          return codeAgent;
        }

        // 🚨 LOG: Check if the agent actually requested a tool in the raw output
        const toolCalls = result.output?.filter(out => out.type === "tool_call") || [];
        if (toolCalls.length > 0) {
          console.log("🚀 ROUTER: Agent successfully requested tool(s):", toolCalls.map(t => t.name));
        } else {
          console.log("⚠️ ROUTER: Agent did NOT request any tools this tick.");
        }

        const lastMessage = lastAssistantTextMessageContent(result);
        console.log("🟨 ROUTER: Agent text output (First 200 chars):\n", lastMessage?.substring(0, 200) || "No text output.");

        if (lastMessage && lastMessage.includes("```")) {
          console.log("🟥 ROUTER: Agent hallucinated markdown! Injecting correction prompt...");
          network.state.messages.push({
            role: "user",
            content: "CRITICAL ERROR: You output a markdown code block instead of using the `create_or_update_files` tool. I cannot read markdown. You MUST use the tool to save the code, then output the <task_summary>."
          });
        }

        console.log("🔄 ROUTER: Looping back to codeAgent...");
        return codeAgent;
      }
    });
    network.state.data.files = context.currentFiles;

    const promptWithContext = context.currentCode
      ? `Here is the current code in the file:\n\n\`\`\`tsx\n${context.currentCode}\n\`\`\`\n\nUser Request: ${event.data.value}`
      : event.data.value;

    const result = await network.run(promptWithContext);
    const summaryText = result.state.data.summary || "Code updated successfully.";

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash", apiKey: getRandomGeminiKey() }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      system: RESPONSE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash", apiKey: getRandomGeminiKey() }),
    });
    const [titleResult, responseResult] = await Promise.all([
      fragmentTitleGenerator.run(summaryText),
      responseGenerator.run(summaryText)
    ]);
    let title = "Untitled";
    if (titleResult.output[0]?.type === "text") {
      title = Array.isArray(titleResult.output[0].content)
        ? titleResult.output[0].content.join("")
        : titleResult.output[0].content;
    }
    let response = "Here you go";
    if (responseResult.output[0]?.type === "text") {
      response = Array.isArray(responseResult.output[0].content)
        ? responseResult.output[0].content.join("")
        : responseResult.output[0].content;
    }
    const isError = result.state.data.summary === "" ? true : false;
    console.log(isError)
    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong while generating the code.",
            type: MessageType.ERROR,
            role: MessageRole.ASSISTANT
          }
        });
      } else {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: response,
            type: MessageType.RESULT,
            role: MessageRole.ASSISTANT,
            fragments: {
              create: {
                title: title,
                files: result.state.data.files
              }
            }
          }
        });
      }
    });
    return {
      title: "Completed",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  }
);