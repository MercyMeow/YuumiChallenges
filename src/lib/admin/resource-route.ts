import 'server-only';

import { NextRequest, type NextResponse } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  enforceAdminOrigin,
  parseAdminDocumentId,
  readAdminJsonBody,
  requireGuideEditorSession,
} from './server';

type AdminResourceDescriptor =
  | {
      subject: 'build';
      collectionKey: 'builds';
      resourceKey: 'build';
    }
  | {
      subject: 'item';
      collectionKey: 'items';
      resourceKey: 'item';
    };

type AdminResourceRouteConfig<Payload, FetchedResource, SavedResource> =
  AdminResourceDescriptor & {
    fetchAll: (sessionToken: string) => Promise<FetchedResource[]>;
    parsePayload: (body: Record<string, unknown>) => Payload;
    save: (sessionToken: string, payload: Payload) => Promise<SavedResource>;
    remove: (sessionToken: string, id: string) => Promise<unknown>;
  };

type AdminResourceRouteHandlers = {
  GET: (request: NextRequest) => Promise<NextResponse>;
  POST: (request: NextRequest) => Promise<NextResponse>;
  DELETE: (request: NextRequest) => Promise<NextResponse>;
};

/**
 * Keeps the origin/session/error sequence identical for every mutable guide
 * resource while leaving resource-specific validation and persistence explicit.
 */
export function createAdminResourceRouteHandlers<
  Payload,
  FetchedResource,
  SavedResource,
>(
  config: AdminResourceRouteConfig<Payload, FetchedResource, SavedResource>
): AdminResourceRouteHandlers {
  return {
    GET: async (request) => {
      try {
        const session = await requireGuideEditorSession(request);
        const resources = await config.fetchAll(session.token);
        return createNoStoreJsonResponse({
          [config.collectionKey]: resources,
        });
      } catch (error) {
        return createAdminErrorResponse(error, request);
      }
    },

    POST: async (request) => {
      try {
        enforceAdminOrigin(request);
        const session = await requireGuideEditorSession(request);
        const body = await readAdminJsonBody(request);
        const resource = await config.save(
          session.token,
          config.parsePayload(body)
        );
        return createNoStoreJsonResponse({
          [config.resourceKey]: resource,
        });
      } catch (error) {
        return createAdminErrorResponse(error, request);
      }
    },

    DELETE: async (request) => {
      try {
        enforceAdminOrigin(request);
        const session = await requireGuideEditorSession(request);
        const id = parseAdminDocumentId(
          request.nextUrl.searchParams.get('id'),
          config.subject
        );
        await config.remove(session.token, id);
        return createNoStoreJsonResponse({ deletedId: id });
      } catch (error) {
        return createAdminErrorResponse(error, request);
      }
    },
  };
}
