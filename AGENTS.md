# LLM Agent Guidelines

This project is a slide generation tool called **Presa**. Slides can be generated with AI, edited manually and exported in various formats. Key features and technical details are already documented across multiple README files. This document summarizes the most important points for agents generating code or documentation.

## Running the project

- Install dependencies with `npm install`.
- Start development server with `npm run dev`.
- Build a production version using `npm run build` and run it with `npm run start`.
- Execute ESLint checks using `npm run lint` (or `npm run lint:fix` to automatically fix issues).
- Run tests with `npm test`.
- Prisma migrations reside in `prisma/migrations/` and can be applied with `npm run migrate`.

Node.js >=22 is required, as specified in `package.json`.

## Architecture overview

- **Frontend**: Next.js 15 and React 19 with TypeScript.
- **Styling**: Tailwind CSS and Chakra UI components.
- **Editor**: TipTap editor and drag&drop via `@dnd-kit`.
- **Database**: MongoDB accessed via Prisma ORM.
- **AI services**: integration with various LLM providers (GigaChat, YandexGPT and a Mock provider for tests).
- **Authentication**: NextAuth.
- **Other libraries**: Framer Motion animations, Zustand for state, Puppeteer + pdf-lib for PDF export.

Business logic includes: slide generation from documents, image generation, text summary, theme management, and PDF/PPTX export. Users purchase tokens via YooKassa or CloudPayments. Tokens are deducted when AI features are used. LLM requests are logged with a unique `requestId` which can be exported as MockGPT scenarios for testing.

## Token system

Token costs for different operations are defined in `README_TOKENS.md`. Middleware `withTokenDeduction` performs token deduction on the server side for every AI route. Agents adding new AI endpoints should reuse this middleware and update token calculators if necessary.

## Request logging and MockGPT

The system logs every LLM request grouped by `requestId` (see `LOGGING.md`). Analytics pages under `/tech-llm-analytics` allow viewing these logs and exporting them as MockGPT scenarios. Use the scripts from `TESTING.md` to list or activate test scenarios when reproducing formatting issues.

## Existing task

The memory bank currently tracks an unfinished task about PDF export with Puppeteer (`memory-bank/tasks.md`). The API route `/api/presentations/[id]/export/pdf/route.ts` and related React components already exist. Agents implementing further PDF features should build on that foundation and ensure tests from the mock scenarios still pass.

## Style conventions

Follow the guidelines from `CLAUDE.md`:

- Use strict TypeScript typing and absolute imports with the `@/` prefix.
- React components should be functional and typed with interfaces from `src/types`.
- Use PascalCase for components and camelCase for variables and props.
- Prefer returning fallback values instead of throwing whenever possible.

When touching code under `src/`, apply the same structure and naming. Group components by domain within `/src/components` and keep one component per file.

## Where to find more details

- `README.md` – project overview and run instructions.
- `README_TOKENS.md` – token system and middleware example.
- `LOGGING.md` – LLM request logging and MockGPT export.
- `YOOKASSA_SETUP.md` & `CLOUDPAYMENTS_SETUP.md` – payment integration guides.
- `TESTING.md` & `src/services/llm/mockGpt/README.md` – working with MockGPT scenarios.
- `DEPLOYMENT.md` – deployment steps and environment variables.

Agents should consult these documents before implementing new features.
