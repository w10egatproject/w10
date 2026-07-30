
# Implementation Plan: ปรับปรุง EGAT W10 Operations Console UI

> **สำหรับผู้ดำเนินงาน:** ต้องใช้ superpowers:subagent-driven-development หรือ superpowers:executing-plans เพื่อทำตามแผนทีละ task โดยใช้ checkbox ติดตามงาน ห้ามเริ่ม implementation จนกว่าแผนนี้จะได้รับอนุมัติ

**เป้าหมาย:** ย้ายทั้ง 7 route ของ W10 ไปใช้ shell กลางสไตล์ EGAT Operations Console ซึ่งมี desktop sidebar และ mobile drawer โดยรักษาพฤติกรรมเดิมของ KPI, filter, chart, table, data fetching, Google Sheets และการแยกข้อมูลพนักงาน/ผู้รับเหมา

**สถาปัตยกรรม:** เพิ่ม shell ขนาดเล็กที่ root layout และเปิดใช้ผ่าน route gate เฉพาะ route ที่ย้ายแล้ว route ที่ยังไม่ย้ายจะแสดง children เดิมโดยไม่เปลี่ยนแปลง route ที่ย้ายแล้วจะใช้ AppShell และ PageHeader ของ route เอง ส่วน data fetching และ business mapping ยังคงอยู่ใน component เดิม ใช้ legacy/console chrome adapter เพื่อให้แต่ละ route rollback ได้

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Framer Motion 12.40.0 ที่ติดตั้งอยู่แล้ว, Lucide React, Highcharts, Recharts, Vitest 4.1.10, Testing Library และ Vercel

## ข้อจำกัดร่วม

- ใช้ตัวเลือก B: desktop sidebar และ mobile drawer โดยคงลำดับ KPI/chart/table เดิม
- ใน phase AppShell และ pilot ห้ามแก้ API routes, Google Sheets integration, สูตรคำนวณ, data normalization, refresh semantics, no-store, force-dynamic หรือการแยกข้อมูลพนักงาน/ผู้รับเหมา
- ยังไม่เปิด Cache Components, ยังไม่เปลี่ยน no-store หรือ force-dynamic และยังไม่อัปเกรด Next.js ใน phase AppShell หรือ pilot
- ยังไม่เพิ่ม Magic UI component ในช่วง AppShell migration ให้เพิ่ม motion หลังทั้ง 7 route ผ่านการตรวจ behavior แล้ว
- คง NavigationMenu และ test เดิมไว้จนกว่าทุก route จะย้ายเสร็จและมี coverage ที่เทียบเท่า
- ห้ามเพิ่ม dependency ขนาดใหญ่, state-management library, authentication, schema change หรือ route ใหม่
- ห้ามแก้ lint baseline เดิมทั้งหมด ให้แก้เฉพาะ error ใหม่หรือ error ในไฟล์ที่ task นั้นแก้ และรายงาน baseline แยกต่างหาก
- คง URL ของ route ภายในเดิม: /, /purchasing, /purchasing-all, /beml-inventory, /ot-summary, /ot-employee และ /shop-order
- คงคำศัพท์งานภาษาไทยและ Google Sheet links เดิม
- ทุก interactive component ใหม่ต้องรองรับ default, hover, focus-visible, pressed, disabled ตามความเหมาะสม รวมถึง keyboard และ reduced motion
- เอกสารนี้เป็น implementation plan เท่านั้น การเขียนแผนนี้ไม่แก้ source code, config, dependency, API หรือ data behavior

---

## สรุป Repository Audit

- ใช้ App Router ใต้โฟลเดอร์ app
- มี shared layout เพียง app/layout.tsx ไม่มี route loading.tsx และมี error boundary เฉพาะ app/shop-order/error.tsx
- NavigationMenu.tsx เป็น client dropdown ขนาด 271 บรรทัด ใช้ next/link และ usePathname ยังไม่มี desktop sidebar หรือ mobile drawer
- หน้า client หลักมีขนาดใหญ่: app/page.tsx 588 บรรทัด, app/purchasing/page.tsx 824, app/beml-inventory/page.tsx 929 และ app/ot-summary/page.tsx 800
- app/purchasing-all/page.tsx ใช้ PurchasingPageContent ร่วมกับ purchasing ส่วน app/ot-employee/page.tsx ใช้ OtSummaryContent ร่วมกับ ot-summary
- Home และ purchasing dynamic import Highcharts/SpeedometerClient ส่วน ShopOrderSummary ใช้ Recharts
- Page ต่าง ๆ ใช้ fetch แบบ no-store และ API routes ใช้ force-dynamic หรือ force-no-store Google Sheets access อยู่ฝั่ง server ใน lib/googleSheet.ts
- ยังไม่มี Magic UI หรือ shadcn/ui แต่มี Framer Motion อยู่แล้ว
- ไม่พบ router.prefetch แบบ explicit และ internal links ใช้ Link behavior ปกติ
- Next.js ที่ resolve จริงคือ 16.2.12 และ bundled docs ยังไม่มี Partial Prefetching adoption guide
- Baseline: npm run test:unit ผ่าน 15 files และ 223 tests; npm run build ผ่าน; npm run lint เดิมไม่ผ่านที่ 144 errors และ 10 warnings
- working tree สะอาดหลังตรวจ baseline

## ลำดับการย้าย route

| ลำดับ | Route | เหตุผล |
| ---: | --- | --- |
| 1 pilot | /ot-employee | เป็น wrapper บางรอบ OT content, ไม่มี chart library และทดสอบ shell, PageHeader, refresh, source-sheet links, tables, drawer และ responsive behavior ได้ |
| 2 | /ot-summary | ใช้ content เดียวกันกับ contractor เพื่อตรวจ sibling route และการแยกพนักงาน/ผู้รับเหมา |
| 3 | /beml-inventory | มี inventory tables และ filters หนาแน่น แต่ไม่ใช้ implementation purchasing ร่วม |
| 4 | /purchasing-all | เป็น fixed-filter wrapper ใช้ทดสอบ purchasing compatibility ที่มี state จำกัดกว่า |
| 5 | /purchasing | เพิ่ม year/month filters, gauges, clickable charts, search และ table filtering |
| 6 | / | มี gauges, charts หลายชุด, KPI cards, localStorage filters และ auto-refresh |
| 7 | /shop-order | มี CRUD, upload, dialogs, attachments, Recharts และ repository-backed APIs จึงมีความเสี่ยงสูงสุดและย้ายท้ายสุด |

## รายการไฟล์ที่ล็อกไว้

### ไฟล์ใหม่

- components/navigation/navigationDestinations.ts: metadata ของ destination กลาง ใช้ทั้ง dropdown เดิมและ shell ใหม่
- components/layout/shellRoutes.ts: allowlist ของ route ที่ย้ายแล้ว เริ่มต้นที่ /ot-employee
- components/layout/ShellMigrationGate.tsx: gate ตาม pathname ซึ่งคง children เดิมสำหรับ route ที่ยังไม่ย้าย
- components/layout/AppShell.tsx: shell frame ที่ไม่ทำ data fetching
- components/layout/Sidebar.tsx และ SidebarNavItem.tsx: desktop navigation
- components/layout/MobileTopBar.tsx และ MobileNavigationDrawer.tsx: mobile navigation และ focus behavior
- components/layout/PageHeader.tsx: title, description, sync status, route-owned filters, refresh และ actions
- components/layout/RouteChromeAdapter.tsx: branch แบบ legacy/console
- components/layout/LegacyNavigationAdapter.tsx: wrapper ชั่วคราวเพื่อคง props ของ NavigationMenu
- components/layout/AppShell.test.tsx, Sidebar.test.tsx, MobileNavigationDrawer.test.tsx, PageHeader.test.tsx, shellRoutes.test.ts และ AppShell.integration.test.tsx
- หลัง layout เสถียรแล้วจึงสร้าง components/ui/magic/NumberTicker.tsx, BorderBeam.tsx, ShimmerButton.tsx, BlurFade.tsx และ tests ของแต่ละตัว

### ไฟล์เดิมที่อนุญาตให้แก้ใน phase ต่อไป

- app/layout.tsx: เพิ่ม ShellMigrationGate ครอบ children เท่านั้น
- app/globals.css: semantic EGAT tokens, focus ring และ reduced-motion fallback
- components/navigation/NavigationMenu.tsx และ tests: ใช้ destination source กลางและคง behavior เดิม
- app/ot-summary/page.tsx และ app/ot-employee/page.tsx: pilot chrome adapter
- app/beml-inventory/page.tsx: route chrome หลัง pilot ผ่าน
- app/purchasing/page.tsx และ app/purchasing-all/page.tsx: shared purchasing chrome mode
- app/page.tsx: home chrome mode
- app/shop-order/page.tsx, components/shop-order/ShopOrderDashboard.tsx และ app/shop-order/error.tsx: route chrome ช่วงท้าย

### ไฟล์ที่ห้ามแตะใน phase AppShell และ pilot

- app/api/**
- lib/googleSheet.ts
- lib/shop-order/**
- components/charts/**
- components/shop-order/** ยกเว้น task Shop Order ที่ระบุภายหลัง
- package.json, package-lock.json, next.config.ts
- .env.example, .env.local, vercel.json
- scratch/**
- Google Sheet URLs, formulas, sheet names, source ranges, fetch URLs และ API response shapes

## Interfaces ที่ใช้ร่วมกัน

~~~ts
export type ConsoleRoute =
  | '/'
  | '/purchasing'
  | '/purchasing-all'
  | '/beml-inventory'
  | '/ot-summary'
  | '/ot-employee'
  | '/shop-order';

export const consoleRoutes: readonly ConsoleRoute[] = ['/ot-employee'];
export function isConsoleRoute(pathname: string): boolean;
~~~

~~~ts
export interface AppShellProps {
  pathname: string;
  children: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  syncStatus?: 'idle' | 'loading' | 'ready' | 'error' | 'stale';
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}
~~~

~~~ts
export type RouteChromeMode = 'legacy' | 'console';

export interface RouteChromeAdapterProps {
  mode: RouteChromeMode;
  legacy: React.ReactNode;
  console: React.ReactNode;
}
~~~

~~~ts
export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}
~~~

## Task 1: Foundation และ route gate

**ไฟล์:** สร้าง shellRoutes.ts, navigationDestinations.ts และ shellRoutes.test.ts แก้ app/globals.css

- [ ] เขียน failing tests สำหรับ route matching: เริ่มต้นให้มีเพียง /ot-employee ที่เป็น console route; query string ต้องไม่ทำให้ route อื่น match; public paths ทั้ง 7 ต้องเป็นค่าที่รู้จัก
- [ ] รัน npx vitest run components/layout/shellRoutes.test.ts และยืนยันว่า fail เพราะยังไม่มี module
- [ ] เพิ่ม allowlist และ copy label/icon จาก NavigationMenu.tsx โดยไม่เปลี่ยน URL หรือคำศัพท์งาน
- [ ] เพิ่ม EGAT tokens ใน globals.css: blue #005b9a, hover #004a7d, active #003c66, amber #f0b323, green #1f7a4d, rose #b42318, navy #0f2747, white #ffffff, mist #f2f6fa, muted #e8eef4, text และ border roles
- [ ] เพิ่ม focus styles และ reduced-motion fallback โดยยังไม่เพิ่ม Magic UI หรือเปลี่ยน route behavior
- [ ] รัน focused tests และ git diff --check
- [ ] commit foundation

Rollback: revert เฉพาะ commit นี้ เพราะยังไม่มี route หรือ API behavior เปลี่ยน

## Task 2: Navigation compatibility

**ไฟล์:** สร้าง components/layout/LegacyNavigationAdapter.tsx แก้ components/navigation/NavigationMenu.tsx, NavigationMenu.test.tsx และ NavigationMenu.integration.test.ts

Interface:

~~~ts
export interface LegacyNavigationAdapterProps {
  buttonClassName: string;
  accentClassName?: string;
  itemHoverClassName?: string;
}
~~~

- [ ] เขียน contract test ที่ fail เพื่อยืนยันว่า adapter แสดง trigger และ destination labels เดิมครบ
- [ ] รัน focused NavigationMenu tests และยืนยันว่า adapter ยังไม่มี
- [ ] ให้ NavigationMenu ใช้ navigationDestinations โดยคง public props, current-route semantics, pointer behavior, Escape, outside click, focus behavior และ close-after-navigation
- [ ] สร้าง adapter แบบบาง และยัง export NavigationMenu เดิม
- [ ] รัน navigation tests แล้วรัน npm run test:unit
- [ ] commit adapter

Rollback: คืน declaration ของ destination เดิมและคง dropdown เดิมไว้

## Task 3: สร้าง AppShell ใหม่โดยไม่แตะ route data

**ไฟล์:** สร้าง AppShell.tsx, Sidebar.tsx, SidebarNavItem.tsx, MobileTopBar.tsx, MobileNavigationDrawer.tsx, ShellMigrationGate.tsx, AppShell.test.tsx, Sidebar.test.tsx และ MobileNavigationDrawer.test.tsx แก้ app/layout.tsx

- [ ] เขียน failing tests สำหรับ shell gate, current-route semantics, keyboard navigation, Escape, outside click, focus restoration, body-scroll lock และ close-after-navigation
- [ ] รัน npx vitest run components/layout และยืนยันว่า fail เพราะ component ยังไม่มี
- [ ] สร้าง AppShell ที่รับผิดชอบเฉพาะ layout รับ children และห้าม fetch หรือ normalize route data
- [ ] สร้าง Sidebar กว้าง 232–256px ที่ desktop มี icon + text และใช้ visual cue อย่างน้อย 2 อย่างสำหรับ current route
- [ ] สร้าง MobileTopBar พร้อม menu trigger ที่กดได้อย่างน้อย 44×44px และมี accessible name
- [ ] สร้าง MobileNavigationDrawer พร้อม overlay, Escape, outside click, focus transfer, focus return, body-scroll lock และปิด/เปิดทันทีใน phase นี้ ห้าม import Framer Motion หรือ Magic UI
- [ ] สร้าง ShellMigrationGate ด้วย usePathname ให้คืน children เดิมสำหรับ legacy routes และใช้ AppShell สำหรับ route ใน consoleRoutes
- [ ] แก้ app/layout.tsx เฉพาะการครอบ children ด้วย ShellMigrationGate
- [ ] รัน focused tests, components/navigation tests และ npm run test:unit
- [ ] รัน targeted lint เฉพาะ shell files ที่แก้ และรายงาน inherited lint แยก
- [ ] commit shell scaffold

Rollback: ลบ ShellMigrationGate จาก app/layout.tsx เพราะ legacy routes จะ bypass gate และคง behavior เดิม

## Task 4: Shared PageHeader และ chrome adapter

**ไฟล์:** สร้าง PageHeader.tsx, RouteChromeAdapter.tsx และ PageHeader.test.tsx

- [ ] เขียน failing tests สำหรับ title, description, refresh label ที่มองเห็น, disabled refresh, accessible action names และ sync status
- [ ] รัน npx vitest run components/layout/PageHeader.test.tsx และยืนยันว่า fail เพราะ component ยังไม่มี
- [ ] สร้าง PageHeader โดยไม่ fetch และไม่เป็นเจ้าของ filter state ให้ route ส่ง filter controls และ refresh callbacks ผ่าน props
- [ ] สร้าง RouteChromeAdapter ที่มี legacy และ console branch ชัดเจน
- [ ] รัน focused tests และ npm run test:unit
- [ ] commit header contract

Rollback: route ยัง render legacy branch ได้ เพราะ legacy ถูกกำหนดแยกไว้อย่างชัดเจน

## Task 5: Pilot route /ot-employee

**ไฟล์:** แก้ app/ot-summary/page.tsx และ app/ot-employee/page.tsx สร้าง app/ot-summary/page.test.tsx, app/ot-employee/page.test.tsx และขยาย AppShell.integration.test.tsx

Interface เพิ่มเติม:

~~~ts
type OtWorkerType = 'contractor' | 'employee';

export function OtSummaryContent({
  workerType = 'contractor',
  chrome = 'legacy',
}: {
  workerType?: OtWorkerType;
  chrome?: RouteChromeMode;
}): JSX.Element;
~~~

- [ ] เขียน failing tests โดย mock OT response เดิม และ assert employee title, source-sheet actions, refresh button, tables, console PageHeader และ legacy branch
- [ ] รัน npx vitest run app/ot-summary/page.test.tsx app/ot-employee/page.test.tsx components/layout/AppShell.integration.test.tsx และยืนยันว่า fail
- [ ] เพิ่ม chrome โดยให้ legacy เป็น default ห้ามแก้ OT fetch URL, no-store, useEffect trigger, refresh callback, workerType mapping, totals, source-sheet links, rows หรือการแยกข้อมูลพนักงาน/ผู้รับเหมา
- [ ] render PageHeader เฉพาะ chrome='console' และคง header เดิมเมื่อ chrome='legacy'
- [ ] ส่ง chrome='console' จาก app/ot-employee/page.tsx และคง /ot-summary เป็น legacy
- [ ] รัน npm run test:unit และ npm run build
- [ ] ตรวจด้วยตนเองที่ 360×800, 390×844, 768×1024, 1024×768 และ 1366×768: sidebar, drawer, Escape, outside click, focus restoration, browser Back/Forward, refresh disabled, table scroll, loading/error และไม่มี body horizontal scroll
- [ ] รัน targeted lint เฉพาะ pilot files และรายงาน inherited baseline แยก
- [ ] commit pilot

Rollback: ลบ /ot-employee จาก consoleRoutes และส่ง chrome='legacy' ไม่ต้อง revert data code

## Task 6: ย้าย /ot-summary

**ไฟล์:** แก้ app/ot-summary/page.tsx และ shellRoutes.ts ขยาย app/ot-summary/page.test.tsx

- [ ] เพิ่ม contractor console tests ที่ fail โดยต้องคง employee tests ให้ผ่าน
- [ ] รัน focused OT tests และยืนยันว่า contractor console assertion ยัง fail
- [ ] ส่ง chrome='console' ให้ contractor route และเพิ่ม /ot-summary ใน consoleRoutes
- [ ] คง workerType, OT fetch, no-store, source links, grouping, totals, tables และ errors เดิม
- [ ] รัน OT tests, npm run test:unit, npm run build และ targeted lint
- [ ] ตรวจ responsive และ keyboard matrix เดิม
- [ ] commit OT pair migration

Rollback: ลบ /ot-summary จาก consoleRoutes และคืน chrome='legacy'

## Task 7: ย้าย /beml-inventory

**ไฟล์:** แก้ app/beml-inventory/page.tsx และ shellRoutes.ts สร้างหรือขยาย app/beml-inventory/page.test.tsx

- [ ] เขียน failing tests สำหรับ title, filters, refresh, inventory columns, empty state, API error, retry และ console chrome
- [ ] รัน focused inventory tests และยืนยันว่า console assertions fail
- [ ] เพิ่มเฉพาะ console chrome branch คง no-store fetch, refresh timer, inventory mapping, table rows และ actions
- [ ] เพิ่ม /beml-inventory ใน consoleRoutes
- [ ] รัน focused tests, npm run test:unit, npm run build, targeted lint และ responsive/keyboard checks
- [ ] commit inventory migration

Rollback: ลบ /beml-inventory จาก consoleRoutes และใช้ legacy chrome

## Task 8: ย้าย /purchasing-all

**ไฟล์:** แก้ app/purchasing/page.tsx, app/purchasing-all/page.tsx และ shellRoutes.ts สร้างหรือขยาย purchasing tests

- [ ] เขียน failing tests สำหรับ fixed filters, path /api/purchasing-all เดิม, chart data, table columns, refresh และ console chrome
- [ ] รัน purchasing-focused tests และยืนยันว่า fail
- [ ] เพิ่ม chrome='legacy' เป็นค่าเริ่มต้นใน PurchasingPageContent ห้ามแก้ apiPath, fixedFilters, showGaugePanel, tableColumnCount, colorTheme, data fetch, chart options, status-click filter, search หรือ table behavior
- [ ] ส่ง chrome='console' จาก app/purchasing-all/page.tsx และเพิ่ม /purchasing-all ใน consoleRoutes
- [ ] รัน focused tests, npm run test:unit, npm run build, targeted lint และตรวจ chart/table/filter ด้วยตนเอง
- [ ] commit fixed-filter migration

Rollback: ลบ /purchasing-all จาก consoleRoutes และคง PurchasingPageContent default เป็น legacy สำหรับ /purchasing

## Task 9: ย้าย /purchasing

**ไฟล์:** แก้ app/purchasing/page.tsx และ shellRoutes.ts ขยาย purchasing test file

- [ ] เขียน failing tests สำหรับ year/month labels, filter changes, refresh preservation, clickable chart status filtering, search, gauges และ console chrome
- [ ] รัน purchasing tests และยืนยันว่า fail ก่อน opt-in
- [ ] ส่ง chrome='console' จาก default purchasing page และเพิ่ม /purchasing ใน consoleRoutes
- [ ] คง fetch query construction, cache no-store, localStorage behavior, refresh timer, chart options, status normalization, search และ table filtering
- [ ] รัน focused tests, npm run test:unit, npm run build, targeted lint และตรวจ chart/gauge ด้วยตนเอง
- [ ] commit interactive purchasing migration

Rollback: ลบ /purchasing จาก consoleRoutes และคืน legacy chrome

## Task 10: ย้ายหน้า home /

**ไฟล์:** แก้ app/page.tsx และ shellRoutes.ts สร้างหรือขยาย app/page.test.tsx

- [ ] เขียน failing tests สำหรับ title, year/month filters, refresh preservation, 30-second refresh, status KPI values, group cards, charts, loading, error และ console chrome
- [ ] รัน home-focused tests และยืนยันว่า fail
- [ ] เพิ่ม console chrome และ / ใน consoleRoutes
- [ ] คง dashboard fetch, no-store, localStorage keys, status percentages, chart options, gauge clamping และ refresh timer
- [ ] รัน focused tests, npm run test:unit, npm run build, targeted lint และตรวจ chart/gauge ด้วยตนเอง
- [ ] commit home migration

Rollback: ลบ / จาก consoleRoutes และคืน legacy chrome

## Task 11: ย้าย /shop-order เป็น route สุดท้าย

**ไฟล์:** แก้ app/shop-order/page.tsx, app/shop-order/error.tsx และ shellRoutes.ts แก้ components/shop-order/ShopOrderDashboard.tsx เฉพาะเมื่อจำเป็นเพื่อซ่อน header เดิม ขยาย Shop Order tests เฉพาะ chrome contract

- [ ] เขียน failing tests สำหรับ console chrome โดยคง load, filters, add, edit, delete, upload, attachment preview, error, retry และ pagination
- [ ] รัน Shop Order tests และยืนยันว่า console assertion fail
- [ ] ใช้ page-level adapter ก่อน แก้ ShopOrderDashboard.tsx เฉพาะเมื่อจำเป็นเพื่อไม่ให้ header ซ้ำ
- [ ] คงทุก /api/shop-order call, upload-session behavior, attachment URL, repository result, dialog state, table filtering และ safe error envelope
- [ ] เพิ่ม /shop-order ใน consoleRoutes และคง reset behavior ของ error.tsx
- [ ] รัน Shop Order tests, npm run test:unit, npm run build, targeted lint และตรวจ CRUD/upload ที่ desktop/tablet/mobile
- [ ] commit final route migration

Rollback: ลบ /shop-order จาก consoleRoutes และคืน legacy chrome ห้าม rollback API หรือ repository เพราะ task นี้ห้ามแก้สองส่วนนี้

## Task 12: Final shell cleanup

**ไฟล์:** แก้ shellRoutes.ts, ShellMigrationGate.tsx, app/layout.tsx, NavigationMenu.tsx, NavigationMenu.test.tsx และ NavigationMenu.integration.test.ts สร้างหรือขยาย RouteMigration.integration.test.tsx

- [ ] เขียน test ที่ fail เพื่อยืนยันว่าทั้ง 7 public routes ใช้ console shell และไม่มี route ใด render legacy dropdown header
- [ ] รัน test และยืนยันว่า fail จนกว่า allowlist และ route branches จะครบ
- [ ] เพิ่มทั้ง 7 route ใน consoleRoutes และลบเฉพาะ legacy branches ที่ไม่มีทางถูกใช้หลังทุก route tests ผ่าน
- [ ] คง NavigationMenu จนกว่า replacement contract จะมี coverage ครบ แล้วจึงลบใน cleanup task นี้
- [ ] ตัดสินใจว่าจะเก็บ gate ไว้หรือ render AppShell ตรงจาก app/layout.tsx โดย direct render ทำได้เมื่อทุก route green เท่านั้น
- [ ] รัน tests ทั้งหมด, build, targeted lint และ full manual route checklist
- [ ] commit final shell cleanup

Rollback: เก็บ route gate และคืน allowlist ล่าสุดที่ผ่าน หาก cleanup ทำให้เกิด regression

## Task 13: เพิ่ม motion และ Magic UI หลัง layout เสถียร

**ไฟล์:** สร้าง components/ui/magic/NumberTicker.tsx, BorderBeam.tsx, ShimmerButton.tsx, BlurFade.tsx และ tests แก้ globals.css และแก้เฉพาะ route component ที่มี state-feedback ที่ตรวจพบว่ามีประโยชน์

- [ ] เขียน failing tests สำหรับ final values, ไม่เริ่มตัวเลขจากศูนย์ใน first render, disabled/loading button, accessible final announcement และ reduced-motion fallback
- [ ] รัน Magic UI tests และยืนยันว่า fail เพราะ component ยังไม่มี
- [ ] สร้าง primitive ภายในโปรเจกต์ด้วย Framer Motion ที่มีอยู่ ไม่เพิ่ม package
- [ ] ใช้ NumberTicker เฉพาะ KPI ที่เปลี่ยนจริงหลัง refresh, BorderBeam เฉพาะ sync state ชั่วคราว, ShimmerButton เฉพาะ primary action ที่มีเหตุผล และ BlurFade เฉพาะ feedback ขนาดเล็ก
- [ ] ห้าม animate รูป, logo, ทุก card, ทุก section หรือทั้งหน้า และห้ามซ่อน content หลักหลัง motion
- [ ] รัน tests ทั้งหมด, npm run build, targeted lint และ visual check ของ reduced motion
- [ ] commit motion แยกจาก shell migration

Rollback: ลบการใช้งาน primitive โดยคง static shell ไว้

## Task 14: แยก Next.js และ Partial Prefetching review

นี่เป็น phase แยกที่ต้องรอการตัดสินใจ และไม่รวมใน acceptance ของ AppShell หรือ pilot

**เริ่มจาก inspect อย่างเดียว:** package.json, package-lock.json, next.config.ts, app/layout.tsx, route fetch calls, API cache directives และ docs ที่ตรงกับเวอร์ชันใต้ node_modules/next/dist/docs

- [ ] บันทึก Next.js version ที่ resolve จริง, lockfile version, peer dependencies, Vercel compatibility และ guide ที่มี
- [ ] inventory ทุก Link, router.prefetch, searchParams, runtime API read, no-store และ force-dynamic
- [ ] กำหนด cache policy สำหรับ Google Sheets summaries, manual refresh, OT freshness และ Shop Order data ก่อนเสนอ config changes
- [ ] เตรียมแผนอัปเกรด/config แยก หาก version และ policy รองรับ
- [ ] ห้ามแก้ dependency, next.config.ts, no-store หรือ force-dynamic ใน commit ของ AppShell migration

Rollback: ไม่ต้อง rollback เพราะ phase นี้เริ่มจาก read-only review

---

## Tests และ verification

หลัง pilot และทุก route migration checkpoint ให้รัน:

~~~bash
npx vitest run <focused tests>
npm run test:unit
npm run build
npx eslint <changed files>
~~~

Repository ไม่มี npm test script ให้ใช้ npm run test:unit และห้ามใช้ build ที่ผ่านเพื่ออ้างว่า lint สะอาด

ตรวจด้วยตนเองที่ 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900 และ 1920×1080:

- Desktop มี sidebar และขนาดเล็กกว่า breakpoint มี top bar/drawer
- Current route สื่อด้วยมากกว่าสีอย่างเดียว
- Keyboard เข้าถึง menu, filters, refresh, table, dialog และ retry
- Escape, outside click, focus transfer, focus restoration และ close-after-navigation ทำงาน
- Browser Back/Forward คืน route และ route state ได้
- ไม่มี body horizontal scroll; ตารางกว้าง scroll ใน container
- Thai labels และ controls รองรับ 320px และ zoom 200%
- Initial loading แสดง shell พร้อม local skeleton
- Refresh คงข้อมูลเดิม ป้องกันการกดซ้ำ และรายงานสำเร็จ/ล้มเหลว
- Empty, filtered-empty, partial-error, full-error และ stale state แยกกันชัดเจน
- ไม่มี console error หรือ hydration warning ใหม่
- ไม่มี credential, internal path, raw API error หรือ secret แสดงใน client

สำหรับทุก route ให้เปรียบเทียบก่อนและหลัง:

- URL และคำศัพท์ชื่อหน้าเหมือนเดิม
- API path และ query parameters เหมือนเดิม
- KPI values/formulas และ filter defaults เหมือนเดิม
- Chart categories, series และ click-to-filter behavior เหมือนเดิม
- Table columns, row counts, status และ employee/contractor split เหมือนเดิม
- Refresh timer และ manual refresh semantics เหมือนเดิม
- Google Sheet links เหมือนเดิม
- Shop Order CRUD/upload behavior เหมือนเดิม

## Risk register

| ID | ความเสี่ยง | วิธีป้องกัน |
| --- | --- | --- |
| R1 | Header เดิมซ้ำกับ shell ใหม่ | ใช้ route allowlist และ legacy/console chrome mode; pilot ทีละ route |
| R2 | Root client boundary ใหญ่เกินไป | Shell gate รับผิดชอบเฉพาะ pathname และ navigation state; ไม่มี data fetch หรือ global data context |
| R3 | OtSummaryContent ที่ใช้ร่วมกันเปลี่ยนทั้ง employee และ contractor | ใช้ legacy เป็น default; opt employee ก่อน contractor และ test ทั้งคู่ |
| R4 | Navigation keyboard/focus regression | คง tests เดิม เพิ่ม drawer tests และตรวจ Escape/outside click/focus ด้วยตนเอง |
| R5 | Thai labels ล้นจอบนหน้าจอแคบ | ตรวจ 320px/zoom 200%, ใช้ icon + text และ sidebar scroll ภายใน |
| R6 | Chart/table เปลี่ยนความหมายระหว่าง refactor | ไม่แตะ chart/data component ใน shell phase และใช้ data-parity checklist |
| R7 | Refresh ล้างข้อมูลที่เชื่อถือได้ | คง no-store client fetch และ route state; คงข้อมูลเดิมจนกว่าข้อมูลใหม่พร้อม |
| R8 | Lint baseline กลบ error ใหม่ | รัน targeted lint เฉพาะไฟล์ที่แก้ และรายงาน inherited baseline แยก |
| R9 | Next.js upgrade/cache ทำให้ freshness เสีย | แยกเป็น decision-gated phase; ห้ามแก้ config/dependency ใน AppShell |
| R10 | Magic UI ทำให้รบกวนหรือเกิด accessibility regression | เพิ่ม motion ท้ายสุด, ใช้ local primitives, ทดสอบ reduced motion และใช้เฉพาะ state |
| R11 | Shop Order upload/dialog regression | ย้ายท้ายสุด, reuse component/tests เดิม และไม่แตะ repository/API |
| R12 | Security boundary อ่อนลง | ห้ามแก้ .env/API/lib; Google Sheets อยู่ server-side และ error messages ปลอดภัย |

## Self-review ของแผน

- ครอบคลุมตัวเลือก B, phased migration, pilot route และเหตุผล, shared shell components, root layout, adapter, ลำดับทั้ง 7 route, tests, rollback, forbidden files, risks, Magic UI sequencing, lint baseline และ Partial Prefetching separation
- ไม่มี placeholder ที่ไม่ผูกกับไฟล์หรือคำสั่ง และทุก task ระบุ files, commands, expected behavior และ rollback
- ใช้ ConsoleRoute, RouteChromeMode, AppShellProps, PageHeaderProps และ MobileNavigationDrawerProps สอดคล้องกันทุก task
- แยก AppShell, route migration, motion และ Next.js performance เป็น checkpoints คนละช่วง Data/API/dependency changes อยู่นอก shell และ pilot

## Handoff

แผนฉบับภาษาไทยถูกบันทึกไว้ที่ docs/superpowers/plans/2026-07-30-egat-operations-console-ui-redesign.th.md การ implementation ยังไม่เริ่ม และต้องรอ explicit plan approval

