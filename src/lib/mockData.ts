export type Category =
  | "AI & Machine Learning" | "Deep Learning" | "Computer Vision" | "Robotics"
  | "IoT" | "Web Development" | "Mobile Apps" | "Blockchain" | "Cybersecurity";

export const CATEGORIES: Category[] = [
  "AI & Machine Learning", "Deep Learning", "Computer Vision", "Robotics",
  "IoT", "Web Development", "Mobile Apps", "Blockchain", "Cybersecurity",
];

export const CATEGORY_META: Record<Category, { icon: string; gradient: string; desc: string }> = {
  "AI & Machine Learning": { icon: "Brain", gradient: "from-blue-600 to-cyan-600", desc: "Predictive models, NLP & smart systems" },
  "Deep Learning":          { icon: "Network", gradient: "from-slate-900 to-blue-600", desc: "Neural networks & transformer architectures" },
  "Computer Vision":        { icon: "Eye", gradient: "from-cyan-600 to-blue-600", desc: "Image, video & real-time recognition" },
  "Robotics":               { icon: "Bot", gradient: "from-emerald-500 to-teal-600", desc: "Autonomous systems & embedded control" },
  "IoT":                    { icon: "Cpu", gradient: "from-amber-500 to-orange-600", desc: "Sensors, edge devices & telemetry" },
  "Web Development":        { icon: "Globe", gradient: "from-sky-500 to-blue-600", desc: "Full-stack production-grade apps" },
  "Mobile Apps":            { icon: "Smartphone", gradient: "from-blue-600 to-slate-700", desc: "Cross-platform iOS & Android" },
  "Blockchain":             { icon: "Link2", gradient: "from-amber-500 to-emerald-600", desc: "Smart contracts & DeFi protocols" },
  "Cybersecurity":          { icon: "Shield", gradient: "from-rose-500 to-slate-800", desc: "Pen-testing, detection & defense" },
};

export interface Project {
  id: string;
  title: string;
  short: string;
  description: string;
  category: Category;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  rating: number;
  reviews: number;
  tech: string[];
  features?: string[];
  includes?: string[];
  screenshots?: string[];
  video_url?: string;
  github_url?: string;
  thumb: string;
  delivery_type?: "digital" | "physical";
  price_note?: string;
}

export const PROJECTS: Project[] = [];

export const STATS = [
  { label: "Projects shipped", value: "12,400+" },
  { label: "Students served", value: "38,000+" },
  { label: "Avg. rating", value: "4.9★" },
  { label: "Countries reached", value: "42" },
];

export const FAQS = [
  { q: "Do I get the full source code?", a: "Yes — every purchase ships with the complete, commented source code, datasets, and deployment guides." },
  { q: "Can I request customization?", a: "Absolutely. Use the Custom Project Request flow and our team will quote within 24 hours." },
  { q: "Is the code production-ready?", a: "Every project is reviewed by senior engineers and tested end-to-end before being listed." },
  { q: "Do you offer student discounts?", a: "Yes. Verified students get 30% off through the partner portal." },
  { q: "What about ongoing support?", a: "All projects include 12 months of email support and free patch updates." },
];
