import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'

const FIXTURES_DIR = 'public/fixtures'

function escapeCsvValue(val: unknown): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function sheetsAppendPlugin(): Plugin {
  return {
    name: 'illo3d-sheets-append',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/sheets/append') {
          return next()
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { folder, sheetName, rows } = JSON.parse(body) as {
              folder: string
              sheetName: string
              rows: Record<string, unknown>[]
            }
            if (!folder || !sheetName || !Array.isArray(rows)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid request' }))
              return
            }
            const safeFolder = /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : null
            if (!safeFolder) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid folder' }))
              return
            }
            const csvPath = path.resolve(
              process.cwd(),
              FIXTURES_DIR,
              safeFolder,
              `${sheetName}.csv`
            )
            if (!csvPath.startsWith(path.resolve(process.cwd(), FIXTURES_DIR))) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Path outside fixtures' }))
              return
            }
            const headers = getHeadersForSheet(sheetName)
            const lines = rows.map((obj) =>
              headers.map((h) => escapeCsvValue(obj[h])).join(',')
            )
            const toAppend =
              (lines.length ? '\n' : '') + lines.join('\n') + (lines.length ? '\n' : '')
            fs.appendFileSync(csvPath, toAppend)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Unknown error',
              })
            )
          }
        })
      })
    },
  }
}

const SHEET_HEADERS: Record<string, string[]> = {
  expenses: ['id', 'date', 'category', 'amount', 'notes'],
  transactions: [
    'id',
    'date',
    'type',
    'amount',
    'category',
    'concept',
    'ref_type',
    'ref_id',
    'client_id',
    'notes',
  ],
}

function getHeadersForSheet(sheetName: string): string[] {
  return SHEET_HEADERS[sheetName] ?? []
}
