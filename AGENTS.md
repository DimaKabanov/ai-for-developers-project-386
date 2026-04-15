# AGENTS.md - Guidelines for AI Coding Agents

This document provides essential information for AI coding agents working in this repository.

## Project Overview

This is a **Calendar Booking** application - a React/TypeScript SPA for booking calendar events with:
- **Frontend**: React 19 + Vite + TypeScript + Mantine UI
- **Spec**: TypeSpec for OpenAPI schema
- **Mock Server**: Prism for API mocking

## Build/Lint/Test Commands

Run all commands from the repository root:

```bash
# Development
make dev              # Start Vite dev server (localhost:5173)
make prism            # Start Prism mock server (localhost:3000)

# Build
make build            # Production build (runs tsc + vite build)
cd frontend && npm run build  # Alternative

# Linting & Formatting
make lint             # ESLint check
make lint-fix         # ESLint with auto-fix
cd frontend && npm run lint  # Run ESLint directly

make format           # Format with Prettier
cd frontend && npm run format  # Format directly

make format-check     # Check Prettier formatting
make stylelint        # CSS linting
make stylelint-fix    # CSS auto-fix

# Quality check
make check            # Full check: lint + stylelint + format-check + build

# Maintenance
make install          # Install deps for root + frontend
make clean            # Clean node_modules and dist
```

**Note**: There are no unit tests in this project. Manual testing is done via `make dev` + `make prism`.

## Code Style Guidelines

### TypeScript/JavaScript

- **Target**: ES2020 with strict mode enabled
- **Imports**: Use `type` keyword for type-only imports: `import type { Foo } from './types'`
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: ES5 style (required)
- **Indent**: 2 spaces, no tabs
- **Line endings**: LF (Unix)
- **Print width**: 100 characters
- **Arrow functions**: Avoid parens for single params: `x => x + 1`

### Naming Conventions

- **Components**: PascalCase (e.g., `BookingPage`, `AppShellLayout`)
- **Interfaces/Types**: PascalCase (e.g., `EventType`, `BookingStatus`)
- **Functions/Variables**: camelCase (e.g., `fetchEventTypes`, `useBookingStore`)
- **Files**: PascalCase for components, camelCase for utilities
- **CSS Modules**: `*.module.css` with camelCase class names

### React Patterns

- Use functional components with hooks
- Props interfaces named with `Props` suffix: `AppShellLayoutProps`
- Hooks from `@mantine/hooks` for common patterns
- State management via Zustand stores (see `src/store/`)
- React Router v7 for routing
- Use Mantine UI components exclusively
- Import Mantine styles: `import '@mantine/core/styles.css'`

### Import Order (follow existing patterns)

```tsx
// 1. React/Node builtins
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { Container, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';

// 3. Absolute imports from project
import { apiClient } from '../api/client';
import type { EventType } from '../types/api';

// 4. Relative imports
import { useBookingStore } from '../store/bookingStore';
```

### CSS/Style Guidelines

- Use **CSS Modules** for component styles (`*.module.css`)
- Use Mantine CSS variables: `var(--mantine-color-blue-6)`
- Vendor prefixes are allowed (configured in stylelint)
- Class naming: camelCase (e.g., `.eventTypeCard`, `.ownerAvatar`)

### Error Handling

- Use `try/catch` for async operations
- Store error state in component state
- Display errors with Mantine `<Alert>` component
- API client throws descriptive errors with HTTP status codes

### TypeScript Strict Rules

- `noUnusedLocals: true` - All variables must be used
- `noUnusedParameters: true` - All parameters must be used  
- `strict: true` - Full strict mode
- Always define return types for exported functions

### File Structure

```
frontend/src/
├── api/          # API client functions
├── pages/        # Route components (PascalCase)
├── store/        # Zustand stores
├── types/        # TypeScript interfaces
├── App.tsx       # Root component
├── router.tsx    # Route definitions
└── main.tsx      # Entry point
```

### Pre-Commit Checklist

Before submitting changes:
1. Run `make check` to verify everything passes
2. Ensure TypeScript compiles without errors
3. Follow existing component patterns
4. Use Mantine UI components (don't create custom UI)
5. Add JSDoc comments for public API functions

### API Client Pattern

```ts
export const apiClient = {
  async fetchData(): Promise<DataType> {
    const response = await fetch(`${API_BASE_URL}/endpoint`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    return response.json();
  },
};
```
