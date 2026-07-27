import {
  deleteAdminBuild,
  fetchAdminBuilds,
  parseAdminBuildPayload,
  saveAdminBuild,
} from '@/lib/admin/server';
import { createAdminResourceRouteHandlers } from '@/lib/admin/resource-route';

const handlers = createAdminResourceRouteHandlers({
  subject: 'build',
  collectionKey: 'builds',
  resourceKey: 'build',
  fetchAll: fetchAdminBuilds,
  parsePayload: parseAdminBuildPayload,
  save: saveAdminBuild,
  remove: deleteAdminBuild,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
