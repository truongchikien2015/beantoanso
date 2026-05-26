<!-- SPECKIT START -->
For additional context about technologies, project structure, shell commands, and other important information, see:

- `SPEC.md` — Full project specification (pages, components, data models, API, tech stack, database schema)
- `.specify/memory/constitution.md` — Project constitution (7 core principles)
- `specs/` — Feature-specific specs and plans

Active features in progress:
- `specs/028-student-ux-elementary/` — Child-friendly student UI redesign (playful colors, larger buttons, animations)

Quick reference:
- Tech stack: Next.js 16 + TypeScript 6 (strict) + Zustand + localStorage + Supabase
- UI: Tailwind CSS v4 + MUI v7 + Radix UI
- Vietnamese-first: all user-facing text must be in Vietnamese
- All components: business logic in `src/lib/`, UI in `src/components/`
- localStorage keys: `bats:` prefix convention
- AI: Grok/OpenRouter via `/api/grok/` routes
- Admin auth: `be_an_toan_so_admin`, `NEXT_PUBLIC_ADMIN_PASSWORD`
<!-- SPECKIT END -->
