type CacheEntry = {
  value: any
  expiresAt: number
}

class InMemoryCache {
  private store = new Map<string, CacheEntry>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.store.set(key, { value, expiresAt })
  }

  invalidate(keyOrPattern: string): void {
    if (keyOrPattern.includes("*")) {
      const regex = new RegExp("^" + keyOrPattern.replace(/\*/g, ".*") + "$")
      for (const k of this.store.keys()) {
        if (regex.test(k)) {
          this.store.delete(k)
        }
      }
    } else {
      this.store.delete(keyOrPattern)
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const freshValue = await fetcher()
    this.set(key, freshValue, ttlSeconds)
    return freshValue
  }
}

export const appCache = new InMemoryCache()
