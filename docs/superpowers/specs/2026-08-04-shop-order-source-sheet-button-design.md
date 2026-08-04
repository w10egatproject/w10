# Shop Order Source Sheet Button Design

## Goal

Add a direct, discoverable link from the Shop Order page to the supplied Google Sheet without changing existing Shop Order data-loading or mutation flows.

## User Experience

- Add an action labeled `เปิด Google Sheet` to the Shop Order filter toolbar.
- Place the action beside the existing `เพิ่ม` button so related page-level actions stay together.
- Use a spreadsheet icon and the toolbar's existing sizing, typography, focus, hover, and responsive wrapping patterns.
- Open the supplied sheet in a new browser tab:
  `https://docs.google.com/spreadsheets/d/1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco/edit?gid=0#gid=0`
- Use `rel="noopener noreferrer"` to isolate the new tab and avoid sending referrer information.

## Implementation Boundary

- Change `ShopOrderToolbar` only as needed to render the external link.
- Do not add client state, routing logic, API calls, or new dependencies.
- Do not alter filters, refresh, create-order behavior, data fetching, or dialogs.

## Accessibility and Responsive Behavior

- Render a semantic anchor because the action navigates to an external resource.
- Keep the visible Thai label available as the accessible name.
- Preserve keyboard focus visibility.
- Allow the existing toolbar action container to wrap naturally on narrow screens.

## Testing

Add an integration assertion to the existing Shop Order dashboard test suite that verifies:

- the link is discoverable by its accessible name;
- the exact Google Sheet URL is used;
- the link opens in a new tab; and
- `noopener noreferrer` is present.

Run the focused test first and confirm it fails because the link is absent. After implementation, run the focused test, the complete unit suite, lint, and the production build.
