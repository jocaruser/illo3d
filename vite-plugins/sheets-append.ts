import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import { getFixturesRootDir } from './fixtures-root-dir'

function escapeCsvValue(val: unknown): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function resolveCsvPath(
  fixturesRoot: string,
  folder: string,
  sheetName: string
): string | null {
  const safeFolder = /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : null
  if (!safeFolder) return null
  const csvPath = path.resolve(fixturesRoot, safeFolder, `${sheetName}.csv`)
  if (!csvPath.startsWith(fixturesRoot + path.sep) && csvPath !== fixturesRoot) {
    return null
  }
  return csvPath
}

export function sheetsAppendPlugin(): Plugin {
  return {
    name: 'illo3d-sheets-append',
    configureServer(server) {
      const fixturesRoot = getFixturesRootDir(server.config)
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0] ?? ''

        if (req.method === 'PUT' && pathname === '/api/sheets/row') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body) as {
                folder: string
                sheetName: string
                rowIndex: number
                row: Record<string, unknown>
              }
              const { folder, sheetName, rowIndex, row } = parsed
              if (
                !folder ||
                !sheetName ||
                typeof rowIndex !== 'number' ||
                rowIndex < 1 ||
                !row ||
                typeof row !== 'object'
              ) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid request' }))
                return
              }
              const csvPath = resolveCsvPath(fixturesRoot, folder, sheetName)
              if (!csvPath) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid folder or path' }))
                return
              }
              const headers = getHeadersForSheet(sheetName)
              if (headers.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Unknown sheet' }))
                return
              }
              const raw = fs.readFileSync(csvPath, 'utf8')
              const lines = raw.trimEnd().split(/\r?\n/)
              const lineIdx = rowIndex
              if (lineIdx >= lines.length) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Row out of range' }))
                return
              }
              const newLine = headers.map((h) => escapeCsvValue(row[h])).join(',')
              lines[lineIdx] = newLine
              fs.writeFileSync(csvPath, lines.join('\n') + '\n', 'utf8')
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
          return
        }

        if (req.method === 'DELETE' && pathname === '/api/sheets/row') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body) as {
                folder: string
                sheetName: string
                rowIndex: number
              }
              const { folder, sheetName, rowIndex } = parsed
              if (
                !folder ||
                !sheetName ||
                typeof rowIndex !== 'number' ||
                rowIndex < 1
              ) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid request' }))
                return
              }
              const csvPath = resolveCsvPath(fixturesRoot, folder, sheetName)
              if (!csvPath) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid folder or path' }))
                return
              }
              const headers = getHeadersForSheet(sheetName)
              if (headers.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Unknown sheet' }))
                return
              }
              const raw = fs.readFileSync(csvPath, 'utf8')
              const lines = raw.trimEnd().split(/\r?\n/)
              const lineIdx = rowIndex
              if (lineIdx >= lines.length) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Row out of range' }))
                return
              }
              lines.splice(lineIdx, 1)
              fs.writeFileSync(csvPath, lines.join('\n') + '\n', 'utf8')
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
          return
        }

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
            const csvPath = resolveCsvPath(fixturesRoot, folder, sheetName)
            if (!csvPath) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid folder' }))
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
  clients: ['id', 'name', 'email', 'phone', 'notes', 'created_at'],
  jobs: ['id', 'client_id', 'description', 'status', 'price', 'created_at'],
  pieces: ['id', 'job_id', 'name', 'status', 'created_at'],
  piece_items: ['id', 'piece_id', 'inventory_id', 'quantity'],
  inventory: [
    'id',
    'expense_id',
    'type',
    'name',
    'qty_initial',
    'qty_current',
    'created_at',
  ],
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
