# 1. Distinguish Explicit Zero Hours from Empty Day Records

Date: 2026-08-31

## Status

Accepted

## Context

In source Google Sheets (`ETAS_data`, `ETAS_dataลจ`, and `สรุปOT`), days can contain:
1. Blank/empty cells (representing off-days, unworked days, or days without records).
2. Explicit `0.0` or `0` numeric entries (representing an attendance event or recorded zero-hour OT).
3. Positive numbers (e.g. `2.5`, `8.0`).

Previously, the backend API coerced all blank cells to numeric `0`, and the frontend component formatted all falsy values (`0`) as a hyphen `-`. This led to a discrepancy where workers with explicitly logged `0.0` in the sheet appeared as `-` on the dashboard, making it impossible to differentiate between an unworked blank day and an explicitly logged zero-hour day.

## Decision

1. **API Response Representation**:
   - Blank/empty cells in source Google Sheets are parsed as `null`.
   - Explicit numerical entries (including `0`, `0.0`, etc.) are parsed as `number` (e.g. `0`, `2.5`).
   - Daily sums and totals continue to treat `null` as `0` for summation purposes.

2. **Frontend UI Rendering**:
   - A day value of `null` or `undefined` renders as `-`.
   - A day value of `0` renders as `0`.
   - Non-zero numbers render formatted with standard locale formatting via `formatNumber(value)`.
   - This convention is enforced consistently across all OT and ETAS scan tables (both Employee and Contractor).

## Consequences

- Dashboard display precisely reflects source sheet semantics: users can distinguish recorded zero hours (`0`) from empty days (`-`).
- Totals and aggregations remain unaffected and accurate.
