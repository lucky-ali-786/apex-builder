"use server"
import { inngest } from "@/inngest/client"
import { getcurruser } from "@/lib/actions/action"
import prisma from "@/lib/db"
import { MessageType, MessageRole } from "@/lib/generated/prisma/enums"
import { format } from "date-fns"
import { generateSlug } from "random-word-slugs"
import { consumeCredits } from "@/lib/usage"
import { Sandbox } from "@e2b/code-interpreter";
export async function wakeUpSandbox(projectId, currentCode) {
    const { user } = await getcurruser();
    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
        where: { id: projectId, userId: user.id }
    });

    if (!project) throw new Error("Project not found");

    let sandboxId = project.sandboxId;
    let sandbox;
    let isAlive = false;

    // 1. Try to connect to existing sandbox
    if (sandboxId) {
        try {
            sandbox = await Sandbox.connect(sandboxId);
            await sandbox.commands.run("echo 'alive'", { timeoutMs: 3000 });
            isAlive = true;
            console.log("🟢 Sandbox is alive!");
        } catch (error) {
            console.log("🔴 Sandbox unreachable. Proceeding to boot a new one...");
            isAlive = false; 
        }
    }

    // 2. Boot new sandbox if dead
    if (!isAlive) {
        sandbox = await Sandbox.create("apex-builder-4", {
            timeoutMs: 1000 * 60 * 10 // 10 minutes
        });

        sandboxId = sandbox.sandboxId;

        // Save ID immediately
        await prisma.project.update({
            where: { id: projectId },
            data: { sandboxId }
        });
    }

    // 3. Inject the current code (Works for both new and existing sandboxes)
    if (currentCode) {
        await sandbox.files.write("/home/user/src/App.tsx", currentCode);
    }

    // 4. 🚨 THE FIX: Guarantee Vite is running on port 3000
    let viteReady = false;

    // Quick health check: Is port 3000 already responding?
    try {
        const check = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000");
        if (check.stdout && check.stdout.includes("200")) {
            console.log("✅ Vite is already running!");
            viteReady = true;
        }
    } catch (err) {
        // Ignore curl errors, port is likely dead
    }

    // If Vite isn't running, start it up and poll
    if (!viteReady) {
        console.log("🚀 Starting/Restarting Vite Dev Server...");
        
        await sandbox.commands.run("cd /home/user && npm run dev -- --port 3000 --host 0.0.0.0", {
            background: true,
            onStdout: (out) => console.log("🟢 VITE:", out?.line || out),
            onStderr: (err) => console.log("🔴 VITE ERR:", err?.line || err)
        });

        console.log("⏳ Polling for Vite to boot...");

        // Fast Polling Loop
        for (let i = 0; i < 15; i++) { // Increased to 15s to be safe
            try {
                const check = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000");
                if (check.stdout && check.stdout.includes("200")) {
                    console.log("✅ Vite is LIVE and ready!");
                    viteReady = true;
                    break; // Exit loop once healthy
                }
            } catch (err) {
                // Ignore curl errors during boot sequence
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!viteReady) {
            console.warn("⚠️ Vite health check timed out, but proceeding anyway...");
        }
    }

    // 5. Get exact URL and return
    const host = sandbox.getHost(3000);
    return `https://${host}`;
}
export const createProject = async (value) => {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("Unauthorized user")
    }

    try {
        await consumeCredits();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Something went wrong");
        } else {
            throw new Error("Too many requests");
        }
    }

    const newpro = await prisma.project.create({
        data: {
            name: generateSlug(2, { format: "kebab" }),
            userId: user.id,
            messages: {
                create: {
                    content: value,
                    type: MessageType.RESULT,
                    role: MessageRole.USER
                }
            }
        }
    })

    if (!newpro) {
        throw new Error("project creation failed")
    }

    await inngest.send({
        name: "code-agent/run",
        data: {
            value: value,
            projectId: newpro.id
        }
    })

    return newpro
}
export const getallprojects = async () => {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("Unauthorized user")
    }
    const allpros = await prisma.project.findMany({
        where: {
            userId: user.id
        },
        orderBy: { createdAt: "desc" }
    })
    return allpros
}
export const getprojectbyid = async (proid) => {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("Unauthorized user")
    }
    const probyid = await prisma.project.findUnique({
        where: {
            id: proid,
            userId: user.id
        }
    })
    if (!probyid) {
        throw new Error("no project with this id found")
    }
    return probyid
}
export const deleteProject = async (proid) => {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("Unauthorized user")
    }
    const probyid = await prisma.project.findUnique({
        where: {
            id: proid,
            userId: user.id
        }
    })

    if (!probyid) {
        throw new Error("no project with this id found")
    }
    if (probyid.sandboxId) {
        try {
            await Sandbox.kill(probyid.sandboxId);
            console.log("🟢 Sandbox killed successfully!");
        } catch (error) {
            console.log("🔴 Failed to kill sandbox:", error);
        }
    }
    try {
        const deletedpro = await prisma.project.delete({
            where: {
                id: proid
            }
        })

        if (!deletedpro) {
            throw new Error("project deletion failed")
        }

        return deletedpro
    } catch (error) {
        throw new Error("Something went wrong while deleting the project")
    }
}


