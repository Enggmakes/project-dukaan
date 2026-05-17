export type Category =
  | "AI & Machine Learning" | "Deep Learning" | "Computer Vision" | "Robotics"
  | "IoT" | "Web Development" | "Mobile Apps" | "Blockchain" | "Cybersecurity";

export const CATEGORIES: Category[] = [
  "AI & Machine Learning", "Deep Learning", "Computer Vision", "Robotics",
  "IoT", "Web Development", "Mobile Apps", "Blockchain", "Cybersecurity",
];

export const CATEGORY_META: Record<Category, { icon: string; gradient: string; desc: string }> = {
  "AI & Machine Learning": { icon: "Brain", gradient: "from-indigo-400 to-purple-500", desc: "Predictive models, NLP & smart systems" },
  "Deep Learning":          { icon: "Network", gradient: "from-fuchsia-400 to-pink-500", desc: "Neural networks & transformer architectures" },
  "Computer Vision":        { icon: "Eye", gradient: "from-orange-400 to-rose-500", desc: "Image, video & real-time recognition" },
  "Robotics":               { icon: "Bot", gradient: "from-emerald-400 to-teal-500", desc: "Autonomous systems & embedded control" },
  "IoT":                    { icon: "Cpu", gradient: "from-amber-400 to-orange-500", desc: "Sensors, edge devices & telemetry" },
  "Web Development":        { icon: "Globe", gradient: "from-sky-400 to-indigo-500", desc: "Full-stack production-grade apps" },
  "Mobile Apps":            { icon: "Smartphone", gradient: "from-violet-400 to-indigo-500", desc: "Cross-platform iOS & Android" },
  "Blockchain":             { icon: "Link2", gradient: "from-yellow-400 to-amber-500", desc: "Smart contracts & DeFi protocols" },
  "Cybersecurity":          { icon: "Shield", gradient: "from-rose-400 to-red-500", desc: "Pen-testing, detection & defense" },
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
  thumb: string;
}

const grad = (a: string, b: string) =>
  `linear-gradient(135deg, ${a}, ${b})`;

const thumbs = [
  grad("#fef3c7", "#fbbf24"),
  grad("#e0e7ff", "#6366f1"),
  grad("#fce7f3", "#ec4899"),
  grad("#dcfce7", "#10b981"),
  grad("#fee2e2", "#ef4444"),
  grad("#ede9fe", "#8b5cf6"),
  grad("#dbeafe", "#3b82f6"),
  grad("#ffedd5", "#f97316"),
  grad("#cffafe", "#06b6d4"),
];

const titles: Array<[string, Category, string[], number]> = [
  ["Real-Time Face Recognition Attendance", "Computer Vision", ["Python", "OpenCV", "Flask", "PostgreSQL"], 4900],
  ["AI-Powered Resume Screener", "AI & Machine Learning", ["Python", "spaCy", "FastAPI", "React"], 3900],
  ["Smart Crop Disease Detector", "Deep Learning", ["TensorFlow", "Keras", "Streamlit"], 4500],
  ["Autonomous Line Follower Bot", "Robotics", ["Arduino", "C++", "IR Sensors"], 2900],
  ["IoT Home Automation Hub", "IoT", ["ESP32", "MQTT", "Node-RED"], 3500],
  ["E-Commerce SaaS Starter", "Web Development", ["Next.js", "Stripe", "Postgres"], 6900],
  ["Fitness Tracker Mobile App", "Mobile Apps", ["React Native", "Firebase"], 4200],
  ["NFT Marketplace dApp", "Blockchain", ["Solidity", "Hardhat", "Next.js"], 7900],
  ["Intrusion Detection System", "Cybersecurity", ["Python", "Scikit-learn", "Snort"], 5500],
  ["GPT-Powered Customer Support Bot", "AI & Machine Learning", ["LangChain", "OpenAI", "Next.js"], 6500],
  ["Lane Detection for Self-Driving", "Computer Vision", ["PyTorch", "OpenCV"], 5200],
  ["Voice-Controlled Smart Mirror", "IoT", ["Raspberry Pi", "Python", "Snowboy"], 4800],
];

export const PROJECTS: Project[] = titles.map(([title, category, tech, price], i) => ({
  id: `prj-${i + 1}`,
  title,
  short: `Production-ready ${category.toLowerCase()} project with full source code, documentation, and deployment guide.`,
  description: `A polished end-to-end ${category} solution engineered for real-world deployment. Includes complete source code, detailed architecture documentation, dataset, training pipeline and a step-by-step setup guide so you can ship in a weekend.`,
  category,
  difficulty: (["Beginner", "Intermediate", "Advanced"] as const)[i % 3],
  price,
  rating: 4.4 + ((i * 7) % 6) / 10,
  reviews: 24 + i * 11,
  tech,
  features: [
    "Clean, modular, well-commented source code",
    "Pre-trained models & sample datasets",
    "Step-by-step deployment instructions",
    "Architecture diagrams & flowcharts",
    "Free updates for 12 months",
    "Email support from the engineering team",
  ],
  includes: ["Source Code (.zip)", "Documentation (PDF)", "Dataset", "Demo Video", "Report Template (DOCX)"],
  thumb: thumbs[i % thumbs.length],
}));

export const TESTIMONIALS = [
  { name: "Ananya Sharma", role: "CS Final Year, IIT Delhi", quote: "Submitted my final-year project a month early. The code quality and docs are insanely good.", avatar: "AS" },
  { name: "Rohan Mehta", role: "ML Engineer, Zylo Labs", quote: "We forked the GPT support bot and shipped it to production in three days. Saved us weeks.", avatar: "RM" },
  { name: "Priya Iyer", role: "Robotics Lead, Bengaluru", quote: "ProjectDukaan is now our default starting point for IoT prototypes.", avatar: "PI" },
  { name: "Marco Rossi", role: "Indie Hacker", quote: "The Stripe-grade polish here is rare. Worth every rupee.", avatar: "MR" },
];

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
