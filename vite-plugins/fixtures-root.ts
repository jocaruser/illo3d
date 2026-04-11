import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { getFixturesRootDir } from './fixtures-root-dir'

const PREFIX = '/fixtures/'

export function fixturesRootPlugin(): Plugin {
  return {
    name: 'illo3d-fixtures-root',
    configureServer(server) {
      const fixturesRoot = getFixturesRootDir(server.config)
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET') return next()
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith(PREFIX)) return next()

        const relative = url.slice(PREFIX.length)
        if (!relative || relative.includes('..')) {
          res.statusCode = 400
          res.end()
          return
        }

        const filePath = path.resolve(fixturesRoot, relative)
        if (
          !filePath.startsWith(fixturesRoot + path.sep) &&
          filePath !== fixturesRoot
        ) {
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
