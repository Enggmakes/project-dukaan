import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, IndianRupee, Activity, MoreHorizontal, Bell, ChevronDown, Plus, Image as ImageIcon, Mail, Trash2, CheckCircle, LogOut, Globe, ShoppingBag, Truck, Download, Pencil, ExternalLink, RefreshCw, Layers, Edit3 } from "lucide-react";
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



const statusColor: Record<string, string> = {
  New: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium",
  Reviewing: "bg-sky-50 text-sky-700 border border-sky-200/80 font-medium",
  Contacted: "bg-amber-50 text-amber-700 border border-amber-200/80 font-medium",
  Quoted: "bg-purple-50 text-purple-700 border border-purple-200/80 font-medium",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium",
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200/80 font-medium",
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
  const [leads, setLeads] = useState<any[]>([]);
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
        setLeads(formattedLeads);
      }
    });

    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMessages(data);
    });

    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });

    fetchDbProjects();
  }, []);

  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSubTab, setProjectSubTab] = useState<"list" | "add">("list");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "AI & Machine Learning",
    price: "",
    difficulty: "Beginner",
    delivery_type: "digital",
    tech: "",
    features: "",
    includes: "",
    github_url: "",
    price_note: "",
    image: null as File | null,
    video: null as File | null,
    screenshots: null as FileList | null,
  });

  const fetchDbProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setDbProjects(data);
    }
    setIsLoadingProjects(false);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setEditForm({
      title: p.title || "",
      description: p.description || "",
      category: p.category || "AI & Machine Learning",
      price: String(p.price || ""),
      difficulty: p.difficulty || "Beginner",
      delivery_type: p.delivery_type || "digital",
      tech: Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || ""),
      features: Array.isArray(p.features) ? p.features.join('\n') : (p.features || ""),
      includes: Array.isArray(p.includes) ? p.includes.join('\n') : (p.includes || ""),
      github_url: p.github_url || "",
      price_note: p.price_note || "",
      image: null,
      video: null,
      screenshots: null,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsUpdating(true);
    const toastId = toast.loading("Saving changes...");

    try {
      let thumbUrl = editingProject.thumb;
      if (editForm.image) {
        const fileExt = editForm.image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: imgError } = await supabase.storage
          .from('project-images')
          .upload(fileName, editForm.image);
        if (imgError) throw new Error("Image upload failed: " + imgError.message);
        const { data: publicUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        thumbUrl = publicUrlData.publicUrl;
      }

      let screenshotUrls: string[] = Array.isArray(editingProject.screenshots) ? editingProject.screenshots : [];
      if (editForm.screenshots && editForm.screenshots.length > 0) {
        let newUrls: string[] = [];
        for (let i = 0; i < editForm.screenshots.length; i++) {
          const file = editForm.screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: ssError } = await supabase.storage.from('project-images').upload(fileName, file);
          if (ssError) throw new Error("Screenshot upload failed: " + ssError.message);
          const { data: ssUrlData } = supabase.storage.from('project-images').getPublicUrl(fileName);
          newUrls.push(ssUrlData.publicUrl);
        }
        screenshotUrls = [...screenshotUrls, ...newUrls];
      }

      let videoUrl = editingProject.video_url;
      if (editForm.video) {
        const fileExt = editForm.video.name.split('.').pop();
        const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: vidError } = await supabase.storage
          .from('project-images')
          .upload(fileName, editForm.video);
        if (vidError) throw new Error("Video upload failed: " + vidError.message);
        const { data: vidUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        videoUrl = vidUrlData.publicUrl;
      }

      const { error: updateError } = await supabase.from('projects').update({
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        difficulty: editForm.difficulty,
        price: Number(editForm.price),
        delivery_type: editForm.delivery_type,
        tech: editForm.tech.split(',').map(t => t.trim()).filter(Boolean),
        features: editForm.features.split('\n').map(t => t.trim()).filter(Boolean),
        includes: editForm.includes.split('\n').map(t => t.trim()).filter(Boolean),
        github_url: editForm.github_url.trim() || null,
        price_note: editForm.price_note.trim() || null,
        thumb: thumbUrl,
        screenshots: screenshotUrls,
        video_url: videoUrl,
      }).eq('id', editingProject.id);

      if (updateError) throw new Error("Update error: " + updateError.message);

      toast.success("Project updated successfully!", { id: toastId });
      setIsEditDialogOpen(false);
      setEditingProject(null);
      fetchDbProjects();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}" from the marketplace? This cannot be undone.`)) return;

    const toastId = toast.loading("Deleting project...");
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error("Failed to delete project: " + error.message, { id: toastId });
      return;
    }
    toast.success("Project deleted from marketplace", { id: toastId });
    setDbProjects(prev => prev.filter(p => p.id !== projectId));
  };

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
    price_note: "",
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
        price_note: newProject.price_note.trim() || null,
        screenshots: screenshotUrls,
        video_url: videoUrl,
        thumb: publicUrlData.publicUrl
      });

      if (dbError) throw new Error("Database error: " + dbError.message);

      toast.success("Project published successfully!", { id: toastId });
      setNewProject({ title: "", description: "", category: "AI & Machine Learning", price: "", difficulty: "Beginner", delivery_type: "digital", tech: "", features: "", includes: "", github_url: "", price_note: "", image: null, video: null, screenshots: null });
      fetchDbProjects();
      setProjectSubTab("list");
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
        <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 relative">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <div className="text-indigo-600 font-semibold text-xs uppercase tracking-widest">Management Console</div>
                <h1 className="text-display text-3xl md:text-4xl text-slate-900 font-bold mt-1">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {/* Dynamic Notification Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 grid place-items-center text-slate-700 relative hover:bg-slate-200/80 hover:text-slate-900 transition-colors">
                      <Bell className="w-4 h-4" />
                      {(leads.filter(l => l.status === "New" && l.rawId).length + 
                        messages.filter(m => !readMessages.includes(m.id)).length +
                        orders.filter(o => o.status === "Processing").length) > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-white border-slate-200 text-slate-900 p-2 shadow-xl rounded-2xl">
                    <div className="px-3 py-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Notifications</div>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    
                    {orders.filter(o => o.status === "Processing").map(o => (
                      <DropdownMenuItem key={o.id} onClick={() => { setActiveTab("orders"); }}
                        className="text-sm p-3 hover:bg-slate-50 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-emerald-600">New Purchase (₹{o.amount})</span>
                        <span className="text-xs text-slate-600">{o.customer_name} bought "{o.project_title}"</span>
                        <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}

                    {leads.filter(l => l.status === "New" && l.rawId).map(l => (
                      <DropdownMenuItem key={l.id} onClick={() => handleNotificationClickLead(l)}
                        className="text-sm p-3 hover:bg-slate-50 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-slate-900">New Lead Request</span>
                        <span className="text-xs text-slate-600">{l.name} wants custom "{l.project}"</span>
                        <span className="text-[10px] text-slate-400">{l.date}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {messages.filter(m => !readMessages.includes(m.id)).map(m => (
                      <DropdownMenuItem key={m.id} onClick={() => handleNotificationClickMessage(m.id)}
                        className="text-sm p-3 hover:bg-slate-50 rounded-lg flex flex-col items-start gap-1 cursor-pointer">
                        <span className="font-semibold text-slate-900">New Support Message</span>
                        <span className="text-xs text-slate-600">From {m.name}: "{m.message}"</span>
                        <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    {(leads.filter(l => l.status === "New" && l.rawId).length + 
                      messages.filter(m => !readMessages.includes(m.id)).length +
                      orders.filter(o => o.status === "Processing").length) === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">No new notifications</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AD Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 text-slate-700 text-sm hover:bg-slate-200/80 hover:text-slate-900 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center text-xs font-semibold text-white">AD</div>
                      Admin <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 text-slate-900 p-1 shadow-xl rounded-xl">
                    <div className="px-2 py-1 text-xs text-slate-400 truncate">workspace7204@gmail.com</div>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md">
                      <Globe className="w-4 h-4" /> Go to Website
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="flex items-center gap-2 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                <TabsList className="mb-8 bg-slate-100 border border-slate-200/80 rounded-full p-1 h-auto flex w-max sm:w-auto min-w-full sm:min-w-0">
                  <TabsTrigger value="leads" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center font-medium transition-all">Leads ({leads.length})</TabsTrigger>
                  <TabsTrigger value="projects" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center font-medium transition-all">Manage Projects ({dbProjects.length})</TabsTrigger>
                  <TabsTrigger value="orders" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center font-medium transition-all">Orders ({orders.length})</TabsTrigger>
                  <TabsTrigger value="messages" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-6 py-2 whitespace-nowrap flex-1 text-center font-medium transition-all">Messages ({messages.length})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="leads" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: TrendingUp, label: "Total Leads", value: String(leads.length), delta: "+12%" },
                    { icon: Users, label: "Live Projects", value: String(dbProjects.length), delta: "Published" },
                    { icon: IndianRupee, label: "Orders Placed", value: String(orders.length), delta: "Lifetime" },
                    { icon: Activity, label: "Inquiries", value: String(messages.length), delta: "Direct" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 hover:bg-white hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between">
                        <s.icon className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.delta}</span>
                      </div>
                      <div className="text-slate-900 text-3xl font-bold mt-3">{s.value}</div>
                      <div className="text-slate-500 text-xs mt-1 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-lg">Custom Project Requests</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Manage and quote incoming client engineering requests</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                      <div className="flex items-center gap-2 rounded-full px-3 bg-slate-50 border border-slate-200 w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search leads…"
                          className="border-0 bg-transparent text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 h-9 text-xs" />
                      </div>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-36 rounded-full bg-slate-50 border-slate-200 text-slate-800 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                          <SelectItem value="all">All status</SelectItem>
                          {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                          {["ID", "Name", "Project", "Category", "Budget", "Status", "Submitted", ""].map(h => (
                            <th key={h} className="text-left py-3 px-3 font-semibold text-[11px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(l => (
                          <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3 text-slate-500 font-mono text-xs font-semibold">{l.id}</td>
                            <td className="py-3 px-3 text-slate-900 font-medium">{l.name}</td>
                            <td className="py-3 px-3 text-slate-700">{l.project}</td>
                            <td className="py-3 px-3 text-slate-500">{l.category}</td>
                            <td className="py-3 px-3 text-slate-900 font-semibold">{l.budget}</td>
                            <td className="py-3 px-3"><Badge className={`${statusColor[l.status] || "bg-slate-100 text-slate-700"} rounded-full text-xs py-0.5`}>{l.status}</Badge></td>
                            <td className="py-3 px-3 text-slate-500 text-xs">{l.date}</td>
                            <td className="py-3 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl">
                                  {l.document_url && (
                                    <>
                                      <DropdownMenuItem asChild>
                                        <a href={l.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium hover:bg-slate-50">
                                          <Download className="w-4 h-4" /> Download Document
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-100" />
                                    </>
                                  )}
                                  {l.email && (
                                    <DropdownMenuItem asChild>
                                      <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
                                        <Mail className="w-4 h-4" /> Contact via Email
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-slate-100" />
                                  <div className="px-2 py-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Set Status</div>
                                  {["New", "Reviewing", "Contacted", "Quoted", "In Progress", "Delivered", "Cancelled"].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => updateLeadStatus(l, s)}
                                      className={`flex items-center gap-2 cursor-pointer hover:bg-slate-50 ${l.status === s ? "text-indigo-600 font-semibold" : "text-slate-700"
                                        }`}>
                                      {l.status === s && <CheckCircle className="w-3 h-3 text-indigo-600" />}
                                      {l.status !== s && <span className="w-3" />}
                                      {s}
                                    </DropdownMenuItem>
                                  ))}
                                  {l.rawId && (
                                    <>
                                      <DropdownMenuSeparator className="bg-slate-100" />
                                      <DropdownMenuItem onClick={() => deleteLead(l)}
                                        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
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
                    {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No custom project requests found</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  {/* Sub navigation between Added Projects and Upload New */}
                  <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProjectSubTab("list")}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          projectSubTab === "list"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Added Projects ({dbProjects.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectSubTab("add")}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          projectSubTab === "add"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Project
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchDbProjects}
                      disabled={isLoadingProjects}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 h-8 px-3 text-xs rounded-xl border-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingProjects ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  {projectSubTab === "list" ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div>
                          <h3 className="text-slate-900 text-xl font-bold">Your Published Projects</h3>
                          <p className="text-slate-500 text-xs mt-1">Preview your uploaded projects and make instant changes or rewrites.</p>
                        </div>
                        <Button
                          onClick={() => setProjectSubTab("add")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded-xl text-xs font-semibold shadow-sm border-0"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Project
                        </Button>
                      </div>

                      {isLoadingProjects ? (
                        <div className="py-16 text-center text-slate-500 text-sm">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading marketplace projects...
                        </div>
                      ) : dbProjects.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl p-8">
                          <div className="w-12 h-12 rounded-full bg-slate-100 grid place-items-center mx-auto mb-3 text-slate-400">
                            <Layers className="w-6 h-6" />
                          </div>
                          <h4 className="text-slate-900 font-semibold mb-1">No Custom Projects Uploaded Yet</h4>
                          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-5">
                            You haven't added any projects to Supabase yet. Use the Add Project form to publish one.
                          </p>
                          <Button
                            onClick={() => setProjectSubTab("add")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 h-10 text-sm shadow-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Upload First Project
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {dbProjects.map((p) => (
                            <div
                              key={p.id}
                              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group hover:shadow-md"
                            >
                              {/* Small Version Card Preview */}
                              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                                {p.thumb ? (
                                  <img
                                    src={p.thumb}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full grid place-items-center text-slate-300">
                                    <ImageIcon className="w-8 h-8" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                <Badge className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] border border-white/60 font-semibold shadow-sm">
                                  {p.category}
                                </Badge>
                                <Badge className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] border-0 font-medium">
                                  {p.difficulty || "Beginner"}
                                </Badge>
                                <div className="absolute bottom-2 left-2.5 text-xs font-bold text-white">
                                  ₹{Number(p.price).toLocaleString()}
                                </div>
                                <div className="absolute bottom-2 right-2.5">
                                  <Badge className="bg-white/25 backdrop-blur-md text-white text-[10px] border border-white/20">
                                    {p.delivery_type === "physical" ? "Physical Kit" : "Digital"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-slate-900 font-semibold text-base line-clamp-1 group-hover:text-indigo-600 transition-colors" title={p.title}>
                                    {p.title}
                                  </h4>
                                  <p className="text-slate-600 text-xs line-clamp-2 mt-1.5 leading-relaxed">
                                    {p.description}
                                  </p>

                                  {/* Tech tags */}
                                  {Array.isArray(p.tech) && p.tech.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap mt-3">
                                      {p.tech.slice(0, 3).map((t: string) => (
                                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                                          {t}
                                        </span>
                                      ))}
                                      {p.tech.length > 3 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                          +{p.tech.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons: Make Changes / Rewrite / View / Delete */}
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openEditModal(p)}
                                    className="flex-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 h-8 rounded-xl text-xs font-semibold transition-all shadow-none"
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                                    Make Changes
                                  </Button>

                                  <a
                                    href={`/project/${p.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 grid place-items-center transition-colors shrink-0"
                                    title="View on Website"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProject(p.id, p.title)}
                                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 grid place-items-center transition-colors shrink-0 cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ADD NEW PROJECT FORM */
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-slate-900 text-xl font-bold">Add New Project to Marketplace</h3>
                          <p className="text-slate-500 text-xs mt-1">Publish full code, documentation, and pricing to the store.</p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setProjectSubTab("list")}
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs h-8 rounded-xl border border-slate-200"
                        >
                          ← Back to Added Projects
                        </Button>
                      </div>

                      <form onSubmit={handleAddProject} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Project Title</Label>
                            <Input required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="e.g. AI Support Bot" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Category</Label>
                            <Select value={newProject.category} onValueChange={v => setNewProject({ ...newProject, category: v })}>
                              <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-11 focus:ring-2 focus:ring-indigo-500/20"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Price (₹)</Label>
                            <Input required type="number" value={newProject.price} onChange={e => setNewProject({ ...newProject, price: e.target.value })} className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="4900" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Difficulty</Label>
                            <Select value={newProject.difficulty} onValueChange={v => setNewProject({ ...newProject, difficulty: v })}>
                              <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-11 focus:ring-2 focus:ring-indigo-500/20"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Delivery Type</Label>
                            <Select value={newProject.delivery_type} onValueChange={v => setNewProject({ ...newProject, delivery_type: v })}>
                              <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-11 focus:ring-2 focus:ring-indigo-500/20"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                <SelectItem value="digital">Digital (Instant Download)</SelectItem>
                                <SelectItem value="physical">Physical (Hardware/Robotics Kit Shipping)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-700 font-medium">Description</Label>
                            <Textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="Short description of the project..." rows={3} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-700 font-medium">Technologies (comma separated)</Label>
                            <Input required value={newProject.tech} onChange={e => setNewProject({ ...newProject, tech: e.target.value })} className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="React, Node.js, Python" />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">Features (one per line)</Label>
                            <Textarea value={newProject.features} onChange={e => setNewProject({ ...newProject, features: e.target.value })} className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="- Admin Dashboard&#10;- Authentication&#10;- Dark Mode" rows={4} />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">What's Included (one per line)</Label>
                            <Textarea value={newProject.includes} onChange={e => setNewProject({ ...newProject, includes: e.target.value })} className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" placeholder="Source Code (.zip)&#10;Documentation (PDF)" rows={4} />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">Cover Image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              required
                              onChange={e => setNewProject({ ...newProject, image: e.target.files?.[0] || null })}
                              className="bg-white border-slate-200 text-slate-900 h-11 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-slate-200 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">Screenshots (Multiple)</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={e => setNewProject({ ...newProject, screenshots: e.target.files })}
                              className="bg-white border-slate-200 text-slate-900 h-11 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-slate-200 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">Demo Video (Optional)</Label>
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={e => setNewProject({ ...newProject, video: e.target.files?.[0] || null })}
                              className="bg-white border-slate-200 text-slate-900 h-11 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-4 file:mr-4 file:rounded-md hover:file:bg-slate-200 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-1">
                            <Label className="text-slate-700 font-medium">GitHub Repository ZIP Link (Optional)</Label>
                            <Input
                              type="url"
                              value={newProject.github_url}
                              onChange={e => setNewProject({ ...newProject, github_url: e.target.value })}
                              placeholder="https://github.com/username/repo/archive/refs/heads/main.zip"
                              className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-700 font-medium flex items-center gap-2">
                              <span>Price Note / Extra Cost Note (Optional)</span>
                              <span className="text-[11px] text-rose-500 font-normal">(Shown in red smallest font above Tech Stack)</span>
                            </Label>
                            <Input
                              value={newProject.price_note}
                              onChange={e => setNewProject({ ...newProject, price_note: e.target.value })}
                              placeholder="e.g. * Extra ₹500 for deployment support, or base price includes basic setup only"
                              className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs"
                            />
                          </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setProjectSubTab("list")}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                          >
                            Cancel
                          </Button>
                          <Button disabled={isUploading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 rounded-full text-sm font-semibold shadow-sm disabled:opacity-50 border-0 transition-all">
                            <Plus className="w-4 h-4 mr-2" /> {isUploading ? "Publishing..." : "Publish Project"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-lg">Standard Contact Messages</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Inquiries submitted through the contact form</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Sender</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Email</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Message</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Date</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map(m => (
                          <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-3 text-slate-900 font-medium">{m.name}</td>
                            <td className="py-4 px-3 text-slate-600">{m.email}</td>
                            <td className="py-4 px-3 text-slate-700 max-w-xs truncate" title={m.message}>{m.message}</td>
                            <td className="py-4 px-3 text-slate-500 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl">
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${m.email}?subject=Reply to contact request`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
                                      <Mail className="w-4 h-4" /> Reply via Email
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-100" />
                                  <DropdownMenuItem onClick={() => deleteMessage(m.id)}
                                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
                                    <Trash2 className="w-4 h-4" /> Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {messages.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No contact messages yet</div>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-lg flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-indigo-600" />
                        Client Order Registry
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">Purchases and fulfillment tracking</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 rounded-full py-1 px-3 font-semibold text-xs">
                      {orders.length} orders total
                    </Badge>
                  </div>

                  <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Order ID</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Buyer</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Project Purchased</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Price</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Type</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Shipping Address / Details</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Status</th>
                          <th className="text-left py-3 px-3 font-semibold text-[11px]">Tracking ID</th>
                          <th className="text-right py-3 px-3 font-semibold text-[11px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => {
                          const isPhysical = o.delivery_type === "physical";
                          return (
                            <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-3 text-slate-500 font-mono text-xs truncate max-w-[80px]" title={o.id}>
                                #{o.id.substring(0, 8)}
                              </td>
                              <td className="py-4 px-3">
                                <div className="text-slate-900 font-medium">{o.customer_name}</div>
                                <div className="text-slate-500 text-xs mt-0.5">{o.customer_email}</div>
                              </td>
                              <td className="py-4 px-3 text-slate-900 font-medium max-w-[180px] truncate" title={o.project_title}>
                                {o.project_title}
                              </td>
                              <td className="py-4 px-3 text-slate-900 font-bold">₹{o.amount.toLocaleString()}</td>
                              <td className="py-4 px-3">
                                <Badge className={isPhysical ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-purple-50 text-purple-700 border border-purple-200"}>
                                  {isPhysical ? "Physical Kit" : "Digital ZIP"}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 text-slate-600 max-w-[200px] truncate text-xs" title={isPhysical ? `${o.shipping_address}, ${o.city}, ${o.state} - ${o.pincode} | Tel: ${o.customer_phone}` : "Instant Digital Download"}>
                                {isPhysical ? (
                                  <>
                                    <div className="font-medium text-slate-800">{o.shipping_address}, {o.city}</div>
                                    <div className="text-slate-400 text-[10px] mt-0.5">Phone: {o.customer_phone}</div>
                                  </>
                                ) : (
                                  <span className="text-slate-400">Instant Delivery</span>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                <Badge className={
                                  o.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  o.status === "Shipped" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                                  "bg-amber-50 text-amber-700 border border-amber-200"
                                }>
                                  {o.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 font-mono text-xs text-slate-500">
                                {o.tracking_id ? (
                                  <span className="text-slate-900 font-semibold">{o.tracking_id}</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="py-4 px-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 text-slate-900 p-2 shadow-xl rounded-xl">
                                    <div className="px-2 py-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Set Order Status</div>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    
                                    {isPhysical && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setTrackingOrderInfo({ id: o.id, currentTracking: o.tracking_id || null });
                                          setTrackingIdInput(o.tracking_id || "");
                                          setIsTrackingDialogOpen(true);
                                        }}
                                        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-md"
                                      >
                                        <Truck className="w-4 h-4 text-indigo-600" /> {o.tracking_id ? "Update Tracking ID" : "Mark as Shipped"}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Processing")}
                                      className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-md"
                                    >
                                      <MoreHorizontal className="w-4 h-4 text-amber-500" /> Mark as Processing
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => updateOrderStatus(o.id, "Delivered")}
                                      className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-md"
                                    >
                                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Mark as Delivered
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        if (!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;
                                        updateOrderStatus(o.id, "Cancelled");
                                      }}
                                      className="flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-md"
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
                    {orders.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No purchases registered yet.</div>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Edit / Make Changes Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-600" />
              Edit / Make Changes to Project
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Update project details, screenshots, demo video, code links, pricing, or description. Changes reflect immediately across the store.
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold">Project Title</Label>
                  <Input
                    required
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 h-10 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold">Category</Label>
                  <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold">Price (₹)</Label>
                  <Input
                    required
                    type="number"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 h-10 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold">Difficulty</Label>
                  <Select value={editForm.difficulty} onValueChange={v => setEditForm({ ...editForm, difficulty: v })}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold">Delivery Type</Label>
                  <Select value={editForm.delivery_type} onValueChange={v => setEditForm({ ...editForm, delivery_type: v })}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                      <SelectItem value="digital">Digital (Instant Download)</SelectItem>
                      <SelectItem value="physical">Physical (Hardware Shipping)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold">Technologies (comma separated)</Label>
                  <Input
                    required
                    value={editForm.tech}
                    onChange={e => setEditForm({ ...editForm, tech: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 h-10 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold">Description</Label>
                  <Textarea
                    required
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-700 text-xs font-semibold">Features (one per line)</Label>
                  <Textarea
                    value={editForm.features}
                    onChange={e => setEditForm({ ...editForm, features: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-700 text-xs font-semibold">What's Included (one per line)</Label>
                  <Textarea
                    value={editForm.includes}
                    onChange={e => setEditForm({ ...editForm, includes: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold">GitHub Repository ZIP Link (Optional)</Label>
                  <Input
                    type="url"
                    value={editForm.github_url}
                    onChange={e => setEditForm({ ...editForm, github_url: e.target.value })}
                    placeholder="https://github.com/username/repo/archive/refs/heads/main.zip"
                    className="bg-white border-slate-200 text-slate-900 h-10 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold flex items-center gap-2">
                    <span>Price Note / Extra Cost Note (Optional)</span>
                    <span className="text-[10px] text-rose-500 font-normal">(Shown in red smallest font above Tech Stack)</span>
                  </Label>
                  <Input
                    value={editForm.price_note}
                    onChange={e => setEditForm({ ...editForm, price_note: e.target.value })}
                    placeholder="e.g. * Extra ₹500 for deployment support, or base price includes basic setup only"
                    className="bg-white border-slate-200 text-slate-900 h-10 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-700 text-xs font-semibold">Replace Cover Image (Optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditForm({ ...editForm, image: e.target.files?.[0] || null })}
                    className="bg-white border-slate-200 text-slate-900 h-10 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-200 text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-slate-700 text-xs font-semibold">Replace Screenshots (Multiple - Optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => setEditForm({ ...editForm, screenshots: e.target.files })}
                    className="bg-white border-slate-200 text-slate-900 h-10 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-200 text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-700 text-xs font-semibold">Replace Demo Video (Optional)</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={e => setEditForm({ ...editForm, video: e.target.files?.[0] || null })}
                    className="bg-white border-slate-200 text-slate-900 h-10 file:text-slate-700 file:border-0 file:bg-slate-100 file:h-full file:px-3 file:mr-3 file:rounded-md hover:file:bg-slate-200 text-xs cursor-pointer"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-end pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-10 rounded-full font-semibold shadow-sm disabled:opacity-50 border-0"
                >
                  {isUpdating ? "Saving..." : "Save Project Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking ID Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 sm:max-w-md shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Enter Tracking Details</DialogTitle>
            <DialogDescription className="text-slate-500">
              Provide the courier tracking ID to mark this order as shipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tracking-id" className="text-slate-700 mb-2 block font-medium">Tracking ID (e.g., DTDC)</Label>
            <Input 
              id="tracking-id" 
              value={trackingIdInput} 
              onChange={e => setTrackingIdInput(e.target.value)} 
              placeholder="Enter tracking number" 
              className="bg-white border-slate-200 text-slate-900 h-11 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500" 
              autoFocus 
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsTrackingDialogOpen(false)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200">
              Cancel
            </Button>
            <Button onClick={() => {
              if (trackingOrderInfo) {
                updateOrderStatus(trackingOrderInfo.id, "Shipped", trackingIdInput.trim() || undefined);
                setIsTrackingDialogOpen(false);
              }
            }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-0 transition-all">
              Save Tracking & Ship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
