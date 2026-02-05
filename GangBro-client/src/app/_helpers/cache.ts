export interface CacheEntry<T> {
    data: T;
    expiry: number;
}

export class CacheManager {
    static set<T>(key: string, data: T, ttlMs: number = 3600000): void {
        const entry: CacheEntry<T> = {
            data,
            expiry: Date.now() + ttlMs,
        };
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            // If quota exceeded, clear old caches
            this.clearOldCaches();
            try {
                localStorage.setItem(key, JSON.stringify(entry));
            } catch (innerE) {
                console.error('Cache quota exceeded even after cleanup');
            }
        }
    }

    static get<T>(key: string): T | null {
        const item = localStorage.getItem(key);
        if (!item) return null;

        try {
            const entry: CacheEntry<T> = JSON.parse(item);
            if (Date.now() > entry.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return entry.data;
        } catch (e) {
            return null;
        }
    }

    static clearOldCaches(): void {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith('chat_cache_') || key.startsWith('gang_cache_')) {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        const entry = JSON.parse(item);
                        if (entry.expiry && Date.now() > entry.expiry) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) { }
                }
            }
        });

        // If still tight on space, delete oldest entries (limit to 50 entries)
        const gangKeys = Object.keys(localStorage).filter(
            (k) => k.startsWith('chat_cache_') || k.startsWith('gang_cache_'),
        );
        if (gangKeys.length > 50) {
            // In a real app we'd sort by LRU, but for now just trim
            gangKeys.slice(0, 10).forEach((k) => localStorage.removeItem(k));
        }
    }
}
