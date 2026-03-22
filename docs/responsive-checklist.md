# Responsive UI Checklist

Use this checklist for every new page, dialog, and data view.

## Dialogs and Modals

- Use `DialogHeader` + `DialogBody` (+ `DialogFooter` when actions exist) to keep one scroll surface.
- Avoid local `max-h-[90vh]` overrides; rely on shared dialog primitives unless a specific case requires it.
- For heavy flows on small screens, prefer stacked controls and full-width primary actions.
- Make action groups mobile-safe with `flex-col sm:flex-row` (or `flex-col-reverse sm:flex-row` for cancel/confirm).

## Forms and Filter Rows

- Default paired fields to `grid-cols-1 sm:grid-cols-2`.
- Avoid fixed widths in mobile contexts; prefer `w-full sm:w-[...]`.
- Prevent flex overflow with `min-w-0` on shrinking children and `flex-wrap` where content can grow.

## Tables and Dense Content

- Keep wide tables inside horizontal scroll containers.
- Use `wrapCells` in `Table` when content readability matters more than strict single-line cells.
- Consider card/list fallback for the most important mobile data views.

## Tabs, Popovers, and Selects

- Do not generate Tailwind classes dynamically (e.g. ``grid-cols-${n}``); use explicit classes.
- For tab groups on mobile, reduce columns or allow horizontal scrolling.
- Ensure popovers and command lists have viewport-safe max width/height.

## Viewport and Height Rules

- Prefer `dvh/svh` over legacy `vh` for viewport-dependent heights.
- Avoid fragile `calc(100vh - Xrem)` patterns; use bounded values (for example `clamp(...)`).
- Keep a single vertical scroll owner per screen section to avoid nested-scroll conflicts.

## Manual QA Quick Pass

Verify at least these widths: `320`, `360`, `390`, and `430`.

For each major flow, confirm:

- No horizontal page overflow.
- Dialog content and footer remain reachable with keyboard open.
- Long labels and localized text wrap safely.
- Primary actions remain visible and tappable.
