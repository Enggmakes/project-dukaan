import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Brain, 
  Eye, 
  Bot, 
  Cpu, 
  Globe, 
  Link2, 
  Shield, 
  Activity,
  CheckCircle2,
  FileText,
  Truck,
  ArrowUpRight,
  Code2,
  Terminal,
  ChevronRight,
  X,
  FileCode,
  Layers,
  Database
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
    if (this.state.error) return <div className="p-20 text-red-500 font-mono text-xl">CRASH: {(this.state.error as Error).message}</div>;
    return this.props.children;
  }
}

const ICONS: Record<string, any> = {
  Brain, Eye, Bot, Cpu, Globe, Link2, Shield, Network: Database, Smartphone: Layers
};

const DEFAULT_FLAGSHIP: Project = {
  id: "e97ba455-53d6-4b68-8bb8-f073fe16b9e2",
  title: "FitPulse: On-Device AI Workout Form Coach & Rep Counter",
  short: "Production-ready project with full source code. Real-time smartphone pose estimation, automated repetition counting, and audio voice feedback.",
  description: "Impressive visual demo where examiners stand in front of the phone and get their exercise form scored with real-time on-device edge pose detection.",
  category: "Mobile Apps" as any,
  difficulty: "Advanced" as any,
  price: 24999,
  rating: 5.0,
  reviews: 0,
  tech: [
    "Flutter / React Native",
    "Google ML Kit (Pose Detection)",
    "SQLite",
    "Riverpod / Redux"
  ],
  thumb: "https://azymqiplcibfwmfbsxji.supabase.co/storage/v1/object/public/project-images/1791269854875-oj9irmuanid.jpg",
  delivery_type: "digital"
};

export default function Index() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [dbProjects, setDbProjects] = useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dukaan_cached_projects");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Failed to read cached projects:", e);
      }
    }
    return [DEFAULT_FLAGSHIP];
  });
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [liveStats, setLiveStats] = useState<{
    projects: number | null;
    orders: number | null;
    avgRating: number | null;
  }>({
    projects: null,
    orders: null,
    avgRating: null,
  });

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: Focus Search
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

  // Fetch verified projects & stats
  useEffect(() => {
    async function loadData() {
      try {
        const { data: projs } = await supabase
          .from("projects")
          .select("id, title, short, description, category, difficulty, price, rating, reviews, tech, features, includes, screenshots, video_url, thumb, delivery_type, price_note, created_at")
          .order("created_at", { ascending: false });

        if (projs && projs.length > 0) {
          const mapped: Project[] = projs.map(p => ({
            id: p.id,
            title: p.title,
            short: p.short || p.short_desc || (p.description ? p.description.substring(0, 100) + "..." : ""),
            description: p.description || "",
            category: p.category as any,
            difficulty: p.difficulty as any,
            price: p.price,
            rating: p.rating || 5.0,
            reviews: p.reviews_count || p.reviews || 0,
            tech: p.tech || p.tech_stack || [],
            thumb: p.thumb || p.thumbnail_url || DEFAULT_FLAGSHIP.thumb,
            delivery_type: p.delivery_type || "digital",
            price_note: p.price_note || ""
          }));
          setDbProjects(mapped);
          try {
            localStorage.setItem("dukaan_cached_projects", JSON.stringify(mapped));
          } catch (e) {
            console.warn("Failed to cache projects:", e);
          }
        }

        const { count: projCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
        const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
        setLiveStats({
          projects: projCount || 50,
          orders: orderCount ? orderCount + 240 : 265,
          avgRating: 4.9
        });
      } catch (err) {
        console.error("Index load error:", err);
      }
    }
    loadData();
  }, []);

  // Flagship project: strictly the latest project from database, cached store, or default flagship
  const flagship = dbProjects[0] || DEFAULT_FLAGSHIP;

  const filteredProjects = dbProjects.filter(p => {
    if (selectedDomain === "all") return true;
    if (selectedDomain === "AI") return p.category.includes("AI") || p.category.includes("Learning");
    if (selectedDomain === "IoT") return p.category.includes("IoT");
    if (selectedDomain === "Vision") return p.category.includes("Vision");
    if (selectedDomain === "Web") return p.category.includes("Web") || p.category.includes("Mobile");
    return true;
  });

  return (
    <ErrorBoundary>
    <Layout>
      <Helmet>
        <title>ProjectDukaan — Engineering Capstone Marketplace & Source Blueprints</title>
        <meta name="description" content="Verified marketplace for AI, ML, IoT, and Robotics engineering capstones. Complete source code, IEEE thesis documentation, and verified hardware schematics." />
        <link rel="canonical" href="https://projectdukaan.vercel.app/" />
      </Helmet>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Architectural Engineering Statement                     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pb-24 bg-[#070a12] border-b border-slate-800 text-white">
        <MeshGradient className="absolute inset-0 opacity-40" />
        
        <div className="relative container-px max-w-6xl mx-auto">
          {/* Hero Header & Value Proposition */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Live Trust Banner with Workstation Hardware Status */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 shadow-2xs mb-6 font-mono text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span className="font-semibold tracking-wide">
                SYS:\&gt; 100% COMPILES ON FIRST RUN • IEEE THESIS PAPERS INCLUDED
              </span>
            </div>

            {/* Editorial Headline with Retro Amber Accent */}
            <h1 className="text-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-black tracking-tight leading-[1.06]">
              Engineering capstones, <br />
              <span className="text-amber-400 amber-glow">
                built to ship.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Production-ready AI models, embedded IoT builds, and robotics systems — complete with verified source code, architecture diagrams, and defense-ready documentation.
            </p>

            {/* Tactile CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono">
              <Link to="/marketplace">
                <Button size="lg" className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 px-7 h-11 text-xs font-bold shadow-xs transition-all retro-btn">
                  [F1] Explore Blueprints <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/custom-request">
                <Button size="lg" variant="outline" className="rounded bg-[#0d121e] hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 h-11 text-xs font-bold shadow-2xs transition-all retro-btn">
                  [F2] Request Custom Build
                </Button>
              </Link>
            </div>

            {/* Retro Command Search Console */}
            <form 
              onSubmit={(e) => { e.preventDefault(); navigate(`/marketplace?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`); }}
              className="mt-8 max-w-2xl mx-auto bg-[#0d121e] rounded-lg p-1.5 flex items-center gap-2 shadow-sm border border-slate-700 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all font-mono"
            >
              <span className="text-amber-500 font-bold ml-2 text-xs select-none">SYS:\&gt;</span>
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                ref={searchInputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="SEARCH_QUERY (e.g. UNet3D, YOLO, ESP32, ROS 2)..."
                className="border-0 bg-transparent focus-visible:ring-0 text-white flex-1 placeholder:text-slate-500 text-xs sm:text-sm h-9 shadow-none font-mono"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800 rounded border border-slate-700 shrink-0 select-none">
                {typeof navigator !== "undefined" && navigator.platform?.toUpperCase().includes("MAC") ? "⌘K" : "Ctrl+K"}
              </kbd>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-32 sm:w-36 rounded border-0 bg-slate-800 text-xs font-mono font-medium shrink-0 text-slate-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 rounded shadow-xl font-mono text-xs text-white">
                  <SelectItem value="all">ALL_DOMAINS</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 sm:px-5 h-9 text-xs font-bold shadow-2xs transition-all retro-btn shrink-0">
                RUN ↵
              </Button>
            </form>

            {/* Popular quick tags with hotkey indices */}
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-slate-400 text-[11px]">HOTKEYS:</span>
              {[
                { tag: "Computer Vision", key: "1" },
                { tag: "IoT", key: "2" },
                { tag: "Robotics", key: "3" },
                { tag: "Deep Learning", key: "4" }
              ].map(({ tag, key }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setCat(tag);
                    navigate(`/marketplace?cat=${encodeURIComponent(tag)}`);
                  }}
                  className="px-2.5 py-0.5 rounded bg-[#0d121e] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 border border-slate-800 text-[11px] font-mono transition-colors shadow-2xs cursor-pointer retro-btn"
                >
                  <span className="text-amber-500 font-bold mr-1">[{key}]</span>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. THE ENGINEERING TERMINAL & BLUEPRINT INSPECTOR CENTERPIECE             */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* 2. VERIFIED CAPSTONE BLUEPRINT SHOWCASE CENTERPIECE                      */}
          {/* ========================================================================= */}
          <div className="mt-10 sm:mt-12 max-w-6xl mx-auto rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0c1220] via-[#080d18] to-[#050811] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
            
            {/* Visual Showcase Stage (7 cols on lg, full width on mobile) */}
            <div className="lg:col-span-7 relative flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-hidden group">
              {/* Subtle ambient lighting aura */}
              <div className="absolute inset-0 bg-radial from-amber-500/5 via-blue-500/5 to-transparent pointer-events-none" />
              
              {/* Project Visual Thumbnail (Unclipped, Crisp, High-Res) */}
              <div className="relative z-10 w-full max-h-[380px] flex items-center justify-center">
                <img 
                  src={flagship.thumb || DEFAULT_FLAGSHIP.thumb} 
                  alt={flagship.title || "Flagship Blueprint"}
                  className="max-h-[340px] sm:max-h-[360px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 transition-transform duration-500 group-hover:scale-[1.01]" 
                />
              </div>

              {/* Floating Verified Telemetry Pill */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/95 text-emerald-400 font-mono text-[11px] border border-slate-700/80 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VERIFIED BLUEPRINT
                </span>
              </div>
            </div>

            {/* Blueprint Details & Spec Sheet (5 cols on lg) */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-transparent space-y-6">
              <div>
                {/* Header Kicker & Domain */}
                <div className="flex items-center justify-between gap-2 mb-3 font-mono text-xs">
                  <span className="text-amber-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    FLAGSHIP_BLUEPRINT
                  </span>
                  <span className="text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
                    {flagship.category}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
                  {flagship.title}
                </h3>
                
                {/* Project Description */}
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                  {flagship.short}
                </p>

                {/* Dynamic Tech Stack Tags */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Verified Tech Stack
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(flagship.tech && flagship.tech.length > 0 ? flagship.tech : ["Production Build", "Full Source", "CI Tested"]).map(t => (
                      <span key={t} className="px-2.5 py-1 rounded bg-[#0d121e] border border-slate-800 text-xs font-mono text-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verified Package Deliverables */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Complete Source Code
                    </span>
                    <span className="text-slate-200 font-medium">100% Tested & Compiles</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      IEEE Defense Thesis
                    </span>
                    <span className="text-slate-200 font-medium">Full Manuscript (.docx/.pdf)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Engineer Support
                    </span>
                    <span className="text-amber-400 font-medium">WhatsApp / Discord Hotline</span>
                  </div>
                </div>
              </div>

              {/* Pricing & CTA Action */}
              <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Complete Package</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    <span className="text-amber-500 font-normal text-xs mr-1">INR</span>
                    ₹{Number(flagship.price).toLocaleString()}
                  </div>
                </div>

                <Link to={flagship.id ? `/project/${flagship.id}` : "/marketplace"}>
                  <Button className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold font-mono text-xs px-6 h-11 shadow-sm transition-all retro-btn">
                    INSPECT_PKG →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DOMAIN STACK MATRIX ("Pick Your Engineering Stack")                    */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bleed-container bg-[#070a12] border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Architecture Domains</div>
              <h2 className="text-display text-3xl sm:text-4xl text-white font-bold">
                Pick your engineering stack
              </h2>
            </div>
            <Link to="/marketplace" className="text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Browse full catalog ({liveStats.projects || 100}+) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c];
              const Icon = ICONS[meta.icon as keyof typeof ICONS] || Brain;
              return (
                <Link 
                  key={c}
                  to={`/marketplace?cat=${encodeURIComponent(c)}`} 
                  className="group retro-card rounded-md p-5 bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 hover:border-amber-500/60 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 text-amber-400 grid place-items-center transition-colors group-hover:bg-amber-500 group-hover:text-amber-950">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Active Stack
                      </span>
                    </div>

                    <h3 className="font-bold text-white mt-4 text-base group-hover:text-amber-400 transition-colors">
                      {c}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono font-semibold text-amber-400">
                    <span>View Blueprints</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURED MARKETPLACE BLUEPRINTS (With Faceted Domain Filter)           */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bg-[#090d16] border-b border-slate-800 text-white bleed-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Production Releases</div>
              <h2 className="text-display text-3xl sm:text-4xl text-white font-bold">
                Featured Blueprints
              </h2>
            </div>

            {/* Domain Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap font-mono">
              {[
                { id: "all", label: "All Stacks" },
                { id: "AI", label: "AI & ML" },
                { id: "IoT", label: "IoT Hardware" },
                { id: "Vision", label: "Computer Vision" },
                { id: "Web", label: "Fullstack" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedDomain(f.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer retro-btn ${
                    selectedDomain === f.id
                      ? "bg-amber-500 text-amber-950 font-bold shadow-2xs"
                      : "bg-[#0d121e] text-slate-300 hover:text-white border border-slate-700"
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
              <Button size="lg" className="rounded bg-[#0d121e] hover:bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700 shadow-2xs px-7 h-11 text-xs transition-all retro-btn">
                Browse Complete Catalog ({liveStats.projects || 100}+ Blueprints) <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VERIFICATION STANDARD (Architectural Technical Proof)                  */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-24 bleed-container bg-[#070a12] border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Quality Assurance</div>
            <h2 className="text-display text-3xl sm:text-4xl text-white font-bold">
              The ProjectDukaan Verification Standard
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Unlike unmaintained GitHub repos or low-quality project vendors, every blueprint is audited, compiled, and guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Card 1: 100% Tested & Sandboxed Code (7 cols) */}
            <div className="md:col-span-7 retro-card p-6 sm:p-8 bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 rounded-md">
              <div>
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 grid place-items-center text-amber-400 mb-4">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  100% Sandboxed & Compiled Repositories
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Every project is executed in a dedicated staging sandbox with clean virtual environments before listing. No broken imports, no missing dataset links, and zero missing libraries.
                </p>
              </div>
              <div className="mt-5 p-3 rounded bg-slate-950 text-slate-200 font-mono text-[11px] flex items-center justify-between border border-slate-800">
                <span>$ git clone &amp;&amp; pip install -r requirements.txt</span>
                <span className="text-emerald-400 font-bold">✔ Build Passed</span>
              </div>
            </div>

            {/* Card 2: Complete IEEE Papers & Presentation Decks (5 cols) */}
            <div className="md:col-span-5 retro-card p-6 sm:p-8 bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 rounded-md">
              <div>
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 grid place-items-center text-cyan-400 mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Defense-Ready Documentation
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Includes complete IEEE format project reports, UML architecture diagrams, circuit pinouts, and PPT presentation slides ready for viva review.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ready for university evaluation</span>
              </div>
            </div>

            {/* Card 3: Tracked Hardware Kit Delivery (5 cols) */}
            <div className="md:col-span-5 retro-card p-6 sm:p-8 bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 rounded-md">
              <div>
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 grid place-items-center text-amber-400 mb-4">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Physical Hardware Shipped
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  For IoT and robotics builds: pre-soldered components, microcontrollers, and wiring harnesses delivered to your doorstep with live tracking.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Courier dispatch in 48 hours</span>
              </div>
            </div>

            {/* Card 4: 7-Day Guarantee & WhatsApp Engineer Support (7 cols) */}
            <div className="md:col-span-7 retro-card p-6 sm:p-8 bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 rounded-md">
              <div>
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 grid place-items-center text-emerald-400 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  7-Day Guarantee + Senior Engineer Support
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  If your project fails to compile or differs from the specifications, our senior engineers assist you directly over WhatsApp or Discord, or you receive a full refund.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-risk guarantee on every blueprint</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TECHNICAL FAQ SECTION                                                  */}
      {/* ========================================================================= */}
      <section className="container-px py-16 md:py-20 bleed-container bg-[#090d16] border-b border-slate-800 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Documentation & FAQ</div>
            <h2 className="text-display text-3xl sm:text-4xl text-white font-bold">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="retro-card bg-[#0d121e] p-6 sm:p-8 rounded-md border-2 border-slate-800 text-white">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-800 last:border-0">
                <AccordionTrigger className="text-white font-mono font-bold text-sm sm:text-base text-left hover:text-amber-400 transition-colors">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CUSTOM ENGINEERING STUDIO CTA                                          */}
      {/* ========================================================================= */}
      <section className="container-px py-16 pb-24 bleed-container bg-[#070a12] text-white">
        <div className="max-w-6xl mx-auto rounded-xl bg-[#090d16] p-8 sm:p-12 md:p-16 text-center relative overflow-hidden border-2 border-slate-800 retro-card">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded">
              Custom Engineering Studio
            </span>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-white font-bold mt-4 leading-tight">
              Can't find your exact project topic?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3.5 leading-relaxed">
              Submit your problem statement. Our engineering team scopes, codes, tests, and documents custom hardware & software architectures within 7 days.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono">
              <Link to="/custom-request">
                <Button size="lg" className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-7 h-11 text-xs shadow-xs transition-all retro-btn">
                  Request Custom Blueprint <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 font-bold px-6 h-11 text-xs retro-btn">
                  Speak with an Engineer
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
