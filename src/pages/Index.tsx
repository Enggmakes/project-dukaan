import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, Star, Zap, ShieldCheck, Rocket, Brain, Network, Eye, Bot, Cpu, Globe, Smartphone, Link2, Shield, TrendingUp, Users, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import MeshGradient from "@/components/MeshGradient";
import React, { useEffect } from "react";
import { CATEGORIES, CATEGORY_META, STATS, TESTIMONIALS, FAQS, Project, PROJECTS } from "@/lib/mockData";
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
  const [statsData, setStatsData] = useState({
    projectsCount: 0,
    leadsCount: 0,
  });

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      const dbProjects = (data || []) as Project[];
      setProjects([...dbProjects, ...PROJECTS].slice(0, 6));
    });

    supabase.from('projects').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) {
        setStatsData(prev => ({ ...prev, projectsCount: count }));
      }
    });

    supabase.from('custom_requests').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) {
        setStatsData(prev => ({ ...prev, leadsCount: count }));
      }
    });
  }, []);

  return (
    <ErrorBoundary>
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden -mt-24 pt-32 pb-24">
        <MeshGradient className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
        <div className="relative container-px">
          <div className="max-w-5xl mx-auto text-center">

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-[88px] text-navy">
              Build faster.<br />
              Learn smarter.<br />
              <span className="bg-gradient-to-r from-primary via-accent to-magenta bg-clip-text text-transparent">Ship real projects.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-navy/70 max-w-2xl mx-auto">
              The premium marketplace for AI, ML, IoT, robotics and final-year engineering projects — production-ready code, polished docs, instant download.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/marketplace"><Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-7 h-12 text-base shadow-elegant">Explore Projects <ArrowRight className="ml-1.5 w-4 h-4" /></Button></Link>
              <Link to="/custom-request"><Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-base bg-white/80 backdrop-blur border-navy/10 hover:bg-white">Request Custom Project</Button></Link>
            </motion.div>

            {/* Search bar */}
            <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onSubmit={(e) => { e.preventDefault(); window.location.href = `/marketplace?q=${q}&cat=${cat}`; }}
              className="mt-10 max-w-2xl mx-auto glass rounded-full p-2 flex items-center gap-2 shadow-elegant">
              <Search className="w-5 h-5 ml-3 text-muted-foreground shrink-0" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search 12,000+ projects…"
                className="border-0 bg-transparent focus-visible:ring-0 text-navy flex-1" />
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-40 rounded-full border-0 bg-secondary text-sm shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="rounded-full bg-navy hover:bg-navy-light px-6 h-10">Search</Button>
            </motion.form>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-navy/50">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Code reviewed</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant download</span>
              <span className="flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" /> 12mo support</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 4.9 average rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="container-px -mt-8 mb-32 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-navy rounded-[2rem] p-6 md:p-10 shadow-navy overflow-hidden relative">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-widest">Live insights</div>
                <h3 className="text-white text-2xl font-semibold mt-1">Our Project Dashboard</h3>
              </div>
              <div className="hidden md:flex gap-2">
                {["Overview", "Downloads", "Builds", "Reviews"].map((t, i) => (
                  <span key={t} className={`px-3 py-1.5 rounded-full text-xs ${i === 0 ? "bg-white text-navy" : "text-white/60 bg-white/5"}`}>{t}</span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Zap, label: "Active project blueprints", value: statsData.projectsCount.toString(), delta: "+15%" },
                { icon: Users, label: "Custom requests processed", value: statsData.leadsCount.toString(), delta: "+24%" },
                { icon: Star, label: "Average client rating", value: "4.9 / 5.0", delta: "Excellent" },
              ].map((s) => (
                <div key={s.label} className="glass-dark rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <s.icon className="w-4 h-4 text-primary-glow" />
                    <span className="text-xs text-emerald-400">{s.delta}</span>
                  </div>
                  <div className="text-white text-3xl font-semibold mt-3">{s.value}</div>
                  <div className="text-white/50 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* fake chart */}
            <div className="glass-dark rounded-2xl p-5 mt-4">
              <div className="flex items-end gap-2 h-32">
                {Array.from({ length: 28 }).map((_, i) => {
                  const h = 20 + Math.abs(Math.sin(i * 0.7)) * 80;
                  return <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-accent" style={{ height: `${h}%`, opacity: 0.5 + (i / 56) }} />;
                })}
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-2"><span>Apr 1</span><span>Apr 14</span><span>Apr 28</span></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CATEGORIES */}
      <section className="container-px py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-primary text-sm font-medium">Browse by domain</div>
              <h2 className="text-display text-4xl md:text-5xl text-navy mt-2">Pick your stack</h2>
            </div>
            <Link to="/marketplace" className="text-sm text-navy font-medium hover:text-primary">View all →</Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c, i) => {
              const meta = CATEGORY_META[c];
              const Icon = ICONS[meta.icon as keyof typeof ICONS];
              return (
                <motion.div key={c} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/marketplace?cat=${encodeURIComponent(c)}`} className="group block bg-white border border-border rounded-3xl p-6 shadow-soft hover:shadow-elegant transition-all relative overflow-hidden h-full">
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${meta.gradient} opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all`} />
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} grid place-items-center text-white shadow-elegant`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-navy mt-5 text-lg">{c}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{meta.desc}</p>
                    <div className="text-sm text-primary mt-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Explore →</div>
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
              <div className="text-primary text-sm font-medium">Hand-picked</div>
              <h2 className="text-display text-4xl md:text-5xl text-navy mt-2">Featured projects</h2>
            </div>
            <Link to="/marketplace" className="text-sm text-navy font-medium hover:text-primary">All projects →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container-px py-16">
        <MeshGradient className="max-w-6xl mx-auto rounded-[2rem] p-10 md:p-14 border border-border">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-display text-5xl text-navy">{s.value}</div>
                <div className="text-sm text-navy/60 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </MeshGradient>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-px py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-primary text-sm font-medium">Loved by builders</div>
            <h2 className="text-display text-4xl md:text-5xl text-navy mt-2">Shipped, not stalled.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-border rounded-3xl p-6 shadow-soft">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-navy text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-gradient grid place-items-center text-white text-xs font-semibold">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-medium text-navy">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-px py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-primary text-sm font-medium">FAQ</div>
            <h2 className="text-display text-4xl md:text-5xl text-navy mt-2">Questions, answered.</h2>
          </div>
          <Accordion type="single" collapsible className="bg-white rounded-3xl border border-border shadow-soft px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-navy font-medium text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container-px py-16">
        <div className="max-w-5xl mx-auto bg-navy rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
          <MeshGradient className="absolute inset-0 opacity-20" />
          <div className="relative">
            <h2 className="text-display text-4xl md:text-5xl text-white">Can't find your project?</h2>
            <p className="text-white/70 mt-4 max-w-xl mx-auto">Tell us what you need. Our team will scope it, quote it and ship it — typically within 7 days.</p>
            <Link to="/custom-request"><Button size="lg" className="rounded-full bg-white text-navy hover:bg-white/90 px-7 h-12 mt-8">Request a custom project <ArrowRight className="ml-1.5 w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>
    </Layout>
    </ErrorBoundary>
  );
}
