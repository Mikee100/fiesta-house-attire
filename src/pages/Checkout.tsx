import React, { useState } from "react";
import Layout from "@/components/site/Layout";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  if (cart.length === 0) {
    navigate('/shop');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          items: cart,
          total_amount: cartTotal
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Order placed successfully!", {
          description: "Check your email for confirmation and payment instructions."
        });
        clearCart();
        // Redirect to a success page or home
        setLoading(false);
        navigate('/');
      } else {
        throw new Error(data.error || "Failed to place order");
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "An error occurred while processing your order.");
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Checkout | Fiesta House Attire"
      description="Securely complete your purchase of luxury photography packages."
    >
      <section className="section-padding" style={{ paddingTop: "12rem" }}>
        <div className="container">
          <Link to="/cart" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--dark)", fontWeight: "600", marginBottom: "3rem" }}>
            <ArrowLeft size={18} /> Back to Cart
          </Link>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 450px", gap: "5rem" }} className="fade-in">
            {/* Checkout Form */}
            <div>
              <h2 className="display" style={{ fontSize: "2.5rem", marginBottom: "2.5rem" }}>Customer Information</h2>
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", color: "var(--muted-foreground)" }}>Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    style={{ 
                      padding: "1.2rem", 
                      border: "2px solid var(--border)", 
                      borderRadius: "12px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div className="grid grid-2" style={{ gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", color: "var(--muted-foreground)" }}>Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="you@example.com"
                      style={{ 
                        padding: "1.2rem", 
                        border: "2px solid var(--border)", 
                        borderRadius: "12px",
                        fontSize: "1rem",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", color: "var(--muted-foreground)" }}>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="07XX XXX XXX"
                      style={{ 
                        padding: "1.2rem", 
                        border: "2px solid var(--border)", 
                        borderRadius: "12px",
                        fontSize: "1rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ 
                  marginTop: "1rem", 
                  padding: "2rem", 
                  backgroundColor: "var(--bg)", 
                  borderRadius: "20px",
                  display: "flex",
                  gap: "1.5rem"
                }}>
                  <div style={{ flexShrink: 0, color: "var(--magenta)" }}>
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "700", marginBottom: "0.4rem" }}>Payment Information</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", lineHeight: "1.5" }}>
                      To maintain a minimalistic and secure experience, we will send you M-Pesa payment instructions via email and phone immediately after you place your order.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn" 
                  style={{ 
                    marginTop: "1rem",
                    padding: "1.5rem", 
                    backgroundColor: "var(--dark)", 
                    color: "white", 
                    borderRadius: "100px",
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  <CreditCard size={20} />
                  {loading ? "Processing..." : "Pay & Place Order"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div style={{ position: "sticky", top: "120px", height: "fit-content" }}>
              <div style={{ 
                backgroundColor: "white", 
                padding: "3rem", 
                borderRadius: "32px",
                border: "1px solid var(--border)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
              }}>
                <h3 className="display" style={{ fontSize: "1.8rem", marginBottom: "2.5rem" }}>Summary</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <span style={{ fontWeight: "600" }}>{item.name}</span>
                        <span style={{ marginLeft: "0.5rem", opacity: 0.5 }}>x{item.quantity}</span>
                      </div>
                      <span style={{ fontWeight: "600" }}>Ksh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  
                  <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "0.5rem 0" }}></div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: "700" }}>
                    <span>Total Amount</span>
                    <span style={{ color: "var(--magenta)" }}>Ksh {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", lineHeight: "1.6" }}>
                  <p style={{ marginBottom: "1rem" }}>
                    <strong>Next Steps:</strong>
                  </p>
                  <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <li>Receive confirmation email</li>
                    <li>Follow payment instructions</li>
                    <li>Our team contacts you within 2 hours</li>
                    <li>Voucher/Booking is confirmed!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
