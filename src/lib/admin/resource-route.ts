import 'server-only';

import { NextRequest, type NextResponse } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  enforceAdminOrigin,
  parseAdminDocumentId,
  readAdminJsonBody,
  requireAdminSessionToken,
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
    maxBodyBytes: number;
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
        const token = requireAdminSessionToken(request);
        const resources = await config.fetchAll(token);
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
        const token = requireAdminSessionToken(request);
        const body = await readAdminJsonBody(request, config.maxBodyBytes);
        const resource = await config.save(token, config.parsePayload(body));
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
        const token = requireAdminSessionToken(request);
        const id = parseAdminDocumentId(
          request.nextUrl.searchParams.get('id'),
          config.subject
        );
        await config.remove(token, id);
        return createNoStoreJsonResponse({ deletedId: id });
      } catch (error) {
        return createAdminErrorResponse(error, request);
      }
    },
  };
}
