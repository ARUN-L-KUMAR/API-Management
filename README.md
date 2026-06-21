# AI Provider Registry & Model Discovery Platform

A modern SaaS-style dashboard designed to securely vault API keys from multiple AI providers, auto-discover supported models, run scheduled health probes, and test prompts in a sandboxed model playground.

---

## 📁 Monorepo Folder Structure

```text
ai-provider-registry/
├── apps/
│   ├── backend/             # NestJS API, Encryption Service & BullMQ Workers
│   │   ├── src/
│   │   │   ├── common/      # Encryption utilities (AES-256-GCM)
│   │   │   ├── database/    # Drizzle schema connection, indexes & migrations
│   │   │   ├── jobs/        # BullMQ processors (Validation, Discovery, Verification)
│   │   │   └── resources/   # REST API modules (Keys, Folders, Tags, Playground, Logs)
│   │
│   └── frontend/            # Next.js 15 App Router Frontend Client
│       ├── src/
│       │   ├── app/         # Pages, Layout & styles (Tailwind CSS v4)
│       │   ├── components/  # Providers & Layout containers
│       │   ├── store/       # Zustand UI filter state
│       │   └── lib/         # API fetch client wrapper
│
├── README.md                # Execution guide (this file)
└── package.json
```

---

## 🛠️ Prerequisites

Before booting the platform, make sure you have the following installed:
1. **Node.js** (v18.x or v20.x recommended)
2. **PostgreSQL** instance (local, Docker, or serverless Neon PostgreSQL link)
3. **Redis** instance (local, Docker, or managed Upstash Redis connection)

---

## 🚀 Step-by-Step Setup Guide

### 1. Install Dependencies
Run package installations inside both the frontend and backend directories:

```bash
# Backend installation
cd apps/backend
npm install

# Frontend installation
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of **`apps/backend`**:

```bash
# apps/backend/.env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api_provider_db"
REDIS_URL="redis://localhost:6379"

# Symmetric encryption secret (must be at least 32 characters long)
ENCRYPTION_SECRET="super-secure-encryption-secret-string-32-chars"
```

Create a `.env.local` file in the root of **`apps/frontend`**:

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

---

## 🗄️ 3. Database Schema Setup

Compile the Drizzle schema and execute migrations to apply the tables to your PostgreSQL instance:

```bash
cd apps/backend

# Generate migrations SQL files (Already generated at src/database/migrations/)
npx drizzle-kit generate

# Apply migrations and create tables inside your database
# Ensure DATABASE_URL is defined in apps/backend/.env
npx drizzle-kit push
```

---

## 🏃 4. Running the Applications

To run the application locally, start both the backend API/worker processes and the Next.js dev server:

### A. Boot the NestJS Backend Service (Port `4000`)
```bash
cd apps/backend
npm run start:dev
```
*This starts the API endpoints, boots the BullMQ workers, and begins the 5-minute background cron schedule scanning monitoring frequencies.*

### B. Boot the Next.js Frontend (Port `3000`)
Open a new terminal window:
```bash
cd apps/frontend
npm run dev
```

### C. Connect & Test
1. Open your browser to `http://localhost:3000` to load the registry dashboard.
2. Click **Add API Key** in the top-right corner to vault a new credential.
3. To test immediately using mock credentials without making third-party provider calls:
   - Select **DoubleWorld AI** or **OpenCode** as the provider.
   - Use the mock API key `dw_test_working_key` or `opencode_test_working_key`.
   - The background queue will validate the keys as `Working`, query the available model lists, compile them into the **Models Catalog** tab, and allow you to submit playground test queries.
