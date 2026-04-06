<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Shared Context

- Persistent project context lives in `PROJECT_CONTEXT.md`.
- Before making important changes, read `PROJECT_CONTEXT.md` together with `AGENTS.md`.
- Do not rely on chat history as the only source of project state or decisions.

## Git Workflow

- This project is used across Windows and MacBook with GitHub as the sync source.
- At the start of a work session inside the repository, use `startproj` to run `git pull --rebase`.
- At the end of a work session inside the repository, use `endproj` to review changes, confirm commit, enter a commit message, and run `git push`.
- These helpers are convenience wrappers, not a replacement for careful git usage.
