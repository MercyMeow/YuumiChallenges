import type {
  AdminBuildPayload as InferredAdminBuildPayload,
  AdminItemPayload as InferredAdminItemPayload,
} from './guide-validation';

export {
  adminBuildPayloadSchema,
  adminDocumentIdSchema,
  adminItemPayloadSchema,
  describeAdminValidationIssue,
  MAX_ADMIN_BUILD_DOCUMENT_BYTES,
} from './guide-validation';

export type AdminRole = 'admin' | 'editor';

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
}

export type AdminBuildPayload = InferredAdminBuildPayload;

export interface AdminBuild extends Omit<AdminBuildPayload, 'id'> {
  id: string;
  updatedAt: number;
}

export type AdminItemCategory = AdminItemPayload['category'];

export type AdminItemPayload = InferredAdminItemPayload;

export interface AdminItem extends Omit<AdminItemPayload, 'id'> {
  id: string;
  updatedAt: number;
}
