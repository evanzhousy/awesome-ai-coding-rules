# Error-Handling Best Practices

## 1. Retry Logic with Exponential Backoff
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
      await sleep(delay);
    }
  }
  throw lastError!;
}
```

## 2. Graceful Degradation
When all retries fail, return empty data structure instead of crashing:
```typescript
return withRetry(async () => {
  // ... operation
}).catch((error) => {
  logErrorHandler(`[operation] All retries exhausted, returning empty map. Final error: ${JSON.stringify(error)}`);
  return new Map<string, SymbolDailyMeta>(); // Graceful fallback
});
```

## 3. Comprehensive Logging
- Use both `logInfoHandler()` for success and `logErrorHandler()` for failures
- Include operation context in log messages
- Log full error details with `JSON.stringify(error)`

## 4. Type Safety
- Always specify return types: `Promise<Map<string, SymbolDailyMeta>>`
- Use proper error typing: `error as Error`

## 5. Separation of Concerns
- Dedicated retry utility function separate from business logic
- Centralized logging utilities
- Clean error propagation through promise chain