import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Star, Download, ShieldCheck, Play, FileText, Database, Video } from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import { Project, PROJECTS } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const includeIcons: Record<string, any> = { "Source Code (.zip)": Download, "Documentation (PDF)": FileText, "Dataset": Database, "Demo Video": Video, "Report Template (DOCX)": FileText };

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);

  useEffect(() => {
    const mockProject = PROJECTS.find(p => p.id === id);
    if (mockProject) {
      setProject(mockProject);
      setRelated(PROJECTS.filter(p => p.category === mockProject.category && p.id !== mockProject.id).slice(0, 3));
      return;
    }
    
    supabase.from("projects").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setProject(data as Project);
        supabase.from("projects").select("*").eq("category", data.category).neq("id", data.id).limit(3).then(({ data: rData }) => {
          if (rData) setRelated(rData as Project[]);
        });
      }
    });
  }, [id]);

  if (!project) {
    return (
      <Layout>
        <div className="container-px py-20 text-center text-navy font-medium">Loading project details...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-px py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-navy inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to marketplace</Link>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-6">
            <div>
              <div className="aspect-[16/10] rounded-3xl shadow-elegant relative overflow-hidden" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#ccc' }}>
                {project.video_url ? (
                  <video src={project.video_url} controls poster={project.thumb} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  project.thumb?.startsWith('http') && <img src={project.thumb} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>

              <div className="mt-6">
                <Badge className="bg-secondary text-navy hover:bg-secondary">{project.category}</Badge>
                <h1 className="text-display text-4xl md:text-5xl text-navy mt-3">{project.title}</h1>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <Badge variant="outline" className="rounded-full">{project.difficulty}</Badge>
                </div>
                <p className="text-navy/70 mt-5 text-lg leading-relaxed">{project.description}</p>
              </div>

              <div className="mt-8">
                <h3 className="font-medium text-navy mb-3">Tech stack</h3>
                <div className="flex flex-wrap gap-2">
                  {(project.tech || []).map(t => <span key={t} className="px-3 py-1.5 rounded-full bg-secondary text-navy text-sm">{t}</span>)}
                </div>
              </div>

              {((project.features || []).length > 0 || (project.screenshots || []).length > 0) && (
                <Tabs defaultValue={(project.features || []).length > 0 ? "features" : "screens"} className="mt-10">
                  <TabsList className="rounded-full bg-secondary p-1">
                    {(project.features || []).length > 0 && <TabsTrigger value="features" className="rounded-full">Features</TabsTrigger>}
                    {(project.screenshots || []).length > 0 && <TabsTrigger value="screens" className="rounded-full">Screenshots</TabsTrigger>}
                  </TabsList>
                  
                  {(project.features || []).length > 0 && (
                    <TabsContent value="features" className="mt-6 bg-white rounded-3xl p-6 border border-border shadow-soft">
                      <ul className="space-y-3">
                        {project.features!.map(f => (
                          <li key={f} className="flex items-start gap-3 text-navy">
                            <div className="w-5 h-5 rounded-full bg-primary/10 grid place-items-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-primary" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  )}
                  
                  {(project.screenshots || []).length > 0 && (
                    <TabsContent value="screens" className="mt-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {project.screenshots!.map((img, i) => (
                          <div key={i} className="aspect-video rounded-2xl shadow-soft overflow-hidden">
                            <img src={img} alt="Screenshot" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
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
                    {(project.includes || []).length > 0 ? (project.includes || []).map(i => {
                      const Icon = includeIcons[i] ?? FileText;
                      return <li key={i} className="flex items-center gap-2 text-sm text-navy/80"><Icon className="w-4 h-4 text-primary" />{i}</li>;
                    }) : <li className="text-sm text-navy/60">Source code included</li>}
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
