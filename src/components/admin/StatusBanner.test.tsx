import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminStatusBanner } from './StatusBanner';

describe('AdminStatusBanner', () => {
  it('uses a neutral success title for save and delete outcomes', () => {
    render(
      <AdminStatusBanner
        status={{
          type: 'success',
          message: 'Build deleted successfully.',
        }}
      />
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Completed');
    expect(status.textContent).not.toContain('Saved');
  });
});
