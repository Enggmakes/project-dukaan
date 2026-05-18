import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Star, Download, ShieldCheck, Play, FileText, Database, Video, MapPin, Phone, Mail, Loader2, Package, Truck, CheckCircle2, ShoppingBag, X } from "lucide-react";
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

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return toast.error("Please fill in all required fields.");
    }
    if (!form.email.includes("@")) {
      return toast.error("Please enter a valid email address.");
    }

    if (project.delivery_type === "physical") {
      if (!form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        return toast.error("Please provide complete shipping details for your hardware kit.");
      }
      if (form.phone.trim().length < 10) {
        return toast.error("Please enter a valid phone number.");
      }
    }

    setIsPaying(true);
    const toastId = toast.loading("Processing secure UPI/Card payment...");

    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      toast.success("Payment successful! Order processed.", { id: toastId });
    }, 2000);
  };

  const handleDownloadMock = () => {
    const toastId = toast.loading("Preparing download package...");
    setTimeout(() => {
      toast.success("Source Code Zip downloaded successfully!", { id: toastId });
    }, 1500);
  };

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
                <Button 
                  className="w-full rounded-full bg-primary hover:bg-primary/90 h-12 mt-5 text-sm font-semibold flex items-center justify-center gap-2 shadow-elegant" 
                  onClick={() => {
                    setIsCheckoutOpen(true);
                    setPaymentSuccess(false);
                  }}
                >
                  {project.delivery_type === "physical" ? (
                    <>Buy & ship hardware kit 🤖</>
                  ) : (
                    <>Buy & download now 💻</>
                  )}
                </Button>
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

      {/* Premium Glassmorphism Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white/95 rounded-[2rem] w-full max-w-lg border border-border shadow-2xl relative overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-navy">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsCheckoutOpen(false)} 
              className="absolute top-5 right-5 text-navy/40 hover:text-navy hover:bg-secondary p-1.5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {!paymentSuccess ? (
              /* --- Checkout Form --- */
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider block">Secure Checkout</span>
                  <h3 className="text-2xl font-bold text-navy mt-1">
                    {project.delivery_type === "physical" ? "🤖 Ship Hardware Kit" : "💻 Digital Download"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Project: <strong className="text-navy">{project.title}</strong> · Price: <strong className="text-primary">₹{project.price.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-semibold text-navy/70 block mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={form.name} 
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Your Name" 
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-navy/70 block mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com" 
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {project.delivery_type === "physical" && (
                    /* --- Physical Shipping Fields --- */
                    <div className="space-y-4 pt-1 border-t border-border/50">
                      <span className="text-xs font-bold text-primary block">📍 Shipping Details</span>
                      
                      {/* Phone */}
                      <div>
                        <label className="text-xs font-semibold text-navy/70 block mb-1">Phone Number *</label>
                        <input 
                          type="tel" 
                          required
                          value={form.phone} 
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="10-digit mobile number" 
                          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="text-xs font-semibold text-navy/70 block mb-1">Full Address *</label>
                        <textarea 
                          required
                          rows={2}
                          value={form.address} 
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="House No, Building, Street, Area" 
                          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60 resize-none"
                        />
                      </div>

                      {/* City & State & Pincode Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-navy/70 block mb-1">City *</label>
                          <input 
                            type="text" 
                            required
                            value={form.city} 
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            placeholder="City" 
                            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-navy/70 block mb-1">State *</label>
                          <input 
                            type="text" 
                            required
                            value={form.state} 
                            onChange={e => setForm({ ...form, state: e.target.value })}
                            placeholder="State" 
                            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-navy/70 block mb-1">Pincode *</label>
                          <input 
                            type="text" 
                            required
                            value={form.pincode} 
                            onChange={e => setForm({ ...form, pincode: e.target.value })}
                            placeholder="6-digit" 
                            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-navy placeholder:text-muted-foreground/60"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isPaying} 
                    className="w-full rounded-full bg-primary hover:bg-primary/90 h-12 text-sm font-semibold flex items-center justify-center gap-2 shadow-elegant disabled:opacity-50"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Secure Payment...
                      </>
                    ) : (
                      <>Pay ₹{project.price.toLocaleString()} via Secure UPI</>
                    )}
                  </Button>
                  <span className="text-[10px] text-muted-foreground text-center block mt-2">🛡️ Secured by 256-bit SSL encryption & BHIM UPI</span>
                </div>
              </form>
            ) : (
              /* --- Success State --- */
              <div className="text-center py-4 space-y-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-navy">
                    {project.delivery_type === "physical" ? "🎉 Order Confirmed!" : "🎉 Payment Successful!"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thank you, {form.name}! Your purchase was completed.
                  </p>
                </div>

                {project.delivery_type === "physical" ? (
                  /* --- Hardware Delivery Timeline Tracker --- */
                  <div className="bg-secondary/60 border border-border rounded-2xl p-5 text-left space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4" />
                      Delivery Timeline Tracker
                    </div>

                    {/* Tracker Steps */}
                    <div className="space-y-4 relative pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                      
                      {/* Step 1: Placed */}
                      <div className="relative flex gap-3 text-xs">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20" />
                        <div>
                          <strong className="text-navy block">Order Placed Successfully</strong>
                          <span className="text-muted-foreground text-[10px]">Payment processed. Preparing kit now.</span>
                        </div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative flex gap-3 text-xs">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-primary animate-pulse border-2 border-white ring-2 ring-primary/20" />
                        <div>
                          <strong className="text-navy block">Packing & Testing Hardware</strong>
                          <span className="text-muted-foreground text-[10px]">Our engineers are checking sensors & microcontrollers.</span>
                        </div>
                      </div>

                      {/* Step 3: Dispatched */}
                      <div className="relative flex gap-3 text-xs opacity-60">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-muted border-2 border-white" />
                        <div>
                          <strong className="text-navy block">Dispatch via DTDC Courier</strong>
                          <span className="text-muted-foreground text-[10px]">Tracking ID will be sent to your email.</span>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative flex gap-3 text-xs opacity-60">
                        <span className="absolute -left-[22px] w-3 h-3 rounded-full bg-muted border-2 border-white" />
                        <div>
                          <strong className="text-navy block">Out for Delivery</strong>
                          <span className="text-muted-foreground text-[10px]">Estimated delivery to your address: 5-7 working days.</span>
                        </div>
                      </div>

                    </div>

                    {/* Shipping Address Summary */}
                    <div className="border-t border-border/70 pt-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Shipping to:</span>
                      <div className="flex items-start gap-1.5 text-navy mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="leading-tight font-medium">
                          {form.address}, {form.city}, {form.state} - {form.pincode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-navy/70 mt-1">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{form.phone}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- Digital Download Action --- */
                  <div className="bg-secondary/60 border border-border rounded-2xl p-6 space-y-3 text-center">
                    <Package className="w-12 h-12 text-primary mx-auto opacity-70 animate-bounce" />
                    <div className="text-xs">
                      <strong className="text-navy block text-sm">Download is ready!</strong>
                      <span className="text-muted-foreground">Click below to fetch the production-ready source code .zip and documentation PDF.</span>
                    </div>
                    <Button 
                      onClick={handleDownloadMock}
                      className="w-full mt-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 font-semibold flex items-center justify-center gap-2 shadow-elegant"
                    >
                      <Download className="w-4 h-4" />
                      Download Project ZIP 📥
                    </Button>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-full rounded-full bg-navy text-white hover:bg-navy-light h-11 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Continue Exploring
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
