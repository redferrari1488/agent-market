<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Shared Context

- Persistent project context lives in `docs/PROJECT_CONTEXT.md`.
- Detailed specs are in `instructions/` modules — load the relevant one per task.
- Lessons and past mistakes in `docs/lessons.md` and in Lessons sections of each instruction module.
- Do not rely on chat history as the only source of project state or decisions.

## Git Workflow

- This project is used across Windows and MacBook with GitHub as the sync source.
- At the start of a work session inside the repository, use `startproj` to run `git pull --rebase`.
- At the end of a work session inside the repository, use `endproj` to review changes, confirm commit, enter a commit message, and run `git push`.
- These helpers are convenience wrappers, not a replacement for careful git usage.

## Commit And Push Policy

- After completing a meaningful repository change, commit and push by default unless the user explicitly asks not to.
- If project context, assumptions, priorities, workflow, or next steps changed, update `docs/PROJECT_CONTEXT.md` in the same change set before committing.
- Do not leave important context changes only in chat history.
- Avoid noisy commits for empty or insignificant changes.
