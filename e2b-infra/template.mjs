import { Template } from 'e2b';

export const sandboxTemplate = Template()
  .fromBaseImage('node:20-slim')
  .setUser('root')
  
  // 1. Basic system dependencies
  .runCmd('apt-get update && apt-get install -y curl && apt-get clean')
  
  // 2. Directly create structure in home directory
  .setWorkdir('/home/user')
  .runCmd('mkdir -p src public')
  
  // 3. Write package.json (Tailwind v4 Setup!)
  .runCmd(`cat << 'EOF' > package.json
{
  "name": "vite-react-simple",
  "type": "module",
  "scripts": { "dev": "vite", "build": "tsc && vite build" },
  "dependencies": { 
    "react": "^18.2.0", 
    "react-dom": "^18.2.0",
    "lucide-react": "latest",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  },
  "devDependencies": { 
    "@types/react": "^18.2.0", 
    "@types/react-dom": "^18.2.0", 
    "@vitejs/plugin-react": "^4.2.0", 
    "typescript": "^5.2.0", 
    "vite": "^5.0.0" 
  }
}
EOF`)

  // 4. Write Vite Configuration (Added Tailwind v4 Plugin)
// 4. Write Vite Configuration (Added Tailwind v4 Plugin & allowedHosts FIX)
  .runCmd(`cat << 'EOF' > vite.config.ts
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({ 
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true
  }
})
EOF`)

  // 5. Write TypeScript Configuration
  .runCmd(`cat << 'EOF' > tsconfig.json
{
  "compilerOptions": { 
    "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"], 
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", 
    "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, 
    "noEmit": true, "jsx": "react-jsx", "strict": true
  },
  "include": ["src"]
}
EOF`)
  
  // 6. Write Core React Files
  .runCmd(`cat << 'EOF' > index.html
<!DOCTYPE html><html lang="en"><head><title>Simple React App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
EOF`)

  // 🚨 TAILWIND v4 MAGIC: Only one line needed in CSS! No config files.
  .runCmd(`cat << 'EOF' > src/index.css
@import "tailwindcss";
EOF`)

  .runCmd(`cat << 'EOF' > src/main.tsx
import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App.tsx'; import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
EOF`)

  .runCmd(`cat << 'EOF' > src/App.tsx
export default function App() { return <div className="p-4 text-xl font-bold text-blue-500">React + Vite + Tailwind v4 Ready 🚀</div> }
EOF`)
  
  // 7. Install packages (Hata diya wo npx init command!)
  .runCmd('npm install')
  
  // 8. Fix permissions and switch to user
  .runCmd('chown -R user:user /home/user')
  .setUser('user');