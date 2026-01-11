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

## 3. Fault Tolerance for Non-Critical Operations
When an underlying async function is not critical (i.e., we have fault tolerance for it), wrap it in its own `try-catch` block. This ensures that if it fails, we get notified, but the invoker process continues without interruption.

```typescript
try {
  // Non-critical operation: failure here is handled locally and doesn't stop the flow
  try {
    await fetchDataFunctionOne();
  } catch(error) {
    notifyError(error); // Log/Alert and proceed
  }

  // Critical operation: failure here propagates to the outer catch
  const data = await fetchDataFunctionTwo();

} catch (error) {
  notifyError(error); // Handle critical errors
}
```

## 4. Comprehensive Logging
- Use both `logInfoHandler()` for success and `logErrorHandler()` for failures.
- **Include Function Tags**: Always include the function name (e.g., `[FunctionName]`) in the log message to easily trace the source of the error.
- Log full error details with `JSON.stringify(error)` to capture the complete context.

```typescript
const updateSubscriptionCache = async () => { 
   try { 
     const response = await apiGetUserSubscription(); 
 
     if (response.status === 'SUCCESS') { 
       // Handle success
       setLocalStorageSubscriptionObject(response.data); 
     } else { 
       // Tagging the log with [updateSubscriptionCache]
       await logErrorHandler(`[updateSubscriptionCache] Failed to fetch subscription. Response: ${JSON.stringify(response)}`);
       return null; 
     } 
   } catch (err) { 
     // Tagging the error with [updateSubscriptionCache]
     throw new Error(`[updateSubscriptionCache] Exception: ${err.message}`); 
   } 
 };
```

## 5. Type Safety
- Always specify return types: `Promise<Map<string, SymbolDailyMeta>>`
- Use proper error typing: `error as Error`

## 6. Separation of Concerns
- Dedicated retry utility function separate from business logic
- Centralized logging utilities
- Clean error propagation through promise chain

## 7. Standardized Error Logging Format
When throwing errors, use a consistent format that makes it easy to locate issues in the code:

**Format**: `[FunctionName] meaningful error information`

**DO NOT** manually include line numbers in the error message, as they are:
- Already captured in the error stack trace automatically
- Prone to becoming outdated when code changes
- Redundant and add maintenance overhead

The error stack will automatically include the file name, line number, and full call stack, making manual line number tracking unnecessary.

```typescript
// ✅ GOOD: Function tag + meaningful message (line number comes from stack)
async function fetchUserData(userId: string) {
  try {
    const response = await api.getUser(userId);
    if (!response.data) {
      throw new Error(`[fetchUserData] No data returned for user ID: ${userId}`);
    }
    return response.data;
  } catch (err) {
    // Preserve original error stack while adding context
    throw new Error(`[fetchUserData] Failed to fetch user data for ID ${userId}: ${err.message}`, { cause: err });
  }
}

// ❌ BAD: Don't manually add line numbers
throw new Error(`[fetchUserData] Line 42: Failed to fetch data`); // Line 42 will be wrong after edits!

// ✅ GOOD: When logging the error, include the full error object
try {
  await fetchUserData(userId);
} catch (error) {
  logErrorHandler(`[handleUserRequest] ${error.message}`, error); // Pass full error for stack trace
}
```

**Benefits**:
- **Easy location tracking**: Function tag immediately identifies the source
- **Meaningful context**: Describes what went wrong and with what data
- **Automatic line numbers**: Stack trace provides accurate file and line information
- **No maintenance burden**: No need to update line numbers when code changes

