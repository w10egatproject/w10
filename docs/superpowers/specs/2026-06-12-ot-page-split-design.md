# OT Page Split Design

## Decision

Split OT into two user-facing pages: contractor OT remains at `/ot-summary`, and employee OT moves to a new `/ot-employee` page.

## Scope

The existing `/api/ot-summary` endpoint already returns employee and contractor datasets separately, so this change is limited to route structure, page rendering, and navigation labels.

## Routes

`/ot-summary` shows contractor OT only. It keeps the contractor group sections, contractor total section, and contractor error tables.

`/ot-employee` shows employee OT only. It uses the same employee table and error table patterns currently embedded in `/ot-summary`.

## Navigation

The page dropdown on the dashboard, purchasing page, contractor OT page, and employee OT page lists separate links for `สรุป OT ลูกจ้าง` and `สรุป OT พนักงาน`. The combined `สรุปโอทีลูกจ้างและพนักงาน` label is removed.

The dropdown should remain visually consistent with existing pages but use fixed positioning so it is not clipped by sticky headers or overflow containers.

## Data Flow

Both OT pages fetch `/api/ot-summary`. Each page renders only the data for its worker type.

## Verification

Add a lightweight route/menu test that fails before the split and passes once both routes and labels exist. Run lint and build after implementation.

## Addendum: Contractor ETAS Scan Data

The contractor OT page also shows contractor attendance scan data from spreadsheet `1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ`, tab `ETAS_dataลจ`.

The ETAS scan tables appear only on `/ot-summary`, inside each contractor OT section between the main OT table and the `Check OT Error` table. The all-contractors ETAS scan table appears inside the final all-contractors section between the final OT table and the final `Check OT Error` table. ETAS rows use the same contractor sequence grouping as the contractor OT table: W11 = 1, W12 = 2-7, W13 = 8-20, W14 = 21-29.

The user-facing label is `ข้อมูลสแกนลายนิ้วมือลูกจ้าง`; `ETAS_dataลจ` remains a source/tab name.
