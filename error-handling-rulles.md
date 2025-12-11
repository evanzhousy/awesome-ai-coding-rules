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

## 2. Error Propagation
For all API async functions, if an error happens, just throw the error. Do **not** return empty data.
This allows the invoker to distinguish between an actual error and a valid empty result.
The invoker handles different scenarios wisely. Treating errors as empty data leads to silent failures and missed error notifications.

```typescript
// Do NOT catch and return empty data. Let the error propagate.
return withRetry(async () => {
  // ... operation
});

// The invoker should handle the error explicitly:
try {
  const data = await fetchData();
} catch (error) {
  notifyError(error); // Handle error (log, alert, etc.)
}
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