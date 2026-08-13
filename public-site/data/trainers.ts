export type Trainer = {
  name: string;
  role: string;
  bio: string;
  image: string;
  instagram?: string;
};

export const founder = {
  name: "Deepak",
  role: "Founder & Head Trainer",
  instagram: "@deepakindia",
  image: "/images/founder.svg",
  titles: [
    "MR LUCKNOW 2014",
    "MR UP 2025",
    "FIT FACTOR 2016",
    "JERAI FITNESS MODEL 2016",
    "MR REGION 2016",
  ],
  note: "“This gym is my life's work. Every member who walks in is family — I train you, guide you, and celebrate every win with you. Join us, and let's make you your best.”",
};

export const trainers: Trainer[] = [
  {
    name: "Aamir Rizvi",
    role: "Trainer",
    bio: "Dedicated coach helping members build strength and confidence with every single session.",
    image: "/images/trainer-1.svg",
  },
  {
    name: "Rajan Singh",
    role: "Trainer",
    bio: "Passionate about form, technique and pushing members past their limits — safely.",
    image: "/images/trainer-2.svg",
  },
  {
    name: "Deepak",
    role: "Founder & Head Trainer",
    bio: "Mr. Lucknow 2014 · Mr. UP 2025 · multiple fitness titles. The vision behind ONE STOP FITNESS.",
    image: "/images/founder.svg",
    instagram: "@deepakindia",
  },
];
