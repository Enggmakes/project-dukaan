import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Search, 
  Sparkles, 
  Star, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  Brain, 
  Network, 
  Eye, 
  Bot, 
  Cpu, 
  Globe, 
  Smartphone, 
  Link2, 
  Shield, 
  TrendingUp, 
  Users, 
  Activity,
  CheckCircle2,
  FileCode2,
  FileText,
  Truck,
  ArrowUpRight,
  Code2,
  Terminal,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useRef, Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import ProjectCard from "@/components/ProjectCard";
import MeshGradient from "@/components/MeshGradient";
import { CATEGORIES, CATEGORY_META, FAQS, Project } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div className="p-20 text-red-500 font-mono text-xl">CRASH: {(this.state.error as Error).message} <br/><br/> {(this.state.error as Error).stack}</div>;
    return this.props.children;
  }
}

const ICONS = { Brain, Network, Eye, Bot, Cpu, Globe, Smartphone, Link2, Shield } as const;

export default function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [liveStats, setLiveStats] = useState<{
    projects: number | null;
    orders: number | null;
    avgRating: number | null;
  }>({ projects: null, orders: null, avgRating: null });

  // Global Cmd+K / Ctrl+K listener for instant search spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      setProjects((data || []) as Project[]);
    });

    // Real project count
    supabase.from('projects').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setLiveStats(prev => ({ ...prev, projects: count ?? 0 }));
    });

    // Real orders count (students served)
    supabase.from('orders').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setLiveStats(prev => ({ ...prev, orders: count ?? 0 }));
    });

    // Real average rating from projects table
    supabase.from('projects').select('rating').then(({ data }) => {
      if (data && data.length > 0) {
        const ratings = data.map((p: any) => Number(p.rating)).filter((r: number) => !isNaN(r) && r > 0);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
          setLiveStats(prev => ({ ...prev, avgRating: Math.round(avg * 10) / 10 }));
        }
      }
    });
  }, []);

  const filteredProjects = selectedDomain === "all" 
    ? projects 
    : projects.filter(p => p.category.toLowerCase().includes(selectedDomain.toLowerCase()));

  // Featured flagship project for the Bento Hero Showcase
  const flagship = projects[0] || {
    id: "flagship-demo",
    title: "Autonomous Drone Swarm Navigation w/ YOLOv11 & ROS 2",
    category: "Robotics & AI",
    difficulty: "Advanced",
    short: "Decentralized obstacle avoidance and target tracking across heterogeneous quadcopters with full Gazebo simulation and flight test logs.",
    price: 3499,
    price_note: "Source Code + 62p IEEE Report",
    thumb: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
    tech: ["ROS 2", "PyTorch", "YOLOv11", "Gazebo", "Python 3.11"]
  };

  return (
    <ErrorBoundary>
    <Layout>
      <Helmet>
        <title>ProjectDukaan — Build Faster. Ship Real Projects.</title>
        <meta name="description" content="Premium marketplace for AI, ML, IoT, robotics & final-year engineering projects. Production-ready blueprints with verified source code, architecture diagrams, and IEEE thesis documentation." />
        <meta name="keywords" content="AI projects, ML projects, IoT projects, robotics projects, engineering capstone, computer science project download, ProjectDukaan" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/" />
      </Helmet>

      {/* FULL BLEED HERO CANVAS */}
      <section className="relative overflow-hidden -mt-24 pt-32 pb-16 md:pb-24 bleed-container">
        <MeshGradient className="absolute inset-0 opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white pointer-events-none" />
        
        {/* Subtle Ambient Radial Glows (Desktop Only) */}
        <div className="hidden md:block absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-sky-400/15 blur-[80px] pointer-events-none" />

        <div className="relative container-px max-w-7xl mx-auto">
          {/* Hero Header & Value Proposition */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Live Trust Banner Pill */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-xs backdrop-blur-md mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-slate-800 tracking-tight">
                500+ Verified Blueprints • Instant Download • IEEE Thesis Docs
              </span>
            </motion.div>

            {/* Editorial Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-[84px] text-slate-900 font-black tracking-[-0.035em] leading-[1.05]"
            >
              Engineering projects, <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                built to ship.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Production-ready AI models, embedded IoT builds, and custom engineering blueprints — complete with verified source code, architecture diagrams, and defense-ready documentation.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >
              <Link to="/marketplace">
                <Button size="lg" className="rounded-full bg-slate-950 hover:bg-slate-800 text-white px-8 h-12 text-sm font-semibold shadow-md active:scale-98 transition-all">
                  Explore Blueprints <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/custom-request">
                <Button size="lg" variant="outline" className="bento-pill text-slate-800 rounded-full px-7 h-12 text-sm font-semibold active:scale-98 transition-all hover:bg-white shadow-xs">
                  Request Custom Build
                  <span className="ml-2 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">7-Day</span>
                </Button>
              </Link>
            </motion.div>

            {/* Search Spotlight Bar with Cmd+K */}
            <motion.form 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: 0.35 }}
              onSubmit={(e) => { e.preventDefault(); navigate(`/marketplace?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`); }}
              className="mt-9 max-w-2xl mx-auto bg-white/95 backdrop-blur-xl rounded-full p-2 flex items-center gap-2 shadow-xl border border-slate-200/90 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all"
            >
              <Search className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
              <Input
                ref={searchInputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search projects (e.g. YOLO, Drone, ESP32, Blockchain)..."
                className="border-0 bg-transparent focus-visible:ring-0 text-slate-900 flex-1 placeholder:text-slate-400 text-sm h-10"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200/80 shrink-0 select-none">
                ⌘K
              </kbd>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-36 sm:w-40 rounded-full border-0 bg-slate-100/90 text-xs font-semibold shrink-0 text-slate-700 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 h-10 text-xs font-semibold shadow-sm active:scale-95 transition-all">
                Search
              </Button>
            </motion.form>
          </div>

          {/* ========================================================================= */}
          {/* THE HERO BENTO SHOWCASE (Grubbe + Mondly Hybrid Centerpiece)               */}
          {/* ========================================================================= */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-14 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* Bento Tile 1: Flagship Project Showcase (7 Columns) */}
            <div className="lg:col-span-7 bento-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Flagship Blueprint
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 (128 reviews)
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {flagship.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                  {flagship.short}
                </p>

                {/* Tech chips */}
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  {(flagship.tech || ["ROS 2", "PyTorch", "Gazebo", "Python 3.11"]).map((t) => (
                    <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual preview strip & Action */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-600 shrink-0">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Verified Codebase + IEEE Paper</div>
                    <div className="text-xs text-slate-500">Includes dataset, diagrams & presentation deck</div>
                  </div>
                </div>

                <Link to={flagship.id === "flagship-demo" ? "/marketplace" : `/project/${flagship.id}`}>
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 h-10 shadow-sm shrink-0">
                    Inspect Blueprint <ArrowUpRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bento Tile 2: Live Realtime Metrics (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Live Metric Stats Card */}
              <div className="bento-card p-6 bg-white flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Network Metrics
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Live Sandbox
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-2 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {liveStats.projects === null ? "50+" : `${liveStats.projects}+`}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Projects</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {liveStats.orders === null ? "240+" : `${liveStats.orders}+`}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Orders</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {liveStats.avgRating === null ? "4.9★" : `${liveStats.avgRating}★`}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Avg Rating</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> 100% Compiles on First Run
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">v2.6.4</span>
                </div>
              </div>

              {/* Bento Tile 3: Dark Custom Studio Fast-Lane */}
              <div className="bento-card-dark p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/25 transition-all" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full">
                      Custom Studio
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Bespoke Capstones</span>
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight mt-1">
                    Need a custom engineering build?
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Our team scopes, builds, tests, and documents custom hardware & software architectures in 7 days.
                  </p>
                </div>

                <Link to="/custom-request" className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  <span>Submit Custom Specs</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DOMAIN CATEGORIES BENTO GRID ("Pick Your Stack")                           */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bleed-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Browse by Domain</div>
              <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-slate-900 font-bold mt-1">
                Pick your engineering stack
              </h2>
            </div>
            <Link to="/marketplace" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all 100+ projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((c, i) => {
              const meta = CATEGORY_META[c];
              const Icon = ICONS[meta.icon as keyof typeof ICONS] || Brain;
              return (
                <motion.div 
                  key={c} 
                  initial={{ opacity: 0, y: 15 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: i * 0.04 }}
                >
                  <Link 
                    to={`/marketplace?cat=${encodeURIComponent(c)}`} 
                    className="group block bento-card rounded-[2rem] p-6 relative overflow-hidden h-full bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} grid place-items-center text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80">
                          {c.split(" ")[0]}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 mt-5 text-lg group-hover:text-indigo-600 transition-colors">
                        {c}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        {meta.desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                      <span>Explore Blueprints</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURED MARKETPLACE BLUEPRINTS (With Quick Domain Filters)                */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bg-slate-50/60 border-y border-slate-200/60 bleed-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Hand-Crafted & Tested</div>
              <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-slate-900 font-bold mt-1">
                Featured Blueprints
              </h2>
            </div>

            {/* Domain Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "All Projects" },
                { id: "AI", label: "AI & ML" },
                { id: "IoT", label: "IoT & Hardware" },
                { id: "Vision", label: "Computer Vision" },
                { id: "Web", label: "Fullstack" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedDomain(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedDomain === f.id
                      ? "bg-slate-950 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.slice(0, 6).map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/marketplace">
              <Button size="lg" className="rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200/90 shadow-sm px-8 h-12 text-sm transition-all hover:scale-105 active:scale-95">
                Browse Complete Marketplace ({liveStats.projects || 100}+ Projects) <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* "WHY PROJECTDUKAAN" - 4-CARD ASYMMETRICAL BENTO MATRIX                     */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-24 bleed-container">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">The Engineering Standard</div>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-slate-900 font-bold mt-1">
              Why engineers choose ProjectDukaan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Unlike generic GitHub scrapers or low-quality project vendors, every blueprint is curated, compiled, and guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Card 1: 100% Tested & Sandboxed Code (7 cols) */}
            <div className="md:col-span-7 bento-card p-7 sm:p-9 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-600 mb-5">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  100% Tested & Verified Repositories
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Every project is executed in a dedicated staging sandbox with clean virtual environments before listing. No broken imports, no deprecation errors, and no missing dataset links.
                </p>
              </div>
              <div className="mt-6 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between">
                <span>$ git clone &amp;&amp; pip install -r requirements.txt</span>
                <span className="text-emerald-400 font-bold">✔ Build Passed</span>
              </div>
            </div>

            {/* Card 2: Complete IEEE Papers & Presentation Decks (5 cols) */}
            <div className="md:col-span-5 bento-card p-7 sm:p-9 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 grid place-items-center text-violet-600 mb-5">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Defense-Ready Documentation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Includes complete IEEE format project reports, UML architecture diagrams, circuit schematics, and PPT presentation slides.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready for university viva review</span>
              </div>
            </div>

            {/* Card 3: Tracked Hardware Kit Delivery (5 cols) */}
            <div className="md:col-span-5 bento-card p-7 sm:p-9 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 grid place-items-center text-amber-600 mb-5">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Physical Hardware Shipped
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  For IoT and robotics capstones: pre-soldered components, microcontrollers, and wiring harnesses delivered to your doorstep with live tracking.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Courier tracking in 48 hours</span>
              </div>
            </div>

            {/* Card 4: 7-Day Guarantee & WhatsApp Engineer Support (7 cols) */}
            <div className="md:col-span-7 bento-card p-7 sm:p-9 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-600 mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  7-Day Money-Back Guarantee + Engineer Support
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  If your project fails to compile or differs from the specifications, our senior engineers assist you directly over WhatsApp or Discord, or you receive a full refund.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero-risk guarantee on every purchase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ SECTION                                                               */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bleed-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Answers</div>
            <h2 className="text-display text-3xl sm:text-4xl text-slate-900 font-bold mt-1">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="bento-card bg-white p-6 sm:p-8">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-100 last:border-0">
                <AccordionTrigger className="text-slate-900 font-bold text-sm sm:text-base text-left hover:text-indigo-600 transition-colors">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FULL BLEED CUSTOM STUDIO CTA (Dark Glass)                                 */}
      {/* ========================================================================= */}
      <section className="container-px py-16 pb-24 bleed-container">
        <div className="max-w-6xl mx-auto bento-card-dark p-8 sm:p-12 md:p-16 text-center relative overflow-hidden group">
          <MeshGradient className="absolute inset-0 opacity-20" />
          
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-indigo-500/25 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-36 -right-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/90 border border-indigo-800 px-3 py-1 rounded-full">
              Custom Engineering Studio
            </span>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-white font-bold mt-4 leading-tight">
              Can't find your exact project topic?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3.5 leading-relaxed">
              Tell our engineers what you need. We design the architecture, write the code, and compile the report — delivered within 7 days.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/custom-request">
                <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-12 text-sm shadow-md transition-all active:scale-95">
                  Request Custom Blueprint <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/60 font-semibold px-6 h-12 text-sm">
                  Talk to an Engineer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
    </ErrorBoundary>
  );
}
