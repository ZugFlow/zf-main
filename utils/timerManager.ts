/**
 * Centralized Timer Management
 * Prevents memory leaks and provides better control over active timers
 */

interface TimerInfo {
  id: string;
  type: 'timeout' | 'interval';
  callback: () => void;
  delay: number;
  created: number;
  category: string;
}

class TimerManager {
  private static instance: TimerManager;
  private timers = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private timerInfo = new Map<string, TimerInfo>();
  private readonly maxTimers = 50; // Safety limit

  public static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  private constructor() {
    this.startMonitoring();
    this.setupCleanupOnPageUnload();
  }

  /**
   * Set timeout with automatic cleanup and collision detection
   */
  setTimeout(
    id: string, 
    callback: () => void, 
    delay: number,
    category: string = 'default'
  ): string {
    // Check for timer limit
    if (this.getTotalActiveTimers() >= this.maxTimers) {
      console.warn(`⚠️ Timer limit reached (${this.maxTimers}), cleaning up old timers`);
      this.cleanupOldTimers();
    }

    // Clear existing timer with same ID
    this.clearTimeout(id);

    try {
      const timer = setTimeout(() => {
        try {
          callback();
        } catch (error) {
          console.error(`❌ Timer callback error for ${id}:`, error);
        } finally {
          // Auto-cleanup after execution
          this.timers.delete(id);
          this.timerInfo.delete(id);
        }
      }, delay);

      this.timers.set(id, timer);
      this.timerInfo.set(id, {
        id,
        type: 'timeout',
        callback,
        delay,
        created: Date.now(),
        category
      });

      console.log(`⏱️ Timer SET: ${id} (${delay}ms, ${category})`);
      return id;

    } catch (error) {
      console.error(`❌ Failed to set timer ${id}:`, error);
      return '';
    }
  }

  /**
   * Clear timeout
   */
  clearTimeout(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
      this.timerInfo.delete(id);
      console.log(`🗑️ Timer CLEARED: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Set interval with automatic cleanup
   */
  setInterval(
    id: string, 
    callback: () => void, 
    delay: number,
    category: string = 'default'
  ): string {
    // Check for timer limit
    if (this.getTotalActiveTimers() >= this.maxTimers) {
      console.warn(`⚠️ Timer limit reached (${this.maxTimers}), cleaning up old timers`);
      this.cleanupOldTimers();
    }

    // Clear existing interval with same ID
    this.clearInterval(id);

    try {
      const interval = setInterval(() => {
        try {
          callback();
        } catch (error) {
          console.error(`❌ Interval callback error for ${id}:`, error);
          // Don't auto-clear intervals on error, they might recover
        }
      }, delay);

      this.intervals.set(id, interval);
      this.timerInfo.set(id, {
        id,
        type: 'interval',
        callback,
        delay,
        created: Date.now(),
        category
      });

      console.log(`🔄 Interval SET: ${id} (${delay}ms, ${category})`);
      return id;

    } catch (error) {
      console.error(`❌ Failed to set interval ${id}:`, error);
      return '';
    }
  }

  /**
   * Clear interval
   */
  clearInterval(id: string): boolean {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
      this.timerInfo.delete(id);
      console.log(`🗑️ Interval CLEARED: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all timers in a category
   */
  clearCategory(category: string): number {
    let clearedCount = 0;

    for (const [id, info] of this.timerInfo.entries()) {
      if (info.category === category) {
        if (info.type === 'timeout') {
          this.clearTimeout(id);
        } else {
          this.clearInterval(id);
        }
        clearedCount++;
      }
    }

    console.log(`🗑️ Category CLEARED: ${category} (${clearedCount} timers)`);
    return clearedCount;
  }

  /**
   * Cleanup old timers (timeouts older than 5 minutes, intervals older than 1 hour)
   */
  cleanupOldTimers(): number {
    const now = Date.now();
    let clearedCount = 0;

    for (const [id, info] of this.timerInfo.entries()) {
      const age = now - info.created;
      
      // Different age limits for different types
      const ageLimit = info.type === 'timeout' ? 300000 : 3600000; // 5 min / 1 hour
      
      if (age > ageLimit) {
        if (info.type === 'timeout') {
          this.clearTimeout(id);
        } else {
          this.clearInterval(id);
        }
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`🧹 Old timers cleaned: ${clearedCount}`);
    }

    return clearedCount;
  }

  /**
   * Emergency cleanup - clear all timers
   */
  cleanup(): void {
    console.warn('🚨 Emergency timer cleanup initiated');

    // Clear all timeouts
    for (const [id, timer] of this.timers.entries()) {
      clearTimeout(timer);
    }

    // Clear all intervals
    for (const [id, interval] of this.intervals.entries()) {
      clearInterval(interval);
    }

    // Clear all maps
    this.timers.clear();
    this.intervals.clear();
    this.timerInfo.clear();

    console.warn('🚨 All timers cleared');
  }

  /**
   * Get total active timers count
   */
  getTotalActiveTimers(): number {
    return this.timers.size + this.intervals.size;
  }

  /**
   * Get timers by category
   */
  getTimersByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};

    for (const info of this.timerInfo.values()) {
      categories[info.category] = (categories[info.category] || 0) + 1;
    }

    return categories;
  }

  /**
   * Get detailed timer statistics
   */
  getStats(): {
    totalTimers: number;
    timeouts: number;
    intervals: number;
    categories: Record<string, number>;
    oldestTimer: number | null;
    newestTimer: number | null;
  } {
    const now = Date.now();
    let oldestTimer: number | null = null;
    let newestTimer: number | null = null;

    for (const info of this.timerInfo.values()) {
      const age = now - info.created;
      if (oldestTimer === null || age > oldestTimer) {
        oldestTimer = age;
      }
      if (newestTimer === null || age < newestTimer) {
        newestTimer = age;
      }
    }

    return {
      totalTimers: this.getTotalActiveTimers(),
      timeouts: this.timers.size,
      intervals: this.intervals.size,
      categories: this.getTimersByCategory(),
      oldestTimer,
      newestTimer
    };
  }

  /**
   * Check if a timer exists
   */
  hasTimer(id: string): boolean {
    return this.timers.has(id) || this.intervals.has(id);
  }

  /**
   * Get timer info
   */
  getTimerInfo(id: string): TimerInfo | undefined {
    return this.timerInfo.get(id);
  }

  /**
   * Debounced timeout - automatically clears and resets if called again within delay
   */
  debounceTimeout(
    id: string,
    callback: () => void,
    delay: number,
    category: string = 'debounce'
  ): string {
    // This will automatically clear the existing timer if it exists
    return this.setTimeout(`debounce_${id}`, callback, delay, category);
  }

  /**
   * Throttled callback - ensures callback is called at most once per delay period
   */
  throttle(
    id: string,
    callback: () => void,
    delay: number,
    category: string = 'throttle'
  ): boolean {
    const throttleId = `throttle_${id}`;
    
    // If timer already exists, skip this call
    if (this.hasTimer(throttleId)) {
      return false;
    }

    // Execute callback immediately
    try {
      callback();
    } catch (error) {
      console.error(`❌ Throttle callback error for ${id}:`, error);
    }

    // Set timer to prevent future calls
    this.setTimeout(throttleId, () => {
      // Timer will auto-delete itself
    }, delay, category);

    return true;
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.setInterval('timer-monitor', () => {
      const stats = this.getStats();
      
      // Log warning if too many timers
      if (stats.totalTimers > this.maxTimers * 0.8) {
        console.warn(`⚠️ High timer usage: ${stats.totalTimers}/${this.maxTimers}`);
      }

      // Auto-cleanup old timers
      if (stats.totalTimers > 20) {
        this.cleanupOldTimers();
      }

      // Log stats in debug mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Timer Stats:', stats);
      }

    }, 30000, 'system');
  }

  /**
   * Setup cleanup on page unload
   */
  private setupCleanupOnPageUnload(): void {
    if (typeof window !== 'undefined') {
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // Cleanup on visibility change (mobile)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Clean up non-critical timers when page becomes hidden
          this.clearCategory('debounce');
          this.clearCategory('throttle');
          this.clearCategory('ui');
        }
      });
    }
  }

  /**
   * Format milliseconds to human readable
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Get human readable timer list
   */
  listTimers(): string[] {
    const timers: string[] = [];
    const now = Date.now();

    for (const [id, info] of this.timerInfo.entries()) {
      const age = now - info.created;
      timers.push(
        `${info.type.toUpperCase()}: ${id} (${this.formatDuration(age)} old, ${info.category})`
      );
    }

    return timers.sort();
  }
}

// Export singleton instance
export const timerManager = TimerManager.getInstance();

// Console debug helpers
if (typeof window !== 'undefined') {
  (window as any).timerManager = timerManager;
  (window as any).debugTimers = () => {
    console.log('📊 Timer Stats:', timerManager.getStats());
    console.log('📝 Active Timers:', timerManager.listTimers());
  };
}
