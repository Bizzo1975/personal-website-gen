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

    // Here you would typically send the metric to your analytics service
    console.log('Sending metric to analytics:', metric);
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