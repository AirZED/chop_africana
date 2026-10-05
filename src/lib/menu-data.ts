export const restaurant = {
  name: "Chop Africana",
  emoji: "🥧",
  address: "Unit 5, City Business Park, Marshwood Close, Canterbury, Kent CT1 1DX",
  hours: "Mon–Sun 12pm–9pm",
  pickupMinutes: 20,
};

export const menuCategories = [
  "Combo Deals",
  "Rice Dishes",
  "Other Dishes",
  "Protein",
  "Extras",
  "Nigerian Soups",
  "Pastries",
  "Soft Drinks",
  "Alcoholic Drinks",
] as const;

export const categoryMeta: Record<(typeof menuCategories)[number], { icon: string; gradient: string }> = {
  "Combo Deals": { icon: "🍱", gradient: "from-amber-400 to-orange-600" },
  "Rice Dishes": { icon: "🍚", gradient: "from-yellow-400 to-amber-600" },
  "Other Dishes": { icon: "🍲", gradient: "from-stone-400 to-stone-600" },
  Protein: { icon: "🍗", gradient: "from-red-500 to-rose-700" },
  Extras: { icon: "🍟", gradient: "from-lime-400 to-green-600" },
  "Nigerian Soups": { icon: "🥘", gradient: "from-orange-500 to-red-700" },
  Pastries: { icon: "🥐", gradient: "from-amber-300 to-orange-500" },
  "Soft Drinks": { icon: "🥤", gradient: "from-sky-400 to-cyan-600" },
  "Alcoholic Drinks": { icon: "🍺", gradient: "from-amber-500 to-yellow-700" },
};
