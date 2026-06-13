"use server"
import { PRO_POINTS, FREE_POINTS, getUsageStatus, DURATION } from "@/lib/usage"
import { auth } from "@clerk/nextjs/server"

export const status = async () => {
    try {
        // Clerk's auth() returns both userId and has() in one call
        const { userId, has } = await auth();
        
        if (!userId) {
            // Safe return instead of throw
            return { success: false, error: "Unauthorized" };
        }
        
        const hasAccess = has({ plan: "pro" });
        const currentMaxPoints = hasAccess ? PRO_POINTS : FREE_POINTS;
        
        const result = await getUsageStatus();
        
        if (!result) {
            return {
                success: true,
                remainingPoints: currentMaxPoints,
                msBeforeNext: DURATION * 1000,
                consumedPoints: 0,
                isFirstRequest: true,
                maxPoints: currentMaxPoints
            };
        }
        
        const remainingPoints = result.remainingPoints ?? (currentMaxPoints - (result.consumedPoints || 0));
        
        return {
            success: true,
            remainingPoints,
            msBeforeNext: result.msBeforeNext || DURATION * 1000,
            consumedPoints: result.consumedPoints || 0,
            isFirstRequest: false,
            maxPoints: currentMaxPoints
        };
        
    } catch (error) {
        // Log to your server console for debugging, but safely return to the client
        console.error("Usage status error:", error);
        return { success: false, error: "Failed to fetch usage status" };
    }
}