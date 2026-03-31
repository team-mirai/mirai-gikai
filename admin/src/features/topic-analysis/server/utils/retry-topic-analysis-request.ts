import "server-only";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 500;

type RetryOptions = {
  label: string;
  maxAttempts?: number;
  baseDelayMs?: number;
};

type RetryDeps = {
  randomFn?: () => number;
  sleepFn?: (ms: number) => Promise<void>;
};

export function getRetryDelayMs(
  attempt: number,
  baseDelayMs: number,
  randomFn: () => number = Math.random
): number {
  const jitter = Math.floor(randomFn() * baseDelayMs);
  return baseDelayMs * 2 ** (attempt - 1) + jitter;
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return undefined;
}

function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined) {
    return status === 429 || status >= 500;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getSanitizedErrorDetails(error: unknown): string {
  const status = getErrorStatus(error);
  if (error instanceof Error) {
    const statusSuffix = status !== undefined ? ` status=${status}` : "";
    return `message="${error.message}"${statusSuffix}`;
  }

  if (status !== undefined) {
    return `status=${status}`;
  }

  return "unknown error";
}

export async function retryTopicAnalysisRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  deps: RetryDeps = {}
): Promise<T> {
  const {
    label,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
  } = options;
  const { randomFn = Math.random, sleepFn = sleep } = deps;

  if (maxAttempts < 1) {
    throw new Error("maxAttempts must be greater than or equal to 1");
  }

  if (baseDelayMs < 0) {
    throw new Error("baseDelayMs must be greater than or equal to 0");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = getRetryDelayMs(attempt, baseDelayMs, randomFn);
      console.warn(
        `[TopicAnalysis] ${label} failed on attempt ${attempt}/${maxAttempts}. Retrying in ${delayMs}ms. ${getSanitizedErrorDetails(error)}`
      );
      await sleepFn(delayMs);
    }
  }

  throw new Error(`[TopicAnalysis] ${label} exhausted all retries`);
}
