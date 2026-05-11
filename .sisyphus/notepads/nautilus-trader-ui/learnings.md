# Learnings - NautilusTrader UI

## Build Fixes (2026-05-11)

### @material/web v1.5.1 quirks
- **No `navigationdrawer` top-level export**: Components moved to `labs/` subdirectory. Use `@material/web/labs/navigationdrawer/navigation-drawer.js`
- **No `top-app-bar` component**: v1.5.1 only has SCSS tokens, no JS component. Must use custom HTML/CSS header replacement
- **No `main`/`module`/`exports` in package.json**: Cannot be used in Vite `manualChunks`. Remove from chunk config; individual `.js` files are imported directly
- **Custom element JSX types**: Add to `src/material-web.d.ts` under `JSX.IntrinsicElements`. Each `<md-*>` tag needs explicit declaration
