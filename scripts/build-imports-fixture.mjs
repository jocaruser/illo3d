/**
 * Builds fixtures/imports from merged DB import CSVs + inventory_current.
 * Run: node scripts/build-imports-fixture.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

/** Handles double-quoted fields (e.g. notes with commas). */
function parseCsvLine(line) {
  const values = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (c === ',' && !inQuotes) {
      values.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  values.push(cur)
  return values
}

/** Fixture CSVs must not contain raw commas in cells (repo uses split(',')). */
function csvCell(value) {
  return String(value ?? '')
    .trim()
    .replace(/,/g, ';')
}

function readCsvData(filePath) {
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

function parseTxDate(row) {
  const d = row.date
  if (!d) return 0
  return new Date(d + 'T12:00:00Z').getTime()
}

function txNum(id) {
  const m = /^T(\d+)$/.exec(id || '')
  return m ? Number(m[1]) : 0
}

function lotNum(id) {
  const m = /^L(\d+)$/.exec(id || '')
  return m ? Number(m[1]) : 0
}

function normalizeInventoryType(t) {
  const s = (t || '').toLowerCase()
  if (s === 'equipement') return 'equipment'
  return s === 'consumable' || s === 'filament' || s === 'equipment' ? s : 'consumable'
}

function main() {
  const amazonTx = readCsvData(path.join(root, 'docs/sources/amazon_db_import/transactions.csv'))
  const amazonLots = readCsvData(path.join(root, 'docs/sources/amazon_db_import/lots.csv'))
  const bambuTx = readCsvData(path.join(root, 'docs/sources/bambu_db_import/transactions.csv'))
  const bambuLots = readCsvData(path.join(root, 'docs/sources/bambu_db_import/lots.csv'))
  const aliTx = readCsvData(path.join(root, 'docs/sources/aliexpress_db_import/transactions.csv'))
  const aliLots = readCsvData(path.join(root, 'docs/sources/aliexpress_db_import/lots.csv'))

  const allTx = [...bambuTx, ...amazonTx, ...aliTx]
  allTx.sort((a, b) => {
    const da = parseTxDate(a) - parseTxDate(b)
    if (da !== 0) return da
    return txNum(a.id) - txNum(b.id)
  })

  const txOldToNew = new Map()
  allTx.forEach((row, i) => {
    txOldToNew.set(row.id, `T${i + 1}`)
  })

  const sortedTxRows = allTx.map((row) => ({
    ...row,
    id: txOldToNew.get(row.id),
  }))
  const dateByNewTxId = new Map(sortedTxRows.map((r) => [r.id, parseTxDate(r)]))

  const txHeader =
    'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes,archived,deleted'
  const txLines = [txHeader]
  for (const row of sortedTxRows) {
    txLines.push(
      [
        csvCell(row.id),
        csvCell(row.date),
        csvCell(row.type),
        csvCell(row.amount),
        csvCell(row.category),
        csvCell(row.concept),
        csvCell(row.ref_type),
        csvCell(row.ref_id),
        csvCell(row.client_id),
        csvCell(row.notes),
        csvCell(row.archived),
        csvCell(row.deleted),
      ].join(',')
    )
  }

  const allLots = [...bambuLots, ...amazonLots, ...aliLots].map((lot) => ({
    ...lot,
    _origLotId: lot.id,
    transaction_id: txOldToNew.get(lot.transaction_id),
  }))
  for (const lot of allLots) {
    if (!lot.transaction_id) {
      throw new Error(`Missing tx map for lot ${lot._origLotId}`)
    }
  }

  allLots.sort((a, b) => {
    const da = dateByNewTxId.get(a.transaction_id) - dateByNewTxId.get(b.transaction_id)
    if (da !== 0) return da
    const inv = (a.inventory_id || '').localeCompare(b.inventory_id || '')
    if (inv !== 0) return inv
    return lotNum(a._origLotId) - lotNum(b._origLotId)
  })

  const lotHeader = 'id,inventory_id,transaction_id,quantity,amount,created_at,archived,deleted'
  const lotLines = [lotHeader]
  allLots.forEach((lot, i) => {
    const id = `L${i + 1}`
    lotLines.push(
      [
        csvCell(id),
        csvCell(lot.inventory_id),
        csvCell(lot.transaction_id),
        csvCell(lot.quantity),
        csvCell(lot.amount),
        csvCell(lot.created_at),
        csvCell(lot.archived),
        csvCell(lot.deleted),
      ].join(',')
    )
  })

  const invPath = path.join(root, 'docs/sources/inventory_current')
  const invRaw = fs.readFileSync(invPath, 'utf8').trim().split(/\r?\n/)
  const invHeader =
    'id,type,name,qty_current,warn_yellow,warn_orange,warn_red,created_at,archived,deleted'
  const invLines = [invHeader]
  let invIndex = 0
  for (const line of invRaw) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    const id = (parts[0] || '').trim()
    const typeRaw = (parts[1] || '').trim()
    const name = (parts[2] || '').trim()
    if (!id || !name) continue
    const type = normalizeInventoryType(typeRaw)
    invIndex += 1
    const day = ((invIndex - 1) % 28) + 1
    const month = Math.min(12, Math.floor((invIndex - 1) / 28) + 1)
    const created = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`
    invLines.push(
      [csvCell(id), csvCell(type), csvCell(name), '0', '0', '0', '0', csvCell(created), '', ''].join(
        ','
      )
    )
  }

  const outDir = path.join(root, 'fixtures/imports')
  fs.mkdirSync(outDir, { recursive: true })

  fs.writeFileSync(path.join(outDir, 'transactions.csv'), txLines.join('\n') + '\n')
  fs.writeFileSync(path.join(outDir, 'lots.csv'), lotLines.join('\n') + '\n')
  fs.writeFileSync(path.join(outDir, 'inventory.csv'), invLines.join('\n') + '\n')

  const meta = {
    app: 'illo3d',
    version: '1.0.0',
    spreadsheetId: 'csv-fixture-imports',
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'dev@illo3d.local',
  }
  fs.writeFileSync(path.join(outDir, 'illo3d.metadata.json'), JSON.stringify(meta, null, 2) + '\n')

  const copyFromHappy = [
    'clients.csv',
    'jobs.csv',
    'pieces.csv',
    'piece_items.csv',
    'tags.csv',
    'tag_links.csv',
    'crm_notes.csv',
  ]
  const hp = path.join(root, 'fixtures/happy-path')
  for (const f of copyFromHappy) {
    fs.copyFileSync(path.join(hp, f), path.join(outDir, f))
  }

  console.error(
    `Wrote ${outDir}: ${sortedTxRows.length} transactions, ${allLots.length} lots, ${invLines.length - 1} inventory rows`
  )
}

main()
