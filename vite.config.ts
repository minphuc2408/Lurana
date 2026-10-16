import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { getSiteConfiguration } from './src/shared/config/seo'
import { seoPlugin } from './scripts/seo.mjs'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  const site = getSiteConfiguration(env, process.env.CLOUDFLARE_ENV === 'staging')
  return {
  define: { __LUNARA_SITE_CONFIGURATION__: JSON.stringify(site) },
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('commonjsHelpers')) return 'runtime'

          const modulePath = id.replace(/\\/g, '/')
          if (/\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(modulePath)) {
            return 'react-vendor'
          }
          if (/\/node_modules\/(recharts|recharts-scale|victory-vendor|d3-[^/]+|internmap|react-smooth)\//.test(modulePath)) {
            return 'charts-vendor'
          }
        },
      },
    },
  },
  plugins: [
    seoPlugin(site),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    cloudflare({ remoteBindings: false }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
}})
