export const restaurant = {
  name: "Chop Africana",
  emoji: "🥧",
  address: "Unit 5, City Business Park, Marshwood Close, Canterbury, Kent CT1 1DX",
  hours: "Mon–Sun 12pm–9pm",
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
