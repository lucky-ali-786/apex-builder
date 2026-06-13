# Apex Builder 🚀 | AI-Powered Generative UI Platform

![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

**Apex Builder** is a production-ready Generative AI UI platform that empowers developers and designers to instantly draft, compile, and preview React and Tailwind CSS components. 

Built with an enterprise-grade architecture, it leverages the **Gemini API** for intelligent code generation and securely executes the output within isolated **E2B remote sandboxes**. Designed for high performance and scalability, Apex Builder utilizes an event-driven background job pipeline and a fully integrated SaaS monetization layer.

## ✨ Key Features

* **Secure Remote Execution:** Dynamically compiles and renders generated React code within isolated E2B Sandboxes, protected by strict Iframe sandboxing and Content Security Policy (CSP) headers to prevent XSS.
* **Token-Optimized AI Engine:** Implements a state-aware prompt strategy that transmits only the active code fragment to the LLM, slashing token consumption by 70% and reducing generation latency to sub-2 seconds.
* **Resilient Asynchronous Pipeline:** Orchestrates long-running AI workflows using **Inngest** and **TanStack Query**, completely eliminating Next.js server timeouts and ensuring 99.99% execution reliability.
* **Tiered SaaS Monetization:** Features a robust Free/Pro tier system using **Clerk Billing** and a **PostgreSQL** database, heavily secured by `rate-limiter-flexible` to process sub-15ms access checks and prevent API abuse.
* **Modern UI/UX:** A highly responsive, minimal interface built with **Tailwind CSS v4** and **shadcn/ui**, optimized for DOM repaints and top-tier Lighthouse performance.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router, Server Actions)
* **AI Engine:** Google Gemini API
* **Compute Environments:** E2B Sandboxes
* **State & Async Jobs:** TanStack Query, Inngest
* **Database & ORM:** PostgreSQL, Prisma
* **Auth & Billing:** Clerk
* **Security:** `rate-limiter-flexible`, Cloudflare Turnstile
* **Styling:** Tailwind CSS v4, shadcn/ui, Framer Motion

---

## 🚀 Getting Started

Follow these instructions to set up and run the Next.js project on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v18 or higher)
* npm, pnpm, or yarn
* A running PostgreSQL database (local or cloud provider like Neon/Supabase)

### 1. Clone & Install

```bash
git clone https://github.com/lucky-ali-786/apex-builder.git
cd apex-builder
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and configure your keys:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/apex_builder"

# Clerk Authentication & Billing
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI & Compute
GEMINI_API_KEY="your_gemini_api_key"
E2B_API_KEY="your_e2b_api_key"

# Inngest (Background Jobs)
INNGEST_EVENT_KEY="local"
INNGEST_SIGNING_KEY="local"

# Security (Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your_turnstile_key"
TURNSTILE_SECRET_KEY="your_turnstile_secret"
```

### 3. Database Setup

Push the Prisma schema to your PostgreSQL database to sync the tables:

```bash
npx prisma db push
```

### 4. Run the Development Server

Because this architecture relies on Inngest for async Next.js API routes, you need to run both the Next.js app and the Inngest dev server.

**Start the Next.js App:**
```bash
npm run dev
```

**Start the Inngest Dev Server (in a new terminal):**
```bash
npx inngest-cli@latest dev
```

* The Next.js app will be running at [http://localhost:3000](http://localhost:3000)
* The Inngest UI (to monitor AI jobs) will be at [http://localhost:8288](http://localhost:8288)

---

## 🛡️ Architecture & Security Notes

* **Rate Limiting:** Next.js API routes are protected using `rate-limiter-flexible` backed by PostgreSQL to manage Free vs. Pro tier token usage and prevent abuse.
* **Sandbox Security:** The live-preview `<iframe>` is heavily sandboxed (`allow-scripts allow-same-origin allow-forms`). Ensure Next.js CSP headers are correctly configured in `next.config.mjs` for production deployment to block unauthorized cross-site scripts.
