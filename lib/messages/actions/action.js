"use server"
import prisma from "@/lib/db"
import { MessageType, MessageRole } from "@/lib/generated/prisma/enums"
import { inngest } from "@/inngest/client"
import { getcurruser } from "@/lib/actions/action"
import { consumeCredits } from "@/lib/usage"

// 🚨 CHANGE 1: Pehla parameter ab object hai jisme content aur jobId aayega
export async function createMessage({ content, jobId }, projectId) {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("User is Unauthorized !!")
    }
    
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            userId: user.id
        }
    })
    
    if (!project) {
        throw new Error("User is not the owner of this project")
    }
    
    try {
        await consumeCredits();
    } catch (error) {
        console.log(error)
        throw new Error("OUT_OF_CREDITS");
    }
    
    const newMessage = await prisma.message.create({
        data: {
            content: content, // 🚨 CHANGE 2: 'value' ko 'content' se replace kiya
            role: MessageRole.USER,
            type: MessageType.RESULT,
            projectId: projectId
        }
    })
    
    await inngest.send({
        name: "code-agent/run",
        data: {
            value: content, // 🚨 CHANGE 3: Inngest ko prompt text bhej rahe hain
            projectId: projectId,
            jobId: jobId // 🚨 CHANGE 4: Inngest ko track karne ke liye jobId pass kar di!
        }
    })
    
    return newMessage
}

export async function getmessages(projectId) {
    const { user } = await getcurruser();
    if (!user) {
        throw new Error("User is Unauthorized !!")
    }
    
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            userId: user.id
        }
    })
    
    if (!project) {
        throw new Error("User is not the owner of this project")
    }
    
    const messages = await prisma.message.findMany({
        where: {
            projectId: projectId
        },
        orderBy: {
            createdAt: "asc"
        },
        include: {
            fragments: true
        }
    })
    
    return messages
}

export async function cancelAgentJob(jobId, projectId) {
  try {
    if (!jobId) {
      return { success: false, error: "Job ID is required" };
    }

    // 1. Send the kill signal to the Inngest event bus
    await inngest.send({
      name: "code-agent/cancel",
      data: {
        jobId: jobId 
      }
    });

    // 2. Update your database so the UI reflects the cancellation
    await prisma.message.create({
      data: {
        projectId: projectId,
        content: "Generation was cancelled by the user.",
        type: MessageType.ERROR, 
        role: MessageRole.ASSISTANT
      }
    });

    // Server Actions must return serializable plain objects (No NextResponse!)
    return { success: true };
    
  } catch (error) {
    console.error("Failed to cancel agent:", error);
    return { success: false, error: "Internal server error during cancellation." };
  }
}