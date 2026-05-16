import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SlidersHorizontal, Search } from "lucide-react";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import { CATEGORIES, PROJECTS } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const ALL_TECH = Array.from(new Set(PROJECTS.flatMap(p => p.tech))).sort();
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export default function Marketplace() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [sort, setSort] = useState("latest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [price, setPrice] = useState([0, 10000]);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setCat(params.get("cat") ?? "all"); setQ(params.get("q") ?? ""); }, [params]);

  const filtered = useMemo(() => {
    let r = PROJECTS.filter(p =>
      (cat === "all" || p.category === cat) &&
      (q === "" || (p.title + p.short + p.tech.join(" ")).toLowerCase().includes(q.toLowerCase())) &&
      p.price >= price[0] && p.price <= price[1] &&
      (diffs.length === 0 || diffs.includes(p.difficulty)) &&
      (techs.length === 0 || techs.some(t => p.tech.includes(t)))
    );
    if (sort === "popular") r = [...r].sort((a, b) => b.reviews - a.reviews);
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "price-low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-high") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, cat, sort, price, diffs, techs]);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <Layout>
      <section className="bg-mesh py-16">
        <div className="container-px max-w-6xl mx-auto">
          <h1 className="text-display text-5xl md:text-6xl text-navy">Marketplace</h1>
          <p className="text-navy/60 mt-3 text-lg">{PROJECTS.length}+ production-ready projects, instant download.</p>
        </div>
      </section>

      <section className="container-px py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-soft border border-border p-4 flex flex-wrap gap-3 items-center sticky top-24 z-30">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 bg-secondary rounded-full">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="border-0 bg-transparent focus-visible:ring-0" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-44 rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40 rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="price-low">Price ↑</SelectItem>
                <SelectItem value="price-high">Price ↓</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-full" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Filters
            </Button>
            <div className="flex bg-secondary rounded-full p-1">
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-full ${view === "grid" ? "bg-white shadow-soft" : ""}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView("list")} className={`p-1.5 rounded-full ${view === "list" ? "bg-white shadow-soft" : ""}`}><List className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-8 mt-8">
            <aside className={`${showFilters ? "block" : "hidden lg:block"} space-y-6`}>
              <div className="bg-white rounded-3xl p-5 border border-border shadow-soft">
                <h4 className="font-medium text-navy mb-3">Price range</h4>
                <Slider value={price} onValueChange={setPrice} max={10000} step={500} />
                <div className="flex justify-between text-xs text-muted-foreground mt-3"><span>₹{price[0]}</span><span>₹{price[1]}</span></div>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-border shadow-soft">
                <h4 className="font-medium text-navy mb-3">Difficulty</h4>
                <div className="space-y-2">
                  {DIFFICULTIES.map(d => (
                    <label key={d} className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                      <Checkbox checked={diffs.includes(d)} onCheckedChange={() => toggle(diffs, d, setDiffs)} />{d}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-border shadow-soft">
                <h4 className="font-medium text-navy mb-3">Technologies</h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-auto">
                  {ALL_TECH.map(t => (
                    <Badge key={t} onClick={() => toggle(techs, t, setTechs)}
                      className={`cursor-pointer rounded-full ${techs.includes(t) ? "bg-primary text-white hover:bg-primary" : "bg-secondary text-navy hover:bg-secondary"}`}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="text-sm text-muted-foreground mb-4">{filtered.length} projects</div>
              {filtered.length === 0 ? (
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
