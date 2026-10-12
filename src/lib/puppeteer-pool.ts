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
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return undefined
}

export const PUPPETEER_VPS_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--no-first-run",
  "--no-zygote",
  "--single-process",
  "--disable-extensions",
  "--disable-crash-reporter",
  "--crash-dumps-dir=/tmp",
  "--disable-features=CrashReporting,site-per-process,IsolateOrigins",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--disable-translate",
  "--hide-scrollbars",
  "--metrics-recording-only",
  "--mute-audio",
  "--safebrowsing-disable-auto-update",
]

async function launchBrowserWithOptions(headlessMode: "shell" | boolean): Promise<Browser> {
  const execPath = getExecutablePath()
  const launchOptions: any = {
    headless: headlessMode,
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
      // Primary attempt: headless "shell" completely disables Crashpad and CPU inspection
      const browser = await launchBrowserWithOptions("shell")
      browserInstance = browser
      launchPromise = null
      resetIdleTimer()

      browser.once("disconnected", () => {
        browserInstance = null
        if (idleTimer) clearTimeout(idleTimer)
      })

      return browser
    } catch (shellErr) {
      console.warn("Headless shell launch failed, attempting standard headless boolean fallback:", shellErr)
      const browser = await launchBrowserWithOptions(true)
      browserInstance = browser
      launchPromise = null
      resetIdleTimer()

      browser.once("disconnected", () => {
        browserInstance = null
        if (idleTimer) clearTimeout(idleTimer)
      })

      return browser
    }
  })().catch((err) => {
    launchPromise = null
    throw err
  })

  return launchPromise
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(async () => {
    if (browserInstance) {
      try {
        await browserInstance.close()
      } catch (e) {
        // ignore
      }
      browserInstance = null
    }
  }, IDLE_TIMEOUT_MS)
}

export async function acquirePdfPage(): Promise<{ browser: Browser; page: Page }> {
  const browser = await initBrowser()
  resetIdleTimer()

  const page = await browser.newPage()
  // Set default viewports for clean PDF rendering
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })
  return { browser, page }
}

export async function releasePdfPage(page: Page) {
  try {
    if (page && !page.isClosed()) {
      await page.close()
    }
  } catch (e) {
    console.error("Error closing PDF page:", e)
  }
}
