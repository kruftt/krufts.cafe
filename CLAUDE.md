# CLAUDE.md - krufts.cafe

## Tech Stack
Tools:
- bun
- vite

Server:
- react router v7
- postgres
- zod
- prisma
- kysely
- trpc
- better-auth
  
Client:
- react
- jotai
- tailwindcss
- shadcn/ui
- lucide


## Structure
- app/ - application code
- app/atoms - jotai atoms
- app/components/ - react components
- app/components/ui - shadcn base components (unedited)
- app/hooks - react hooks
- app/lib - library-like modules
- app/routes - file-based routes
- app/schema - shared zod schemata
- app/services - service modules / functions
- app/utils - utility functions
- prisma - prisma schema + migrations
- prisma/generated - ORM client
- public - publicly hosted files


## Instructions
- Prefer to use bun/bunx commands. When running prisma commands/migrations we must include the --bun flag, e.g. `bunx --bun prisma migrate dev` and `bunx --bun prisma generate`
- Make sure to give up-to-date patterns and instructions for react router v7, not for previous versions.
- Use the newer @tanstack/react-query and @trpc/tanstack-react-query for trpc calls.