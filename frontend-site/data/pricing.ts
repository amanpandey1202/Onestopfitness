export type Plan = {
  id: string;
  name: string;
  short: string;
  price: number;
  priceNote: string;
  tag?: string;
  featured?: boolean;
  features: string[];
  message: string;
};

export const pricingPlans: Plan[] = [
  {
    id: "weight-training",
    name: "Weight Training",
    short: "Strength & muscle building",
    price: 1000,
    priceNote: "per month",
    features: [
      "Full gym floor access",
      "Strength & muscle building",
      "State-of-the-art equipment",
      "Expert trainer guidance",
    ],
    message:
      "Hi ONE STOP FITNESS, I'm interested in the Weight Training plan (₹1000/month). Please share the details.",
  },
  {
    id: "cardio",
    name: "Cardio",
    short: "Fat loss & stamina",
    price: 1500,
    priceNote: "per month",
    tag: "Most Popular",
    featured: true,
    features: [
      "Treadmills, cycles & more",
      "Fat loss & stamina building",
      "Zumba · Spinning · Aerobics",
      "Guided group sessions",
    ],
    message:
      "Hi ONE STOP FITNESS, I'm interested in the Cardio plan (₹1500/month). Please share the details.",
  },
  {
    id: "martial-arts",
    name: "Martial Arts",
    short: "Self-defence & discipline",
    price: 1200,
    priceNote: "per month",
    features: [
      "Self-defence training",
      "Fitness through discipline",
      "All skill levels welcome",
      "Certified coaches",
    ],
    message:
      "Hi ONE STOP FITNESS, I'm interested in the Martial Arts plan (₹1200/month). Please share the details.",
  },
  {
    id: "personal-training",
    name: "Personal Training",
    short: "1-on-1 expert coaching",
    price: 2000,
    priceNote: "per month",
    features: [
      "One-on-one expert coaching",
      "Custom diet & nutrition plan",
      "Weight loss / weight gain",
      "PCOD, thyroid & back pain care",
    ],
    message:
      "Hi ONE STOP FITNESS, I'm interested in Personal Training (₹2000/month). Please share the details.",
  },
  {
    id: "combo",
    name: "Combo Plan",
    short: "Cardio + Weight Training",
    price: 2200,
    priceNote: "per month · save ₹300",
    tag: "Best Value",
    features: [
      "Everything in Cardio",
      "Everything in Weight Training",
      "Full gym floor + group classes",
      "Save ₹300 every month",
    ],
    message:
      "Hi ONE STOP FITNESS, I'm interested in the Combo Plan (Cardio + Weight, ₹2200/month). Please share the details.",
  },
];
