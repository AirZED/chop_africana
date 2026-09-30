export const restaurant = {
  name: "Chop Africana",
  emoji: "🥧",
  address: "24 High Street, London E1 6AB",
  hours: "Mon–Fri 11am–10pm · Sat–Sun 12pm–11pm",
  pickupMinutes: 20,
};

export const menuCategories = ["Mains", "Soups & Sides", "Grills", "Drinks", "Desserts"] as const;

export const categoryMeta: Record<(typeof menuCategories)[number], { icon: string; gradient: string }> = {
  Mains: { icon: "🍽️", gradient: "from-orange-400 to-red-600" },
  "Soups & Sides": { icon: "🥗", gradient: "from-amber-300 to-yellow-600" },
  Grills: { icon: "🔥", gradient: "from-red-400 to-orange-700" },
  Drinks: { icon: "🥤", gradient: "from-sky-400 to-blue-600" },
  Desserts: { icon: "🍰", gradient: "from-pink-300 to-rose-500" },
};
