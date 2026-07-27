# W10 Dashboard

แดชบอร์ดภายในที่พัฒนาด้วย Next.js 16 โดยเมนู `/shop-order` อ่านและบันทึกข้อมูลลง Google Sheets และจัดเก็บไฟล์แนบใน Google Drive

## สถาปัตยกรรม Shop Order

- Google Sheets ใช้ Service Account และ scope `spreadsheets` เท่านั้น
- Google Drive ใช้ OAuth ของ `w10egat.project@gmail.com` และ scope `drive.file` เท่านั้น ไฟล์ใหม่จึงมีบัญชีนี้เป็นเจ้าของ
- เบราว์เซอร์อัปโหลดไฟล์ตรงไปยัง Google Drive ผ่าน resumable upload URL; Vercel ไม่รับ byte ของไฟล์ต้นฉบับ
- ระบบรองรับ JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 10 MB
- ไฟล์ใหม่เปิดแบบ anyone-with-link/reader เพื่อให้ลิงก์และ thumbnail ใช้งานได้โดยไม่ต้องล็อกอิน
- หากอัปโหลดล้มเหลว ระบบยังบันทึกออเดอร์และแสดงปุ่มให้เพิ่มไฟล์อีกครั้ง
- ไฟล์ pending เกิน 24 ชั่วโมง และไฟล์ที่ถูกแทนที่หรือลบครบ 30 วัน จะถูกย้ายเข้า Trash เท่านั้น ไม่มีการลบถาวร
- โฟลเดอร์ `Picture` และไฟล์เดิมจาก Apps Script เป็นข้อมูล legacy ระบบ OAuth จะไม่แก้ไขและไม่ล้างไฟล์เหล่านั้น

> ระบบยังเป็น public-by-link และไม่มีหน้า login ผู้ที่เข้าถึง URL ได้สามารถเรียก mutation API ได้ จึงต้องใช้ URL ที่ควบคุมการเผยแพร่และตั้ง WAF rate limit ตามหัวข้อด้านล่าง

## เริ่มใช้งานในเครื่อง

ต้องใช้ Node.js และ npm จากนั้นรัน:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

เปิด `http://localhost:3000/shop-order`

## 1. ตั้งค่า Google Sheets

1. เปิด Google Sheets API ในโปรเจกต์ Google Cloud `w10-dashboard`
2. ใช้ Service Account เดิม `w10-dashboard@w10-dashboard.iam.gserviceaccount.com`
3. แชร์ Spreadsheet ให้ Service Account เป็น Editor
4. นำ email และ private key จาก JSON ของ Service Account ไปลบในค่าด้านล่าง
5. ถ้า private key เก็บเป็นบรรทัดเดียว ให้คงตัวอักษร `\n`; ตัวระบบจะแปลงกลับเป็น newline

Service Account ไม่ต้องมีสิทธิ์ Google Drive และไม่ต้องแชร์โฟลเดอร์ Drive ให้ Service Account อีกต่อไป

## 2. ตั้งค่า Google Drive OAuth B1

### 2.1 เปิด API และตั้ง OAuth consent

1. เปิด Google Drive API ในโปรเจกต์ Google Cloud `w10-dashboard`
2. เข้า Google Auth Platform/OAuth consent screen และกรอกข้อมูลแอปให้ครบ
3. เพิ่ม `w10egat.project@gmail.com` เป็น test user หากแอปยังอยู่โหมด Testing
4. แนะนำให้ Publish เป็น Production เมื่อพร้อม เพราะ refresh token ของแอป External ที่อยู่โหมด Testing อาจมีอายุจำกัด
5. สร้าง OAuth Client ID ชนิด **Desktop app**
6. เก็บ Client ID และ Client Secret เป็นความลับ ห้าม commit JSON หรือ token ลง Git

### 2.2 สร้าง Refresh Token และโฟลเดอร์ที่ OAuth จัดการ

เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:

```powershell
$env:GOOGLE_DRIVE_OAUTH_CLIENT_ID="ใส่-client-id"
$env:GOOGLE_DRIVE_OAUTH_CLIENT_SECRET="ใส่-client-secret"
npm run shop-order:setup-drive
```

เครื่องมือจะเปิด callback ชั่วคราวเฉพาะ `127.0.0.1` ด้วยพอร์ตสุ่ม และพิมพ์ URL ให้เปิดเอง:

1. เปิด URL ในเบราว์เซอร์
2. เข้าสู่ระบบด้วย `w10egat.project@gmail.com`
3. อนุมัติสิทธิ์ Google Drive
4. กลับมาที่ Terminal
5. คัดลอก `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` และ `SHOP_ORDER_DRIVE_FOLDER_ID` ที่เครื่องมือแสดง
6. ย้ายโฟลเดอร์ `Picture-OAuth` ที่สร้างใหม่ไปไว้ใต้ `WebApp ShopOrder` ได้ตามต้องการ การย้ายไม่เปลี่ยน Folder ID

เครื่องมือไม่เปิดเบราว์เซอร์อัตโนมัติ ไม่เขียน `.env` และไม่พิมพ์ access token แต่ refresh token ที่แสดงถือเป็น secret ห้ามส่งในแชตหรือภาพหน้าจอ

อย่านำ Folder ID ของโฟลเดอร์ `Picture` เดิมมาใช้แทน เพราะ scope `drive.file` ออกแบบให้จัดการเฉพาะไฟล์/โฟลเดอร์ที่แอป OAuth สร้างหรือได้รับสิทธิ์ผ่านแอป

## 3. Environment Variables

ตั้งค่าต่อไปนี้ใน `.env.local` สำหรับเครื่องนักพัฒนา และใน Vercel Project Settings > Environment Variables สำหรับ Production (รวม Preview เฉพาะเมื่อจำเป็น):

```dotenv
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHOP_ORDER_SHEET_ID=1ZtFnQhPortoyUgKzQuruq5kU7q5V9l1GYbsSgL-9oco
SHOP_ORDER_SHEET_NAME=Order1
GOOGLE_DRIVE_OAUTH_CLIENT_ID=
GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=
GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=
SHOP_ORDER_DRIVE_FOLDER_ID=
SHOP_ORDER_CRON_SECRET=
CRON_SECRET=
```

รายละเอียดสำคัญ:

- `GOOGLE_CLIENT_EMAIL` และ `GOOGLE_PRIVATE_KEY` ต้องมาจาก JSON ของ Service Account ไฟล์เดียวกัน
- OAuth Client ID, Client Secret และ Refresh Token ต้องเป็นชุดเดียวกัน
- `SHOP_ORDER_DRIVE_FOLDER_ID` ต้องเป็น ID ของ `Picture-OAuth` ที่เครื่องมือตั้งค่าสร้าง
- สร้าง cron secret แบบสุ่มความยาวสูง และกำหนด `SHOP_ORDER_CRON_SECRET` กับ `CRON_SECRET` ให้มีค่าเดียวกัน
- Vercel ใช้ `CRON_SECRET` ส่ง `Authorization: Bearer ...`; route ตรวจค่ากับ `SHOP_ORDER_CRON_SECRET`
- หลังเพิ่มหรือแก้ Environment Variables ต้อง Redeploy deployment ใหม่

## 4. Deploy และตรวจเบื้องต้น

```powershell
npm run test:unit
npm run test:oauth-setup
npx tsc --noEmit
npm run build
```

เมื่อ push ขึ้น repository แล้วให้ Redeploy บน Vercel จากนั้นตรวจ:

1. เปิด `/shop-order` และกดรีเฟรชข้อมูล
2. เพิ่มออเดอร์เลข 6 หลักพร้อม PNG/JPEG ขนาดเล็ก
3. ตรวจว่าแถวใหม่ถูกเพิ่มใน `Order1`
4. ตรวจว่าไฟล์อยู่ใน `Picture-OAuth` และชื่อเป็น `SO-{เลขออเดอร์}-{เวลา}-{รหัสสุ่ม}.{นามสกุล}` โดยไม่มีชื่อต้นฉบับ
5. เปิดรายละเอียดและตรวจ thumbnail/ลิงก์ไฟล์
6. แก้รายการโดยแทนไฟล์ด้วย PDF และตรวจว่าไฟล์เก่าถูกตั้ง `scheduled_delete`
7. จำลองอัปโหลดล้มเหลว แล้วตรวจว่าออเดอร์ยังถูกบันทึกพร้อมแถบเตือน “เพิ่มไฟล์อีกครั้ง”
8. ลบ test order และตรวจว่าไฟล์ใหม่ถูกตั้งล้างใน 30 วัน ไม่ถูกลบทันที

## 5. Cleanup Cron

`vercel.json` เรียก `GET /api/shop-order/cleanup` ทุกวันเวลา `18:17 UTC` หรือประมาณ `01:17` ของวันถัดไปตามเวลาไทย

ทดสอบด้วย secret ที่ถูกต้อง:

```powershell
$headers = @{ Authorization = "Bearer $env:SHOP_ORDER_CRON_SECRET" }
Invoke-RestMethod -Uri "https://ชื่อโดเมน/api/shop-order/cleanup" -Headers $headers
```

ผลลัพธ์เป็นจำนวนไฟล์ที่ย้ายเข้า Trash แยกตาม pending หมดอายุและ scheduled delete ส่วน secret ผิดหรือไม่มีจะได้ HTTP 401 ห้ามใส่ secret ลง URL หรือ log

Vercel Cron ทำงานเฉพาะ Production deployment ให้ตรวจเมนู Cron Jobs และ Runtime Logs หลัง deploy

## 6. Vercel WAF Rate Limit

ใน Vercel Project > Firewall สร้าง Rate Limit rule สำหรับ mutation เท่านั้น:

- Path เท่ากับ `/api/shop-order` และ Method เป็น `POST`, `PATCH` หรือ `DELETE`
- หรือ Path เท่ากับ `/api/shop-order/upload-session` และ Method เป็น `POST`
- Key/Group by: Source IP
- Fixed window: 30 requests ต่อ 10 นาที
- Action: Rate Limit

หากหน้าจอไม่รองรับเงื่อนไข OR หลาย path ให้สร้างสอง rule แยกกัน ทดสอบว่า request ที่ 31 จาก IP เดียวกันถูก rate-limit แต่ `GET /api/shop-order`, thumbnail และ cleanup cron ไม่ติด rule นี้

WAF เป็นเพียง defense-in-depth ไม่ใช่ระบบยืนยันตัวตน

## 7. Reauthorize เมื่อ OAuth หมดอายุ

เมื่อ API ตอบ `DRIVE_OAUTH_REAUTH_REQUIRED` หรือขึ้นข้อความให้เชื่อมต่อ Google Drive ใหม่:

1. ตรวจว่า Google Drive API ยังเปิดอยู่
2. เข้า Security > Third-party access ของบัญชี `w10egat.project@gmail.com` และถอนสิทธิ์แอปเดิมหากจำเป็น
3. รัน `npm run shop-order:setup-drive` ใหม่ด้วย OAuth Client เดิม
4. นำ refresh token ใหม่ไปแทน `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` ใน Vercel
5. ใช้ Folder ID ใหม่ที่เครื่องมือสร้าง หรือยืนยันว่าโฟลเดอร์ที่เลือกถูกสร้างด้วย OAuth client นี้
6. Redeploy แล้วทดสอบ upload ใหม่

การรัน setup ใหม่จะสร้าง `Picture-OAuth` ใหม่ ไม่ควรเปลี่ยนกลับไปใช้ `Picture` เดิม

## 8. API ของ Shop Order

ทุก response JSON ใช้โครง `{ ok: true, data }` หรือ `{ ok: false, error: { code, message, referenceId? } }` และ response เป็น `no-store`

| Method | Path | หน้าที่ | Input สำคัญ |
|---|---|---|---|
| GET | `/api/shop-order` | โหลดรายการ/หน่วยงาน/ผู้รับ | ไม่มี |
| POST | `/api/shop-order` | สร้างออเดอร์ | `{ order, uploadedFileId? }` |
| PATCH | `/api/shop-order` | แก้ออเดอร์ | `{ no, order, uploadedFileId? }` |
| DELETE | `/api/shop-order` | ลบออเดอร์ | `{ no }` |
| POST | `/api/shop-order/upload-session` | สร้าง resumable session | `{ orderNumber, name, mimeType, size }` |
| GET | `/api/shop-order/attachment-thumbnail?no=...` | proxy thumbnail ที่ตรวจ ownership/lifecycle แล้ว | เลขลำดับ `no` |
| GET | `/api/shop-order/cleanup` | ย้ายไฟล์หมดอายุเข้า Trash | `Authorization: Bearer ...` |

เลขออเดอร์ต้องเป็นตัวเลข 6 หลัก หน่วยงานต้องอยู่ใน `DepartmentList` และ upload session รับเฉพาะ MIME type ที่อนุมัติกับขนาดไม่เกิน 10 MB Mutation route ปฏิเสธ cross-origin request แต่ระบบยังต้องพึ่งการควบคุม URL และ WAF เพราะไม่มี login

ผลการสร้าง/แก้ไขจะมีสถานะไฟล์แนบ:

- `none` — ไม่มีไฟล์ใหม่
- `attached` — ผูกไฟล์สำเร็จ
- `order_saved_without_attachment` — บันทึกออเดอร์แล้วแต่ตรวจ/ผูกไฟล์ไม่สำเร็จ ให้ผู้ใช้ลองแนบใหม่

## 9. การแก้ปัญหาที่พบบ่อย

- **GET `/api/shop-order` ได้ 500:** ตรวจ Service Account email/private key ว่ามาจาก JSON เดียวกัน และแชร์ Spreadsheet เป็น Editor
- **ระบบแจ้ง Drive configuration:** ตรวจ OAuth environment ทั้งสามค่าและ Folder ID; ไม่ต้องแชร์ Drive ให้ Service Account
- **Drive 403/quota:** ตรวจพื้นที่ของ `w10egat.project@gmail.com` และสถานะ Google Drive API
- **Drive 404:** Folder ID ไม่ถูกต้อง โฟลเดอร์ถูกลบ หรือใช้โฟลเดอร์ legacy ที่ OAuth client ไม่ได้สร้าง
- **ไม่มี refresh token:** ถอนสิทธิ์แอปจากบัญชี Google แล้วรัน setup ใหม่ เครื่องมือกำหนด `prompt=consent` และ `access_type=offline` อยู่แล้ว
- **รูปไม่ขึ้นแต่ไฟล์เปิดได้:** thumbnail จาก Google มีอายุสั้น ระบบจึง proxy แบบ no-store; กดรีเฟรชและตรวจว่าไฟล์ยัง active ไม่อยู่ใน Trash
- **อัปโหลดล้มเหลวชั่วคราว:** client retry เฉพาะ network, timeout, HTTP 429 และ 5xx รวมไม่เกิน 3 ครั้ง; HTTP 4xx ถาวรจะไม่ retry

## คำสั่งตรวจคุณภาพ

```powershell
npm run test:unit
npm run test:oauth-setup
npx tsc --noEmit
npx eslint app/api/shop-order components/shop-order lib/shop-order scripts/setup-shop-order-drive-oauth.mjs scripts/setup-shop-order-drive-oauth.test.mjs
npm run build
```