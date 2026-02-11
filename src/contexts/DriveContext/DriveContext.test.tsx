import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriveProvider, useDrive } from './DriveContext';

const mockLogin = vi.fn();
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (opts: { onSuccess: (r: { access_token: string }) => void }) => {
    mockLogin.mockImplementation(() => opts.onSuccess({ access_token: 'mock-drive-token' }));
    return mockLogin;
  },
}));

function TestConsumer() {
  const drive = useDrive();
  return (
    <div>
      <span data-testid="ready">{String(drive.isDriveReady)}</span>
      <span data-testid="error">{drive.driveError ?? ''}</span>
      <button type="button" onClick={drive.requestDriveAccess}>
        Connect
      </button>
      <button type="button" onClick={drive.clearDriveAccess}>
        Disconnect
      </button>
    </div>
  );
}

describe('DriveContext', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('provides isDriveReady false initially', () => {
    render(
      <DriveProvider>
        <TestConsumer />
      </DriveProvider>
    );
    expect(screen.getByTestId('ready')).toHaveTextContent('false');
  });

  it('after requestDriveAccess and onSuccess, provides token and isDriveReady true', async () => {
    const user = userEvent.setup();
    render(
      <DriveProvider>
        <TestConsumer />
      </DriveProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(mockLogin).toHaveBeenCalled();
    expect(screen.getByTestId('ready')).toHaveTextContent('true');
  });

  it('clearDriveAccess resets state', async () => {
    const user = userEvent.setup();
    render(
      <DriveProvider>
        <TestConsumer />
      </DriveProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(screen.getByTestId('ready')).toHaveTextContent('false');
  });
});
