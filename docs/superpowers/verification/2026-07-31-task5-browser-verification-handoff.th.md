# Task 5 Browser Verification Handoff

วันที่: 2026-07-31  
Route: `/ot-employee`  
Code checkpoint: `3f3cbc6`  

## สถานะ

`Task 5 automated checks passed; browser verification pending`

ยังไม่ถือว่า Task 5 ผ่าน manual acceptance และยังไม่เริ่ม Task 6

## ผลตรวจ runtime

Production server รันได้จาก build เดิมโดยไม่ต้องอัปเกรด Next.js:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3001
```

URL สำหรับตรวจ: <http://127.0.0.1:3001/ot-employee>

Startup log:

```text
▲ Next.js 16.2.12
- Local:         http://127.0.0.1:3001
- Network:       http://127.0.0.1:3001
✓ Ready in 2.8s
```

HTTP smoke check:

- `/ot-employee`: HTTP 200
- `/ot-summary`: HTTP 200

ข้อสรุป: Next.js 16.2.12 ไม่ได้ขัดขวางการรันเว็บหรือ production server; เป็นข้อจำกัดของ verification tool ที่ต้องการ Next.js 16.3+ และ `agent-browser` อย่างน้อย 0.31.1

## เครื่องมือที่ตรวจพบ

ไม่พบเครื่องมือ browser automation ที่ repository มีอยู่แล้ว:

- Playwright: ไม่มีใน dependencies และไม่มี binary
- Puppeteer: ไม่มีใน dependencies และไม่มี binary
- Cypress: ไม่มีใน dependencies และไม่มี binary
- browser test script / screenshot utility: ไม่พบจาก repository file scan
- ไม่ได้ติดตั้ง dependency ใหม่

การเชื่อม browser surface ของ environment ล้มเหลวด้วย sandbox ACL (`apply deny-read ACLs`) จึงยังไม่สามารถทำ interaction หรือเก็บ screenshot ได้

## วิธีเปิด server สำหรับตรวจภายนอก environment

เปิด PowerShell ที่ `D:\w10_dashboard` แล้วรัน:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3001
```

จากนั้นเปิด:

```text
http://127.0.0.1:3001/ot-employee
```

ถ้าต้องการใช้ dev server:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Viewport checklist

ตรวจครบทุกขนาดต่อไปนี้ โดยใช้ browser DevTools device/viewport controls:

- 360×800
- 390×844
- 768×1024
- 1024×768
- 1366×768

สำหรับแต่ละขนาด ให้ตรวจว่า:

- desktop แสดง sidebar ตาม breakpoint จริง
- mobile/tablet แสดง mobile top bar และ menu trigger
- current route แสดงเป็น `/ot-employee` และมีสถานะ active ที่อ่านได้มากกว่าสีอย่างเดียว
- ไม่มี legacy header หรือ `NavigationMenu` ซ้ำ
- ไม่มี body horizontal scroll
- ตาราง scroll ภายใน container ของตาราง
- layout ยังใช้งานได้เมื่อ browser zoom 200%

## Interaction checklist

### Mobile drawer

1. ที่ 360×800 หรือ 390×844 กด menu trigger
2. คาดหวังว่า drawer เปิดและ focus เข้า close button หรือ interactive element แรก
3. กด `Escape`
4. คาดหวังว่า drawer ปิดและ focus กลับ menu trigger
5. เปิด drawer ใหม่ แล้วกด overlay ด้านนอก
6. คาดหวังว่า drawer ปิดโดยไม่รบกวน table, chart, select หรือ dialog
7. เปิด drawer แล้วเลือก internal route
8. คาดหวังว่า navigation ทำงานและ drawer ปิด
9. ใช้ browser Back และ Forward
10. คาดหวังว่า route และ current navigation state เปลี่ยนถูกต้อง

### Route content

- employee title ใช้ชื่อเดิม
- legacy `NavigationMenu` ไม่ปรากฏบน `/ot-employee`
- source-sheet links มี URL เดิมและเปิดแท็บใหม่ได้
- ปุ่ม `รีเฟรชข้อมูล` เรียก refresh เดิม
- ระหว่าง refresh ปุ่ม disabled และไม่ trigger ซ้ำ
- employee totals, rows และ table grouping ตรงกับ baseline
- employee/contractor data ไม่สลับกัน
- loading state ไม่มี legacy chrome ซ้ำ
- error state ไม่มี legacy chrome ซ้ำ

### Browser diagnostics

เปิด DevTools Console และตรวจว่า:

- ไม่มี error ใหม่
- ไม่มี hydration warning
- ไม่มี failed module/chunk load
- ไม่มี warning จากการ mount chrome ซ้ำ

## Acceptance record

| รายการ | ผล |
|---|---|
| Production server startup | PASS |
| `/ot-employee` HTTP 200 | PASS |
| `/ot-summary` HTTP 200 | PASS |
| Automated unit/build/lint checkpoint | PASS ที่ commit `3f3cbc6` |
| Browser automation availability | BLOCKED: ไม่มี tool และ browser surface เชื่อมไม่ได้ |
| Viewport checks 360×800 ถึง 1366×768 | PENDING: ต้องตรวจจาก browser ภายนอก environment |
| Keyboard/focus/drawer/Back-Forward checks | PENDING: ต้องตรวจจาก browser ภายนอก environment |
| Console error/hydration checks | PENDING: ต้องตรวจจาก browser ภายนอก environment |

เอกสารนี้เป็น verification handoff เท่านั้น และไม่ได้อ้างว่า Task 5 ผ่าน manual acceptance
