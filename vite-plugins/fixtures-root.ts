import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const PREFIX = '/fixtures/'

function resolveFixturesRoot(): string | null {
  const raw = process.env.VITE_FIXTURES_ROOT?.trim()
  if (!raw) return null
  return path.resolve(process.cwd(), raw)
}

export function fixturesRootPlugin(): Plugin {
  return {
    name: 'illo3d-fixtures-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const root = resolveFixturesRoot()
        if (!root) return next()

        if (req.method !== 'GET') return next()
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith(PREFIX)) return next()

        const relative = url.slice(PREFIX.length)
        if (!relative || relative.includes('..')) {
          res.statusCode = 400
          res.end()
          return
        }

        const filePath = path.resolve(root, relative)
        if (!filePath.startsWith(root + path.sep) && filePath !== root) {
          res.statusCode = 403
          res.end()
          return
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.statusCode = 404
            res.end()
            return
          }
          const ext = path.extname(filePath)
          if (ext === '.json') res.setHeader('Content-Type', 'application/json')
          else if (ext === '.csv') res.setHeader('Content-Type', 'text/csv; charset=utf-8')
          res.statusCode = 200
          res.end(data)
        })
      })
    },
  }
}
