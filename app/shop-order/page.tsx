import type { Metadata } from 'next';
import { ShopOrderDashboard } from '@/components/shop-order/ShopOrderDashboard';

export const metadata: Metadata = { title: 'Shop Order | W10 Dashboard', description: 'ระบบติดตามรายการ Shop Order' };
export default function ShopOrderPage() { return <ShopOrderDashboard />; }
