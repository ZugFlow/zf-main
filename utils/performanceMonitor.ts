import { timerManager } from './timerManager';

interface PerformanceMetrics {
  timerStats: any;
  memoryUsage: any;
  pageLoad: number;
  renderTime: number;
  errorCount: number;
  lastCheck: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    timerStats: null,
    memoryUsage: null,
    pageLoad: 0,
    renderTime: 0,
    errorCount: 0,
    lastCheck: Date.now()
  };
  private isMonitoring = false;
  private errorThreshold = 10;
  private memoryThreshold = 50 * 1024 * 1024; // 50MB

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.recordPageLoad();
    this.setupErrorTracking();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    console.log('📊 Starting performance monitoring...');
    
    this.isMonitoring = true;
    
    // Monitor every minute
    timerManager.setInterval(
      'performance-monitor',
      () => this.collectMetrics(),
      60000,
      'monitoring'
    );

    // Memory check every 30 seconds
    timerManager.setInterval(
      'memory-monitor',
      () => this.checkMemoryUsage(),
      30000,
      'monitoring'
    );

    console.log('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    console.log('📊 Stopping performance monitoring...');
    
    this.isMonitoring = false;
    timerManager.clearCategory('monitoring');
    
    console.log('✅ Performance monitoring stopped');
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    try {
      this.metrics = {
        timerStats: timerManager.getStats(),
        memoryUsage: this.getMemoryUsage(),
        pageLoad: this.metrics.pageLoad,
        renderTime: this.measureRenderTime(),
        errorCount: this.metrics.errorCount,
        lastCheck: Date.now()
      };

      // Check for performance issues
      this.checkPerformanceIssues();

    } catch (error) {
      console.error('❌ Error collecting performance metrics:', error);
    }
  }

  /**
   * Check for performance issues and take action
   */
  private checkPerformanceIssues(): void {
    const { timerStats, memoryUsage } = this.metrics;

    // Check timer count
    if (timerStats && timerStats.totalTimers > 30) {
      console.warn(`⚠️ High timer count: ${timerStats.totalTimers}`);
      timerManager.cleanupOldTimers();
    }

    // Check memory usage
    if (memoryUsage && memoryUsage.usedJSHeapSize > this.memoryThreshold) {
      console.warn(`⚠️ High memory usage: ${this.formatBytes(memoryUsage.usedJSHeapSize)}`);
      this.performEmergencyCleanup();
    }

    // Check error count
    if (this.metrics.errorCount > this.errorThreshold) {
      console.error(`🚨 High error count: ${this.metrics.errorCount}`);
      this.reportHealthIssue('high_error_count');
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    
    if (memory && memory.usedJSHeapSize > this.memoryThreshold) {
      console.warn(`⚠️ Memory usage high: ${this.formatBytes(memory.usedJSHeapSize)}`);
      
      // Trigger garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
        console.log('🗑️ Manual garbage collection triggered');
      }
      
      // Emergency cleanup
      timerManager.setTimeout(
        'emergency-memory-cleanup',
        () => this.performEmergencyCleanup(),
        1000,
        'cleanup'
      );
    }
  }

  /**
   * Perform emergency cleanup
   */
  private async performEmergencyCleanup(): Promise<void> {
    console.warn('🚨 Performing emergency performance cleanup...');
    
    try {
      // Clear old timers
      timerManager.cleanupOldTimers();
      
      // Clear any large objects from memory
      this.clearLargeObjects();
      
      console.log('✅ Emergency cleanup completed');
      
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
    }
  }

  /**
   * Clear large objects from memory
   */
  private clearLargeObjects(): void {
    try {
      // Clear any global caches or large objects
      if (typeof window !== 'undefined') {
        // Clear any cached DOM queries
        (window as any).cachedElements = null;
        
        // Clear any large arrays or objects
        Object.keys(window).forEach(key => {
          if (key.startsWith('cached') || key.startsWith('global')) {
            try {
              delete (window as any)[key];
            } catch (e) {
              // Ignore errors
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error clearing large objects:', error);
    }
  }

  /**
   * Record page load time
   */
  private recordPageLoad(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.now();
      this.metrics.pageLoad = loadTime;
      
      // Record when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          const domTime = window.performance.now();
          console.log(`📊 DOM Ready: ${domTime.toFixed(2)}ms`);
        });
      }
      
      // Record when page is fully loaded
      window.addEventListener('load', () => {
        const fullLoadTime = window.performance.now();
        console.log(`📊 Page Fully Loaded: ${fullLoadTime.toFixed(2)}ms`);
      });
    }
  }

  /**
   * Measure render time
   */
  private measureRenderTime(): number {
    if (typeof window !== 'undefined' && window.performance) {
      const entries = window.performance.getEntriesByType('measure');
      if (entries.length > 0) {
        return entries[entries.length - 1].duration;
      }
    }
    return 0;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): any {
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      return (window.performance as any).memory;
    }
    return null;
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.metrics.errorCount++;
        console.error('🚨 Global error:', event.error);
        
        if (this.metrics.errorCount > this.errorThreshold) {
          this.reportHealthIssue('error_threshold_exceeded');
        }
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.metrics.errorCount++;
        console.error('🚨 Unhandled promise rejection:', event.reason);
        
        if (this.metrics.errorCount > this.errorThreshold) {
          this.reportHealthIssue('promise_rejection_threshold_exceeded');
        }
      });
    }
  }

  /**
   * Report health issue
   */
  private reportHealthIssue(issue: string): void {
    console.error(`🏥 Health issue detected: ${issue}`);
    
    // In production, this could send telemetry data
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      this.sendTelemetry(issue);
    }
  }

  /**
   * Send telemetry data (placeholder)
   */
  private sendTelemetry(issue: string): void {
    // Placeholder for telemetry service integration
    console.log(`📡 Telemetry: ${issue}`, this.metrics);
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    status: 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check timer count
    if (this.metrics.timerStats && this.metrics.timerStats.totalTimers > 30) {
      issues.push('High number of active timers');
      recommendations.push('Review timer usage and implement cleanup');
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage && this.metrics.memoryUsage.usedJSHeapSize > this.memoryThreshold) {
      issues.push('High memory usage');
      recommendations.push('Implement memory optimization strategies');
    }
    
    // Check error count
    if (this.metrics.errorCount > this.errorThreshold) {
      issues.push('High error count');
      recommendations.push('Review error handling and fix underlying issues');
    }
    
    // Determine status
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning';
    }
    
    return { status, issues, recommendations };
  }

  /**
   * Export performance report
   */
  exportReport(): string {
    const summary = this.getPerformanceSummary();
    const timestamp = new Date().toISOString();
    
    return JSON.stringify({
      timestamp,
      status: summary.status,
      metrics: this.metrics,
      issues: summary.issues,
      recommendations: summary.recommendations
    }, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Console debug helpers
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  (window as any).debugPerformance = () => {
    console.log('📊 Performance Summary:', performanceMonitor.getPerformanceSummary());
    console.log('📈 Detailed Metrics:', performanceMonitor.getMetrics());
  };
}
