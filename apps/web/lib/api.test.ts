import { describe, expect, it } from "vitest";
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { apiClient } from "./api";
/**
 * Installs a mock transport as the client's default adapter so every call —
 * including the refresh and retry the interceptor fires internally — goes
 * through it. Restored afterwards so tests stay isolated.
 */
function useMockTransport(
  calls: string[],
  handler: (
    url: string,
    callIndex: number,
  ) => {
    status: number;
    data: unknown;
  },
) {
  const previous = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const index = calls.length;
    calls.push(url);
    const { status, data } = handler(url, index);

    if (status >= 200 && status < 300) {
      return {
        status,
        data,
        config,
        headers: {},
        statusText: "OK",
      } as AxiosResponse;
    }

    throw new AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_REQUEST",
      config,
      {},
      {
        status,
        data,
        config,
        headers: {},
        statusText: "Unauthorized",
      } as AxiosResponse,
    );
  };
  return () => {
    apiClient.defaults.adapter = previous;
  };
}

/** Fails the test rather than hanging forever if the request never settles. */
function withHangGuard<T>(promise: Promise<T>): Promise<T> {
  const guard = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("timed out: the request hung and never settled")),
      2000,
    );
  });
  return Promise.race([promise, guard]);
}

describe("refresh interceptor", () => {
  it("surfaces the login error for wrong credentials without touching refresh", async () => {
    // Wrong password: login 401s, and there is no session so refresh would
    // 401 too. Before the NO_REFRESH_URLS guard this deadlocked in
    // failedQueue and the form sat on "Logging in…" forever.
    const calls: string[] = [];
    const restore = useMockTransport(calls, (url) =>
      url === "/auth/login"
        ? {
            status: 401,
            data: {
              message: "Invalid credentials",
              code: "INVALID_CREDENTIALS",
            },
          }
        : { status: 401, data: { message: "Unauthorized" } },
    );

    const failed = await withHangGuard(
      apiClient.post("/auth/login", {}).then(
        () => null,
        (error: unknown) => error,
      ),
    ).finally(restore);

    expect(failed).toBeInstanceOf(AxiosError);
    const axiosError = failed as AxiosError<{ message: string }>;
    expect(axiosError.response?.status).toBe(401);
    expect(axiosError.response?.data).toEqual({
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
    // The original error comes back — no refresh attempt rewrites it.
    expect(calls).toEqual(["/auth/login"]);
  });

  it("still refreshes an expired token for protected endpoints", async () => {
    const calls: string[] = [];
    let applicationsCalls = 0;
    const restore = useMockTransport(calls, (url) => {
      if (url === "/applications") {
        applicationsCalls += 1;
        return applicationsCalls === 1
          ? { status: 401, data: { message: "Unauthorized" } }
          : { status: 200, data: { applications: [] } };
      }
      return { status: 200, data: {} };
    });

    const response = await withHangGuard(
      apiClient.get("/applications"),
    ).finally(restore);

    expect(response.status).toBe(200);
    expect(calls).toEqual(["/applications", "/auth/refresh", "/applications"]);
  });

  it("refreshes the session check when the access token expires", async () => {
    // The board guard reads the session through GET /auth/me. With only an
    // expired access token this 401s — but the refresh token is still valid,
    // so the interceptor must refresh and retry instead of handing the guard
    // a 401 that bounces the user to /login 15 minutes after signing in.
    const calls: string[] = [];
    let meCalls = 0;
    const restore = useMockTransport(calls, (url) => {
      if (url === "/auth/me") {
        meCalls += 1;
        return meCalls === 1
          ? { status: 401, data: { message: "Invalid or expired token" } }
          : { status: 200, data: { user: { id: 1 } } };
      }
      return { status: 200, data: { user: { id: 1 } } };
    });

    const response = await withHangGuard(apiClient.get("/auth/me")).finally(
      restore,
    );

    expect(response.status).toBe(200);
    expect(calls).toEqual(["/auth/me", "/auth/refresh", "/auth/me"]);
  });

  it("still rejects the session check when the refresh token is dead", async () => {
    // A genuinely logged-out visitor: /auth/me 401s and refresh 401s too.
    // The 401 must still reach the board guard so it redirects to /login.
    const calls: string[] = [];
    const restore = useMockTransport(calls, (url) =>
      url === "/auth/me"
        ? { status: 401, data: { message: "Invalid or expired token" } }
        : { status: 401, data: { message: "No refresh token" } },
    );

    const failed = await withHangGuard(
      apiClient.get("/auth/me").then(
        () => null,
        (error: unknown) => error,
      ),
    ).finally(restore);

    expect(failed).toBeInstanceOf(AxiosError);
    expect((failed as AxiosError).response?.status).toBe(401);
    expect(calls).toEqual(["/auth/me", "/auth/refresh"]);
  });
});
