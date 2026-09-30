import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, X, Check, RotateCcw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export default function Marketplace() {
  const [params, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [sort, setSort] = useState("latest");
  const [price, setPrice] = useState([0, 100000]);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [techSearch, setTechSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
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
    setTechSearch("");
    setSearchParams(new URLSearchParams());
  };

  const ALL_TECH = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tech || []))).sort(), [projects]);

  const filteredTechList = useMemo(() => {
    if (!techSearch.trim()) return ALL_TECH;
    const term = techSearch.trim().toLowerCase();
    return ALL_TECH.filter(t => t.toLowerCase().includes(term));
  }, [ALL_TECH, techSearch]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (cat !== "all") count++;
    if (diffs.length > 0) count += diffs.length;
    if (techs.length > 0) count += techs.length;
    if (price[0] > 0 || price[1] < 100000) count++;
    if (q.trim()) count++;
    return count;
  }, [cat, diffs, techs, price, q]);

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

  const handleFilterToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileDrawerOpen(true);
    } else {
      setDesktopSidebarOpen(prev => !prev);
    }
  };

  // Reusable Bento Filter Modules
  const renderFilterModules = () => (
    <div className="space-y-4">
      {/* Price Range Module */}
      <div className="bento-card p-4 sm:p-5 bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Price Range</h4>
          {(price[0] > 0 || price[1] < 100000) && (
            <button
              type="button"
              onClick={() => setPrice([0, 100000])}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
            >
              Reset
            </button>
          )}
        </div>
        <Slider value={price} onValueChange={setPrice} max={100000} step={500} min={0} />
        <div className="flex justify-between text-xs text-slate-600 mt-3 font-mono font-semibold">
          <span>₹{price[0].toLocaleString()}</span>
          <span>₹{price[1].toLocaleString()}</span>
        </div>
        {/* Quick price presets */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setPrice([0, 5000])}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
              price[0] === 0 && price[1] === 5000
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            &lt; ₹5k
          </button>
          <button
            type="button"
            onClick={() => setPrice([5000, 20000])}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
              price[0] === 5000 && price[1] === 20000
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ₹5k - ₹20k
          </button>
          <button
            type="button"
            onClick={() => setPrice([20000, 100000])}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
              price[0] === 20000 && price[1] === 100000
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ₹20k+
          </button>
        </div>
      </div>

      {/* Difficulty Level Module */}
      <div className="bento-card p-4 sm:p-5 bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Difficulty Level</h4>
          {diffs.length > 0 && (
            <button
              type="button"
              onClick={() => setDiffs([])}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map(d => {
            const isSelected = diffs.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(diffs, d, setDiffs)}
                className={`px-2 py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Future-Proof Tech Stack Module */}
      <div className="bento-card p-4 sm:p-5 bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tech Stack</h4>
            <span className="text-[10px] text-slate-400 font-mono">({ALL_TECH.length})</span>
          </div>
          {techs.length > 0 && (
            <button
              type="button"
              onClick={() => setTechs([])}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
            >
              Clear ({techs.length})
            </button>
          )}
        </div>

        {/* Tech search input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={techSearch}
            onChange={e => setTechSearch(e.target.value)}
            placeholder="Search technologies..."
            className="h-8 text-xs pl-8 pr-7 bg-slate-50 border-slate-200 rounded-xl placeholder:text-slate-400"
          />
          {techSearch && (
            <button
              type="button"
              onClick={() => setTechSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scrollable Tag Cloud (Capped height prevents page blowout) */}
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {filteredTechList.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center w-full">No technologies match "{techSearch}"</p>
          ) : (
            filteredTechList.map(t => {
              const isSelected = techs.includes(t);
              return (
                <Badge
                  key={t}
                  onClick={() => toggle(techs, t, setTechs)}
                  className={`cursor-pointer rounded-full text-[11px] font-semibold transition-all py-1 px-2.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700 border-indigo-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 mr-1 inline" />}
                  {t}
                </Badge>
              );
            })
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="w-full text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl h-9 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
        </Button>
      )}
    </div>
  );

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
          <div className="bento-card p-3 md:p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative z-10 shadow-sm bg-white border border-slate-200/90 mb-6">
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
                {/* Category Select inside dock */}
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

              {/* Filters Trigger with active badge */}
              <Button 
                variant="outline" 
                className={`w-full sm:w-auto rounded-full h-10 text-xs font-bold transition-all shadow-xs gap-1.5 ${
                  activeFilterCount > 0 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                }`} 
                onClick={handleFilterToggle}
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS BAR (Quick 1-tap dismissal) */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-6 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs animate-in fade-in duration-200">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0 mr-1">
                Active ({activeFilterCount}):
              </span>

              {cat !== "all" && (
                <Badge variant="secondary" className="gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold rounded-full pr-1.5">
                  Domain: {cat}
                  <button onClick={() => handleCatChange("all")} className="hover:bg-indigo-200/60 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {q.trim() && (
                <Badge variant="secondary" className="gap-1.5 bg-slate-100 text-slate-800 border-slate-200 font-semibold rounded-full pr-1.5">
                  "{q}"
                  <button onClick={() => handleSearchChange("")} className="hover:bg-slate-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {(price[0] > 0 || price[1] < 100000) && (
                <Badge variant="secondary" className="gap-1.5 bg-slate-100 text-slate-800 border-slate-200 font-semibold rounded-full pr-1.5">
                  ₹{price[0].toLocaleString()} - ₹{price[1].toLocaleString()}
                  <button onClick={() => setPrice([0, 100000])} className="hover:bg-slate-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {diffs.map(d => (
                <Badge key={d} variant="secondary" className="gap-1.5 bg-slate-100 text-slate-800 border-slate-200 font-semibold rounded-full pr-1.5">
                  {d}
                  <button onClick={() => toggle(diffs, d, setDiffs)} className="hover:bg-slate-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {techs.map(t => (
                <Badge key={t} variant="secondary" className="gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold rounded-full pr-1.5">
                  {t}
                  <button onClick={() => toggle(techs, t, setTechs)} className="hover:bg-indigo-200/60 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              <button
                onClick={resetFilters}
                className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer pl-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* MAIN GRID: Sidebar is hidden on mobile so it NEVER pushes products! */}
          <div className={`grid gap-8 items-start ${desktopSidebarOpen ? "lg:grid-cols-[280px_1fr]" : "grid-cols-1"}`}>
            {/* Desktop Filter Sidebar (Always hidden on mobile, toggled on desktop) */}
            {desktopSidebarOpen && (
              <aside className="hidden lg:block space-y-4 sticky top-28">
                {renderFilterModules()}
              </aside>
            )}

            {/* Results Grid */}
            <div className="w-full">
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
                <div className={`grid gap-5 ${
                  desktopSidebarOpen 
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                }`}>
                  {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE FULL-BLEED SLIDE-OVER SHEET (Never pushes products down) */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent 
          side="bottom" 
          className="lg:hidden max-h-[88vh] p-0 rounded-t-3xl bg-white border-t border-slate-200/90 shadow-2xl flex flex-col z-50 focus:outline-none"
        >
          {/* Top Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Sheet Header */}
          <SheetHeader className="px-6 py-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 text-left shrink-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base font-black text-slate-900">
                Filters & Refinements
              </SheetTitle>
              {activeFilterCount > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 pr-6"
              >
                Reset
              </button>
            )}
          </SheetHeader>

          {/* Scrollable Filter Modules */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {renderFilterModules()}
          </div>

          {/* Sticky Bottom Apply Action Bar */}
          <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center gap-3 shrink-0">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="rounded-full text-xs font-bold text-slate-600 border-slate-200 h-12 px-4"
              >
                Clear
              </Button>
            )}
            <Button
              onClick={() => setMobileDrawerOpen(false)}
              className="flex-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm h-12 shadow-lg shadow-indigo-600/25"
            >
              Show {filtered.length} Blueprints
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
