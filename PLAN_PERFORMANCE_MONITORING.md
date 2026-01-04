# Performance Monitoring Guide

## Overview

This application includes comprehensive performance monitoring using Firebase Performance Monitoring to track:
- **Page load times** - Time to load and render each page
- **API response times** - Time for Firestore operations to complete
- **Custom metrics** - Component render times and other custom measurements

## Automatic Tracking

### Page Load Times
Page load times are automatically tracked for all routes via the router integration:

```typescript
// Automatic tracking in router/index.ts
router.beforeEach((to) => {
  performanceService.startPageTrace(pageName);
});

router.afterEach((to) => {
  performanceService.stopPageTrace(pageName);
});
```

### Initial Page Load
The initial page load metrics are automatically captured using the Navigation Timing API:
- Total page load time
- DOM ready time
- First paint time

## Manual Tracking

### Tracking Firestore Operations

Use the performance-wrapped Firestore helpers to automatically track API response times:

```typescript
import {
  getDocWithPerformance,
  getDocsWithPerformance,
  addDocWithPerformance,
  updateDocWithPerformance
} from '@/firebase/performanceFirestore';

// Instead of getDoc()
const data = await getDocWithPerformance(docRef);

// Instead of getDocs()
const docs = await getDocsWithPerformance(collectionRef);

// Instead of addDoc()
const newDoc = await addDocWithPerformance(collectionRef, data);

// Instead of updateDoc()
await updateDocWithPerformance(docRef, updates);
```

### Custom Performance Tracking

Track custom operations:

```typescript
import { performanceService } from '@/services/performanceService';

// Track a custom async operation
await performanceService.trackFirestoreOperation(
  'customOperation',
  'collectionName',
  async () => {
    // Your async code here
    return result;
  }
);

// Track a custom metric
performanceService.trackCustomMetric('myMetric', 123, 'ms');

// Track component render time
performanceService.trackComponentRender('MyComponent', renderTime);
```

## Viewing Metrics

### Firebase Console
View performance metrics in the [Firebase Console](https://console.firebase.google.com/project/eeg-adorateurs/performance):

1. **Page Load Times**: Navigate to Performance > Web > Page Load
2. **API Response Times**: Performance > Firestore > Operations
3. **Custom Traces**: Performance > Custom Traces

### In-App Metrics

Get performance summary programmatically:

```typescript
import { performanceService } from '@/services/performanceService';

// Get summary
const summary = performanceService.getPerformanceSummary();
console.log(summary);
// {
//   averagePageLoadTime: 245,
//   averageAPIResponseTime: 128,
//   totalPageViews: 42,
//   totalAPIRequests: 156,
//   slowestPages: [...],
//   slowestAPIs: [...]
// }

// Get specific metrics
const avgPageLoad = performanceService.getAveragePageLoadTime();
const avgAPITime = performanceService.getAverageAPIResponseTime();
const slowPages = performanceService.getSlowestPages(5);
```

## Best Practices

### 1. Use Performance Wrappers for Firestore
Always use the performance-wrapped Firestore helpers instead of direct Firestore calls for automatic tracking:

```typescript
// ✅ Good - Tracked
const members = await getDocsWithPerformance(membersCollection);

// ❌ Bad - Not tracked
const members = await getDocs(membersCollection);
```

### 2. Track Heavy Operations
Manually track computationally expensive operations:

```typescript
const startTime = performance.now();
const result = await heavyComputation();
const duration = performance.now() - startTime;
performanceService.trackCustomMetric('heavy_computation', duration);
```

### 3. Monitor Component Performance
Track render times for complex components:

```typescript
onMounted(() => {
  const renderTime = performance.now();
  // Component initialization
  performanceService.trackComponentRender('ComplexComponent', renderTime);
});
```

## Metrics Tracked

### Automatic Metrics
- **initial_page_load**: Initial page load with DOM ready and first paint
- **page_[pageName]**: Load time for each page/route
- **screen_view**: Screen views via analytics integration

### Firestore Operations (when using wrappers)
- **firestore_getDoc_[collection]**: Single document reads
- **firestore_getDocs_[collection]**: Collection/query reads
- **firestore_addDoc_[collection]**: Document creation
- **firestore_updateDoc_[collection]**: Document updates
- **firestore_deleteDoc_[collection]**: Document deletion

### Custom Metrics
- **custom_[name]**: Custom performance measurements
- **component_[name]_render**: Component render times

## Troubleshooting

### Metrics not appearing in Firebase Console
1. Ensure Firebase Performance is enabled in your Firebase project
2. Wait 24 hours for data to aggregate
3. Check browser console for errors during performance tracking

### High page load times
1. Check `getSlowestPages()` to identify problematic pages
2. Optimize component initialization
3. Lazy load heavy components
4. Reduce initial data fetching

### High API response times
1. Check `getSlowestAPICalls()` to identify slow operations
2. Add Firestore indexes for common queries
3. Optimize query structure
4. Use pagination for large result sets

## Configuration

Performance monitoring is initialized automatically in `src/services/performanceService.ts`.

To disable performance monitoring:
```typescript
// Set to null in performanceService constructor
this.performance = null;
```

## Advanced Usage

### Manual Trace Control
For fine-grained control over performance traces:

```typescript
// Start a trace
performanceService.startAPITrace('/api/endpoint', 'GET');

// Do work...

// Stop trace with metrics
performanceService.stopAPITrace(traceId, 200, 1024, undefined);
```

### Performance Budget Alerts
Monitor when metrics exceed thresholds:

```typescript
const avgLoad = performanceService.getAveragePageLoadTime();
if (avgLoad > 1000) {
  console.warn('Average page load exceeds 1 second!');
}
```
