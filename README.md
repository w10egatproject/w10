This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# w10dashboard" 
"# w10dashboard" 
## Shop Order

หน้า `/shop-order` ใช้ข้อมูลจากแท็บ `Order1`, `DepartmentList` และ
`ReceiverList` ใน Google Sheets พร้อมโฟลเดอร์ Google Drive ที่กำหนดไว้ ตั้งค่า:

```dotenv
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHOP_ORDER_SHEET_ID=
SHOP_ORDER_SHEET_NAME=Order1
SHOP_ORDER_DRIVE_FOLDER_ID=
```

แชร์ Spreadsheet และโฟลเดอร์ Drive ให้ service account เป็น Editor ก่อนใช้งาน
จริง ค่า private key รองรับรูปแบบที่เก็บบรรทัดใหม่เป็น `\n`

ไฟล์แนบรองรับ JPEG, PNG, GIF, WebP, HEIC/HEIF, PDF, Word และ Excel ขนาดไม่เกิน
10 MB โดย browser จะอัปโหลดตรงไปยัง Google Drive resumable session จึงไม่ส่ง
byte ของไฟล์ผ่าน Vercel Function ที่มี request body limit 4.5 MB ตัว session
URI ถือเป็น secret และจะไม่ถูกเก็บถาวรหรือเขียนลง log

ระบบนี้ตั้งใจเปิดแบบไม่มีหน้า login ผู้ที่เข้าถึง URL ได้จึงสามารถเพิ่ม แก้ไข
และลบข้อมูลได้ การลบรายการหรือเปลี่ยนไฟล์แนบจะไม่ลบไฟล์เดิมใน Drive
