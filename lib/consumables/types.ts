export interface ConsumableItem {
  no: number;
  date: string | null; // ISO yyyy-MM-dd
  dateDisplay: string; // Thai format dd/MM/yyyy
  year: number | null; // Thai year e.g. 2569
  month: number | null; // 1-12
  item: string;
  quantity: number;
  receiver: string;
  note: string;
  picUrl: string;
}

export type ConsumableInput = Omit<
  ConsumableItem,
  'no' | 'dateDisplay' | 'year' | 'month' | 'picUrl'
>;

export interface ConsumableFilters {
  query: string;
  year: 'all' | string;
  month: 'all' | string;
}

export interface ConsumableSummary {
  totalItems: number;
  totalQuantity: number;
  topItems: Array<{ name: string; quantity: number }>;
  topReceivers: Array<{ name: string; quantity: number }>;
}

export interface ConsumableBootstrap {
  items: ConsumableItem[];
  receivers: string[];
  generatedAt: string;
}

export interface ConsumableMutationResult {
  item: ConsumableItem;
  attachment: {
    status: 'none' | 'attached';
    fileId?: string;
    fileUrl?: string;
  };
}

export type ConsumableApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
