#!/usr/bin/env node
/**
 * Migrate an illo3d v1.0.0 CSV shop to v2.0.0.
 *
 * Moves `crm_notes.csv` and `tag_links.csv` rows into `audit_log.csv` as
 * immutable `create` events, removes the legacy sheets, and bumps the
 * metadata version to 2.0.0.
 *
 * A `.v1-backup/` folder is created before any changes. If the migration
 * throws, the script restores the backed-up files.
 *
 * Usage:
 *   node scripts/migrate-v2-audit-log.mjs <path-to-fixture-folder>
 */
import fs from 'node:fs'
import path from 'node:path'

const TARGET_VERSION = '2.0.0'
const BACKUP_DIR = '.v1-backup'

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

function readCsvData(filePath) {
  if (!fs.existsSync(filePath)) return []
  const text = fs.readFileSync(filePath, 'utf8').trim()
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []
  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    header.forEach((h, i) => {
      const v = values[i]
      if (v !== undefined && v !== '') row[h] = v.trim()
    })
    return row
  })
}

function escapeCsvValue(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function auditHeader() {
  return [
    'id',
    'timestamp',
    'actor',
    'entity_name',
    'entity_id',
    'action',
    'before_json',
    'after_json',
    'parent_entity_name',
    'parent_entity_id',
  ]
}

function buildAuditRow(id, timestamp, actor, entityName, entityId, action, after) {
  return [
    escapeCsvValue(id),
    escapeCsvValue(timestamp),
    escapeCsvValue(actor),
    escapeCsvValue(entityName),
    escapeCsvValue(entityId),
    escapeCsvValue(action),
    '',
    escapeCsvValue(JSON.stringify(after)),
    '',
    '',
  ].join(',')
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return
  fs.copyFileSync(src, dest)
}

function createBackup(dir, files) {
  const backupPath = path.join(dir, BACKUP_DIR)
  fs.mkdirSync(backupPath, { recursive: true })
  for (const f of files) {
    copyFile(path.join(dir, f), path.join(backupPath, f))
  }
}

function restoreBackup(dir, files) {
  const backupPath = path.join(dir, BACKUP_DIR)
  if (!fs.existsSync(backupPath)) return
  for (const f of files) {
    const backupFile = path.join(backupPath, f)
    const targetFile = path.join(dir, f)
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, targetFile)
    } else if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile)
    }
  }
}

function migrate(dir) {
  const metadataPath = path.join(dir, 'illo3d.metadata.json')
  const auditPath = path.join(dir, 'audit_log.csv')
  const crmPath = path.join(dir, 'crm_notes.csv')
  const tagLinksPath = path.join(dir, 'tag_links.csv')

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  if (metadata.app !== 'illo3d') {
    throw new Error(`Unexpected app in metadata: ${metadata.app}`)
  }

  const notes = readCsvData(crmPath)
  const links = readCsvData(tagLinksPath)

  if (notes.length === 0 && links.length === 0 && metadata.version === TARGET_VERSION) {
    console.log(`Nothing to migrate in ${dir}`)
    return
  }

  let auditLines = []
  if (fs.existsSync(auditPath)) {
    auditLines = fs.readFileSync(auditPath, 'utf8').trim().split(/\r?\n/)
  } else {
    auditLines = [auditHeader().join(',')]
  }

  let nextAuditId = 1
  for (let i = 1; i < auditLines.length; i += 1) {
    const row = parseCsvLine(auditLines[i])
    const m = /^AL(\d+)$/.exec(row[0] ?? '')
    if (m) nextAuditId = Math.max(nextAuditId, Number(m[1]) + 1)
  }

  const actor = metadata.createdBy || 'local'

  for (const note of notes) {
    const after = {
      id: note.id,
      entity_type: note.entity_type,
      entity_id: note.entity_id,
      body: note.body,
      referenced_entity_ids: note.referenced_entity_ids || '',
      severity: note.severity,
      created_at: note.created_at,
      archived: note.archived || '',
      deleted: note.deleted || '',
    }
    auditLines.push(
      buildAuditRow(
        `AL${nextAuditId}`,
        note.created_at,
        actor,
        'crm_note',
        note.id,
        'create',
        after
      )
    )
    nextAuditId += 1
  }

  for (const link of links) {
    const after = {
      id: link.id,
      tag_id: link.tag_id,
      entity_type: link.entity_type,
      entity_id: link.entity_id,
      created_at: link.created_at,
      archived: link.archived || '',
      deleted: link.deleted || '',
    }
    auditLines.push(
      buildAuditRow(
        `AL${nextAuditId}`,
        link.created_at,
        actor,
        'tag_link',
        link.id,
        'create',
        after
      )
    )
    nextAuditId += 1
  }

  fs.writeFileSync(auditPath, auditLines.join('\n') + '\n')

  if (fs.existsSync(crmPath)) fs.unlinkSync(crmPath)
  if (fs.existsSync(tagLinksPath)) fs.unlinkSync(tagLinksPath)

  metadata.version = TARGET_VERSION
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n')

  console.log(
    `Migrated ${dir}: ${notes.length} notes, ${links.length} tag links → audit_log.csv; version ${TARGET_VERSION}`
  )
}

function main() {
  const target = process.argv[2]
  if (!target) {
    console.error('Usage: node scripts/migrate-v2-audit-log.mjs <path-to-fixture-folder>')
    process.exit(1)
  }

  const dir = path.resolve(target)
  if (!fs.existsSync(dir)) {
    console.error(`Folder not found: ${dir}`)
    process.exit(1)
  }

  const metadataPath = path.join(dir, 'illo3d.metadata.json')
  if (!fs.existsSync(metadataPath)) {
    console.error(`Missing metadata file: ${metadataPath}`)
    process.exit(1)
  }

  const filesToBackup = [
    'illo3d.metadata.json',
    'crm_notes.csv',
    'tag_links.csv',
    'audit_log.csv',
  ]

  createBackup(dir, filesToBackup)

  try {
    migrate(dir)
  } catch (error) {
    console.error('Migration failed, rolling back...')
    restoreBackup(dir, filesToBackup)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
