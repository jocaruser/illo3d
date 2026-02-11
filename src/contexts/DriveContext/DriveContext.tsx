import { createContext, useCallback, useContext, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import type { Database } from '../../types/database';

const DRIVE_APP_DATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

type DriveContextValue = {
  driveAccessToken: string | null;
  driveError: string | null;
  isDriveReady: boolean;
  lastLoadedDatabase: Database | null;
  setLastLoadedDatabase: (db: Database | null) => void;
  requestDriveAccess: () => void;
  clearDriveError: () => void;
  clearDriveAccess: () => void;
};

const DriveContext = createContext<DriveContextValue | null>(null);

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [lastLoadedDatabase, setLastLoadedDatabase] = useState<Database | null>(null);

  const loginWithDrive = useGoogleLogin({
    scope: DRIVE_APP_DATA_SCOPE,
    onSuccess: (tokenResponse) => {
      setDriveAccessToken(tokenResponse.access_token);
      setDriveError(null);
    },
    onError: (errorResponse) => {
      setDriveError(errorResponse.error_description ?? errorResponse.error ?? 'Drive access failed');
    },
    onNonOAuthError: (err) => {
      setDriveError(err.type === 'popup_closed' ? null : err.type);
    },
  });

  const requestDriveAccess = useCallback(() => {
    setDriveError(null);
    loginWithDrive();
  }, [loginWithDrive]);

  const clearDriveError = useCallback(() => setDriveError(null), []);
  const clearDriveAccess = useCallback(() => {
    setDriveAccessToken(null);
    setDriveError(null);
    setLastLoadedDatabase(null);
  }, []);

  const value: DriveContextValue = {
    driveAccessToken,
    driveError,
    isDriveReady: !!driveAccessToken,
    lastLoadedDatabase,
    setLastLoadedDatabase,
    requestDriveAccess,
    clearDriveError,
    clearDriveAccess,
  };

  return <DriveContext.Provider value={value}>{children}</DriveContext.Provider>;
}

export function useDrive(): DriveContextValue {
  const ctx = useContext(DriveContext);
  if (!ctx) throw new Error('useDrive must be used within DriveProvider');
  return ctx;
}
