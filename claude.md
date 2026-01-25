# Claude Code Guidelines for Singles Infernal Ranking App

## Project Context
Mobile-first PWA for ranking things with drag-and-drop. Hand-drawn aesthetic. Target: iPhone 14 Pro Max.

## CRITICAL: Use Beads for Task Tracking
**Always use `beads` (bd) for ALL task management.** This is a distributed, git-backed issue tracker for AI agents.

### Beads Workflow
1. **Before starting work**: `bd ready` - see tasks with no blockers
2. **Creating tasks**: `bd create "task description"` - for new work items
3. **Subtasks**: Use hierarchical IDs (e.g., `bd-a3f8.1`, `bd-a3f8.2`)
4. **Dependencies**: `bd dep add <task> <blocker>` - track what blocks what
5. **Completing**: `bd close <task>` - when done

### When to Create Beads
- Each feature from spec.md
- Each TDD cycle (test → impl → refactor can be subtasks)
- Each bug discovered
- Each refactor identified

**Do NOT use informal markdown task lists. Use beads.**

## CRITICAL: UI Work
**Always invoke the `frontend-design` skill when doing ANY UI-related work**, including:
- Creating or editing components
- Writing JSX/TSX with visual elements
- Styling with Tailwind
- Implementing animations
- Building layouts
- Designing interactions

This ensures the hand-drawn design system is applied correctly.

## Tech Stack (Do Not Deviate)
- **Framework**: Vite + React 18 + **TypeScript** (strict mode)
- **Styling**: Tailwind CSS only (no CSS modules, no styled-components)
- **Animation**: Framer Motion (no other animation libraries)
- **Storage**: IndexedDB (images) + localStorage (data)
- **Deployment**: GitHub Pages (static SPA)
- **Unit/Component Testing**: Vitest + React Testing Library
- **E2E Testing**: agent-browser (Playwright MCP)

### TypeScript Rules
- **Always use TypeScript** - no `.js` or `.jsx` files
- Enable `strict: true` in tsconfig
- No `any` types - use `unknown` and narrow, or define proper types
- All function parameters and return types must be typed
- Use interfaces for object shapes, types for unions/primitives

## Code Style Rules

### General
- Use functional components with hooks only
- Prefer named exports over default exports
- Use `const` arrow functions for components: `export const Button = () => {}`
- Keep components under 150 lines; split if larger
- No `any` types - be explicit with TypeScript

### File Naming
- Components: `PascalCase.tsx` (e.g., `RankCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useBoards.ts`)
- Utilities: `camelCase.ts` (e.g., `imageUtils.ts`)
- Types: colocate in same file or `types.ts` if shared

### Tailwind
- Use Tailwind classes directly, avoid `@apply` in CSS
- Custom values via arbitrary syntax: `w-[430px]`, `shadow-[4px_4px_0px_0px_#2d2d2d]`
- Wobbly borders MUST use inline `style={{ borderRadius: '...' }}` - never standard `rounded-*`

### Components
- Props interface named `{ComponentName}Props`
- Destructure props in function signature
- Keep styling in className, logic in hooks

```tsx
// Good
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ children, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 border-[3px] border-[#2d2d2d]"
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
    >
      {children}
    </button>
  );
};
```

## Design System Enforcement

### Colors (use these exact values)
```
--background: #fdfbf7
--foreground: #2d2d2d
--muted: #e5e0d8
--accent: #ff4d4d
--secondary: #2d5da1
```

### Shadows (hard offset only, NEVER blur)
```
Standard: shadow-[4px_4px_0px_0px_#2d2d2d]
Hover: shadow-[2px_2px_0px_0px_#2d2d2d]
Lifted: shadow-[8px_8px_0px_0px_#2d2d2d]
```

### Borders
- Minimum `border-2`
- Always `border-[#2d2d2d]`
- Wobbly radius required on all containers/buttons/cards

### Fonts
- Headings: `font-['Kalam']`
- Body: `font-['Patrick_Hand']`

## Do NOT
- Add blur to shadows
- Use standard Tailwind `rounded-*` classes on visible elements
- Use pure black `#000000` - always use `#2d2d2d`
- Create new color variables without asking
- Add libraries not in the tech stack
- Over-engineer (no abstractions for single-use code)
- Add features not in spec.md

## Spec Maintenance - MANDATORY
**Always keep `spec.md` in sync with requirements.**

### Update spec.md when:
- New requirements are added by the user
- Existing requirements are changed or clarified
- Implementation reveals spec gaps or ambiguities
- Scope changes (features added/removed)
- Technical decisions change (e.g., different library)

### How to update:
1. Edit the relevant section in `spec.md`
2. Add `[UPDATED]` marker with date if significant change
3. Commit spec change atomically: `docs: update spec - <what changed>`

**The spec is the source of truth. If code differs from spec, either fix the code or update the spec.**

## Do
- Reference spec.md for requirements
- Use Framer Motion for all animations
- Test on 430px width (iPhone 14 Pro Max)
- Keep the hand-drawn aesthetic consistent
- Ask if requirements are unclear

## Git Commits

### Atomic Commits - ALWAYS
**Make small, atomic commits frequently.** Each commit should:
- Do ONE thing only
- Be self-contained and not break the build
- Have a clear, descriptive message

### Commit Often
- After each passing test (TDD green phase)
- After each refactor
- After completing a single component
- After adding a single feature
- After fixing a single bug

### Commit Message Format
```
<type>: <short description>

[optional body with details]
```

Types: `feat`, `fix`, `test`, `refactor`, `style`, `docs`, `chore`

### Examples
```
test: add failing test for RankCard drag handle
feat: implement RankCard drag handle
refactor: extract wobbly border styles to constant
fix: correct rank badge z-index during drag
```

**Do NOT batch multiple changes into one commit.**

## Versioning - MANDATORY

**Always update the version when making releases or significant changes.**

### Semantic Versioning (SemVer)
This project uses semantic versioning: `MAJOR.MINOR.PATCH`
- **PATCH** (0.1.0 → 0.1.1): Bug fixes, minor tweaks
- **MINOR** (0.1.0 → 0.2.0): New features, backwards-compatible
- **MAJOR** (0.1.0 → 1.0.0): Breaking changes

### How to Update Version
Use npm scripts (version auto-injects into app via Vite):
```bash
npm run version:patch  # Bug fixes
npm run version:minor  # New features
npm run version:major  # Breaking changes
```

### When to Bump Version
- **Before deploying**: Always bump version before `git push` to main if releasing
- **After significant features**: Bump minor version after completing a feature
- **After bug fixes**: Bump patch version after fixing bugs
- **User-visible changes**: If users will notice the change, bump the version

### Version Display
The version is automatically injected from `package.json` into the app via Vite's `define` config. It displays in the Settings page footer.

### Commit Format for Releases
```bash
npm run version:patch
git add package.json
git commit -m "chore: bump version to X.Y.Z"
```

## File Structure (follow this)
```
src/
├── components/
│   ├── ui/          # Reusable primitives
│   └── ...          # Feature components
├── pages/           # Route-level components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── styles/          # Design tokens, wobbly presets
└── data/            # Seed data, constants
```

## Testing

### TDD (Test-Driven Development) - MANDATORY
**Always follow TDD when developing.** The workflow is:
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up while keeping tests green

Apply TDD to:
- Unit tests for hooks and utilities (Vitest)
- Component tests for UI behavior (Vitest + React Testing Library)
- E2E tests for user flows (agent-browser/Playwright)

**Never write implementation code without a test first.**

### E2E Testing
**Always use `agent-browser` (Playwright MCP) for end-to-end testing.** This includes:
- Visual verification of UI components
- Testing drag-and-drop interactions
- Verifying animations render correctly
- Checking responsive behavior at 430px width
- Testing PWA functionality

### Test Process Cleanup - IMPORTANT
Vitest workers can become orphaned and consume significant memory (5-8GB each). The test scripts now auto-cleanup before running, but:

**If tests are interrupted or your machine is slow:**
```bash
bun run test:clean  # Kill all orphaned vitest processes
```

**At end of session or if machine is laggy:**
```bash
pkill -f vitest  # Quick cleanup of any vitest processes
```

**Do NOT leave vitest watch mode running** - always use `Ctrl+C` to properly terminate, or use `bun run test:run` for single-run mode.

### Checklist Before Committing
- [ ] No TypeScript errors
- [ ] Renders correctly at 430px width (verify with agent-browser)
- [ ] Animations are smooth (60fps)
- [ ] Hand-drawn aesthetic maintained
- [ ] No console errors
