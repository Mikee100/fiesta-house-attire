import React from "react";
import Layout from "@/components/site/Layout";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <Layout
      title="Your Cart | Fiesta House Attire"
      description="Review your selected photography packages and gift vouchers."
    >
      <section className="section-padding" style={{ paddingTop: "12rem", minHeight: "80vh" }}>
        <div className="container">
          <div style={{ marginBottom: "4rem" }} className="fade-in">
            <h1 className="display" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>Your Selection</h1>
            <div style={{ width: "80px", height: "4px", backgroundColor: "var(--magenta)", marginBottom: "2rem" }}></div>
          </div>

          {cart.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "6rem 2rem", 
              backgroundColor: "var(--bg)", 
              borderRadius: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem"
            }} className="fade-in">
              <div style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "50%", 
                backgroundColor: "white", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "var(--muted-foreground)"
              }}>
                <ShoppingBag size={40} />
              </div>
              <div>
                <h2 className="display" style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your cart is empty</h2>
                <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>It looks like you haven't added any packages to your cart yet.</p>
                <Link to="/shop" className="btn-primary" style={{ borderRadius: "100px" }}>
                  Browse Shop
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "4rem" }} className="fade-in">
              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr auto", 
                      alignItems: "center", 
                      padding: "2rem", 
                      backgroundColor: "white", 
                      borderRadius: "24px",
                      border: "1px solid rgba(0,0,0,0.05)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "1.4rem", fontWeight: "600", marginBottom: "0.5rem" }}>{item.name}</h3>
                      <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", maxWidth: "400px" }}>{item.description}</p>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "var(--bg)", padding: "0.5rem 1rem", borderRadius: "100px" }}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "var(--dark)" }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ fontWeight: "600", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "var(--dark)" }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div style={{ minWidth: "120px", textAlign: "right" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>Ksh {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#ff4d4f", padding: "0.5rem" }}
                        title="Remove item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <Link to="/shop" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--magenta)", fontWeight: "600", marginTop: "1rem" }}>
                  <ArrowLeft size={18} /> Continue Shopping
                </Link>
              </div>

              {/* Summary Side */}
              <div style={{ position: "sticky", top: "120px", height: "fit-content" }}>
                <div style={{ 
                  backgroundColor: "var(--dark)", 
                  color: "white", 
                  padding: "3rem 2.5rem", 
                  borderRadius: "32px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}>
                  <h3 className="display" style={{ fontSize: "1.8rem", marginBottom: "2rem" }}>Order Summary</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
                      <span>Subtotal</span>
                      <span>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
                      <span>Processing Fee</span>
                      <span>Ksh 0</span>
                    </div>
                    <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "0.5rem 0" }}></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "600" }}>
                      <span>Total</span>
                      <span>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/checkout" 
                    className="btn" 
                    style={{ 
                      width: "100%", 
                      backgroundColor: "var(--sky-blue)", 
                      color: "white", 
                      borderRadius: "100px",
                      padding: "1.2rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.8rem"
                    }}
                  >
                    Proceed to Checkout <ArrowRight size={20} />
                  </Link>
                  
                  <p style={{ marginTop: "2rem", fontSize: "0.8rem", textAlign: "center", opacity: 0.5, lineHeight: "1.5" }}>
                    Taxes and discounts will be calculated at checkout. By proceeding, you agree to our terms of service.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
