import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/ProjectCard";
import { isUserAdmin, checkAdminStatus } from "@/lib/authUtils";
import { 
  User, 
  ShoppingBag, 
  Download, 
  Truck, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  FileText, 
  LogOut, 
  ChevronRight, 
  Heart, 
  FolderGit2, 
  HardDrive, 
  Video, 
  Sparkles, 
  ShieldCheck, 
  Loader2,
  Cpu,
  Key,
  Layers,
  Terminal
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to view your profile");
        navigate("/login?redirect=/profile");
        return;
      }
      setUser(session.user);
      const admin = await checkAdminStatus(session.user);
      setIsAdmin(admin);

      // Fetch all orders and filter client-side to prevent case/whitespace issues
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load purchases");
      } else if (ordersData) {
        const userEmail = session.user.email.trim().toLowerCase();
        const myOrders = ordersData.filter((o: any) => 
          o.customer_email && o.customer_email.trim().toLowerCase() === userEmail
        );
        setOrders(myOrders);
      }

      // Fetch wishlist
      const { data: wishlistData } = await supabase
        .from("wishlists")
        .select(`
          id,
          project_id,
          projects (*)
        `)
        .eq('user_id', session.user.id);
        
      if (wishlistData) {
        setWishlist(wishlistData.map((w: any) => w.projects).filter(Boolean));
      }

      setLoading(false);
    };

    fetchSessionAndOrders();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setOrders([]);
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tracking ID copied to clipboard!");
  };

  const handleDownload = (order: any) => {
    const gitUrl = order.deliverables?.github_url || order.github_url;
    if (gitUrl) {
      let finalUrl = gitUrl;
      // If the user pasted a standard github repo link (with or without .git), auto-format it to a ZIP download
      if (finalUrl.includes("github.com") && !finalUrl.includes("/archive/")) {
        // Remove .git if it exists
        finalUrl = finalUrl.replace(/\.git$/, '');
        // Append zip path
        finalUrl = `${finalUrl}/archive/refs/heads/main.zip`;
      }
      
      const element = document.createElement("a");
      element.href = finalUrl;
      element.target = "_blank";
      element.download = `${order.project_title.replace(/\s+/g, '_')}_source.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast.success("Repository archive (.zip) downloading! Thank you.");
    } else {
      // Fallback for older orders without a github url
      toast.error("This order doesn't have a repository link attached. Please contact support.");
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email;
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#070a12] text-slate-400 font-mono gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs uppercase tracking-wider">LOADING_BUILDER_REGISTRY...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-[#070a12] py-8 sm:py-12 text-slate-200 relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 relative z-10 space-y-8">
          
          {/* PROFILE SUMMARY HERO CARD */}
          <div className="bg-[#090e1c] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden border border-slate-800/90 shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* User Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl bg-[#070a12] border border-amber-500/40 grid place-items-center text-2xl font-mono font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {getInitials()}
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090e1c] shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  {user?.user_metadata?.full_name || "Engineering Builder"}
                </h1>
                <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold">
                  VERIFIED_BUILDER
                </Badge>
                {isAdmin && (
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold">
                    SYS_ADMIN
                  </Badge>
                )}
              </div>
              
              <p className="text-slate-400 text-xs sm:text-sm font-mono truncate">{user?.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 pt-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2 bg-[#070a12] px-3 py-1.5 rounded-lg border border-slate-800">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong className="text-white">{orders.length}</strong> Projects Purchased</span>
                </div>
                <div className="flex items-center gap-2 bg-[#070a12] px-3 py-1.5 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Active since {new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>SHA-256 HMAC VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full md:w-auto flex md:flex-col justify-center gap-2.5 shrink-0 pt-2 md:pt-0">
              {isAdmin && (
                <Button 
                  onClick={() => navigate("/admin")}
                  className="bg-[#070a12] hover:bg-slate-800 text-amber-300 rounded-lg px-5 py-2 border border-amber-500/40 font-mono text-xs shadow-xs gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" /> Admin Console
                </Button>
              )}
              <Button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg px-5 py-2 border border-rose-500/20 font-mono text-xs flex items-center gap-2 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </Button>
            </div>
          </div>

          {/* ACTIVE & COMPLETED PURCHASES SECTION */}
          <div className="space-y-6">
            <Tabs defaultValue="purchases" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-mono text-white">
                    MY_PROJECT_REGISTRY
                  </h2>
                </div>
                <TabsList className="bg-[#090e1c] border border-slate-800 p-1 rounded-xl font-mono text-xs self-start sm:self-auto">
                  <TabsTrigger 
                    value="purchases" 
                    className="text-slate-400 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg px-4 py-1.5 transition-all"
                  >
                    Purchases ({orders.length})
                  </TabsTrigger>
                  {!isAdmin && (
                    <TabsTrigger 
                      value="wishlist" 
                      className="text-slate-400 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg px-4 py-1.5 transition-all"
                    >
                      Wishlist ({wishlist.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="purchases" className="mt-0">
                {orders.length === 0 ? (
                  /* EMPTY REGISTRY STATE */
                  <div className="bg-[#090e1c] border border-slate-800/90 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-2xl">
                    <div className="w-16 h-16 bg-[#070a12] border border-slate-800 rounded-2xl grid place-items-center mx-auto text-amber-400 shadow-inner">
                      <ShoppingBag className="w-8 h-8 opacity-80" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white font-mono">YOUR_REGISTRY_IS_EMPTY</h3>
                      <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-sans">
                        Acquire production blueprints or hardware kits from our engineering catalog to unlock source repositories, schematics, and live test logs.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate("/marketplace")}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl px-7 h-11 text-xs font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
                    >
                      BROWSE_CATALOG <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                ) : (
                  /* ORDERS TIMELINE AND DOWNLOAD REGISTRY */
                  <div className="grid gap-6">
                    {orders.map((o) => {
                      const isPhysical = o.delivery_type === "physical";
                      const status = o.status || "Processing";
                      
                      let activeStep = 1;
                      if (status === "Processing") activeStep = 2;
                      if (status === "Shipped") activeStep = 3;
                      if (status === "Delivered") activeStep = 4;

                      return (
                        <div 
                          key={o.id} 
                          className="bg-[#090e1c] rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-800/90 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-slate-700"
                        >
                          {/* Order Title, Metadata and Type */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-amber-400 bg-[#070a12] border border-slate-800 px-2 py-0.5 rounded">
                                  ORDER #{o.id.substring(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                  {new Date(o.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
                                {o.project_title}
                              </h3>
                              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-0.5">
                                <span>Paid: <strong className="text-emerald-400">₹{o.amount.toLocaleString('en-IN')}</strong></span>
                                <span className="text-slate-600">•</span>
                                <span>Status: <strong className="text-slate-200 capitalize">{status}</strong></span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge className={
                                isPhysical 
                                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 rounded-lg py-1 px-3 font-mono text-[11px]" 
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/30 rounded-lg py-1 px-3 font-mono text-[11px]"
                              }>
                                {isPhysical ? "Physical Hardware Kit" : "Digital Blueprint"}
                              </Badge>
                            </div>
                          </div>

                          {/* PHYSICAL KIT courier delivery tracker block */}
                          {isPhysical && (
                            <div className="space-y-5 bg-[#070a12] border border-slate-800/80 rounded-xl p-4 sm:p-5">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <span className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-amber-400 animate-pulse" />
                                  HARDWARE_DISPATCH_TRACKER
                                </span>
                                
                                {/* Tracking ID Badge with copy */}
                                {o.tracking_id ? (
                                  <div className="flex items-center gap-2 bg-[#090e1c] border border-slate-700 rounded-lg px-3 py-1 text-xs font-mono">
                                    <span className="text-slate-400">Courier:</span>
                                    <span className="text-amber-400 font-bold">{o.tracking_id}</span>
                                    <button 
                                      onClick={() => copyToClipboard(o.tracking_id)}
                                      className="text-slate-400 hover:text-amber-300 p-0.5 rounded transition-colors ml-1"
                                      title="Copy Courier Tracking ID"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 font-mono italic">Tracking ID assigned post QC calibration</span>
                                )}
                              </div>

                              {/* Shipment Timeline Steps */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative pt-2">
                                {/* Step 1: Placed */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-mono font-bold ${
                                      activeStep >= 1 ? "bg-amber-500 text-slate-950 shadow-xs" : "bg-slate-900 border border-slate-800 text-slate-500"
                                    }`}>
                                      1
                                    </div>
                                    <div className={`h-0.5 flex-1 hidden md:block ${activeStep >= 2 ? "bg-amber-500" : "bg-slate-800"}`} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-semibold text-white">Order Confirmed</div>
                                    <div className="text-[10px] font-mono text-slate-500">Verified payment</div>
                                  </div>
                                </div>

                                {/* Step 2: Testing */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-mono font-bold ${
                                      activeStep >= 2 ? "bg-amber-500 text-slate-950 shadow-xs" : "bg-slate-900 border border-slate-800 text-slate-500"
                                    }`}>
                                      2
                                    </div>
                                    <div className={`h-0.5 flex-1 hidden md:block ${activeStep >= 3 ? "bg-amber-500" : "bg-slate-800"}`} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-semibold text-white">QC Calibration</div>
                                    <div className="text-[10px] font-mono text-slate-500">Component testing</div>
                                  </div>
                                </div>

                                {/* Step 3: Shipped */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-mono font-bold ${
                                      activeStep >= 3 ? "bg-amber-500 text-slate-950 shadow-xs" : "bg-slate-900 border border-slate-800 text-slate-500"
                                    }`}>
                                      3
                                    </div>
                                    <div className={`h-0.5 flex-1 hidden md:block ${activeStep >= 4 ? "bg-amber-500" : "bg-slate-800"}`} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-semibold text-white">In Transit</div>
                                    <div className="text-[10px] font-mono text-slate-500">{o.tracking_id ? "Dispatched" : "Carrier pickup"}</div>
                                  </div>
                                </div>

                                {/* Step 4: Delivered */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-mono font-bold ${
                                      activeStep >= 4 ? "bg-emerald-500 text-slate-950 shadow-xs" : "bg-slate-900 border border-slate-800 text-slate-500"
                                    }`}>
                                      4
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-semibold text-white">Delivered</div>
                                    <div className="text-[10px] font-mono text-slate-500">Consignment received</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* CUSTOM PROJECT DELIVERABLES (GitHub, Drive, Video, PDF, Handover Notes) */}
                          {(() => {
                            const dev = o.deliverables || {};
                            const githubUrl = dev.github_url || o.github_url;
                            const driveUrl = dev.drive_url;
                            const videoUrl = dev.video_url;
                            const pdfUrl = dev.pdf_url;
                            const adminNotes = dev.admin_notes;
                            const hasAnyCustom = Boolean(githubUrl || driveUrl || videoUrl || pdfUrl || adminNotes);

                            return (
                              <div className="space-y-4">
                                {hasAnyCustom ? (
                                  <div className="bg-[#070a12] border border-slate-800 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>PERSONALIZED_ENGINEERING_PACKAGE</span>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono font-semibold">
                                        ALLOCATED_BY_LEAD_ENGINEER
                                      </Badge>
                                    </div>

                                    {/* Deliverable Action Buttons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                                      {githubUrl && (
                                        <a
                                          href={githubUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between p-3 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-800/60 transition-all group"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#070a12] border border-slate-700/80 text-cyan-400 flex items-center justify-center shrink-0">
                                              <FolderGit2 className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                                                GitHub Repo
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-500 truncate">Source Code & Branch</div>
                                            </div>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-1" />
                                        </a>
                                      )}

                                      {driveUrl && (
                                        <a
                                          href={driveUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between p-3 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-blue-400/50 hover:bg-slate-800/60 transition-all group"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#070a12] border border-slate-700/80 text-blue-400 flex items-center justify-center shrink-0">
                                              <HardDrive className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                                                Google Drive
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-500 truncate">Datasets & 3D Files</div>
                                            </div>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-1" />
                                        </a>
                                      )}

                                      {videoUrl && (
                                        <a
                                          href={videoUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between p-3 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-rose-400/50 hover:bg-slate-800/60 transition-all group"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#070a12] border border-slate-700/80 text-rose-400 flex items-center justify-center shrink-0">
                                              <Video className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-rose-400 transition-colors truncate">
                                                Video Tutorial
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-500 truncate">Setup & Demo Video</div>
                                            </div>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 shrink-0 ml-1" />
                                        </a>
                                      )}

                                      {pdfUrl && (
                                        <a
                                          href={pdfUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between p-3 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-amber-400/50 hover:bg-slate-800/60 transition-all group"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#070a12] border border-slate-700/80 text-amber-400 flex items-center justify-center shrink-0">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                                                Thesis & PDF
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-500 truncate">Report & Synopsis</div>
                                            </div>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 ml-1" />
                                        </a>
                                      )}
                                    </div>

                                    {/* Engineer Notes Callout */}
                                    {adminNotes && (
                                      <div className="bg-[#090e1c] border border-amber-500/30 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                          <span>ENGINEER_HANDOVER_INSTRUCTIONS:</span>
                                        </div>
                                        <p className="text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed font-mono bg-[#070a12] p-3 rounded-lg border border-slate-800">
                                          {adminNotes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-[#070a12] border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-400 flex items-center justify-between flex-wrap gap-2">
                                    <span className="flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                      Personalized GitHub repo, Google Drive assets, and walkthrough are being prepared by your engineer.
                                    </span>
                                    <span className="text-[11px] text-slate-500">AVAILABLE_SHORTLY</span>
                                  </div>
                                )}

                                {/* DIGITAL ASSETS AND LIFETIME DOWNLOAD OPTIONS */}
                                <div className="bg-[#070a12] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-emerald-400">
                                      <CheckCircle className="w-4 h-4" />
                                      LIFETIME_DIGITAL_ACCESS_UNLOCKED
                                    </div>
                                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-sans">
                                      Includes complete microcontroller source code, circuit wiring diagrams, step-by-step assembly manual, 3D printing STL files (if applicable), and component datasheet lists.
                                    </p>
                                    <div className="pt-1 flex items-center gap-2">
                                      <span className="text-[10px] font-mono bg-[#090e1c] border border-slate-800 rounded px-2.5 py-1 text-slate-400 flex items-center gap-1.5">
                                        <Key className="w-3 h-3 text-amber-400" />
                                        LICENSE: PD-{o.id.substring(0,4).toUpperCase()}-{o.id.substring(4,8).toUpperCase()}-LIFETIME
                                      </span>
                                    </div>
                                  </div>

                                  <div className="w-full md:w-auto shrink-0">
                                    <Button 
                                      onClick={() => handleDownload(o)}
                                      className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold rounded-xl px-6 h-11 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer border-0"
                                    >
                                      <Download className="w-4 h-4" /> DOWNLOAD REPO (.zip)
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {!isAdmin && (
                <TabsContent value="wishlist" className="mt-0">
                  {wishlist.length === 0 ? (
                    <div className="bg-[#090e1c] border border-slate-800/90 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
                      <div className="w-16 h-16 bg-[#070a12] border border-slate-800 rounded-2xl grid place-items-center mx-auto text-rose-400 shadow-inner">
                        <Heart className="w-8 h-8 opacity-80" />
                      </div>
                      <h3 className="text-xl font-bold text-white font-mono">YOUR_WISHLIST_IS_EMPTY</h3>
                      <p className="text-slate-400 text-xs sm:text-sm font-sans">Bookmark blueprints and kits you want to build next from the catalog.</p>
                      <Button 
                        onClick={() => navigate("/marketplace")} 
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold rounded-xl px-8 mt-2 shadow-md border-0 transition-all text-xs"
                      >
                        BROWSE_CATALOG
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {wishlist.map((project) => (
                        <div key={project.id} className="relative group">
                          <ProjectCard project={project} />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

        </div>
      </section>
    </Layout>
  );
}
