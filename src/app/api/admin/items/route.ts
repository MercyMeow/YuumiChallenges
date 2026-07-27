import { NextRequest } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  deleteAdminItem,
  enforceAdminOrigin,
  fetchAdminItems,
  parseAdminDocumentId,
  parseAdminItemPayload,
  readAdminJsonBody,
  requireGuideEditorSession,
  saveAdminItem,
} from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireGuideEditorSession(request);
    const items = await fetchAdminItems(session.token);
    return createNoStoreJsonResponse({ items });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceAdminOrigin(request);
    const session = await requireGuideEditorSession(request);
    const body = await readAdminJsonBody(request);
    const item = await saveAdminItem(
      session.token,
      parseAdminItemPayload(body)
    );
    return createNoStoreJsonResponse({ item });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    enforceAdminOrigin(request);
    const session = await requireGuideEditorSession(request);
    const id = parseAdminDocumentId(
      request.nextUrl.searchParams.get('id'),
      'item'
    );
    await deleteAdminItem(session.token, id);
    return createNoStoreJsonResponse({ deletedId: id });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
