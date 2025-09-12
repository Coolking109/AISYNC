/**
 * API Timeout Utilities
 * Provides consistent timeout handling for API routes
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 45000)
 * @param errorMessage Custom error message for timeout
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 45000,
  errorMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Creates a timeout controller for manual cleanup
 * @param timeoutMs Timeout in milliseconds
 * @param callback Callback to execute on timeout
 */
export function createTimeoutController(timeoutMs: number, callback: () => void) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    callback();
  }, timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId)
  };
}

/**
 * Standard error response for timeout situations
 */
export function createTimeoutResponse() {
  return Response.json(
    { 
      error: 'Request timeout',
      message: 'The request took too long to process. Please try again with a shorter message or simpler request.',
      timeout: true
    },
    { status: 504 }
  );
}
