# การออกแบบ Shop Order Drive OAuth B1

**วันที่:** 2026-07-27

**สถานะ:** อนุมัติแนวทางการออกแบบแล้ว รอการตรวจทานเอกสารฉบับภาษาไทย

**แอปพลิเคชันเป้าหมาย:** W10 Dashboard

**ใช้แทนข้อกำหนดเดิม:** เอกสารนี้ใช้แทนส่วนการยืนยันตัวตน Google Drive,
วงจรชีวิตไฟล์แนบ และประเภทไฟล์แนบใน
`docs/superpowers/specs/2026-07-24-shop-order-nextjs-design.md` ส่วนการทำ CRUD
กับชีต รูปแบบแดชบอร์ด ตัวกรอง และการคำนวณสถานะยังคงเดิม

## 1. วัตถุประสงค์

เปลี่ยนการสร้างไฟล์แนบ Shop Order ใหม่จาก Service Account มาเป็น Google
OAuth ที่เชื่อมกับบัญชีเจ้าของเพียงบัญชีเดียว คือ
`w10egat.project@gmail.com`

ระบบใหม่ต้อง:

- อ่านและเขียนชีต `Order1` ด้วย Service Account เดิมต่อไป
- อัปโหลดไฟล์แนบใหม่จากเบราว์เซอร์ไปยัง Google Drive โดยตรงผ่าน Resumable
  Upload Session
- ให้บัญชี OAuth เป็นเจ้าของไฟล์ใหม่แทน Service Account
- ใช้สิทธิ์ขั้นต่ำ `drive.file`
- ให้ธุรการใช้งานได้โดยไม่ต้องล็อกอิน Google รายบุคคล
- รักษาขนาดไฟล์สูงสุด 10 MB โดยไม่ส่งเนื้อไฟล์ผ่าน Vercel Function
- เก็บไฟล์เดิมจาก Apps Script ไว้และไม่พยายามจัดการไฟล์เหล่านั้น
- ล้างไฟล์ที่อัปโหลดค้างและไฟล์ที่ถูกแทนที่ตามระยะเวลาที่กำหนด
- แสดงข้อผิดพลาดภาษาไทยที่ปลอดภัยและนำไปแก้ไขได้ โดยไม่เปิดเผยข้อมูล OAuth
  หรือ Resumable Session URL

## 2. ข้อตกลงผลิตภัณฑ์ที่ยืนยันแล้ว

- ใช้รูปแบบ B1: การเชื่อม OAuth หนึ่งชุดให้บริการผู้ใช้ Shop Order ทุกคน
- บัญชีเจ้าของที่เชื่อมคือ `w10egat.project@gmail.com`
- ผู้ใช้ไม่ต้องล็อกอิน ผู้ที่เข้าถึง URL Production ได้สามารถใช้งาน Shop Order
  ตามสิทธิ์เดิม
- ไฟล์ใหม่ตั้งสิทธิ์เป็น `ทุกคนที่มีลิงก์` และมีสิทธิ์ดู
- Google Sheets ยังใช้ `GOOGLE_CLIENT_EMAIL` และ `GOOGLE_PRIVATE_KEY`
- งานเกี่ยวกับไฟล์แนบใน Google Drive ใช้ OAuth เท่านั้น
  ไม่มีการย้อนกลับไปอัปโหลดด้วย Service Account
- OAuth ใช้ Scope `https://www.googleapis.com/auth/drive.file`
  ไม่ใช้สิทธิ์เข้าถึง Drive เต็มรูปแบบ
- เครื่องมือตั้งค่าในเครื่องจะสร้างโฟลเดอร์ที่แอปเป็นผู้สร้างชื่อ
  `Picture-OAuth` เจ้าของสามารถย้ายโฟลเดอร์นี้ไปไว้ใต้ `WebApp ShopOrder`
  ได้โดย File ID ไม่เปลี่ยน
- โฟลเดอร์ `Picture` เดิมและลิงก์ไฟล์เก่าทั้งหมดยังคงเดิม
- รองรับ JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 10 MB
- เก็บเฉพาะไฟล์ต้นฉบับหนึ่งไฟล์ หน้าเว็บใช้ Thumbnail ที่ Google Drive
  สร้างให้อัตโนมัติแทนการอัปโหลดรูปย่อซ้ำ
- ชื่อไฟล์ที่จัดเก็บใช้รูปแบบ
  `SO-{orderNumber}-{yyyyMMdd-HHmmss}-{shortId}.{extension}`
  โดยไม่เก็บชื่อไฟล์เดิมจากเครื่องผู้ใช้
- หากอัปโหลด Drive ไม่สำเร็จ ระบบยังบันทึกออเดอร์โดยไม่มีไฟล์แนบ
  และแจ้งชัดเจนว่าต้องกลับมาเพิ่มไฟล์ภายหลัง
- ไฟล์ Pending ที่ไม่ได้ผูกกับออเดอร์จะถูกย้ายเข้าถังขยะหลัง 24 ชั่วโมง
- ไฟล์ที่ระบบ OAuth สร้างและถูกแทนที่ตอนแก้ไข
  หรือถูกแยกออกตอนลบออเดอร์ จะถูกกำหนดให้ย้ายเข้าถังขยะหลัง 30 วัน
- ไฟล์เดิมจาก Apps Script จะไม่ถูกระบบย้ายเข้าถังขยะอัตโนมัติ
- Vercel WAF จำกัดคำขอแก้ไขข้อมูลและสร้าง Upload Session ของ Shop Order
  ที่ 30 คำขอต่อ IP ต่อช่วงเวลา 10 นาที

## 3. ขอบเขตการยืนยันตัวตน

### 3.1 Google Sheets

Service Account ยังคงเป็นบัญชีที่ใช้เข้าถึงชีต และต้องมีสิทธิ์ Editor
ใน Spreadsheet ต่อไป ระบบจะนำ Drive Scope ออกจากการตั้งค่าของบัญชีนี้
เพราะ Service Account จะไม่สร้างหรือจัดการไฟล์แนบใหม่อีก

### 3.2 Google Drive

เซิร์ฟเวอร์สร้าง Google OAuth Client จาก:

- OAuth Client ID
- OAuth Client Secret
- Refresh Token ระยะยาวของ `w10egat.project@gmail.com`

Refresh Token และ Client Secret อยู่เฉพาะฝั่งเซิร์ฟเวอร์ เบราว์เซอร์จะได้รับเพียง
Resumable Session URL อายุสั้นหลังจากเซิร์ฟเวอร์ตรวจข้อมูลไฟล์แล้ว Session URL
ถือเป็น Bearer Secret และห้ามบันทึกลง Log, ฐานข้อมูล, Query String
หรือส่งกลับมาใช้อีกหลังอัปโหลดเสร็จ

Environment Variables ที่ Production ต้องมี:

- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
- `SHOP_ORDER_DRIVE_FOLDER_ID`
- `SHOP_ORDER_CRON_SECRET`

ตัวแปรของ Google Sheet เดิมยังคงจำเป็น

### 3.3 เครื่องมือตั้งค่า OAuth

Node.js Utility ในเครื่องจะเชื่อมบัญชีเจ้าของเพียงครั้งเดียวตามขั้นตอน:

1. ตรวจ Client ID และ Client Secret โดยไม่แสดงค่าออกหน้าจอ
2. เปิด Loopback Callback ที่ `127.0.0.1`
3. เปิดหรือแสดง Google Authorization URL โดยใช้ `access_type=offline`,
   `prompt=consent` และ Scope `drive.file`
4. แลก Authorization Code เป็น Token
5. สร้างโฟลเดอร์ `Picture-OAuth` ด้วย Drive Client ที่ยืนยันตัวตนแล้ว
6. แสดงเฉพาะ Refresh Token และ Folder ID
   พร้อมคำแนะนำให้นำไปตั้งค่าใน Vercel
7. จบการทำงานโดยไม่เขียนข้อมูลลับลง Repository

ต้องตั้ง OAuth Consent ให้อยู่ในสถานะที่ไม่ทำให้ Refresh Token
หมดอายุจากข้อจำกัดช่วงทดสอบ บัญชี Google ที่เชื่อมเป็นผู้ใช้ OAuth
เพียงบัญชีเดียวที่จำเป็น

## 4. กระบวนการทำงานของไฟล์แนบ

### 4.1 การเลือกไฟล์และ Preview

เบราว์เซอร์จะ:

- รับ JPEG, PNG, WebP และ PDF
- ปฏิเสธไฟล์เกิน 10 MB ก่อนเรียก Network
- ตรวจนามสกุล MIME Type และ Magic Bytes ที่ตรวจได้
- แสดง Preview ขนาดเล็กสำหรับรูปภาพ
- แสดงไอคอน PDF และชื่อไฟล์สำหรับ PDF
- ยกเลิก Object URL เมื่อเปลี่ยนไฟล์หรือปิด Dialog

ระบบไม่บีบอัด แปลง หรือแก้ไขเนื้อไฟล์ต้นฉบับ

### 4.2 การสร้าง Resumable Session

`POST /api/shop-order/upload-session` รับเฉพาะข้อมูล:

```ts
type UploadSessionRequest = {
  orderNumber: string;
  name: string;
  mimeType: string;
  size: number;
};
```

เซิร์ฟเวอร์จะ:

1. ตรวจ Same-origin และ JSON Content-Type
2. ตรวจเลขออเดอร์หกหลักและข้อมูลไฟล์แนบ
3. สร้างชื่อไฟล์ปลายทางตามรูปแบบที่กำหนด
4. ขอ Access Token ผ่าน OAuth Refresh Token
5. สร้าง Drive File ID ล่วงหน้า
6. เริ่ม Resumable Upload ภายใน `SHOP_ORDER_DRIVE_FOLDER_ID`
7. เขียน Pending App Properties ประกอบด้วยชื่อ, MIME, ขนาด,
   เวลาสร้าง และเลขออเดอร์ที่คาดหวัง
8. ส่ง File ID, Resumable Session URL และเวลาหมดอายุกลับไป

เบราว์เซอร์ส่งไบต์ต้นฉบับตรงไปยัง Google HTTPS Session URL
พร้อมแสดงความคืบหน้า หากเป็น Network Error หรือ 5xx ชั่วคราว
ให้ลองใหม่ได้สูงสุดสามครั้งด้วย Bounded Exponential Backoff
ระบบจะไม่ลองใหม่สำหรับ Validation Error, Permission Error, Token Error,
Quota Error หรือ 4xx แบบถาวร

### 4.3 การยืนยันไฟล์หลังอัปโหลด

คำขอบันทึกออเดอร์ส่ง Drive File ID ที่อัปโหลดสำเร็จมาแบบไม่บังคับ
ก่อนเขียน URL ลงชีต เซิร์ฟเวอร์ใช้ OAuth Drive Client ตรวจว่า:

- ID อ้างถึงไฟล์ที่ OAuth Application นี้สร้าง
- Parent ของไฟล์เป็นโฟลเดอร์ที่ตั้งค่าไว้
- Pending App Properties ตรงกับเลขออเดอร์ ชื่อ MIME และขนาดที่คาดหวัง
- ขนาดไบต์ตรงกัน
- Leading-byte Signature ตรงกับชนิดไฟล์ที่อนุญาต
- ไฟล์ไม่อยู่ในถังขยะและยังไม่ถูก Finalize ให้กับออเดอร์อื่น

เมื่อตรวจผ่าน เซิร์ฟเวอร์จะ:

1. เพิ่มสิทธิ์ `anyone` / `reader`
2. เปลี่ยนสถานะไฟล์เป็น Active พร้อมบันทึกเลขออเดอร์และเวลา Finalize
3. ล้างกำหนดเวลาลบที่อาจมีอยู่
4. บันทึก Canonical Drive Web-view URL ลงคอลัมน์ K

### 4.4 อัปโหลดไม่สำเร็จแต่บันทึกออเดอร์สำเร็จ

หากสร้าง Session หรือส่งไฟล์ไม่สำเร็จ ฟอร์มจะบันทึกออเดอร์ต่อโดยไม่ส่ง
Uploaded File ID แถวในชีตจะมี Attachment URL ว่าง
ข้อความสำเร็จต้องมีคำเตือนที่มองเห็นชัดว่าออเดอร์ถูกบันทึกแล้วแต่ไฟล์แนบไม่สำเร็จ
พร้อมปุ่มเปิด Edit Dialog เพื่อลองเพิ่มไฟล์อีกครั้ง

หากตรวจไฟล์หลังอัปโหลดไม่ผ่าน เซิร์ฟเวอร์จะไม่เชื่อถือหรือจัดเก็บ File URL
แต่จะบันทึกออเดอร์โดยไม่มีไฟล์ พร้อมส่ง Partial-success Result
ที่แยกความสำเร็จของชีตออกจากความล้มเหลวของไฟล์แนบ

หากการเขียนชีตล้มเหลวหลังไฟล์อัปโหลดเสร็จ ไฟล์ยังคงสถานะ Pending
และเข้าสู่กระบวนการล้างหลัง 24 ชั่วโมง

## 5. วงจรชีวิตไฟล์

ไฟล์ที่ OAuth สร้างใช้ App Properties เป็นแหล่งข้อมูลหลักของสถานะ:

```ts
type AttachmentLifecycle =
  | { status: "pending"; pendingSince: string; orderNumber: string }
  | { status: "active"; finalizedAt: string; orderNumber: string }
  | {
      status: "scheduled_delete";
      deleteAfter: string;
      orderNumber: string;
      reason: "replaced" | "order_deleted";
    };
```

### 5.1 ล้างไฟล์ Pending

Route สำหรับ Cleanup ที่ยืนยันตัวตนแล้วทำงานวันละครั้ง
โดยค้นหาไฟล์ Pending ที่ OAuth สร้าง ไฟล์ที่เก่ากว่า 24 ชั่วโมง
จะถูกย้ายเข้าถังขยะ ส่วนไฟล์ที่ยังไม่ครบกำหนดจะยังคงอยู่

### 5.2 การแทนที่ไฟล์

เมื่อแก้ไขพร้อมไฟล์ใหม่ ระบบจะ Finalize ไฟล์ใหม่และอัปเดตคอลัมน์ K ก่อน
หลังจากเขียนชีตสำเร็จเท่านั้นจึงจะกำหนดให้ไฟล์ OAuth เดิมถูกลบในอีก 30 วัน

หากลิงก์เดิมเป็นไฟล์จาก Apps Script, OAuth Client ที่ใช้ `drive.file`
เข้าถึงไม่ได้ หรือไฟล์อยู่นอก `Picture-OAuth` ระบบจะไม่แก้ไขไฟล์นั้น

### 5.3 การลบออเดอร์

ระบบล้างแถวในชีตด้วยกระบวนการป้องกัน Concurrent Request แบบเดิม
หลังแก้ไขชีตสำเร็จ ไฟล์แนบที่ OAuth สร้างจะถูกกำหนดให้ลบในอีก 30 วัน
ลิงก์เดิมและลิงก์ Drive ที่ระบบไม่รู้จักจะไม่ถูกแก้ไข

### 5.4 การลบตามกำหนด

Cleanup Route รายวันจะย้ายไฟล์ Scheduled เข้า Drive Trash
เมื่อ `deleteAfter` ผ่านไปแล้วเท่านั้น ผู้ใช้ยังกู้ไฟล์จากถังขยะ Google Drive ได้
จนกว่าเจ้าของจะลบถาวรหรือ Drive ใช้นโยบายเก็บรักษาถังขยะของตนเอง
แอปพลิเคชันจะไม่ลบไฟล์ Drive แบบถาวร

Cleanup ต้องเป็น Idempotent หากไม่พบไฟล์หรือไฟล์อยู่ในถังขยะแล้ว
ให้ถือว่าสำเร็จ หาก Drive ล้มเหลวชั่วคราว ให้บันทึก Log อย่างปลอดภัย
และลองใหม่ในการทำงานรายวันรอบถัดไป

## 6. กระบวนการ Thumbnail

ระบบไม่อัปโหลดไฟล์ Thumbnail แยก สำหรับไฟล์ภาพและ PDF ที่ OAuth สร้าง
Server Route จะขอ Thumbnail จาก Drive หลังตรวจว่า:

- File ID มีโฟลเดอร์ที่แอปสร้างเป็น Parent
- ไฟล์มีสถานะ Active
- เลขออเดอร์ใน Lifecycle ตรงกับออเดอร์ที่ร้องขอ
- ไฟล์ไม่อยู่ในถังขยะ

Thumbnail Response ใช้ `no-store` หาก Drive ไม่มี Thumbnail ให้แสดงไอคอนรูป
หรือ PDF แทน เมื่อกด Preview ให้เปิด Public Drive Link ต้นฉบับในแท็บใหม่

ลิงก์ไฟล์เก่ายังคงใช้ปุ่มไฟล์แนบแบบเดิม
ระบบจะไม่พยายามสร้าง Authenticated Thumbnail ให้ไฟล์เหล่านั้น

## 7. การเปลี่ยนแปลง API และ Domain

Resource `/api/shop-order` เดิมยังคงเป็นขอบเขต CRUD ของชีต
Success Response ของ Mutation เพิ่มผลลัพธ์ไฟล์แนบ:

```ts
type AttachmentOutcome =
  | { status: "none" }
  | { status: "attached"; fileId: string; fileUrl: string }
  | {
      status: "order_saved_without_attachment";
      code: string;
      message: string;
    };
```

Route ที่เพิ่มหรือเปลี่ยน:

- `POST /api/shop-order/upload-session` — สร้าง OAuth Resumable Session
- `GET /api/shop-order/attachment-thumbnail` — เข้าถึง Thumbnail
  หลังตรวจสิทธิ์และสถานะ
- `GET /api/shop-order/cleanup` — Cleanup รายวันที่ตรวจ
  `Authorization: Bearer ${SHOP_ORDER_CRON_SECRET}`

Cleanup Route รับคำขอจาก Vercel Cron เมื่อ Secret ตรงกันเท่านั้น
Response แสดงจำนวนไฟล์ที่ตรวจ ย้ายขยะ ข้าม และล้มเหลว
โดยไม่ส่งชื่อไฟล์ ID URL หรือ Drive Error Body กลับมา

## 8. การจัดการข้อผิดพลาดและการกู้คืน

ระบบจำแนกข้อผิดพลาดโดยไม่เปิดเผยข้อมูลลับ:

- `DRIVE_OAUTH_CONFIGURATION_REQUIRED` — ตัวแปร OAuth ที่จำเป็นหายไป
- `DRIVE_OAUTH_REAUTH_REQUIRED` — Refresh Token ถูกยกเลิก หมดอายุ
  หรือถูกปฏิเสธ
- `DRIVE_FOLDER_CONFIGURATION_REQUIRED` — ไม่พบโฟลเดอร์
  หรือโฟลเดอร์ไม่ได้สร้าง/เข้าถึงได้ภายใต้ `drive.file`
- `DRIVE_QUOTA_EXCEEDED` — พื้นที่ของเจ้าของหรือ API Quota เต็ม
- `DRIVE_UPLOAD_RETRYABLE` — Network, 429 หรือ 5xx ชั่วคราว
- `DRIVE_UPLOAD_REJECTED` — การอัปโหลดหรือข้อมูลไฟล์ผิดแบบถาวร
- `ORDER_SAVED_WITHOUT_ATTACHMENT` — เขียนชีตสำเร็จหลังไฟล์แนบล้มเหลว

Server Log ประกอบด้วย Operation, Safe Category, HTTP Status,
Google Reason Code ที่ไม่อ่อนไหว, Duration, Deployment Request ID
และ Correlation ID เท่านั้น ห้าม Log Access Token, Refresh Token,
Client Secret, Authorization Code, Resumable URL, ไบต์ไฟล์,
ชื่อไฟล์ต้นฉบับ หรือ Google Response Body แบบเต็ม

หาก Refresh Token ถูกยกเลิก ให้รัน OAuth Setup Utility ใหม่
และแทนค่า Refresh Token ใน Vercel การเชื่อมใหม่จะไม่เปลี่ยนไฟล์เดิม
หรือลิงก์ในชีต

## 9. การเปิดใช้งานสาธารณะและการป้องกันการใช้งานเกิน

ผลิตภัณฑ์ที่อนุมัติไม่มี Login ของแอป ผู้ที่มี Production URL
สามารถส่งคำขอแก้ไข Shop Order ได้ นี่เป็นความเสี่ยงที่ยอมรับโดยชัดแจ้ง

มาตรการต่อไปนี้เป็น Defense-in-depth ไม่ใช่ Authentication:

- ตรวจ Same-origin อย่างเข้มงวดสำหรับ Browser Mutation
- จำกัด Content-Type และขนาด Request Body
- จำกัดไฟล์แนบ 10 MB
- ใช้ Scope `drive.file` เพื่อลดผลกระทบหาก OAuth รั่ว
- ตรวจ Folder, Lifecycle และ Metadata ก่อนบันทึก URL ลงชีต
- ใช้ Vercel WAF Fixed Window จำกัด 30 Mutation/Upload-session Request
  ต่อ IP ต่อ 10 นาที
- ส่ง Error แบบทั่วไปและปลอดภัย

WAF Rule ครอบคลุมคำขอ Shop Order API ที่ไม่ใช่ GET
และไม่ครอบคลุม Cleanup Route หากได้รับ `429`
ระบบห้ามย้อนกลับไปใช้เส้นทางที่ไม่มีการป้องกัน

เอกสารนี้ไม่อ้างว่า URL ลับสามารถป้องกันการโจมตีโดยเจตนาได้
หากจำนวนผู้ใช้ขยายเกินบริบทที่มีเฉพาะธุรการ
ต้องเพิ่ม Authentication และ Email Allowlist เป็นงานถัดไป

## 10. ประสิทธิภาพ

- ไบต์ของไฟล์ไม่ผ่าน Vercel Function
- ไม่แปลง Base64
- Google Client Library ต่ออายุ OAuth Access Token
  ฝั่งเซิร์ฟเวอร์เมื่อจำเป็นเท่านั้น
- เบราว์เซอร์อัปโหลดไฟล์ต้นฉบับหนึ่งไฟล์
  และใช้ Thumbnail ที่ Drive สร้าง
- Progress คำนวณจากจำนวนไบต์ที่ส่งจริง
- Retry มีจำนวนจำกัดเพื่อป้องกันงานซ้ำหรือทำงานไม่สิ้นสุด
- Cleanup ทำงานวันละครั้งและประมวลผลแบบแบ่งหน้า
  ไม่โหลดรายการ Drive ทั้งหมดเข้าหน่วยความจำ
- การอ่านชีต ตัวกรอง Summary และ CRUD ใช้ระบบปัจจุบันต่อไป

## 11. กลยุทธ์การทดสอบ

### 11.1 Unit Tests

ครอบคลุม:

- การตรวจ OAuth Environment และ Lazy Client Initialization
- การตั้ง Scope `drive.file` เท่านั้น
- การสร้างชื่อไฟล์โดยไม่ใช้ชื่อเดิม
- Validation ของ JPEG, PNG, WebP, PDF, ชนิดที่ไม่รองรับ
  และขอบเขต 10 MB
- การจำแนก Google Error
- การเปลี่ยน Attachment Lifecycle
- การคำนวณระยะ 24 ชั่วโมงและ 30 วัน
- การสร้าง Attachment Outcome
- การแยก Legacy Drive URL กับ OAuth Drive URL
- การตรวจสิทธิ์ Cleanup

### 11.2 Repository และ API Integration Tests

ใช้ Mock สำหรับ Sheets, OAuth, Drive, เวลา และ Fetch เพื่อตรวจ:

- Resumable Session ใช้ OAuth Token และโฟลเดอร์ที่แอปสร้าง
- Sheet Call ยังใช้ Service Account Client
- OAuth Configuration ที่หายหรือถูกยกเลิกส่ง Error ที่ปลอดภัย
- Finalized Metadata ต้องตรงกับ Parent, Lifecycle, Order, MIME และ Size
- เพิ่ม Public Link Permission หลัง Verification เท่านั้น
- Drive ล้มเหลวแล้วออเดอร์ยังบันทึกโดยไม่มีคอลัมน์ K
  พร้อม Partial-success
- Sheet ล้มเหลวแล้วไฟล์ยังเป็น Pending
- การแทนที่ไฟล์กำหนดเวลาลบไฟล์ OAuth เดิมหลังชีตสำเร็จเท่านั้น
- ไม่เปลี่ยนไฟล์ Legacy
- การลบออเดอร์กำหนดเวลาลบไฟล์ OAuth
  และไม่เปลี่ยนไฟล์ Legacy
- Cleanup ย้ายเฉพาะ Pending ที่ค้างและ Scheduled ที่ครบกำหนด
- Cleanup เป็น Idempotent และประมวลผลแบบมีขอบเขต
- Thumbnail ปฏิเสธไฟล์ที่ Order ไม่ตรง, Pending, Legacy หรืออยู่ในถังขยะ
- API Response ไม่เปิดเผย Token หรือ Resumable URL
  ยกเว้น Session Creation Response ที่จำเป็นต้องใช้ URL นั้น

### 11.3 Client Tests

ตรวจ:

- Image Preview และ PDF Fallback
- Upload Progress ที่ตรงกับไบต์
- Retry แบบมีขอบเขต
- Permanent Upload Error ไม่ Retry
- บันทึกออเดอร์ต่อเมื่ออัปโหลดล้มเหลว
- คำเตือน Partial-success ยังคงมองเห็นและเปิด Edit ได้
- Thumbnail Fallback และปุ่มเปิดไฟล์ต้นฉบับ
- การยกเลิก Object URL
- Pending State ป้องกันการ Submit ซ้ำ

### 11.4 การตั้งค่าและตรวจ Production

ก่อนประกาศว่า Production เสร็จสมบูรณ์:

1. รัน Unit และ Integration Tests
2. รัน Scoped Lint และ TypeScript
3. รัน Production Next.js Build
4. รัน OAuth Setup Utility ด้วยบัญชีเจ้าของ
5. ย้าย `Picture-OAuth` ไปใต้ `WebApp ShopOrder`
6. ตั้ง OAuth, Folder และ Cron Variables ใน Vercel
7. Redeploy Source State ที่บันทึกแล้ว
8. ตรวจว่า Sheet Read ยังตอบ `200`
9. อัปโหลดรูปทดสอบขนาดเล็กหนึ่งไฟล์เมื่อผู้ใช้อนุญาตโดยชัดแจ้ง
10. ตรวจ Ownership, Parent Folder, Public Link, คอลัมน์ K และ Thumbnail
11. จำลอง Drive Rejection และตรวจว่าออเดอร์ถูกบันทึกโดยไม่มีลิงก์
12. ตรวจการจำแนก Cleanup แบบ Dry-run ก่อนอนุญาตให้ย้ายไฟล์เข้าถังขยะ
13. ตั้งและตรวจ WAF Rule

ห้าม Production Test ลบไฟล์ถาวรหรือแก้ข้อมูลออเดอร์จริง
โดยไม่ได้รับอนุญาตจากผู้ใช้

## 12. เอกสารประกอบ

ปรับเอกสารโปรเจกต์ให้มี:

- รูปแบบ Authentication ที่แยก Sheets และ Drive
- การตั้ง Google Cloud OAuth Consent และ Desktop Client
- คำสั่งเชื่อมบัญชีเจ้าของในเครื่อง
- Vercel Variables ที่ต้องใช้
- วิธีการย้ายโฟลเดอร์ที่แอปสร้าง
- การหมุนและกู้ Refresh Token
- การตั้ง WAF
- พฤติกรรม Cleanup รายวัน
- ข้อจำกัดของ Legacy File
- ตารางแก้ปัญหาสำหรับ Safe Error Code ทุกชนิด

## 13. เกณฑ์การยอมรับ

การย้ายระบบถือว่าสำเร็จเมื่อ:

- Shop Order อ่านและเขียนชีตด้วย Service Account เดิม
- JPEG, PNG, WebP และ PDF ใหม่ขนาดไม่เกิน 10 MB
  เป็นเจ้าของโดย `w10egat.project@gmail.com`
- OAuth ใช้เฉพาะ `drive.file`
- ไฟล์ใหม่ถูกสร้างในโฟลเดอร์ที่แอปสร้างและกำหนดไว้
- อัปโหลดจากเบราว์เซอร์ตรงไป Drive พร้อม Progress และ Bounded Retry
- ไฟล์ใหม่เปิดได้ด้วยสิทธิ์ `ทุกคนที่มีลิงก์`
- เมื่ออัปโหลดล้มเหลว ออเดอร์ยังถูกบันทึกโดยคอลัมน์ K ว่าง
  พร้อมคำเตือนชัดเจน
- Pending File ที่เก่ากว่า 24 ชั่วโมงถูกย้ายเข้าถังขยะ
- OAuth File ที่ถูกแทนที่หรือแยกออกจากออเดอร์
  ถูกกำหนดย้ายเข้าถังขยะหลัง 30 วัน
- Legacy Apps Script File ไม่ถูกเปลี่ยน
- Google-generated Thumbnail ทำงานพร้อม Safe Fallback
- ผู้ใช้ Production ไม่ต้องล็อกอิน Google
- Mutation Traffic ถูกจำกัด 30 Request ต่อ IP ต่อ 10 นาที
- Secret และ Bearer URL ไม่ปรากฏใน Log หรือ Client Bundle
- Automated Test, Build, Browser Test และ Production Verification
  ที่ได้รับอนุญาตผ่านทั้งหมด
