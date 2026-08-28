import { getConsumableRepository } from '@/lib/consumables/repository';
import type { ConsumableInput } from '@/lib/consumables/types';
import {
  internalError,
  isJsonObject,
  jsonError,
  jsonSuccess,
  noStoreHeaders,
  parseJsonObject,
  rejectCrossOrigin,
} from '@/app/api/shop-order/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isConsumableInput(value: unknown): value is ConsumableInput {
  if (!isJsonObject(value)) return false;
  return (
    typeof value.item === 'string' &&
    value.item.trim().length > 0 &&
    (value.date === null || typeof value.date === 'string') &&
    (typeof value.quantity === 'number' || typeof value.quantity === 'string') &&
    typeof value.receiver === 'string' &&
    typeof value.note === 'string'
  );
}

function isSequence(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export async function GET(): Promise<Response> {
  try {
    const repository = await getConsumableRepository();
    const data = await repository.load();
    return jsonSuccess(data);
  } catch {
    return internalError('load_consumables');
  }
}

export async function POST(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;

  const itemInput = parsed.value.item;
  const uploadedFileId =
    typeof parsed.value.uploadedFileId === 'string'
      ? parsed.value.uploadedFileId
      : undefined;

  if (!isConsumableInput(itemInput)) {
    return jsonError('VALIDATION_ERROR', 'ข้อมูล Consumable ไม่ถูกต้อง', 400);
  }

  try {
    const repository = await getConsumableRepository();
    const created = await repository.create(
      {
        ...itemInput,
        quantity: Number(itemInput.quantity) || 0,
      },
      uploadedFileId,
    );
    return jsonSuccess(created, 201);
  } catch {
    return internalError('create_consumable');
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;

  const no = parsed.value.no;
  const itemInput = parsed.value.item;
  const uploadedFileId =
    typeof parsed.value.uploadedFileId === 'string'
      ? parsed.value.uploadedFileId
      : undefined;
  const existingPicUrl =
    typeof parsed.value.existingPicUrl === 'string'
      ? parsed.value.existingPicUrl
      : undefined;

  if (!isSequence(no) || !isConsumableInput(itemInput)) {
    return jsonError('VALIDATION_ERROR', 'ข้อมูล Consumable ไม่ถูกต้อง', 400);
  }

  try {
    const repository = await getConsumableRepository();
    const updated = await repository.update(
      no,
      {
        ...itemInput,
        quantity: Number(itemInput.quantity) || 0,
      },
      uploadedFileId,
      existingPicUrl,
    );
    return jsonSuccess(updated);
  } catch {
    return internalError('update_consumable');
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed.response;

  const no = parsed.value.no;
  if (!isSequence(no)) {
    return jsonError('VALIDATION_ERROR', 'ลำดับรายการไม่ถูกต้อง', 400);
  }

  try {
    const repository = await getConsumableRepository();
    await repository.remove(no);
    return jsonSuccess({ no });
  } catch {
    return internalError('delete_consumable');
  }
}

export { noStoreHeaders };
