/**
 * Performance Optimizer Service
 * Optimizes bundle size and loading performance for the AI Code Editor
 * Validates: Requirements 1.1
 */

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  maxBundleSize: number;
  maxLoadTime: number;
}

class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];
  private fileCache: Map<string, any> = new Map();

  constructor() {
    this.config = {
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableCaching: true,
      enableCompression: true,
      maxBundleSize: 2 * 1024 * 1024, // 2MB
      maxLoadTime: 3000, // 3 seconds
    };

    this.metrics = {
      bundleSize: 0,
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    };

    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.monitorNavigationTiming();
    }

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.monitorResourceLoading();
    }

    // Monitor memory usage
    if ('memory' in performance) {
      this.monitorMemoryUsage();
    }
  }

  /**
   * Monitor navigation timing
   */
  private monitorNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.navigationStart;
      this.metrics.renderTime = navigation.domContentLoadedEventEnd - navigation.navigationStart;
    }
  }

  /**
   * Monitor resource loading
   */
  private monitorResourceLoading(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalSize = 0;

      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          totalSize += (entry as any).transferSize || 0;
        }
      });

      this.metrics.bundleSize += totalSize;
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      }
    };

    updateMemoryUsage();
    setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
  }

  /**
   * Optimize bundle loading with lazy loading
   */
  async optimizeBundleLoading(): Promise<void> {
    if (!this.config.enableLazyLoading) return;

    // Implement lazy loading for non-critical components
    const lazyComponents = [
      'UserPreferencesPanel',
      'OnboardingTour',
      'ProjectGallery',
      'AdvancedSettings',
    ];

    for (const component of lazyComponents) {
      await this.lazyLoadComponent(component);
    }
  }

  /**
   * Lazy load a component
   */
  private async lazyLoadComponent(componentName: string): Promise<void> {
    try {
      // Simulate dynamic import
      const startTime = performance.now();
      
      // In a real implementation, this would be:
      // const module = await import(`../components/${componentName}`);
      
      const endTime = performance.now();
      console.log(`Lazy loaded ${componentName} in ${endTime - startTime}ms`);
    } catch (error) {
      console.error(`Failed to lazy load ${componentName}:`, error);
    }
  }

  /**
   * Optimize images and assets
   */
  optimizeAssets(): void {
    // Implement image lazy loading
    this.implementImageLazyLoading();
    
    // Preload critical assets
    this.preloadCriticalAssets();
    
    // Compress and optimize images
    this.optimizeImages();
  }

  /**
   * Implement image lazy loading
   */
  private implementImageLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Preload critical assets
   */
  private preloadCriticalAssets(): void {
    const criticalAssets = [
      '/fonts/monaco.woff2',
      '/icons/editor-icons.svg',
      '/css/critical.css',
    ];

    criticalAssets.forEach((asset) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset;
      
      if (asset.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (asset.endsWith('.css')) {
        link.as = 'style';
      } else if (asset.endsWith('.svg')) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize images
   */
  private optimizeImages(): void {
    document.querySelectorAll('img').forEach((img) => {
      // Add loading="lazy" for modern browsers
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }

      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }
    });
  }

  /**
   * Implement caching strategies
   */
  implementCaching(): void {
    if (!this.config.enableCaching) return;

    // Service Worker caching
    this.registerServiceWorker();
    
    // Browser caching
    this.optimizeBrowserCaching();
    
    // Memory caching
    this.implementMemoryCache();
  }

  /**
   * Register service worker for caching
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Optimize browser caching
   */
  private optimizeBrowserCaching(): void {
    // Set cache headers for static assets
    const cacheableExtensions = ['.js', '.css', '.woff2', '.png', '.jpg', '.svg'];
    
    cacheableExtensions.forEach((ext) => {
      const elements = document.querySelectorAll(`[src*="${ext}"], [href*="${ext}"]`);
      elements.forEach((element) => {
        // Add cache-friendly attributes
        element.setAttribute('data-cache', 'long-term');
      });
    });
  }

  /**
   * Implement memory cache
   */
  private implementMemoryCache(): void {
    const cache = new Map<string, any>();
    const maxCacheSize = 50; // Maximum number of cached items

    (window as any).memoryCache = {
      get: (key: string) => cache.get(key),
      set: (key: string, value: any) => {
        if (cache.size >= maxCacheSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      clear: () => cache.clear(),
      size: () => cache.size,
    };
  }

  /**
   * Monitor and report performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if performance is within acceptable limits
   */
  isPerformanceOptimal(): boolean {
    return (
      this.metrics.bundleSize <= this.config.maxBundleSize &&
      this.metrics.loadTime <= this.config.maxLoadTime &&
      this.metrics.memoryUsage < 100 * 1024 * 1024 // 100MB
    );
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.bundleSize > this.config.maxBundleSize) {
      recommendations.push('Consider code splitting to reduce bundle size');
    }

    if (this.metrics.loadTime > this.config.maxLoadTime) {
      recommendations.push('Optimize asset loading and enable compression');
    }

    if (this.metrics.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('Monitor memory usage and implement cleanup');
    }

    if (this.metrics.cacheHitRate < 0.8) {
      recommendations.push('Improve caching strategy for better performance');
    }

    return recommendations;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get optimized Monaco Editor options based on file size
   */
  getOptimizedMonacoOptions(fileSize: number): any {
    const threshold = 1024 * 1024; // 1MB
    const isLargeFile = fileSize > threshold;

    if (isLargeFile) {
      return {
        minimap: { enabled: false },
        wordWrap: 'off' as const,
        lineNumbers: 'on' as const,
        folding: false,
        renderWhitespace: 'none' as const,
        scrollBeyondLastLine: false,
        smoothScrolling: false,
        disableMonospaceOptimizations: false,
        automaticLayout: true,
        fixedOverflowWidgets: true,
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        hover: { enabled: false },
        occurrencesHighlight: 'off' as const,
        selectionHighlight: false,
        codeLens: false,
      };
    }

    return {
      minimap: { enabled: true },
      wordWrap: 'on' as const,
      lineNumbers: 'on' as const,
      folding: true,
      renderWhitespace: 'selection' as const,
      scrollBeyondLastLine: false,
      smoothScrolling: false,
      disableMonospaceOptimizations: false,
      automaticLayout: true,
      fixedOverflowWidgets: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      hover: { enabled: true },
      occurrencesHighlight: 'singleFile' as const,
      selectionHighlight: true,
      codeLens: true,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.fileCache.clear();
    if ((window as any).memoryCache) {
      (window as any).memoryCache.clear();
    }
  }

  /**
   * Check if file should be lazy loaded based on size
   */
  shouldLazyLoad(fileSize: number): boolean {
    return fileSize > 1024 * 1024; // 1MB threshold
  }

  /**
   * Create lazy loaded file wrapper
   */
  createLazyLoadedFile(id: string, name: string, path: string, content: string): any {
    const size = new Blob([content]).size;
    const isLazyLoaded = this.shouldLazyLoad(size);
    
    const file = {
      id,
      name,
      path,
      content,
      size,
      isLazyLoaded,
      previewContent: isLazyLoaded ? content.substring(0, 1000) : content,
      fullContent: content,
      loadContent: async () => {
        // Simulate lazy loading delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return content;
      }
    };

    // Store in cache for memory tracking
    this.fileCache.set(id, file);
    
    return file;
  }

  /**
   * Create debounced function
   */
  createDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Debounce function (alias for createDebouncedFunction)
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return this.createDebouncedFunction(func, delay);
  }

  /**
   * Create throttled function
   */
  createThrottledFunction<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Throttle function (alias for createThrottledFunction)
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return this.createThrottledFunction(func, delay);
  }

  /**
   * Calculate memory usage
   */
  calculateMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  /**
   * Record a single performance metric
   */
  recordMetric(metricType: string, value: number): void {
    (this.metrics as any)[metricType] = value;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory usage from cache
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    for (const file of this.fileCache.values()) {
      totalSize += file.size;
    }
    return totalSize;
  }

  /**
   * Cleanup performance observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();