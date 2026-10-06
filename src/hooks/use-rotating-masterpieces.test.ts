import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRotatingMasterpieces } from "@/lib/api";
import { useRotatingMasterpieces } from "./use-rotating-masterpieces";
import { homeImageKey, splitHomeGallery, studioFallbackImages } from "@/lib/home-gallery";

vi.mock("@/lib/api", () => ({ fetchRotatingMasterpieces: vi.fn() }));

const firstImages = Array.from({ length: 15 }, (_, index) => ({
  id: `first-${index}`,
  url: `https://example.com/first-${index}.jpg`,
}));
const nextImages = firstImages.map((image) => ({ ...image, id: `next-${image.id}` }));

describe("non-overlapping home galleries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("displays exactly 15 recent photos from a larger shared selection", () => {
    const candidates = Array.from({ length: 100 }, (_, index) => ({ id: `candidate-${index}`, url: `https://example.com/candidate-${index}.jpg` }));
    const result = splitHomeGallery(candidates);
    expect(result.recentAssets).toHaveLength(15);
    expect(result.studioImages.length).toBeGreaterThanOrEqual(6);
    const studioKeys = new Set(result.studioImages.map(homeImageKey));
    expect(result.recentAssets.every(asset => !studioKeys.has(homeImageKey(asset.url)))).toBe(true);
  });

  it("fetches more candidates when the first page cannot supply 15 recent photos", async () => {
    const api = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    const candidates = Array.from({ length: 100 }, (_, index) => ({ id: `candidate-${index}`, url: `https://example.com/candidate-${index}.jpg` }));
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ assets: firstImages, totalPages: 2 }), { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ assets: candidates, totalPages: 2 }), { headers: { "Content-Type": "application/json" } }));
    const selected = await api.fetchRotatingMasterpieces();
    expect(splitHomeGallery(selected).recentAssets).toHaveLength(15);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("page=1&limit=50&selection=four-hour");
    expect(fetchMock.mock.calls[1][0]).toContain("page=2&limit=50&selection=four-hour");
  });

  it("rejects incomplete selections rather than replacing a full gallery", async () => {
    const api = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ assets: firstImages, totalPages: 1 }), { headers: { "Content-Type": "application/json" } }));
    await expect(api.fetchRotatingMasterpieces()).rejects.toThrow("Not enough unique photos");
  });

  it("keeps studio and recent images separate across reordered and refreshed feeds", () => {
    const fixtures = [...firstImages, ...studioFallbackImages.map((url, index) => ({ id: `fallback-${index}`, url }))];
    const first = splitHomeGallery(fixtures);
    const refreshed = splitHomeGallery([...fixtures].reverse().map(asset => ({ ...asset, id: `new-${asset.id}` })));
    const studioKeys = new Set([...first.studioImages, ...refreshed.studioImages].map(homeImageKey));
    expect(first.recentAssets.length).toBeGreaterThan(0);
    expect(first.studioImages.length).toBeGreaterThanOrEqual(6);
    for (const asset of [...first.recentAssets, ...refreshed.recentAssets]) expect(studioKeys.has(homeImageKey(asset.url))).toBe(false);
    for (const fallback of studioFallbackImages) expect(first.recentAssets.some(asset => homeImageKey(asset.url) === homeImageKey(fallback))).toBe(false);
    expect([...new Set([...first.studioImages, ...first.recentAssets.map(asset => asset.url)])].sort()).toEqual(fixtures.map(asset => asset.url).sort());
  });

  it("deduplicates URL variants and gives transformed images the same owner", () => {
    const src = studioFallbackImages[0];
    const transformed = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") + "?width=400";
    const signed = src.replace("/storage/v1/object/public/", "/storage/v1/object/sign/") + "?token=test";
    const result = splitHomeGallery([{ id: "original", url: src }, { id: "query", url: `${src}?v=2` }, { id: "transformed", url: transformed }, { id: "signed", url: signed }]);
    expect(result.studioImages.filter(image => homeImageKey(image) === homeImageKey(src))).toHaveLength(1);
    expect(result.recentAssets).toHaveLength(0);
  });

  it("reserves fallback photos even when the initial feed is empty", () => {
    const initial = splitHomeGallery([]);
    const refreshed = splitHomeGallery([...firstImages, ...studioFallbackImages.map((url, index) => ({ id: `fallback-${index}`, url }))]);
    expect(initial.studioImages).toEqual(studioFallbackImages);
    expect(refreshed.recentAssets.every(asset => !initial.studioImages.includes(asset.url))).toBe(true);
  });
});

describe("four-hour masterpieces", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T20:59:59Z"));
    vi.mocked(fetchRotatingMasterpieces).mockReset().mockResolvedValue(firstImages);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads 15 images without refreshing again on same-slot focus", async () => {
    const { result } = renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    expect(result.current.assets).toEqual(firstImages);
    expect(result.current.loading).toBe(false);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(1);
  });

  it.each([
    "2026-10-05T20:59:59Z",
    "2026-10-06T00:59:59Z",
    "2026-10-06T04:59:59Z",
    "2026-10-06T08:59:59Z",
    "2026-10-06T12:59:59Z",
    "2026-10-06T16:59:59Z",
  ])("refreshes at the next Nairobi four-hour boundary from %s", async (start) => {
    vi.setSystemTime(new Date(start));
    const { result } = renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    vi.mocked(fetchRotatingMasterpieces).mockResolvedValue(nextImages);
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(result.current.assets).toEqual(nextImages);
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000 - 1));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(3);
  });

  it("aligns mid-slot arrivals to the next fixed boundary", async () => {
    vi.setSystemTime(new Date("2026-10-06T07:30:00Z"));
    renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    await act(async () => vi.advanceTimersByTimeAsync(90 * 60 * 1000 - 1));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(2);
  });

  it.each(["focus", "visibilitychange"])("catches up after sleeping across a daytime boundary on %s", async (event) => {
    vi.setSystemTime(new Date("2026-10-06T06:00:00Z"));
    const { result } = renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    vi.setSystemTime(new Date("2026-10-06T10:00:00Z"));
    vi.mocked(fetchRotatingMasterpieces).mockResolvedValue(nextImages);
    const target = event === "focus" ? window : document;
    await act(async () => target.dispatchEvent(new Event(event)));
    expect(result.current.assets).toEqual(nextImages);
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(2);
  });

  it("keeps existing images on failure and retries when focused", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    vi.mocked(fetchRotatingMasterpieces).mockRejectedValueOnce(new Error("offline"));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.assets).toEqual(firstImages);
    vi.mocked(fetchRotatingMasterpieces).mockResolvedValue(nextImages);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(result.current.assets).toEqual(nextImages);
  });

  it("cleans up the rotation timer on unmount", async () => {
    const { unmount } = renderHook(() => useRotatingMasterpieces());
    await act(async () => {});
    unmount();
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    window.dispatchEvent(new Event("focus"));
    expect(fetchRotatingMasterpieces).toHaveBeenCalledTimes(1);
  });
});