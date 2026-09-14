export type Faq = {
  question: string;
  answer: string;
};
import { site } from "@/data/site";

export const faqs: Faq[] = [
  {
    question: site.faqLocationQuestion,
    answer: site.faqLocationAnswer,
  },
  {
    question: "What are your timings?",
    answer:
      "We're open Monday to Saturday, from 6:00 AM to 10:00 PM.",
  },
  {
    question: "How much does the membership cost?",
    answer:
      "Prices vary based on the program (Cardio, Weight Training, Martial Arts, etc.) and duration. Tap 'Ask Price on WhatsApp' and we'll confirm the latest offers and plans for you.",
  },
  {
    question: "Do you offer personal training?",
    answer:
      "Yes. Our one-on-one training covers weight loss, weight gain, PCOD, back pain, hormonal balance, thyroid issues and cervical spondylitis — with a custom diet plan.",
  },
  {
    question: "Do you teach martial arts?",
    answer:
      "Yes! Martial Arts classes build self-defence, discipline and fitness — open to all skill levels.",
  },
  {
    question: "Can women join?",
    answer:
      "Absolutely. We welcome everyone and have members training across all our programs.",
  },
  {
    question: "Is there a trial session?",
    answer:
      "Yes — message us on WhatsApp and we'll set up a trial visit so you can experience the gym first.",
  },
];
