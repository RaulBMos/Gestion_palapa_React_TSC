import { onCLS, onINP, onLCP, Metric } from 'web-vitals';

interface PerformanceMetrics {
  lcp?: Metric;
  inp?: Metric;
  cls?: Metric;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private isDevelopment = import.meta.env.DEV;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    onLCP((metric) => {
      this.metrics.lcp = metric;
      this.logMetric('LCP', metric);
    });

    onINP((metric) => {
      this.metrics.inp = metric;
      this.logMetric('INP', metric);
    });

    onCLS((metric) => {
      this.metrics.cls = metric;
      this.logMetric('CLS', metric);
    });
  }

  private logMetric(name: string, metric: Metric) {
    if (this.isDevelopment) {
      const metricsTable = [
        { Metric: name, Value: metric.value, Rating: metric.rating, Delta: metric.delta }
      ];
      console.table(metricsTable);
    } else {
      this.sendToAnalytics(name, metric);
    }
  }

  private sendToAnalytics(name: string, metric: Metric) {
    const analyticsData = {
      event: 'web_vitals',
      name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now()
    };

    console.log('Analytics Event:', analyticsData);

    // Mock analytics service - replace with real analytics implementation
    this.mockAnalyticsService(analyticsData);
  }

  private mockAnalyticsService(data: unknown) {
    // Simulate network delay
    setTimeout(() => {
      console.log('✅ Analytics data sent:', data);
    }, 100);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getMetricSummary() {
    const summary = {
      lcp: this.metrics.lcp ? {
        value: this.metrics.lcp.value.toFixed(2),
        rating: this.metrics.lcp.rating
      } : null,
      inp: this.metrics.inp ? {
        value: this.metrics.inp.value.toFixed(2),
        rating: this.metrics.inp.rating
      } : null,
      cls: this.metrics.cls ? {
        value: this.metrics.cls.value.toFixed(3),
        rating: this.metrics.cls.rating
      } : null
    };

    return summary;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Initialize immediately
if (typeof window !== 'undefined') {
  // Performance monitoring is now active
}

export default performanceMonitor;