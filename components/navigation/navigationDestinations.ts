import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react';

import type { ConsoleRoute } from '@/components/layout/shellRoutes';

export interface NavigationDestination {
  href: ConsoleRoute | string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  hoverClassName: string;
  external?: boolean;
}

export const navigationDestinations: readonly NavigationDestination[] = [
  {
    href: '/',
    label: 'หน้าหลัก',
    icon: ArrowLeft,
    iconClassName: 'text-slate-500',
    hoverClassName: 'hover:bg-slate-50',
  },
  {
    href: '/purchasing',
    label: 'จัดซื้อจัดจ้าง',
    icon: ShoppingCart,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/purchasing-all',
    label: 'สถานะการซื้อจ้างทั้งหมด',
    icon: ShoppingBag,
    hoverClassName: 'hover:bg-yellow-50',
  },
  {
    href: '/beml-inventory',
    label: 'คลังอะไหล่ BEML',
    icon: Package,
    hoverClassName: 'hover:bg-yellow-50/50',
  },
  {
    href: 'https://ot-plus.vercel.app/',
    label: 'ระบบลงเวลา OT (OT+)',
    icon: Clock,
    iconClassName: 'text-indigo-600',
    hoverClassName: 'hover:bg-indigo-50',
    external: true,
  },
  {
    href: '/ot-summary',
    label: 'สรุป OT ลูกจ้าง',
    icon: Clock,
    iconClassName: 'text-sky-500',
    hoverClassName: 'hover:bg-sky-50',
  },
  {
    href: '/ot-employee',
    label: 'สรุป OT พนักงาน',
    icon: UserRound,
    iconClassName: 'text-amber-500',
    hoverClassName: 'hover:bg-amber-50',
  },
  {
    href: '/shop-order',
    label: 'Shop Order',
    icon: ClipboardList,
    iconClassName: 'text-indigo-500',
    hoverClassName: 'hover:bg-indigo-50',
  },
  {
    href: '/consumables',
    label: 'Consumables',
    icon: Package,
    iconClassName: 'text-emerald-500',
    hoverClassName: 'hover:bg-emerald-50',
  },
];
