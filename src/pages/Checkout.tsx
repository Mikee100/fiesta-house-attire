import React, { useState } from "react";
import Layout from "@/components/site/Layout";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import * as api from "@/lib/api";

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
    navigate('/pricing');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.createShopOrder({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        items: cart,
        total_amount: cartTotal
      });

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
    } catch (error: unknown) {
      console.error("Order error:", error);
      const message = error instanceof Error ? error.message : "An error occurred while processing your order.";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Checkout | Fiesta House Maternity"
      description="Securely complete your purchase of luxury photography packages."
      noindex
      nofollow
    >
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)" }}>
        <div className="container">
          <Link to="/cart" className="inline-flex items-center gap-2 text-[var(--dark)] font-bold mb-10 hover:gap-3 transition-all">
            <ArrowLeft size={18} /> Back to Cart
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-12 lg:gap-16 items-start fade-in">
            {/* Checkout Form */}
            <div className="mobile-center">
              <h2 className="display h1-mobile" style={{ fontSize: "3.5rem", marginBottom: "2.5rem" }}>Customer Information</h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)]">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full p-4 md:p-5 border-2 border-[var(--border)] rounded-[16px] text-lg outline-none focus:border-[var(--sky-blue)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)]">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="you@example.com"
                      className="w-full p-4 md:p-5 border-2 border-[var(--border)] rounded-[16px] text-lg outline-none focus:border-[var(--sky-blue)] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)]">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="07XX XXX XXX"
                      className="w-full p-4 md:p-5 border-2 border-[var(--border)] rounded-[16px] text-lg outline-none focus:border-[var(--sky-blue)] transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-4 p-8 bg-[var(--bg)] rounded-[24px] flex flex-col md:flex-row gap-6">
                  <div className="shrink-0 text-[var(--magenta)]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Payment Information</h4>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      To maintain a minimalistic and secure experience, we will send you M-Pesa payment instructions via email and phone immediately after you place your order.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`btn mt-4 p-6 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--dark)] text-white hover:bg-[var(--magenta)] shadow-xl shadow-black/10"
                  }`}
                >
                  <CreditCard size={20} />
                  {loading ? "Processing..." : "Pay & Place Order"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white p-8 md:p-12 rounded-[32px] border border-black/5 shadow-xl">
                <h3 className="display text-3xl mb-10">Summary</h3>
                
                <div className="flex flex-col gap-6 mb-10">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="max-w-[70%]">
                        <span className="font-bold">{item.name}</span>
                        <span className="ml-2 opacity-40">x{item.quantity}</span>
                      </div>
                      <span className="font-bold">Ksh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  
                  <div className="h-px bg-[var(--border)] my-2 opacity-50"></div>
                  
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount</span>
                    <span className="text-[var(--magenta)]">Ksh {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted-foreground)] leading-relaxed bg-[var(--bg)] p-6 rounded-[20px]">
                  <p className="font-bold mb-3 text-[var(--dark)]">
                    Next Steps:
                  </p>
                  <ul className="space-y-2 list-disc pl-4">
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
