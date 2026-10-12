import fs from "fs"
import puppeteer, { Browser, Page } from "puppeteer"

let browserInstance: Browser | null = null
let launchPromise: Promise<Browser> | null = null
let idleTimer: NodeJS.Timeout | null = null

const IDLE_TIMEOUT_MS = 10 * 60 * 1000 // Close browser if idle for 10 minutes

export function getExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/snap/bin/chromium",
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return undefined
}

// Stable VPS Chrome Arguments (Multi-process enabled to allow PDF print threads without crashes)
export const PUPPETEER_VPS_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--no-first-run",
  "--disable-extensions",
  "--disable-crash-reporter",
  "--crash-dumps-dir=/tmp",
  "--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--disable-translate",
  "--hide-scrollbars",
  "--metrics-recording-only",
  "--mute-audio",
  "--safebrowsing-disable-auto-update",
]

async function launchBrowserWithOptions(): Promise<Browser> {
  const execPath = getExecutablePath()
  const launchOptions: any = {
    headless: true,
    args: PUPPETEER_VPS_ARGS,
  }
  if (execPath) {
    launchOptions.executablePath = execPath
  }
  return puppeteer.launch(launchOptions)
}

async function initBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  if (launchPromise) {
    return launchPromise
  }

  launchPromise = (async () => {
    try {
      const browser = await launchBrowserWithOptions()
      browserInstance = browser
      launchPromise = null
      resetIdleTimer()

      browser.once("disconnected", () => {
        browserInstance = null
        if (idleTimer) clearTimeout(idleTimer)
      })

      return browser
    } catch (err) {
      console.error("Puppeteer pool launch error:", err)
      launchPromise = null
      browserInstance = null
      throw err
    }
  })()

  return launchPromise
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(async () => {
    if (browserInstance) {
      try {
        await browserInstance.close()
      } catch (e) {
        console.error("Error closing idle PDF browser instance:", e)
      } finally {
        browserInstance = null
      }
    }
  }, IDLE_TIMEOUT_MS)
}

/**
 * Acquire an isolated Page instance from the shared browser pool
 */
export async function acquirePdfPage(): Promise<{ page: Page; browser: Browser }> {
  const browser = await initBrowser()
  const page = await browser.newPage()

  // Optimize page memory and speed
  await page.setRequestInterception(false)
  await page.setViewport({ width: 1200, height: 1600 })

  return { page, browser }
}

/**
 * Release and safely close a Page instance back to the pool
 */
export async function releasePdfPage(page: Page): Promise<void> {
  try {
    if (!page.isClosed()) {
      await page.close()
    }
  } catch (e) {
    console.error("Error releasing PDF page back to pool:", e)
  }
  resetIdleTimer()
}
