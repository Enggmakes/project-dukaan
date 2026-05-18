import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, IndianRupee, Activity, MoreHorizontal, Bell, ChevronDown, Plus, Image as ImageIcon, Mail, Trash2, CheckCircle, LogOut, Globe } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CATEGORIES } from "@/lib/mockData";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";

const LEADS = [
  { id: "LD-2104", name: "Aarav Khanna", project: "AI Resume Screener", category: "AI & ML", budget: "₹15k–50k", status: "New", date: "2h ago" },
  { id: "LD-2103", name: "Priya Iyer", project: "Smart Mirror IoT", category: "IoT", budget: "₹5k–15k", status: "Contacted", date: "5h ago" },
  { id: "LD-2102", name: "Marco Rossi", project: "GPT Support Bot", category: "AI & ML", budget: "₹50k+", status: "Quoted", date: "1d ago" },
  { id: "LD-2101", name: "Sneha Patil", project: "Lane Detection", category: "Computer Vision", budget: "₹15k–50k", status: "Won", date: "2d ago" },
  { id: "LD-2100", name: "Rohan Mehta", project: "NFT Marketplace", category: "Blockchain", budget: "₹50k+", status: "New", date: "2d ago" },
  { id: "LD-2099", name: "Yusuf Ahmed", project: "Crop Detector", category: "Deep Learning", budget: "<₹5k", status: "Lost", date: "3d ago" },
  { id: "LD-2098", name: "Ananya Sharma", project: "Fitness Tracker App", category: "Mobile", budget: "₹15k–50k", status: "Contacted", date: "4d ago" },
];

const statusColor: Record<string, string> = {
  New: "bg-primary/10 text-primary",
  Reviewing: "bg-sky-100 text-sky-700",
  Contacted: "bg-amber-100 text-amber-700",
  Quoted: "bg-violet-100 text-violet-700",
  "In Progress": "bg-orange-100 text-orange-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAdminAccess = (session: any) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (session.user.email !== adminEmail) {
        navigate("/");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminAccess(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminAccess(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [leads, setLeads] = useState<any[]>(LEADS);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("leads");
  const [readMessages, setReadMessages] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('custom_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        const formattedLeads = data.map(d => ({
          rawId: d.id,
          id: d.id.split('-')[0].toUpperCase(),
          name: d.full_name,
          email: d.email,
          project: d.title,
          category: d.category,
          budget: d.budget,
          status: d.status,
          date: new Date(d.created_at).toLocaleDateString()
        }));
        setLeads([...formattedLeads, ...LEADS]);
      }
    });

    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMessages(data);
    });
  }, []);

  const updateLeadStatus = async (lead: any, newStatus: string) => {
    // Only update in Supabase for real leads (UUID id format)
    if (lead.rawId) {
      const { error } = await supabase.from('custom_requests').update({ status: newStatus }).eq('id', lead.rawId);
      if (error) { toast.error("Failed to update status"); return; }
    }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    toast.success(`Status updated to "${newStatus}"`);
  };

  const deleteLead = async (lead: any) => {
    if (!confirm(`Delete lead from ${lead.name}? This cannot be undone.`)) return;
    if (lead.rawId) {
      const { error } = await supabase.from('custom_requests').delete().eq('id', lead.rawId);
      if (error) { toast.error("Failed to delete lead"); return; }
    }
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    toast.success("Lead deleted");
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) { toast.error("Failed to delete message"); return; }
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success("Message deleted");
  };

  const handleNotificationClickLead = async (lead: any) => {
    setActiveTab("leads");
    if (lead.status === "New") {
      await updateLeadStatus(lead, "Reviewing");
    }
  };

  const handleNotificationClickMessage = (msgId: string) => {
    setActiveTab("messages");
    setReadMessages(prev => [...prev, msgId]);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    category: "AI & Machine Learning",
    price: "",
    difficulty: "Beginner",
    tech: "",
    features: "",
    includes: "",
    image: null as File | null,
    video: null as File | null,
    screenshots: null as FileList | null
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.image) return toast.error("Please select a cover image.");

    setIsUploading(true);
    const toastId = toast.loading("Publishing project...");

    try {
      const fileExt = newProject.image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: imgError } = await supabase.storage
        .from('project-images')
        .upload(fileName, newProject.image);

      if (imgError) throw new Error("Image upload failed: " + imgError.message);

      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      let screenshotUrls: string[] = [];
      if (newProject.screenshots && newProject.screenshots.length > 0) {
        for (let i = 0; i < newProject.screenshots.length; i++) {
          const file = newProject.screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          const { error: ssError } = await supabase.storage.from('project-images').upload(fileName, file);
          if (ssError) throw new Error("Screenshot upload failed: " + ssError.message);

          const { data: ssUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
          screenshotUrls.push(ssUrlData.publicUrl);
        }
      }

      let videoUrl = null;
      if (newProject.video) {
        const fileExt = newProject.video.name.split('.').pop();
        const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: vidError } = await supabase.storage.from('project-images').upload(fileName, newProject.video);
        if (vidError) throw new Error("Video upload failed: " + vidError.message);

        const { data: vidUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
        videoUrl = vidUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('projects').insert({
        title: newProject.title,
        short: "Production-ready project with full source code.",
        description: newProject.description,
        category: newProject.category,
        difficulty: newProject.difficulty,
        price: Number(newProject.price),
        tech: newProject.tech.split(',').map(t => t.trim()).filter(Boolean),
        features: newProject.features.split('\n').map(t => t.trim()).filter(Boolean),
        includes: newProject.includes.split('\n').map(t => t.trim()).filter(Boolean),
        screenshots: screenshotUrls,
        video_url: videoUrl,
        thumb: publicUrlData.publicUrl
      });

      if (dbError) throw new Error("Database error: " + dbError.message);

      // Fetch all subscribers to notify them via EmailJS
      try {
        const { data: subscribers } = await supabase.from('subscribers').select('email');
        if (subscribers && subscribers.length > 0) {
          for (const sub of subscribers) {
            const emailParams = {
              fullName: "ProjectDukaan Subscriber",
              email: sub.email, // Maps to {{email}} in your EmailJS template settings
              phone: "N/A",
              college: "N/A",
              title: `🎉 NEW PROJECT: ${newProject.title}`,
              category: newProject.category,
              tech: newProject.tech,
              budget: `₹${newProject.price}`,
              deadline: "Now Available",
              description: newProject.description,
              notes: `Difficulty: ${newProject.difficulty}. Check it out on the marketplace!`,
              contact: "email",
            };

            await emailjs.send(
              import.meta.env.VITE_EMAILJS_SERVICE_ID,
              import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
              emailParams,
              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
          }
        }
      } catch (emailErr) {
        console.error("Failed to notify subscribers:", emailErr);
      }

      toast.success("Project published successfully and subscribers notified!", { id: toastId });
      setNewProject({ title: "", description: "", category: "AI & Machine Learning", price: "", difficulty: "Beginner", tech: "", features: "", includes: "", image: null, video: null, screenshots: null });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = leads.filter(l =>
    (status === "all" || l.status === status) &&
    (q === "" || (l.name + l.project + l.id).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <section className="container-px py-8">
        <div className="max-w-7xl mx-auto bg-navy rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-navy relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-widest">Admin</div>
                <h1 className="text-display text-3xl md:text-4xl text-white mt-1">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {/* Dynamic Notification Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full glass-dark grid place-items-center text-white relative hover:bg-white/10 transition-colors">
                      <Bell className="w-4 h-4" />
                      {(leads.filter(l => l.status === "New" && l.rawId).length + messages.filter(m => !readMessages.includes(m.id)).length) > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-magenta animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-navy border-white/10 text-white p-2">
                    <div className="px-3 py-1.5 text-xs text-white/50 uppercase tracking-wider font-semibold">Notifications</div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {leads.filter(l => l.status === "New" && l.rawId).map(l => (
                      <DropdownMenuItem key={l.id} onClick={() => handleNotificationClickLead(l)}
                        className="text-sm p-3 hover:bg-white/5 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-white">New Lead Request</span>
                        <span className="text-xs text-white/70">{l.name} wants custom "{l.project}"</span>
                        <span className="text-[10px] text-white/40">{l.date}</span>
                      </DropdownMenuItem>
                    ))}
                    {messages.filter(m => !readMessages.includes(m.id)).map(m => (
                      <DropdownMenuItem key={m.id} onClick={() => handleNotificationClickMessage(m.id)}
                        className="text-sm p-3 hover:bg-white/5 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-white">New Support Message</span>
                        <span className="text-xs text-white/70">From {m.name}: "{m.message}"</span>
                        <span className="text-[10px] text-white/40">{new Date(m.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}
                    {(leads.filter(l => l.status === "New" && l.rawId).length + messages.filter(m => !readMessages.includes(m.id)).length) === 0 && (
                      <div className="py-6 text-center text-xs text-white/40">No new notifications</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AD Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 glass-dark rounded-full px-3 py-1.5 text-white text-sm hover:bg-white/10 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary-gradient grid place-items-center text-xs font-semibold text-white">AD</div>
                      Admin <ChevronDown className="w-3 h-3 text-white/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-navy border-white/10 text-white p-1">
                    <div className="px-2 py-1 text-xs text-white/40 truncate">workspace7204@gmail.com</div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white rounded-md">
                      <Globe className="w-4 h-4" /> Go to Website
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="flex items-center gap-2 cursor-pointer text-rose-400 hover:text-rose-300 rounded-md">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                <TabsList className="mb-8 bg-white/5 border border-white/10 rounded-full px-1 py-1 h-auto flex w-max sm:w-auto min-w-full sm:min-w-0">
                  <TabsTrigger value="leads" className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center">Leads</TabsTrigger>
                  <TabsTrigger value="projects" className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center">Manage Projects</TabsTrigger>
                  <TabsTrigger value="messages" className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center">Messages</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="leads" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: TrendingUp, label: "New leads (7d)", value: "184", delta: "+22%" },
                    { icon: Users, label: "Total contacts", value: "2,841", delta: "+8%" },
                    { icon: IndianRupee, label: "Pipeline value", value: "₹18.4L", delta: "+34%" },
                    { icon: Activity, label: "Conversion", value: "27.4%", delta: "+3%" },
                  ].map(s => (
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

                <div className="glass-dark rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
                    <h3 className="text-white font-medium">Custom project requests</h3>
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 w-full sm:w-64">
                        <Search className="w-4 h-4 text-white/40 shrink-0" />
                        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search leads…"
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 h-9" />
                      </div>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-36 rounded-full bg-white/5 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All status</SelectItem>
                          {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="text-white/50 text-xs uppercase tracking-wider">
                          {["ID", "Name", "Project", "Category", "Budget", "Status", "Submitted", ""].map(h => (
                            <th key={h} className="text-left py-3 px-3 font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(l => (
                          <tr key={l.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 text-white/60 font-mono text-xs">{l.id}</td>
                            <td className="py-3 px-3 text-white font-medium">{l.name}</td>
                            <td className="py-3 px-3 text-white/80">{l.project}</td>
                            <td className="py-3 px-3 text-white/60">{l.category}</td>
                            <td className="py-3 px-3 text-white/80">{l.budget}</td>
                            <td className="py-3 px-3"><Badge className={`${statusColor[l.status]} rounded-full border-0`}>{l.status}</Badge></td>
                            <td className="py-3 px-3 text-white/50">{l.date}</td>
                            <td className="py-3 px-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-navy border-white/10">
                                  {l.email && (
                                    <DropdownMenuItem asChild>
                                      <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-white/80 hover:text-white cursor-pointer">
                                        <Mail className="w-4 h-4" /> Contact via Email
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <div className="px-2 py-1 text-white/40 text-xs uppercase tracking-wider">Set Status</div>
                                  {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => updateLeadStatus(l, s)}
                                      className={`flex items-center gap-2 cursor-pointer ${l.status === s ? "text-primary" : "text-white/80 hover:text-white"
                                        }`}>
                                      {l.status === s && <CheckCircle className="w-3 h-3" />}
                                      {l.status !== s && <span className="w-3" />}
                                      {s}
                                    </DropdownMenuItem>
                                  ))}
                                  {l.rawId && (
                                    <>
                                      <DropdownMenuSeparator className="bg-white/10" />
                                      <DropdownMenuItem onClick={() => deleteLead(l)}
                                        className="flex items-center gap-2 text-rose-400 hover:text-rose-300 cursor-pointer">
                                        <Trash2 className="w-4 h-4" /> Delete Lead
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && <div className="text-center py-10 text-white/50 text-sm">No leads match</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-dark rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white text-xl font-medium">Add New Project to Marketplace</h3>
                  </div>

                  <form onSubmit={handleAddProject} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white/70">Project Title</Label>
                        <Input required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="bg-white/5 border-white/10 text-white h-11" placeholder="e.g. AI Support Bot" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Category</Label>
                        <Select value={newProject.category} onValueChange={v => setNewProject({ ...newProject, category: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Price (₹)</Label>
                        <Input required type="number" value={newProject.price} onChange={e => setNewProject({ ...newProject, price: e.target.value })} className="bg-white/5 border-white/10 text-white h-11" placeholder="4900" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Difficulty</Label>
                        <Select value={newProject.difficulty} onValueChange={v => setNewProject({ ...newProject, difficulty: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white/70">Description</Label>
                        <Textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-white/5 border-white/10 text-white resize-none" placeholder="Short description of the project..." rows={3} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white/70">Technologies (comma separated)</Label>
                        <Input required value={newProject.tech} onChange={e => setNewProject({ ...newProject, tech: e.target.value })} className="bg-white/5 border-white/10 text-white h-11" placeholder="React, Node.js, Python" />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-white/70">Features (one per line)</Label>
                        <Textarea value={newProject.features} onChange={e => setNewProject({ ...newProject, features: e.target.value })} className="bg-white/5 border-white/10 text-white resize-none" placeholder="- Admin Dashboard&#10;- Authentication&#10;- Dark Mode" rows={4} />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-white/70">What's Included (one per line)</Label>
                        <Textarea value={newProject.includes} onChange={e => setNewProject({ ...newProject, includes: e.target.value })} className="bg-white/5 border-white/10 text-white resize-none" placeholder="Source Code (.zip)&#10;Documentation (PDF)" rows={4} />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-white/70">Cover Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          required
                          onChange={e => setNewProject({ ...newProject, image: e.target.files?.[0] || null })}
                          className="bg-white/5 border-white/10 text-white h-11 file:text-white file:border-0 file:bg-white/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-white/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-white/70">Screenshots (Multiple)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => setNewProject({ ...newProject, screenshots: e.target.files })}
                          className="bg-white/5 border-white/10 text-white h-11 file:text-white file:border-0 file:bg-white/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-white/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-white/70">Demo Video (Optional)</Label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={e => setNewProject({ ...newProject, video: e.target.files?.[0] || null })}
                          className="bg-white/5 border-white/10 text-white h-11 file:text-white file:border-0 file:bg-white/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-white/20"
                        />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <Button disabled={isUploading} type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full text-base font-medium shadow-elegant disabled:opacity-50">
                        <Plus className="w-4 h-4 mr-2" /> {isUploading ? "Publishing..." : "Publish Project"}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-dark rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <h3 className="text-white font-medium">Standard Contact Messages</h3>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-white/50 text-xs uppercase tracking-wider">
                          <th className="text-left py-3 px-3 font-normal">Sender</th>
                          <th className="text-left py-3 px-3 font-normal">Email</th>
                          <th className="text-left py-3 px-3 font-normal">Message</th>
                          <th className="text-left py-3 px-3 font-normal">Date</th>
                          <th className="text-left py-3 px-3 font-normal"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map(m => (
                          <tr key={m.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3 text-white font-medium">{m.name}</td>
                            <td className="py-4 px-3 text-white/70">{m.email}</td>
                            <td className="py-4 px-3 text-white/60 max-w-xs truncate" title={m.message}>{m.message}</td>
                            <td className="py-4 px-3 text-white/50">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-navy border-white/10">
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${m.email}?subject=Reply to contact request`} className="flex items-center gap-2 text-white/80 hover:text-white cursor-pointer">
                                      <Mail className="w-4 h-4" /> Reply via Email
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem onClick={() => deleteMessage(m.id)}
                                    className="flex items-center gap-2 text-rose-400 hover:text-rose-300 cursor-pointer">
                                    <Trash2 className="w-4 h-4" /> Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {messages.length === 0 && <div className="text-center py-10 text-white/50 text-sm">No contact messages yet</div>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
