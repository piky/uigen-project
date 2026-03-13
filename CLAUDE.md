# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language via a chat interface, and Claude generates React code displayed in a real-time preview with hot reload.

## Common Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests with Vitest
npm run setup    # Install deps + generate Prisma client + run migrations
npm run db:reset # Reset the database
```

Run a single test: `npx vitest run <test-file>`

## Architecture

### Data Model (Prisma/SQLite)
Schema defined in `prisma/schema.prisma`. Key models:
- **User**: Authenticated users with email/password, can own multiple projects
- **Project**: Contains chat messages (JSON), file system data (JSON), owned by optional userId

### Key Directories
- `src/app` - Next.js App Router pages and API routes
- `src/components` - React components (ui/*, chat/*, editor/*, preview/*, auth/*)
- `src/lib` - Core logic:
  - `file-system.ts` - Virtual in-memory file system for generated components
  - `auth.ts` - JWT-based authentication
  - `prompts/` - AI prompt templates for component generation
  - `tools/` - File manager and string replacement utilities
  - `transform/` - JSX transformation for browser execution
  - `contexts/` - React contexts (file-system, chat)
- `src/actions` - Next.js Server Actions for project CRUD

### Request Flow
1. User sends message in ChatInterface
2. `/api/chat` route receives message with project context
3. Claude AI generates React component code
4. Code is stored in virtual file system (not disk)
5. Preview component renders code via iframe with live reload
6. CodeEditor allows viewing/editing generated files

## Development Best Practices

- Use comments sparingly. Only comment complex code.