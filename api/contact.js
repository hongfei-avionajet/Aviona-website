/* global process */

const CONTACT_EMAIL = 'ops@avionajet.com'

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

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.CONTACT_EMAIL_FROM

  if (!apiKey || !fromEmail) {
    return sendJson(response, 500, {
      message: 'Email service is not configured.',
    })
  }

  const body = request.body || {}
  const fields = Array.isArray(body.fields)
    ? body.fields.filter((field) => field?.label && field?.value)
    : []

  if (!fields.length) {
    return sendJson(response, 400, { message: 'No inquiry fields provided.' })
  }

  const email = getFieldValue(fields, 'about.form.email')
  const name = getFieldValue(fields, 'about.form.name')
  const subject = body.lang === 'zh'
    ? `AVIONA 网站咨询${name ? ` - ${name}` : ''}`
    : `Aviona website inquiry${name ? ` - ${name}` : ''}`

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [CONTACT_EMAIL],
      subject,
      reply_to: email || undefined,
      text: formatTextEmail(body),
      html: formatHtmlEmail(body),
    }),
  })

  const result = await resendResponse.json().catch(() => ({}))
  if (!resendResponse.ok) {
    return sendJson(response, 502, {
      message: result.message || 'Email delivery failed.',
    })
  }

  return sendJson(response, 200, { ok: true })
}
