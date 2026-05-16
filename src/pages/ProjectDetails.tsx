import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Star, Download, ShieldCheck, Play, FileText, Database, Video } from "lucide-react";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import { PROJECTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const includeIcons: Record<string, any> = { "Source Code (.zip)": Download, "Documentation (PDF)": FileText, "Dataset": Database, "Demo Video": Video, "Report Template (DOCX)": FileText };

export default function ProjectDetails() {
  const { id } = useParams();
  const project = PROJECTS.find(p => p.id === id) ?? PROJECTS[0];
  const related = PROJECTS.filter(p => p.category === project.category && p.id !== project.id).slice(0, 3);

  return (
    <Layout>
      <div className="container-px py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-navy inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to marketplace</Link>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-6">
            <div>
              <div className="aspect-[16/10] rounded-3xl shadow-elegant relative overflow-hidden" style={{ background: project.thumb }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <button className="absolute inset-0 grid place-items-center group">
                  <div className="w-16 h-16 rounded-full glass grid place-items-center group-hover:scale-110 transition-transform"><Play className="w-6 h-6 text-navy fill-navy ml-1" /></div>
                </button>
              </div>

              <div className="mt-6">
                <Badge className="bg-secondary text-navy hover:bg-secondary">{project.category}</Badge>
                <h1 className="text-display text-4xl md:text-5xl text-navy mt-3">{project.title}</h1>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><b>{project.rating.toFixed(1)}</b> <span className="text-muted-foreground">({project.reviews})</span></span>
                  <Badge variant="outline" className="rounded-full">{project.difficulty}</Badge>
                </div>
                <p className="text-navy/70 mt-5 text-lg leading-relaxed">{project.description}</p>
              </div>

              <div className="mt-8">
                <h3 className="font-medium text-navy mb-3">Tech stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map(t => <span key={t} className="px-3 py-1.5 rounded-full bg-secondary text-navy text-sm">{t}</span>)}
                </div>
              </div>

              <Tabs defaultValue="features" className="mt-10">
                <TabsList className="rounded-full bg-secondary p-1">
                  <TabsTrigger value="features" className="rounded-full">Features</TabsTrigger>
                  <TabsTrigger value="screens" className="rounded-full">Screenshots</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-full">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="features" className="mt-6 bg-white rounded-3xl p-6 border border-border shadow-soft">
                  <ul className="space-y-3">
                    {project.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-navy">
                        <div className="w-5 h-5 rounded-full bg-primary/10 grid place-items-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-primary" /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="screens" className="mt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-video rounded-2xl shadow-soft" style={{ background: project.thumb, filter: `hue-rotate(${i * 40}deg)` }} />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-6 space-y-4">
                  {[
                    { name: "Aarav K.", text: "Worked out of the box. Saved me weeks of grunt work." },
                    { name: "Sneha P.", text: "Documentation is exceptional — my professor was impressed." },
                    { name: "Yusuf A.", text: "Great architecture. Easy to extend with my own features." },
                  ].map((r, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-gradient grid place-items-center text-white text-xs">{r.name[0]}</div>
                        <div>
                          <div className="text-sm font-medium text-navy">{r.name}</div>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-navy/70 mt-3">{r.text}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-white rounded-3xl p-6 border border-border shadow-elegant">
                <div className="text-4xl font-semibold text-navy">₹{project.price.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">One-time purchase · lifetime access</div>
                <Button className="w-full rounded-full bg-primary hover:bg-primary/90 h-12 mt-5" onClick={() => toast.success("Added to cart")}>Buy & download now</Button>
                <Button variant="outline" className="w-full rounded-full h-12 mt-2">Add to wishlist</Button>
                <div className="mt-5 pt-5 border-t border-border">
                  <h4 className="font-medium text-navy mb-3 text-sm">What's included</h4>
                  <ul className="space-y-2">
                    {project.includes.map(i => {
                      const Icon = includeIcons[i] ?? FileText;
                      return <li key={i} className="flex items-center gap-2 text-sm text-navy/80"><Icon className="w-4 h-4 text-primary" />{i}</li>;
                    })}
                  </ul>
                </div>
                <div className="mt-5 pt-5 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> 7-day money-back guarantee
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="text-display text-3xl text-navy mb-6">Related projects</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
