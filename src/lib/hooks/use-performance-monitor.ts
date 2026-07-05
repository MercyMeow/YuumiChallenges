/**
 * Performance Monitoring Hook for Timeline System
 * Tracks rendering performance, memory usage, and processing times
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  // Rendering metrics
  renderTime: number;
  componentMountTime: number;
  reRenderCount: number;

  // Data processing metrics
  dataProcessingTime: number;
  cacheHitRate: number;
  itemsProcessed: number;

  // Memory metrics (approximated)
  approximateMemoryUsage: number;
  componentsRendered: number;

  // User experience metrics
  timeToInteractive: number;
  scrollPerformance: number;

  // Timeline specific
  eventsDisplayed: number;
  virtualizedItemsRendered: number;
}

interface PerformanceThresholds {
  renderTime: number; // ms
  dataProcessingTime: number; // ms
  memoryUsage: number; // MB
  cacheHitRate: number; // %
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: 100, // 100ms for smooth 60fps
  dataProcessingTime: 500, // 500ms for data processing
  memoryUsage: 50, // 50MB memory limit
  cacheHitRate: 80, // 80% cache hit rate target
};

export function usePerformanceMonitor(
  componentName: string,
  thresholds = DEFAULT_THRESHOLDS
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    reRenderCount: 0,
    dataProcessingTime: 0,
    cacheHitRate: 0,
    itemsProcessed: 0,
    approximateMemoryUsage: 0,
    componentsRendered: 0,
    timeToInteractive: 0,
    scrollPerformance: 0,
    eventsDisplayed: 0,
    virtualizedItemsRendered: 0,
  });

  const [warnings, setWarnings] = useState<string[]>([]);
  // Capture the first render's start time exactly once via a lazy state
  // initializer (never updated, so it behaves like the previous ref).
  const [startTime] = useState<number>(() => performance.now());
  const renderCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    const mountTime = performance.now() - startTime;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- performance monitor must publish effect-time measurements to state; deferring the update would change the reported timings
    setMetrics((prev) => ({
      ...prev,
      componentMountTime: mountTime,
    }));
    // startTime is set once by the lazy initializer and never changes.
  }, [startTime]);

  // Track re-renders
  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - lastRenderTimeRef.current;
    lastRenderTimeRef.current = performance.now();

    setMetrics((prev) => ({
      ...prev,
      reRenderCount: renderCountRef.current,
      renderTime: renderTime,
    }));

    // Check performance thresholds
    const newWarnings: string[] = [];

    if (renderTime > thresholds.renderTime) {
      newWarnings.push(
        `Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${thresholds.renderTime}ms)`
      );
    }

    if (renderCountRef.current > 10) {
      newWarnings.push(
        `High re-render count: ${renderCountRef.current} (consider memoization)`
      );
    }

    setWarnings(newWarnings);
  }, [thresholds.renderTime]);

  // Track data processing performance
  const trackDataProcessing = useCallback(
    (
      processingTime: number,
      itemsCount: number,
      cacheHits: number,
      cacheMisses: number
    ) => {
      const hitRate =
        cacheHits + cacheMisses > 0
          ? (cacheHits / (cacheHits + cacheMisses)) * 100
          : 0;

      setMetrics((prev) => ({
        ...prev,
        dataProcessingTime: processingTime,
        itemsProcessed: itemsCount,
        cacheHitRate: hitRate,
      }));

      const newWarnings: string[] = [...warnings];

      if (processingTime > thresholds.dataProcessingTime) {
        newWarnings.push(
          `Slow data processing: ${processingTime.toFixed(2)}ms (threshold: ${thresholds.dataProcessingTime}ms)`
        );
      }

      if (hitRate < thresholds.cacheHitRate) {
        newWarnings.push(
          `Low cache hit rate: ${hitRate.toFixed(1)}% (threshold: ${thresholds.cacheHitRate}%)`
        );
      }

      setWarnings(newWarnings);
    },
    [warnings, thresholds]
  );

  // Track memory usage (approximated)
  const trackMemoryUsage = useCallback(
    (componentsCount: number, dataSize: number = 0) => {
      const approximateMemory = componentsCount * 0.1 + dataSize / 1024 / 1024; // Very rough estimate

      setMetrics((prev) => ({
        ...prev,
        approximateMemoryUsage: approximateMemory,
        componentsRendered: componentsCount,
      }));

      if (approximateMemory > thresholds.memoryUsage) {
        setWarnings((prev) => [
          ...prev,
          `High memory usage: ${approximateMemory.toFixed(2)}MB (threshold: ${thresholds.memoryUsage}MB)`,
        ]);
      }
    },
    [thresholds]
  );

  // Track timeline specific metrics
  const trackTimelineMetrics = useCallback(
    (eventsCount: number, virtualizedItems: number = 0) => {
      setMetrics((prev) => ({
        ...prev,
        eventsDisplayed: eventsCount,
        virtualizedItemsRendered: virtualizedItems,
      }));
    },
    []
  );

  // Track scroll performance
  const trackScrollPerformance = useCallback((scrollTime: number) => {
    setMetrics((prev) => ({
      ...prev,
      scrollPerformance: scrollTime,
    }));
  }, []);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    let score = 100;

    // Deduct points for slow renders
    if (metrics.renderTime > thresholds.renderTime) {
      score -= Math.min(
        30,
        (metrics.renderTime / thresholds.renderTime - 1) * 100
      );
    }

    // Deduct points for slow processing
    if (metrics.dataProcessingTime > thresholds.dataProcessingTime) {
      score -= Math.min(
        25,
        (metrics.dataProcessingTime / thresholds.dataProcessingTime - 1) * 100
      );
    }

    // Deduct points for high memory usage
    if (metrics.approximateMemoryUsage > thresholds.memoryUsage) {
      score -= Math.min(
        20,
        (metrics.approximateMemoryUsage / thresholds.memoryUsage - 1) * 100
      );
    }

    // Deduct points for low cache hit rate
    if (metrics.cacheHitRate < thresholds.cacheHitRate) {
      score -= Math.min(
        15,
        (thresholds.cacheHitRate - metrics.cacheHitRate) / 2
      );
    }

    // Deduct points for excessive re-renders
    if (metrics.reRenderCount > 5) {
      score -= Math.min(10, metrics.reRenderCount - 5);
    }

    return Math.max(0, Math.round(score));
  }, [metrics, thresholds]);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.renderTime > thresholds.renderTime) {
      recommendations.push(
        'Consider using React.memo() for expensive components'
      );
      recommendations.push(
        'Move expensive calculations to useMemo() or Web Workers'
      );
    }

    if (metrics.reRenderCount > 10) {
      recommendations.push(
        'Add useCallback() to event handlers to prevent re-renders'
      );
      recommendations.push(
        'Check if useEffect dependencies are causing unnecessary re-renders'
      );
    }

    if (metrics.dataProcessingTime > thresholds.dataProcessingTime) {
      recommendations.push('Move heavy data processing to Web Workers');
      recommendations.push('Implement data pagination or virtualization');
    }

    if (metrics.cacheHitRate < thresholds.cacheHitRate) {
      recommendations.push('Improve caching strategy for processed data');
      recommendations.push('Consider longer cache TTL for stable data');
    }

    if (metrics.approximateMemoryUsage > thresholds.memoryUsage) {
      recommendations.push('Implement virtualization for large lists');
      recommendations.push('Clear unused data from memory cache');
    }

    if (
      metrics.eventsDisplayed > 500 &&
      metrics.virtualizedItemsRendered === 0
    ) {
      recommendations.push(
        'Implement list virtualization for better performance'
      );
    }

    return recommendations;
  }, [metrics, thresholds]);

  // Export performance data for analytics
  const exportMetrics = useCallback(() => {
    return {
      componentName,
      timestamp: Date.now(),
      metrics,
      warnings,
      performanceScore: getPerformanceScore(),
      recommendations: getRecommendations(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }, [
    componentName,
    metrics,
    warnings,
    getPerformanceScore,
    getRecommendations,
  ]);

  return {
    metrics,
    warnings,
    performanceScore: getPerformanceScore(),
    recommendations: getRecommendations(),
    trackDataProcessing,
    trackMemoryUsage,
    trackTimelineMetrics,
    trackScrollPerformance,
    exportMetrics,
  };
}
