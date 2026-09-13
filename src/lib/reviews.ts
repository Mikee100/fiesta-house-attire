export interface RealReview {
  id: string;
  author: string;
  authorSubtitle: string;
  date: string;
  category: "all" | "stylist" | "makeup" | "photographer" | "family" | "first-time";
  rating: number;
  highlightTag: string;
  staffMentioned?: string;
  quote: string;
}

// Single source of truth for client reviews — used by the Reviews page and the floating widget.
export const REAL_REVIEWS: RealReview[] = [
  {
    id: "1",
    author: "Lydia Opiyo",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Baby Girl Treatment",
    staffMentioned: "Faith, Indiana, Beverly & Amazing",
    quote:
      "I received baby girl treatment, felt like I was outside Kenya for a minute, in those countries where Expectant mothers are valued and cherished. Staff are amazing, from Faith, to Indiana to Beverly to Amazing the talented photographer. I'm a happy Client! I will definitely recommend any day. ❤️❤️❤️"
  },
  {
    id: "2",
    author: "Hellen Okochil",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "makeup",
    rating: 5,
    highlightTag: "Exceptional Artistry",
    staffMentioned: "Indiana (MUA), Beverly (Stylist) & Amazing",
    quote:
      "Very helpful staff. Indiana the make up artist was exceptional! Beverly my stylist was incredible! And words cannot describe Amazing the photographer… she was just as her name describes. Am blessed!"
  },
  {
    id: "3",
    author: "Agarther Gichaga",
    authorSubtitle: "First-Time Mom • Google Review",
    date: "3 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Women-Only Led Enterprise",
    quote:
      "As a first time mom to be, I quite enjoyed my experience with Fiesta House Maternity. And the fact that it is a women-only-led enterprise elevated the experience. For mom's looking for a shoot service, I 100% recommend Fiesta - they won't fail you ⭐️"
  },
  {
    id: "4",
    author: "Rose Muthoni",
    authorSubtitle: "Return Client (4th Shoot) • 6 Photos",
    date: "6 months ago",
    category: "photographer",
    rating: 5,
    highlightTag: "4th Photoshoot with Fiesta",
    quote:
      "Its my fourth photoshoot with them and they always deliver. The attentiveness, keeness to detail and vibes are next to none. The photos always shock me because they are sooooo beautiful. I would recommend them over and over again."
  },
  {
    id: "5",
    author: "Alvin Gachie",
    authorSubtitle: "Local Guide • 22 Reviews",
    date: "10 months ago",
    category: "family",
    rating: 5,
    highlightTag: "Couple Maternity Shoot",
    quote:
      "It was a great experience having our maternity shoot done by Fiesta House Maternity. The team is well organized, from front office to makeup artists, stylists, photographer and team. A special pause and reflection moment to celebrate the journey, and marking a moment before welcoming a newborn. Definitely recommended!"
  },
  {
    id: "6",
    author: "Josephine Njoki",
    authorSubtitle: "Traveled from Mombasa to Nairobi",
    date: "1 month ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Traveled from Mombasa",
    quote:
      "Coming all the way from Mombasa to Nairobi for a photoshoot sounds crazy, right 😄 but having my shoot here in fiesta house maternity is a dream come true... as soon as I entered the front desk was very welcoming and loving, the makeup and photos were beyond perfection."
  },
  {
    id: "7",
    author: "Fridah Nzelu",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "photographer",
    rating: 5,
    highlightTag: "Comfort & Posing Guidance",
    quote:
      "Had such an amazing photoshoot experience. From the warm welcome to the guidance during the session, make up artist top notch everything was perfect. The photographer made me feel beautiful, confident, and comfortable throughout."
  },
  {
    id: "8",
    author: "Njuka Njenga",
    authorSubtitle: "Verified Google Review",
    date: "3 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "10/10 Care & Passion",
    quote:
      "Enjoyed every bit of the photoshoot. From the reception, to the makeup artist, the stylist. All were so professional and treated me with such care. The passion for what they do was evident. The photos did not disappoint either 10/10. Give them all your money!"
  },
  {
    id: "9",
    author: "Brigitte Moraa",
    authorSubtitle: "Family & Toddler Session",
    date: "1 month ago",
    category: "family",
    rating: 5,
    highlightTag: "Patient with Toddlers",
    quote:
      "I absolutely loved the experience and the staff and how supportive and attentive they were during the entire process especially being patient with a toddler. P.S The photos also turned out amazing <3"
  },
  {
    id: "10",
    author: "Rose Oyugi",
    authorSubtitle: "Local Guide • 21 Reviews",
    date: "3 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Empowering Reluctant Moms",
    quote:
      "This was nothing like what I expected, it was exceptional. I was such a last minute dot com person, was feeling vulnerable and didn't want to make a maternity shoot. After much convincing from friends, I agreed to do it and I have to say it was the best experience for me. 100% recommend."
  },
  {
    id: "11",
    author: "Carol Mwai",
    authorSubtitle: "Local Guide • 6 Reviews",
    date: "5 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Styling & Design Prowess",
    staffMentioned: "Faith, Beverly, Wanjiku & Amazing",
    quote:
      "We loved the kind welcome by Faith, the professionalism and design prowess by Beverly, the wonderful job by Wanjiku and the photography skills showcased by Amazing. We are definitely coming back for another shoot."
  },
  {
    id: "12",
    author: "Carren Bellion",
    authorSubtitle: "Returning Client • 2nd Shoot",
    date: "2 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Stunning Attires & Backdrops",
    quote:
      "My second time being here, and the experience is still the best! Amazing customer service, beautiful photo backgrounds, and stunning attires. Fiesta truly knows how to make every moment special. I would highly recommend them any day. ❤️"
  },
  {
    id: "13",
    author: "Njeri Agalla",
    authorSubtitle: "Family Session • Verified Review",
    date: "6 months ago",
    category: "family",
    rating: 5,
    highlightTag: "Husband & Son Included",
    quote:
      "The Customer service was so good from the reception to the makeup artist to the stylists to the photographer... everybody was so kind and patient with us (me, my husband and our son) who was all over the place... he was even fed! The care and patience made the day stress-free."
  },
  {
    id: "14",
    author: "Phyllis Gichuki",
    authorSubtitle: "Verified Google Review",
    date: "7 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "All-Women Staff Coordination",
    quote:
      "Excellent service... amazing that it's all women staff who understand and coordinate so well with expectant women. I love it. Highly recommend."
  },
  {
    id: "15",
    author: "Mercy Masila",
    authorSubtitle: "Verified Google Review",
    date: "4 months ago",
    category: "makeup",
    rating: 5,
    highlightTag: "All Outfits & Makeup Included",
    quote:
      "Had such a great experience during the shoot. I got all the outfits and makeup and this gave me total peace of mind. The photographer was amazing as well."
  },
  {
    id: "16",
    author: "Faith Migwi",
    authorSubtitle: "Verified Google Review",
    date: "10 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Premium Costume Wardrobe",
    quote:
      "Very warm and well coordinated staff that help you in changing into the costumes and also posing. Customer service is premium and they have a variety of backgrounds and outfits to pick from. Their images are of high quality and very affordable. Will definitely be back and bring a friend!!"
  }
];
