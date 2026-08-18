import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeDollarSign, Check, Clock3, Image as ImageIcon, Shirt } from "lucide-react";
import * as api from "@/lib/api";
import type { ShopPackage } from "@/lib/api";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusPill from "@/components/admin/AdminStatusPill";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formatKes = (value: number) => {
  return `Ksh ${new Intl.NumberFormat("en-KE").format(value)}`;
};

const AdminPricing = () => {
  const [packages, setPackages] = useState<ShopPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editImagesCount, setEditImagesCount] = useState("");
  const [editOutfitsCount, setEditOutfitsCount] = useState("");
  const [editFeatures, setEditFeatures] = useState("");

  const totals = useMemo(() => {
    const active = packages.length;
    const popular = packages.filter((p) => Boolean(p.popular)).length;
    const averagePrice = active > 0 ? Math.round(packages.reduce((acc, p) => acc + Number(p.price || 0), 0) / active) : 0;
    return { active, popular, averagePrice };
  }, [packages]);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      try {
        const data = await api.fetchAdminShopPackages();
        setPackages(Array.isArray(data) ? data : []);
      } catch (error) {
        setPackages([]);
        toast.error("Failed to load pricing packages");
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const startEditing = (pkg: ShopPackage) => {
    setEditingId(pkg.id);
    setEditName(pkg.name || "");
    setEditDescription(pkg.description || "");
    setEditPrice(String(pkg.price ?? ""));
    setEditDuration(pkg.duration || "");
    setEditImagesCount(pkg.images_count || "");
    setEditOutfitsCount(pkg.outfits_count || "");
    setEditFeatures((pkg.features || []).join("\n"));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSavingId(null);
    setEditName("");
    setEditDescription("");
    setEditPrice("");
    setEditDuration("");
    setEditImagesCount("");
    setEditOutfitsCount("");
    setEditFeatures("");
  };

  const savePackage = async (pkg: ShopPackage) => {
    const normalizedPrice = Number(editPrice);
    if (!editName.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      toast.error("Please enter a valid non-negative price");
      return;
    }

    const features = editFeatures
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    setSavingId(pkg.id);
    try {
      const updated = await api.updateAdminShopPackage(pkg.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        price: Math.round(normalizedPrice),
        duration: editDuration.trim() || null,
        images_count: editImagesCount.trim() || null,
        outfits_count: editOutfitsCount.trim() || null,
        features
      });

      if (updated?.error) {
        toast.error(updated.error);
        return;
      }

      setPackages((prev) => prev.map((item) => (item.id === pkg.id ? { ...item, ...updated } : item)));
      toast.success(`${pkg.name} updated`);
      cancelEditing();
    } catch (error) {
      toast.error("Failed to update package");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <SEO title="Admin Pricing" noindex nofollow />
      <AdminPage
        title="Pricing Packages"
        description="View all active packages, rates, and included services."
        maxWidthClassName="max-w-7xl"
      >
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Active Packages</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totals.active}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Popular Picks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totals.popular}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Average Rate</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totals.averagePrice > 0 ? formatKes(totals.averagePrice) : "-"}</p>
          </div>
        </div>

        <AdminSection
          title="Package Catalog"
          description="All package names, prices, and included features from the live pricing source."
          actions={<AdminStatusPill label={`${packages.length} packages`} tone="neutral" />}
        >
          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No packages found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => (
                <article key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      {editingId === pkg.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white"
                            placeholder="Package name"
                          />
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="resize-y bg-white"
                            placeholder="Package description"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-2xl font-semibold text-slate-900">{pkg.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{pkg.description || "No description"}</p>
                        </>
                      )}
                    </div>
                    {pkg.popular && <AdminStatusPill label="Popular" tone="warning" />}
                  </div>

                  <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Price</p>
                    {editingId === pkg.id ? (
                      <Input
                        inputMode="numeric"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ""))}
                        className="mt-2 bg-white"
                        placeholder="Enter package price"
                      />
                    ) : (
                      <p className="mt-1 text-3xl font-bold text-slate-900">{formatKes(Number(pkg.price || 0))}</p>
                    )}
                  </div>

                  <ul className="mb-4 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {editingId === pkg.id ? (
                        <Input
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="h-8 bg-white"
                          placeholder="e.g. 1 hr 30 min"
                        />
                      ) : (
                        <span>{pkg.duration ? `${pkg.duration} session` : "-"}</span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      {editingId === pkg.id ? (
                        <Input
                          value={editImagesCount}
                          onChange={(e) => setEditImagesCount(e.target.value)}
                          className="h-8 bg-white"
                          placeholder="e.g. 6 edited soft copy images"
                        />
                      ) : (
                        <span>{pkg.images_count || "-"}</span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-slate-400" />
                      {editingId === pkg.id ? (
                        <Input
                          value={editOutfitsCount}
                          onChange={(e) => setEditOutfitsCount(e.target.value)}
                          className="h-8 bg-white"
                          placeholder="e.g. 2 gowns & styling"
                        />
                      ) : (
                        <span>{pkg.outfits_count || "-"}</span>
                      )}
                    </li>
                  </ul>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Included Features</p>
                    {editingId === pkg.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editFeatures}
                          onChange={(e) => setEditFeatures(e.target.value)}
                          rows={6}
                          className="resize-y bg-white"
                          placeholder="Enter one feature per line"
                        />
                        <p className="text-xs text-slate-500">Use one line per feature/service.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2 text-sm text-slate-700">
                        {(pkg.features || []).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                    {editingId === pkg.id ? (
                      <>
                        <Button
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          onClick={cancelEditing}
                          disabled={savingId === pkg.id}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-[var(--sky-blue)] text-white hover:bg-[#9A7F37] hover:text-white"
                          onClick={() => savePackage(pkg)}
                          disabled={savingId === pkg.id}
                        >
                          {savingId === pkg.id ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => startEditing(pkg)}
                      >
                        Edit Package
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminSection>
      </AdminPage>
    </>
  );
};

export default AdminPricing;
