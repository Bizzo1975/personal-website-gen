'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetrics {
  cls?: number;
  inp?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  reportToAnalytics?: boolean;
  showDebugInfo?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  reportToAnalytics = false,
  showDebugInfo = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  // Send metrics to analytics
  const sendToAnalytics = useCallback((metric: any) => {
    if (!reportToAnalytics) return;

    // Send to performance API endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      }),
    }).catch(error => {
      console.warn('Failed to send performance metric:', error);
    });
  }, [reportToAnalytics]);

  useEffect(() => {
    if (!enabled) return;

    // Collect Web Vitals
    const handleMetric = (metric: any) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value
      }));

      if (reportToAnalytics) {
        sendToAnalytics(metric);
      }

      if (showDebugInfo) {
        console.log(`Web Vital: ${metric.name}`, metric.value);
      }
    };

    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Performance observer for additional metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (showDebugInfo) {
            console.log('Performance Entry:', entry);
          }
        }
      });

      observer.observe({ entryTypes: ['resource', 'navigation'] });
    }
  }, [enabled, reportToAnalytics, sendToAnalytics, showDebugInfo]);

  return null; // This is a utility component that doesn't render anything
};

export default PerformanceMonitor; 