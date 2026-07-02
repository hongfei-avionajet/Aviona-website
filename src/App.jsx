import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { I18N } from './content/i18n'
import { pages } from './content/pages'

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
}

const pagePaths = {
  home: '/',
  why: '/why-aviona',
  aircraft: '/aircraft',
  ways: '/ways-to-participate',
  about: '/about',
}

const dataTargetToPage = {
  home: 'home',
  why: 'why',
  aircraft: 'aircraft',
  ways: 'ways',
  about: 'about',
}

const fallbackLabelTranslations = [
  { key: 'btn.subscribe', labels: ['Subscribe', '认购'] },
  { key: 'btn.book', labels: ['Book a Flight', '预订航班'] },
  { key: 'v5.final.cta1', labels: ['Start Investing', '立即投资'] },
]

const wordpressPostsEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=4&_embed=1'

const wordpressBannerEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=4&_embed=1&orderby=date&order=desc'

const wordpressPathCardEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=5&_embed=1&orderby=date&order=desc'

const wordpressAircraftShowcaseEndpoint =
  'https://public-api.wordpress.com/wp/v2/sites/avionajet.wordpress.com/posts?per_page=5&_embed=1&orderby=date&order=desc'

const wordpressAircraftShowcaseCategory = 790298188

const wordpressNewsCategories = {
  en: 4236455,
  zh: 286977090,
}

const wordpressBannerCategories = {
  en: 233024975,
  zh: 790295996,
}

const wordpressPathCardCategories = {
  classA: {
    en: 790297633,
    zh: 790297630,
  },
  classB: {
    en: 790297635,
    zh: 790297634,
  },
  vip: {
    en: 181000998,
    zh: 790297636,
  },
}

let aircraftShowcaseImageCache = []
const newsPostsCache = {}

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

const pathCardImagePatterns = [
  {
    key: 'classA',
    pattern: /<div class="img-wrap"><img src="(\/assets\/photos\/engine-closeup\.jpg)" alt="([^"]+)"><\/div>/,
  },
  {
    key: 'classB',
    pattern: /<div class="img-wrap"><img src="(\/assets\/photos\/cabin-doorway\.jpg)" alt="([^"]+)"><\/div>/,
  },
  {
    key: 'vip',
    pattern: /<div class="img-wrap"><img src="(\/assets\/photos\/champagne-bucket\.jpg)" alt="([^"]+)"><\/div>/,
  },
]

const aircraftShowcaseImagePattern =
  /<div class="img-wrap">\s*<img class="jet-shot" src="([^"]+)" alt="([^"]+)">\s*<\/div>/

function applyFallbackLabelTranslations(root, lang) {
  root.querySelectorAll('a, button').forEach((el) => {
    const label = el.textContent.replace(/\s+/g, ' ').trim()
    const translation = fallbackLabelTranslations.find(({ labels }) => labels.includes(label))
    if (!translation) return

    const text = I18N[translation.key]?.[lang] || I18N[translation.key]?.en
    if (text) el.textContent = text
  })
}

function getHeroBannerHostHtml(fallbackImage) {
  return `<div class="hero-bg hero-banner-host" data-hero-banner-host data-fallback-image="${fallbackImage}" style="background-image: url('${fallbackImage}');"></div>`
}

function getPathCardCarouselHostHtml(cardKey, fallbackImage, fallbackTitle) {
  return `<div class="img-wrap path-card-carousel-host" data-path-card-carousel-host data-card-key="${cardKey}" data-fallback-image="${fallbackImage}" data-fallback-title="${fallbackTitle}"></div>`
}

function getAircraftShowcaseHostHtml() {
  return '<div class="img-wrap aircraft-showcase-carousel-host" data-aircraft-showcase-carousel-host></div>'
}

function addMobileMenuToggle(html) {
  if (html.includes('data-mobile-menu-toggle')) return html
  return html.replace(
    '\n  <nav class="primary">',
    '\n  <button class="mobile-menu-toggle" type="button" aria-label="Menu" aria-expanded="false" data-mobile-menu-toggle><span></span><span></span><span></span></button>\n  <nav class="primary">',
  )
}

function getPageHtml(page, routeKey) {
  const html = addMobileMenuToggle(page.html)
  if (routeKey !== 'home') return html
  return pathCardImagePatterns.reduce(
    (html, { key, pattern }) => html.replace(pattern, (_, fallbackImage, fallbackTitle) => getPathCardCarouselHostHtml(key, fallbackImage, fallbackTitle)),
    html,
  )
    .replace(heroBackgroundPattern, (_, fallbackImage) => getHeroBannerHostHtml(fallbackImage))
    .replace(aircraftShowcaseImagePattern, () => getAircraftShowcaseHostHtml())
    .replace(certificationCopyPattern, `${newsCarouselHostHtml}$1`)
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

function getNewsEndpoint(lang) {
  const category = wordpressNewsCategories[lang] || wordpressNewsCategories.en
  return `${wordpressPostsEndpoint}&categories=${category}`
}

function getBannerEndpoint(lang) {
  const category = wordpressBannerCategories[lang] || wordpressBannerCategories.en
  return `${wordpressBannerEndpoint}&categories=${category}`
}

function getPathCardEndpoint(cardKey, lang) {
  const categoryGroup = wordpressPathCardCategories[cardKey] || wordpressPathCardCategories.classA
  const category = categoryGroup[lang] || categoryGroup.en
  return `${wordpressPathCardEndpoint}&categories=${category}`
}

function getAircraftShowcaseEndpoint() {
  return `${wordpressAircraftShowcaseEndpoint}&categories=${wordpressAircraftShowcaseCategory}`
}

function normalizeBannerPost(post) {
  const contentHtml = post.content?.rendered || ''
  const embeddedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const image = post.jetpack_featured_media_url || embeddedImage || getFirstImageFromHtml(contentHtml)

  return {
    id: post.id,
    title: decodeHtml(post.title?.rendered) || 'Aviona Banner',
    image,
  }
}

function normalizeImagePost(post, fallbackImage) {
  const contentHtml = post.content?.rendered || ''
  const embeddedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const image = post.jetpack_featured_media_url || embeddedImage || getFirstImageFromHtml(contentHtml) || fallbackImage

  return {
    id: post.id,
    title: decodeHtml(post.title?.rendered) || 'Aviona',
    image,
  }
}

function PathCardImageCarousel({ cardKey, fallbackImage, fallbackTitle, lang }) {
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
  const [images, setImages] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadImages() {
      try {
        const response = await fetch(`${getPathCardEndpoint(cardKey, lang)}&_=${Date.now()}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

        const data = await response.json()
        const nextImages = Array.isArray(data)
          ? data.map((post) => normalizeImagePost(post, fallbackImage)).filter((image) => image.image).slice(0, 5)
          : []

        if (!cancelled) {
          setImages(nextImages)
          setActiveIndex(0)
          setDragOffset(0)
        }
      } catch {
        if (!cancelled) setImages([])
      }
    }

    loadImages()
    const timer = window.setInterval(loadImages, 300000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [cardKey, fallbackImage, lang])

  const slides = images.length > 0 ? images : [{ id: 'fallback', image: fallbackImage, title: fallbackTitle }]
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
    <div className="path-card-image-carousel">
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
        {slides.map((slide) => (
          <div className="path-card-image-slide" key={slide.id}>
            <img src={slide.image} alt={slide.title} draggable={false} loading="lazy" onDragStart={(event) => event.preventDefault()} />
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

function AircraftShowcaseCarousel({ lang }) {
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
  const [images, setImages] = useState(() => aircraftShowcaseImageCache)
  const [status, setStatus] = useState(aircraftShowcaseImageCache.length > 0 ? 'ready' : 'loading')
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadImages() {
      try {
        const response = await fetch(`${getAircraftShowcaseEndpoint()}&_=${Date.now()}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

        const data = await response.json()
        const nextImages = Array.isArray(data)
          ? data.map((post) => normalizeImagePost(post)).filter((image) => image.image).slice(0, 5)
          : []

        if (!cancelled) {
          if (nextImages.length > 0) {
            aircraftShowcaseImageCache = nextImages
            setImages(nextImages)
            setStatus('ready')
          } else if (aircraftShowcaseImageCache.length === 0) {
            setStatus('empty')
          }
          setActiveIndex(0)
          setDragOffset(0)
        }
      } catch {
        if (!cancelled && aircraftShowcaseImageCache.length === 0) setStatus('error')
      }
    }

    loadImages()
    const timer = window.setInterval(loadImages, 300000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const slides = images
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
      {slides.length > 0 ? (
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
                alt={slide.title}
                draggable={false}
                loading="eager"
                fetchPriority={index === safeActiveIndex ? 'high' : 'auto'}
                onDragStart={(event) => event.preventDefault()}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="aircraft-showcase-placeholder">
          {status === 'error'
            ? (lang === 'zh' ? '暂时无法读取飞机图片' : 'Unable to load aircraft images')
            : (lang === 'zh' ? '正在读取飞机图片...' : 'Loading aircraft images...')}
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

function HeroBanner({ fallbackImage, lang }) {
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, scrollLeft: 0, startX: 0 })
  const [banners, setBanners] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadBanners() {
      try {
        const response = await fetch(`${getBannerEndpoint(lang)}&_=${Date.now()}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

        const data = await response.json()
        const nextBanners = Array.isArray(data)
          ? data.map(normalizeBannerPost).filter((banner) => banner.image).slice(0, 4)
          : []

        if (!cancelled) {
          setBanners(nextBanners)
          setActiveIndex(0)
          trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
        }
      } catch {
        if (!cancelled) setBanners([])
      }
    }

    loadBanners()
    const timer = window.setInterval(loadBanners, 300000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [lang])

  const slides = [
    { id: 'fallback', image: fallbackImage, title: 'Aviona' },
    ...banners,
  ].slice(0, 5)

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
        {slides.map((slide) => (
          <div
            className="hero-banner-slide"
            key={slide.id}
            role="img"
            aria-label={slide.title}
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
    cachedPosts.forEach((post, index) => preloadImage(getNewsPostImage(post, index)))

    async function loadPosts() {
      try {
        const response = await fetch(`${getNewsEndpoint(lang)}&_=${Date.now()}`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`)

        const data = await response.json()
        if (!cancelled) {
          const nextPosts = Array.isArray(data) ? data.slice(0, 4) : []
          newsPostsCache[lang] = nextPosts
          nextPosts.forEach((post, index) => preloadImage(getNewsPostImage(post, index)))
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
                      loading="eager"
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

function FloatingContactWidget({ lang, onExternalAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState(contactChannels[0].id)
  const widgetRef = useRef(null)
  const activeChannel = contactChannels.find((channel) => channel.id === activeId) || contactChannels[0]
  const investLabel = lang === 'zh' ? '马上投资' : 'Invest Now'
  const contactLabel = lang === 'zh' ? '联系我们' : 'Contact Us'

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnOutsideClick(event) {
      if (widgetRef.current?.contains(event.target)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [isOpen])

  function openChannel(channelId) {
    setActiveId(channelId)
    setIsOpen(true)
  }

  function handleInvestClick() {
    onExternalAction?.(lang === 'zh' ? 'Brickken 入口 — 即将上线' : 'Brickken Portal — Coming Soon')
  }

  return (
    <aside ref={widgetRef} className={`floating-contact ${isOpen ? 'open' : ''}`} aria-label={lang === 'zh' ? '联系方式' : 'Contact options'}>
      {isOpen && (
        <div className="floating-contact-panel">
          <div className="floating-contact-head">
            <div>
              <div className="floating-contact-kicker">{lang === 'zh' ? '联系 AVIONA' : 'Contact Aviona'}</div>
              <h3>{activeChannel.label[lang]}</h3>
            </div>
            <button
              className="floating-contact-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={lang === 'zh' ? '关闭联系方式' : 'Close contact panel'}
            >
              x
            </button>
          </div>

          <div className="floating-contact-detail">
            <p>{activeChannel.description[lang]}</p>
            {activeChannel.image ? (
              <img src={activeChannel.image} alt={`${activeChannel.label.en} QR code`} />
            ) : (
              <div className="floating-contact-email-card">
                <span>{activeChannel.value}</span>
              </div>
            )}
            {activeChannel.href ? (
              <a href={activeChannel.href} target={activeChannel.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
                {activeChannel.linkLabel?.[lang] || activeChannel.value}
              </a>
            ) : (
              <span className="floating-contact-value">{activeChannel.value}</span>
            )}
          </div>
        </div>
      )}

      <div className="floating-contact-rail">
        <button className="floating-contact-invest" type="button" onClick={handleInvestClick}>
          <span className="floating-contact-icon"><FloatingContactIcon type="invest" /></span>
          <span>{investLabel}</span>
        </button>
        <div className="floating-contact-rail-title">{contactLabel}</div>
        {contactChannels.map((channel) => (
          <button
            className={channel.id === activeId && isOpen ? 'active' : ''}
            key={channel.id}
            type="button"
            onClick={() => openChannel(channel.id)}
            aria-expanded={channel.id === activeId && isOpen}
          >
            <span className="floating-contact-icon"><FloatingContactIcon type={channel.icon} /></span>
            <span>{channel.label[lang]}</span>
          </button>
        ))}
      </div>
    </aside>
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
  const heroBannerRootRef = useRef(null)
  const newsCarouselRootRef = useRef(null)
  const aircraftShowcaseRootRef = useRef(null)
  const pathCardCarouselRootsRef = useRef(new Map())
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
    document.title = page.title
  }, [page.title])

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

    applyFallbackLabelTranslations(root, lang)
    root.querySelector('#lang-en-btn')?.classList.toggle('active', lang === 'en')
    root.querySelector('#lang-zh-btn')?.classList.toggle('active', lang === 'zh')

    try {
      window.localStorage.setItem('aviona-lang', lang)
    } catch {
      // Ignore private browsing storage errors.
    }
  }, [lang, route.key, route.hash, pageHtml])

  useEffect(() => {
    const host = pageRootRef.current?.querySelector('[data-hero-banner-host]')
    if (!host) {
      heroBannerRootRef.current = null
      return
    }

    if (heroBannerRootRef.current?.host !== host) {
      heroBannerRootRef.current = {
        host,
        root: createRoot(host),
      }
    }

    heroBannerRootRef.current.root.render(
      <HeroBanner fallbackImage={host.dataset.fallbackImage || '/assets/photos/jet-sunset.jpg'} lang={lang} />,
    )
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    const host = pageRootRef.current?.querySelector('[data-news-carousel-host]')
    if (!host) {
      newsCarouselRootRef.current = null
      return
    }

    if (newsCarouselRootRef.current?.host !== host) {
      newsCarouselRootRef.current = {
        host,
        root: createRoot(host),
      }
    }

    newsCarouselRootRef.current.root.render(<NewsCarousel key={lang} lang={lang} />)
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    const host = pageRootRef.current?.querySelector('[data-aircraft-showcase-carousel-host]')
    if (!host) {
      aircraftShowcaseRootRef.current = null
      return
    }

    if (aircraftShowcaseRootRef.current?.host !== host) {
      aircraftShowcaseRootRef.current = {
        host,
        root: createRoot(host),
      }
    }

    aircraftShowcaseRootRef.current.root.render(
      <AircraftShowcaseCarousel lang={lang} />,
    )
  }, [pageHtml, route.key, lang])

  useEffect(() => {
    const hosts = Array.from(pageRootRef.current?.querySelectorAll('[data-path-card-carousel-host]') || [])
    const activeHosts = new Set(hosts)

    pathCardCarouselRootsRef.current.forEach((root, host) => {
      if (!activeHosts.has(host)) {
        root.unmount()
        pathCardCarouselRootsRef.current.delete(host)
      }
    })

    hosts.forEach((host) => {
      if (!pathCardCarouselRootsRef.current.has(host)) {
        pathCardCarouselRootsRef.current.set(host, createRoot(host))
      }

      pathCardCarouselRootsRef.current.get(host).render(
        <PathCardImageCarousel
          cardKey={host.dataset.cardKey || 'classA'}
          fallbackImage={host.dataset.fallbackImage || '/assets/photos/engine-closeup.jpg'}
          fallbackTitle={host.dataset.fallbackTitle || 'Aviona'}
          lang={lang}
        />,
      )
    })
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

    toastDest.textContent = destination || 'Coming soon'
    toast.classList.add('show')

    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => {
      toast.classList.remove('show')
    }, 3500)
  }

  function handleClick(event) {
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

  return (
    <>
      <main
        ref={pageRootRef}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: pageHtml }}
      />
      <FloatingContactWidget lang={lang} onExternalAction={showToast} />
    </>
  )
}

export default App
