import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ProductChatDrawer from "@/components/ProductChatDrawer";
import { 
  Heart, 
  Trash2, 
  MessageSquare, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function Wishlist() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatProject, setChatProject] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      setUser(session.user);

      try {
        const { data, error } = await supabase
          .from("wishlists")
          .select(`
            id,
            project_id,
            projects (*)
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not load wishlist from Supabase:", error);
          // Fallback to local storage if any
          const localSaved = JSON.parse(localStorage.getItem("projectdukaan_wishlist") || "[]");
          setWishlist(localSaved);
        } else if (data) {
          const validProjects = data.map((w: any) => ({
            ...w.projects,
            wishlist_id: w.id
          })).filter(Boolean);
          setWishlist(validProjects);
        }
      } catch (err) {
        console.error("Wishlist error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRemoveFromWishlist = async (projectId: string, wishlistId?: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== projectId));
    toast.success("Removed from wishlist");

    try {
      if (user && wishlistId) {
        await supabase.from("wishlists").delete().eq("id", wishlistId);
      }
      // Also update local storage
      const localSaved = JSON.parse(localStorage.getItem("projectdukaan_wishlist") || "[]");
      const updated = localSaved.filter((p: any) => p.id !== projectId);
      localStorage.setItem("projectdukaan_wishlist", JSON.stringify(updated));
    } catch (err) {
      console.warn("Error removing from database:", err);
    }
  };

  const handleOpenChat = (p: any) => {
    setChatProject(p);
    setIsChatOpen(true);
  };

  return (
    <Layout>
      <Helmet>
        <title>My Saved Projects | Wishlist & Customization — ProjectDukaan</title>
        <meta name="description" content="View your saved engineering blueprints, request custom modifications, or chat directly with lead engineers before purchasing." />
      </Helmet>

      <div className="container-px max-w-6xl mx-auto py-10 md:py-16 bleed-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/90 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-600 mb-2.5">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Saved Blueprints</span>
            </div>
            <h1 className="text-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              My Project Wishlist
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              Save blueprints to compare architectures, request hardware sensor upgrades, or chat directly with our engineering team before ordering.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              <span className="text-slate-900 font-extrabold">{wishlist.length}</span> Blueprints Saved
            </span>
          </div>
        </div>

        {/* Content */}
        {!user ? (
          /* Not Signed In Card */
          <div className="bento-card p-12 text-center max-w-md mx-auto bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 grid place-items-center mx-auto shadow-2xs">
              <Heart className="w-8 h-8 fill-rose-500/20 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Sign in to Access Your Wishlist</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Log in to sync your saved blueprints across devices, receive price-drop alerts, and chat live with our technical leads.
              </p>
            </div>
            <Link to="/login?redirect=/wishlist" className="block">
              <Button className="w-full rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs h-11 shadow-sm">
                Sign in to View Wishlist
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="bento-card p-16 text-center bg-white border border-slate-200">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-xs font-semibold">Loading your saved blueprints...</p>
          </div>
        ) : wishlist.length === 0 ? (
          /* Empty Wishlist */
          <div className="bento-card p-12 text-center max-w-lg mx-auto bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
              <Heart className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                Explore our catalog of AI, Robotics, and Web blueprints and click the heart icon on any project card to bookmark it here.
              </p>
            </div>
            <Button
              onClick={() => navigate("/marketplace")}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 h-11 shadow-md shadow-indigo-600/25"
            >
              Explore Project Marketplace <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          /* Wishlist Bento Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.map((p) => {
              const isHardware = p.delivery_type === "physical" || p.category === "Robotics" || p.category === "IoT";

              return (
                <div
                  key={p.id}
                  className="bento-card bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={p.thumb || "/placeholder.svg"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200 text-[10px] font-bold shadow-2xs">
                          {p.category}
                        </Badge>
                        {isHardware && (
                          <Badge className="bg-amber-500 text-white text-[10px] font-bold shadow-2xs">
                            Hardware Kit
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(p.id, p.wishlist_id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-500 hover:text-rose-600 grid place-items-center shadow-xs transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-400 text-[11px]">
                          {p.difficulty || "Engineering Grade"}
                        </span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{Number(p.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <Link to={`/project/${p.id}`}>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
                          {p.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.short || p.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2 pt-3">
                      {/* Direct Chat with Engineer Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChat(p)}
                        className="flex-1 rounded-full text-xs font-bold h-10 border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 gap-1.5 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Chat & Inquire</span>
                      </Button>

                      {/* Buy / View Project Button */}
                      <Link to={`/project/${p.id}`} className="flex-1">
                        <Button className="w-full rounded-full text-xs font-bold h-10 bg-slate-950 hover:bg-slate-800 text-white gap-1 shadow-2xs">
                          <span>View & Buy</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Product Chat Drawer */}
      <ProductChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        project={chatProject}
      />
    </Layout>
  );
}
