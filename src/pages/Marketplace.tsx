import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  SlidersHorizontal, 
  Search, 
  X, 
  Check, 
  RotateCcw, 
  Zap, 
  GraduationCap, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Tag, 
  ArrowUpDown 
} from "lucide-react";
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
    setSort("latest");
    setQ("");
    setTechSearch("");
    setSearchParams(new URLSearchParams());
  };

  const ALL_TECH = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tech || []))).sort(), [projects]);

  // Top popular technologies for Bento quick-selection
  const popularTech = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      (p.tech || []).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tech]) => tech);
  }, [projects]);

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
    if (sort !== "latest") count++;
    return count;
  }, [cat, diffs, techs, price, q, sort]);

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

  // Reusable Hybrid Bento Filter Grid
  const renderBentoFilterGrid = (isInsideDrawer = false) => (
    <div className={isInsideDrawer ? "grid grid-cols-1 md:grid-cols-2 gap-3.5" : "space-y-4"}>
      {/* BENTO CELL 1: Price Range & Budget Dial */}
      <div className="bento-card p-4 sm:p-5 bg-[#090e1c] border border-slate-800/90 rounded-2xl shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>BUDGET & PRICE</span>
            </div>
            {(price[0] > 0 || price[1] < 100000) && (
              <button
                type="button"
                onClick={() => setPrice([0, 100000])}
                className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="flex justify-between items-baseline text-xs mb-3">
            <span className="font-mono font-bold text-amber-400 bg-[#070a12] px-2.5 py-1 rounded-lg border border-slate-800">
              ₹{price[0].toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">to</span>
            <span className="font-mono font-bold text-cyan-400 bg-[#070a12] px-2.5 py-1 rounded-lg border border-slate-800">
              ₹{price[1].toLocaleString()}
            </span>
          </div>

          <Slider value={price} onValueChange={setPrice} max={100000} step={500} min={0} className="my-2" />
        </div>

        {/* 3 Quick Bento Budget Brackets */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setPrice([0, 5000])}
            className={`px-2 py-1.5 text-[11px] font-mono font-semibold rounded-xl border transition-all text-center cursor-pointer ${
              price[0] === 0 && price[1] === 5000
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-bold"
                : "bg-[#070a12] text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
            }`}
          >
            &lt; ₹5,000
          </button>
          <button
            type="button"
            onClick={() => setPrice([5000, 20000])}
            className={`px-2 py-1.5 text-[11px] font-mono font-semibold rounded-xl border transition-all text-center cursor-pointer ${
              price[0] === 5000 && price[1] === 20000
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-bold"
                : "bg-[#070a12] text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
            }`}
          >
            ₹5k - ₹20k
          </button>
          <button
            type="button"
            onClick={() => setPrice([20000, 100000])}
            className={`px-2 py-1.5 text-[11px] font-mono font-semibold rounded-xl border transition-all text-center cursor-pointer ${
              price[0] === 20000 && price[1] === 100000
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-bold"
                : "bg-[#070a12] text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
            }`}
          >
            ₹20,000+
          </button>
        </div>
      </div>

      {/* BENTO CELL 2: Difficulty Level Matrix */}
      <div className="bento-card p-4 sm:p-5 bg-[#090e1c] border border-slate-800/90 rounded-2xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>DIFFICULTY LEVEL</span>
          </div>
          {diffs.length > 0 && (
            <button
              type="button"
              onClick={() => setDiffs([])}
              className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {DIFFICULTIES.map(d => {
            const isSelected = diffs.includes(d);
            const indicatorColor = 
              d === "Beginner" ? "bg-emerald-400" :
              d === "Intermediate" ? "bg-amber-400" : "bg-cyan-400";

            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(diffs, d, setDiffs)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all border flex items-center justify-between cursor-pointer select-none ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs font-bold"
                    : "bg-[#070a12] text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? indicatorColor + " animate-pulse" : indicatorColor}`} />
                  <span className="text-xs font-mono">{d}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-mono text-slate-500 mt-2.5 font-medium text-center">
          {diffs.length === 0 ? "Showing all skill tiers" : `${diffs.length} tier(s) selected`}
        </p>
      </div>

      {/* BENTO CELL 3: Sort & Ranking Matrix (in drawer) */}
      {isInsideDrawer && (
        <div className="bento-card p-4 sm:p-5 bg-[#090e1c] border border-slate-800/90 rounded-2xl shadow-xl md:col-span-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase tracking-wider mb-2.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>ORDER & PRIORITIZATION</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "latest", label: "Latest Releases", icon: Sparkles },
              { id: "popular", label: "Most Popular", icon: Flame },
              { id: "rating", label: "Highest Rated", icon: TrendingUp },
              { id: "price-low", label: "Lowest Price", icon: Tag },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = sort === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSort(item.id)}
                  className={`p-2.5 rounded-xl text-xs font-mono font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                      : "bg-[#070a12] text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BENTO CELL 4: Tech Stack Command Center (Hero Bento Tile) */}
      <div className={`bento-card p-4 sm:p-5 bg-[#090e1c] border border-slate-800/90 rounded-2xl shadow-xl ${isInsideDrawer ? "md:col-span-2" : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#070a12] border border-slate-800 text-cyan-400 grid place-items-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Tech Stack Hub</h4>
            <span className="text-[10px] text-slate-500 font-mono bg-[#070a12] px-2 py-0.5 rounded-full border border-slate-800">
              {ALL_TECH.length} Available
            </span>
          </div>
          {techs.length > 0 && (
            <button
              type="button"
              onClick={() => setTechs([])}
              className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Clear ({techs.length})
            </button>
          )}
        </div>

        {/* Quick Popular Stacks Bento Bar */}
        {popularTech.length > 0 && !techSearch && (
          <div className="mb-3">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Popular Technologies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularTech.map(t => {
                const isSelected = techs.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggle(techs, t, setTechs)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs font-bold"
                        : "bg-[#070a12] text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 text-cyan-300" /> : <Sparkles className="w-2.5 h-2.5 text-slate-500" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Search input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={techSearch}
            onChange={e => setTechSearch(e.target.value)}
            placeholder="Search technologies (PyTorch, ROS 2, ESP32)..."
            className="h-9 text-xs pl-8 pr-7 bg-[#070a12] border-slate-800 rounded-xl placeholder:text-slate-600 text-white font-mono"
          />
          {techSearch && (
            <button
              type="button"
              onClick={() => setTechSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scrollable Tag Cloud with bounded height */}
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {filteredTechList.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 py-3 text-center w-full">No technologies match "{techSearch}"</p>
          ) : (
            filteredTechList.map(t => {
              const isSelected = techs.includes(t);
              return (
                <Badge
                  key={t}
                  onClick={() => toggle(techs, t, setTechs)}
                  className={`cursor-pointer rounded-full text-[11px] font-mono font-semibold transition-all py-1 px-2.5 ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs hover:bg-amber-400"
                      : "bg-[#070a12] text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 mr-1 inline text-slate-950" />}
                  {t}
                </Badge>
              );
            })
          )}
        </div>
      </div>

      {activeFilterCount > 0 && !isInsideDrawer && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="w-full text-xs font-mono font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl h-9 gap-1.5 cursor-pointer"
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

      {/* FULL BLEED MARKETPLACE HERO - CYBER-DECK THEME */}
      <div className="relative overflow-hidden -mt-24 pt-32 pb-14 bg-[#070a12] border-b border-slate-800/80 bleed-container">
        {/* Ambient Top Glow & Lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-amber-500/5 blur-3xl pointer-events-none" />
        <MeshGradient className="absolute inset-0 opacity-20 pointer-events-none" />

        <div className="container-px max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0d121e] border border-amber-500/40 text-xs text-amber-300 font-mono font-semibold mb-3 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYS:\VERIFIED_REPOSITORIES_v2.6
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-black tracking-tight font-mono leading-tight">
                PROJECT_<span className="text-amber-400">MARKETPLACE</span>
              </h1>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm md:text-base font-mono max-w-xl leading-relaxed">
                Explore {projects.length}+ production-ready codebases with architecture diagrams, IEEE schematics, and thesis documentation.
              </p>
            </div>

            <div className="text-xs font-mono font-semibold text-slate-400 bg-[#090e1c] px-4 py-2.5 rounded-xl border border-slate-800/90 shadow-lg shrink-0">
              INDEXED: <span className="text-amber-400 font-bold font-mono">{filtered.length}</span> / {projects.length} BLUEPRINTS
            </div>
          </div>

          {/* Quick Domain Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap mt-6 pt-6 border-t border-slate-800/80 font-mono">
            <button
              onClick={() => handleCatChange("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                cat === "all"
                  ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-[#090e1c] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              ALL_DOMAINS
            </button>
            {CATEGORIES.map(c => {
              const isActive = cat === c || cat.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => handleCatChange(c)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "bg-[#090e1c] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="container-px py-8 md:py-10 bleed-container bg-[#070a12]">
        <div className="max-w-6xl mx-auto">
          {/* Bento Search & Filter Dock */}
          <div className="p-3 md:p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative z-10 shadow-xl bg-[#090e1c] border border-slate-800/90 rounded-2xl mb-4 font-mono">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-4 py-1 md:py-0 bg-[#070a12] rounded-xl border border-slate-800 focus-within:ring-1 focus-within:ring-amber-500/30 focus-within:border-amber-500/60 transition-all">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <Input 
                value={q} 
                onChange={e => handleSearchChange(e.target.value)} 
                placeholder="Search keywords, tags, author, or architecture..." 
                className="border-0 bg-transparent focus-visible:ring-0 h-10 text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono" 
              />
            </div>

            {/* Selects & Controls Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1">
                {/* Category Select inside dock */}
                <div className="flex-1 sm:flex-none">
                  <Select value={cat} onValueChange={handleCatChange}>
                    <SelectTrigger className="w-full sm:w-44 rounded-xl bg-[#070a12] border-slate-800 text-xs font-mono font-semibold text-slate-300 shadow-none h-10 hover:border-slate-700">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c101d] border-slate-800 rounded-xl shadow-2xl text-slate-200 font-mono">
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Select */}
                <div className="flex-1 sm:flex-none">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full sm:w-40 rounded-xl bg-[#070a12] border-slate-800 text-xs font-mono font-semibold text-slate-300 shadow-none h-10 hover:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c101d] border-slate-800 rounded-xl shadow-2xl text-slate-200 font-mono">
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
                className={`w-full sm:w-auto rounded-xl h-10 text-xs font-mono font-bold transition-all shadow-md gap-2 ${
                  activeFilterCount > 0 
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]" 
                    : "bg-[#070a12] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-[#0d121e]"
                }`} 
                onClick={handleFilterToggle}
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-mono font-black leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* HYBRID BENTO QUICK-FILTER RIBBON */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 mb-5 font-mono">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              SYS_FILTERS:
            </span>

            {/* Quick Under ₹5k */}
            <button
              type="button"
              onClick={() => {
                if (price[0] === 0 && price[1] === 5000) {
                  setPrice([0, 100000]);
                } else {
                  setPrice([0, 5000]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                price[0] === 0 && price[1] === 5000
                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-black"
                  : "bg-[#090e1c] text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Under ₹5,000</span>
            </button>

            {/* Quick Beginner Friendly */}
            <button
              type="button"
              onClick={() => toggle(diffs, "Beginner", setDiffs)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                diffs.includes("Beginner")
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-black"
                  : "bg-[#090e1c] text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Beginner Friendly</span>
            </button>

            {/* Quick Most Popular */}
            <button
              type="button"
              onClick={() => setSort(sort === "popular" ? "latest" : "popular")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                sort === "popular"
                  ? "bg-rose-500 text-slate-950 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-black"
                  : "bg-[#090e1c] text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Trending Hits</span>
            </button>

            {/* Quick Top Technologies */}
            {popularTech.slice(0, 3).map(tech => {
              const isSelected = techs.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggle(techs, tech, setTechs)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-black"
                      : "bg-[#090e1c] text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>{tech}</span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE FILTER CHIPS BAR */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-6 p-3 rounded-xl bg-[#090e1c] border border-slate-800/90 shadow-lg text-xs font-mono animate-in fade-in duration-200">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0 mr-1">
                ACTIVE ({activeFilterCount}):
              </span>

              {cat !== "all" && (
                <Badge variant="secondary" className="gap-1.5 bg-[#070a12] text-amber-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  Domain: {cat}
                  <button onClick={() => handleCatChange("all")} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {sort !== "latest" && (
                <Badge variant="secondary" className="gap-1.5 bg-[#070a12] text-slate-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  Sort: {sort}
                  <button onClick={() => setSort("latest")} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {q.trim() && (
                <Badge variant="secondary" className="gap-1.5 bg-[#070a12] text-slate-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  "{q}"
                  <button onClick={() => handleSearchChange("")} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {(price[0] > 0 || price[1] < 100000) && (
                <Badge variant="secondary" className="gap-1.5 bg-[#070a12] text-slate-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  ₹{price[0].toLocaleString()} - ₹{price[1].toLocaleString()}
                  <button onClick={() => setPrice([0, 100000])} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {diffs.map(d => (
                <Badge key={d} variant="secondary" className="gap-1.5 bg-[#070a12] text-emerald-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  {d}
                  <button onClick={() => toggle(diffs, d, setDiffs)} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {techs.map(t => (
                <Badge key={t} variant="secondary" className="gap-1.5 bg-[#070a12] text-cyan-300 border border-slate-800 font-mono font-semibold rounded-md pr-1.5">
                  {t}
                  <button onClick={() => toggle(techs, t, setTechs)} className="hover:bg-slate-800 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              <button
                onClick={resetFilters}
                className="ml-auto text-xs font-mono font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer pl-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* MAIN GRID */}
          <div className={`grid gap-8 items-start ${desktopSidebarOpen ? "lg:grid-cols-[280px_1fr]" : "grid-cols-1"}`}>
            {/* Desktop Filter Sidebar */}
            {desktopSidebarOpen && (
              <aside className="hidden lg:block space-y-4 sticky top-28">
                {renderBentoFilterGrid(false)}
              </aside>
            )}

            {/* Results Grid */}
            <div className="w-full">
              {isLoading ? (
                <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-16 text-center shadow-xl font-mono">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold">SYNCHRONIZING BLUEPRINT INDEX...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-16 text-center shadow-xl font-mono">
                  <div className="w-12 h-12 rounded-xl bg-[#070a12] border border-slate-800 grid place-items-center text-amber-400 mx-auto mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide">NO BLUEPRINTS MATCHED</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto font-mono">
                    Zero repositories match query parameters. Try widening filters or reset search terms.
                  </p>
                  <Button 
                    onClick={resetFilters}
                    className="mt-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black px-6 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    RESET QUERY FILTERS
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

      {/* HYBRID BENTO SLIDE-OVER SHEET */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent 
          side="bottom" 
          className="max-h-[92vh] md:max-h-[85vh] md:max-w-2xl md:mx-auto md:rounded-2xl p-0 rounded-t-2xl bg-[#070a12] border-t md:border border-slate-800 text-slate-100 shadow-2xl flex flex-col z-50 focus:outline-none"
        >
          {/* Top Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Sheet Header */}
          <SheetHeader className="px-6 py-3.5 border-b border-slate-800 bg-[#090e1c] flex flex-row items-center justify-between space-y-0 text-left shrink-0 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 grid place-items-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-black text-white font-mono uppercase tracking-wide leading-tight">
                  Bento Filter Hub
                </SheetTitle>
                <p className="text-[11px] text-slate-400 font-mono">
                  {filtered.length} matching blueprints
                </p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters}
                className="text-xs font-mono font-bold text-rose-400 hover:text-rose-300 pr-6"
              >
                Reset All ({activeFilterCount})
              </button>
            )}
          </SheetHeader>

          {/* Scrollable Bento Grid Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
            {renderBentoFilterGrid(true)}
          </div>

          {/* Sticky Bottom Apply Action Bar */}
          <div className="p-4 border-t border-slate-800 bg-[#090e1c] flex items-center gap-3 shrink-0 font-mono">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="rounded-xl text-xs font-mono font-bold text-slate-300 border-slate-800 h-11 px-4 hover:bg-[#070a12] hover:text-white"
              >
                Clear
              </Button>
            )}
            <Button
              onClick={() => setMobileDrawerOpen(false)}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm h-11 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>SHOW {filtered.length} BLUEPRINTS</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
