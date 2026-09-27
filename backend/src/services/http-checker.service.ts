export interface HttpCheckResult {
  status: "UP" | "DOWN";
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

export interface HttpCheckOptions {
  url: string;
  method: "GET" | "POST" | "HEAD";
  timeoutMs: number;
  label?: string;
}

export async function checkHttpEndpoint(
  options: HttpCheckOptions
): Promise<HttpCheckResult> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  const startedAt = Date.now();

  try {
    const response = await fetch(options.url, {
      method: options.method,
      signal: controller.signal,
    });

    const responseTimeMs = Date.now() - startedAt;

    const isUp = response.status >= 200 && response.status < 400;

    return {
      status: isUp ? "UP" : "DOWN",
      statusCode: response.status,
      responseTimeMs,
      errorMessage: isUp ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "DOWN",
      statusCode: null,
      responseTimeMs: null,
      errorMessage:
        error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkHttpEndpointWithRetry(
  options: HttpCheckOptions,
  maxAttempts = 3,
  retryDelayMs = 10000
): Promise<HttpCheckResult> {
  let lastResult: HttpCheckResult | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
    `[${options.label ?? options.url}] HTTP check attempt ${attempt}/${maxAttempts}`
    );

    const result = await checkHttpEndpoint(options);

    lastResult = result;

    if (result.status === "UP") {
      return result;
    }

    if (attempt < maxAttempts) {
      await sleep(retryDelayMs);
    }
  }

  if (!lastResult) {
    throw new Error("HTTP check did not run");
  }

  return lastResult;
}