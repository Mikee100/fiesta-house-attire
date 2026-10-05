import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import * as api from "@/lib/api";
import AdminAssets from "./AdminAssets";

vi.mock("@/lib/api", () => ({
  fetchFolders: vi.fn(),
  fetchPortfolios: vi.fn(),
  fetchAssets: vi.fn(),
  addAssetsBulk: vi.fn(),
  addImagesToPortfolioBulk: vi.fn(),
  moveAssetsToFolder: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/site/SEO", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPage", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/admin/AdminSection", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

const sourceAssets = [
  { id: "image-1", url: "https://example.com/first.jpg" },
  { id: "image-2", url: "https://example.com/second.jpg" },
];
const selectedUrls = sourceAssets.map((asset) => asset.url);

const selectSourceImages = async () => {
  render(
    <MemoryRouter initialEntries={["/admin/assets?folderId=source"]}>
      <AdminAssets />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getAllByAltText("")).toHaveLength(2));
  fireEvent.click(screen.getByRole("button", { name: "Select Page" }));
};

describe("Admin Assets copying", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.mocked(api.fetchFolders).mockResolvedValue([
      { id: "source", name: "Source folder" },
      { id: "destination", name: "Destination folder" },
    ]);
    vi.mocked(api.fetchPortfolios).mockResolvedValue([
      { id: "portfolio", title: "Destination portfolio", images: [] },
    ]);
    vi.mocked(api.fetchAssets).mockResolvedValue({ assets: sourceAssets, totalPages: 1 });
    vi.mocked(api.addAssetsBulk).mockResolvedValue(sourceAssets);
    vi.mocked(api.addImagesToPortfolioBulk).mockResolvedValue(sourceAssets);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("creates folder copies without moving the originals", async () => {
    await selectSourceImages();
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "destination" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy To Folder" }));
    await waitFor(() => expect(api.addAssetsBulk).toHaveBeenCalledWith(selectedUrls, "destination"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Copied 2 images to folder"));
    expect(api.moveAssetsToFolder).not.toHaveBeenCalled();
    expect(screen.getAllByAltText("").map((image) => image.getAttribute("src"))).toEqual(selectedUrls);
    expect(api.fetchAssets).toHaveBeenLastCalledWith("source", 1, 100, "");
    expect(screen.queryByRole("button", { name: "Move Selected" })).not.toBeInTheDocument();
  });

  it("copies images into the root without moving the originals", async () => {
    await selectSourceImages();
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "__none__" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy To Folder" }));
    await waitFor(() => expect(api.addAssetsBulk).toHaveBeenCalledWith(selectedUrls, undefined));
    expect(api.moveAssetsToFolder).not.toHaveBeenCalled();
  });

  it("copies into a portfolio while keeping the source assets", async () => {
    await selectSourceImages();
    fireEvent.change(screen.getAllByRole("combobox")[2], { target: { value: "portfolio" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy To Portfolio" }));
    await waitFor(() => expect(api.addImagesToPortfolioBulk).toHaveBeenCalledWith("portfolio", selectedUrls));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Copied 2 images to portfolio"));
    expect(screen.getAllByAltText("")).toHaveLength(2);
    expect(api.moveAssetsToFolder).not.toHaveBeenCalled();
    expect(api.addAssetsBulk).not.toHaveBeenCalled();
  });

  it("keeps the originals and selection when copying fails", async () => {
    vi.mocked(api.addAssetsBulk).mockResolvedValue({ error: "Copy failed" });
    await selectSourceImages();
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "destination" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy To Folder" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Copy failed"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getAllByAltText("")).toHaveLength(2);
    expect(api.moveAssetsToFolder).not.toHaveBeenCalled();
  });
});