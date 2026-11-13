# Architecture Notes

## Current architecture

The project is a client-side single-page application built with React and TypeScript. Vite serves the development app and produces the static `dist/` build.

```text
src/
├── App.tsx       Application shell, navigation, screens, forms and interactions
├── data.ts       Fictional demo dataset and reset factory
├── main.tsx      React entry point
├── styles.css    Design tokens, layout, components and responsive breakpoints
├── types.ts      Shared TypeScript domain types
└── utils.ts      Formatting, validation, local persistence and export helpers
```

## State flow

- The root component owns the demo domain state.
- State changes are applied through React state updates.
- The app validates and stores demo data in `localStorage` under `burger-crm-data-v2`.
- The selected appearance is stored separately under `burger-crm-theme-v2`.
- If the browser blocks storage or stored data is malformed, the app falls back to the in-memory demo dataset and displays a warning in Settings.
- CSV and JSON exports are generated in the browser. CSV values are escaped and formula-leading input is neutralized.

## Design principles

- Keep frequent actions visible and forms short.
- Use natural Russian copy throughout the product interface.
- Prefer a focused page over a wide spreadsheet.
- Preserve keyboard focus, accessible control labels, and responsive layouts.
- Keep fictional data separate from any future production integration.

## Production boundary

This prototype is not a multi-user application. `localStorage` is not secure storage and does not provide access control, backups, synchronization, or server-side validation. A production version should introduce an authenticated API, a database, role-based authorization, audit events, input validation on the server, and a documented retention policy before storing real guest information.
