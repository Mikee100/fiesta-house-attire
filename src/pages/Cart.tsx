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
      <section className="section-padding" style={{ paddingTop: "clamp(8rem, 15vw, 12rem)", minHeight: "80vh" }}>
        <div className="container">
          <div className="mb-12 fade-in mobile-center">
            <h1 className="display h1-mobile" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>Your Selection</h1>
            <div className="brand-divider-magenta" style={{ margin: "1.5rem auto 1.5rem 0" }}></div>
          </div>

          {cart.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "clamp(3rem, 10vw, 6rem) 1.5rem", 
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
                <h2 className="display h2-mobile" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Your cart is empty</h2>
                <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>It looks like you haven't added any packages to your cart yet.</p>
                <Link to="/shop" className="btn btn-primary" style={{ borderRadius: "100px" }}>
                  Browse Shop
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start fade-in">
              {/* Items List */}
              <div className="flex flex-col gap-6">
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center p-6 md:p-8 bg-white rounded-[24px] border border-black/5 shadow-sm"
                  >
                    <div className="mobile-center">
                      <h3 style={{ fontSize: "1.4rem", fontWeight: "600", marginBottom: "0.5rem" }}>{item.name}</h3>
                      <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", maxWidth: "400px" }}>{item.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 md:gap-12">
                      <div className="flex items-center gap-4 bg-[var(--bg)] px-4 py-2 rounded-full">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:text-[var(--magenta)] transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold min-w-[24px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:text-[var(--magenta)] transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xl font-bold">Ksh {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <Link to="/shop" className="flex items-center gap-2 text-[var(--magenta)] font-bold mt-4 hover:gap-3 transition-all">
                  <ArrowLeft size={18} /> Continue Shopping
                </Link>
              </div>

              {/* Summary Side */}
              <div className="lg:sticky lg:top-32 h-fit">
                <div className="bg-[var(--dark)] text-white p-8 md:p-12 rounded-[32px] shadow-xl">
                  <h3 className="display text-3xl mb-8">Order Summary</h3>
                  
                  <div className="flex flex-col gap-5 mb-10">
                    <div className="flex justify-between opacity-70">
                      <span>Subtotal</span>
                      <span>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between opacity-70">
                      <span>Processing Fee</span>
                      <span>Ksh 0</span>
                    </div>
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total</span>
                      <span>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/checkout" 
                    className="btn w-full bg-[var(--sky-blue)] text-white rounded-full py-5 font-bold flex items-center justify-center gap-3 hover:bg-[var(--magenta)] transition-all shadow-lg shadow-sky-blue/20"
                  >
                    Proceed to Checkout <ArrowRight size={20} />
                  </Link>
                  
                  <p className="mt-8 text-xs text-center opacity-40 leading-relaxed">
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
