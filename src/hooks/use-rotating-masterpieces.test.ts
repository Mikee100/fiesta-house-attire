import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRotatingMasterpieces } from "@/lib/api";
import { useRotatingMasterpieces } from "./use-rotating-masterpieces";

vi.mock("@/lib/api", () => ({ fetchRotatingMasterpieces: vi.fn() }));

const firstImages = Array.from({ length: 15 }, (_, index) => ({
  id: `first-${index}`,
  url: `https://example.com/first-${index}.jpg`,
}));
const nextImages = firstImages.map((image) => ({ ...image, id: `next-${image.id}` }));

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