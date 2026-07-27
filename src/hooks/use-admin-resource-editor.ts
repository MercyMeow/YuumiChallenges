'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminStatusState } from '@/components/admin/StatusBanner';
import { AdminClientError } from '@/lib/admin/client';

type EditorMutationResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

type AdminResourceEditorConfig<Resource, Payload> = {
  resourceName: string;
  fetchResources: () => Promise<Resource[]>;
  saveResource: (payload: Payload) => Promise<Resource>;
  deleteResource: (id: string) => Promise<string>;
  getId: (resource: Resource) => string;
  sortResources: (resources: Resource[]) => Resource[];
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useAdminResourceEditor<Resource, Payload>({
  resourceName,
  fetchResources,
  saveResource,
  deleteResource,
  getId,
  sortResources,
}: AdminResourceEditorConfig<Resource, Payload>) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [status, setStatus] = useState<AdminStatusState>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isMutating = isSubmitting || deletingId !== null;

  const getActionErrorMessage = useCallback(
    (error: unknown, fallback: string): string => {
      if (
        error instanceof AdminClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.push('/admin/login');
        return 'Your admin session expired. Log in again.';
      }
      return getErrorMessage(error, fallback);
    },
    [router]
  );

  const refreshResources = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setResources([]);
      return;
    }

    setIsDataLoading(true);
    try {
      setResources(sortResources(await fetchResources()));
    } catch (error) {
      if (
        error instanceof AdminClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        setResources([]);
        router.push('/admin/login');
        return;
      }
      throw error;
    } finally {
      setIsDataLoading(false);
    }
  }, [fetchResources, isAuthenticated, router, sortResources]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshResources().catch((error) => {
        setResources([]);
        setStatus({
          type: 'error',
          message: getActionErrorMessage(
            error,
            `Unable to load guide ${resourceName}s right now.`
          ),
        });
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    authLoading,
    getActionErrorMessage,
    isAuthenticated,
    refreshResources,
    resourceName,
  ]);

  const reportValidationError = useCallback((message: string): void => {
    setSubmitError(message);
    setStatus({ type: 'error', message });
  }, []);

  const submit = useCallback(
    async (
      payload: Payload,
      isUpdate: boolean
    ): Promise<EditorMutationResult<Resource>> => {
      setIsSubmitting(true);
      setSubmitError(null);
      setStatus({
        type: 'pending',
        message: isUpdate
          ? `Updating ${resourceName}…`
          : `Creating ${resourceName}…`,
      });

      try {
        const saved = await saveResource(payload);
        const savedId = getId(saved);
        setResources((current) =>
          sortResources([
            ...current.filter((resource) => getId(resource) !== savedId),
            saved,
          ])
        );
        setStatus({
          type: 'success',
          message: `${resourceName[0]?.toUpperCase()}${resourceName.slice(1)} ${
            isUpdate ? 'updated' : 'created'
          } successfully.`,
        });
        return { ok: true, value: saved };
      } catch (error) {
        const message = getActionErrorMessage(
          error,
          `Unable to save the ${resourceName} right now.`
        );
        setSubmitError(message);
        setStatus({ type: 'error', message });
        return { ok: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [getActionErrorMessage, getId, resourceName, saveResource, sortResources]
  );

  const remove = useCallback(
    async (id: string): Promise<EditorMutationResult<string>> => {
      setDeletingId(id);
      setStatus({
        type: 'pending',
        message: `Deleting ${resourceName}…`,
      });
      try {
        const deletedId = await deleteResource(id);
        setResources((current) =>
          current.filter((resource) => getId(resource) !== deletedId)
        );
        setStatus({
          type: 'success',
          message: `${resourceName[0]?.toUpperCase()}${resourceName.slice(1)} deleted successfully.`,
        });
        return { ok: true, value: deletedId };
      } catch (error) {
        const message = getActionErrorMessage(
          error,
          `Unable to delete the ${resourceName} right now.`
        );
        setStatus({ type: 'error', message });
        return { ok: false, message };
      } finally {
        setDeletingId(null);
      }
    },
    [deleteResource, getActionErrorMessage, getId, resourceName]
  );

  return {
    authLoading,
    clearSubmitError: () => setSubmitError(null),
    deletingId,
    isAuthenticated,
    isDataLoading,
    isMutating,
    isSubmitting,
    remove,
    reportValidationError,
    resources,
    setStatus,
    status,
    submit,
    submitError,
    user,
  };
}
