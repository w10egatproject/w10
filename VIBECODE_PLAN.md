# แผนแม่บทและพิมพ์เขียวสำหรับ Vibe Code (Master Prompt & Showcase Website Blueprint)
## โครงงาน: W10 Dashboard — Showcase & Portfolio Website
**จัดทำสำหรับ:** นักศึกษาสาขาเทคโนโลยีสารสนเทศ (IT) วิทยาลัยเทคนิคลำปาง  
**การนำไปใช้งาน:** ใช้เป็น Master Prompt และ Blueprint สำหรับสร้างเว็บไซต์ Showcase ด้วยเครื่องมือ AI เช่น **v0.dev, Bolt.new, Lovable.dev, Cursor, Windsurf, Claude Code**

---

## สารบัญ (Table of Contents)
1. [ส่วนที่ 1: One-Click Master Prompt สำหรับ AI Generator](#ส่วนที่-1-one-click-master-prompt-สำหรับ-ai-generator)
2. [ส่วนที่ 2: ระบบการออกแบบและธีม (Design System & Theme)](#ส่วนที่-2-ระบบการออกแบบและธีม-design-system--theme)
3. [ส่วนที่ 3: โครงสร้างและเนื้อหาอย่างละเอียดทุก Section (Section-by-Section Blueprint)](#ส่วนที่-3-โครงสร้างและเนื้อหาอย่างละเอียดทุก-section-section-by-section-blueprint)
   * [Navbar: Sticky Header พร้อมเมนูเลือกโปรเจกต์อื่น](#navbar-sticky-navigation--project-switcher)
   * [Section 1: Hero Section (เปิดตัวโครงการ & KPIs เด่น)](#section-1-hero-section)
   * [Section 2: Problem & Solution (ปัญหาเดิม vs นวัตกรรมใหม่)](#section-2-problem--solution-statement)
   * [Section 3: System Architecture & Tech Stack (สถาปัตยกรรม 4 เลเยอร์)](#section-3-system-architecture--interactive-tech-stack)
   * [Section 4: AI in Development Journey (การใช้ AI ในการพัฒนาครบวงจร) ⭐ ไฮไลท์พิเศษ](#section-4-ai-in-development-journey--engineering-showcase--ไฮไลท์)
   * [Section 5: 7 Core Modules Interactive Showcase (เจาะลึก 7 โมดูล)](#section-5-7-core-modules-interactive-showcase)
   * [Section 6: Testing & Software Quality (ผลทดสอบ 270 Tests 100% Pass)](#section-6-testing--software-quality-assurance)
   * [Section 7: Business Value & Impact (คุณค่าที่ กฟผ. ได้รับ)](#section-7-business-value--impact)
   * [Footer: ข้อมูลผู้จัดทำ, วิทยาลัย, กฟผ. และลิงก์สำคัญ](#footer-rich-footer)
4. [ส่วนที่ 4: ตัวอย่างโค้ดคอมโพเนนต์หลัก (React + Tailwind CSS Implementation Code)](#ส่วนที่-4-ตัวอย่างโค้ดคอมโพเนนต์หลัก-react--tailwind-css)

---

# ส่วนที่ 1: One-Click Master Prompt สำหรับ AI Generator
> **วิธีใช้:** คัดลอกข้อความในบล็อก Prompt ด้านล่างนี้ทั้งหมด แล้วนำไปวางใน **v0.dev**, **Bolt.new**, **Lovable.dev** หรือส่งให้ **Cursor / Windsurf / Claude Code** เพื่อสร้างเว็บไซต์ Showcase แบบ Single-Page ได้ทันทีในคลิกเดียว

```markdown
Build a world-class, modern, interactive Single-Page Portfolio & Project Showcase Website for an IT Internship Engineering Project titled "W10 Dashboard" developed for EGAT (Electricity Generating Authority of Thailand - กฟผ. โรงไฟฟ้าแม่เมาะ กองบำรุงรักษา W10).

Target Audience: IT Academic Committee, Professors, Engineers, and Tech Recruiters.
Language: Thai (with standard English technical terms).
Style: Premium Enterprise Dark/Light Mode with EGAT Navy (#0f2b48) & Electric Gold (#d4a300 / #f59e0b) accents, Glassmorphism cards, smooth scrolling, Lucide icons, Framer Motion animations, interactive tabs, filters, and metric counters.

### Key Sections to include in the single page:
1. **Sticky Glassmorphic Navbar:**
   - Brand logo with EGAT & IT badges + Project Title "W10 Dashboard".
   - Smooth-scroll anchor links: [ภาพรวม, ปัญหา/ทางออก, สถาปัตยกรรม, การใช้ AI, 7 โมดูล, การทดสอบ, ประโยชน์].
   - "Other Projects (โครงงานอื่น ๆ)" Dropdown menu showing:
     * 1. W10 Dashboard (Active - Current Project)
     * 2. BEML Inventory Smart Tracker (IoT/Sheet Sync)
     * 3. EGAT Maintenance Form Mobile Web
     * 4. View GitHub Repository / Portfolio Link
   - Theme Toggle (Dark/Light) & "ดูสไลด์นำเสนอ" CTA Button.

2. **Hero Section:**
   - Badge: "IT Cooperative Education Project @ EGAT Mae Moh"
   - Heading: "ระบบแดชบอร์ดติดตามงานซ่อมบำรุงและจัดซื้อจัดจ้าง กองบำรุงรักษา W10"
   - Subheading: Next.js 16 + Google Sheets & Drive API + Direct Resumable Upload
   - Quick Stat Counter Cards:
     * 270 Tests Passed (100%)
     * < 5s Data Access Time (from 30 mins)
     * 7 Operational Modules
     * 0-Byte Serverless Direct Upload
   - Interactive Live Demo Preview / Dashboard Mockup Card with glowing border.

3. **Problem vs Solution (Before / After Transformation):**
   - Side-by-side comparison cards:
     * BEFORE (ความท้าทายเดิม): ข้อมูลกระจัดกระจายในชีตหลายไฟล์, ไร้ระบบ Shop Order CRUD, ไฟล์แนบหลุด/สิทธิ์ผิดพลาด, คำนวณ OT สับสน
     * AFTER (โซลูชันใหม่): Single Source of Truth รวมในที่เดียว, Full CRUD + Direct Upload 10MB, แยกสิทธิ์ OAuth Least Privilege, แยก OT พนักงาน/ลูกจ้างเด็ดขาด 100%

4. **System Architecture & Tech Stack:**
   - Interactive 4-Layer Architecture Diagram (Presentation UI, Next.js Serverless API, Cloud Data / Google Sheets, Cloud Storage / Google Drive OAuth 2.0).
   - Tech Stack Filterable Tabs: [Frontend & UI, Backend & APIs, Storage & Security, DevOps & QA] with badges for Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Vitest, Google Cloud APIs.

5. **AI in Development Journey (การใช้ AI ในการช่วยทำโปรเจคแบบครบวงจร) - ⭐ KEY HIGHLIGHT:**
   - Visual timeline & cards showing 3 AI-Assisted Pillars:
     A. End-to-End SDLC Acceleration: System Architecture design, API data contracts, generating 270 unit test suites with Vitest, and AI Pair Programming / Agentic Coding workflows.
     B. Deep Technical Problem Solving:
        - Solving Vercel 4.5MB payload limit by co-designing Zero-Byte Server Resumable Upload directly from browser to Google Drive.
        - Two-tier security isolation (Service Account for Sheets vs OAuth 2.0 Scope drive.file for Drive).
        - Thai Google Sheets dynamic parser & data normalization layer.
     C. Productivity & Human-in-the-Loop:
        - 70% reduction in development time.
        - Iterative prompt engineering, strict code review, and automated QA gates.

6. **7 Core Modules Interactive Showcase:**
   - Interactive Tab / Grid Switcher to explore each module with features, screenshot mockup placeholder, and tech highlights:
     1. Overview Dashboard (KPIs, W11-W14 breakdown, Year/Month filter)
     2. Shop Order System (Full CRUD, 10MB PDF/Image Direct Upload, Lightbox Modal)
     3. Purchasing Dashboard (PR/PO lifecycle tracking, department budget)
     4. Purchasing All (Advanced search, pagination, multi-column sorting)
     5. Overtime (OT) Summary & ETAS Data (Employee vs Contractor segregation)
     6. BEML Inventory (Heavy machinery spare parts stock tracking)
     7. Consumables Inventory (Consumable tools & daily maintenance supplies)

7. **Software Testing & Quality Assurance:**
   - Vitest test report terminal card: 270 passed, 25 test files, strict TypeScript 0 errors, production build verified.
   - Quality metrics: Type Safety, Security least-privilege, Soft delete 30-day trash retention.

8. **Business Value & Impact on EGAT:**
   - Quantitative & Qualitative impact cards (Time savings, 0% OT calculation error, Zero database licensing costs utilizing existing Google Workspace).

9. **Rich Footer:**
   - Developer Bio, Student ID, IT Department, Lampang Technical College, EGAT Mae Moh W10 Division.
   - Quick links, Tech badges, Project Copyright 2026.

Ensure all text is formatted with clean typography, elegant card borders, subtle gradient backgrounds, smooth hover transitions, and fully responsive across mobile, tablet, and widescreen.
```

---

# ส่วนที่ 2: ระบบการออกแบบและธีม (Design System & Theme)

### โทนสีหลัก (Color Palette - สอดคล้องกับองค์กร กฟผ. และเทคโนโลยีสมัยใหม่)
| สี | HEX Code | CSS Variable | การนำไปใช้งาน |
| :--- | :--- | :--- | :--- |
| **EGAT Navy** | `#0f2b48` | `--color-egat-navy` | สีพื้นหลัง Navbar, Hero Accent, ส่วนหัวตาราง |
| **Electric Gold** | `#f59e0b` / `#d4a300` | `--color-egat-gold` | สีเน้นปุ่ม CTA, สถานะสำเร็จ, Icon Highlights |
| **Tech Cyan / Sky** | `#0284c7` / `#38bdf8` | `--color-tech-cyan` | สีลิงก์, Glow Effects, Subtitles, Badges |
| **Dark Slate (BG)** | `#0b1120` / `#0f172a` | `--color-dark-bg` | พื้นหลังเว็บโหมด Dark Theme (Modern Tech) |
| **Card Surface** | `#1e293b` (Dark) / `#f8fafc` (Light) | `--color-card-bg` | พื้นหลังการ์ดเนื้อหา พร้อมกรอบ Glassmorphism |
| **Success Emerald** | `#10b981` | `--color-success` | เครื่องหมายผ่านการทดสอบ (270 Tests Pass) |

### แบบอักษร (Typography)
* **ภาษาไทยและอังกฤษ:** `Prompt`, `Sarabun`, หรือ `Inter` ร่วมกับ `system-ui`
* **ตัวเลขและโค้ด:** `JetBrains Mono` หรือ `Consolas`

---

# ส่วนที่ 3: โครงสร้างและเนื้อหาอย่างละเอียดทุก Section

---

### Navbar: Sticky Navigation & Project Switcher

```
+---------------------------------------------------------------------------------------------------------------+
| [⚡ W10 Dashboard]   ภาพรวม   ปัญหา/ทางออก   สถาปัตยกรรม   การใช้ AI   7 โมดูล   ผลทดสอบ   [📂 โครงงานอื่น ▼]  [🌙] |
+---------------------------------------------------------------------------------------------------------------+
```

* **แบรนด์และโลโก้:**
  * โลโก้ กฟผ. + ไอคอนสายฟ้าสีทอง `W10 Dashboard`
  * ป้ายกำกับเล็ก: `IT Internship Project @ EGAT`
* **เมนูนำทาง (Smooth Scroll Anchor Links):**
  * `ภาพรวม` (`#overview`)
  * `ปัญหา & ทางออก` (`#problem-solution`)
  * `สถาปัตยกรรม & Tech` (`#architecture`)
  * `การใช้ AI พัฒนา` (`#ai-story`) ⭐
  * `7 โมดูลหลัก` (`#modules`)
  * `การทดสอบ & ผลลัพธ์` (`#results`)
* **เมนูเลือกโปรเจกต์อื่น (Other Projects Dropdown Switcher):**
  * เมื่อคลิกจะแสดง Dropdown รายการผลงานฝึกงานอื่น ๆ:
    1. 🟢 **W10 Dashboard (โปรเจกต์นี้):** ระบบแดชบอร์ดงานซ่อมบำรุงและจัดซื้อจัดจ้าง
    2. 📦 **BEML Smart Inventory Tracker:** ระบบติดตามคลังพัสดุและแจ้งเตือนอะไหล่ใกล้หมด
    3. 📱 **EGAT Maintenance Mobile Web Form:** เว็บแอปบันทึกใบสั่งงานซ่อมผ่านมือถือหน้างาน
    4. 🔗 **GitHub Repository / Developer Portfolio:** ลิงก์ไปยังโปรไฟล์รวมผลงาน
* **ปุ่ม Action:** ปุ่มสลับธีม (Light/Dark Mode Toggle) และปุ่ม `📄 สรุปข้อมูลพรีเซ็นต์`

---

### Section 1: Hero Section

* **Badge:** `🎓 โครงงานสหกิจศึกษา / ฝึกประสบการณ์วิชาชีพ • สาขาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคลำปาง`
* **Headline:**
  # ระบบแดชบอร์ดติดตามงานซ่อมบำรุงและจัดซื้อจัดจ้าง
  ### กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ หน่วยที่ 10 (W10), กฟผ.
* **Sub-headline:**
  นวัตกรรมเว็บแดชบอร์ดศูนย์กลางที่รวมข้อมูลงานซ่อมบำรุง การจัดซื้อจัดจ้าง คลังอะไหล่ และสรุปเวลาทำงานล่วงเวลา (OT) พัฒนาด้วย Next.js 16, Google Cloud APIs และสถาปัตยกรรม Zero-Byte Resumable Upload
* **4 Stat Counter Cards (ตัวเลขเด่น):**
  1. **270 Tests (100% Pass)** — การทดสอบ Unit Test ครอบคลุมทุก Business Logic
  2. **< 5 วินาที** — เข้าถึงข้อมูลงานซ่อมบำรุงแบบ Real-time จากเดิม 15-30 นาที
  3. **7 โมดูลปฏิบัติการ** — ครอบคลุมงานซ่อม, จัดซื้อ, พัสดุ, และ OT แยกแผนก W11-W14
  4. **0-Byte Serverless Upload** — อัปโหลดไฟล์ตรงเข้า Google Drive Bypass Vercel 4.5MB Limit
* **Hero Visual:** Mockup Card แสดงหน้าแดชบอร์ดจริง พร้อม Animation คลื่นแสง Glowing Effect

---

### Section 2: Problem & Solution Statement

* **หัวข้อส่วน:** `เปรียบเทียบการเปลี่ยนแปลง (The Transformation)`
* **เนื้อหาเปรียบเทียบ 4 มิติ:**

| มิติการทำงาน | สภาพปัญหาเดิม (Before / Pain Points) ❌ | โซลูชันใหม่ด้วย W10 Dashboard (After) ✅ |
| :--- | :--- | :--- |
| **การรวมศูนย์ข้อมูล** | ข้อมูลกระจายตัวอยู่ใน Google Sheets หลายสิบไฟล์ เปิดดูยาก เสียเวลาค้นหา 15-30 นาที | **Single Source of Truth** รวม 7 แดชบอร์ดในที่เดียว ดึงข้อมูลผ่าน API แสดงผลใน < 5 วินาที |
| **ระบบใบสั่งซ่อม (Shop Order)** | ใช้ Google Form หรือจดกระดาษ ไม่มีหน้าแก้ไข/ลบ (CRUD) ค้นหาย้อนหลังยาก | **Full CRUD Web Application** เพิ่ม แก้ไข ค้นหา กรองสถานะ และอัปเดตงานแบบ Real-time |
| **การแนบไฟล์/แบบงาน** | ไฟล์แนบสูญหาย ลิงก์ Drive เข้าถึงไม่ได้ หรือไฟล์ปะปนกับโฟลเดอร์ส่วนตัว | **Direct Resumable Upload** แนบ PDF/รูปได้สูงสุด 10MB เก็บในโฟลเดอร์โครงการเฉพาะ พร้อม Lightbox ดูภาพ |
| **การคำนวณ OT** | ข้อมูลพนักงานและลูกจ้างเหมาปะปนกัน เสี่ยงต่อการคิดยอดตกหล่นหรือผิดระเบียบ | **Strict Data Segregation** แยกหน้าสรุป OT พนักงาน และ OT ลูกจ้าง พร้อมตารางเทียบเวลา ETAS 100% |

---

### Section 3: System Architecture & Interactive Tech Stack

* **หัวข้อส่วน:** `สถาปัตยกรรมระบบและเทคโนโลยี (System Architecture & Tech Stack)`
* **แผนภาพสถาปัตยกรรม 4 เลเยอร์ (Visual Architecture Flow):**
  1. **Client Layer (Browser):** Next.js Client Components (React 19), Tailwind CSS v4, Radix UI, Lucide Icons, Highcharts/Recharts
  2. **Application Layer (Vercel Serverless):** Next.js 16 App Router API Handlers, JWT Service Account Client, OAuth 2.0 Refresh Manager, Vercel Cron
  3. **Database Layer (Google Sheets API v4):** Data Layer เชื่อมต่อ Spreadsheets กอง W10 แบบสองทาง
  4. **Storage Layer (Google Drive API v3):** จัดเก็บไฟล์แนบใบสั่งซ่อมแบบ Least-Privilege OAuth (`drive.file`)
* **Filterable Tech Stack Badges (แบ่งตามหมวดหมู่):**
  * **Frontend:** Next.js 16.2, React 19.2, TypeScript 5, Tailwind CSS v4, shadcn/ui, Framer Motion
  * **Backend & APIs:** Next.js Serverless Routes, Googleapis v171.4, Google Sheets API v4, Google Drive API v3
  * **Testing & QA:** Vitest v4.1, Testing Library, JSDOM, ESLint 9
  * **Cloud & DevOps:** Vercel Platform, Vercel Cron Jobs, Vercel Speed Insights & Analytics

---

### Section 4: AI in Development Journey & Engineering Showcase (⭐ ไฮไลท์)

* **หัวข้อส่วน:** `บทบาทของ AI ในการพัฒนาโครงงานอย่างมืออาชีพ (AI-Assisted Software Engineering)`
* **แนวคิดหลัก:** นำเสนอการผสานพลังระหว่างนักศึกษา IT (Human Engineer) ร่วมกับ AI ในรูปแบบ **Pair Programming & Agentic Workflow** ขับเคลื่อนการพัฒนาตั้งแต่ต้นจนจบ

```
+----------------------------------------------------------------------------------------------------+
|                             AI-ASSISTED DEVELOPMENT LIFECYCLE (SDLC)                               |
+--------------------------+---------------------------------+---------------------------------------+
| 1. Architecture & Design | 2. Deep Technical Innovations   | 3. Automated QA & Workflow            |
| - ออกแบบ Data Flow       | - Zero-Byte Resumable Upload    | - สร้าง 270 Unit Tests (Vitest)       |
| - วางโครงสร้าง TypeScript| - Two-Tier OAuth/JWT Security   | - ลดเวลาพัฒนาลง 70%                   |
| - วาง Module Abstraction | - Thai Sheet Normalization      | - Human-in-the-loop Code Review       |
+--------------------------+---------------------------------+---------------------------------------+
```

* **รายละเอียด 3 เสาหลัก (3 Pillars):**

#### Pillar 1: เร่งกระบวนการ SDLC ครบวงจร (End-to-End SDLC Acceleration)
* **การวางสถาปัตยกรรม (System Architecture):** ใช้ AI ช่วยระดมความคิดและเปรียบเทียบข้อดี-ข้อเสียในการเลือกใช้ Google Sheets เป็น Database แทนการตั้งฐานข้อมูลใหม่ เพื่อให้สอดรับกับข้อจำกัดของหน่วยงาน
* **การสร้าง Type System & Data Contracts:** ใช้ AI สร้าง TypeScript Interfaces และ Domain Models ที่รัดกุม รองรับข้อมูลภาษาไทยและค่า Nullable จากชีต
* **การเขียน Unit Test แบบก้าวกระโดด:** ใช้ AI ช่วยสร้างชุดทดสอบจำลอง (Mocking Google APIs) ครอบคลุม Edge Cases จนได้ Unit Test ทั้งหมด **270 Tests (25 Test Files)** ในเวลาอันรวดเร็ว

#### Pillar 2: นวัตกรรมแก้โจทย์ยากเชิงเทคนิค (Deep Technical Problem Solving)
1. **แก้ปัญหา Vercel 4.5MB Payload Limit ด้วย Direct Resumable Upload:**
   * **โจทย์:** Vercel Serverless Function ไม่รับ Request Body เกิน 4.5MB ทำให้ผู้ใช้ไม่สามารถอัปโหลดภาพเครื่องจักรความละเอียดสูงหรือไฟล์ PDF แบบแปลนได้
   * **โซลูชันที่ AI ร่วมออกแบบ:** ให้ Next.js API ทำหน้าที่เพียงสร้าง Resumable Upload Session URL แล้วส่งกลับให้ Browser ส่งไบต์ของไฟล์ตรงเข้า Google Drive API โดยไม่ผ่าน Vercel Server (0-Byte Serverless Overhead)
2. **ออกแบบระบบความปลอดภัย 2 ชั้น (Two-Tier Least-Privilege Security):**
   * ใช้ Service Account ที่จำกัด Scope เฉพาะ `spreadsheets`
   * ใช้ OAuth 2.0 สำหรับ Drive ที่จำกัด Scope เฉพาะ `drive.file` ทำให้ระบบมองเห็นเฉพาะไฟล์ที่ตนเองสร้าง ไม่สามารถเข้าถึงไฟล์ส่วนตัวอื่นใน Google Drive ขององค์กรได้
3. **ระบบ Data Sanitization & Normalization ภาษาไทย:**
   * ใช้ AI ร่วมเขียน Parsing Engine เพื่อแปลงหัวตารางภาษาไทย, วันที่ พ.ศ./ค.ศ., และช่องว่างในเซลล์ ให้กลายเป็น Strongly-typed Object อย่างปลอดภัย 100%

#### Pillar 3: ประสิทธิภาพและกระบวนการทำงาน (Productivity & Human-in-the-Loop)
* **Speed & Productivity:** ลดระยะเวลาในการพัฒนา (Time-to-Market) ลงกว่า **70%** เมื่อเทียบกับการเขียนโค้ดแบบเดิม
* **Iterative Prompt Engineering:** วาง Prompt อย่างเป็นระบบ (Role, Context, Constraints, Few-shot Examples, Verification Rules)
* **Human-in-the-Loop Verification:** โค้ดทุกบรรทัดที่ AI สร้างขึ้นผ่านการ Review, ปรับแต่งตาม Business Logic จริงของ กฟผ., และผ่านการรัน Test เพื่อยืนยันความถูกต้องก่อน Deploy

---

### Section 5: 7 Core Modules Interactive Showcase

* **หัวข้อส่วน:** `ฟังก์ชันการทำงาน 7 โมดูลหลัก (Core Modules & Features)`
* **รูปแบบการนำเสนอ:** Interactive Tab Selector (คลิกเพื่อสลับดูรายละเอียดของแต่ละโมดูล):

1. 📊 **Module 1: Overview Dashboard (หน้าหลักภาพรวมงานซ่อมบำรุง)**
   * แสดงตัวชี้วัดสำคัญ (KPIs), สรุปจำนวนงานทั้งหมด/กำลังทำ/เสร็จสิ้น
   * กราฟแท่งเปรียบเทียบสัดส่วนงานซ่อมระหว่าง 4 แผนก (W11, W12, W13, W14)
   * ตัวกรอง Year & Month แบบไดนามิก
2. 🛠️ **Module 2: Shop Order Management (ระบบจัดการใบสั่งงานซ่อมโรงงาน)**
   * ระบบ CRUD สมบูรณ์แบบ (เพิ่ม, อ่าน, แก้ไข, ลบ)
   * แนบไฟล์ภาพ/PDF สูงสุด 10 MB ผ่าน Resumable Direct Upload
   * แสดง Thumbnail และ Image Lightbox Modal สำหรับดูภาพขยาย
3. 💰 **Module 3: Purchasing Dashboard (ระบบติดตามการจัดซื้อจัดจ้างรายแผนก)**
   * ติดตามสถานะกระบวนการจัดซื้อตั้งแต่ PR (ขออนุมัติ) จนถึง PO (ออกใบสั่งซื้อ)
   * สรุปมูลค่างบประมาณที่ใช้ไปเทียบกับงบประมาณจัดสรรรายแผนก
4. 📑 **Module 4: Purchasing All (ระบบสืบค้นรายการจัดซื้อทั้งหมด)**
   * ตารางแสดงรายการจัดซื้อพัสดุและจ้างเหมาบริการทั้งหมด
   * ระบบ Search ค้นหาตามรหัส PR/PO, ระบบ Pagination, และ Multi-column Sorting
5. ⏰ **Module 5: Overtime (OT) Summary & ETAS Data (ระบบสรุปเวลาทำงานล่วงเวลา)**
   * แยกหน้าสรุป OT พนักงานประจำ (Employee) และลูกจ้างเหมาบริการ (Contractor) เด็ดขาด
   * สรุปยอดชั่วโมง OT รายเดือน แยกกลุ่มงาน W11 - W14
   * แสดงข้อมูลสแกนเวลาเข้า-ออกงานจากระบบ ETAS เพื่อตรวจสอบความถูกต้อง
6. 🚜 **Module 6: BEML Inventory (คลังอะไหล่เครื่องจักร BEML)**
   * ติดตามสต็อกอะไหล่เครื่องจักรหนักและเครื่องขุดดิน BEML
   * ค้นหาตาม Part Number และ Location จัดเก็บในคลัง
7. 📦 **Module 7: Consumables Inventory (ระบบพัสดุสิ้นเปลืองงานซ่อม)**
   * บันทึกการรับเข้า-เบิกจ่ายวัสดุสิ้นเปลืองประจำวัน (น็อต, ใบเจียร, สารหล่อลื่น)
   * ป้องกันพัสดุขาดสต็อกในระหว่างปฏิบัติการซ่อมบำรุง

---

### Section 6: Testing & Software Quality Assurance

* **หัวข้อส่วน:** `การทดสอบและควบคุมคุณภาพซอฟต์แวร์ (Testing & Reliability)`
* **การ์ดแสดงผลการทดสอบ (Interactive Test Terminal Card):**
  * **Framework:** Vitest v4.1 + Testing Library + JSDOM
  * **Test Summary:** `✓ 270 passed in 25 test suites (100% Success)`
  * **TypeScript Strictness:** `tsc --noEmit` ผ่าน 0 Errors
  * **Build Status:** `next build` ผ่าน 100% สร้าง Static/Dynamic Routes สมบูรณ์
* **3 มาตรการรักษาความปลอดภัยและคุณภาพข้อมูล:**
  1. **Least Privilege Scope:** กำหนดสิทธิ์ Google API ขั้นต่ำ ป้องกันข้อมูลรั่วไหล
  2. **Soft Delete 30-Day Retention:** ไฟล์แนบที่ถูกลบจะย้ายเข้าถังขยะ Drive 30 วันก่อนล้างถาวร ป้องกันการลบผิดพลาด
  3. **Automated Pending Cleanup:** Cron Job ทำความสะอาดไฟล์ค้างเกิน 24 ชั่วโมงอัตโนมัติ

---

### Section 7: Business Value & Impact

* **หัวข้อส่วน:** `ผลสัมฤทธิ์และคุณค่าที่ส่งมอบให้ กฟผ. (Business Value)`
* **3 เสาหลักแห่งคุณค่า:**
  * ⏱️ **Operational Efficiency (ลดเวลาและเพิ่มประสิทธิภาพ):** ลดเวลาค้นหาข้อมูลจาก 30 นาที เหลือไม่เกิน 5 วินาที, ลดระยะเวลาส่งมอบงานสั่งซ่อมลงกว่า 40%
  * 🎯 **Data Accuracy & Governance (ความถูกต้องของข้อมูล):** ป้องกันความผิดพลาดในการคิด OT พนักงาน/ลูกจ้าง 100%, มี Single Source of Truth
  * 💡 **Cost Effectiveness (ความคุ้มค่าสูงสุด):** ใช้ประโยชน์จาก Google Workspace ของ กฟผ. เต็มประสิทธิภาพ โดยไม่ต้องลงทุนซื้อ License Database เพิ่มเติม

---

### Footer: Rich Footer

```
+---------------------------------------------------------------------------------------------------------------+
|  [⚡ W10 Dashboard]                              [เมนูนำทาง]           [เทคโนโลยีหลัก]       [สถานประกอบการ]     |
|  ระบบแดชบอร์ดติดตามงานซ่อมบำรุงและจัดซื้อจัดจ้าง        - ภาพรวมโครงการ        - Next.js 16        การไฟฟ้าฝ่ายผลิตฯ    |
|  สาขาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคลำปาง        - สถาปัตยกรรมระบบ       - React 19          โรงไฟฟ้าแม่เมาะ      |
|  โครงงานฝึกประสบการณ์วิชาชีพ ปีการศึกษา 2569       - การใช้ AI พัฒนา       - TypeScript 5      กองบำรุงรักษา W10    |
|                                                  - 7 โมดูลปฏิบัติการ     - Google APIs                            |
+---------------------------------------------------------------------------------------------------------------+
|  © 2026 W10 Dashboard Project • Information Technology Department, Lampang Technical College & EGAT Mae Moh   |
+---------------------------------------------------------------------------------------------------------------+
```

---

# ส่วนที่ 4: ตัวอย่างโค้ดคอมโพเนนต์หลัก (React + Tailwind CSS)

### 1. โค้ดคอมโพเนนต์ Navbar พร้อม Projects Dropdown (`components/Navbar.tsx`)

```tsx
import React, { useState } from 'react';
import { 
  Layers, 
  ChevronDown, 
  ExternalLink, 
  Sparkles, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Wrench, 
  Boxes 
} from 'lucide-react';

export function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const projects = [
    {
      id: 'w10',
      title: 'W10 Dashboard',
      desc: 'ระบบแดชบอร์ดงานซ่อมบำรุง & จัดซื้อ กฟผ. W10',
      tag: 'โปรเจกต์หลัก (Active)',
      active: true,
      icon: Layers,
    },
    {
      id: 'beml',
      title: 'BEML Smart Inventory',
      desc: 'ระบบติดตามอะไหล่เครื่องจักรหนักและสต็อกคงคลัง',
      tag: 'โมดูลส่วนขยาย',
      active: false,
      icon: Boxes,
    },
    {
      id: 'mobile-form',
      title: 'EGAT Maintenance WebForm',
      desc: 'เว็บฟอร์มบันทึกใบสั่งงานซ่อมผ่านมือถือหน้างาน',
      tag: 'แอปเสริมหน้างาน',
      active: false,
      icon: Wrench,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 text-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#overview" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-amber-400 font-black text-lg">⚡</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                W10 Dashboard
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                กฟผ. แม่เมาะ
              </span>
            </div>
            <p className="text-[11px] text-slate-400">IT Internship Project Showcase</p>
          </div>
        </a>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#overview" className="hover:text-amber-400 transition">ภาพรวม</a>
          <a href="#problem-solution" className="hover:text-amber-400 transition">ปัญหา/ทางออก</a>
          <a href="#architecture" className="hover:text-amber-400 transition">สถาปัตยกรรม</a>
          <a href="#ai-story" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            การใช้ AI พัฒนา
          </a>
          <a href="#modules" className="hover:text-amber-400 transition">7 โมดูล</a>
          <a href="#testing" className="hover:text-amber-400 transition">ผลทดสอบ</a>
          <a href="#impact" className="hover:text-amber-400 transition">ประโยชน์</a>
        </div>

        {/* Action Controls & Projects Dropdown */}
        <div className="flex items-center gap-3">
          
          {/* Projects Switcher Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>โครงงานอื่น ๆ</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  โครงงานทั้งหมดระหว่างฝึกงาน
                </div>
                <div className="mt-1 space-y-1">
                  {projects.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div 
                        key={p.id}
                        className={`p-2.5 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                          p.active ? 'bg-sky-500/10 border border-sky-500/30' : 'hover:bg-slate-800/70 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${p.active ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{p.title}</h4>
                            {p.active && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.desc}</p>
                          <span className="inline-block text-[9px] font-semibold text-amber-400/90 mt-1">
                            {p.tag}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 px-2 pb-1">
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs font-semibold text-sky-400 hover:text-sky-300 p-1.5 rounded-lg hover:bg-slate-800/50 transition"
                  >
                    <span>ดูผลงานบน GitHub ทั้งหมด</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 transition"
            title="สลับธีม"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* CTA Slide Link */}
          <a 
            href="#presentation-doc" 
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
          >
            เอกสารพรีเซ็นต์
          </a>
        </div>

      </div>
    </nav>
  );
}
```

---

### 2. โค้ดคอมโพเนนต์ AI Engineering Showcase (`components/AISection.tsx`)

```tsx
import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  FileCode, 
  CloudUpload 
} from 'lucide-react';

export function AISection() {
  return (
    <section id="ai-story" className="py-20 relative bg-slate-950 text-slate-100 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Assisted Software Engineering
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            การนำ AI มาประยุกต์ใช้ในการพัฒนาโปรเจกต์
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            ผสานพลังระหว่างการคิดเชิงวิศวกรรมของนักศึกษา IT (Human Intent) ร่วมกับ AI Agentic Coding ในการเร่งสปีดการพัฒนา แก้โจทย์ข้อจำกัดคลาวด์ และสร้างชุดทดสอบอัตโนมัติ 270 เคส
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 transition duration-300 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Pillar 01 • Architecture</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">เร่งวงจรพัฒนา SDLC ครบวงจร</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                ใช้ AI ในการ Pair Programming ช่วยออกแบบ Domain Contracts, Interface ภาษาไทย และเขียน TypeScript Data Adapters เชื่อมต่อ Google Sheets API
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>ลดเวลาพัฒนาลงกว่า 70%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>โครงสร้าง TypeScript Strict Mode 100%</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              Next.js 16 + Google Cloud SDK
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl p-6 bg-slate-900/70 border border-amber-500/30 hover:border-amber-500/60 transition duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase rounded-bl-xl">
              Key Innovation
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <CloudUpload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pillar 02 • Deep Tech</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">ทลายข้อจำกัด Vercel 4.5MB</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                ร่วมคิดค้นสถาปัตยกรรม <strong className="text-amber-300">Zero-Byte Server Resumable Upload</strong> โดยเบราว์เซอร์ขอ Session จาก API แล้วยิงตรงเข้า Google Drive Bypass เพดาน Serverless
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>อัปโหลดไฟล์แบบแปลน/ภาพได้ถึง 10 MB</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>OAuth 2.0 Scope Isolation ปลอดภัยสูงสุด</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              Resumable Upload Protocol
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pillar 03 • Quality & QA</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">สร้าง 270 Unit Tests บน Vitest</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                ใช้ AI สร้างชุดทดสอบอัตโนมัติ Mocking Google APIs, ตรวจสอบ Validation กฎของไฟล์ และทดสอบกรณี Edge Cases ทุกจุด
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>ผ่าน 270 Tests (25 Test Files) 100%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Human-in-the-loop Code Review เข้มงวด</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              Vitest + Testing Library
            </div>
          </div>

        </div>

        {/* AI Workflow Banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-amber-950/30 border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <h4 className="text-base font-bold text-white flex items-center justify-center lg:justify-start gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              กระบวนการทำงานแบบ Human-in-the-loop + Agentic Coding
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              1. วิเคราะห์โจทย์งานจริง กฟผ. → 2. สั่งการ Prompt พร้อม Context & Constraints → 3. AI สร้างโซลูชัน & โค้ด → 4. นักศึกษา Review & รัน Vitest ตรวจสอบ → 5. Production Deploy
            </p>
          </div>
          <div className="flex-shrink-0">
            <a 
              href="#testing" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition shadow-lg"
            >
              <span>ดูผลตรวจ 270 Tests</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
```

---

### 3. โค้ดคอมโพเนนต์ Footer (`components/Footer.tsx`)

```tsx
import React from 'react';
import { Layers, GraduationCap, Building2, Github, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-sky-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center text-amber-400 font-bold">
                  ⚡
                </div>
              </div>
              <span className="font-bold text-sm text-white">W10 Dashboard</span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400">
              ระบบแดชบอร์ดศูนย์กลางสำหรับติดตามงานซ่อมบำรุง การจัดซื้อจัดจ้าง และการทำงานล่วงเวลา (OT) กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ หน่วยที่ 10 (W10) กฟผ.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>โครงงานฝึกประสบการณ์วิชาชีพ IT 2569</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">ส่วนสำคัญในหน้าเว็บ</h4>
            <ul className="space-y-2.5 text-[12px]">
              <li><a href="#overview" className="hover:text-amber-400 transition">ภาพรวมโครงงาน (Hero & KPIs)</a></li>
              <li><a href="#problem-solution" className="hover:text-amber-400 transition">เปรียบเทียบปัญหา vs ทางออก</a></li>
              <li><a href="#architecture" className="hover:text-amber-400 transition">สถาปัตยกรรม & Tech Stack</a></li>
              <li><a href="#ai-story" className="text-amber-400 hover:text-amber-300 font-semibold transition">การใช้ AI ในการพัฒนา (AI Story)</a></li>
              <li><a href="#modules" className="hover:text-amber-400 transition">เจาะลึก 7 โมดูลปฏิบัติการ</a></li>
              <li><a href="#testing" className="hover:text-amber-400 transition">ผลการทดสอบ 270 Tests</a></li>
            </ul>
          </div>

          {/* Col 3: Tech Stack Badges */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">เทคโนโลยีหลัก</h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Next.js 16</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">React 19</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">TypeScript 5</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Tailwind CSS v4</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Google Sheets API</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Google Drive OAuth</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Vitest (270 Tests)</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Vercel Serverless</span>
            </div>
          </div>

          {/* Col 4: Organizations */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">ความร่วมมือ</h4>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>กฟผ. โรงไฟฟ้าแม่เมาะ</span>
              </div>
              <p className="text-[11px] text-slate-400">กองบำรุงรักษา W10 (W11, W12, W13, W14)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>วิทยาลัยเทคนิคลำปาง</span>
              </div>
              <p className="text-[11px] text-slate-400">แผนกวิชาเทคโนโลยีสารสนเทศ (IT)</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 W10 Dashboard Project. Developed by IT Student, Lampang Technical College.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              Built with AI & <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for EGAT Mae Moh
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
```
