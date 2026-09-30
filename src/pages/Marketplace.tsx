import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search } from "lucide-react";
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
  const [params, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [sort, setSort] = useState("latest");
  const [price, setPrice] = useState([0, 100000]);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    setCat(params.get("cat") ?? "all"); 
    setQ(params.get("q") ?? ""); 
  }, [params]);

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

  const handleCatChange = (newCat: string) => {
    setCat(newCat);
    const newParams = new URLSearchParams(params);
    if (!newCat || newCat === "all") {
      newParams.delete("cat");
    } else {
      newParams.set("cat", newCat);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (newQ: string) => {
    setQ(newQ);
    const newParams = new URLSearchParams(params);
    if (!newQ.trim()) {
      newParams.delete("q");
    } else {
      newParams.set("q", newQ.trim());
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setDiffs([]);
    setTechs([]);
    setPrice([0, 100000]);
    setCat("all");
    setQ("");
    setSearchParams(new URLSearchParams());
  };

  const ALL_TECH = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tech || []))).sort(), [projects]);

  const filtered = useMemo(() => {
    let r = projects.filter(p => {
      // Category match: exact or substring
      const pCat = (p.category || "").toLowerCase();
      const sCat = cat.toLowerCase();
      const catMatch = cat === "all" || pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);

      // Search match across title, short, category, difficulty, tech
      const term = q.trim().toLowerCase();
      const textMatch = !term || [
        p.title,
        p.short,
        p.category,
        p.difficulty,
        ...(p.tech || [])
      ].join(" ").toLowerCase().includes(term);

      // Price match
      const pPrice = Number(p.price) || 0;
      const priceMatch = pPrice >= price[0] && pPrice <= price[1];

      // Difficulty match
      const diffMatch = diffs.length === 0 || diffs.includes(p.difficulty);

      // Tech match
      const techMatch = techs.length === 0 || techs.some(t => (p.tech || []).includes(t));

      return catMatch && textMatch && priceMatch && diffMatch && techMatch;
    });

    if (sort === "popular") r = [...r].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    if (sort === "rating") r = [...r].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "price-low") r = [...r].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === "price-high") r = [...r].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
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

      {/* FULL BLEED MARKETPLACE HERO */}
      <div className="relative overflow-hidden -mt-24 pt-32 pb-14 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 border-b border-slate-200/80 bleed-container">
        <MeshGradient className="absolute inset-0 opacity-40 pointer-events-none" />
        <div className="container-px max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-indigo-600 mb-3 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                Verified Repositories
              </div>
              <h1 className="text-display text-4xl sm:text-5xl md:text-6xl text-slate-900 font-black tracking-tight">
                Project Marketplace
              </h1>
              <p className="text-slate-600 mt-2 text-base md:text-lg font-normal max-w-xl">
                Explore {projects.length}+ production-ready codebases with architecture diagrams and thesis documentation.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xs shrink-0">
              Showing <span className="text-slate-900 font-bold">{filtered.length}</span> of {projects.length} Blueprints
            </div>
          </div>

          {/* Quick Domain Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap mt-6 pt-6 border-t border-slate-200/60">
            <button
              onClick={() => handleCatChange("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                cat === "all"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
              }`}
            >
              All Domains
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => handleCatChange(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  cat === c || cat.toLowerCase() === c.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="container-px py-10 bleed-container">
        <div className="max-w-6xl mx-auto">
          {/* Bento Search & Filter Dock */}
          <div className="bento-card p-3 md:p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative z-10 shadow-sm bg-white border border-slate-200/90 mb-8">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-4 py-1 md:py-0 bg-slate-50 rounded-full border border-slate-200/90 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input 
                value={q} 
                onChange={e => handleSearchChange(e.target.value)} 
                placeholder="Search by keywords, tags, or author..." 
                className="border-0 bg-transparent focus-visible:ring-0 h-10 text-slate-900 placeholder:text-slate-400 text-sm font-medium" 
              />
            </div>

            {/* Selects & Controls Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1">
                {/* Category Select inside sticky dock */}
                <div className="flex-1 sm:flex-none">
                  <Select value={cat} onValueChange={handleCatChange}>
                    <SelectTrigger className="w-full sm:w-44 rounded-full bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 shadow-none h-10">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full sm:w-36 rounded-full bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 shadow-none h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                      <SelectItem value="latest">Latest releases</SelectItem>
                      <SelectItem value="popular">Most popular</SelectItem>
                      <SelectItem value="rating">Highest rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters Trigger */}
              <Button 
                variant="outline" 
                className={`w-full sm:w-auto rounded-full h-10 text-xs font-bold transition-all shadow-xs ${
                  showFilters 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                }`} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5 text-indigo-600" /> Filters
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[270px_1fr] gap-8 items-start">
            {/* Filter Sidebar */}
            <aside className={`${showFilters ? "block" : "hidden lg:block"} space-y-5 sticky top-28`}>
              <div className="bento-card p-5 bg-white">
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Price Range</h4>
                <Slider value={price} onValueChange={setPrice} max={100000} step={500} />
                <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono font-semibold">
                  <span>₹{price[0].toLocaleString()}</span>
                  <span>₹{price[1].toLocaleString()}</span>
                </div>
              </div>

              <div className="bento-card p-5 bg-white">
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Difficulty Level</h4>
                <div className="space-y-2.5">
                  {DIFFICULTIES.map(d => (
                    <label key={d} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                      <Checkbox checked={diffs.includes(d)} onCheckedChange={() => toggle(diffs, d, setDiffs)} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bento-card p-5 bg-white">
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Tech Stack</h4>
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {ALL_TECH.map(t => (
                    <Badge 
                      key={t} 
                      onClick={() => toggle(techs, t, setTechs)}
                      className={`cursor-pointer rounded-full text-[11px] font-semibold transition-all ${
                        techs.includes(t) 
                          ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700" 
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                      }`}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              {(diffs.length > 0 || techs.length > 0 || price[0] > 0 || price[1] < 100000 || cat !== "all" || q) && (
                <Button 
                  variant="ghost" 
                  onClick={resetFilters}
                  className="w-full text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-full h-9"
                >
                  Reset All Filters
                </Button>
              )}
            </aside>

            {/* Results Grid */}
            <div>
              {isLoading ? (
                <div className="bento-card p-16 text-center bg-white">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-slate-600 text-sm font-semibold">Loading marketplace blueprints...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bento-card p-16 text-center bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 mx-auto mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No blueprints found</h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    We couldn't find any projects matching your current search or filters.
                  </p>
                  <Button 
                    onClick={resetFilters}
                    className="mt-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
