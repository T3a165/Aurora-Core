# Aurora Core — Installation Guide (v0.9.0-beta)

## Primary Method — Docker (Recommended)
Requirements:
- Docker Desktop 4+
- 4GB RAM free

### Steps
1. Clone the repo:
   git clone https://github.com/T3a165/Aurora-Core
2. Enter the directory:
   cd Aurora-Core
3. Start the stack:
   docker compose up --build

The system will:
- Build client + server
- Start MySQL
- Run migrations
- Seed demo data
- Start mock OAuth server

Access the app at:
http://localhost:5173

## Fallback Method — Local Dev
Requirements:
- Node 22
- pnpm
- MySQL 8

Steps:
pnpm install
pnpm dev

## Troubleshooting
- If MySQL fails: delete `/data/mysql` and restart.
- If migrations fail: run `pnpm db:push`.
- If client fails: clear `.next` or `node_modules`.