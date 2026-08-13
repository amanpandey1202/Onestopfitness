export type Service = {
  title: string;
  description: string;
  points: string[];
};

export const groupClasses: string[] = [
  "Aerobics",
  "Yoga",
  "Spinning",
  "Zumba",
  "Martial Arts",
];

export const personalTrainingAreas: string[] = [
  "Weight Gain",
  "Weight Loss",
  "PCOD",
  "Back Pain",
  "Hormonal Balance",
  "Thyroid Issues",
  "Cervical Spondylitis",
];

export const services: Service[] = [
  {
    title: "Group Classes",
    description:
      "High-energy classes led by certified coaches — fun, motivating and results-driven.",
    points: groupClasses,
  },
  {
    title: "Personal Training",
    description:
      "Tailored plans built around your body, your goals and your health conditions.",
    points: personalTrainingAreas,
  },
  {
    title: "Martial Arts",
    description:
      "Build discipline, confidence and self-defence skills while you get fit.",
    points: ["Self-defence", "Discipline & focus", "All skill levels"],
  },
  {
    title: "Outdoor Sessions",
    description:
      "Fresh-air workouts and outdoor training that keep things exciting.",
    points: ["Open-air workouts", "Group motivation"],
  },
  {
    title: "Nutrition & Wellness",
    description:
      "Nutritional guidance and wellness programs that go beyond the gym floor.",
    points: ["Personalised diet plans", "Wellness programs"],
  },
  {
    title: "High-Tech Equipment",
    description:
      "State-of-the-art machines for every goal — from beginner to advanced.",
    points: ["Cardio zone", "Strength zone", "Free weights"],
  },
];
