import { isoToSheetSerial } from '@/lib/shop-order/domain';
import { getShopOrderRepository } from '@/lib/shop-order/repository';
import type { ShopOrderInput } from '@/lib/shop-order/types';
import {
  internalError,
  isJsonObject,
  jsonError,
  jsonSuccess,
  noStoreHeaders,
  parseJsonObject,
  rejectCrossOrigin,
} from './http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isNullableIsoDate(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    isoToSheetSerial(value);
    return true;
  } catch {
    return false;
  }
}

function isOrderInput(value: unknown): value is ShopOrderInput {
  if (!isJsonObject(value)) return false;
  return (
    typeof value.to === 'string' &&
    value.to.trim().length > 0 &&
    typeof value.number === 'string' &&
    /^\d{6}$/.test(value.number) &&
    isNullableIsoDate(value.dateIn) &&
    typeof value.subject === 'string' &&
    value.subject.trim().length > 0 &&
    typeof value.receivingUnit === 'string' &&
    typeof value.receiverName === 'string' &&
    isNullableIsoDate(value.dateOut) &&
    typeof value.note === 'string'
  );
}

function isSequence(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function readUploadedFileId(
  value: unknown,
): { ok: true; value?: string } | { ok: false } {
  if (value === undefined) return { ok: true };
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false };
  }
  return { ok: true, value };
}

function validationError(): Response {
  return jsonError(
    'VALIDATION_ERROR',
    'ข้อมูล Shop Order ไม่ถูกต้อง',
    400,
  );
}

async function validateDepartment(
  to: string,
): Promise<Response | null> {
  const repository = await getShopOrderRepository();
  const departments = await repository.listDepartments();
  return departments.includes(to.trim())
    ? null
    : jsonError(
        'INVALID_DEPARTMENT',
        'ไม่พบหน่วยงานปลายทางที่เลือก',
        400,
      );
}

export async function GET(): Promise<Response> {
  try {
    const repository = await getShopOrderRepository();
    return jsonSuccess(await repository.load());
  } catch {
    return internalError('load');
  }
}

export async function POST(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const order = parsed.value.order;
  const uploadedFile = readUploadedFileId(parsed.value.uploadedFileId);
  const repairUploadedFile = readUploadedFileId(parsed.value.repairUploadedFileId);
  if (!isOrderInput(order) || !uploadedFile.ok || !repairUploadedFile.ok) return validationError();

  try {
    const departmentError = await validateDepartment(order.to);
    if (departmentError) return departmentError;
    const repository = await getShopOrderRepository();
    return jsonSuccess(
      await repository.create(order, uploadedFile.value, repairUploadedFile.value),
      201,
    );
  } catch {
    return internalError('create');
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const order = parsed.value.order;
  const uploadedFile = readUploadedFileId(parsed.value.uploadedFileId);
  const repairUploadedFile = readUploadedFileId(parsed.value.repairUploadedFileId);
  if (
    !isSequence(parsed.value.no) ||
    !isOrderInput(order) ||
    !uploadedFile.ok ||
    !repairUploadedFile.ok
  ) {
    return validationError();
  }

  try {
    const departmentError = await validateDepartment(order.to);
    if (departmentError) return departmentError;
    const repository = await getShopOrderRepository();
    return jsonSuccess(
      await repository.update(
        parsed.value.no,
        order,
        uploadedFile.value,
        repairUploadedFile.value,
      ),
    );
  } catch {
    return internalError('update');
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;
  if (!isSequence(parsed.value.no)) return validationError();

  try {
    const repository = await getShopOrderRepository();
    await repository.remove(parsed.value.no);
    return jsonSuccess({ no: parsed.value.no });
  } catch {
    return internalError('delete');
  }
}

export { noStoreHeaders };
