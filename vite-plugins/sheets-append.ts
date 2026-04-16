import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import { getFixturesRootDir } from './fixtures-root-dir'
import { SHEET_HEADERS, type SheetName } from '../src/services/sheets/config'

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

        function resolveDataLineIndex(lines: string[], rowIndex: number): number | null {
          // rowIndex is 1-based data-row index (excluding header)
          let seen = 0
          for (let i = 1; i < lines.length; i++) {
            if (lines[i]?.trim() === '') continue
            seen += 1
            if (seen === rowIndex) return i
          }
          return null
        }

        if (req.method === 'POST' && pathname === '/api/sheets/replace') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body) as {
                folder: string
                sheetName: string
                matrix: string[][]
              }
              const { folder, sheetName, matrix } = parsed
              const matrixOk =
                Array.isArray(matrix) &&
                matrix.length > 0 &&
                matrix.every(
                  (row) =>
                    Array.isArray(row) &&
                    row.every((c) => typeof c === 'string')
                )
              if (!folder || !sheetName || !matrixOk) {
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
              const lines = matrix.map((row) =>
                row.map((c) => escapeCsvValue(c)).join(',')
              )
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
              const lineIdx = resolveDataLineIndex(lines, rowIndex)
              if (lineIdx === null) {
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
              const lineIdx = resolveDataLineIndex(lines, rowIndex)
              if (lineIdx === null) {
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
            if (headers.length === 0) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Unknown sheet' }))
              return
            }
            const lines = rows.map((obj) =>
              headers.map((h) => escapeCsvValue(obj[h])).join(',')
            )
            const toAppend = (lines.length ? lines.join('\n') + '\n' : '')
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

function getHeadersForSheet(sheetName: string): string[] {
  if (!(sheetName in SHEET_HEADERS)) return []
  return [...SHEET_HEADERS[sheetName as SheetName]]
}
