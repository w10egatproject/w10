'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ROUTE_PAGE_TITLES: Record<string, string> = {
  '/': 'หน้าหลัก | W10 Dashboard',
  '/purchasing': 'จัดซื้อจัดจ้าง | W10 Dashboard',
  '/purchasing-all': 'สถานะการซื้อจ้างทั้งหมด | W10 Dashboard',
  '/beml-inventory': 'คลังอะไหล่ BEML | W10 Dashboard',
  '/ot-summary': 'สรุป OT ลูกจ้าง | W10 Dashboard',
  '/ot-employee': 'สรุป OT พนักงาน | W10 Dashboard',
  '/shop-order': 'Shop Order | W10 Dashboard',
  '/consumables': 'Consumables | W10 Dashboard',
};

export function RouteTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    const title = ROUTE_PAGE_TITLES[pathname] || 'W10 Dashboard';
    document.title = title;
  }, [pathname]);

  return null;
}
