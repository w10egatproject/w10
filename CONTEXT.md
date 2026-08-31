# W10 Dashboard

Operational dashboard for W10 maintenance work, procurement work, and overtime summaries.

## Language

**Employee**:
A permanent EGAT staff member whose overtime is tracked separately from contractors.
_Avoid_: Staff, พนง

**Contractor**:
A non-employee worker whose overtime is tracked on the contractor OT sheet.
_Avoid_: ลูกจ้าง, จ้างเหมา

**OT Summary**:
A monthly overtime view for one worker type, grouped by W11, W12, W13, and W14.
_Avoid_: Combined OT page

**ETAS Scan Data**:
Attendance scan data used as a supporting table beside overtime totals for a single worker type.
_Avoid_: ETAS_data, ETAS_dataลจ, or any sheet tab name as a display term

**Explicit Zero Hours**:
An overtime or attendance value explicitly recorded as 0 (e.g. 0.0 or 0) in the source sheet, representing an attendance or zero-hour record that renders as `0`.
_Avoid_: Converting 0 to null or empty dash `-`

**Empty Day Record**:
A day with no record or blank cell in the source sheet, representing an unworked or unrecorded day that renders as `-`.
_Avoid_: Converting empty cells to 0 in display tables
