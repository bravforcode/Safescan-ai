import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import type { Plugin } from 'vite'

const PROXY_MAP: Record<string, string> = {
  '/off-food':   'world.openfoodfacts.org',
  '/off-th':     'th.openfoodfacts.org',
  '/off-beauty': 'world.openbeautyfacts.org',
  '/off-pet':    'world.openpetfoodfacts.org',
}

// Custom middleware proxy — forces HTTP/1.1 via ALPNProtocols so Node.js
// never negotiates h2 with openfoodfacts.org (which causes ERR_HTTP2_PROTOCOL_ERROR).
function offProxyPlugin(): Plugin {
  return {
    name: 'off-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = Object.keys(PROXY_MAP).find(p => req.url?.startsWith(p))
        if (!prefix) return next()

        const hostname = PROXY_MAP[prefix]
        const path     = req.url!.slice(prefix.length) || '/'
        const agent    = new https.Agent({ ALPNProtocols: ['http/1.1'] })

        const upstream = https.request(
          { hostname, path, method: 'GET', agent,
            headers: { accept: 'application/json', 'user-agent': 'SafeScanDev/1.0' } },
          (upstreamRes) => {
            // Convert 404 → 200 with null body so browser console stays clean
            if (upstreamRes.statusCode === 404) {
              res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
              res.end('{"status":0,"product":null}');
              return;
            }
            res.writeHead(upstreamRes.statusCode ?? 200, {
              'content-type': upstreamRes.headers['content-type'] ?? 'application/json',
              'access-control-allow-origin': '*',
            })
            upstreamRes.pipe(res)
          }
        )
        upstream.on('error', () => {
          if (!res.headersSent) {
            res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
            res.end('{"status":0,"product":null}');
          }
        })
        upstream.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), offProxyPlugin()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor':   ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'scanner':  ['html5-qrcode'],
        },
      },
    },
  },
})
