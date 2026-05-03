export const WHATSAPP_NUMBER = "254720111928";

export const whatsappLink = (
  message = "Hello Fiesta House Attire, I'd like to book a maternity session."
) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const packages = [
  { name: "Standard", price: 10000, duration: "1hr 30min", images: 6, gowns: 2, extras: ["Makeup"] },
  { name: "Economy", price: 15000, duration: "2hrs", images: 12, gowns: 3, extras: ["Makeup"] },
  { name: "Executive", price: 20000, duration: "2hrs 30min", images: 15, gowns: 4, extras: ["Makeup", "1 × A3 mount"] },
  { name: "Gold", price: 30000, duration: "2hrs 30min", images: 20, gowns: 4, extras: ["Makeup", "8×8\" hardpage photobook"] },
  { name: "Platinum", price: 35000, duration: "2hrs 30min", images: 25, gowns: 4, extras: ["Makeup", "A3 mount", "Customised balloon & floral backdrop"] },
  { name: "VIP", price: 45000, duration: "3hrs 30min", images: 25, gowns: 4, extras: ["Makeup", "Balloon backdrop", "Hardpage photobook"] },
  { name: "VVIP", price: 50000, duration: "3hrs 30min", images: 30, gowns: 5, extras: ["Makeup", "A3 mount", "Balloon backdrop", "Photobook", "Styled wig"] },
] as const;

export type Package = (typeof packages)[number];

export const formatKsh = (n: number) => `Ksh ${n.toLocaleString("en-KE")}`;
