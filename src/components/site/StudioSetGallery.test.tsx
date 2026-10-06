import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudioSetGallery, { type StudioSet } from "./StudioSetGallery";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Studio set stories", () => {
  const setupRotation = (reducedMotion = false) => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal("IntersectionObserver", class {
      constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
      observe() { this.callback([{ isIntersecting: true }]); }
      disconnect() {}
    });
  };

  it("rotates real collection photos, pauses, and opens the current image", () => {
    setupRotation();
    vi.useFakeTimers();
    render(<StudioSetGallery images={["/one.jpg", "/two.jpg", "/three.jpg", "/four.jpg", "/five.jpg", "/six.jpg", "/seven.jpg"]} />);
    expect(screen.getByAltText("Studio portrait 1")).toHaveAttribute("src", "/one.jpg");
    act(() => { vi.advanceTimersByTime(8000); });
    expect(screen.queryByAltText("Studio portrait 1")).not.toBeInTheDocument();
    expect(screen.getByAltText("Studio portrait 7")).toHaveAttribute("src", "/seven.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Pause photo rotation" }));
    act(() => { vi.advanceTimersByTime(16000); });
    expect(screen.queryByAltText("Studio portrait 1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume photo rotation" }));
    fireEvent.click(screen.getByRole("button", { name: "Explore Studio portrait 7" }));
    expect(screen.getByAltText("Studio portrait 7 - Portrait 7")).toHaveAttribute("src", "/seven.jpg");
    act(() => { vi.advanceTimersByTime(16000); });
    expect(screen.getByAltText("Studio portrait 7 - Portrait 7")).toHaveAttribute("src", "/seven.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByAltText("Studio portrait 7 - Portrait 1")).toHaveAttribute("src", "/one.jpg");
  });

  it("keeps photos still for reduced motion and uses originals while loading", () => {
    setupRotation(true);
    vi.useFakeTimers();
    render(<StudioSetGallery images={[]} />);
    const initial = screen.getByAltText("Studio portrait 1").getAttribute("src");
    act(() => { vi.advanceTimersByTime(24000); });
    expect(screen.getByAltText("Studio portrait 1")).toHaveAttribute("src", initial);
    expect(screen.queryByRole("button", { name: "Pause photo rotation" })).not.toBeInTheDocument();
    expect(screen.queryByText("The Master Staircase")).not.toBeInTheDocument();
  });

  it("opens a set, navigates crops and wraps with arrow keys", () => {
    render(<StudioSetGallery />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Flower Gardens" }));
    const dialog = screen.getByRole("dialog", { name: "Flower Gardens" });
    expect(screen.getByAltText("Flower Gardens - Full composition")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByAltText("Flower Gardens - Portrait crop")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View Detail crop" }));
    expect(screen.getByRole("button", { name: "View Detail crop" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(screen.getByAltText("Flower Gardens - Full composition")).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(screen.getByAltText("Flower Gardens - Detail crop")).toBeInTheDocument();
  });

  it("closes, restores focus and resets the story when another set opens", async () => {
    render(<StudioSetGallery />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Elegant Swings" }));
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    fireEvent.click(screen.getByRole("button", { name: "Close gallery" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Explore Elegant Swings" })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Explore Cinematic Boat" }));
    expect(screen.getByAltText("Cinematic Boat - Full composition")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("swipes between views and handles unavailable images", () => {
    render(<StudioSetGallery />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Flower Gardens" }));
    const image = screen.getByAltText("Flower Gardens - Full composition");
    fireEvent.touchStart(image, { touches: [{ clientX: 200, clientY: 100 }], changedTouches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(image, { changedTouches: [{ clientX: 80, clientY: 110 }] });
    expect(screen.getByAltText("Flower Gardens - Portrait crop")).toBeInTheDocument();
    fireEvent.error(screen.getByAltText("Flower Gardens - Portrait crop"));
    expect(screen.getByRole("status")).toHaveTextContent("This media is unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Close gallery" }));
  });

  it("supports separate photographs and an optional behind-the-scenes clip", () => {
    const sets: StudioSet[] = [{
      name: "Test set", detail: "Studio story", img: "/cover.jpg",
      media: [
        { kind: "image", src: "/wide.jpg", label: "Wide shot" },
        { kind: "video", src: "/behind-the-scenes.mp4", poster: "/poster.jpg", label: "Behind the scenes" },
      ],
    }];
    render(<StudioSetGallery sets={sets} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Test set" }));
    expect(screen.getByAltText("Test set - Wide shot")).toHaveAttribute("src", "/wide.jpg");
    fireEvent.click(screen.getByRole("button", { name: "View Behind the scenes" }));
    expect(screen.getByLabelText("Behind the scenes")).toHaveAttribute("controls");
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.queryByLabelText("Behind the scenes")).not.toBeInTheDocument();
  });
});