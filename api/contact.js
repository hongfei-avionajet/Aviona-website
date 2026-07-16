/* global process */

import nodemailer from 'nodemailer'

const CONTACT_EMAIL = 'ops@avionajet.com'
const DEFAULT_SMTP_HOST = 'smtp.qiye.aliyun.com'
const DEFAULT_SMTP_PORT = 465
const MAX_FIELD_COUNT = 12
const MAX_LABEL_LENGTH = 120
const MAX_VALUE_LENGTH = 2000
const ALLOWED_FIELD_KEYS = new Set([
  'about.form.name',
  'about.form.email',
  'about.form.mobile',
  'about.form.location',
  'about.form.company',
  'about.form.interest',
  'about.form.region',
  'about.form.followup',
])

function sendJson(response, status, payload) {
  response.status(status).json(payload)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getFieldValue(fields, key) {
  return fields.find((field) => field.key === key)?.value || ''
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replaceAll(String.fromCharCode(0), '')
    .trim()
    .slice(0, maxLength)
}

function cleanHeaderText(value, maxLength) {
  return cleanText(value, maxLength).replace(/[\r\n]+/g, ' ')
}

function normalizeFields(value) {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, MAX_FIELD_COUNT)
    .map((field) => ({
      key: cleanText(field?.key, MAX_LABEL_LENGTH),
      label: cleanText(field?.label, MAX_LABEL_LENGTH),
      value: cleanText(field?.value, MAX_VALUE_LENGTH),
    }))
    .filter((field) => ALLOWED_FIELD_KEYS.has(field.key) && field.label && field.value)
}

function isEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getSmtpSettings() {
  const user = cleanText(process.env.SMTP_USER, 254)
  const password = process.env.SMTP_PASSWORD || ''
  const host = cleanText(process.env.SMTP_HOST, 255) || DEFAULT_SMTP_HOST
  const configuredPort = Number.parseInt(process.env.SMTP_PORT || '', 10)
  const port = Number.isInteger(configuredPort) && configuredPort > 0
    ? configuredPort
    : DEFAULT_SMTP_PORT
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465

  return { user, password, host, port, secure }
}

function formatTextEmail({ lang, fields, page }) {
  const intro = lang === 'zh'
    ? '您好，网站收到一条新的 AVIONA 咨询：'
    : 'Hello, AVIONA received a new website inquiry:'

  return [
    intro,
    '',
    ...fields.map((field) => `${field.label}: ${field.value}`),
    '',
    `Page: ${page || ''}`,
    `Submitted at: ${new Date().toISOString()}`,
  ].join('\n')
}

function formatHtmlEmail({ lang, fields, page }) {
  const intro = lang === 'zh'
    ? '网站收到一条新的 AVIONA 咨询。'
    : 'AVIONA received a new website inquiry.'

  const rows = fields.map((field) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e6e0d6;font-weight:600;">${escapeHtml(field.label)}</td>
      <td style="padding:8px 12px;border:1px solid #e6e0d6;">${escapeHtml(field.value)}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family:Arial,sans-serif;color:#252932;line-height:1.6;">
      <p>${escapeHtml(intro)}</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">${rows}</table>
      <p style="margin-top:18px;color:#6f7682;">Page: ${escapeHtml(page || '')}</p>
      <p style="color:#6f7682;">Submitted at: ${escapeHtml(new Date().toISOString())}</p>
    </div>
  `
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { message: 'Method not allowed.' })
  }

  const smtp = getSmtpSettings()

  if (!smtp.user || !smtp.password) {
    return sendJson(response, 500, {
      message: 'Email service is not configured.',
    })
  }

  const body = request.body || {}
  if (cleanText(body.website, 200)) {
    return sendJson(response, 200, { ok: true })
  }

  const fields = normalizeFields(body.fields)

  if (!fields.length) {
    return sendJson(response, 400, { message: 'No inquiry fields provided.' })
  }

  const email = cleanText(getFieldValue(fields, 'about.form.email'), 254)
  const name = cleanHeaderText(getFieldValue(fields, 'about.form.name'), 100)
  if (!isEmail(email)) {
    return sendJson(response, 400, { message: 'A valid email address is required.' })
  }
  const normalizedBody = {
    lang: body.lang === 'zh' ? 'zh' : 'en',
    page: cleanText(body.page, 2048),
    fields,
  }
  const subject = body.lang === 'zh'
    ? `AVIONA 网站咨询${name ? ` - ${name}` : ''}`
    : `Aviona website inquiry${name ? ` - ${name}` : ''}`

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    tls: {
      minVersion: 'TLSv1.2',
    },
  })

  try {
    await transporter.sendMail({
      from: {
        name: 'AVIONA Website',
        address: smtp.user,
      },
      to: CONTACT_EMAIL,
      subject,
      replyTo: isEmail(email) ? email : undefined,
      text: formatTextEmail(normalizedBody),
      html: formatHtmlEmail(normalizedBody),
    })
  } catch (error) {
    console.error('SMTP delivery failed:', error?.code || error?.message || 'unknown error')
    return sendJson(response, 502, {
      message: 'Email delivery failed.',
    })
  }

  return sendJson(response, 200, { ok: true })
}
