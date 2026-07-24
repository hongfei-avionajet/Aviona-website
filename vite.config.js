/* global process */

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const MAX_CONTACT_BODY_SIZE = 64 * 1024

function contactApiPlugin(contactEnv) {
  return {
    name: 'aviona-local-contact-api',
    configureServer(server) {
      server.middlewares.use('/api/contact', async (request, response) => {
        request.contactEnv = contactEnv
        let rawBody = ''
        for await (const chunk of request) {
          rawBody += chunk
          if (rawBody.length > MAX_CONTACT_BODY_SIZE) {
            response.statusCode = 413
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ message: 'Request body is too large.' }))
            return
          }
        }

        try {
          request.body = rawBody ? JSON.parse(rawBody) : {}
        } catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ message: 'Invalid JSON body.' }))
          return
        }

        response.status = (statusCode) => {
          response.statusCode = statusCode
          return response
        }
        response.json = (payload) => {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(payload))
        }

        try {
          const { default: contactHandler } = await import('./api/contact.js')
          await contactHandler(request, response)
        } catch (error) {
          console.error('Local contact API failed:', error?.message || 'unknown error')
          if (!response.headersSent) {
            response.statusCode = 500
            response.setHeader('Content-Type', 'application/json')
          }
          if (!response.writableEnded) {
            response.end(JSON.stringify({ message: 'Contact API failed.' }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  ;['SMTP_USER', 'SMTP_PASSWORD', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE'].forEach((key) => {
    if (process.env[key] === '') delete process.env[key]
  })
  const localEnv = loadEnv(mode, '.', '')
  const projectRoot = process.env.INIT_CWD || process.cwd()
  const vercelEnvDir = resolve(projectRoot, '.vercel')
  const vercelPreviewEnv = loadEnv('preview', vercelEnvDir, '')
  const contactEnv = { ...vercelPreviewEnv, ...localEnv }
  Object.entries(contactEnv).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value
  })

  return {
    plugins: [react(), contactApiPlugin(contactEnv)],
  }
})
