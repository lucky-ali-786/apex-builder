import { config } from 'dotenv';
import { resolve } from 'path';
import { Template, defaultBuildLogger } from 'e2b';
import { sandboxTemplate } from './template.mjs';

// 1. Force dotenv to look in the root folder for Next.js env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') }); // Fallback just in case

async function buildIt() {
  console.log("🚀 Starting E2B Sandbox Build with UPGRADED HARDWARE...");

  // 2. Sanity check: Did we actually load the key?
  if (!process.env.E2B_API_KEY) {
    throw new Error("❌ E2B_API_KEY is missing! Check your .env or .env.local file.");
  }
  console.log("🔑 API Key loaded successfully!");
  
  // 3. Run the build (🚀 THE FIX IS RIGHT HERE)
  await Template.build(sandboxTemplate, 'apex-builder-4', {
    onBuildLogs: defaultBuildLogger(),
    cpuCount: 4,         // Force 4 CPUs
    memoryMB: 4096,      // Force 4GB RAM (Capital M, Capital B)
  });
  
  console.log("✅ Build complete! You can now use this in your Next.js app.");
}

buildIt().catch(console.error);