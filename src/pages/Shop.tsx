import React, { useState, useEffect } from "react";
import Layout from "@/components/site/Layout";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check, Clock, Image, Shirt, Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import * as api from "@/lib/api";

const Shop = () => {
  const [packages, setPackages] = useState<api.ShopPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [packagesSource, setPackagesSource] = useState<api.ShopPackagesSource>('live');
  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const result = await api.fetchShopPackagesWithFallback();
        setPackages(Array.isArray(result.data) ? result.data : []);
        setPackagesSource(result.source);
      } catch (error) {
        console.error("Failed to fetch packages:", error);
        toast.error("Failed to load packages. Please try again later.");
        setPackagesSource('empty');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleAddToCart = (pkg: api.ShopPackage) => {
    addToCart(pkg);
    toast.success(`${pkg.name} added to cart!`, {
      description: "You can view your cart to proceed with the order.",
      action: {
        label: "View Cart",
        onClick: () => window.location.href = '/cart'
      }
    });
  };

  return (
    <Layout
      title="Shop & Gift Vouchers | Fiesta House Maternity"
      description="Purchase luxury maternity photography packages and gift vouchers. The perfect gift for expectant mothers in Nairobi."
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.fiestahousematernity.com/" },
            { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://www.fiestahousematernity.com/shop" }
          ]
        })}
      </script>
      {/* Hero Section */}
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)", backgroundColor: "white" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-8 mb-16 fade-in">
            <div style={{ maxWidth: "700px" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Gift of Timelessness</span>
              <h1 className="display h1-mobile" style={{ marginTop: "0.8rem", marginBottom: "1rem" }}>Packages & Vouchers</h1>
              <div style={{ width: "120px", height: "4px", backgroundColor: "var(--sky-blue)", marginBottom: "2rem" }}></div>
              <p style={{ fontSize: "1.1rem", color: "var(--muted-foreground)" }}>
                Select a photography package or gift voucher for yourself or a loved one. Each purchase is a commitment to capturing life's most precious moments with elegance and grace.
              </p>
            </div>
            
            <Link to="/cart" className="relative self-start md:self-auto px-8 py-4 bg-[var(--bg)] rounded-full flex items-center gap-3 border border-[var(--border)] transition-transform hover:scale-105">
              <ShoppingCart size={20} />
              <span style={{ fontWeight: "600" }}>Cart</span>
              {cartCount > 0 && (
                <span style={{ 
                  position: "absolute", 
                  top: "-5px", 
                  right: "-5px", 
                  backgroundColor: "var(--magenta)", 
                  color: "white", 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-[400px] bg-[var(--bg)] rounded-[24px] animate-pulse"></div>
               ))}
            </div>
          ) : (
            <>
              {packagesSource !== 'live' && (
                <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {packagesSource === 'cache'
                    ? 'Showing saved package data while connection is unavailable.'
                    : 'Showing fallback package data while live data is unavailable.'}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.isArray(packages) && packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  style={{ 
                    padding: "2.5rem 2rem", 
                    backgroundColor: pkg.popular ? "white" : "var(--bg)", 
                    borderRadius: "24px",
                    border: pkg.popular ? `2px solid ${pkg.color}` : "1px solid rgba(0,0,0,0.05)",
                    boxShadow: pkg.popular ? "0 20px 40px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {pkg.popular && (
                    <div style={{ 
                      position: "absolute", 
                      top: "24px", 
                      right: "24px", 
                      backgroundColor: pkg.color, 
                      color: "white", 
                      padding: "0.4rem 1.2rem", 
                      fontSize: "0.7rem", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.1em",
                      fontWeight: "700",
                      borderRadius: "100px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      <Star size={12} fill="white" /> Best Value
                    </div>
                  )}
                  
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 className="display" style={{ fontSize: "2.2rem", marginBottom: "0.8rem", color: "var(--dark)" }}>{pkg.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "1.2rem" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: "600", color: pkg.color }}>Ksh</span>
                      <span style={{ fontSize: "2.5rem", fontWeight: "300", color: "var(--dark)" }}>{pkg.price.toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)", lineHeight: "1.6" }}>{pkg.description}</p>
                  </div>

                  <div style={{ flexGrow: 1, marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {pkg.duration && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem" }}>
                          <Clock size={16} style={{ color: pkg.color }} />
                          <span>{pkg.duration} session</span>
                        </div>
                      )}
                      {pkg.images_count && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem" }}>
                          <Image size={16} style={{ color: pkg.color }} />
                          <span>{pkg.images_count}</span>
                        </div>
                      )}
                      {pkg.outfits_count && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem" }}>
                          <Shirt size={16} style={{ color: pkg.color }} />
                          <span>{pkg.outfits_count}</span>
                        </div>
                      )}
                    </div>

                    {pkg.features && pkg.features.length > 0 && (
                      <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                          {pkg.features.map((feature: string, j: number) => (
                            <li key={j} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                              <Check size={14} style={{ color: pkg.color }} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleAddToCart(pkg)}
                    className="btn" 
                    style={{ 
                      width: "100%", 
                      backgroundColor: pkg.popular ? pkg.color : "var(--dark)", 
                      color: "white",
                      borderRadius: "12px",
                      padding: "1.2rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.8rem"
                    }}
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Gift Voucher Info Section */}
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="mobile-center">
              <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", marginBottom: "2rem" }}>A Gift to Remember</h2>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--muted-foreground)", marginBottom: "2rem" }}>
                Our vouchers are more than just a piece of paper. They represent a promise of beauty, a moment of reflection, and a celebration of life's most precious transformations.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", textAlign: "left" }}>
                  <div style={{ flexShrink: 0, width: "40px", height: "40px", backgroundColor: "white", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--magenta)" }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.3rem" }}>Digital Delivery</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Instant voucher delivery to your email after purchase verification.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", textAlign: "left" }}>
                  <div style={{ flexShrink: 0, width: "40px", height: "40px", backgroundColor: "white", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sky-blue)" }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.3rem" }}>12 Month Validity</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Plenty of time for the expectant mother to schedule her session.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: "white", 
              padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 3rem)", 
              borderRadius: "30px", 
              boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
              textAlign: "center"
            }}>
              <h3 className="display h2-mobile" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>Custom Vouchers</h3>
              <p style={{ marginBottom: "2.5rem", color: "var(--muted-foreground)" }}>
                Need a specific value or a combination of services? We can create a personalized voucher just for you.
              </p>
              <a 
                href="https://wa.me/254720111928?text=Hi%20Fiesta%20House,%20I'd%20like%20to%20request%20a%20custom%20gift%20voucher." 
                className="btn btn-outline" 
                style={{ padding: "1rem 2.5rem", borderRadius: "100px", display: "inline-flex" }}
              >
                Chat via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
