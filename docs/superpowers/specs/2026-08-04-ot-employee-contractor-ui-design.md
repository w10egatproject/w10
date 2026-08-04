# OT Employee Contractor-Style UI Design

## Objective

ปรับหน้า `/ot-employee` ให้ใช้โครงหน้าตาและประสบการณ์ใช้งานเดียวกับหน้า `/ot-summary` ตามภาพอ้างอิงจากผู้ใช้ โดยคงข้อมูล ข้อความ ลิงก์ Google Sheet และธีมสีของพนักงานไว้

## Reference UI

หน้า `/ot-summary` ปัจจุบันเป็นต้นแบบหลัก โดยต้องรักษาองค์ประกอบต่อไปนี้ให้เหมือนกัน:

- พื้นหลังหน้าสีเทาและพื้นที่เนื้อหาที่มีระยะขอบรอบหน้า
- header แบบการ์ดแนวนอน มีไอคอน ชื่อหน้า คำอธิบาย ตัวกรอง ปุ่มรีเฟรช และปุ่มเมนูหน้า
- การ์ดแหล่งข้อมูล Google Sheet อยู่ใต้ header และแสดงลิงก์เป็นปุ่มทางด้านขวา
- การ์ดรายละเอียดแต่ละหมวดใช้หัวข้อด้านบนและเนื้อหาแบบสองคอลัมน์
- คอลัมน์ซ้ายเป็น summary card ของหมวด คอลัมน์ขวาเป็นตาราง OT ตารางข้อมูลสแกน และตารางข้อผิดพลาด
- card radius, border, shadow, spacing, typography และ responsive behavior ใช้ชุดเดียวกับหน้าลูกจ้าง
- สถานะ loading และ error ใช้รูปแบบ legacy เดียวกับหน้าลูกจ้าง

## Employee-Specific Content

โครง UI ต้องเหมือนหน้าลูกจ้าง แต่ข้อมูลเฉพาะพนักงานต้องไม่ถูกเปลี่ยน:

- ชื่อหน้าเป็น `สรุป OT พนักงาน`
- คำอธิบายภาษาอังกฤษเป็น `EGAT EMPLOYEE OT SUMMARY`
- ใช้ธีมสีเหลือง/ทองของหน้า OT พนักงานเดิมแทนสีชมพูของลูกจ้าง
- ใช้ช่วงข้อมูล `B2:AL20`
- แสดงตาราง OT พนักงาน ตำแหน่ง ข้อมูลสแกนลายนิ้วมือพนักงาน และ Check OT Error พนักงาน
- ใช้ลิงก์ Google Sheet ทั้งสามรายการของพนักงานเดิม
- request ข้อมูลยังคงเป็น `/api/ot-summary?workerType=employee` พร้อม `cache: 'no-store'`

## Architecture

ใช้ `OtSummaryContent` ที่แชร์อยู่แล้วใน `app/ot-summary/page.tsx` โดยให้ route `/ot-employee` เลือก legacy chrome เช่นเดียวกับ `/ot-summary` และไม่ให้ `ShellMigrationGate` ครอบ route นี้ด้วย `AppShell` แบบ Console

การแก้ไขจำกัดอยู่ที่ route configuration, route wrapper และ regression tests ที่ยืนยัน chrome ของทั้งสองหน้า ไม่ลบ Console components เพราะอาจยังใช้กับการ migration ในอนาคต และไม่เปลี่ยน API หรือ data parsing

## Data and State Flow

1. `/ot-employee` render `OtSummaryContent` ด้วย `workerType="employee"` และ legacy chrome
2. `OtSummaryContent` fetch ข้อมูล employee จาก API เดิม
3. loading, error และ success render ผ่าน legacy branch เดียวกับหน้าลูกจ้าง
4. ตารางและ summary ใช้ employee rows เดิมโดยไม่มีการแปลงเป็น contractor rows

## Error Handling

- คงข้อความ error ที่ได้รับจาก API/การ fetch ตามพฤติกรรม legacy ปัจจุบัน
- การกดรีเฟรชต้องป้องกันการกดซ้ำระหว่างกำลังโหลด
- failure ของ employee request ต้องไม่ทำให้แสดง contractor data

## Responsive and Accessibility Requirements

- ปุ่มที่กดได้ต้องมี accessible name และขนาดสัมผัสตามรูปแบบหน้าลูกจ้างเดิม
- ตารางกว้างต้องเลื่อนแนวนอนได้โดยไม่ดัน layout หลักล้น viewport
- navigation menu ต้องใช้งานได้ทั้ง desktop และ mobile ตาม behavior ของ `NavigationMenu`
- heading hierarchy และลิงก์ภายนอกต้องคง semantics เดิม

## Testing Strategy

- เขียน regression test ก่อน implementation เพื่อยืนยันว่า `/ot-employee` ไม่เลือก Console chrome และไม่อยู่ใน `consoleRoutes`
- ยืนยันว่าหน้าพนักงานแสดง legacy navigation, employee title, employee source-sheet links และ employee rows
- ยืนยันว่า contractor rows และ Console-only header/sidebar ไม่ปรากฏ
- รัน route tests, layout tests, unit test suite, lint และ production build
- ตรวจหน้า `/ot-employee` ด้วย browser ที่ desktop และ mobile viewport เทียบกับภาพอ้างอิง

## Out of Scope

- เปลี่ยน API, Google Sheet IDs หรือ data parsing
- เปลี่ยนสีพนักงานเป็นสีชมพูเหมือนลูกจ้าง
- ลบหรือ redesign ระบบ Console ทั้งระบบ
- refactor ตาราง OT หรือ component อื่นที่ไม่จำเป็นต่อความสอดคล้องของ UI

## Acceptance Criteria

- `/ot-employee` มี shell, header, source card, menu, spacing และ card layout เหมือนภาพอ้างอิงของหน้าลูกจ้าง
- เนื้อหาทั้งหมดที่เป็นข้อมูลพนักงานยังถูกต้องและไม่มีข้อมูลลูกจ้างปะปน
- ธีมพนักงานยังเป็นสีเหลือง/ทอง
- desktop และ mobile ไม่มี layout overflow นอกส่วนตารางที่ตั้งใจให้เลื่อนแนวนอน
- regression tests, unit tests, lint และ build ผ่านโดยไม่มี error
