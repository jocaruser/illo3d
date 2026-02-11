/**
 * Google Drive API v3 client for app data folder (drive.appdata scope).
 * All functions require a valid access token from DriveContext.
 */
import type { Printer, Filament, Consumable } from '../types/inventory';
import type { Database } from '../types/database';
import { DEFAULT_DATABASE } from '../types/database';

/**
 * Build a full Database for save, merging current inventory into a base (e.g. last loaded).
 */
export function buildDatabaseFromInventory(
  printers: Printer[],
  filaments: Filament[],
  consumables: Consumable[],
  base: Database = DEFAULT_DATABASE
): Database {
  return {
    ...base,
    printers,
    filaments,
    consumables,
  };
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const DATABASE_FILENAME = 'database.json';
const MIME_JSON = 'application/json';

async function driveFetch(
  accessToken: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  return res;
}

export type DriveFile = { id: string; name: string; mimeType: string };

/**
 * List files in the app data folder.
 */
export async function listAppDataFiles(accessToken: string): Promise<DriveFile[]> {
  const q = encodeURIComponent("'appDataFolder' in parents");
  const res = await driveFetch(
    accessToken,
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${q}&fields=files(id,name,mimeType)`
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive list failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.files ?? [];
}

/**
 * Get file content as text.
 */
export async function getFileContent(accessToken: string, fileId: string): Promise<string> {
  const res = await driveFetch(accessToken, `${DRIVE_API_BASE}/files/${fileId}?alt=media`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive get failed: ${res.status} ${err}`);
  }
  return res.text();
}

/**
 * Create a file in app data folder (multipart upload).
 */
export async function createAppDataFile(
  accessToken: string,
  name: string,
  content: string,
  mimeType: string = MIME_JSON
): Promise<string> {
  const metadata = { name, parents: ['appDataFolder'], mimeType };
  const boundary = '-------illo3d-multipart-boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await driveFetch(
    accessToken,
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive create failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.id;
}

/**
 * Update file content (media upload).
 */
export async function updateFileContent(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType: string = MIME_JSON
): Promise<void> {
  const res = await driveFetch(accessToken, `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': mimeType },
    body: content,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive update failed: ${res.status} ${err}`);
  }
}

/**
 * Read database.json from app data. Creates with DEFAULT_DATABASE if missing.
 */
export async function readDatabase(accessToken: string): Promise<Database> {
  const files = await listAppDataFiles(accessToken);
  const dbFile = files.find((f) => f.name === DATABASE_FILENAME);
  if (!dbFile) {
    const id = await createAppDataFile(
      accessToken,
      DATABASE_FILENAME,
      JSON.stringify(DEFAULT_DATABASE, null, 2)
    );
    return { ...DEFAULT_DATABASE } as Database;
  }
  const raw = await getFileContent(accessToken, dbFile.id);
  try {
    return JSON.parse(raw) as Database;
  } catch {
    throw new Error('Invalid database.json format');
  }
}

/**
 * Write database.json to app data. Creates file if not found.
 */
export async function saveDatabase(accessToken: string, data: Database): Promise<void> {
  const files = await listAppDataFiles(accessToken);
  const dbFile = files.find((f) => f.name === DATABASE_FILENAME);
  const content = JSON.stringify(data, null, 2);
  if (dbFile) {
    await updateFileContent(accessToken, dbFile.id, content);
  } else {
    await createAppDataFile(accessToken, DATABASE_FILENAME, content);
  }
}
