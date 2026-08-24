import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SlidersHorizontal, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import ProjectCard from "@/components/ProjectCard";
import MeshGradient from "@/components/MeshGradient";
import { CATEGORIES, Project } from "@/lib/mockData";
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
        setProjects(data as Project[]);
      } else {
        setProjects([]);
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
      <div className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-6xl mx-auto">
          <h1 className="text-display text-5xl md:text-6xl text-slate-900 font-bold">Marketplace</h1>
          <p className="text-slate-600 mt-3 text-lg font-medium">{projects.length}+ production-ready projects, instant download.</p>
        </div>
      </div>

      <section className="container-px py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[2rem] md:rounded-full shadow-sm border border-slate-200 p-3 md:p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center sticky top-20 md:top-24 z-30">
            {/* Search Input - Spans full width on mobile, flexible on desktop */}
            <div className="flex-1 flex items-center gap-2 px-4 py-1 md:py-0 bg-slate-50 rounded-full border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="border-0 bg-transparent focus-visible:ring-0 h-9 text-slate-900 placeholder:text-slate-400 text-sm" />
            </div>

            {/* Selects & Controls Container - Elegant wrap flow */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1">
                {/* Category Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger className="w-full sm:w-44 rounded-full bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full sm:w-40 rounded-full bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
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
                <Button variant="outline" className="flex-1 sm:flex-none rounded-full h-10 border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50" onClick={() => setShowFilters(!showFilters)}>
                  <SlidersHorizontal className="w-4 h-4 mr-1.5 text-indigo-600" /> Filters
                </Button>
                
                <div className="flex bg-slate-100 border border-slate-200 rounded-full p-1 h-10 shrink-0">
                  <button onClick={() => setView("grid")} className={`p-1.5 px-2.5 rounded-full transition-all ${view === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={`p-1.5 px-2.5 rounded-full transition-all ${view === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-8 mt-8">
            <aside className={`${showFilters ? "block" : "hidden lg:block"} space-y-6`}>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Price range</h4>
                <Slider value={price} onValueChange={setPrice} max={100000} step={500} />
                <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono"><span>₹{price[0].toLocaleString()}</span><span>₹{price[1].toLocaleString()}</span></div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Difficulty</h4>
                <div className="space-y-2.5">
                  {DIFFICULTIES.map(d => (
                    <label key={d} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                      <Checkbox checked={diffs.includes(d)} onCheckedChange={() => toggle(diffs, d, setDiffs)} />{d}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Technologies</h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-auto no-scrollbar">
                  {ALL_TECH.map(t => (
                    <Badge key={t} onClick={() => toggle(techs, t, setTechs)}
                      className={`cursor-pointer rounded-full text-xs font-medium transition-all ${techs.includes(t) ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"}`}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="text-sm text-slate-500 font-medium mb-4">{filtered.length} projects found</div>
              {isLoading ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-700 font-medium">Loading projects...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-700 font-medium">No projects match your filters.</p>
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
