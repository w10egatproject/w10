'use client';
export default function ShopOrderError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
    <h1 className="text-xl font-black">เปิดหน้า Shop Order ไม่สำเร็จ</h1><p className="mt-2 text-sm text-slate-600">กรุณาลองโหลดหน้านี้อีกครั้ง</p>
    <button onClick={reset} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white">ลองใหม่</button>
  </div></main>;
}
