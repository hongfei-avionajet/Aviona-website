import { useEffect, useRef, useState } from 'react'
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

function App() {
  const pageRootRef = useRef(null)
  const toastTimer = useRef(null)
  const [route, setRoute] = useState(getRoute)
  const [lang, setLang] = useState(getInitialLang)
  const page = pages[route.key] || pages.home

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

    root.querySelector('#lang-en-btn')?.classList.toggle('active', lang === 'en')
    root.querySelector('#lang-zh-btn')?.classList.toggle('active', lang === 'zh')

    try {
      window.localStorage.setItem('aviona-lang', lang)
    } catch {
      // Ignore private browsing storage errors.
    }
  }, [lang, route.key])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (route.hash) {
      window.setTimeout(() => scrollToSection(route.hash.slice(1)), 250)
    }
  }, [route.key, route.hash])

  function navigate(path, hash = '') {
    const normalizedPath = routeMap[path] ? pagePaths[routeMap[path]] : path
    const nextUrl = `${normalizedPath}${hash}`
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
        showToast(dataTarget)
        return
      }

      if (action === 'scroll') {
        event.preventDefault()
        scrollToSection(dataTarget)
        return
      }

      if (action === 'page') {
        event.preventDefault()
        navigateToPageKey(dataTargetToPage[dataTarget] || 'home')
        return
      }

      if (action === 'page-scroll') {
        event.preventDefault()
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
      navigate(url.pathname, url.hash)
    }
  }

  return (
    <main
      ref={pageRootRef}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  )
}

export default App
