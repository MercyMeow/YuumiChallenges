import { describe, expect, it, vi } from 'vitest';
import {
  formatAdminDashboardCount,
  loadAdminDashboardData,
} from './dashboard-data';

describe('loadAdminDashboardData', () => {
  it('preserves a successful stat when the other resource fails', async () => {
    const itemsError = new Error('Items unavailable');

    await expect(
      loadAdminDashboardData(
        vi.fn().mockResolvedValue([{}, {}, {}]),
        vi.fn().mockRejectedValue(itemsError)
      )
    ).resolves.toEqual({
      buildsCount: 3,
      itemsCount: null,
      failures: [{ resource: 'items', reason: itemsError }],
    });
  });

  it('reports both successful counts without failures', async () => {
    await expect(
      loadAdminDashboardData(
        vi.fn().mockResolvedValue([{}]),
        vi.fn().mockResolvedValue([{}, {}])
      )
    ).resolves.toEqual({
      buildsCount: 1,
      itemsCount: 2,
      failures: [],
    });
  });

  it('renders a failed resource as unavailable rather than zero', () => {
    expect(formatAdminDashboardCount(null)).toBe('—');
    expect(formatAdminDashboardCount(0)).toBe('0');
  });
});
