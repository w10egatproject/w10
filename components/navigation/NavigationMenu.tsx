'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';

interface NavigationMenuProps {
  buttonClassName: string;
  accentClassName?: string;
}

interface NavigationDestination {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  hoverClassName: string;
}

const destinations: readonly NavigationDestination[] = [
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
];

export function NavigationMenu({
  buttonClassName,
  accentClassName = 'text-[#d4a300]',
}: NavigationMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:rounded-2xl md:px-6 md:py-3 md:text-sm ${buttonClassName}`}
      >
        เมนูหน้า
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={3}
          className={`transition-transform motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-64 pt-2">
          <nav
            id={menuId}
            aria-label="เมนูนำทางหลัก"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-300/40"
          >
            <ul>
              {destinations.map((destination, index) => {
                const Icon = destination.icon;
                const iconClassName =
                  destination.iconClassName ?? accentClassName;
                const commonClassName = `flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] ${
                  index === 0 ? '' : 'border-t border-slate-100'
                }`;

                return (
                  <li key={destination.href}>
                    {pathname === destination.href ? (
                      <span
                        data-testid="navigation-destination"
                        aria-current="page"
                        className={`${commonClassName} cursor-default bg-slate-100 text-slate-700`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </span>
                    ) : (
                      <Link
                        data-testid="navigation-destination"
                        href={destination.href}
                        className={`${commonClassName} ${destination.hoverClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500`}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className={iconClassName}
                        />
                        {destination.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export default NavigationMenu;
