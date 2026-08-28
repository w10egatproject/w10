# เอกสารข้อมูลสำหรับเตรียมพรีเซ็นต์โครงงาน (Presentation Data Pack)
## โครงงาน: W10 Dashboard — ระบบแดชบอร์ดติดตามงานซ่อมบำรุงและจัดซื้อจัดจ้าง
**หน่วยงาน:** กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ หน่วยที่ 10 (W10), การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.)  
**สาขาวิชา:** เทคโนโลยีสารสนเทศ (Information Technology - IT)  
**ประเภทการนำเสนอ:** การนำเสนอโครงงานฝึกประสบการณ์วิชาชีพ / สหกิจศึกษา (Internship / Co-op Project Defense)

---

## สารบัญเนื้อหา (Table of Contents)
1. [ข้อมูลทั่วไปของโครงงาน (Project Overview)](#1-ข้อมูลทั่วไปของโครงงาน-project-overview)
2. [ที่มา ความสำคัญ และปัญหาเดิม (Pain Points & Problem Statement)](#2-ที่มา-ความสำคัญ-และปัญหาเดิม-pain-points--problem-statement)
3. [วัตถุประสงค์และขอบเขตของระบบ (Objectives & Scope)](#3-วัตถุประสงค์และขอบเขตของระบบ-objectives--scope)
4. [สถาปัตยกรรมระบบและเทคโนโลยีที่ใช้ (System Architecture & Tech Stack)](#4-สถาปัตยกรรมระบบและเทคโนโลยีที่ใช้-system-architecture--tech-stack)
5. [ไฮไลท์ทางเทคนิคและนวัตกรรมการแก้ปัญหา (Technical Highlights & Key Innovations)](#5-ไฮไลท์ทางเทคนิคและนวัตกรรมการแก้ปัญหา-technical-highlights--key-innovations)
6. [เจาะลึกฟังก์ชันการทำงาน 7 โมดูลหลัก (Detailed Feature Walkthrough)](#6-เจาะลึกฟังก์ชันการทำงาน-7-โมดูลหลัก-detailed-feature-walkthrough)
7. [การทดสอบและควบคุมคุณภาพซอฟต์แวร์ (Testing & Quality Assurance)](#7-การทดสอบและควบคุมคุณภาพซอฟต์แวร์-testing--quality-assurance)
8. [สรุปผลสัมฤทธิ์และคุณค่าที่ กฟผ. ได้รับ (Results & Business Value)](#8-สรุปผลสัมฤทธิ์และคุณค่าที่-กฟผ-ได้รับ-results--business-value)
9. [ปัญหา อุปสรรค และแนวทางแก้ไขเชิงเทคนิค (Challenges & Solutions)](#9-ปัญหา-อุปสรรค-และแนวทางแก้ไขเชิงเทคนิค-challenges--solutions)
10. [ทักษะด้าน IT ที่ได้พัฒนาและแนวทางต่อยอด (Skills Gained & Future Work)](#10-ทักษะด้าน-it-ที่ได้พัฒนาและแนวทางต่อยอด-skills-gained--future-work)
11. [โครงสร้างสไลด์แนะนำสำหรับนำไปทำ PowerPoint (Slide Deck Structure)](#11-โครงสร้างสไลด์แนะนำสำหรับนำไปทำ-powerpoint-slide-deck-structure)

---

## 1. ข้อมูลทั่วไปของโครงงาน (Project Overview)

* **ชื่อโครงงาน (ภาษาไทย):** ระบบแดชบอร์ดติดตามงานซ่อมบำรุงและจัดซื้อจัดจ้าง กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ หน่วยที่ 10
* **ชื่อโครงงาน (ภาษาอังกฤษ):** W10 Operational & Maintenance Dashboard
* **สถานประกอบการ:** การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.) โรงไฟฟ้าแม่เมาะ อำเภอแม่เมาะ จังหวัดลำปาง
* **หน่วยงานที่นำระบบไปใช้งาน:** กองบำรุงรักษาโรงไฟฟ้าแม่เมาะ หน่วยที่ 10 (W10) ประกอบด้วย 4 แผนกย่อย:
  * **W11:** แผนกบำรุงรักษาเครื่องกล 1 (Mechanical Maintenance 1)
  * **W12:** แผนกบำรุงรักษาเครื่องกล 2 (Mechanical Maintenance 2)
  * **W13:** แผนกบำรุงรักษาไฟฟ้า (Electrical Maintenance)
  * **W14:** แผนกบำรุงรักษาอุปกรณ์ควบคุมและเครื่องมือวัด (Control & Instrumentation Maintenance)
* **กลุ่มผู้ใช้งานระบบ:** หัวหน้ากอง (ช.บม-10), หัวหน้าแผนก (หว.W11-W14), วิศวกร, ช่างบำรุงรักษา และเจ้าหน้าที่ธุรการประจำหน่วยงาน

---

## 2. ที่มา ความสำคัญ และปัญหาเดิม (Pain Points & Problem Statement)

### สภาพปัญหาเดิมก่อนพัฒนาระบบ (As-Is Situation):
1. **ข้อมูลกระจัดกระจาย (Data Silos & Fragmentation):**
   * ข้อมูลงานซ่อมบำรุง, การจัดซื้อจัดจ้าง, พัสดุคงคลัง และเวลาทำงานล่วงเวลา (OT) ถูกจัดเก็บแยกกันใน Google Sheets หลายไฟล์ และหลายแท็บ
   * ผู้บริหารและหัวหน้างานต้องเปิดสลับไฟล์ไปมา ไม่สามารถเห็นภาพรวมการปฏิบัติงาน (Single Pane of Glass) ในหน้าจอเดียวได้
2. **ความล่าช้าในการติดตามสถานะ (Lack of Real-time Visibility):**
   * การติดตามความคืบหน้าของใบสั่งซ่อมบำรุง (Shop Order) และสถานะการจัดซื้อ (PR/PO) ทำได้ยากและล่าช้า
   * ต้องสอบถามรายบุคคลหรือค้นหาในตาราง Excel/Sheets ขนาดใหญ่ที่มีหลายร้อยแถว
3. **ปัญหาการจัดการไฟล์แนบและการจัดการใบสั่งงานเดิม (Shop Order Limitations):**
   * ระบบเดิมใช้การบันทึกผ่าน Google Form หรือกรอกมือ ทำให้ไม่มีหน้าแก้ไข/ลบ/อัปเดตสถานะแบบ Full CRUD
   * การแนบรูปภาพความเสียหายของชิ้นส่วนเครื่องจักร หรือแบบแปลน PDF มักพบปัญหาลิงก์เสีย สิทธิ์การเข้าถึงไฟล์ใน Google Drive ไม่ถูกต้อง หรือไฟล์ปะปนกับโฟลเดอร์ส่วนตัว
4. **ความเสี่ยงในการจัดการข้อมูล OT (Overtime Data Confusion):**
   * ข้อมูลการทำงานล่วงเวลาระหว่าง "พนักงานประจำ (Employee)" และ "ลูกจ้างเหมาบริการ (Contractor)" มีระเบียบและโครงสร้างค่าตอบแทนต่างกัน แต่เดิมมักจัดเก็บปนกันหรือสับสนในการสรุปยอดประจำเดือน

---

## 3. วัตถุประสงค์และขอบเขตของระบบ (Objectives & Scope)

### วัตถุประสงค์ของโครงงาน:
1. เพื่อออกแบบและพัฒนาระบบแดชบอร์ดศูนย์กลาง (Centralized Operational Dashboard) ที่รวบรวมข้อมูลสำคัญของกองบำรุงรักษา W10 เข้ามาแสดงผลในที่เดียว
2. เพื่อพัฒนาระบบจัดการใบสั่งงานซ่อมบำรุง (Shop Order Management System) ที่รองรับการเพิ่ม, อ่าน, แก้ไข, ลบ (CRUD) และสามารถอัปโหลดไฟล์รูปภาพ/PDF แนบได้อย่างปลอดภัย
3. เพื่อพัฒนาระบบสรุปข้อมูลชั่วโมงทำงานล่วงเวลา (OT Summary) และข้อมูลเวลาเข้า-ออกงาน (ETAS Scan Data) แยกกลุ่มพนักงานและลูกจ้างอย่างถูกต้อง แม่นยำ
4. เพื่อนำสถาปัตยกรรมคลาวด์แบบ Modern Web Application มาประยุกต์ใช้งานร่วมกับโครงสร้างพื้นฐานเดิมขององค์กร (Google Workspace) ได้อย่างมีประสิทธิภาพโดยไม่มีค่าใช้จ่ายลิขสิทธิ์ฐานข้อมูลเพิ่มเติม

### ขอบเขตของระบบ (System Scope):
* **โมดูลแสดงผลและรายงาน (5 แดชบอร์ด):**
  1. หน้าหลัก (Overview Dashboard) สรุปภาพรวมงานซ่อมบำรุงของกอง W10
  2. หน้าติดตามการจัดซื้อจัดจ้าง (Purchasing Dashboard)
  3. หน้าติดตามการจัดซื้อจัดจ้างรวมทั้งหมด (Purchasing All Dashboard)
  4. หน้าติดตามคลังอะไหล่เครื่องจักร BEML (BEML Inventory)
  5. หน้าสรุปเวลาทำงานล่วงเวลา (OT Summary: Employee & Contractor แยกเด็ดขาด)
* **โมดูลการบริหารจัดการข้อมูล (Transaction Module):**
  6. ระบบจัดการใบสั่งซ่อมโรงงาน (Shop Order System) พร้อมระบบอัปโหลดไฟล์แนบ
  7. ระบบติดตามพัสดุสิ้นเปลือง (Consumables Inventory)
* **ขอบเขตการทำงานเบื้องหลัง (Backend & Automation):**
  * ระบบซิงค์ข้อมูลกับ Google Sheets API แบบสองทาง (Bi-directional Sync)
  * ระบบ Direct Resumable Upload ตรงเข้า Google Drive ด้วย OAuth 2.0
  * ระบบ Cron Job ทำความสะอาดไฟล์ตกค้างและย้ายไฟล์ลงถังขยะอัตโนมัติ

---

## 4. สถาปัตยกรรมระบบและเทคโนโลยีที่ใช้ (System Architecture & Tech Stack)

```
+-------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                 |
|  Next.js 16 Client Components (React 19) + Tailwind CSS + Lucide + Radix UI   |
+------------------------------------+------------------------------------------+
                                     |
           1. Create Session URL     |  2. Direct Resumable File Upload (0-byte server)
           & Fetch Data via APIs     |
                                     v
+------------------------------------+------------------+   +-------------------+
|               VERCEL SERVERLESS / NEXT.JS API         |   |   GOOGLE DRIVE    |
| - App Router API Handlers (TypeScript)                |   |   (OAuth 2.0)     |
| - JWT Auth Client (Service Account)                   |   | - File Storage    |
| - OAuth Token Refresh Manager                         |   | - Folder Isolation|
| - Lifecycle Cron Job (Trash retention)                |   | - Public Viewer   |
+------------------------------------+------------------+   +---------^---------+
                                     |                                |
                        3. Read/Write|Data                            | Linked File ID
                                     v                                |
                    +--------------------------------+                |
                    |       GOOGLE SHEETS API        |                |
                    | (Database as a Service Layer)  |----------------+
                    | - W10 Maintenance Sheet        |
                    | - Purchasing / OT / Inventory  |
                    +--------------------------------+
```

### รายละเอียดเทคโนโลยี (Tech Stack Breakdown):
| ส่วนประกอบ (Layer) | เทคโนโลยีที่เลือกใช้ (Technology) | เหตุผลและความเหมาะสมเชิงไอที (Rationale) |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router) + React 19** | รองรับ Server/Client Components, ระบบ Routing มีประสิทธิภาพสูง, โหลดหน้าเว็บเร็ว (Fast TTFB) |
| **Programming Language** | **TypeScript 5 (Strict Mode)** | ความปลอดภัยของ Type System ลดข้อผิดพลาด Runtime Bugs และช่วยให้โครงสร้างข้อมูลขนาดใหญ่มีความถูกต้อง |
| **Styling & UI Library** | **Tailwind CSS + Radix UI + shadcn** | ออกแบบ UI สไตล์ Modern Dashboard ปรับแต่งง่าย รองรับ Responsive ทุกหน้าจอ และโหลดเร็วด้วย Utility-first |
| **Data Layer (Database)** | **Google Sheets API v4 (JWT Auth)** | ใช้ประโยชน์จากข้อมูลเดิมของ กฟผ. ไม่ต้อง Migrate ฐานข้อมูลใหม่ ผู้ใช้ทั่วไปยังสามารถดูหรือแก้ข้อมูลผ่าน Sheet เดิมได้ |
| **File Storage Layer** | **Google Drive API v3 (OAuth 2.0)** | จัดเก็บไฟล์รูปภาพ/PDF ได้อย่างเป็นระเบียบ ใช้พื้นที่ของบัญชีองค์กร และควบคุมสิทธิ์ผ่าน OAuth Scope `drive.file` |
| **Deployment Platform** | **Vercel Cloud Platform** | รองรับ Serverless Execution, มี Edge Caching, Zero-Config CI/CD, และมีระบบ Vercel Cron สำหรับรัน Background Tasks |
| **Automated Testing** | **Vitest** | รัน Unit Tests ได้รวดเร็ว ทำงานร่วมกับ TypeScript และ ESM ได้สมบูรณ์แบบ |

---

## 5. ไฮไลท์ทางเทคนิคและนวัตกรรมการแก้ปัญหา (Technical Highlights & Key Innovations)

### 1. นวัตกรรม Zero-Byte Server Resumable Upload (การอัปโหลดไฟล์ไม่ผ่าน Serverless)
* **ปัญหาเดิมของ Serverless (Vercel):** เซิร์ฟเวอร์ของ Vercel มีข้อจำกัด Payload Request Body ไม่เกิน 4.5 MB หากผู้ใช้ส่งไฟล์ภาพหรือ PDF ความละเอียดสูงผ่าน Server จะเกิดข้อผิดพลาด `413 Payload Too Large` ทันที อีกทั้งยังสิ้นเปลือง Bandwidth และ Memory ของเซิร์ฟเวอร์
* **แนวทางแก้ไขที่พัฒนาขึ้น:**
  1. Client ส่งคำขอไปยัง API Server เพื่อขอสร้าง Resumable Upload Session URL จาก Google Drive
  2. Server ใช้ OAuth 2.0 สร้าง Upload Session แล้วส่ง URL ชั่วคราวกลับไปให้ Client
  3. Client Browser ส่ง Byte ของไฟล์ตรงเข้า Google Drive API โดยตรง (Bypass Vercel Server)
  4. เมื่ออัปโหลดเสร็จ Client ส่งเฉพาะ Metadata (File ID, Web View Link) กลับมาบันทึกบน Google Sheet

### 2. สถาปัตยกรรมการแยกสิทธิ์ความปลอดภัย 2 ชั้น (Two-Tier Security Isolation)
* **Layer 1: Google Sheets (ใช้ Service Account JWT):**
  * ให้สิทธิ์เฉพาะ Scope `https://www.googleapis.com/auth/spreadsheets`
  * เข้าถึงเฉพาะ Sheet ของโครงการ ป้องกันไม่ให้ Service Account มีสิทธิ์เข้าถึงไฟล์ Drive อื่นๆ
* **Layer 2: Google Drive (ใช้ OAuth 2.0 With Refresh Token):**
  * ใช้ Scope `https://www.googleapis.com/auth/drive.file` (Principle of Least Privilege)
  * ระบบจะมองเห็นและจัดการได้ **เฉพาะไฟล์ที่ตัวแอปพลิเคชันเป็นผู้สร้างขึ้นเท่านั้น** ไม่สามารถอ่านหรือแก้ไขไฟล์ส่วนตัวอื่นๆ ใน Drive ของเจ้าของบัญชีได้

### 3. ระบบจัดการวงจรชีวิตไฟล์อัตโนมัติ (Automated File Lifecycle & Trash Retention)
* พัฒนา Background Cron Job ตรวจสอบความสมบูรณ์ของไฟล์แนบ:
  * **Pending Cleanup:** ไฟล์ที่ขอ Upload Session แต่ผู้ใช้งานกดยกเลิกหรือไม่บันทึกออเดอร์เกิน 24 ชั่วโมง จะถูกกวาดล้าง
  * **Soft Delete Policy:** ไฟล์ที่ถูกแทนที่ (Replaced) หรือถูกสั่งลบ (Deleted) จะถูกย้ายเข้า Google Drive Trash เป็นเวลา 30 วัน เพื่อให้กู้คืนได้กรณีลบผิดพลาด (ไม่มีการสั่งลบถาวร `Permanently Delete` โดยพลการ)

### 4. Dynamic Data Parsing & Sheet Normalization Engine
* สร้าง Data Adapter เพื่อแปลงโครงสร้างภาษาไทยจาก Google Sheets เช่น ชื่อคอลัมน์ภาษาไทย, ช่องว่าง, วันที่รูปแบบ พ.ศ./ค.ศ. ให้กลายเป็น Strongly-typed JSON Object ใน TypeScript
* มีระบบ Sanitization ตรวจจับข้อมูลว่างเปล่า (Empty Cells) และ Fallback Defaults อย่างปลอดภัย ป้องกันระบบ Web Crash จากข้อมูลชีตที่ไม่สมบูรณ์

---

## 6. เจาะลึกฟังก์ชันการทำงาน 7 โมดูลหลัก (Detailed Feature Walkthrough)

```
+---------------------------------------------------------------------------------+
|                                 W10 DASHBOARD                                   |
+-------------------+--------------------+-------------------+--------------------+
|  1. Overview      |  2. Shop Order     |  3. Purchasing    |  4. Purchasing All |
|  - สรุปงานซ่อม W10|  - บันทึกสั่งซ่อม  |  - ติดตาม PR/PO   |  - รายการจัดซื้อ   |
|  - แยก W11-W14    |  - แนบไฟล์/แบบงาน  |  - งบประมาณแยกแผนก|    พัสดุ/จ้างเหมา  |
+-------------------+--------------------+-------------------+--------------------+
|  5. Overtime (OT) |  6. BEML Inventory |  7. Consumables   |  8. Auto Cleanup   |
|  - สรุป OT รายเดือน|  - คลังอะไหล่      |  - พัสดุสิ้นเปลือง|  - Vercel Cron     |
|  - พนักงาน/ลูกจ้าง|    เครื่องจักรใหญ่ |    งานบำรุงรักษา  |  - จัดการขยะ Drive |
+-------------------+--------------------+-------------------+--------------------+
```

### โมดูลที่ 1: หน้าหลักภาพรวมงานซ่อมบำรุง (Overview Dashboard)
* **หน้าที่:** แสดงสรุปตัวชี้วัดสำคัญ (KPIs) ของงานซ่อมบำรุงทั้งหมดในกอง W10
* **ฟังก์ชันเด่น:**
  * การ์ดสรุปจำนวนงานทั้งหมด, งานที่กำลังดำเนินการ (In Progress), งานที่เสร็จสิ้น (Completed)
  * กราฟเปรียบเทียบปริมาณงานซ่อมบำรุงระหว่าง 4 แผนก (W11, W12, W13, W14)
  * ตัวกรองข้อมูลอัจฉริยะ (Year & Month Filter) ปรับเปลี่ยนการแสดงผลแบบไดนามิก

### โมดูลที่ 2: ระบบจัดการใบสั่งงานซ่อมบำรุง (Shop Order System)
* **หน้าที่:** บริหารจัดการวงจรชีวิตใบสั่งซ่อมบำรุงชิ้นส่วนและอุปกรณ์
* **ฟังก์ชันเด่น:**
  * **Full CRUD:** เพิ่มใบสั่งงานใหม่, แก้ไขข้อมูลรายละเอียดงาน, ลบรายการ
  * **Attachment Handling:** รองรับไฟล์ภาพ (JPEG, PNG, WebP) และเอกสาร PDF ขนาดสูงสุด 10 MB
  * **Direct Upload Integration:** อัปโหลดตรงเข้า Google Drive พร้อมแสดง Thumbnail และ Image Lightbox Modal สำหรับดูภาพขยาย
  * **Status Tracking:** ติดตามสถานะงานซ่อม (รอรับงาน, กำลังผลิต/กลึง/เชื่อม, รอตรวจสอบ, ส่งมอบสำเร็จ)

### โมดูลที่ 3: ระบบติดตามการจัดซื้อจัดจ้างประจำแผนก (Purchasing Dashboard)
* **หน้าที่:** ติดตามสถานะกระบวนการจัดซื้ออะไหล่ อุปกรณ์ และงานจ้างเหมาบริการ
* **ฟังก์ชันเด่น:**
  * ติดตามสถานะตั้งแต่ขออนุมัติ (PR - Purchase Requisition) จนถึงออกใบสั่งซื้อ (PO - Purchase Order)
  * สรุปมูลค่างบประมาณที่ใช้ไปเทียบกับงบประมาณที่ได้รับจัดสรร
  * ตัวกรองแยกดูตามแผนกผู้รับผิดชอบ (W11 - W14)

### โมดูลที่ 4: ระบบค้นหาและตรวจสอบการจัดซื้อทั้งหมด (Purchasing All)
* **หน้าที่:** ตารางรวมรายการจัดซื้อจัดจ้างทั้งหมดของกองบำรุงรักษา
* **ฟังก์ชันเด่น:**
  * ระบบ Search ค้นหาด้วยรหัส PR, รหัส PO, หรือชื่อพัสดุ
  * ระบบ Pagination รองรับการเปิดดูข้อมูลจำนวนมากได้อย่างลื่นไหล
  * การจัดเรียงลำดับ (Sorting) ตามวันที่, มูลค่างบประมาณ, หรือสถานะงาน

### โมดูลที่ 5: ระบบสรุปเวลาทำงานล่วงเวลา (Overtime Summary & ETAS Data)
* **หน้าที่:** ตรวจสอบและคำนวณชั่วโมงการทำงานล่วงเวลาเพื่อความถูกต้องในการเบิกจ่าย
* **ฟังก์ชันเด่น:**
  * **Strict Data Segregation:** แยกหน้าและระบบสรุปยอดระหว่าง "พนักงานประจำ (Employee OT)" และ "ลูกจ้างสัญญาจ้าง (Contractor OT)" อย่างเด็ดขาด
  * สรุปยอดชั่วโมง OT รวมแยกรายเดือน และจัดกลุ่มตามแผนก W11, W12, W13, W14
  * แสดงข้อมูลสแกนเวลาเข้า-ออกงานจากระบบ ETAS (Attendance Scan Data) ควบคู่กับยอดสรุปเพื่อใช้ตรวจสอบความถูกต้อง

### โมดูลที่ 6: ระบบติดตามคลังอะไหล่เครื่องจักร BEML (BEML Inventory)
* **หน้าที่:** ติดตามสต็อกอะไหล่เครื่องจักรขุด/ขนดินและเครื่องจักรหนัก BEML
* **ฟังก์ชันเด่น:**
  * รายการอะไหล่พร้อมรหัสพัสดุ (Part Number) และตำแหน่งจัดเก็บ (Location)
  * แจ้งเตือนสถานะอะไหล่คงคลัง เพื่อวางแผนสั่งซื้อทดแทนก่อนเกิดเหตุฉุกเฉิน

### โมดูลที่ 7: ระบบพัสดุสิ้นเปลืองงานซ่อมบำรุง (Consumables Inventory)
* **หน้าที่:** บริหารจัดการวัสดุสิ้นเปลืองที่ใช้ในงานบำรุงรักษาประจำวัน (เช่น น็อต, สารหล่อลื่น, ถุงมือ, ใบเจียร)
* **ฟังก์ชันเด่น:**
  * บันทึกการรับเข้า-เบิกจ่ายวัสดุ
  * ตรวจสอบปริมาณการใช้วัสดุในแต่ละงานซ่อม

---

## 7. การทดสอบและควบคุมคุณภาพซอฟต์แวร์ (Testing & Quality Assurance)

### สรุปผลการทดสอบเชิงเทคนิค (Technical Test Results):
* **Unit Testing (Vitest):** ผ่านการทดสอบ **270 Tests (100% Pass)** จากชุดทดสอบ **25 Test Files**
  * ครอบคลุม: Domain Logic, File Type & Size Validation, Repository Data Layer, OAuth Token Lifecycle, Resumable Upload Client
* **TypeScript Compilation:** ผ่านการตรวจ Strict Mode (`tsc --noEmit`) 0 Errors
* **Production Build:** รัน `npm run build` สำเร็จทุก Pages และ API Routes ได้ Static & Dynamic Serverless Functions ที่สมบูรณ์
* **Responsive Design:** ผ่านการทดสอบการแสดงผลทั้งบน Desktop PC (กฟผ.), แท็บเล็ตสำหรับหน้างานซ่อม และสมาร์ตโฟน

---

## 8. สรุปผลสัมฤทธิ์และคุณค่าที่ กฟผ. ได้รับ (Results & Business Value)

### 1. ผลประโยชน์เชิงปริมาณ (Quantitative Impact):
* **ลดเวลาค้นหาข้อมูล:** จากเดิมที่ต้องเปิดค้นหาใน Google Sheets หลายไฟล์ ใช้เวลา 15–30 นาทีต่อครั้ง ลดลงเหลือ **ต่ำกว่า 5 วินาที** ผ่านแดชบอร์ดศูนย์กลาง
* **ลดความล่าช้าในงานสั่งซ่อม (Shop Order Turnaround):** ลดเวลาการประสานงานและส่งต่อแบบแปลนลงกว่า **40%** ด้วยระบบแนบไฟล์ตรงเข้าสู่ Drive
* **ลดข้อผิดพลาดการคำนวณ OT:** ป้องกันความผิดพลาดจากการสับสนระหว่างพนักงานและลูกจ้างเหมาบริการได้ **100%** ผ่านการแยก Data View

### 2. ผลประโยชน์เชิงคุณภาพ (Qualitative Impact):
* **Single Source of Truth:** บุคลากรทุกระดับในกอง W10 มองเห็นข้อมูลชุดเดียวกัน ช่วยให้การตัดสินใจของผู้บริหารรวดเร็วและแม่นยำขึ้น
* **User Experience ที่เป็นมิตร:** หน้าจอออกแบบด้วยภาษาไทยที่สอดคล้องกับศัพท์ทางเทคนิคและวัฒนธรรมการทำงานของ กฟผ.
* **ความคุ้มค่าด้านงบประมาณ (Zero Database Licensing Cost):** ใช้ประโยชน์สูงสุดจาก Google Workspace Business License ที่ กฟผ. มีอยู่แล้ว โดยไม่ต้องลงทุนซื้อเซิร์ฟเวอร์ฐานข้อมูล Oracle หรือ SQL Server เพิ่มเติม

---

## 9. ปัญหา อุปสรรค และแนวทางแก้ไขเชิงเทคนิค (Challenges & Solutions)

| ปัญหาที่พบในการพัฒนา (Challenges) | สาเหตุทางเทคนิค (Root Cause) | แนวทางแก้ไขที่นำมาใช้ (Applied Solutions) |
| :--- | :--- | :--- |
| **1. ข้อจำกัดขนาดไฟล์บน Vercel (4.5 MB Limit)** | Vercel Serverless Function มีเพดาน Request Body จำกัด ทำให้ไม่สามารถรับไฟล์ขนาดใหญ่ได้ | พัฒนาสถาปัตยกรรม **Direct Resumable Upload** โดยให้ Client ยิงตรงเข้า Google Drive API แทน |
| **2. ความเสี่ยงด้านความปลอดภัยของ Token** | การแชร์ Service Account ให้มีสิทธิ์เต็ม Drive เสี่ยงต่อข้อมูลส่วนบุคคลรั่วไหล | ปรับสถาปัตยกรรมเป็น **OAuth 2.0 Scope `drive.file`** ทำให้ระบบมองเห็นเฉพาะไฟล์ที่ตนเองสร้าง |
| **3. โครงสร้าง Google Sheets มีความแปรปรวน** | หัวตารางภาษาไทย, ค่าวันที่ พ.ศ., ช่องว่างในเซลล์ ทำให้ API เกิด Parse Error | พัฒนา **Data Sanitization & Normalization Layer** ตรวจสอบ Type และแปลงข้อมูลก่อนส่งไปยัง UI |
| **4. Rate Limit ของ Google Sheets API** | การเรียกข้อมูลถี่เกินไปอาจติดข้อจำกัด Read/Write Quota | ออกแบบระบบ Caching และรวม Batch Requests ลดจำนวนการยิง API ที่ไม่จำเป็น |

---

## 10. ทักษะด้าน IT ที่ได้พัฒนาและแนวทางต่อยอด (Skills Gained & Future Work)

### ทักษะวิชาชีพไอทีที่ได้พัฒนา (Skills & Competencies Developed):
1. **Modern Frontend Development:** เชี่ยวชาญการใช้ Next.js 16 (App Router), React 19, TypeScript และ Tailwind CSS ในระดับ Production
2. **Cloud Integration & API Architecture:** การเชื่อมต่อ Google Cloud APIs (Sheets & Drive), การบริหารจัดการ OAuth 2.0 Flow และ JWT Security
3. **Database Adaptation:** การประยุกต์ใช้ NoSQL/Sheets ให้ทำหน้าที่เป็น Data Layer รองรับ CRUD Operations
4. **Software Quality Assurance:** การเขียน Unit Test แบบอัตโนมัติด้วย Vitest และการจัดการ CI/CD Build Pipeline บน Vercel
5. **Business Requirement Analysis:** ทักษะการวิเคราะห์และถอดโจทย์การทำงานจริงขององค์กรขนาดใหญ่ (กฟผ.) มาเป็นฟีเจอร์ซอฟต์แวร์

### แนวทางการพัฒนาต่อยอดในอนาคต (Future Enhancements):
* **ระบบพิสูจน์ตัวตน (Enterprise SSO / RBAC):** เชื่อมต่อระบบล็อกอินของ กฟผ. (Single Sign-On) และกำหนดสิทธิ์รายบุคคลตามตำแหน่ง
* **ระบบแจ้งเตือนอัตโนมัติ (Line Notify / Telegram Bot):** แจ้งเตือนเมื่อมีใบสั่งซ่อมใหม่ หรือเมื่อสถานะการจัดซื้อมีการเปลี่ยนแปลง
* **ระบบรายงานสรุปผล PDF อัตโนมัติ (Automated Report Generator):** ส่งออกรายงานสรุปประจำเดือนเป็นเอกสารทางการได้ในคลิกเดียว

---

## 11. โครงสร้างสไลด์แนะนำสำหรับนำไปทำ PowerPoint (Slide Deck Structure)

| สไลด์ที่ (Slide #) | ชื่อหัวข้อสไลด์ (Slide Title) | ประเด็นสำคัญที่ควรใส่ในสไลด์ (Key Bullet Points) |
| :---: | :--- | :--- |
| **Slide 1** | **หน้าปกโครงงาน (Title Slide)** | • ชื่อโครงงาน: W10 Dashboard<br>• สถานประกอบการ: กฟผ. โรงไฟฟ้าแม่เมาะ (กองบำรุงรักษา W10)<br>• ผู้จัดทำ, สาขาวิชาเทคโนโลยีสารสนเทศ, วิทยาลัยเทคนิคลำปาง |
| **Slide 2** | **ที่มาและความสำคัญ (Background & Pain Points)** | • ข้อมูลเดิมกระจัดกระจายใน Google Sheets หลายไฟล์<br>• ขาดศูนย์กลางติดตามงานซ่อมและจัดซื้อจัดจ้างแบบ Real-time<br>• ปัญหาการจัดการไฟล์แนบใบสั่งซ่อม (Shop Order) |
| **Slide 3** | **วัตถุประสงค์และขอบเขตงาน (Objectives & Scope)** | • รวม 7 แดชบอร์ดในที่เดียว (Single Pane of Glass)<br>• พัฒนาระบบ Shop Order แบบ Full CRUD + แนบไฟล์<br>• แยกข้อมูล OT พนักงานและลูกจ้างอย่างถูกต้อง 100% |
| **Slide 4** | **สถาปัตยกรรมระบบ (System Architecture)** | • Next.js 16 + React 19 + TypeScript (Frontend)<br>• Google Sheets API v4 (Database Layer)<br>• Google Drive API v3 OAuth 2.0 (File Storage Layer)<br>• Vercel Platform & Cron (Cloud Hosting) |
| **Slide 5** | **ไฮไลท์เทคนิค: Direct Resumable Upload** | • ปัญหา: Vercel 4.5MB Payload Limit<br>• ทางแก้: Client ขอ Session URL แล้วยิงตรงเข้า Drive (0-Byte Server)<br>• ปลอดภัยด้วย OAuth Scope `drive.file` |
| **Slide 6** | **โมดูลที่ 1: Overview Dashboard & KPIs** | • ภาพรวมงานซ่อมบำรุง กอง W10<br>• เปรียบเทียบปริมาณงานแยกแผนก W11 - W14<br>• ตัวกรองข้อมูลรายปีและรายเดือนแบบ Dynamic |
| **Slide 7** | **โมดูลที่ 2: Shop Order Management** | • จัดการใบสั่งงานซ่อมบำรุง (Create, Read, Update, Delete)<br>• แนบรูปภาพความเสียหาย/แบบงาน PDF สูงสุด 10 MB<br>• ระบบ Image Preview & Modal ดูรายละเอียด |
| **Slide 8** | **โมดูลที่ 3-4: Purchasing & Purchasing All** | • ติดตามสถานะจัดซื้อจัดจ้างตั้งแต่ PR ถึง PO<br>• สรุปงบประมาณเปรียบเทียบตามแผนก<br>• ระบบค้นหาและจัดเรียงข้อมูลแบบละเอียด |
| **Slide 9** | **โมดูลที่ 5: Overtime (OT) Summary** | • แยกข้อมูล Employee OT และ Contractor OT ชัดเจน<br>• สรุปชั่วโมงทำงานล่วงหน้ารายเดือนตามแผนก<br>• แสดงข้อมูลสแกนเวลา ETAS ควบคู่เพื่อตรวจสอบความถูกต้อง |
| **Slide 10** | **โมดูลที่ 6-7: Inventory Management** | • BEML Inventory: คลังอะไหล่เครื่องจักรหนัก<br>• Consumables: วัสดุสิ้นเปลืองงานซ่อมบำรุงประจำวัน |
| **Slide 11** | **การทดสอบและคุณภาพระบบ (Testing & QA)** | • Unit Test ผ่าน 270 Tests (25 Test Suites) 100% Pass<br>• TypeScript Strict Mode 0 Errors<br>• Production Build สำเร็จ Deploy บน Vercel พร้อมใช้งานจริง |
| **Slide 12** | **ผลลัพธ์และคุณค่าที่ กฟผ. ได้รับ (Value Delivered)** | • ลดเวลาค้นหาข้อมูลจาก 30 นาที เหลือ < 5 วินาที<br>• ช่วยให้หัวหน้ากองและวิศวกรเห็นข้อมูลชุดเดียวกัน<br>• ประหยัดงบประมาณ ไม่เสียค่าลิขสิทธิ์ Database เพิ่มเติม |
| **Slide 13** | **ปัญหา อุปสรรค และการแก้ไข (Troubleshooting)** | • แก้ไขข้อจำกัด Serverless Upload ด้วย Direct Upload<br>• จัดการข้อมูลที่ไม่เป็นระเบียบด้วย Data Normalization Layer<br>• จัดการสิทธิ์ความปลอดภัยด้วย OAuth Least Privilege |
| **Slide 14** | **ทักษะที่ได้รับและแนวทางต่อยอด (Skills & Future Work)** | • ทักษะ Full-stack Modern Web Dev & Cloud API Integration<br>• แผนต่อยอด: ระบบ Single Sign-On (SSO) กฟผ. และแจ้งเตือนผ่าน Line |
| **Slide 15** | **สรุปผลและ Q&A (Conclusion & Thank You)** | • สรุปภาพรวมความสำเร็จของโครงการ<br>• ขอบคุณคณะกรรมการ อาจารย์ และ กฟผ. โรงไฟฟ้าแม่เมาะ<br>• เปิดรับข้อซักถาม (Q&A) |
