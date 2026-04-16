import type { User, Credentials } from '@/stores/authStore'
import type { Shop } from '@/types/shop'

const DEV_USER: User = {
  email: 'dev@illo3d.local',
  name: 'Dev User',
}

const DEV_CREDENTIALS: Credentials = {
  accessToken: 'dev-fake-token',
}

const DEV_SHOP: Shop = {
  folderId: 'dev-fixture-folder-id',
  folderName: 'Dev Fixture Shop',
  spreadsheetId: 'dev-fixture-spreadsheet-id',
  metadataVersion: '2.0.0',
}

export interface DevFixtures {
  user: User
  credentials: Credentials
  shop: Shop
}

export function getDevFixtures(): DevFixtures {
  return {
    user: DEV_USER,
    credentials: DEV_CREDENTIALS,
    shop: DEV_SHOP,
  }
}
