# 🎨 EGAT Operations Console — Design System & Theme Specification (.md)

> **เอกสารคู่มือระบบธีมและดีไซน์ซิสเต็ม (Design System Blueprint)**  
> ถอดแบบจากระบบ **W10 Dashboard (การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย - กฟผ. โรงไฟฟ้าแม่เมาะ)**  
> เหมาะสำหรับนำไปใช้เป็นมาตรฐานในการสร้างเว็บไซต์ แดชบอร์ด หรือเว็บแอปพลิเคชันระบบงานองค์กร / อุตสาหกรรมในโปรเจกต์ถัดไป

---

## 1. 🌟 แนวคิดหลักและบุคลิกของธีม (Design Philosophy & Identity)

* **Concept:** **"EGAT Operations Console"** — สไตล์แดชบอร์ดควบคุมงานปฏิบัติการระดับองค์กร สะอาด คมชัด สบายตา ใช้งานได้ต่อเนื่องทั้งวัน
* **Mood & Tone:** สว่าง (Light-first), คอนทราสต์สูง (High Contrast), เป็นทางการ น่าเชื่อถือ (Enterprise & Industrial Precision)
* **Anti-Patterns (สิ่งที่ไม่ควรทำ):**
  * ❌ ไม่ใช้หน้าตาแนว Landing Page การตลาดที่เน้นภาพกราฟิกตกแต่งเยอะเกินไป
  * ❌ หลีกเลี่ยง Glassmorphism หรือแสงนีออนฟุ้งกระจายจนอ่านตัวหนังสือยาก
  * ❌ ไม่ใส่ Animation หรือ Transition ที่ยาวเกินไปจนหน่วงการทำงานของผู้ใช้ (ความเร็วต้องมาก่อน)
* **Accessibility (WCAG):** รองรับภาษาไทยสมบูรณ์แบบ, Contrast ตัวอักษรกับพื้นหลังผ่านเกณฑ์ WCAG AA (≥ 4.5:1), มี Focus Ring สีเหลืองอำพันชัดเจนเมื่อใช้คีย์บอร์ด

---

## 2. 🎨 ระบบสี (Color Palette & Semantic Tokens)

### 2.1 สีเอกลักษณ์หลัก (Brand Identity Colors)

| ชื่อตัวแปร / Token | รหัสสี (HEX) | CSS Variable | ตัวอย่างการนำไปใช้งาน |
| :--- | :--- | :--- | :--- |
| **EGAT Blue** | `#005B9A` | `--egat-blue` | เมนูหลัก, ปุ่ม Primary Action, หัวข้อลิงก์สำคัญ |
| **EGAT Blue Hover** | `#004A7D` | `--egat-blue-hover` | สถานะ Hover ของปุ่มสีน้ำเงิน |
| **Mae Moh Amber** | `#F0B323` | `--mae-moh-amber` | สีเส้น Active Tab, Accent พลังงาน, Focus Ring |
| **Mae Moh Amber Hover** | `#D99C12` | `--mae-moh-amber-hover` | สถานะ Hover ของสีเหลืองอำพัน |
| **Console Navy** | `#0F2747` | `--console-navy` | สีหัวข้อหลัก (Heading), ตัวหนังสือเข้มพิเศษ |
| **Surface White** | `#FFFFFF` | `--surface-white` | พื้นหลังการ์ด, ตารางข้อมูล, หน้าต่าง Dialog |
| **Surface Mist** | `#F2F6FA` / `#F8FAFC` | `--surface-mist` | พื้นหลังของหน้าจอทั้งหมด (Page Background) |
| **Surface Muted** | `#EDF2F7` / `#F1F5F9` | `--surface-muted` | พื้นหลังปุ่มรอง, แถบตัวกรอง, เมนูย่อย |
| **Border Default** | `#E2E8F0` | `--border-default` | เส้นขอบการ์ด ตาราง และอินพุตฟอร์ม |

### 2.2 สีบอกสถานะ (Semantic Status Colors)

| สถานะ | รหัสสี (HEX) | การใช้งาน | Class / Token |
| :--- | :--- | :--- | :--- |
| **Success / Normal** | `#1F7A4D` / `#10B981` | ทำงานเสร็จ, บันทึกสำเร็จ, สถานะ Ready | `text-emerald-700 bg-emerald-50 border-emerald-200` |
| **Warning / Attention** | `#F59E0B` / `#D97706` | รอดำเนินการ, รออนุมัติ, ข้อมูลค้าง | `text-amber-700 bg-amber-50 border-amber-200` |
| **Error / Blocked** | `#B42318` / `#EF4444` | ยกเลิก, เกิดข้อผิดพลาด, เกินกำหนด | `text-rose-700 bg-rose-50 border-rose-200` |
| **Info / Sky** | `#0284C7` / `#38BDF8` | กำลังประมวลผล, ข้อมูลทั่วไป, Sync Data | `text-sky-700 bg-sky-50 border-sky-200` |
| **Neutral / Idle** | `#64748B` / `#475569` | สถานะพัก, ฉบับร่าง, ค่าเริ่มต้น | `text-slate-600 bg-slate-100 border-slate-200` |

---

## 3. 🔤 ระบบตัวอักษร (Typography)

* **Font Family หลัก:** `'CMU Font'`, `'Prompt'`, `'Sarabun'`, `'Inter'`, `ui-sans-serif, system-ui, -apple-system, sans-serif`
* **ตัวเลขและโค้ด:** `'JetBrains Mono'`, `'Roboto Mono'`, `monospace`
* **Type Scale (ขนาดตัวอักษรที่แนะนำ):**
  * **Page Title (หัวข้อหน้า):** `text-2xl` หรือ `text-3xl` (`24px - 30px`) • `font-bold` • สี `text-[#0f2747]`
  * **Section Heading (หัวข้อส่วน):** `text-lg` หรือ `text-xl` (`18px - 20px`) • `font-semibold`
  * **KPI Value (ตัวเลขสำคัญ):** `text-3xl` หรือ `text-4xl` (`30px - 36px`) • `font-bold` • `tracking-tight`
  * **Body Text (เนื้อหาทั่วไป):** `text-sm` หรือ `text-base` (`14px - 16px`) • `font-normal` • สี `text-slate-700`
  * **Caption / Meta (คำอธิบายรอง):** `text-xs` (`12px`) • `text-slate-500`
  * **Table Cells (ข้อมูลในตาราง):** `text-xs` ถึง `text-sm` (`12px - 14px`) • กระชับ อ่านง่าย

---

## 4. 📐 รูปทรงและโครงสร้าง (Layout, Spacing & Elevation)

* **Border Radius (ความโค้งมน):**
  * ปุ่ม, Input, เมนูย่อย: `rounded-lg` (`8px`) หรือ `rounded-xl` (`12px`)
  * การ์ดเนื้อหา (Content Card), Header Card: `rounded-2xl` (`16px`) หรือ `rounded-[20px]`
  * Status Badge / Chips: `rounded-full` หรือ `rounded-md`
* **Shadows & Borders:**
  * เน้นใช้ **เส้นขอบคมชัด (Solid Border)** `border border-slate-200` ร่วมกับเงาบางมาก `shadow-sm`
  * หลีกเลี่ยงเงานูนหนา เพื่อรักษาความเรียบแบบมืออาชีพ
* **Focus States:**
  * คอนโทรลที่โฟกัสต้องมีเส้นขอบ: `outline: 2px solid #f0b323; outline-offset: 2px;`

---

## 5. 💻 โค้ด CSS พื้นฐาน (Global CSS & Tailwind Config)

### `app/globals.css` (Tailwind CSS v4 & CSS Variables)

```css
@import "tailwindcss";

:root {
  /* EGAT Identity Palette */
  --egat-blue: #005b9a;
  --egat-blue-hover: #004a7d;
  --mae-moh-amber: #f0b323;
  --mae-moh-amber-hover: #d99c12;
  --operations-green: #1f7a4d;
  --alert-rose: #b42318;
  --console-navy: #0f2747;

  /* Surfaces & Backgrounds */
  --surface-white: #ffffff;
  --surface-mist: #f2f6fa;
  --surface-muted: #edf2f7;
  --border-default: #e2e8f0;

  /* Text Colors */
  --text-primary: #0f2747;
  --text-secondary: #475569;
  --text-muted: #64748b;

  /* Radius */
  --radius: 0.75rem;
}

/* Dark Mode Tokens (Option) */
.dark {
  --surface-white: #1e293b;
  --surface-mist: #0f172a;
  --surface-muted: #334155;
  --border-default: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --console-navy: #f8fafc;
}

body {
  background-color: var(--surface-mist);
  color: var(--text-primary);
  font-family: 'Prompt', 'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Accessibility Focus Ring */
:focus-visible {
  outline: 2px solid var(--mae-moh-amber);
  outline-offset: 2px;
}
```

---

## 6. 🧩 ตัวอย่างชิ้นส่วน UI มาตรฐาน (Core UI Components)

### 6.1 แถบเมนูด้านข้าง (Sidebar Navigation Item)
* หน้าปัจจุบัน (Active): มีแถบข้างสีเหลือง `border-l-4 border-[#f0b323]`, พื้นหลัง `bg-[#edf2f7]`, ตัวหนังสือสีเข้ม และไอคอนสีฟ้า `text-[#005b9a]`
* หน้าปกติ (Inactive): พื้นโปร่งใส, ตัวหนังสือสีเทา `text-slate-600`, Hover แล้วเปลี่ยนเป็นฟ้าอ่อน

```tsx
<a 
  href="/dashboard"
  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-l-4 border-[#f0b323] bg-[#edf2f7] font-semibold text-[#0f2747] transition-colors"
>
  <LayoutDashboard className="w-5 h-5 text-[#005b9a]" />
  <span>ภาพรวมงานซ่อมบำรุง</span>
  <span className="ml-auto w-2 h-2 rounded-full bg-[#f0b323]" />
</a>
```

### 6.2 การ์ดหัวข้อหน้า (Page Header with Accent Border)
* หัวการ์ดมีขอบล่างเส้นหนาสีเหลืองอำพัน 3px (`border-b-[3px] border-b-[#f0b323]`) เพื่อระบุเอกลักษณ์ กฟผ.

```tsx
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200 border-b-[3px] border-b-[#f0b323] shadow-sm mb-6">
  <div>
    <div className="flex items-center gap-2.5">
      <h1 className="text-2xl font-bold text-[#0f2747]">ระบบจัดการใบสั่งงานซ่อม (Shop Order)</h1>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        พร้อมใช้งาน
      </span>
    </div>
    <p className="text-sm text-slate-500 mt-1">
      กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ • อัปเดตข้อมูลอัตโนมัติจากฐานข้อมูลกลาง
    </p>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2.5">
    <button className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
      รีเฟรชข้อมูล
    </button>
    <button className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#005b9a] text-white hover:bg-[#004a7d] shadow-sm transition">
      + สร้างรายการใหม่
    </button>
  </div>
</div>
```

### 6.3 การ์ดสถิติ (KPI Summary Card)

```tsx
<div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">งานซ่อมสะสมทั้งหมด</span>
    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#005b9a] flex items-center justify-center">
      <Wrench className="w-4 h-4" />
    </div>
  </div>
  <div className="mt-4">
    <div className="text-3xl font-bold text-[#0f2747] tracking-tight">1,248 <span className="text-sm font-normal text-slate-500">รายการ</span></div>
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="font-semibold text-emerald-600">↑ 12%</span>
      <span className="text-slate-400">เทียบกับเดือนที่แล้ว</span>
    </div>
  </div>
</div>
```

### 6.4 ป้ายสถานะ (Status Badges)

```tsx
{/* สำเร็จ / ปกติ */}
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
  <CheckCircle2 className="w-3.5 h-3.5" /> เสร็จสมบูรณ์
</span>

{/* รอดำเนินการ / In-Progress */}
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
  <Clock className="w-3.5 h-3.5" /> กำลังดำเนินการ
</span>

{/* เกิดปัญหา / ล่าช้า */}
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
  <AlertTriangle className="w-3.5 h-3.5" /> เกินกำหนด
</span>
```

### 6.5 ตารางข้อมูลปฏิบัติการ (Operational Data Table)

```tsx
<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-slate-700">
      <thead className="bg-[#f8fafc] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-[#0f2747]">
        <tr>
          <th className="px-4 py-3.5">เลขที่ใบสั่ง</th>
          <th className="px-4 py-3.5">รายการอุปกรณ์ / เครื่องจักร</th>
          <th className="px-4 py-3.5">แผนกที่รับผิดชอบ</th>
          <th className="px-4 py-3.5">สถานะ</th>
          <th className="px-4 py-3.5 text-right">การจัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        <tr className="hover:bg-slate-50/80 transition-colors">
          <td className="px-4 py-3 font-semibold text-[#005b9a]">WO-2026-0042</td>
          <td className="px-4 py-3">ซ่อมบำรุงปั๊มหล่อเย็นหน่วยที่ 10</td>
          <td className="px-4 py-3 text-slate-600">W11 (เครื่องกล)</td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              เสร็จสมบูรณ์
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <button className="text-xs font-semibold text-[#005b9a] hover:underline">ดูรายละเอียด</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 7. 🤖 Master Prompt สำหรับสั่ง AI สร้างเว็บใหม่ตามธีมนี้ทันที

> **วิธีใช้งาน:** สามารถ Copy ข้อความในกล่องด้านล่างนี้ ไปใส่ใน **v0.dev, Cursor, Windsurf, Bolt.new, Lovable หรือ Claude Code** เพื่อให้ AI ออกแบบเว็บใหม่ในสไตล์และมาตรฐานเดียวกับระบบนี้ทันที

```markdown
You are an expert Frontend Architect. Please build a modern, high-performance web application following the "EGAT Operations Console Design System".

### Design & Visual Guidelines:
1. **Mood & Tone:** Professional Industrial Operations Console. Light-first theme, clean, high-contrast, dense and scannable for operational engineers.
2. **Color Palette:**
   - Primary Brand: EGAT Blue (`#005B9A`, Hover `#004A7D`)
   - Accent & Active Indicator: Mae Moh Amber (`#F0B323`, Hover `#D99C12`)
   - Heading & Text Dark: Console Navy (`#0F2747`)
   - Page Background: Surface Mist (`#F2F6FA` or `#F8FAFC`)
   - Cards & Tables: Solid White (`#FFFFFF`) with subtle border (`#E2E8F0`)
   - Statuses: Emerald (`#1F7A4D` for Done), Amber (`#F59E0B` for Pending), Rose (`#B42318` for Error)
3. **Typography:** Prompt / Sarabun / Inter with Thai font fallbacks. Numbers in clean monospace/tabular figures.
4. **Layout Structure:**
   - Left Sidebar (w-60) with EGAT Blue active items, amber left-bar indicator (`border-l-4 border-[#F0B323]`).
   - Page Header with `border-b-[3px] border-b-[#F0B323]`, clear breadcrumb/status badge, and action buttons.
   - Dense, readable data tables with sticky headers and clean hover rows.
   - Concise KPI summary cards with icon pills.
5. **Rules:**
   - NO distracting neon glows or dark mode overload unless toggled.
   - Maintain strict WCAG AA color contrast.
   - Use Lucide icons with strokeWidth={2}.
```

---
*เอกสารนี้รวบรวมและจัดระเบียบตามมาตรฐานดีไซน์ กฟผ. W10 Dashboard สำหรับนำไปขยายผลในระบบอื่น ๆ*
