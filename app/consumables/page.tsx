import type { Metadata } from 'next';
import { ConsumableDashboard } from '@/components/consumables/ConsumableDashboard';

export const metadata: Metadata = {
  title: 'Consumables | W10 Dashboard',
  description: 'ระบบติดตามและเบิกจ่ายคลัง Consumables · W10 Operations',
};

export default function ConsumablesPage() {
  return <ConsumableDashboard />;
}
