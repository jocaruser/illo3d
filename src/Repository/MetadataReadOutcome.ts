import type { ShopMetadata } from '@/Entity/ShopMetadata'

export const INVALID_JSON_METADATA_DETAIL = 'metadata file is not valid JSON'
export const INVALID_SHOP_METADATA_DETAIL =
  'metadata file is not valid shop metadata'

export type MetadataReadOutcome =
  | { kind: 'absent' }
  | { kind: 'damaged'; detail: string }
  | { kind: 'present'; metadata: ShopMetadata }
