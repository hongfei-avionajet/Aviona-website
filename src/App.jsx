import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import {
  APPROVED_CONTENT_2026_I18N,
  applyApprovedContent2026,
} from './content/approvedContent2026'
import { I18N as BASE_I18N } from './content/i18n'
import { pages } from './content/pages'

const I18N = { ...BASE_I18N, ...APPROVED_CONTENT_2026_I18N }

const routeMap = {
  '/': 'home',
  '/index.html': 'home',
  '/why-aviona': 'why',
  '/why-aviona.html': 'why',
  '/aircraft': 'aircraft',
  '/aircraft.html': 'aircraft',
  '/ways-to-participate': 'ways',
  '/ways-to-participate.html': 'ways',
  '/about': 'about',
  '/about.html': 'about',
  '/contact': 'contact',
  '/contact.html': 'contact',
}

const pagePaths = {
  home: '/',
  why: '/why-aviona',
  aircraft: '/aircraft',
  ways: '/ways-to-participate',
  about: '/about',
  contact: '/contact',
}

const dataTargetToPage = {
  home: 'home',
  why: 'why',
  aircraft: 'aircraft',
  ways: 'ways',
  about: 'about',
  contact: 'contact',
}

const fallbackLabelTranslations = [
  { key: 'btn.subscribe', labels: ['Subscribe', '认购'] },
  { key: 'btn.book', labels: ['Book a Flight', '预订航班'] },
  { key: 'v5.final.cta1', labels: ['Start Investing', '立即投资'] },
]

const externalToastLabelKeyByTarget = {
  'Booking Page — Coming Soon': 'btn.book',
  'WeChat — Coming Soon': 'about.ch.wechat',
  'Telegram — Coming Soon': 'about.ch.telegram',
  'Eligibility — Coming Soon': 'ftr.eligibility',
  'Privacy Policy — Coming Soon': 'ftr.privacy',
  'Terms of Service — Coming Soon': 'ftr.terms',
}

const wordpressPostsEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=100&_embed=1&orderby=date&order=desc'

const secureStoreUrl = 'https://ava.store.sandbox.brickken.com/en/store/'

const wordpressCarouselEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=1&_embed=1&orderby=date&order=desc'

const wordpressAircraftHeroMediaCategory = 790314762
const wordpressAircraftHeroMediaEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=1&_embed=1&orderby=date&order=desc'

const wordpressNewsCategories = {
  en: 4236455,
  zh: 286977090,
}

let aircraftHeroMediaCache = []
const wordpressCarouselCache = new Map()
const wordpressCarouselRequests = new Map()
const videoPressSourceCache = {}
const newsPostsCache = {}
const wordpressCarouselRefreshMs = 300000

const newsFallbackImages = [
  '/assets/news/news-cabin-wide.jpg',
  '/assets/news/news-cabin-suite.jpg',
  '/assets/news/news-cabin-dining.jpg',
  '/assets/news/news-cabin-table.jpg',
]

const contactChannels = [
  {
    id: 'whatsapp',
    icon: 'whatsapp',
    label: { en: 'WhatsApp', zh: 'WhatsApp' },
    description: { en: 'Scan to add Flo on WhatsApp.', zh: '扫码添加 WhatsApp 联系人 Flo。' },
    image: '/assets/contact/whatsapp-qr-cropped.jpg',
    value: '+65 9136 7485',
    href: 'https://wa.me/6591367485',
  },
  {
    id: 'telegram',
    icon: 'telegram',
    label: { en: 'Telegram', zh: 'Telegram' },
    description: { en: 'Scan or search the Telegram account.', zh: '扫码或搜索 Telegram 账号。' },
    image: '/assets/contact/telegram-qr-cropped.jpg',
    value: '@JET_HONGFEI',
  },
  {
    id: 'wechat',
    icon: 'wechat',
    label: { en: 'WeChat', zh: '微信' },
    description: { en: 'Scan to add Aviona on WeChat.', zh: '扫码添加 Aviona 微信。' },
    image: '/assets/contact/wechat-qr-cropped.jpg',
    value: 'NSEJET',
  },
  {
    id: 'email',
    icon: 'email',
    label: { en: 'Email', zh: '邮箱' },
    description: { en: 'Send us a note by email.', zh: '通过邮箱联系我们。' },
    value: 'ops@avionajet.com',
    linkLabel: { en: 'Send Email', zh: '发送邮件' },
    href: 'mailto:ops@avionajet.com',
  },
  {
    id: 'phone',
    icon: 'phone',
    label: { en: 'Phone', zh: '电话' },
    description: { en: 'Call or save the VIP contact number.', zh: '拨打或保存 VIP 联系电话。' },
    value: '+65 9136 7485',
    linkLabel: { en: 'Call Now', zh: '立即拨打' },
    href: 'tel:+6591367485',
  },
]

function FloatingContactIcon({ type }) {
  if (type === 'invest') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M4 16.5L9 11.5L12.5 15L20 7.5" />
        <path d="M15 7.5H20V12.5" />
      </svg>
    )
  }

  if (type === 'whatsapp') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M6.2 18.4L7.1 15.8A6.5 6.5 0 1 1 9.2 17.5L6.2 18.4Z" />
        <path d="M9.6 9.1C10.3 12 12 13.7 14.9 14.4" />
        <path d="M9.6 9.1L10.8 8.2" />
        <path d="M14.9 14.4L15.8 13.2" />
      </svg>
    )
  }

  if (type === 'telegram') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M20 5L4 12L9.5 14.2L12 19L14.3 15.5L18 18L20 5Z" />
        <path d="M9.5 14.2L14.3 10.6" />
      </svg>
    )
  }

  if (type === 'wechat') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M10.2 16.4C7.2 16.4 4.8 14.6 4.8 12.3C4.8 10 7.2 8.2 10.2 8.2C13.2 8.2 15.6 10 15.6 12.3C15.6 14.6 13.2 16.4 10.2 16.4Z" />
        <path d="M14.1 15.8C15 16.7 16.2 17.2 17.6 17.2C18.3 17.2 18.9 17.1 19.5 16.8L18.9 15.8C19.4 15.3 19.6 14.8 19.6 14.1C19.6 12.7 18.2 11.5 16.3 11.2" />
      </svg>
    )
  }

  if (type === 'phone') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M7.2 5.2L9.6 4L12 8.8L10.5 9.9C11.3 11.5 12.5 12.7 14.1 13.5L15.2 12L20 14.4L18.8 16.8C18.2 18 16.8 18.5 15.5 18.1C10.8 16.7 7.3 13.2 5.9 8.5C5.5 7.2 6 5.8 7.2 5.2Z" />
      </svg>
    )
  }

  if (type === 'contact') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M5 7.5H19V16H10L6 19V16H5V7.5Z" />
        <path d="M8.5 11.5H15.5" />
        <path d="M8.5 13.7H13" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M4 7.5H20V17.5H4V7.5Z" />
      <path d="M4 8L12 13.2L20 8" />
    </svg>
  )
}

const newsCarouselHostHtml =
  '<div class="certification-copy news-carousel-host" data-news-carousel-host></div>'

const heroBackgroundPattern =
  /<div class="hero-bg" style="background-image: url\('([^']+)'\);"><\/div>/

const certificationCopyPattern =
  /<div class="certification-copy">[\s\S]*?<\/div>(\n {6}<figure class="certificate-frame">)/

const contentCarouselSlots = {
  home: [
    {
      key: 'home-hero',
      categoryId: 790497678,
      kind: 'hero',
      a11yKey: 'v5.hero.h1',
      fallbackImage: '/assets/photos/jet-sunset.jpg',
      fallbackTitle: 'Aviona home hero',
      hostClass: 'hero-bg hero-banner-host',
      pattern: heroBackgroundPattern,
    },
    {
      key: 'home-class-a',
      categoryId: 790497681,
      kind: 'inline',
      a11yKey: 'v5.card.h.a',
      variant: 'card',
      fallbackImage: '/assets/photos/engine-closeup.jpg',
      fallbackTitle: 'Class A — Invest',
      hostClass: 'img-wrap content-image-carousel-host',
      pattern: /<div class="img-wrap"><img src="\/assets\/photos\/engine-closeup\.jpg" alt="Class A — Invest"><\/div>/,
    },
    {
      key: 'home-class-b',
      categoryId: 790497683,
      kind: 'inline',
      a11yKey: 'v5.card.h.b',
      variant: 'card',
      fallbackImage: '/assets/photos/cabin-doorway.jpg',
      fallbackTitle: 'Class B — Fly',
      hostClass: 'img-wrap content-image-carousel-host',
      pattern: /<div class="img-wrap"><img src="\/assets\/photos\/cabin-doorway\.jpg" alt="Class B — Fly"><\/div>/,
    },
    {
      key: 'home-vip',
      categoryId: 790497687,
      kind: 'inline',
      a11yKey: 'v5.card.h.m',
      variant: 'card',
      fallbackImage: '/assets/photos/champagne-bucket.jpg',
      fallbackTitle: 'Membership',
      hostClass: 'img-wrap content-image-carousel-host',
      pattern: /<div class="img-wrap"><img src="\/assets\/photos\/champagne-bucket\.jpg" alt="Membership"><\/div>/,
    },
    {
      key: 'home-aircraft-showcase',
      categoryId: 790497688,
      kind: 'inline',
      a11yKey: 'home.teaser.h2',
      variant: 'showcase',
      fallbackImage: '/assets/aviona-jet.jpg',
      fallbackTitle: 'Private jet — Aviona livery',
      hostClass: 'img-wrap aircraft-showcase-carousel-host',
      pattern: /<div class="img-wrap">\s*<img class="jet-shot" src="\/assets\/aviona-jet\.jpg" alt="private jet — Aviona livery">\s*<\/div>/,
    },
  ],
  why: [
    {
      key: 'why-hero',
      categoryId: 790497657,
      kind: 'hero',
      a11yKey: 'why.h1',
      fallbackImage: '/assets/photos/stewardess-stairs.jpg',
      fallbackTitle: 'Why Aviona hero',
      hostClass: 'hero-bg hero-banner-host',
      pattern: heroBackgroundPattern,
    },
  ],
  aircraft: [
    {
      key: 'aircraft-range',
      categoryId: 790497660,
      kind: 'inline',
      a11yKey: 'ac.range.h2',
      variant: 'landscape',
      fallbackImage: '/assets/photos/aerial-mountains.jpg',
      fallbackTitle: 'Aircraft in flight',
      pattern: /<img src="\/assets\/photos\/aerial-mountains\.jpg" alt="Aircraft in flight">/,
    },
    {
      key: 'aircraft-cabin',
      categoryId: 790497662,
      kind: 'inline',
      a11yKey: 'ac.cabin.h2',
      variant: 'portrait',
      fallbackImage: '/assets/photos/cabin-dining.jpg',
      fallbackTitle: 'Cabin interior',
      pattern: /<img src="\/assets\/photos\/cabin-dining\.jpg" alt="Cabin interior">/,
    },
    {
      key: 'aircraft-business',
      categoryId: 790497663,
      kind: 'inline',
      a11yKey: 'ac.uc.business.h3',
      variant: 'usecase',
      fallbackImage: '/assets/photos/cockpit-pilot.jpg',
      fallbackTitle: 'Business',
      pattern: /<img src="\/assets\/photos\/cockpit-pilot\.jpg" alt="Business">/,
    },
    {
      key: 'aircraft-family',
      categoryId: 790497664,
      kind: 'inline',
      a11yKey: 'ac.uc.family.h3',
      variant: 'usecase',
      fallbackImage: '/assets/photos/fruit-table.jpg',
      fallbackTitle: 'Family',
      pattern: /<img src="\/assets\/photos\/fruit-table\.jpg" alt="Family">/,
    },
    {
      key: 'aircraft-lifestyle',
      categoryId: 790497665,
      kind: 'inline',
      a11yKey: 'ac.uc.lifestyle.h3',
      variant: 'usecase',
      fallbackImage: '/assets/photos/champagne-service.jpg',
      fallbackTitle: 'Lifestyle',
      pattern: /<img src="\/assets\/photos\/champagne-service\.jpg" alt="Lifestyle">/,
    },
    {
      key: 'aircraft-operations',
      categoryId: 790497666,
      kind: 'inline',
      a11yKey: 'ac.ops.h2',
      variant: 'landscape',
      fallbackImage: '/assets/photos/landing-gear.jpg',
      fallbackTitle: 'Operational rigor',
      pattern: /<img src="\/assets\/photos\/landing-gear\.jpg" alt="Operational rigor">/,
    },
  ],
  ways: [
    {
      key: 'ways-hero',
      categoryId: 790497667,
      kind: 'hero',
      a11yKey: 'ways.eyebrow',
      fallbackImage: '/assets/photos/cabin-doorway.jpg',
      fallbackTitle: 'Ways to participate hero',
      hostClass: 'hero-bg hero-banner-host',
      pattern: heroBackgroundPattern,
    },
    {
      key: 'ways-class-a',
      categoryId: 790497668,
      kind: 'inline',
      a11yKey: 'ways.a.h2',
      variant: 'ways-detail',
      fallbackImage: '/assets/photos/engine-closeup.jpg',
      fallbackTitle: 'Class A — Invest',
      pattern: /<img src="\/assets\/photos\/engine-closeup\.jpg" alt="Class A — Invest">/,
    },
    {
      key: 'ways-class-b',
      categoryId: 790497670,
      kind: 'inline',
      a11yKey: 'ways.b.h2',
      variant: 'ways-detail',
      fallbackImage: '/assets/photos/cabin-sleep.jpg',
      fallbackTitle: 'Class B — Fly',
      pattern: /<img src="\/assets\/photos\/cabin-sleep\.jpg" alt="Class B — Fly">/,
    },
    {
      key: 'ways-membership',
      categoryId: 790497671,
      kind: 'inline',
      a11yKey: 'ways.m.h2',
      variant: 'ways-detail',
      fallbackImage: '/assets/photos/champagne-bucket.jpg',
      fallbackTitle: 'Membership — Belong',
      pattern: /<img src="\/assets\/photos\/champagne-bucket\.jpg" alt="Membership — Belong">/,
    },
  ],
  about: [
    {
      key: 'about-hero',
      categoryId: 790497672,
      kind: 'hero',
      a11yKey: 'about.h1',
      fallbackImage: '/assets/photos/engine-closeup.jpg',
      fallbackTitle: 'About Aviona hero',
      hostClass: 'hero-bg hero-banner-host',
      pattern: heroBackgroundPattern,
    },
  ],
  contact: [
    {
      key: 'contact-hero',
      categoryId: 790497673,
      kind: 'hero',
      a11yKey: 'nav.contact',
      fallbackImage: '/assets/photos/champagne-service.jpg',
      fallbackTitle: 'Contact Aviona hero',
      hostClass: 'hero-bg hero-banner-host',
      pattern: heroBackgroundPattern,
    },
  ],
}

const contentCarouselSlotByKey = Object.fromEntries(
  Object.values(contentCarouselSlots).flat().map((slot) => [slot.key, slot]),
)

function applyFallbackLabelTranslations(root, lang) {
  root.querySelectorAll('a, button').forEach((el) => {
    const label = el.textContent.replace(/\s+/g, ' ').trim()
    const translation = fallbackLabelTranslations.find(({ labels }) => labels.includes(label))
    if (!translation) return

    const text = I18N[translation.key]?.[lang] || I18N[translation.key]?.en
    if (text) el.textContent = text
  })
}

function applyI18nAttributes(root, lang) {
  const attributeMappings = [
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-aria-label', 'aria-label'],
    ['data-i18n-alt', 'alt'],
  ]

  attributeMappings.forEach(([keyAttribute, targetAttribute]) => {
    root.querySelectorAll(`[${keyAttribute}]`).forEach((el) => {
      const key = el.getAttribute(keyAttribute)
      const text = I18N[key]?.[lang] || I18N[key]?.en
      if (text) el.setAttribute(targetAttribute, text)
    })
  })
}

function getCarouselAccessibleTitle(slot, lang) {
  const translated = I18N[slot.a11yKey]?.[lang] || I18N[slot.a11yKey]?.en
  return translated?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || slot.fallbackTitle
}

function getCarouselSlideAccessibleLabel(slide, index, accessibleTitle, lang) {
  if (lang === 'zh') {
    const normalizedTitle = accessibleTitle.replace(/[。.!！?？]+$/, '')
    return `${normalizedTitle}，轮播图片 ${index + 1}`
  }
  return slide.title || `${accessibleTitle}, carousel image ${index + 1}`
}

function getAircraftMediaAccessibleLabel(slide, index, lang) {
  if (lang === 'zh') return `${I18N['ac.h1']?.zh || 'AVIONA 私人飞机'}，媒体 ${index + 1}`
  return slide.title || `AVIONA aircraft media ${index + 1}`
}

function getExternalToastDestination(destination, lang) {
  const labelKey = externalToastLabelKeyByTarget[destination]
  if (!labelKey) return destination || I18N['coming.soon']?.[lang] || 'Coming soon'

  const label = I18N[labelKey]?.[lang] || I18N[labelKey]?.en
  const comingSoon = I18N['coming.soon']?.[lang] || I18N['coming.soon']?.en || 'Coming soon'
  return `${label} — ${comingSoon}`
}

function getAircraftHeroMediaHostHtml(fallbackImage) {
  return `<div class="hero-bg aircraft-media-banner-host" data-aircraft-media-banner-host data-fallback-image="${fallbackImage}" style="background-image: url('${fallbackImage}');"></div>`
}

function getContentCarouselHostHtml(slot) {
  const className = slot.hostClass || 'content-image-carousel-host'
  const fallback = slot.kind === 'hero'
    ? ''
    : `<img src="${slot.fallbackImage}" alt="">`
  const style = slot.kind === 'hero'
    ? ` style="background-image: url('${slot.fallbackImage}');"`
    : ''

  return `<div class="${className}" data-content-carousel-host data-carousel-slot="${slot.key}" data-carousel-category="${slot.categoryId}"${style}>${fallback}</div>`
}

function deferReactRootUnmount(root) {
  window.setTimeout(() => root.unmount(), 0)
}

function addMobileMenuToggle(html) {
  if (html.includes('data-mobile-menu-toggle')) return html
  return html.replace(
    '\n  <nav class="primary">',
    '\n  <button class="mobile-menu-toggle" type="button" aria-label="Menu" data-i18n-aria-label="a11y.mobileMenu" aria-expanded="false" data-mobile-menu-toggle><span></span><span></span><span></span></button>\n  <nav class="primary">',
  )
}

function getPageHtml(page, routeKey) {
  let html = applyApprovedContent2026(routeKey, addMobileMenuToggle(page.html))

  if (routeKey === 'aircraft') {
    html = html.replace(heroBackgroundPattern, (_, fallbackImage) => getAircraftHeroMediaHostHtml(fallbackImage))
  }

  html = (contentCarouselSlots[routeKey] || []).reduce((currentHtml, slot) => {
    const nextHtml = currentHtml.replace(slot.pattern, getContentCarouselHostHtml(slot))
    if (nextHtml === currentHtml && import.meta.env.DEV) {
      console.warn(`Unable to inject WordPress carousel slot: ${slot.key}`)
    }
    return nextHtml
  }, html)

  if (routeKey === 'home') {
    html = html.replace(certificationCopyPattern, `${newsCarouselHostHtml}$1`)
  }

  return html
}

function decodeHtml(value = '') {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value.trim()
}

function getFirstImageFromHtml(html = '') {
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match?.[1]?.replaceAll('&amp;', '&') || ''
}

function cleanMediaUrl(value = '') {
  return value.replaceAll('&amp;', '&').trim()
}

function isVideoUrl(value = '') {
  return /\.(mp4|m4v|mov|webm)(\?|#|$)/i.test(value)
}

function getImageUrlFromElement(element) {
  return cleanMediaUrl(
    element.getAttribute('data-orig-file') ||
      element.getAttribute('data-large-file') ||
      element.getAttribute('src') ||
      '',
  )
}

function getVideoUrlFromElement(element) {
  if (element.tagName.toLowerCase() === 'video') {
    return cleanMediaUrl(
      element.getAttribute('src') ||
        element.querySelector('source')?.getAttribute('src') ||
        '',
    )
  }

  return cleanMediaUrl(element.getAttribute('src') || element.getAttribute('href') || '')
}

function getEmbedUrlFromElement(element) {
  return cleanMediaUrl(element.getAttribute('src') || '')
}

function getPlayableEmbedUrl(src = '') {
  try {
    const url = new URL(src)
    url.searchParams.delete('cover')
    url.searchParams.set('autoPlay', '1')
    url.searchParams.set('controls', '1')
    url.searchParams.set('playsinline', '1')
    url.searchParams.set('muted', '1')
    return url.toString()
  } catch {
    return src
  }
}

function getVideoPressGuid(src = '') {
  try {
    const url = new URL(src)
    if (!/video\.wordpress\.com$/i.test(url.hostname)) return ''
    const match = url.pathname.match(/\/(?:embed|v)\/([^/?#]+)/)
    return match?.[1] || ''
  } catch {
    return ''
  }
}

function getVideoPressFileUrl(metadata = {}) {
  const base = metadata.file_url_base?.https || metadata.file_url_base?.http || ''
  const files = metadata.files || {}
  const mp4Path =
    files.hd?.mp4 ||
    files.dvd?.mp4 ||
    files.avc_240p?.mp4 ||
    files.std?.mp4 ||
    ''

  if (metadata.original) return cleanMediaUrl(metadata.original)
  if (base && mp4Path) return cleanMediaUrl(`${base}${mp4Path}`)
  return ''
}

async function resolveVideoPressEmbeds(media) {
  const resolved = await Promise.all(media.map(async (item) => {
    if (item.type !== 'embed') return item

    const guid = getVideoPressGuid(item.src)
    if (!guid) return item

    try {
      if (!videoPressSourceCache[guid]) {
        const response = await fetch(`https://public-api.wordpress.com/rest/v1.1/videos/${guid}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`VideoPress returned ${response.status}`)
        const metadata = await response.json()
        videoPressSourceCache[guid] = {
          src: getVideoPressFileUrl(metadata),
          poster: cleanMediaUrl(metadata.poster || ''),
          title: decodeHtml(metadata.title || item.title),
        }
      }

      const video = videoPressSourceCache[guid]
      if (!video.src) return item

      return {
        ...item,
        type: 'video',
        src: video.src,
        poster: video.poster || item.poster || '',
        title: video.title || item.title,
      }
    } catch {
      return item
    }
  }))

  return resolved
}

function extractMediaFromPostHtml(html = '') {
  const template = document.createElement('template')
  template.innerHTML = html

  const seen = new Set()
  const media = []

  template.content.querySelectorAll('video, source, iframe, img, a[href]').forEach((element) => {
    const tagName = element.tagName.toLowerCase()
    const type = tagName === 'img' ? 'image' : tagName === 'iframe' ? 'embed' : 'video'
    const src = type === 'image'
      ? getImageUrlFromElement(element)
      : type === 'embed'
        ? getEmbedUrlFromElement(element)
        : getVideoUrlFromElement(element)

    if (!src || seen.has(src)) return
    if (type === 'video' && !isVideoUrl(src)) return

    seen.add(src)
    media.push({
      id: `media-${media.length}-${src}`,
      type,
      src,
      poster: tagName === 'video' ? cleanMediaUrl(element.getAttribute('poster') || '') : '',
      title: element.getAttribute('title') || element.getAttribute('alt') || 'Aviona aircraft media',
    })
  })

  return media
}

function sanitizePostHtml(html = '') {
  const template = document.createElement('template')
  template.innerHTML = html

  template.content.querySelectorAll('script, style, iframe, object, embed, form').forEach((el) => el.remove())
  template.content.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name)
    })
  })
  template.content.querySelectorAll('img').forEach((img) => {
    const originalSrc = img.getAttribute('data-orig-file')
    if (originalSrc) img.setAttribute('src', originalSrc)
    img.removeAttribute('width')
    img.removeAttribute('height')
    img.removeAttribute('srcset')
    img.removeAttribute('sizes')
    img.removeAttribute('loading')
  })

  return template.innerHTML
}

function normalizePost(post, index, lang) {
  const contentHtml = post.content?.rendered || ''
  const title = decodeHtml(post.title?.rendered) || (lang === 'zh' ? 'Aviona 最新动态' : 'Aviona Update')
  const image = getNewsPostImage(post, index)

  return {
    id: post.id,
    title,
    date: post.date,
    link: post.link,
    image,
    contentHtml: sanitizePostHtml(contentHtml),
  }
}

function getNewsPostImage(post, index) {
  const contentHtml = post.content?.rendered || ''
  const embeddedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  return post.jetpack_featured_media_url || embeddedImage || getFirstImageFromHtml(contentHtml) || newsFallbackImages[index % newsFallbackImages.length]
}

function preloadImage(src) {
  if (!src) return
  const image = new Image()
  image.decoding = 'async'
  image.src = src
}

function formatPostDate(date, lang) {
  if (!date) return ''
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getNewsEndpoint(lang, page = 1) {
  const category = wordpressNewsCategories[lang] || wordpressNewsCategories.en
  return `${wordpressPostsEndpoint}&categories=${category}&page=${page}`
}

async function requestAllNewsPosts(lang) {
  const cacheBuster = Date.now()

  async function requestPage(page) {
    const response = await fetch(`${getNewsEndpoint(lang, page)}&_=${cacheBuster}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

    const data = await response.json()
    return {
      posts: Array.isArray(data) ? data : [],
      totalPages: Number.parseInt(response.headers.get('X-WP-TotalPages') || '1', 10),
    }
  }

  const firstPage = await requestPage(1)
  const totalPages = Number.isFinite(firstPage.totalPages) && firstPage.totalPages > 1
    ? firstPage.totalPages
    : 1
  const remainingPages = totalPages > 1
    ? await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => requestPage(index + 2)),
    )
    : []
  const seenPostIds = new Set()

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.posts)
    .filter((post) => {
      if (!post?.id || seenPostIds.has(post.id)) return false
      seenPostIds.add(post.id)
      return true
    })
    .sort((left, right) => (
      Date.parse(right.date || 0) - Date.parse(left.date || 0) || right.id - left.id
    ))
}

function getCarouselEndpoint(categoryId) {
  return `${wordpressCarouselEndpoint}&categories=${categoryId}`
}

function getAircraftHeroMediaEndpoint() {
  return `${wordpressAircraftHeroMediaEndpoint}&categories=${wordpressAircraftHeroMediaCategory}`
}

function getFallbackCarouselSlides(fallbackImage, fallbackTitle = 'Aviona') {
  return fallbackImage
    ? [{ id: `fallback-${fallbackImage}`, image: fallbackImage, title: fallbackTitle }]
    : []
}

function normalizeCarouselPost(post, fallbackImage, fallbackTitle = 'Aviona') {
  const contentHtml = post.content?.rendered || ''
  const images = extractMediaFromPostHtml(contentHtml)
    .filter((item) => item.type === 'image')
    .map((item, index) => ({
      id: `${post.id}-${index}-${item.src}`,
      image: item.src,
      title: item.title || fallbackTitle,
    }))

  if (images.length > 0) return images

  const embeddedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const fallback = post.jetpack_featured_media_url || embeddedImage || fallbackImage

  return getFallbackCarouselSlides(fallback, fallbackTitle)
}

async function requestWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle) {
  const cacheKey = String(categoryId)
  if (wordpressCarouselRequests.has(cacheKey)) {
    return wordpressCarouselRequests.get(cacheKey)
  }

  const request = fetch(getCarouselEndpoint(categoryId), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`WordPress returned ${response.status}`)
      return response.json()
    })
    .then((data) => {
      const slides = Array.isArray(data) && data[0]
        ? normalizeCarouselPost(data[0], fallbackImage, fallbackTitle)
        : getFallbackCarouselSlides(fallbackImage, fallbackTitle)

      wordpressCarouselCache.set(cacheKey, {
        fetchedAt: Date.now(),
        slides,
      })
      slides.forEach((slide) => preloadImage(slide.image))
      return slides
    })
    .finally(() => wordpressCarouselRequests.delete(cacheKey))

  wordpressCarouselRequests.set(cacheKey, request)
  return request
}

function useWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle) {
  const fallbackSlides = useMemo(
    () => getFallbackCarouselSlides(fallbackImage, fallbackTitle),
    [fallbackImage, fallbackTitle],
  )
  const [slides, setSlides] = useState(() => (
    wordpressCarouselCache.get(String(categoryId))?.slides || fallbackSlides
  ))

  useEffect(() => {
    let cancelled = false

    async function loadImages(forceRefresh = false) {
      const cacheKey = String(categoryId)
      const cached = wordpressCarouselCache.get(cacheKey)
      const cacheIsFresh = cached && Date.now() - cached.fetchedAt < wordpressCarouselRefreshMs

      if (!forceRefresh && cacheIsFresh) {
        if (!cancelled) setSlides(cached.slides)
        return
      }

      try {
        const nextSlides = await requestWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle)
        if (!cancelled) setSlides(nextSlides.length > 0 ? nextSlides : fallbackSlides)
      } catch {
        if (!cancelled && !cached?.slides?.length) setSlides(fallbackSlides)
      }
    }

    loadImages()
    const timer = window.setInterval(() => loadImages(true), wordpressCarouselRefreshMs)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [categoryId, fallbackImage, fallbackSlides, fallbackTitle])

  return slides
}

function normalizeAircraftHeroMediaPost(post, fallbackImage) {
  const contentHtml = post.content?.rendered || ''
  const media = extractMediaFromPostHtml(contentHtml)
  const embeddedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const fallbackMedia = post.jetpack_featured_media_url || embeddedImage || fallbackImage

  if (media.length > 0) return media

  return fallbackMedia
    ? [{
        id: 'fallback',
        type: 'image',
        src: fallbackMedia,
        poster: '',
        title: 'Aviona aircraft',
      }]
    : []
}

function InlineImageCarousel({ categoryId, fallbackImage, fallbackTitle, accessibleTitle, lang, variant = 'card' }) {
  const trackRef = useRef(null)
  const dragRef = useRef({
    active: false,
    currentX: 0,
    currentY: 0,
    moved: false,
    startIndex: 0,
    startX: 0,
    startY: 0,
  })
  const lastInteractionRef = useRef(0)
  const slides = useWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const safeActiveIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0))

  useEffect(() => {
    if (slides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      if (dragRef.current.active) return
      if (Date.now() - lastInteractionRef.current < 3500) return

      setActiveIndex((index) => (Math.min(index, slides.length - 1) + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  function handlePointerDown(event) {
    const track = trackRef.current
    if (!track || slides.length <= 1) return

    lastInteractionRef.current = Date.now()
    dragRef.current = {
      active: true,
      currentX: event.clientX,
      currentY: event.clientY,
      moved: false,
      startIndex: safeActiveIndex,
      startX: event.clientX,
      startY: event.clientY,
    }
    track.classList.add('dragging')
    setIsDragging(true)
    setDragOffset(0)
    if (event.pointerId !== undefined) track.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || !drag.active) return

    drag.currentX = event.clientX
    drag.currentY = event.clientY

    const distanceX = drag.currentX - drag.startX
    const distanceY = drag.currentY - drag.startY
    const hasHorizontalIntent = Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 3
    if (!hasHorizontalIntent) return

    drag.moved = true
    setDragOffset(distanceX)
    event.preventDefault()
  }

  function handlePointerEnd(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    lastInteractionRef.current = Date.now()
    const drag = dragRef.current
    const distanceX = drag.currentX - drag.startX
    const distanceY = drag.currentY - drag.startY
    const threshold = Math.min(Math.max(track.clientWidth * 0.18, 42), 90)
    const shouldFlip = Math.abs(distanceX) >= threshold && Math.abs(distanceX) > Math.abs(distanceY)
    const nextIndex = shouldFlip
      ? drag.startIndex + (distanceX < 0 ? 1 : -1)
      : drag.startIndex

    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
    setDragOffset(0)
    setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1))
  }

  function handlePointerCancel(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    lastInteractionRef.current = Date.now()
    const { startIndex } = dragRef.current
    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
    setDragOffset(0)
    setActiveIndex(startIndex)
  }

  const trackTransform = `translate3d(calc(-${safeActiveIndex * 100}% + ${dragOffset}px), 0, 0)`

  return (
    <div className={`path-card-image-carousel content-image-carousel--${variant}`}>
      <div
        className="path-card-image-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerEnd}
        onMouseDown={(event) => {
          if (!dragRef.current.active) handlePointerDown(event)
        }}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerEnd}
        onMouseLeave={handlePointerEnd}
        style={{ transform: trackTransform }}
      >
        {slides.map((slide, index) => (
          <div className="path-card-image-slide" key={slide.id}>
            <img
              src={slide.image}
              alt={getCarouselSlideAccessibleLabel(slide, index, accessibleTitle, lang)}
              draggable={false}
              loading="lazy"
              onDragStart={(event) => event.preventDefault()}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="path-card-image-dots" aria-hidden="true">
          {slides.map((slide, index) => (
            <span className={!isDragging && index === safeActiveIndex ? 'active' : ''} key={slide.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function AircraftShowcaseCarousel({ categoryId, fallbackImage, fallbackTitle, accessibleTitle, lang }) {
  const trackRef = useRef(null)
  const dragRef = useRef({
    active: false,
    currentX: 0,
    currentY: 0,
    startIndex: 0,
    startX: 0,
    startY: 0,
  })
  const lastInteractionRef = useRef(0)
  const slides = useWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const safeActiveIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0))

  useEffect(() => {
    if (slides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      if (dragRef.current.active) return
      if (Date.now() - lastInteractionRef.current < 3500) return

      setActiveIndex((index) => (Math.min(index, slides.length - 1) + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  function handlePointerDown(event) {
    const track = trackRef.current
    if (!track || slides.length <= 1) return

    lastInteractionRef.current = Date.now()
    dragRef.current = {
      active: true,
      currentX: event.clientX,
      currentY: event.clientY,
      startIndex: safeActiveIndex,
      startX: event.clientX,
      startY: event.clientY,
    }
    track.classList.add('dragging')
    setIsDragging(true)
    setDragOffset(0)
    if (event.pointerId !== undefined) track.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag.active) return

    drag.currentX = event.clientX
    drag.currentY = event.clientY

    const distanceX = drag.currentX - drag.startX
    const distanceY = drag.currentY - drag.startY
    const hasHorizontalIntent = Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 3
    if (!hasHorizontalIntent) return

    setDragOffset(distanceX)
    event.preventDefault()
  }

  function handlePointerEnd(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    lastInteractionRef.current = Date.now()
    const drag = dragRef.current
    const distanceX = drag.currentX - drag.startX
    const distanceY = drag.currentY - drag.startY
    const threshold = Math.min(Math.max(track.clientWidth * 0.16, 48), 110)
    const shouldFlip = Math.abs(distanceX) >= threshold && Math.abs(distanceX) > Math.abs(distanceY)
    const nextIndex = shouldFlip
      ? (drag.startIndex + (distanceX < 0 ? 1 : -1) + slides.length) % slides.length
      : drag.startIndex

    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
    setDragOffset(0)
    setActiveIndex(nextIndex)
  }

  function handlePointerCancel(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    lastInteractionRef.current = Date.now()
    const { startIndex } = dragRef.current
    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
    setDragOffset(0)
    setActiveIndex(startIndex)
  }

  const trackTransform = `translate3d(calc(-${safeActiveIndex * 100}% + ${dragOffset}px), 0, 0)`

  return (
    <div className="aircraft-showcase-carousel">
      {slides.length > 0 && (
        <div
          className="aircraft-showcase-track"
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerEnd}
          onMouseDown={(event) => {
            if (!dragRef.current.active) handlePointerDown(event)
          }}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerEnd}
          onMouseLeave={handlePointerEnd}
          style={{ transform: trackTransform }}
        >
          {slides.map((slide, index) => (
            <div className="aircraft-showcase-slide" key={slide.id}>
              <img
                src={slide.image}
                alt={getCarouselSlideAccessibleLabel(slide, index, accessibleTitle, lang)}
                draggable={false}
                loading="eager"
                fetchPriority={index === safeActiveIndex ? 'high' : 'auto'}
                onDragStart={(event) => event.preventDefault()}
              />
            </div>
          ))}
        </div>
      )}

      {slides.length > 1 && (
        <div className="aircraft-showcase-dots" aria-hidden="true">
          {slides.map((slide, index) => (
            <span className={!isDragging && index === safeActiveIndex ? 'active' : ''} key={slide.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function HeroBanner({ categoryId, fallbackImage, fallbackTitle, accessibleTitle, lang }) {
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, scrollLeft: 0, startX: 0 })
  const slides = useWordPressCarouselImages(categoryId, fallbackImage, fallbackTitle)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      const track = trackRef.current
      if (!track || dragRef.current.active || !track.clientWidth) return

      const nextIndex = (Math.round(track.scrollLeft / track.clientWidth) + 1) % slides.length
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' })
      setActiveIndex(nextIndex)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setActiveIndex(Math.min(Math.round(track.scrollLeft / track.clientWidth), slides.length - 1))
  }

  function snapToNearestSlide() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return

    const nextIndex = Math.min(Math.round(track.scrollLeft / track.clientWidth), slides.length - 1)
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' })
    setActiveIndex(nextIndex)
  }

  function handlePointerDown(event) {
    const track = trackRef.current
    if (!track || slides.length <= 1) return

    dragRef.current = {
      active: true,
      moved: false,
      scrollLeft: track.scrollLeft,
      startX: event.clientX,
    }
    track.classList.add('dragging')
    if (event.pointerId !== undefined) track.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || !drag.active) return

    const distance = event.clientX - drag.startX
    if (Math.abs(distance) > 3) drag.moved = true
    track.scrollLeft = drag.scrollLeft - distance
    if (drag.moved) event.preventDefault()
  }

  function handlePointerEnd(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    snapToNearestSlide()
  }

  return (
    <div className="hero-banner">
      <div
        className="hero-banner-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onMouseDown={(event) => {
          if (!dragRef.current.active) handlePointerDown(event)
        }}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerEnd}
        onMouseLeave={handlePointerEnd}
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => (
          <div
            className="hero-banner-slide"
            key={slide.id}
            role="img"
            aria-label={getCarouselSlideAccessibleLabel(slide, index, accessibleTitle, lang)}
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
        ))}
      </div>

      {slides.length > 1 && (
        <div className="hero-banner-dots" aria-hidden="true">
          {slides.map((slide, index) => (
            <span className={index === activeIndex ? 'active' : ''} key={slide.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function ContentCarouselSlot({ slot, lang }) {
  const accessibleTitle = getCarouselAccessibleTitle(slot, lang)

  if (slot.kind === 'hero') {
    return (
      <HeroBanner
        categoryId={slot.categoryId}
        fallbackImage={slot.fallbackImage}
        fallbackTitle={slot.fallbackTitle}
        accessibleTitle={accessibleTitle}
        lang={lang}
      />
    )
  }

  if (slot.variant === 'showcase') {
    return (
      <AircraftShowcaseCarousel
        categoryId={slot.categoryId}
        fallbackImage={slot.fallbackImage}
        fallbackTitle={slot.fallbackTitle}
        accessibleTitle={accessibleTitle}
        lang={lang}
      />
    )
  }

  return (
    <InlineImageCarousel
      categoryId={slot.categoryId}
      fallbackImage={slot.fallbackImage}
      fallbackTitle={slot.fallbackTitle}
      accessibleTitle={accessibleTitle}
      lang={lang}
      variant={slot.variant}
    />
  )
}

function AircraftHeroMediaBanner({ fallbackImage, lang }) {
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, scrollLeft: 0, startX: 0 })
  const [media, setMedia] = useState(() => aircraftHeroMediaCache)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeMedia, setActiveMedia] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadMedia() {
      try {
        const response = await fetch(`${getAircraftHeroMediaEndpoint()}&_=${Date.now()}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

        const data = await response.json()
        let nextMedia = Array.isArray(data) && data[0]
          ? normalizeAircraftHeroMediaPost(data[0], fallbackImage)
          : []
        nextMedia = await resolveVideoPressEmbeds(nextMedia)

        if (!cancelled) {
          if (nextMedia.length > 0) {
            aircraftHeroMediaCache = nextMedia
            setMedia(nextMedia)
          } else if (aircraftHeroMediaCache.length === 0) {
            setMedia([])
          }

          setActiveIndex(0)
          trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
        }
      } catch {
        if (!cancelled && aircraftHeroMediaCache.length === 0) setMedia([])
      }
    }

    loadMedia()
    const timer = window.setInterval(loadMedia, 300000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [fallbackImage])

  const slides = useMemo(
    () => (media.length > 0
      ? media
      : [{
          id: 'fallback-aircraft-hero',
          type: 'image',
          src: fallbackImage,
          poster: '',
          title: 'Aviona aircraft',
        }]),
    [fallbackImage, media],
  )

  const safeActiveIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0))

  const goToSlide = useCallback((index, behavior = 'smooth') => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return

    const nextIndex = Math.min(Math.max(index, 0), slides.length - 1)
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior })
    setActiveIndex(nextIndex)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || activeMedia) return undefined
    if (slides[safeActiveIndex]?.type === 'video') return undefined

    const timer = window.setTimeout(() => {
      if (dragRef.current.active) return
      goToSlide((safeActiveIndex + 1) % slides.length)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [activeMedia, goToSlide, safeActiveIndex, slides])

  useEffect(() => {
    trackRef.current?.querySelectorAll('video[data-media-index]').forEach((video) => {
      const isActive = Number(video.dataset.mediaIndex) === safeActiveIndex
      if (isActive) {
        if (video.dataset.wasActive !== 'true') {
          try {
            video.currentTime = 0
          } catch {
            // Some browsers block seeking before metadata is ready.
          }
        }
        video.dataset.wasActive = 'true'
        video.play().catch(() => {})
      } else {
        video.dataset.wasActive = 'false'
        video.pause()
      }
    })
  }, [safeActiveIndex, slides])

  useEffect(() => {
    if (!activeMedia) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') setActiveMedia(null)
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeMedia])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setActiveIndex(Math.min(Math.round(track.scrollLeft / track.clientWidth), slides.length - 1))
  }

  function handleVideoEnded(index) {
    if (index !== safeActiveIndex || activeMedia || dragRef.current.active || slides.length <= 1) return
    goToSlide((index + 1) % slides.length)
  }

  function snapToNearestSlide() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return

    const nextIndex = Math.min(Math.round(track.scrollLeft / track.clientWidth), slides.length - 1)
    goToSlide(nextIndex)
  }

  function handlePointerDown(event) {
    const track = trackRef.current
    if (!track || slides.length <= 1) return

    dragRef.current = {
      active: true,
      moved: false,
      scrollLeft: track.scrollLeft,
      startX: event.clientX,
    }
    track.classList.add('dragging')
    if (event.pointerId !== undefined) track.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || !drag.active) return

    const distance = event.clientX - drag.startX
    if (Math.abs(distance) > 3) drag.moved = true
    track.scrollLeft = drag.scrollLeft - distance
    if (drag.moved) event.preventDefault()
  }

  function handlePointerEnd(event) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    snapToNearestSlide()
  }

  function handleSlideClick(slide) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false
      return
    }

    setActiveMedia(slide)
  }

  return (
    <>
      <div className="aircraft-media-banner">
        <div
          className="aircraft-media-track"
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onMouseDown={(event) => {
            if (!dragRef.current.active) handlePointerDown(event)
          }}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerEnd}
          onMouseLeave={handlePointerEnd}
          onScroll={handleScroll}
        >
          {slides.map((slide, index) => (
            <div
              className={`aircraft-media-slide is-${slide.type}`}
              key={slide.id}
              onClick={() => handleSlideClick(slide)}
              role="button"
              aria-label={getAircraftMediaAccessibleLabel(slide, index, lang)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveMedia(slide)
                }
              }}
            >
              {slide.type === 'video' ? (
                <video
                  data-media-index={index}
                  src={slide.src}
                  poster={slide.poster || undefined}
                  muted
                  playsInline
                  preload="metadata"
                  onEnded={() => handleVideoEnded(index)}
                />
              ) : slide.type === 'embed' ? (
                <iframe
                  src={slide.src}
                  title={getAircraftMediaAccessibleLabel(slide, index, lang)}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={slide.src}
                  alt={getAircraftMediaAccessibleLabel(slide, index, lang)}
                  draggable={false}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === safeActiveIndex ? 'high' : 'auto'}
                  onDragStart={(event) => event.preventDefault()}
                />
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="aircraft-media-dots" aria-hidden="true">
            {slides.map((slide, index) => (
              <span className={index === safeActiveIndex ? 'active' : ''} key={slide.id} />
            ))}
          </div>
        )}
      </div>

      {activeMedia && createPortal(
        <div
          className="media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'zh' ? '飞机媒体预览' : 'Aircraft media preview'}
          onClick={() => setActiveMedia(null)}
        >
          <div className="media-lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button className="media-lightbox-close" type="button" onClick={() => setActiveMedia(null)}>
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
            {activeMedia.type === 'video' ? (
              <video src={activeMedia.src} poster={activeMedia.poster || undefined} controls autoPlay muted playsInline />
            ) : activeMedia.type === 'embed' ? (
              <iframe
                src={getPlayableEmbedUrl(activeMedia.src)}
                title={getAircraftMediaAccessibleLabel(activeMedia, Math.max(slides.findIndex((slide) => slide.id === activeMedia.id), 0), lang)}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={activeMedia.src}
                alt={getAircraftMediaAccessibleLabel(activeMedia, Math.max(slides.findIndex((slide) => slide.id === activeMedia.id), 0), lang)}
              />
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function NewsCarousel({ lang }) {
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, postId: null, scrollLeft: 0, startX: 0, startY: 0 })
  const [posts, setPosts] = useState(() => newsPostsCache[lang] || [])
  const [status, setStatus] = useState(newsPostsCache[lang]?.length > 0 ? 'ready' : 'loading')
  const [activeIndex, setActiveIndex] = useState(0)
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    let cancelled = false
    const cachedPosts = newsPostsCache[lang] || []
    cachedPosts.slice(0, 2).forEach((post, index) => preloadImage(getNewsPostImage(post, index)))

    async function loadPosts() {
      try {
        const nextPosts = await requestAllNewsPosts(lang)
        if (!cancelled) {
          newsPostsCache[lang] = nextPosts
          nextPosts.slice(0, 2).forEach((post, index) => preloadImage(getNewsPostImage(post, index)))
          setPosts(nextPosts)
          setActiveIndex(0)
          trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
          setStatus('ready')
        }
      } catch {
        if (!cancelled && cachedPosts.length === 0) setStatus('error')
      }
    }

    loadPosts()
    const timer = window.setInterval(loadPosts, 180000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [lang])

  useEffect(() => {
    if (posts.length === 0) return

    const currentIndex = Math.min(activeIndex, posts.length - 1)
    const nextIndex = (currentIndex + 1) % posts.length
    preloadImage(getNewsPostImage(posts[currentIndex], currentIndex))
    if (nextIndex !== currentIndex) preloadImage(getNewsPostImage(posts[nextIndex], nextIndex))
  }, [activeIndex, posts])

  useEffect(() => {
    if (!activePost) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') setActivePost(null)
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activePost])

  const normalizedPosts = posts.map((post, index) => normalizePost(post, index, lang))

  useEffect(() => {
    if (normalizedPosts.length <= 1 || activePost) return undefined

    const timer = window.setInterval(() => {
      const track = trackRef.current
      if (!track || dragRef.current.active || !track.clientWidth) return

      const nextIndex = (Math.round(track.scrollLeft / track.clientWidth) + 1) % normalizedPosts.length
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' })
      setActiveIndex(nextIndex)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [normalizedPosts.length, activePost])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const nextIndex = Math.round(track.scrollLeft / track.clientWidth)
    setActiveIndex(Math.min(nextIndex, Math.max(normalizedPosts.length - 1, 0)))
  }

  function snapToNearestSlide() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const index = Math.min(Math.round(track.scrollLeft / track.clientWidth), normalizedPosts.length - 1)
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  function handlePointerDown(event) {
    const track = trackRef.current
    if (!track || normalizedPosts.length <= 1) return

    const slide = event.target instanceof Element ? event.target.closest('.news-slide') : null
    dragRef.current = {
      active: true,
      moved: false,
      postId: slide?.dataset.postId || null,
      scrollLeft: track.scrollLeft,
      startX: event.clientX,
      startY: event.clientY,
    }
    track.classList.add('dragging')
    track.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || !drag.active) return

    const distanceX = event.clientX - drag.startX
    const distanceY = event.clientY - drag.startY
    if (Math.abs(distanceX) > 3 || Math.abs(distanceY) > 8) drag.moved = true
    track.scrollLeft = drag.scrollLeft - distanceX
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 3) event.preventDefault()
  }

  function handlePointerEnd(event, options = {}) {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return

    const { moved, postId } = dragRef.current
    dragRef.current.active = false
    track.classList.remove('dragging')
    if (event.pointerId !== undefined) track.releasePointerCapture?.(event.pointerId)
    snapToNearestSlide()

    if (options.openOnTap === false || moved || !postId) return

    const tappedPost = normalizedPosts.find((post) => String(post.id) === postId)
    if (tappedPost) setActivePost(tappedPost)
  }

  function handleSlideClick(event, post) {
    if (event.detail === 0) {
      setActivePost(post)
      return
    }

    if (dragRef.current.moved) {
      event.preventDefault()
      return
    }

    setActivePost(post)
  }

  return (
    <>
      <section className="news-carousel" aria-label={lang === 'zh' ? '最新动态' : 'Latest News'}>
        <div className="news-carousel-kicker">{lang === 'zh' ? '最新动态' : 'Latest News'}</div>
        <div className="news-carousel-head">
          <h2>{lang === 'zh' ? 'Aviona 新闻与公告' : 'Aviona News & Updates'}</h2>
        </div>

        {status === 'loading' && <div className="news-state">{lang === 'zh' ? '正在读取最新文章...' : 'Loading latest posts...'}</div>}
        {status === 'error' && <div className="news-state">{lang === 'zh' ? '暂时无法读取 WordPress 文章。' : 'Unable to load WordPress posts right now.'}</div>}

        {normalizedPosts.length > 0 && (
          <>
            <div
              className="news-carousel-track"
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={(event) => handlePointerEnd(event, { openOnTap: false })}
              onPointerLeave={(event) => handlePointerEnd(event, { openOnTap: false })}
              onScroll={handleScroll}
            >
              {normalizedPosts.map((post, index) => (
                <button className="news-slide" data-post-id={post.id} key={post.id} type="button" onClick={(event) => handleSlideClick(event, post)}>
                  <span className="news-slide-image">
                    <img
                      src={post.image}
                      alt=""
                      draggable={false}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      fetchPriority={index === activeIndex ? 'high' : 'auto'}
                      onDragStart={(event) => event.preventDefault()}
                    />
                  </span>
                  <span className="news-slide-copy">
                    <span className="news-slide-date">{formatPostDate(post.date, lang)}</span>
                    <span className="news-slide-title">{post.title}</span>
                    <span className="news-slide-action">{lang === 'zh' ? '点击查看' : 'View in page'}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="news-carousel-dots" aria-hidden="true">
              {normalizedPosts.map((post, index) => (
                <span className={index === activeIndex ? 'active' : ''} key={post.id} />
              ))}
            </div>
          </>
        )}
      </section>

      {activePost && createPortal(
        <div className="news-modal" role="dialog" aria-modal="true" aria-label={activePost.title} onClick={() => setActivePost(null)}>
          <article className="news-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="news-modal-close" type="button" onClick={() => setActivePost(null)}>
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
            <div className="news-modal-meta">{formatPostDate(activePost.date, lang)}</div>
            <h2>{activePost.title}</h2>
            {activePost.contentHtml ? (
              <div className="news-modal-content" dangerouslySetInnerHTML={{ __html: activePost.contentHtml }} />
            ) : (
              <div className="news-modal-content">
                <img src={activePost.image} alt="" />
              </div>
            )}
          </article>
        </div>,
        document.body,
      )}
    </>
  )
}

function FloatingContactWidget({ lang, hideRail = false }) {
  const [isListOpen, setIsListOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [position, setPosition] = useState(() => {
    try {
      const saved = window.localStorage.getItem('aviona-floating-contact-position')
      if (!saved) return null
      const parsed = JSON.parse(saved)
      if (Number.isFinite(parsed?.left) && Number.isFinite(parsed?.top)) {
        return { left: parsed.left, top: parsed.top }
      }
    } catch {
      // Ignore a stale saved position.
    }
    return null
  })
  const widgetRef = useRef(null)
  const dragStateRef = useRef(null)
  const suppressClickRef = useRef(false)
  const activeChannel = contactChannels.find((channel) => channel.id === activeId)
  const investLabel = lang === 'zh' ? '马上投资' : 'Invest Now'
  const contactLabel = lang === 'zh' ? '联系我们' : 'Contact Us'

  function clampWidgetPosition(left, top, width, height) {
    const padding = 12
    return {
      left: Math.min(Math.max(padding, left), Math.max(padding, window.innerWidth - width - padding)),
      top: Math.min(Math.max(padding, top), Math.max(padding, window.innerHeight - height - padding)),
    }
  }

  function saveWidgetPosition(nextPosition) {
    try {
      window.localStorage.setItem('aviona-floating-contact-position', JSON.stringify(nextPosition))
    } catch {
      // Position persistence is a convenience only.
    }
  }

  useEffect(() => {
    if (!position) return undefined

    function clampCurrentPosition() {
      const rect = widgetRef.current?.getBoundingClientRect()
      if (!rect) return
      const nextPosition = clampWidgetPosition(position.left, position.top, rect.width, rect.height)
      if (nextPosition.left === position.left && nextPosition.top === position.top) return
      setPosition(nextPosition)
      saveWidgetPosition(nextPosition)
    }

    const frameId = window.requestAnimationFrame(clampCurrentPosition)
    window.addEventListener('resize', clampCurrentPosition)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', clampCurrentPosition)
    }
  }, [isListOpen, position])

  useEffect(() => {
    if (!isListOpen) return undefined

    function closeOnOutsideClick(event) {
      if (widgetRef.current?.contains(event.target)) return
      setIsListOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [isListOpen])

  useEffect(() => {
    if (!activeId) return undefined

    document.body.classList.add('modal-open')

    function closeOnEscape(event) {
      if (event.key === 'Escape') setActiveId(null)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeId])

  useEffect(() => {
    function handleContactRequest(event) {
      const channelId = event.detail?.channelId
      if (!contactChannels.some((channel) => channel.id === channelId)) return
      setActiveId(channelId)
      setIsListOpen(false)
    }

    window.addEventListener('aviona:open-contact-channel', handleContactRequest)
    return () => window.removeEventListener('aviona:open-contact-channel', handleContactRequest)
  }, [])

  function openChannel(channelId) {
    if (suppressClickRef.current) return
    setActiveId(channelId)
    setIsListOpen(false)
  }

  function handleInvestClick(event) {
    if (suppressClickRef.current) event.preventDefault()
  }

  function handleWidgetPointerDown(event) {
    if (event.button != null && event.button !== 0) return
    if (event.isPrimary === false || dragStateRef.current) return
    if (event.target.closest('.floating-contact-menu')) return

    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    dragStateRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      dragged: false,
    }

    function handlePointerMove(moveEvent) {
      const dragState = dragStateRef.current
      if (!dragState || moveEvent.pointerId !== dragState.pointerId) return

      const dx = moveEvent.clientX - dragState.pointerX
      const dy = moveEvent.clientY - dragState.pointerY
      if (!dragState.dragged && Math.hypot(dx, dy) < 6) return

      if (!dragState.dragged) {
        dragState.dragged = true
        widgetRef.current?.setPointerCapture?.(dragState.pointerId)
      }
      widgetRef.current?.classList.add('is-dragging')
      moveEvent.preventDefault()

      const nextPosition = clampWidgetPosition(
        dragState.left + dx,
        dragState.top + dy,
        dragState.width,
        dragState.height,
      )
      setPosition(nextPosition)
      saveWidgetPosition(nextPosition)
    }

    function handlePointerUp(upEvent) {
      const dragState = dragStateRef.current
      if (!dragState || upEvent.pointerId !== dragState.pointerId) return

      if (dragState.dragged) {
        suppressClickRef.current = true
        window.setTimeout(() => {
          suppressClickRef.current = false
        }, 180)
      }

      widgetRef.current?.classList.remove('is-dragging')
      const pointerId = dragState.pointerId
      if (pointerId !== undefined && widgetRef.current?.hasPointerCapture?.(pointerId)) {
        widgetRef.current.releasePointerCapture(pointerId)
      }
      dragStateRef.current = null
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointercancel', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: false })
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerUp)
  }

  return (
    <>
      {!hideRail && (
        <aside
          ref={widgetRef}
          className={`floating-contact ${isListOpen ? 'open' : ''}`}
          style={position ? { left: `${position.left}px`, top: `${position.top}px`, right: 'auto', bottom: 'auto' } : undefined}
          aria-label={lang === 'zh' ? '联系方式' : 'Contact options'}
          onPointerDown={handleWidgetPointerDown}
          onDragStart={(event) => event.preventDefault()}
        >
          {isListOpen && (
            <div className="floating-contact-menu">
              {contactChannels.map((channel) => (
                <button key={channel.id} type="button" onClick={() => openChannel(channel.id)}>
                  <span className="floating-contact-icon"><FloatingContactIcon type={channel.icon} /></span>
                  <span>{channel.label[lang]}</span>
                </button>
              ))}
            </div>
          )}

          <div className="floating-contact-rail">
            <a
              className="floating-contact-invest"
              href={secureStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleInvestClick}
            >
              <span className="floating-contact-icon"><FloatingContactIcon type="invest" /></span>
              <span>{investLabel}</span>
            </a>
            <button
              className="floating-contact-toggle"
              type="button"
              onClick={() => {
                if (suppressClickRef.current) return
                setIsListOpen((value) => !value)
              }}
              aria-expanded={isListOpen}
            >
              <span className="floating-contact-icon"><FloatingContactIcon type="contact" /></span>
              <span>{contactLabel}</span>
            </button>
          </div>
        </aside>
      )}

      {activeChannel && createPortal(
        <div className="contact-channel-modal-backdrop" role="presentation" onClick={() => setActiveId(null)}>
          <article
            className="contact-channel-modal"
            role="dialog"
            aria-modal="true"
            aria-label={activeChannel.label[lang]}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="contact-channel-modal-close"
              type="button"
              onClick={() => setActiveId(null)}
              aria-label={lang === 'zh' ? '关闭联系方式' : 'Close contact detail'}
            >
              x
            </button>
            <div className="contact-channel-modal-kicker">{lang === 'zh' ? '联系 AVIONA' : 'Contact Aviona'}</div>
            <h3>{activeChannel.label[lang]}</h3>
            <p>{activeChannel.description[lang]}</p>
            {activeChannel.image ? (
              <img
                src={activeChannel.image}
                alt={lang === 'zh' ? `${activeChannel.label[lang]}二维码` : `${activeChannel.label[lang]} QR code`}
              />
            ) : (
              <div className="contact-channel-value-card">
                <span>{activeChannel.value}</span>
              </div>
            )}
            {activeChannel.href ? (
              <a href={activeChannel.href} target={activeChannel.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
                {activeChannel.linkLabel?.[lang] || activeChannel.value}
              </a>
            ) : (
              <span className="contact-channel-value">{activeChannel.value}</span>
            )}
          </article>
        </div>,
        document.body,
      )}
    </>
  )
}

function getInitialLang() {
  try {
    const saved = window.localStorage.getItem('aviona-lang')
    return saved === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

function getRoute() {
  const key = routeMap[window.location.pathname] || 'home'
  return {
    key,
    path: pagePaths[key],
    hash: window.location.hash,
  }
}

function isAppPath(pathname) {
  return Boolean(routeMap[pathname])
}

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.pageYOffset - 100
  window.scrollTo({ top, behavior: 'smooth' })
}

function closeMobileMenu(root) {
  const header = root?.querySelector('header.site.mobile-menu-open')
  if (!header) return
  header.classList.remove('mobile-menu-open')
  header.querySelector('[data-mobile-menu-toggle]')?.setAttribute('aria-expanded', 'false')
}

function App() {
  const pageRootRef = useRef(null)
  const contentCarouselRootsRef = useRef(new Map())
  const aircraftMediaBannerRootRef = useRef(null)
  const newsCarouselRootRef = useRef(null)
  const pendingFormValuesRef = useRef(null)
  const toastTimer = useRef(null)
  const [route, setRoute] = useState(getRoute)
  const [lang, setLang] = useState(getInitialLang)
  const page = pages[route.key] || pages.home
  const pageHtml = getPageHtml(page, route.key)

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title = I18N[`meta.title.${route.key}`]?.[lang] || page.title
  }, [lang, page.title, route.key])

  useEffect(() => {
    const root = pageRootRef.current
    if (!root) return

    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    document.body.classList.toggle('lang-zh', lang === 'zh')
    document.body.classList.toggle('lang-en', lang === 'en')

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n')
      const text = I18N[key]?.[lang] || I18N[key]?.en
      if (!text) return

      const hasFormChild = el.querySelector('input, select, textarea, button')
      if (hasFormChild) {
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = text
            break
          }
        }
      } else {
        el.innerHTML = text
      }
    })

    applyI18nAttributes(root, lang)
    applyFallbackLabelTranslations(root, lang)

    if (pendingFormValuesRef.current) {
      root.querySelectorAll('input[name], select[name], textarea[name]').forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(pendingFormValuesRef.current, field.name)) {
          field.value = pendingFormValuesRef.current[field.name]
        }
      })
      pendingFormValuesRef.current = null
    }

    root.querySelector('#lang-en-btn')?.classList.toggle('active', lang === 'en')
    root.querySelector('#lang-zh-btn')?.classList.toggle('active', lang === 'zh')

    try {
      window.localStorage.setItem('aviona-lang', lang)
    } catch {
      // Ignore private browsing storage errors.
    }
  }, [lang, route.key, route.hash, pageHtml])

  useEffect(() => {
    const hosts = Array.from(pageRootRef.current?.querySelectorAll('[data-content-carousel-host]') || [])
    const activeHosts = new Set(hosts)

    contentCarouselRootsRef.current.forEach((root, host) => {
      if (!activeHosts.has(host)) {
        deferReactRootUnmount(root)
        contentCarouselRootsRef.current.delete(host)
      }
    })

    hosts.forEach((host) => {
      const slot = contentCarouselSlotByKey[host.dataset.carouselSlot]
      if (!slot) {
        if (import.meta.env.DEV) console.warn(`Unknown WordPress carousel slot: ${host.dataset.carouselSlot}`)
        return
      }

      if (!contentCarouselRootsRef.current.has(host)) {
        contentCarouselRootsRef.current.set(host, createRoot(host))
      }

      contentCarouselRootsRef.current.get(host).render(
        <ContentCarouselSlot key={slot.key} slot={slot} lang={lang} />,
      )
    })
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    const host = pageRootRef.current?.querySelector('[data-aircraft-media-banner-host]')
    if (!host) {
      if (aircraftMediaBannerRootRef.current) {
        deferReactRootUnmount(aircraftMediaBannerRootRef.current.root)
      }
      aircraftMediaBannerRootRef.current = null
      return
    }

    if (aircraftMediaBannerRootRef.current?.host !== host) {
      if (aircraftMediaBannerRootRef.current) {
        deferReactRootUnmount(aircraftMediaBannerRootRef.current.root)
      }
      aircraftMediaBannerRootRef.current = {
        host,
        root: createRoot(host),
      }
    }

    aircraftMediaBannerRootRef.current.root.render(
      <AircraftHeroMediaBanner fallbackImage={host.dataset.fallbackImage || '/assets/photos/jet-sunset.jpg'} lang={lang} />,
    )
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    const host = pageRootRef.current?.querySelector('[data-news-carousel-host]')
    if (!host) {
      if (newsCarouselRootRef.current) {
        deferReactRootUnmount(newsCarouselRootRef.current.root)
      }
      newsCarouselRootRef.current = null
      return
    }

    if (newsCarouselRootRef.current?.host !== host) {
      if (newsCarouselRootRef.current) {
        deferReactRootUnmount(newsCarouselRootRef.current.root)
      }
      newsCarouselRootRef.current = {
        host,
        root: createRoot(host),
      }
    }

    newsCarouselRootRef.current.root.render(<NewsCarousel key={lang} lang={lang} />)
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (route.hash) {
      window.setTimeout(() => scrollToSection(route.hash.slice(1)), 250)
    }
  }, [route.key, route.hash])

  function navigate(path, hash = '') {
    const normalizedPath = routeMap[path] ? pagePaths[routeMap[path]] : path
    const nextUrl = `${normalizedPath}${hash}`

    if (nextUrl === `${window.location.pathname}${window.location.hash}`) {
      if (hash) {
        scrollToSection(hash.slice(1))
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    window.history.pushState({}, '', nextUrl)
    setRoute(getRoute())
  }

  function navigateToPageKey(key, hash = '') {
    const path = pagePaths[key] || '/'
    navigate(path, hash)
  }

  function showToast(destination) {
    const root = pageRootRef.current
    const toast = root?.querySelector('#toast')
    const toastDest = root?.querySelector('#toast-dest')
    if (!toast || !toastDest) return

    toastDest.textContent = getExternalToastDestination(destination, lang)
    toast.classList.add('show')

    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => {
      toast.classList.remove('show')
    }, 3500)
  }

  async function handleClick(event) {
    const target = event.target
    const root = pageRootRef.current
    if (!(target instanceof Element) || !root) return

    const mobileMenuToggle = target.closest('[data-mobile-menu-toggle]')
    if (mobileMenuToggle) {
      event.preventDefault()
      const header = mobileMenuToggle.closest('header.site')
      const isOpen = !header?.classList.contains('mobile-menu-open')
      header?.classList.toggle('mobile-menu-open', isOpen)
      mobileMenuToggle.setAttribute('aria-expanded', String(isOpen))
      return
    }

    if (root.querySelector('header.site.mobile-menu-open') && !target.closest('header.site')) {
      closeMobileMenu(root)
    }

    const toast = target.closest('#toast')
    if (toast) {
      toast.classList.remove('show')
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      return
    }

    const langButton = target.closest('#lang-en-btn, #lang-zh-btn')
    if (langButton) {
      event.preventDefault()
      pendingFormValuesRef.current = Object.fromEntries(
        Array.from(root.querySelectorAll('input[name], select[name], textarea[name]'))
          .map((field) => [field.name, field.value]),
      )
      setLang(langButton.id === 'lang-zh-btn' ? 'zh' : 'en')
      return
    }

    const emailLink = target.closest('.reveal-email')
    if (emailLink && emailLink.dataset.revealed !== 'true') {
      event.preventDefault()
      const email = `${emailLink.dataset.u}@${emailLink.dataset.d}`
      emailLink.textContent = email
      emailLink.setAttribute('href', `mailto:${email}`)
      emailLink.dataset.revealed = 'true'
      emailLink.removeAttribute('data-i18n')
      return
    }

    const faqTab = target.closest('.faq-tab')
    if (faqTab) {
      event.preventDefault()
      const faq = faqTab.getAttribute('data-faq')
      root.querySelectorAll('.faq-tab').forEach((tab) => tab.classList.remove('active'))
      faqTab.classList.add('active')
      root.querySelectorAll('.faq-panel').forEach((panel) => panel.classList.remove('active'))
      root.querySelector(`.faq-panel[data-faq="${faq}"]`)?.classList.add('active')
      return
    }

    const actionEl = target.closest('[data-action]')
    if (actionEl) {
      const action = actionEl.getAttribute('data-action')
      const dataTarget = actionEl.getAttribute('data-target')

      if (action === 'external') {
        event.preventDefault()
        closeMobileMenu(root)
        showToast(dataTarget)
        return
      }

      if (action === 'contact-channel') {
        event.preventDefault()
        closeMobileMenu(root)
        window.dispatchEvent(new CustomEvent('aviona:open-contact-channel', {
          detail: { channelId: actionEl.getAttribute('data-channel-id') },
        }))
        return
      }

      if (action === 'contact-form-submit') {
        event.preventDefault()
        closeMobileMenu(root)
        const form = actionEl.closest('form')
        if (!form?.reportValidity() || actionEl.getAttribute('aria-busy') === 'true') return
        const fields = Array.from(form?.querySelectorAll('label') || [])
          .map((label) => {
            const field = label.querySelector('input, select, textarea')
            if (!field) return null
            const key = label.getAttribute('data-i18n')
            const labelText = (I18N[key]?.[lang] || I18N[key]?.en || label.childNodes[0]?.textContent || '')
              .replace(/\s+/g, ' ')
              .trim()
            const rawValue = field.value?.trim()
            if (!rawValue) return null

            const value = field.tagName === 'SELECT'
              ? field.selectedOptions?.[0]?.textContent?.trim() || rawValue
              : rawValue
            return { key, label: labelText, value }
          })
          .filter(Boolean)

        const originalText = actionEl.textContent
        actionEl.textContent = lang === 'zh' ? '提交中...' : 'Sending...'
        actionEl.setAttribute('aria-busy', 'true')
        actionEl.setAttribute('disabled', '')

        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang,
              page: window.location.href,
              website: form?.elements.namedItem('website')?.value || '',
              fields,
            }),
          })

          const result = await response.json().catch(() => ({}))
          if (!response.ok) {
            throw new Error(result.message || 'Unable to submit inquiry.')
          }

          form?.reset()
          showToast(lang === 'zh' ? '咨询已提交，我们会尽快联系您。' : 'Inquiry submitted. We will follow up shortly.')
        } catch (error) {
          const detail = error instanceof Error ? error.message : ''
          const message = lang === 'zh'
            ? detail === 'Email service is not configured.'
              ? '邮件服务尚未配置，请联系管理员。'
              : '提交失败，请稍后再试或直接通过邮箱联系我们。'
            : `Submission failed${detail ? `: ${detail}` : '. Please try again or contact us by email.'}`
          showToast(message)
        } finally {
          actionEl.textContent = originalText
          actionEl.removeAttribute('aria-busy')
          actionEl.removeAttribute('disabled')
        }
        return
      }

      if (action === 'scroll') {
        event.preventDefault()
        closeMobileMenu(root)
        scrollToSection(dataTarget)
        return
      }

      if (action === 'page') {
        event.preventDefault()
        closeMobileMenu(root)
        navigateToPageKey(dataTargetToPage[dataTarget] || 'home')
        return
      }

      if (action === 'page-scroll') {
        event.preventDefault()
        closeMobileMenu(root)
        const section = actionEl.getAttribute('data-section')
        navigateToPageKey(dataTargetToPage[dataTarget] || 'home', section ? `#${section}` : '')
        return
      }
    }

    const anchor = target.closest('a[href]')
    if (!anchor) return

    const href = anchor.getAttribute('href')
    if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return

    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin && isAppPath(url.pathname)) {
      event.preventDefault()
      closeMobileMenu(root)
      navigate(url.pathname, url.hash)
    }
  }

  function handleSubmit(event) {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-contact-form]')) return

    event.preventDefault()
    form.querySelector('[data-action="contact-form-submit"]')?.click()
  }

  return (
    <>
      <main
        ref={pageRootRef}
        onClick={handleClick}
        onSubmit={handleSubmit}
        dangerouslySetInnerHTML={{ __html: pageHtml }}
      />
      <FloatingContactWidget lang={lang} hideRail={route.key === 'contact'} />
    </>
  )
}

export default App
