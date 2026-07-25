import puppeteer, { Browser, Page } from "puppeteer"

let browserInstance: Browser | null = null
let launchPromise: Promise<Browser> | null = null
let idleTimer: NodeJS.Timeout | null = null

const IDLE_TIMEOUT_MS = 10 * 60 * 1000 // Close browser if idle for 10 minutes

async function initBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  if (launchPromise) {
    return launchPromise
  }

  launchPromise = puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }).then((browser) => {
    browserInstance = browser
    launchPromise = null
    resetIdleTimer()

    browser.once("disconnected", () => {
      browserInstance = null
      if (idleTimer) clearTimeout(idleTimer)
    })

    return browser
  }).catch((err) => {
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
