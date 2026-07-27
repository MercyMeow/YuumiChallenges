import { NextRequest } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  deleteAdminBuild,
  enforceAdminOrigin,
  fetchAdminBuilds,
  parseAdminBuildPayload,
  parseAdminDocumentId,
  readAdminJsonBody,
  requireGuideEditorSession,
  saveAdminBuild,
} from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireGuideEditorSession(request);
    const builds = await fetchAdminBuilds(session.token);
    return createNoStoreJsonResponse({ builds });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceAdminOrigin(request);
    const session = await requireGuideEditorSession(request);
    const body = await readAdminJsonBody(request);
    const build = await saveAdminBuild(
      session.token,
      parseAdminBuildPayload(body)
    );
    return createNoStoreJsonResponse({ build });
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
      'build'
    );
    await deleteAdminBuild(session.token, id);
    return createNoStoreJsonResponse({ deletedId: id });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
