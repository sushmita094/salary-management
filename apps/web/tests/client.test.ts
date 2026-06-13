import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, api, setUnauthorizedHandler } from "../src/api/client";

function mockFetch(body: unknown, status = 200) {
  const init = body === null ? null : JSON.stringify(body);
  const fetchMock = vi.fn().mockResolvedValue(new Response(init, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe("api client", () => {
  it("returns parsed JSON on success and sends credentials", async () => {
    const fetchMock = mockFetch({ hello: "world" });

    await expect(api.get<{ hello: string }>("/thing")).resolves.toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledWith("/api/thing", expect.objectContaining({ credentials: "include" }));
  });

  it("parses the error envelope into a typed ApiRequestError", async () => {
    mockFetch({ error: { code: "CONFLICT", message: "Duplicate email", details: [{ path: "email" }] } }, 409);

    const error = await api.post("/employees", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 409, code: "CONFLICT", message: "Duplicate email" });
    expect((error as ApiRequestError).details).toEqual([{ path: "email" }]);
  });

  it("invokes the unauthorized handler on a 401", async () => {
    mockFetch({ error: { code: "UNAUTHORIZED", message: "Nope" } }, 401);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(api.get("/employees")).rejects.toBeInstanceOf(ApiRequestError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("skips the unauthorized handler when asked (auth probes)", async () => {
    mockFetch({ error: { code: "UNAUTHORIZED", message: "Nope" } }, 401);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(api.get("/auth/me", { skipUnauthorizedHandler: true })).rejects.toBeInstanceOf(ApiRequestError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("returns undefined for a 204 No Content", async () => {
    mockFetch(null, 204);
    await expect(api.delete("/employees/abc")).resolves.toBeUndefined();
  });
});
