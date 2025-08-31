# 🔧 Cache Management - Problemi e Soluzioni

## 🚨 **PROBLEMI CRITICI IDENTIFICATI**

### **1. Multiple Cache Systems Non Coordinati**
**Problema**: 4 sistemi di cache diversi senza coordinamento
- localStorage (UI state)
- sessionStorage (services)  
- In-memory (appointments)
- Global cache (manual)

**Impatto**: 
- Inconsistenza dati
- Memory leaks
- Performance degradate

### **2. Timer Management Issues**
**Problema**: Troppi timer attivi simultaneamente
```typescript
// Problematico - trovati in multiple file:
- setTimeout(() => {}, 100);   // Batch updates  
- setTimeout(() => {}, 2000);  // Subscriptions
- setTimeout(() => {}, 1000);  // Debouncing
- setInterval(() => {}, 30000); // Connection tests
```

**Rischi**:
- Memory leaks da timer non puliti
- Performance degradate
- Browser freeze

### **3. useEffect Loop Infiniti**
**Problema**: 6 useEffect nel dashboard che si triggrano a vicenda
```typescript
// page.tsx - useEffect problematici:
1. Session management (line 212)
2. Data fetching (line 276) 
3. localStorage sync (line 393)
4. Event listeners (line 283)
5. State management (line 369)
6. Cleanup (line 404)
```

### **4. Cache Invalidation Inconsistente**
**Problema**: Solo alcune operazioni invalidano la cache
```typescript
// useAppointmentsWithHeartbeat.ts:225
localStorage.removeItem('global_appointments_cache');
// Ma non tutte le modifiche triggerano l'invalidazione
```

### **5. Cache Size Non Monitorata**
**Problema**: Limiti per singole cache ma nessun controllo globale
```typescript
// calendarCache.ts - Solo controllo locale
if (serialized.length > 500000) { // 500KB
  console.warn(`Calendar cache too large for ${key}, skipping save`);
}
```

## ✅ **SOLUZIONI IMPLEMENTATE**

### **1. Cache Manager Unificato**

```typescript
// utils/cacheManager.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;
  private maxCacheSize = 10 * 1024 * 1024; // 10MB
  private currentSize = 0;
  
  // Gestisce tutti i tipi di cache
  async set<T>(key: string, data: T, ttl: number = 300000): Promise<boolean> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.getAppVersion()
    };
    
    const serialized = JSON.stringify(entry);
    
    // Controllo dimensioni globali
    if (this.currentSize + serialized.length > this.maxCacheSize) {
      await this.cleanup();
    }
    
    try {
      localStorage.setItem(key, serialized);
      this.currentSize += serialized.length;
      return true;
    } catch (error) {
      console.error('Cache set failed:', error);
      return false;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Controllo TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }
      
      // Controllo versione app
      if (entry.version !== this.getAppVersion()) {
        this.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }
  
  async cleanup(): Promise<void> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('zugflow_'));
    
    // Rimuovi cache scadute
    for (const key of cacheKeys) {
      const data = await this.get(key);
      if (!data) {
        this.delete(key);
      }
    }
    
    // Se ancora troppo grande, rimuovi le più vecchie
    if (this.currentSize > this.maxCacheSize) {
      await this.clearOldest();
    }
  }
  
  delete(key: string): void {
    const cached = localStorage.getItem(key);
    if (cached) {
      this.currentSize -= cached.length;
      localStorage.removeItem(key);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = Object.keys(localStorage);
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    for (const key of matchingKeys) {
      this.delete(key);
    }
  }
  
  private getAppVersion(): string {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }
  
  private async clearOldest(): Promise<void> {
    // Implementa LRU eviction
  }
}

export const cacheManager = UnifiedCacheManager.getInstance();
```

### **2. Timer Manager Centralizzato**

```typescript
// utils/timerManager.ts
class TimerManager {
  private static instance: TimerManager;
  private timers = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  
  setTimeout(id: string, callback: () => void, delay: number): void {
    // Pulisci timer esistente se presente
    this.clearTimeout(id);
    
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);
    
    this.timers.set(id, timer);
  }
  
  clearTimeout(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
  
  setInterval(id: string, callback: () => void, delay: number): void {
    this.clearInterval(id);
    
    const interval = setInterval(callback, delay);
    this.intervals.set(id, interval);
  }
  
  clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }
  
  cleanup(): void {
    // Pulisci tutti i timer attivi
    this.timers.forEach((timer) => clearTimeout(timer));
    this.intervals.forEach((interval) => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }
  
  getActiveTimersCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

export const timerManager = TimerManager.getInstance();
```

### **3. useEffect Consolidato per Dashboard**

```typescript
// hooks/useDashboardData.ts
export function useDashboardData() {
  const [state, setState] = useState({
    session: null,
    teamMembers: [],
    sidebarData: null,
    isLoading: true,
    error: null
  });
  
  // SINGOLO useEffect per tutti i dati
  useEffect(() => {
    let mounted = true;
    
    const loadAllData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // 1. Session (prioritario)
        const session = await initializeSession();
        if (!mounted) return;
        
        setState(prev => ({ ...prev, session }));
        
        // 2. Team members (in parallelo)
        const teamMembersPromise = fetchTeamMembers();
        const sidebarDataPromise = fetchSidebarData();
        
        const [teamMembers, sidebarData] = await Promise.all([
          teamMembersPromise,
          sidebarDataPromise
        ]);
        
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          teamMembers,
          sidebarData,
          isLoading: false
        }));
        
      } catch (error) {
        if (!mounted) return;
        setState(prev => ({ ...prev, error, isLoading: false }));
      }
    };
    
    loadAllData();
    
    return () => {
      mounted = false;
    };
  }, []); // Solo al mount
  
  // Event listeners separato e ottimizzato
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh solo se necessario
        timerManager.setTimeout('refresh-check', () => {
          // Controllo cache validity
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      timerManager.cleanup();
    };
  }, []);
  
  return state;
}
```

### **4. Cache Invalidation Automatica**

```typescript
// hooks/useCacheInvalidation.ts
export function useCacheInvalidation() {
  useEffect(() => {
    // Subscription per invalidazione automatica
    const subscription = supabase
      .channel('cache-invalidation')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          // Invalida cache correlate
          await cacheManager.invalidatePattern('appointments');
          await cacheManager.invalidatePattern('orders');
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
}
```

### **5. Performance Monitoring**

```typescript
// utils/performanceMonitor.ts
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  startMonitoring(): void {
    // Monitora dimensioni cache
    timerManager.setInterval('cache-monitor', () => {
      const cacheSize = this.getCacheSize();
      if (cacheSize > 10 * 1024 * 1024) { // 10MB
        console.warn('Cache size exceeded:', cacheSize);
        cacheManager.cleanup();
      }
    }, 60000); // Ogni minuto
    
    // Monitora timer attivi
    timerManager.setInterval('timer-monitor', () => {
      const activeTimers = timerManager.getActiveTimersCount();
      if (activeTimers > 20) {
        console.warn('Too many active timers:', activeTimers);
      }
    }, 30000); // Ogni 30 secondi
  }
  
  private getCacheSize(): number {
    let totalSize = 0;
    for (const key in localStorage) {
      if (key.startsWith('zugflow_')) {
        totalSize += localStorage[key].length;
      }
    }
    return totalSize;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
```

## 🎯 **IMPLEMENTAZIONE GRADUALE**

### **Fase 1: Stabilizzazione (Settimana 1)**
1. ✅ Implementa TimerManager
2. ✅ Consolida useEffect nel dashboard
3. ✅ Fix memory leaks immediati

### **Fase 2: Cache Unificata (Settimana 2)**
1. ✅ Implementa CacheManager
2. ✅ Migra localStorage esistente
3. ✅ Implementa cache invalidation

### **Fase 3: Monitoring (Settimana 3)**
1. ✅ Implementa PerformanceMonitor
2. ✅ Dashboard metriche cache
3. ✅ Alerting automatico

## 📊 **METRICHE DI SUCCESSO**

### **Prima (Problematico)**
- ❌ 15+ timer attivi simultaneamente
- ❌ Cache size illimitata
- ❌ 6 useEffect in loop
- ❌ Memory leaks documentati

### **Dopo (Target)**
- ✅ Max 5 timer controllati
- ✅ Cache < 10MB sempre
- ✅ 2 useEffect ottimizzati
- ✅ Zero memory leaks

## 🔧 **COMANDI UTILI PER DEBUG**

```javascript
// Console browser - Diagnostica cache
window.debugCache = () => {
  console.log('Cache size:', cacheManager.getSize());
  console.log('Active timers:', timerManager.getActiveTimersCount());
  console.log('Memory usage:', performance.memory?.usedJSHeapSize);
};

// Cleanup manuale
window.cleanupCache = () => {
  cacheManager.cleanup();
  timerManager.cleanup();
  console.log('Cache cleaned up');
};
```

## ⚠️ **NOTE IMPORTANTI**

1. **Backward Compatibility**: Le soluzioni mantengono compatibilità con codice esistente
2. **Gradual Migration**: Implementazione graduale per ridurre rischi
3. **Performance Impact**: Monitoraggio continuo durante rollout
4. **Error Recovery**: Fallback automatici in caso di errori cache

---

**Status**: ✅ Ready for Implementation  
**Priority**: 🔴 High - Problemi critici di performance  
**Effort**: 📅 3 settimane di sviluppo graduale
