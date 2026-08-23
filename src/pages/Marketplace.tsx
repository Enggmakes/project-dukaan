import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SlidersHorizontal, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import ProjectCard from "@/components/ProjectCard";
import MeshGradient from "@/components/MeshGradient";
import { CATEGORIES, PROJECTS, Project } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export default function Marketplace() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [sort, setSort] = useState("latest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [price, setPrice] = useState([0, 100000]);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setCat(params.get("cat") ?? "all"); setQ(params.get("q") ?? ""); }, [params]);

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        setProjects([...(data as Project[]), ...PROJECTS]);
      } else {
        setProjects([...PROJECTS]);
      }
      setIsLoading(false);
    });
  }, []);

  const ALL_TECH = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tech || []))).sort(), [projects]);

  const filtered = useMemo(() => {
    let r = projects.filter(p =>
      (cat === "all" || p.category === cat) &&
      (q === "" || ((p.title || "") + (p.short || "") + (p.tech || []).join(" ")).toLowerCase().includes(q.toLowerCase())) &&
      (p.price || 0) >= price[0] && (p.price || 0) <= price[1] &&
      (diffs.length === 0 || diffs.includes(p.difficulty)) &&
      (techs.length === 0 || techs.some(t => (p.tech || []).includes(t)))
    );
    if (sort === "popular") r = [...r].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    if (sort === "rating") r = [...r].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "price-low") r = [...r].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-high") r = [...r].sort((a, b) => (b.price || 0) - (a.price || 0));
    return r;
  }, [projects, q, cat, sort, price, diffs, techs]);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <Layout>
      <Helmet>
        <title>Project Marketplace | Buy Ready-made AI, ML, IoT Projects — ProjectDukaan</title>
        <meta name="description" content="Explore our vast collection of AI, Machine Learning, IoT, and Robotics engineering projects. Filter by tech stack, difficulty, and price to find your next blueprint." />
        <meta name="keywords" content="AI project marketplace, ML projects download, buy IoT blueprints, robotics final year projects, engineering code marketplace" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/marketplace" />
      </Helmet>
      <MeshGradient className="py-16">
        <div className="container-px max-w-6xl mx-auto">
          <h1 className="text-display text-5xl md:text-6xl text-navy">Marketplace</h1>
          <p className="text-navy/60 mt-3 text-lg">{projects.length}+ production-ready projects, instant download.</p>
        </div>
      </MeshGradient>

      <section className="container-px py-10">
        <div className="max-w-6xl mx-auto">
          <div className="liquid-glass rounded-[2rem] md:rounded-full shadow-2xl border-white/80 p-3 md:p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center sticky top-20 md:top-24 z-30">
            {/* Search Input - Spans full width on mobile, flexible on desktop */}
            <div className="flex-1 flex items-center gap-2 px-4 py-1 md:py-0 bg-black/[0.04] rounded-full border border-white/50">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="border-0 bg-transparent focus-visible:ring-0 h-9 text-navy placeholder:text-navy/45 text-sm" />
            </div>

            {/* Selects & Controls Container - Elegant wrap flow */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1">
                {/* Category Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger className="w-full sm:w-44 rounded-full bg-white/70 backdrop-blur-md border-white/80 text-xs font-medium text-navy shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="liquid-glass border-white/80 rounded-2xl shadow-xl">
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full sm:w-40 rounded-full bg-white/70 backdrop-blur-md border-white/80 text-xs font-medium text-navy shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="liquid-glass border-white/80 rounded-2xl shadow-xl">
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most popular</SelectItem>
                      <SelectItem value="rating">Highest rated</SelectItem>
                      <SelectItem value="price-low">Price ↑</SelectItem>
                      <SelectItem value="price-high">Price ↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters Trigger & Grid/List View switcher */}
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex-1 sm:flex-none rounded-full h-10 border-white/80 bg-white/70 backdrop-blur-md text-xs font-medium text-navy shadow-sm hover:bg-white" onClick={() => setShowFilters(!showFilters)}>
                  <SlidersHorizontal className="w-4 h-4 mr-1.5 text-primary" /> Filters
                </Button>
                
                <div className="flex bg-black/[0.04] border border-white/50 rounded-full p-1 h-10 shrink-0">
                  <button onClick={() => setView("grid")} className={`p-1.5 px-2.5 rounded-full transition-all ${view === "grid" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-primary" : "text-navy/60"}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={`p-1.5 px-2.5 rounded-full transition-all ${view === "list" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-primary" : "text-navy/60"}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-8 mt-8">
            <aside className={`${showFilters ? "block" : "hidden lg:block"} space-y-6`}>
              <div className="liquid-glass-card rounded-[2rem] p-5">
                <h4 className="font-medium text-navy mb-3 text-sm">Price range</h4>
                <Slider value={price} onValueChange={setPrice} max={100000} step={500} />
                <div className="flex justify-between text-xs text-muted-foreground mt-3 font-mono"><span>₹{price[0].toLocaleString()}</span><span>₹{price[1].toLocaleString()}</span></div>
              </div>
              <div className="liquid-glass-card rounded-[2rem] p-5">
                <h4 className="font-medium text-navy mb-3 text-sm">Difficulty</h4>
                <div className="space-y-2.5">
                  {DIFFICULTIES.map(d => (
                    <label key={d} className="flex items-center gap-2.5 text-sm text-navy cursor-pointer hover:text-primary transition-colors">
                      <Checkbox checked={diffs.includes(d)} onCheckedChange={() => toggle(diffs, d, setDiffs)} />{d}
                    </label>
                  ))}
                </div>
              </div>
              <div className="liquid-glass-card rounded-[2rem] p-5">
                <h4 className="font-medium text-navy mb-3 text-sm">Technologies</h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-auto no-scrollbar">
                  {ALL_TECH.map(t => (
                    <Badge key={t} onClick={() => toggle(techs, t, setTechs)}
                      className={`cursor-pointer rounded-full text-xs transition-all ${techs.includes(t) ? "bg-primary text-white shadow-sm hover:bg-primary" : "bg-black/[0.04] text-navy/80 hover:bg-white/80 border border-white/60"}`}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="text-sm text-muted-foreground mb-4">{filtered.length} projects</div>
              {isLoading ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-border">
                  <p className="text-navy font-medium">Loading projects...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-border">
                  <p className="text-navy font-medium">No projects match your filters.</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(p => <ProjectCard key={p.id} project={p} view="list" />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
