# Project Architectural Rules & Guardrails for React Projects

## Core Tech Stack
- **Framework:** React
- **Build Tool:** Vite
- **Language:** JavaScript (Strictly NO TypeScript. Use `.js` and `.jsx` extensions only).
- **Package Manager:** pnpm (Always use `pnpm` for installs, project creation, and scripts).

## Dependency Management
- Always use `pnpm` for new dependencies.
- Never suggest `npm` or `yarn` commands.

## Coding Standards
- Use Functional Components and Hooks.
- Prefer arrow functions for components and logic.
- Keep logic inside `/src`. Static assets should live in `/public` if they are to be fetched as static files.

## Testing
- Always ask the user to test any changes themselves