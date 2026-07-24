# Home Menu Visibility Design

## Goal

Remove the redundant “หน้าหลัก” destination only while the user is already on
the home route (`/`).

## Behavior

- On `/`, the navigation menu shows the five non-home destinations.
- On every other route, the menu continues to show all six destinations.
- The current non-home route remains visible, highlighted with
  `aria-current="page"`, and non-navigable.
- Hover, click/touch, keyboard, focus, Escape, and page-specific theme behavior
  remain unchanged.

## Implementation

`NavigationMenu` will derive its visible destination list from `usePathname()`.
It will filter out only the `/` destination when the current pathname is `/`.
The canonical destination list remains centralized and unchanged.

## Verification

- Add a regression test proving `/` renders five destinations and omits
  “หน้าหลัก”.
- Keep route-contract coverage proving every non-home route renders six
  destinations and marks its current route as non-navigable.
- Run the complete navigation unit tests, route scripts, scoped ESLint, and
  production build before deployment.
