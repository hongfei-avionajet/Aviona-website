# AVIONA React App

This is a local React/Vite conversion of the original static AVIONA production site in `../01_Production_Site`.

## What Was Migrated

- 5 original pages: Home, Why Aviona, The Aircraft, Ways to Participate, About
- Original visual styling and image assets
- English / Chinese language switching with local preference storage
- Single-page app navigation with clean local routes
- Anchor links such as `/about#contact`
- FAQ tabs, placeholder toast messages, and click-to-reveal email

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## Production Build

```bash
npm run build
```

The built site is generated in `dist/`.

## GitHub / Vercel Readiness

This folder is ready to be uploaded to GitHub as a normal Vite React repository.

Recommended Vercel settings:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

The included `vercel.json` sends all routes back to `index.html`, so direct visits or refreshes on routes such as `/about`, `/aircraft`, and `/ways-to-participate` work after deployment.

### Contact email service

The `/api/contact` Vercel function sends inquiry emails through the existing
Alibaba Mail account over SMTP. Configure these variables for every Vercel
environment that serves the form, including Preview and Production:

- `SMTP_USER`: full Alibaba Mail address, such as `ops@avionajet.com`
- `SMTP_PASSWORD`: Alibaba Mail third-party client security password (preferred)
  or SMTP-enabled mailbox password

The function defaults to Alibaba Mail's SSL endpoint
`smtp.qiye.aliyun.com:465`. `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` may be
set only when a different SMTP endpoint is required. All inquiries are sent to
`ops@avionajet.com`, and a valid visitor email is used only as the Reply-To
address.

Never commit the SMTP password or expose it through a client-side `VITE_*`
variable. Add it directly through Vercel's encrypted Environment Variables UI.

If the contact API cannot deliver an inquiry, the browser opens a prefilled
email draft addressed to `ops@avionajet.com`. The visitor must review and send
that draft; successful API submissions continue to send automatically.

## Verification Completed

The project has been checked with:

```bash
npm ci
npm run build
npm run lint
```

Production preview routes were also checked locally for `/`, `/about`, `/aircraft`, and `/ways-to-participate`.

## Notes

- The original source package remains untouched.
- This folder has not been initialized as a Git repository yet.
- No Git remote or upload has been configured.
