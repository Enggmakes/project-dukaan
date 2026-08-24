import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/ProjectCard";
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
  Heart
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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
    if (order.github_url) {
      let finalUrl = order.github_url;
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
      
      toast.success("Project downloading successfully! Thank you.");
    } else {
      // Fallback for older orders without a github url
      toast.error("This order doesn't have a download link attached. Please contact support.");
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
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-glow"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-slate-50/50 py-12 text-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* PROFILE SUMMARY HERO CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 mb-10 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden border border-slate-200/80 shadow-sm">
            {/* User Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 grid place-items-center text-3xl font-bold tracking-wider text-white shadow-sm">
              {getInitials()}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {user?.user_metadata?.full_name || "Dukaan Builder"}
                </h1>
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full px-3 py-0.5 text-xs font-semibold">
                  Verified Builder
                </Badge>
              </div>
              <p className="text-slate-500 text-sm font-mono">{user?.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-900 font-semibold">{orders.length}</span> Projects Purchased
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Member since {new Date(user?.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full md:w-auto flex md:flex-col justify-center gap-3">
              {user?.email === import.meta.env.VITE_ADMIN_EMAIL && (
                <Button 
                  onClick={() => navigate("/admin")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full px-6 py-2 border border-slate-200 font-medium text-xs shadow-none"
                >
                  Admin Console
                </Button>
              )}
              <Button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full px-6 py-2 border border-rose-200 font-medium text-xs flex items-center gap-2 shadow-none"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          </div>

          {/* ACTIVE & COMPLETED PURCHASES SECTION */}
          <div className="space-y-8">
            <Tabs defaultValue="purchases" className="w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight hidden md:block text-slate-900">My Project Registry</h2>
                <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-full">
                  <TabsTrigger value="purchases" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-5 py-1.5 font-medium transition-all">Purchases ({orders.length})</TabsTrigger>
                  {user?.email !== import.meta.env.VITE_ADMIN_EMAIL && (
                    <TabsTrigger value="wishlist" className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-5 py-1.5 font-medium transition-all">Wishlist ({wishlist.length})</TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="purchases" className="mt-0">

            {orders.length === 0 ? (
              /* EMPTY REGISTRY STATE */
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full grid place-items-center mx-auto">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Your project library is empty</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Buy hardware kits or digital blueprints from our marketplace to unlock source code, diagrams, and physical testing timelines.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/marketplace")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-11 text-sm font-semibold shadow-sm transition-all"
                >
                  Browse Marketplace <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              /* ORDERS TIMELINE AND DOWNLOAD REGISTRY */
              <div className="grid gap-8">
                {orders.map((o) => {
                  const isPhysical = o.delivery_type === "physical";
                  const status = o.status || "Processing";
                  
                  // Shipment Timeline Steps index logic
                  let activeStep = 1; // "Order Placed" is always active
                  if (status === "Processing") activeStep = 2; // Placed & QC Testing
                  if (status === "Shipped") activeStep = 3; // Placed, QC, Dispatched
                  if (status === "Delivered") activeStep = 4; // All complete

                  return (
                    <div key={o.id} className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
                      
                      {/* Order Title, Metadata and Type */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-slate-400 font-semibold">Order #{o.id.substring(0, 8).toUpperCase()}</span>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{o.project_title}</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                            <span>Purchased: {new Date(o.created_at).toLocaleDateString()}</span>
                            <span>Amount: ₹{o.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={isPhysical ? "bg-sky-50 text-sky-700 border-sky-200 rounded-full py-1 px-3" : "bg-purple-50 text-purple-700 border-purple-200 rounded-full py-1 px-3"}>
                            {isPhysical ? "Physical Hardware Kit" : "Digital Blueprint"}
                          </Badge>
                        </div>
                      </div>

                      {/* PHYSICAL KIT courier delivery tracker block */}
                      {isPhysical && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                              <Truck className="w-4 h-4 text-indigo-600 animate-pulse" />
                              Kit Shipping Tracker
                            </span>
                            
                            {/* Tracking ID Badge with copy */}
                            {o.tracking_id ? (
                              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-xs">
                                <span className="text-slate-500">Courier:</span>
                                <span className="text-indigo-600 font-mono font-bold">{o.tracking_id}</span>
                                <button 
                                  onClick={() => copyToClipboard(o.tracking_id)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors ml-1"
                                  title="Copy Courier Tracking ID"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Courier Details updating post QC checklist</span>
                            )}
                          </div>

                          {/* Shipment Timeline Steps */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative pt-4">
                            
                            {/* Step 1: Placed */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${activeStep >= 1 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"}`}>
                                  1
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-200 hidden md:block" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">Order Placed</div>
                                <div className="text-[10px] text-slate-400">Verified payment</div>
                              </div>
                            </div>

                            {/* Step 2: Testing */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${activeStep >= 2 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"}`}>
                                  2
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-200 hidden md:block" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">Kit Testing & Packing</div>
                                <div className="text-[10px] text-slate-400">Component calibration</div>
                              </div>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${activeStep >= 3 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"}`}>
                                  3
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-200 hidden md:block" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">Dispatched (DTDC)</div>
                                <div className="text-[10px] text-slate-400">{o.tracking_id ? "Tracking ID active" : "In courier transit"}</div>
                              </div>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${activeStep >= 4 ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"}`}>
                                  4
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">Delivered</div>
                                <div className="text-[10px] text-slate-400">Enjoy your hardware project!</div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* DIGITAL ASSETS AND LIFETIME DOWNLOAD OPTIONS (Both Digital & Physical Kits get this!) */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            Lifetime Digital Access Unlocked
                          </div>
                          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                            Includes complete microcontroller source code, circuit wiring diagrams, step-by-step assembly manual, 3D printing STL files (if applicable), and component datasheet lists.
                          </p>
                          <div className="pt-2 flex items-center gap-3">
                            <span className="text-[10px] font-mono bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500">
                              License Key: PD-{o.id.substring(0,4).toUpperCase()}-{o.id.substring(4,8).toUpperCase()}-LIFETIME
                            </span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto">
                          <Button 
                            onClick={() => handleDownload(o)}
                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full px-6 h-11 flex items-center justify-center gap-2 shadow-sm transition-all border-0"
                          >
                            <Download className="w-4 h-4" /> Download Files (ZIP)
                          </Button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
              </TabsContent>

              {user?.email !== import.meta.env.VITE_ADMIN_EMAIL && (
                <TabsContent value="wishlist" className="mt-0">
                  {wishlist.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                      <div className="w-16 h-16 bg-slate-100 rounded-full grid place-items-center mx-auto">
                        <Heart className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Your wishlist is empty</h3>
                      <p className="text-slate-500 text-sm">Save projects you like by clicking the "Add to wishlist" button on the project details page.</p>
                      <Button onClick={() => navigate("/marketplace")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 mt-2 shadow-sm border-0 transition-all font-semibold">
                        Browse Projects
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
