import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import * as api from "@/lib/api";
import Admin from "./Admin";

vi.mock("@/lib/api", () => ({ fetchPortfolios: vi.fn(), updatePortfolio: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/site/SEO", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPage", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const portfolio = {
  id: "portfolio-1",
  title: "Original collection",
  slug: "original-collection",
  images: [{ id: "image-1", url: "https://example.com/image.jpg" }],
};

const startRenaming = async () => {
  render(<MemoryRouter><Admin /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Rename Original collection" }));
  return screen.getByRole("textbox", { name: "Portfolio name" });
};

describe("admin portfolio names", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchPortfolios).mockResolvedValue([portfolio]);
    vi.mocked(api.updatePortfolio).mockResolvedValue({ ...portfolio, title: "New collection" });
  });

  afterEach(cleanup);

  it("saves a trimmed title without changing images or the URL", async () => {
    const input = await startRenaming();
    expect(input).toHaveValue("Original collection");
    fireEvent.change(input, { target: { value: "  New collection  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save portfolio name" }));
    await screen.findByRole("button", { name: "Rename New collection" });
    expect(api.updatePortfolio).toHaveBeenCalledWith("portfolio-1", { title: "New collection" });
    expect(toast.success).toHaveBeenCalledWith("Portfolio renamed");
    expect(screen.getByRole("img", { name: "New collection" })).toHaveAttribute("src", portfolio.images[0].url);
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute("href", "/admin/portfolio/portfolio-1");
  });

  it("cancels without saving", async () => {
    const input = await startRenaming();
    fireEvent.change(input, { target: { value: "Unsaved name" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel rename" }));
    expect(screen.getByRole("button", { name: "Rename Original collection" })).toBeInTheDocument();
    expect(api.updatePortfolio).not.toHaveBeenCalled();
  });

  it("does not allow a blank name", async () => {
    const input = await startRenaming();
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Save portfolio name" })).toBeDisabled();
    fireEvent.submit(input.closest("form")!);
    expect(api.updatePortfolio).not.toHaveBeenCalled();
  });

  it.each(["response", "network"])("keeps the original name and draft after a %s failure", async (failure) => {
    if (failure === "response") {
      vi.mocked(api.updatePortfolio).mockResolvedValue({ error: "Failed to rename portfolio" });
    } else {
      vi.mocked(api.updatePortfolio).mockRejectedValue(new Error("Network unavailable"));
    }
    const input = await startRenaming();
    fireEvent.change(input, { target: { value: "New collection" } });
    fireEvent.click(screen.getByRole("button", { name: "Save portfolio name" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to rename portfolio"));
    expect(screen.getByRole("textbox", { name: "Portfolio name" })).toHaveValue("New collection");
    expect(screen.getByRole("button", { name: "Save portfolio name" })).toBeEnabled();
    expect(screen.getByRole("img", { name: "Original collection" })).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });
});