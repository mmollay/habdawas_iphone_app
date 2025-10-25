import { createContext, useContext, useRef, ReactNode, useCallback, useMemo } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

type InvalidationListener = (key: string) => void;

interface GlobalCacheContextType {
  getCached: <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ) => Promise<T>;
  setCached: <T>(key: string, data: T) => void;
  invalidate: (key: string) => void;
  invalidatePattern: (pattern: string) => void;
  clearAll: () => void;
  addInvalidationListener: (listener: InvalidationListener) => () => void;
}

const GlobalCacheContext = createContext<GlobalCacheContextType | undefined>(undefined);

export const useGlobalCache = () => {
  const context = useContext(GlobalCacheContext);
  if (!context) {
    throw new Error('useGlobalCache must be used within a GlobalCacheProvider');
  }
  return context;
};

export const GlobalCacheProvider = ({ children }: { children: ReactNode }) => {
  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const pendingRef = useRef<Map<string, Promise<any>>>(new Map());
  const listenersRef = useRef<Set<InvalidationListener>>(new Set());

  const setCached = useCallback(<T,>(key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const getCached = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60000 // Default 60s cache
  ): Promise<T> => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);

    // Return cached data if still valid
    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    // If a request is already pending for this key, wait for it
    const pending = pendingRef.current.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        cacheRef.current.set(key, {
          data,
          timestamp: Date.now(),
        });
        pendingRef.current.delete(key);
        return data;
      })
      .catch((error) => {
        pendingRef.current.delete(key);
        throw error;
      });

    pendingRef.current.set(key, promise);
    return promise;
  }, []);

  const invalidate = useCallback((key: string) => {
    cacheRef.current.delete(key);
    pendingRef.current.delete(key);

    // Notify all listeners
    listenersRef.current.forEach(listener => listener(key));
  }, []);

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    cacheRef.current.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      cacheRef.current.delete(key);
      pendingRef.current.delete(key);

      // Notify all listeners
      listenersRef.current.forEach(listener => listener(key));
    });
  }, []);

  const clearAll = useCallback(() => {
    cacheRef.current.clear();
    pendingRef.current.clear();
  }, []);

  const addInvalidationListener = useCallback((listener: InvalidationListener) => {
    listenersRef.current.add(listener);

    // Return cleanup function to remove listener
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({
    getCached,
    setCached,
    invalidate,
    invalidatePattern,
    clearAll,
    addInvalidationListener,
  }), [getCached, setCached, invalidate, invalidatePattern, clearAll, addInvalidationListener]);

  return (
    <GlobalCacheContext.Provider value={value}>
      {children}
    </GlobalCacheContext.Provider>
  );
};
