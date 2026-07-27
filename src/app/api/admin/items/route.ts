import {
  deleteAdminItem,
  fetchAdminItems,
  parseAdminItemPayload,
  saveAdminItem,
} from '@/lib/admin/server';
import { createAdminResourceRouteHandlers } from '@/lib/admin/resource-route';

const handlers = createAdminResourceRouteHandlers({
  subject: 'item',
  collectionKey: 'items',
  resourceKey: 'item',
  fetchAll: fetchAdminItems,
  parsePayload: parseAdminItemPayload,
  save: saveAdminItem,
  remove: deleteAdminItem,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
