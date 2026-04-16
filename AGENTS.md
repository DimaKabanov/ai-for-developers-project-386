# AGENTS.md

Operational guide for coding agents working in this repository.

## Scope And Priority

- This file applies to the entire repository.
- If a direct user instruction conflicts with this file, follow the user.
- Keep changes minimal, focused, and consistent with existing patterns.

## Project Layout

- `frontend/`: React 19 + TypeScript + Vite + Mantine UI client.
- `backend/`: Ruby on Rails 7 API-only server (in-memory storage, no DB usage in app logic).
- `typespec/`: TypeSpec API contract source.
- `frontend/public/openapi.yaml`: generated OpenAPI used by frontend tooling/docs.
- `scripts/ui-smoke-playwright.mjs`: browser smoke scenario against real backend.

## Rules Files Check

- Checked for Cursor/Copilot repository rules:
  - `.cursor/rules/**`: not present
  - `.cursorrules`: not present
  - `.github/copilot-instructions.md`: not present
- No extra agent policy files are currently defined.

## Environment And Tooling

- Ruby is pinned in `.tool-versions` to `3.2.2`.
- Backend dependencies are managed by Bundler in `backend/`.
- Frontend/root dependencies are managed by npm.
- Prefer running commands from repository root unless noted.

## Build / Lint / Test / Run Commands

### Root Make Targets (preferred)

```bash
make install          # install root + frontend npm deps
make dev              # run frontend only on :5173
make backend-dev      # run Rails API only on :3000
make dev-all          # run frontend + backend together
make build            # frontend production build
make lint             # frontend ESLint
make lint-fix         # frontend ESLint autofix
make format           # frontend Prettier write
make format-check     # frontend Prettier check
make stylelint        # frontend CSS lint
make stylelint-fix    # frontend CSS lint autofix
make check            # lint + stylelint + format-check + build
make backend-install  # bundle install in backend
make backend-routes   # list Rails routes
make prism            # run Prism mock on :3001
make prism-stop       # stop Prism process
```

### Frontend Direct Commands

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run stylelint
npm run stylelint:fix
npm run check
```

### Backend Direct Commands

```bash
cd backend
bundle install
bundle exec rails server -p 3000
bundle exec rails routes
bundle exec rails runner 'puts :ok'
```

### Browser Smoke Test

Run against real backend/frontend:

```bash
node scripts/ui-smoke-playwright.mjs
```

If browsers are missing:

```bash
npx playwright install chromium
```

## Single-Test Guidance

Current state:

- There is no established frontend unit test runner yet.
- Backend test framework gems are not set up for a maintained suite.

If backend tests are added later via Rails Minitest, run one test file or one test case with:

```bash
cd backend
bundle exec rails test test/path/to/some_test.rb
bundle exec rails test test/path/to/some_test.rb:42
```

If frontend tests are added later (for example Vitest), add and document a single-test command in this file.

## API Contract Workflow

- Source of truth: `typespec/*.tsp`.
- When API changes, update TypeSpec first.
- Regenerate OpenAPI and sync to frontend:

```bash
cd typespec
npx tsp compile "main.tsp" --emit "@typespec/openapi3" --option "@typespec/openapi3.output-file=../frontend/public/openapi.yaml"
cp "tsp-output/@typespec/frontend/public/openapi.yaml" "../frontend/public/openapi.yaml"
rm -rf "tsp-output"
```

## Code Style Guidelines

### General

- Use ASCII by default; avoid unnecessary Unicode in code.
- Keep diffs small; do not refactor unrelated code.
- Avoid adding comments unless logic is non-obvious.
- Prefer explicit, readable code over clever one-liners.

### TypeScript / React

- Strict typing is enabled; do not bypass with `any` unless unavoidable.
- Use `import type { ... }` for type-only imports.
- Follow existing import grouping:
  1) React/router
  2) third-party libs
  3) local modules
  4) CSS modules
- Use functional components and hooks.
- Component names: PascalCase (`BookingConfirmationPage`).
- Variables/functions: camelCase (`fetchUpcomingBookings`).
- Keep API DTO keys aligned with backend contract.
- Handle async failures with `try/catch` and show UI feedback (not only console output).

### CSS / UI

- Prefer Mantine components and tokens before custom styling.
- Use CSS Modules (`*.module.css`) for page-scoped styles.
- Reuse existing style patterns in `frontend/src/pages/*`.

### Ruby / Rails

- Backend is API-only; return JSON consistently.
- Implement business rules in services/controllers, not views (there are no views).
- Keep controllers thin where possible.
- Use strong parameters (`params.permit(...)`).
- Return contract-aligned HTTP statuses and error shapes.
- Preserve in-memory behavior (data reset after restart is expected).

## Business Rules That Must Stay Intact

- Booking window: next 14 days.
- Working hours for slot grid: `09:00-18:00` UTC.
- Slot step equals event type duration.
- No overlapping bookings across all event types.
- Conflict on occupied time returns `409` with `SLOT_ALREADY_BOOKED`.

## Validation And Error Handling

- Validate input at API boundaries.
- For validation errors return `422` with:
  - `code: "VALIDATION_ERROR"`
  - `message`
  - `details: string[]`
- For not-found event type return `404 EVENT_TYPE_NOT_FOUND`.
- For duplicate event type ID return `409 EVENT_TYPE_ID_CONFLICT`.

## Agent Change Checklist

Before finishing:

1. Run relevant checks (`make check`, backend route/runner smoke, or targeted command).
2. If API changed, regenerate `frontend/public/openapi.yaml` from TypeSpec.
3. Run browser smoke for booking/admin critical paths when UI or API behavior changed.
4. Verify no accidental port conflicts (`backend:3000`, `frontend:5173`, `prism:3001`).
5. Keep commits focused and message in conventional style (`feat:`, `fix:`, `chore:`).
