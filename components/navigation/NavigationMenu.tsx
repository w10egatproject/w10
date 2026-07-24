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
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

interface NavigationMenuProps {
  buttonClassName: string;
  accentClassName?: string;
  itemHoverClassName?: string;
}

interface NavigationDestination {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  hoverClassName: string;
}

const CLOSE_DELAY_MS = 150;

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
  itemHoverClassName,
}: NavigationMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activationPointerTypeRef = useRef<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(true);
  }, [cancelScheduledClose]);

  const closeMenu = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(false);
  }, [cancelScheduledClose]);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsOpen(false);
    }, CLOSE_DELAY_MS);
  }, [cancelScheduledClose]);

  useEffect(() => cancelScheduledClose, [cancelScheduledClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [closeMenu, isOpen]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !rootRef.current?.contains(nextTarget)
    ) {
      closeMenu();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={cancelScheduledClose}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onPointerDown={(event) => {
          activationPointerTypeRef.current = event.pointerType;
        }}
        onClick={() => {
          cancelScheduledClose();
          const pointerType = activationPointerTypeRef.current;
          activationPointerTypeRef.current = null;
          if (pointerType === 'mouse') {
            setIsOpen(true);
            return;
          }
          setIsOpen((current) => !current);
        }}
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
                        onClick={closeMenu}
                        className={`${commonClassName} ${itemHoverClassName ?? destination.hoverClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500`}
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
