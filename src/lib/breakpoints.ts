/**
 * Zentrale Breakpoint-Definitionen – einzige Quelle für responsive Grenzen.
 * CSS-Medienabfragen müssen diese Werte verwenden (Copy/Paste oder Kommentar-Referenz).
 *
 * Referenz: ui-parity/UI_PARITY_SPEC.md Viewports (Desktop 1440, Tablet 768, Mobile 390)
 */

export const BREAKPOINTS = {
  /** Sehr kleine Handys (z. B. iPhone SE) – z. B. Hero-Höhe */
  SMALL_MOBILE_MAX: 430,

  /** Editorial: Slider Ende – unterhalb = Basisdaten-Slider, ab 640 = 2-Spalten-Grid */
  EDITORIAL_SLIDER_MAX: 639,
  /** Editorial: Tablet-Start (2-Spalten Basisdaten) */
  EDITORIAL_TABLET_MIN: 640,
  /** Editorial: Tablet-Ende / Desktop-Start (Fullbleed, 3-Spalten, Section Cards) */
  EDITORIAL_DESKTOP_MIN: 1024,

  /** App / Super-Admin: Mobile Ende – unterhalb = Mobile-Layout, ab 768 = Desktop/Sidebar */
  APP_MOBILE_MAX: 767,
  /** App / Super-Admin: Desktop-Start */
  APP_DESKTOP_MIN: 768,

  /** DataSectionsContainer: Sticky-Nav sichtbar ab diesem Viewport */
  DESKTOP_NAV_MIN: 1200,
} as const

/** Viewport-Breiten für UI-Parity (Playwright). Werte nur zur Dokumentation/Tests. */
export const VIEWPORT_WIDTHS = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
} as const

/**
 * Media-Query-Strings für useMatchMedia oder CSS (Werte aus BREAKPOINTS).
 * Beispiel: window.matchMedia(BREAKPOINTS_MQ.appMobile)
 */
export const BREAKPOINTS_MQ = {
  appMobile: `(max-width: ${BREAKPOINTS.APP_MOBILE_MAX}px)` as const,
  appDesktop: `(min-width: ${BREAKPOINTS.APP_DESKTOP_MIN}px)` as const,
  editorialSlider: `(max-width: ${BREAKPOINTS.EDITORIAL_SLIDER_MAX}px)` as const,
  editorialTablet: `(min-width: ${BREAKPOINTS.EDITORIAL_TABLET_MIN}px) and (max-width: ${BREAKPOINTS.EDITORIAL_DESKTOP_MIN - 1}px)` as const,
  editorialDesktop: `(min-width: ${BREAKPOINTS.EDITORIAL_DESKTOP_MIN}px)` as const,
  desktopNav: `(min-width: ${BREAKPOINTS.DESKTOP_NAV_MIN}px)` as const,
  smallMobile: `(max-width: ${BREAKPOINTS.SMALL_MOBILE_MAX}px)` as const,
} as const
