type AdminDashboardResource = 'builds' | 'items';

export type AdminDashboardFailure = {
  resource: AdminDashboardResource;
  reason: unknown;
};

export type AdminDashboardData = {
  buildsCount: number | null;
  itemsCount: number | null;
  failures: AdminDashboardFailure[];
};

export function formatAdminDashboardCount(count: number | null): string {
  return count === null ? '—' : String(count);
}

/**
 * Loads dashboard resources independently so one failed endpoint cannot erase
 * the valid count returned by the other endpoint.
 */
export async function loadAdminDashboardData(
  fetchBuilds: () => Promise<readonly unknown[]>,
  fetchItems: () => Promise<readonly unknown[]>
): Promise<AdminDashboardData> {
  const [buildsResult, itemsResult] = await Promise.allSettled([
    fetchBuilds(),
    fetchItems(),
  ]);
  const failures: AdminDashboardFailure[] = [];

  if (buildsResult.status === 'rejected') {
    failures.push({ resource: 'builds', reason: buildsResult.reason });
  }
  if (itemsResult.status === 'rejected') {
    failures.push({ resource: 'items', reason: itemsResult.reason });
  }

  return {
    buildsCount:
      buildsResult.status === 'fulfilled' ? buildsResult.value.length : null,
    itemsCount:
      itemsResult.status === 'fulfilled' ? itemsResult.value.length : null,
    failures,
  };
}
