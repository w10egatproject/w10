# การออกแบบปรับปรุง UI: EGAT Operations Console

**สถานะ:** อนุมัติทิศทางแล้ว; รอรีวิวเอกสารฉบับภาษาไทยก่อนเริ่ม implementation

**เป้าหมาย:** ปรับปรุงทุกหน้าของ dashboard ให้เป็น operations console สไตล์ EGAT/เหมืองแม่เมาะที่อ่านง่าย เพิ่ม Magic UI motion แบบพอดี และ adopt Partial Prefetching โดยไม่เปลี่ยนพฤติกรรมข้อมูลเดิม

**บริบทผลิตภัณฑ์:** เจ้าหน้าที่ซ่อมบำรุงและฝ่ายธุรการ W10 ใช้ dashboard นี้ทุกวัน เพื่อตรวจสอบสถานะใบสั่งงาน ความคืบหน้าการจัดซื้อ คลังพัสดุ และยอด OT จาก Google Sheets ผู้ใช้หลักรวมถึงหัวหน้างานที่ต้องอ่านยอดรวมและค้นหาหน้าที่ถูกต้องได้อย่างรวดเร็ว

## หลักการออกแบบ

1. **อ่านง่ายมาก่อนความว้าว** อินเทอร์เฟซต้องใช้งานได้ทันทีสำหรับหัวหน้างานที่มีประสบการณ์ ข้อความเนื้อหาควรมีขนาดอย่างน้อย 16px เมื่อพื้นที่เอื้อ ตารางต้องแน่นอย่างมีเหตุผล และต้องตรวจ contrast จริง
2. **สื่ออัตลักษณ์ EGAT ผ่านโครงสร้างและสี** ใช้ภาพ EGAT/W10 ที่มีอยู่และระบบสีฟ้า เหลืองอำพัน เขียว และสีกลาง หลีกเลี่ยงการทำให้ dashboard กลายเป็นหน้า marketing หรือวาด artwork ทางการขึ้นใหม่
3. **ใช้ภาษาภาพชุดเดียวกันทุกหน้า** ทุกหน้าต้องใช้ navigation, header controls, รูปแบบปุ่ม, focus state, status badge, ตาราง, loading, empty state และ error recovery แบบเดียวกัน
4. **Motion ต้องอธิบายสถานะ** ใช้ motion เพื่อยืนยันการ refresh, การกรองข้อมูล, การเปิดเมนู และ success/error state ต้องไม่ทำให้ผู้ใช้รอหรือ animate สิ่งที่ไม่เกี่ยวข้องเพื่อการตกแต่ง
5. **รักษาโมเดลการทำงานเดิม** routes, คำภาษาไทย, filters, charts, tables, data fetching และการแยกข้อมูลพนักงาน/ผู้รับเหมาต้องคงเดิม เว้นแต่จำเป็นต่อ shared UI shell

## ภาษาภาพ

### ฉากอ้างอิง

อินเทอร์เฟซควรให้ความรู้สึกเหมือนหัวหน้างานกำลังตรวจสอบ maintenance console ในสำนักงาน EGAT ใกล้เหมืองแม่เมาะ: สว่าง ใช้งานจริง contrast สูง และสงบพอสำหรับการใช้ซ้ำทุกวัน ความเป็นอุตสาหกรรมจะมาจากระบบสีฟ้า/เหลือง โครงสร้างข้อมูล และเส้นพลังงานที่ใช้เพียงเล็กน้อย ไม่ใช่พื้นมืด ลายถ่านหิน หรือเอฟเฟกต์ที่หนาแน่น

### บทบาทของสี

| บทบาท | การใช้งาน | แนวทาง |
| --- | --- | --- |
| EGAT blue | navigation หลัก, หน้าปัจจุบัน, primary action, link | น้ำเงินเข้มและใช้ตัวอักษรขาว |
| Mae Moh amber | filter ที่ active, accent พลังงาน, attention state, KPI ที่ถูกเลือก | เหลืองอำพันและใช้ตัวอักษรสีเข้ม |
| Operations green | สำเร็จ, งานเสร็จ, สถานะข้อมูลปกติ | เขียวเข้ม ใช้ขาวหรือเกือบดำตามค่า contrast |
| Alert rose | error และงานที่ถูกบล็อกเท่านั้น | แดง/rose เข้ม พร้อม icon และคำอธิบายชัดเจน |
| Console navy | sidebar และหัวข้อที่ต้องการ contrast สูง | น้ำเงินเกือบดำ ไม่ใช้กับเนื้อหายาวบนพื้นมืด |
| Surface white | ตาราง, form, chart และพื้นที่ข้อมูล | ขาวจริงหรือขาวกลาง |
| Surface mist | พื้นหลังหน้าและ panel รอง | เทากลางโทนเย็น ไม่ใช่ครีมหรือเบจ |

ค่า token เป้าหมายเบื้องต้นสำหรับ implementation คือ `#005B9A` (EGAT blue), `#F0B323` (Mae Moh amber), `#1F7A4D` (operations green), `#B42318` (alert rose), `#0F2747` (console navy), `#FFFFFF` (surface white) และ `#F2F6FA` (surface mist) โดยต้องตรวจเทียบกับ asset EGAT ที่มีอยู่และตรวจ WCAG contrast ก่อนสรุปค่า CSS tokens

ใช้สี accent เพื่อ action และ state ไม่ใช่เติมสีตกแต่งให้ทุก card ห้ามใช้ gradient text, gradient เต็มหน้า, side-stripe accent border หรือ glassmorphism เป็นค่าเริ่มต้น

### Typography และรูปทรง

- คง Prompt ซึ่งรองรับภาษาไทยและโหลดอยู่ในแอปแล้ว
- ใช้ type scale แบบคงที่แทน display type แบบ fluid: body 16px, control 14–16px, section heading 20–28px และ page title 30–36px เมื่อพื้นที่เพียงพอ
- ลดการใช้ตัวพิมพ์ใหญ่และ letter spacing ที่มากเกินไป เพื่อให้ข้อความไทยอ่านเป็นธรรมชาติ
- ใช้ corner radius 12–16px สำหรับ panel และ control ส่วน pill ใช้เฉพาะ status badge ขนาดเล็ก
- เลือกใช้ solid border หรือ shadow ขนาดเล็กอย่างใดอย่างหนึ่ง ไม่ใช้ทั้งคู่เพื่อการตกแต่ง
- ใช้ focus ring แบบ semantic ที่มองเห็นได้ทั้งบนพื้นสว่างและพื้นมืด

## Application shell และ navigation

### Shared shell

สร้าง shell กลางเพื่อครอบทุก route:

- Desktop: navigation rail ด้านซ้ายกว้าง 232–256px มี identity ของ EGAT/W10, กลุ่มเมนู และหน้าปัจจุบันที่เห็นชัด
- Mobile/tablet: navigation drawer ที่ปิดอยู่ และเปิดด้วยปุ่มเมนูขนาดใหญ่ที่รองรับ keyboard
- Main content: page header รูปแบบเดียวกัน ตามด้วยเนื้อหาของแต่ละ route หลีกเลี่ยง sticky header หลายแบบ
- Page header: ชื่อหน้า, คำอธิบายสั้น, filter ปี/เดือนเมื่อเกี่ยวข้อง, สถานะ sync/update, ปุ่ม refresh และปุ่ม navigation
- Content width: ตารางปฏิบัติการที่กว้างสามารถ scroll แนวนอนได้ โดย title และ controls ยังมองเห็นได้

ต้องรักษาหรือเขียน test ให้ครอบคลุมพฤติกรรมเดิมของ `NavigationMenu` ได้แก่ outside click, Escape, การคืน focus, current-route state และการรองรับ pointer/keyboard ใช้ `next/link` เป็นกลไกเปลี่ยน route หลัก

### รูปแบบพื้นผิวของหน้า

- KPI ใช้กลุ่มแถวตัวเลขที่มี label ชัดเจน แทนการใช้ hero card ขนาดใหญ่ซ้ำ ๆ
- Chart อยู่ในพื้นขาว มี title, legend และข้อความเมื่อไม่มีข้อมูล
- ตารางใช้ sticky header, เส้นแบ่งแถวที่ชัดเจน, status badge ที่อ่านง่าย และ no-results state ที่อธิบายตรงไปตรงมา
- Loading state ต้องรักษา layout สุดท้ายไว้ด้วย skeleton หรือ progress ในพื้นที่เดิม ไม่แทนทั้งหน้าด้วย spinner ตรงกลาง
- Error state อธิบายปัญหาเป็นภาษาไทยและมีปุ่ม retry ชัดเจน โดยไม่เปิดเผยรายละเอียดภายในระบบ

## Magic UI layer

ใช้ primitive แบบ Magic UI ที่อยู่ในโปรเจกต์และมีขอบเขตชัดเจน โดยใช้ React, Tailwind และ Framer Motion ที่มีอยู่แล้ว ไม่เพิ่ม runtime dependency ที่ไม่จำเป็น และไม่ใส่ component ตกแต่งให้ทุก card

primitive ที่แนะนำ:

- `NumberTicker`: animate การเปลี่ยนตัวเลข KPI หลังข้อมูลพร้อมแล้ว ส่วนผู้ใช้ reduced motion และ assistive technology ต้องเห็นค่าปลายทางทันที
- `BorderBeam`: แสดง beam สีฟ้า/เหลืองสั้น ๆ รอบ refresh หรือพื้นที่ที่กำลังโหลดเท่านั้น ไม่ใช้ถาวรกับทุก panel
- `ShimmerButton`: ใช้กับ action หลักหนึ่งปุ่มต่อพื้นผิว เช่น Refresh, Save, Upload หรือ Retry โดยยังคง label, contrast, focus ring และ disabled state แบบปุ่มมาตรฐาน
- `BlurFade`: ใช้กับ state transition ขนาดเล็ก เช่น success message, การเปลี่ยนผลลัพธ์ filter หรือ empty state ห้ามซ่อนเนื้อหาหลักไว้หลัง animation

ทุก primitive ต้องมี default, hover, focus, active, disabled, loading และ reduced-motion behavior ตามความเหมาะสม ห้าม animate `<img>` หรือ element ที่อยู่ภายในรูปภาพเมื่อ hover

## กลยุทธ์ Motion

- 100–150ms: button press, focus, color และ status feedback
- 150–250ms: menu open/close, filter change และ tab/panel state change
- 300–500ms: drawer หรือ dialog entry เมื่อจำเป็น
- ไม่มี page-load sequence แบบจัดฉาก และไม่มี fade-in เหมือนกันทุก section
- ใช้ transform และ opacity สำหรับการเคลื่อนที่ หลีกเลี่ยงการ animate width, height, top, left หรือ margin ซึ่งเป็น layout-driving property โดยไม่จำเป็น
- ใช้ Framer Motion ที่มีอยู่ พร้อม `MotionConfig` หรือแนวทางเทียบเท่าสำหรับ reduced motion และเพิ่ม global `prefers-reduced-motion` fallback ใน `globals.css`
- เนื้อหาต้องมองเห็นได้ใน default state แม้ animation จะไม่ทำงาน

## การ adopt Partial Prefetching

Repository นี้ใช้ Next.js 16.2.12 ในปัจจุบัน ขณะที่ skill นี้ต้องการ Next.js 16.3 ขึ้นไป ดังนั้น implementation plan ต้องอัปเดตไปยัง Next.js เวอร์ชันที่รองรับก่อน และอ่าน guide ที่ตรงกับเวอร์ชันจาก `node_modules/next/dist/docs/` ก่อนแก้ config

ลำดับการทำงาน:

1. ตรวจทุก `<Link>` และ `router.prefetch()` ที่มีใน `app/`, `components/` และ shared code โดยคงพฤติกรรม `prefetch={false}` ไว้
2. ยืนยันว่าแอป boot ด้วย Cache Components ได้ จากนั้นเปิด `cacheComponents: true` และ `partialPrefetching: true` ใน `next.config.ts` เมื่อ Next.js เวอร์ชันที่ติดตั้งรองรับทั้งสอง flag
3. ปรับ destination ของ navigation ให้ใช้ App Shell model หาก route อ่าน `params` หรือ `searchParams` ให้เนื้อหาที่ขึ้นกับ URL อยู่หลัง Suspense boundary ที่เหมาะสม และไม่เปลี่ยนทุก link ให้เป็น runtime prefetch แบบเต็มโดยอัตโนมัติ
4. ตรวจ route sweep ในแอปที่รันจริงและ dev log จากนั้นตรวจ production behavior ด้วย `next build` และ `next start` โดย handoff ต้องระบุ route ที่ยังต้องตรวจ shell แบบ live

จะยังไม่เพิ่ม runtime prefetch ของข้อมูลที่ขึ้นกับ URL โดยอัตโนมัติ เพราะแต่ละ prefetch อาจเรียก server work และอาจทำให้ข้อมูลเฉพาะผู้ใช้ถูก cache ผิดวิธี ต้องตัดสินใจแยกตาม freshness และ privacy

## Data flow และความทนทาน

- Shared shell รับ display data และ callback จากแต่ละ route ไม่เข้าถึง Google Sheets หรือ API route โดยตรง
- Fetch, refresh timer และ filter query parameters เดิมยังเป็น source of truth
- Loading, error, empty และ success state ใช้ visual primitive กลาง แต่คง recovery action เฉพาะ route ไว้
- Error UI แสดงข้อความปลอดภัยสำหรับผู้ใช้ และไม่ log secret หรือ raw response จาก external service
- API, authentication และ storage อยู่นอกขอบเขต visual redesign เว้นแต่การตรวจ build/runtime จะพบปัญหาที่เกี่ยวข้องโดยตรง

## การทดสอบและตรวจสอบ

Implementation ต้องทำตาม TDD สำหรับ shared behavior ใหม่:

- เพิ่มหรือปรับ Vitest/Testing Library tests สำหรับ navigation destination, active route, keyboard Escape/focus return, mobile menu และ primary action state
- ทดสอบ `NumberTicker`, `BorderBeam`, `ShimmerButton` และ `BlurFade` ในด้าน accessible label, ค่าปลายทาง, disabled behavior และ reduced-motion fallback โดย assert พฤติกรรมที่ผู้ใช้เห็น ไม่ผูกกับรายละเอียด implementation ของ animation
- เพิ่ม integration coverage โดย mount shared shell กับ route ตัวแทน และยืนยันว่า filter, refresh control และ navigation ยังเข้าถึงได้
- รัน unit/integration suite เดิม, ESLint, TypeScript/build verification และ production start check
- ทำ visual QA ที่ประมาณ 1366×768, 1024×768 และ 390×844 ครบทุก route: `/`, `/purchasing`, `/purchasing-all`, `/beml-inventory`, `/ot-summary`, `/ot-employee` และ `/shop-order`
- ตรวจ keyboard-only navigation, visible focus, color contrast, horizontal overflow นอกเหนือจากตารางที่ตั้งใจให้ scroll, reduced motion, empty data, API error และ slow loading state
- ยืนยันว่าไม่มีหน้า blank เมื่อปิด animation และไม่มี table/action ถูกบล็อกระหว่าง transition

## เกณฑ์ความสำเร็จ

ถือว่าพร้อมรีวิวเมื่อ:

1. หัวหน้างานระบุหน้าปัจจุบัน filter สำคัญ และยอดหลักได้โดยไม่ต้องเรียนรู้ interaction pattern ใหม่
2. ทุก route ใช้ EGAT shell และ component vocabulary เดียวกัน
3. Magic UI effects ปรากฏเฉพาะจุดที่สื่อ loading, change หรือ feedback
4. คำภาษาไทยและตารางงานปฏิบัติการยังอ่านง่ายบน desktop และ mobile
5. ผู้ใช้ reduced motion ได้รับข้อมูลและ controls ครบโดยไม่ต้องพึ่ง animation
6. Partial Prefetching แสดง shared App Shell ที่ใช้งานได้หลัง navigation และ `next build` กับ `next start` ทำงานสำเร็จ

## สิ่งที่ไม่รวมในงาน

- เปลี่ยน Google Sheets, API routes, charts หรือ operational data model
- วาดใหม่หรือแก้ไข official EGAT marks
- เพิ่ม marketing hero, mine illustration ตกแต่ง หรือ animated background เต็มจอ
- เพิ่ม state-management library ใหม่หรือเปลี่ยนจาก Framer Motion
- เปิด runtime URL-data prefetch ให้ทุก route โดยไม่ผ่านการตัดสินใจด้าน data freshness และ privacy แยกต่างหาก
