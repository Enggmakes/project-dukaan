import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, Star, Zap, ShieldCheck, Rocket, Brain, Network, Eye, Bot, Cpu, Globe, Smartphone, Link2, Shield, TrendingUp, Users, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import ProjectCard from "@/components/ProjectCard";
import MeshGradient from "@/components/MeshGradient";
import React, { useEffect } from "react";
import { CATEGORIES, CATEGORY_META, FAQS, Project } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [hoveredBar, setHoveredBar] = useState<{ day: number; value: number } | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  // Multiplier for demo tab views
  const tabMultiplier = activeTab === "Downloads" ? 3.4 : activeTab === "Builds" ? 1.8 : activeTab === "Reviews" ? 0.9 : 1.0;

  return (
    <ErrorBoundary>
    <Layout>
      <Helmet>
        <title>ProjectDukaan — Build Faster. Ship Real Projects.</title>
        <meta name="description" content="Premium marketplace for AI, ML, IoT, robotics & final-year engineering projects. Download production-ready code with polished documentation instantly." />
        <meta name="keywords" content="AI final year projects, machine learning projects, IoT projects, robotics projects, engineering projects, computer science project download, ProjectDukaan" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/" />
      </Helmet>
      {/* HERO */}
      <section className="relative overflow-hidden -mt-24 pt-32 pb-24">
        <MeshGradient className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
        <div className="relative container-px">
          <div className="max-w-5xl mx-auto text-center">

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-[84px] text-slate-900 font-extrabold tracking-[-0.03em] leading-[1.08]">
              Build faster.<br />
              Learn smarter.<br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">Ship real projects.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              The premium marketplace for AI, ML, IoT, robotics and final-year engineering projects — production-ready code, polished docs, instant download.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/marketplace">
                <Button size="lg" className="liquid-glass-primary text-white rounded-full px-8 h-12 text-base font-semibold shadow-md active:scale-98 transition-transform">
                  Explore Projects <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/custom-request">
                <Button size="lg" variant="outline" className="liquid-glass-btn text-slate-800 rounded-full px-8 h-12 text-base font-semibold active:scale-98 transition-transform">
                  Request Custom Project
                </Button>
              </Link>
            </motion.div>

            {/* Liquid Glass Search Spotlight bar with Cmd+K */}
            <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onSubmit={(e) => { e.preventDefault(); window.location.href = `/marketplace?q=${q}&cat=${cat}`; }}
              className="mt-10 max-w-2xl mx-auto liquid-glass rounded-full p-2 flex items-center gap-2 shadow-xl border-slate-200/80 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
              <Search className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
              <Input
                ref={searchInputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search 12,000+ projects…"
                className="border-0 bg-transparent focus-visible:ring-0 text-slate-900 flex-1 placeholder:text-slate-400 text-sm h-10"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200/80 shrink-0 select-none">
                ⌘K
              </kbd>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-40 rounded-full border-0 bg-slate-100/90 text-xs font-semibold shrink-0 text-slate-700 h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 h-10 text-xs font-semibold shadow-sm active:scale-95 transition-all">Search</Button>
            </motion.form>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
              <span className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 font-medium hover:scale-105 transition-transform cursor-default"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Code reviewed</span>
              <span className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 font-medium hover:scale-105 transition-transform cursor-default"><Zap className="w-3.5 h-3.5 text-amber-500" /> Instant download</span>
              <span className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 font-medium hover:scale-105 transition-transform cursor-default"><Rocket className="w-3.5 h-3.5 text-violet-600" /> 12mo support</span>
              <span className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 font-medium hover:scale-105 transition-transform cursor-default"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4.9 average rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="container-px -mt-8 mb-32 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden relative">
          <div className="relative">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="text-indigo-600 text-xs uppercase tracking-widest font-semibold">Live Insights</div>
                <h3 className="text-slate-900 text-2xl font-bold mt-1">Our Project Dashboard</h3>
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200/80">
                {["Overview", "Downloads", "Builds", "Reviews"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { 
                  icon: Zap, 
                  label: "Active project blueprints", 
                  value: liveStats.projects === null ? "—" : String(Math.round((liveStats.projects || 1) * (activeTab === "Overview" ? 1 : 1.2))), 
                  delta: "+15%" 
                },
                { 
                  icon: Users, 
                  label: activeTab === "Downloads" ? "Total Downloads" : "Orders placed", 
                  value: liveStats.orders === null ? "—" : String(Math.round((liveStats.orders || 1) * tabMultiplier)), 
                  delta: "+24%" 
                },
                { 
                  icon: Star, 
                  label: "Average project rating", 
                  value: liveStats.avgRating === null ? "—" : `${liveStats.avgRating} / 5.0`, 
                  delta: "Excellent" 
                },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 hover:bg-white hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    <s.icon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.delta}</span>
                  </div>
                  <div className="text-slate-900 text-3xl font-bold mt-3">{s.value}</div>
                  <div className="text-slate-500 text-xs mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Interactive chart with tooltips */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 mt-4 relative">
              <div className="flex items-end gap-2 h-32 relative">
                {Array.from({ length: 28 }).map((_, i) => {
                  const h = Math.min(100, Math.max(18, (20 + Math.abs(Math.sin((i + (activeTab === "Downloads" ? 3 : activeTab === "Builds" ? 7 : 0)) * 0.7)) * 80) * (tabMultiplier > 1 ? 0.95 : 1)));
                  const val = Math.round(h * 12 * tabMultiplier);
                  const isHovered = hoveredBar?.day === i + 1;

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredBar({ day: i + 1, value: val })}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500 transition-all duration-300 hover:scale-y-105 cursor-pointer relative group"
                      style={{ height: `${h}%`, opacity: isHovered ? 1 : 0.6 + (i / 70) }}
                    >
                      {isHovered && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none animate-in fade-in zoom-in-90">
                          Apr {i + 1}: {val} {activeTab === "Downloads" ? "dl" : "events"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-2">
                <span>Apr 1</span>
                <span>Apr 14</span>
                <span>Apr 28</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CATEGORIES */}
      <section className="container-px py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-indigo-600 text-sm font-semibold">Browse by domain</div>
              <h2 className="text-display text-4xl md:text-5xl text-slate-900 font-bold mt-2">Pick your stack</h2>
            </div>
            <Link to="/marketplace" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">View all →</Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c, i) => {
              const meta = CATEGORY_META[c];
              const Icon = ICONS[meta.icon as keyof typeof ICONS];
              return (
                <motion.div key={c} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/marketplace?cat=${encodeURIComponent(c)}`} className="group block liquid-glass-card rounded-[2rem] p-6 relative overflow-hidden h-full">
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${meta.gradient} opacity-15 group-hover:opacity-30 group-hover:scale-125 transition-all`} />
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} grid place-items-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-5 text-lg group-hover:text-indigo-600 transition-colors">{c}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{meta.desc}</p>
                    <div className="text-sm text-indigo-600 mt-4 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Explore Blueprints →</div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-px py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-indigo-600 text-sm font-semibold">Hand-picked</div>
              <h2 className="text-display text-4xl md:text-5xl text-slate-900 font-bold mt-2">Featured projects</h2>
            </div>
            <Link to="/marketplace" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">All projects →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </section>

      {/* STATS — live data from Supabase */}
      <section className="container-px py-16">
        <div className="max-w-6xl mx-auto bg-slate-50/80 rounded-[2rem] p-10 md:p-14 border border-slate-200/80">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-display text-5xl text-slate-900 font-bold">
                {liveStats.projects === null ? "—" : liveStats.projects === 0 ? "Coming soon" : `${liveStats.projects}+`}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-2">Projects listed</div>
            </div>
            <div>
              <div className="text-display text-5xl text-slate-900 font-bold">
                {liveStats.orders === null ? "—" : liveStats.orders === 0 ? "0" : `${liveStats.orders}+`}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-2">Orders placed</div>
            </div>
            <div>
              <div className="text-display text-5xl text-slate-900 font-bold">
                {liveStats.avgRating === null ? "—" : liveStats.avgRating === 0 ? "—" : `${liveStats.avgRating}★`}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-2">Avg. project rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-px py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-indigo-600 text-sm font-semibold">FAQ</div>
            <h2 className="text-display text-4xl md:text-5xl text-slate-900 font-bold mt-2">Questions, answered.</h2>
          </div>
          <Accordion type="single" collapsible className="bg-white rounded-3xl border border-slate-200/80 shadow-sm px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-100">
                <AccordionTrigger className="text-slate-900 font-semibold text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container-px py-16">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden border border-slate-800 shadow-xl group">
          <MeshGradient className="absolute inset-0 opacity-25" />
          
          {/* Subtle Glow Orbs & Gradient Blur */}
          <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none animate-float" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-36 -right-24 w-96 h-96 rounded-full bg-indigo-600/25 blur-[120px] pointer-events-none animate-float" style={{ animationDuration: '12s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

          {/* Faint Tech Grid */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none" 
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, transparent 20%, hsl(210 65% 14%) 85%),
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 20px 20px, 20px 20px',
            }}
          />

          {/* Shimmer sweep animation */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 8s infinite linear',
            }}
          />

          {/* Floating tiny particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => {
              const size = Math.random() * 4 + 2; // 2px to 6px
              const left = Math.random() * 100; // 0% to 100%
              const bottom = Math.random() * 20 - 10; // -10px to 10px
              const delay = Math.random() * 10; // 0s to 10s
              const duration = Math.random() * 15 + 10; // 10s to 25s
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20 animate-particle-rise"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </div>

          <div className="relative z-10">
            <h2 className="text-display text-4xl md:text-5xl text-white font-bold">Can't find your project?</h2>
            <p className="text-slate-300 mt-4 max-w-xl mx-auto">Tell us what you need. Our team will scope it, quote it and ship it — typically within 7 days.</p>
            <Link to="/custom-request">
              <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold px-7 h-12 mt-8 shadow-sm transition-all duration-300">
                Request a custom project <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
    </ErrorBoundary>
  );
}
