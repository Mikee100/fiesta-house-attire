export const WHATSAPP_NUMBER = "254720111928";

export const whatsappLink = (
  message = "Hello Fiesta House Maternity, I'd like to book a maternity session."
) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const packages = [
  { name: "The Bloom", price: 15000, duration: "1.5 hours", images: 6, gowns: 2, extras: ["Professional makeup", "2 studio outfits + styling"] },
  { name: "The Muse", price: 25000, duration: "2 hours", images: 12, gowns: 3, extras: ["Professional makeup", "3 studio outfits + styling"] },
  { name: "The Icon", price: 35000, duration: "2.5 hours", images: 15, gowns: 4, extras: ["Professional makeup", "4 studio outfits + styling", "1 A3 fine art mount"] },
  { name: "The Legend", price: 45000, duration: "2.5 hours", images: 15, gowns: 4, extras: ["Professional makeup", "4 studio outfits + styling", "1 styled wig", "8x8 hardcover photobook"] },
  { name: "The Queen", price: 55000, duration: "3 hours", images: 20, gowns: 4, extras: ["Professional makeup", "4 studio outfits + styling", "Custom balloon backdrop with flowers", "1 styled wig", "1 A3 fine art mount"] },
  { name: "The Empress", price: 70000, duration: "3.5 hours", images: 25, gowns: 4, extras: ["Professional makeup", "Signature Fiesta House Power Suit", "2 styled wigs", "Custom balloon backdrop with flowers", "8x8 hardcover photobook", "1 A3 fine art mount"] },
  { name: "The Goddess", price: 120000, duration: "5 hours", images: 30, gowns: 5, extras: ["Professional makeup", "Signature Fiesta House Power Suit", "2 styled wigs", "Custom balloon backdrop with flowers OR Goddess Sculpture Set", "1 professionally produced Reel", "8x8 hardcover photobook", "1 A2 fine art mount"] },
] as const;

export type Package = (typeof packages)[number];

export const formatKsh = (n: number) => `Ksh ${n.toLocaleString("en-KE")}`;
