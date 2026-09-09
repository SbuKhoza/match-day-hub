/**
 * Shared cache + request de-duplication for the football data provider.
 *
 * Rules enforced here (so no component has to think about them):
 *  - identical URLs requested at the same time share one network request
 *  - a fresh cached response is returned without touching the network
 *  - if the provider fails, the last valid response is returned as stale data
 *    rather than an empty result
 */

export class SportsApiError extends Error {
  readonly status: number | null;
  readonly rateLimited: boolean;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SportsApiError";
    this.status = status;
    this.rateLimited = status === 429;
  }
}

export interface CachedResult<T> {
  data: T;
  /** Epoch ms of the last successful fetch of this URL. */
  fetchedAt: number;
  /** True when the network failed and cached data is being served instead. */
  stale: boolean;
  /** Message describing why the data is stale, if it is. */
  error: string | null;
}

interface Entry {
  data: unknown;
  fetchedAt: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new SportsApiError(
      cause instanceof Error && cause.name === "TimeoutError"
        ? "The football data service took too long to respond."
        : "Could not reach the football data service.",
    );
  }

  if (response.status === 429) {
    throw new SportsApiError("Football data request limit reached. Try again shortly.", 429);
  }
  if (!response.ok) {
    throw new SportsApiError(
      `Football data service returned an error (${response.status}).`,
      response.status,
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new SportsApiError("The football data service returned an unreadable response.");
  }
  if (parsed === null || typeof parsed !== "object") {
    throw new SportsApiError("The football data service returned an unexpected response.");
  }
  return parsed as T;
}

export async function cachedGet<T>(url: string, ttl: number): Promise<CachedResult<T>> {
  const cached = store.get(url);
  if (cached && Date.now() - cached.fetchedAt < ttl) {
    return { data: cached.data as T, fetchedAt: cached.fetchedAt, stale: false, error: null };
  }

  let pending = inflight.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = request<T>(url);
    inflight.set(url, pending);
    void pending.catch(() => undefined).finally(() => inflight.delete(url));
  }

  try {
    const data = await pending;
    const fetchedAt = Date.now();
    store.set(url, { data, fetchedAt });
    return { data, fetchedAt, stale: false, error: null };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Unable to update live football data.";
    // Never throw away good data because of a temporary provider failure.
    if (cached) {
      return { data: cached.data as T, fetchedAt: cached.fetchedAt, stale: true, error: message };
    }
    throw cause instanceof SportsApiError ? cause : new SportsApiError(message);
  }
}

/** Drops every cached response (used by a manual refresh action). */
export function clearSportsCache(): void {
  store.clear();
}

export function cacheSize(): number {
  return store.size;
}
