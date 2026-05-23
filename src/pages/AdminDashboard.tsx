import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, IndianRupee, Activity, MoreHorizontal, Bell, ChevronDown, Plus, Image as ImageIcon, Mail, Trash2, CheckCircle, LogOut, Globe, ShoppingBag, Truck, Download } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/mockData";
import { toast } from "sonner";

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
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("leads");
  const [readMessages, setReadMessages] = useState<string[]>([]);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [trackingOrderInfo, setTrackingOrderInfo] = useState<{ id: string, currentTracking: string | null } | null>(null);
  const [trackingIdInput, setTrackingIdInput] = useState("");

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
          date: new Date(d.created_at).toLocaleDateString(),
          document_url: d.document_url
        }));
        setLeads([...formattedLeads, ...LEADS]);
      }
    });

    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMessages(data);
    });

    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingId?: string) => {
    const payload: any = { status: newStatus };
    if (trackingId) payload.tracking_id = trackingId;

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
    toast.success(`Order marked as ${newStatus}`);
  };

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
    delivery_type: "digital", // 'digital' or 'physical'
    tech: "",
    features: "",
    includes: "",
    github_url: "",
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
        delivery_type: newProject.delivery_type,
        tech: newProject.tech.split(',').map(t => t.trim()).filter(Boolean),
        features: newProject.features.split('\n').map(t => t.trim()).filter(Boolean),
        includes: newProject.includes.split('\n').map(t => t.trim()).filter(Boolean),
        github_url: newProject.github_url.trim() || null,
        screenshots: screenshotUrls,
        video_url: videoUrl,
        thumb: publicUrlData.publicUrl
      });

      if (dbError) throw new Error("Database error: " + dbError.message);

      toast.success("Project published successfully!", { id: toastId });
      setNewProject({ title: "", description: "", category: "AI & Machine Learning", price: "", difficulty: "Beginner", delivery_type: "digital", tech: "", features: "", includes: "", github_url: "", image: null, video: null, screenshots: null });
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
        <div className="max-w-7xl mx-auto bg-chocolate rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-chocolate border border-[#fefaf0]/10 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#eb6e5b]/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#b07d64]/15 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <div className="text-[#fefaf0]/50 text-xs uppercase tracking-widest">Admin</div>
                <h1 className="text-display text-3xl md:text-4xl text-[#fefaf0] mt-1">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {/* Dynamic Notification Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full glass-chocolate grid place-items-center text-[#fefaf0] relative hover:bg-[#fefaf0]/10 transition-colors">
                      <Bell className="w-4 h-4" />
                      {(leads.filter(l => l.status === "New" && l.rawId).length + 
                        messages.filter(m => !readMessages.includes(m.id)).length +
                        orders.filter(o => o.status === "Processing").length) > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#eb6e5b] animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0] p-2 shadow-chocolate">
                    <div className="px-3 py-1.5 text-xs text-[#fefaf0]/50 uppercase tracking-wider font-semibold">Notifications</div>
                    <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                    
                    {orders.filter(o => o.status === "Processing").map(o => (
                      <DropdownMenuItem key={o.id} onClick={() => { setActiveTab("orders"); }}
                        className="text-sm p-3 hover:bg-[#fefaf0]/5 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-emerald-450">New Purchase (₹{o.amount})</span>
                        <span className="text-xs text-[#fefaf0]/70">{o.customer_name} bought "{o.project_title}"</span>
                        <span className="text-[10px] text-[#fefaf0]/40">{new Date(o.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}

                    {leads.filter(l => l.status === "New" && l.rawId).map(l => (
                      <DropdownMenuItem key={l.id} onClick={() => handleNotificationClickLead(l)}
                        className="text-sm p-3 hover:bg-[#fefaf0]/5 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-[#fefaf0]">New Lead Request</span>
                        <span className="text-xs text-[#fefaf0]/70">{l.name} wants custom "{l.project}"</span>
                        <span className="text-[10px] text-[#fefaf0]/40">{l.date}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {messages.filter(m => !readMessages.includes(m.id)).map(m => (
                      <DropdownMenuItem key={m.id} onClick={() => handleNotificationClickMessage(m.id)}
                        className="text-sm p-3 hover:bg-[#fefaf0]/5 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-[#fefaf0]">New Support Message</span>
                        <span className="text-xs text-[#fefaf0]/70">From {m.name}: "{m.message}"</span>
                        <span className="text-[10px] text-[#fefaf0]/40">{new Date(m.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {(leads.filter(l => l.status === "New" && l.rawId).length + 
                      messages.filter(m => !readMessages.includes(m.id)).length +
                      orders.filter(o => o.status === "Processing").length) === 0 && (
                      <div className="py-6 text-center text-xs text-[#fefaf0]/40">No new notifications</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AD Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 glass-chocolate rounded-full px-3 py-1.5 text-[#fefaf0] text-sm hover:bg-[#fefaf0]/10 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#eb6e5b] to-[#b07d64] grid place-items-center text-xs font-semibold text-white">AD</div>
                      Admin <ChevronDown className="w-3 h-3 text-[#fefaf0]/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0] p-1 shadow-chocolate">
                    <div className="px-2 py-1 text-xs text-[#fefaf0]/40 truncate">workspace7204@gmail.com</div>
                    <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                    <DropdownMenuItem onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer text-[#fefaf0]/80 hover:text-white rounded-md">
                      <Globe className="w-4 h-4" /> Go to Website
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                    <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="flex items-center gap-2 cursor-pointer text-rose-400 hover:text-rose-300 rounded-md">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                <TabsList className="mb-8 bg-[#fefaf0]/5 border border-[#fefaf0]/10 rounded-full px-1 py-1 h-auto flex w-max sm:w-auto min-w-full sm:min-w-0">
                  <TabsTrigger value="leads" className="text-[#fefaf0] data-[state=active]:bg-[#eb6e5b] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(235,110,91,0.25)] rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center transition-all">Leads</TabsTrigger>
                  <TabsTrigger value="projects" className="text-[#fefaf0] data-[state=active]:bg-[#eb6e5b] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(235,110,91,0.25)] rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center transition-all">Manage Projects</TabsTrigger>
                  <TabsTrigger value="orders" className="text-[#fefaf0] data-[state=active]:bg-[#eb6e5b] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(235,110,91,0.25)] rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center transition-all">Orders</TabsTrigger>
                  <TabsTrigger value="messages" className="text-[#fefaf0] data-[state=active]:bg-[#eb6e5b] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(235,110,91,0.25)] rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center transition-all">Messages</TabsTrigger>
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
                    <div key={s.label} className="glass-chocolate rounded-2xl p-5 shadow-chocolate">
                      <div className="flex items-center justify-between">
                        <s.icon className="w-4 h-4 text-[#eb6e5b]" />
                        <span className="text-xs text-emerald-400">{s.delta}</span>
                      </div>
                      <div className="text-[#fefaf0] text-3xl font-semibold mt-3">{s.value}</div>
                      <div className="text-[#fefaf0]/60 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="glass-chocolate rounded-2xl p-4 sm:p-5 shadow-chocolate">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
                    <h3 className="text-[#fefaf0] font-medium">Custom project requests</h3>
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-[#fefaf0]/5 rounded-full px-3 w-full sm:w-64 border border-[#fefaf0]/10">
                        <Search className="w-4 h-4 text-[#fefaf0]/40 shrink-0" />
                        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search leads…"
                          className="border-0 bg-transparent text-[#fefaf0] placeholder:text-[#fefaf0]/40 focus-visible:ring-0 h-9" />
                      </div>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-36 rounded-full bg-[#fefaf0]/5 border border-[#fefaf0]/10 text-[#fefaf0]"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                          <SelectItem value="all">All status</SelectItem>
                          {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="text-[#fefaf0]/50 text-xs uppercase tracking-wider">
                          {["ID", "Name", "Project", "Category", "Budget", "Status", "Submitted", ""].map(h => (
                            <th key={h} className="text-left py-3 px-3 font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(l => (
                          <tr key={l.id} className="border-t border-[#fefaf0]/5 hover:bg-[#fefaf0]/5 transition-colors">
                            <td className="py-3 px-3 text-[#fefaf0]/60 font-mono text-xs">{l.id}</td>
                            <td className="py-3 px-3 text-[#fefaf0] font-medium">{l.name}</td>
                            <td className="py-3 px-3 text-[#fefaf0]/80">{l.project}</td>
                            <td className="py-3 px-3 text-[#fefaf0]/60">{l.category}</td>
                            <td className="py-3 px-3 text-[#fefaf0]/80">{l.budget}</td>
                            <td className="py-3 px-3"><Badge className={`${statusColor[l.status]} rounded-full border-0`}>{l.status}</Badge></td>
                            <td className="py-3 px-3 text-[#fefaf0]/50">{l.date}</td>
                            <td className="py-3 px-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-[#fefaf0]/40 hover:text-white p-1 rounded hover:bg-[#fefaf0]/10 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                                  {l.document_url && (
                                    <>
                                      <DropdownMenuItem asChild>
                                        <a href={l.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium">
                                          <Download className="w-4 h-4" /> Download Document
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                    </>
                                  )}
                                  {l.email && (
                                    <DropdownMenuItem asChild>
                                      <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-[#fefaf0]/80 hover:text-white cursor-pointer">
                                        <Mail className="w-4 h-4" /> Contact via Email
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                  <div className="px-2 py-1 text-[#fefaf0]/40 text-xs uppercase tracking-wider">Set Status</div>
                                  {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => updateLeadStatus(l, s)}
                                      className={`flex items-center gap-2 cursor-pointer ${l.status === s ? "text-[#eb6e5b] font-semibold" : "text-[#fefaf0]/80 hover:text-white"
                                        }`}>
                                      {l.status === s && <CheckCircle className="w-3 h-3 text-[#eb6e5b]" />}
                                      {l.status !== s && <span className="w-3" />}
                                      {s}
                                    </DropdownMenuItem>
                                  ))}
                                  {l.rawId && (
                                    <>
                                      <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                      <DropdownMenuItem onClick={() => deleteLead(l)}
                                        className="flex items-center gap-2 text-rose-400 hover:text-rose-350 cursor-pointer">
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
                    {filtered.length === 0 && <div className="text-center py-10 text-[#fefaf0]/50 text-sm">No leads match</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-chocolate rounded-2xl p-6 md:p-8 shadow-chocolate">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[#fefaf0] text-xl font-medium">Add New Project to Marketplace</h3>
                  </div>

                  <form onSubmit={handleAddProject} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[#fefaf0]/80">Project Title</Label>
                        <Input required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="e.g. AI Support Bot" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#fefaf0]/80">Category</Label>
                        <Select value={newProject.category} onValueChange={v => setNewProject({ ...newProject, category: v })}>
                          <SelectTrigger className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus:ring-1 focus:ring-[#eb6e5b]/40"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#fefaf0]/80">Price (₹)</Label>
                        <Input required type="number" value={newProject.price} onChange={e => setNewProject({ ...newProject, price: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="4900" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#fefaf0]/80">Difficulty</Label>
                        <Select value={newProject.difficulty} onValueChange={v => setNewProject({ ...newProject, difficulty: v })}>
                          <SelectTrigger className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus:ring-1 focus:ring-[#eb6e5b]/40"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#fefaf0]/80">Delivery Type</Label>
                        <Select value={newProject.delivery_type} onValueChange={v => setNewProject({ ...newProject, delivery_type: v })}>
                          <SelectTrigger className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus:ring-1 focus:ring-[#eb6e5b]/40"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                            <SelectItem value="digital">Digital (Instant Download)</SelectItem>
                            <SelectItem value="physical">Physical (Hardware/Robotics Kit Shipping)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[#fefaf0]/80">Description</Label>
                        <Textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] resize-none focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="Short description of the project..." rows={3} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[#fefaf0]/80">Technologies (comma separated)</Label>
                        <Input required value={newProject.tech} onChange={e => setNewProject({ ...newProject, tech: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="React, Node.js, Python" />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">Features (one per line)</Label>
                        <Textarea value={newProject.features} onChange={e => setNewProject({ ...newProject, features: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] resize-none focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="- Admin Dashboard&#10;- Authentication&#10;- Dark Mode" rows={4} />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">What's Included (one per line)</Label>
                        <Textarea value={newProject.includes} onChange={e => setNewProject({ ...newProject, includes: e.target.value })} className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] resize-none focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50" placeholder="Source Code (.zip)&#10;Documentation (PDF)" rows={4} />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">Cover Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          required
                          onChange={e => setNewProject({ ...newProject, image: e.target.files?.[0] || null })}
                          className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 file:text-[#fefaf0] file:border-0 file:bg-[#fefaf0]/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-[#fefaf0]/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">Screenshots (Multiple)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => setNewProject({ ...newProject, screenshots: e.target.files })}
                          className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 file:text-[#fefaf0] file:border-0 file:bg-[#fefaf0]/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-[#fefaf0]/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">Demo Video (Optional)</Label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={e => setNewProject({ ...newProject, video: e.target.files?.[0] || null })}
                          className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 file:text-[#fefaf0] file:border-0 file:bg-[#fefaf0]/10 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-[#fefaf0]/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label className="text-[#fefaf0]/80">GitHub Repository ZIP Link (Optional)</Label>
                        <Input
                          type="url"
                          value={newProject.github_url}
                          onChange={e => setNewProject({ ...newProject, github_url: e.target.value })}
                          placeholder="https://github.com/username/repo/archive/refs/heads/main.zip"
                          className="bg-[#fefaf0]/5 border-[#fefaf0]/15 text-[#fefaf0] h-11 focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/40 focus-visible:border-[#eb6e5b]/50"
                        />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <Button disabled={isUploading} type="submit" className="bg-[#eb6e5b] hover:bg-[#f38c7b] text-white px-8 h-12 rounded-full text-base font-semibold shadow-[0_0_20px_rgba(235,110,91,0.2)] disabled:opacity-50 border-0 transition-all">
                        <Plus className="w-4 h-4 mr-2" /> {isUploading ? "Publishing..." : "Publish Project"}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-chocolate rounded-2xl p-5 shadow-chocolate">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <h3 className="text-[#fefaf0] font-medium">Standard Contact Messages</h3>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-[#fefaf0]/50 text-xs uppercase tracking-wider">
                          <th className="text-left py-3 px-3 font-normal">Sender</th>
                          <th className="text-left py-3 px-3 font-normal">Email</th>
                          <th className="text-left py-3 px-3 font-normal">Message</th>
                          <th className="text-left py-3 px-3 font-normal">Date</th>
                          <th className="text-left py-3 px-3 font-normal"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map(m => (
                          <tr key={m.id} className="border-t border-[#fefaf0]/5 hover:bg-[#fefaf0]/5 transition-colors">
                            <td className="py-4 px-3 text-[#fefaf0] font-medium">{m.name}</td>
                            <td className="py-4 px-3 text-[#fefaf0]/70">{m.email}</td>
                            <td className="py-4 px-3 text-[#fefaf0]/60 max-w-xs truncate" title={m.message}>{m.message}</td>
                            <td className="py-4 px-3 text-[#fefaf0]/50">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-[#fefaf0]/40 hover:text-white p-1 rounded hover:bg-[#fefaf0]/10 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0]">
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${m.email}?subject=Reply to contact request`} className="flex items-center gap-2 text-[#fefaf0]/80 hover:text-white cursor-pointer">
                                      <Mail className="w-4 h-4" /> Reply via Email
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                  <DropdownMenuItem onClick={() => deleteMessage(m.id)}
                                    className="flex items-center gap-2 text-rose-400 hover:text-rose-350 cursor-pointer">
                                    <Trash2 className="w-4 h-4" /> Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {messages.length === 0 && <div className="text-center py-10 text-[#fefaf0]/50 text-sm">No contact messages yet</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-chocolate rounded-2xl p-5 shadow-chocolate">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <h3 className="text-[#fefaf0] font-medium flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#eb6e5b]" />
                      Client Order Registry
                    </h3>
                    <Badge className="bg-[#fefaf0]/10 text-[#fefaf0] border border-[#fefaf0]/5 rounded-full py-1 px-3">
                      {orders.length} orders total
                    </Badge>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="text-[#fefaf0]/50 text-xs uppercase tracking-wider">
                          <th className="text-left py-3 px-3 font-normal">Order ID</th>
                          <th className="text-left py-3 px-3 font-normal">Buyer</th>
                          <th className="text-left py-3 px-3 font-normal">Project Purchased</th>
                          <th className="text-left py-3 px-3 font-normal">Price</th>
                          <th className="text-left py-3 px-3 font-normal">Type</th>
                          <th className="text-left py-3 px-3 font-normal">Shipping Address / Details</th>
                          <th className="text-left py-3 px-3 font-normal">Status</th>
                          <th className="text-left py-3 px-3 font-normal">Tracking ID</th>
                          <th className="text-right py-3 px-3 font-normal"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => {
                          const isPhysical = o.delivery_type === "physical";
                          return (
                            <tr key={o.id} className="border-t border-[#fefaf0]/5 hover:bg-[#fefaf0]/5 transition-colors">
                              <td className="py-4 px-3 text-[#fefaf0]/50 font-mono text-xs truncate max-w-[80px]" title={o.id}>
                                #{o.id.substring(0, 8)}
                              </td>
                              <td className="py-4 px-3">
                                <div className="text-[#fefaf0] font-medium">{o.customer_name}</div>
                                <div className="text-[#fefaf0]/40 text-xs mt-0.5">{o.customer_email}</div>
                              </td>
                              <td className="py-4 px-3 text-[#fefaf0] font-medium max-w-[180px] truncate" title={o.project_title}>
                                {o.project_title}
                              </td>
                              <td className="py-4 px-3 text-[#fefaf0] font-medium">₹{o.amount.toLocaleString()}</td>
                              <td className="py-4 px-3">
                                <Badge className={isPhysical ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}>
                                  {isPhysical ? "Physical Kit" : "Digital ZIP"}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 text-[#fefaf0]/70 max-w-[200px] truncate text-xs" title={isPhysical ? `${o.shipping_address}, ${o.city}, ${o.state} - ${o.pincode} | Tel: ${o.customer_phone}` : "Instant Digital Download"}>
                                {isPhysical ? (
                                  <>
                                    <div>{o.shipping_address}, {o.city}</div>
                                    <div className="text-[#fefaf0]/40 text-[10px] mt-0.5">Phone: {o.customer_phone}</div>
                                  </>
                                ) : (
                                  <span className="text-[#fefaf0]/40">Instant Delivery</span>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                <Badge className={
                                  o.status === "Delivered" ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" :
                                  o.status === "Shipped" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                                  "bg-amber-500/10 text-amber-450 border border-amber-500/20"
                                }>
                                  {o.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 font-mono text-xs text-[#fefaf0]/50">
                                {o.tracking_id ? (
                                  <span className="text-[#fefaf0]/85 font-semibold">{o.tracking_id}</span>
                                ) : (
                                  <span className="text-[#fefaf0]/20">—</span>
                                )}
                              </td>
                              <td className="py-4 px-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-[#fefaf0]/40 hover:text-white p-1 rounded hover:bg-[#fefaf0]/10 transition-colors">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-[#59311e] border-[#fefaf0]/10 text-[#fefaf0] p-2">
                                    <div className="px-2 py-1 text-[#fefaf0]/40 text-xs uppercase tracking-wider font-semibold">Set Order Status</div>
                                    <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                    
                                    {isPhysical && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setTrackingOrderInfo({ id: o.id, currentTracking: o.tracking_id || null });
                                          setTrackingIdInput(o.tracking_id || "");
                                          setIsTrackingDialogOpen(true);
                                        }}
                                        className="flex items-center gap-2 text-[#fefaf0]/80 hover:text-white cursor-pointer rounded-md"
                                      >
                                        <Truck className="w-4 h-4 text-[#eb6e5b]" /> {o.tracking_id ? "Update Tracking ID" : "Mark as Shipped"}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Processing")}
                                      className="flex items-center gap-2 text-[#fefaf0]/80 hover:text-white cursor-pointer rounded-md"
                                    >
                                      <MoreHorizontal className="w-4 h-4 text-amber-400" /> Mark as Processing
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Delivered")}
                                      className="flex items-center gap-2 text-[#fefaf0]/80 hover:text-white cursor-pointer rounded-md"
                                    >
                                      <CheckCircle className="w-4 h-4 text-emerald-450" /> Mark as Delivered
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-[#fefaf0]/10" />
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        if (!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;
                                        updateOrderStatus(o.id, "Cancelled");
                                      }}
                                      className="flex items-center gap-2 text-rose-450 hover:text-rose-400 cursor-pointer rounded-md"
                                    >
                                      <Trash2 className="w-4 h-4" /> Cancel Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {orders.length === 0 && <div className="text-center py-12 text-[#fefaf0]/50 text-sm">No purchases registered yet. Run test checkout inside store!</div>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Tracking ID Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="bg-[#59311e] border border-[#fefaf0]/10 text-[#fefaf0] sm:max-w-md shadow-chocolate">
          <DialogHeader>
            <DialogTitle className="text-[#fefaf0]">Enter Tracking Details</DialogTitle>
            <DialogDescription className="text-[#fefaf0]/60">
              Provide the courier tracking ID to mark this order as shipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tracking-id" className="text-[#fefaf0]/70 mb-2 block">Tracking ID (e.g., DTDC)</Label>
            <Input 
              id="tracking-id" 
              value={trackingIdInput} 
              onChange={e => setTrackingIdInput(e.target.value)} 
              placeholder="Enter tracking number" 
              className="bg-[#fefaf0]/5 border-[#fefaf0]/10 text-[#fefaf0] h-11 focus-visible:ring-1 focus-visible:ring-[#eb6e5b]/45 focus-visible:border-[#eb6e5b]/50" 
              autoFocus 
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsTrackingDialogOpen(false)} className="text-[#fefaf0]/70 hover:text-white hover:bg-[#fefaf0]/10 border-0">
              Cancel
            </Button>
            <Button onClick={() => {
              if (trackingOrderInfo) {
                updateOrderStatus(trackingOrderInfo.id, "Shipped", trackingIdInput.trim() || undefined);
                setIsTrackingDialogOpen(false);
              }
            }} className="bg-[#eb6e5b] hover:bg-[#f38c7b] text-white shadow-[0_0_15px_rgba(235,110,91,0.25)] border-0">
              Save Tracking & Ship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
