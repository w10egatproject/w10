export type ShopOrderStatus = 'wait' | 'done';

export interface ShopOrder {
  no: number;
  from: string;
  to: string;
  number: string;
  dateIn: string | null;
  subject: string;
  receivingUnit: string;
  receiverName: string;
  dateOut: string | null;
  note: string;
  fileUrl: string;
}

export type ShopOrderInput = Omit<ShopOrder, 'no' | 'from' | 'fileUrl'>;

export interface ShopOrderFilters {
  query: string;
  year: 'all' | string;
  month: 'all' | string;
  status: 'all' | ShopOrderStatus;
}

export interface ShopOrderSummary {
  total: number;
  wait: number;
  done: number;
  popularUnits: Array<{ name: string; count: number }>;
}

export interface ShopOrderBootstrap {
  orders: ShopOrder[];
  departments: string[];
  receivers: string[];
  generatedAt: string;
}

export interface UploadMetadata {
  name: string;
  mimeType: string;
  size: number;
}

export interface UploadSessionRequest extends UploadMetadata {
  orderNumber: string;
}

export interface UploadSession {
  fileId: string;
  uploadUrl: string;
  expiresAt: string;
}

export type AttachmentOutcome =
  | { status: 'none' }
  | { status: 'attached'; fileId: string; fileUrl: string }
  | {
      status: 'order_saved_without_attachment';
      code: string;
      message: string;
    };

export interface ShopOrderMutationResult {
  order: ShopOrder;
  attachment: AttachmentOutcome;
}

export interface AttachmentCleanupSummary {
  inspected: number;
  trashed: number;
  skipped: number;
  failed: number;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
