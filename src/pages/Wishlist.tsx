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
  ArrowRight, 
  ChevronRight,
  Loader2
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-200/80 text-xs font-semibold text-rose-700 mb-2.5">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Saved Blueprints</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Engineering Wishlist
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              Save blueprints to compare architectures, inspect BOMs, or consult directly with our engineering team before ordering.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-900 font-bold">{wishlist.length}</span> Blueprints Saved
            </span>
          </div>
        </div>

        {/* Content */}
        {!user ? (
          /* Not Signed In Card */
          <div className="tech-card p-10 text-center max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
            <div className="w-14 h-14 rounded-xl bg-rose-50 text-rose-600 grid place-items-center mx-auto border border-rose-100">
              <Heart className="w-7 h-7 fill-rose-500/20 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign in to Access Your Wishlist</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Log in to sync your saved blueprints across devices, receive price-drop alerts, and chat live with our technical leads.
              </p>
            </div>
            <Link to="/login?redirect=/wishlist" className="block">
              <Button className="w-full rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs h-10 shadow-xs">
                Sign in to View Wishlist
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="tech-card p-16 text-center bg-white border border-slate-200 rounded-xl">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-xs font-medium">Loading your saved blueprints...</p>
          </div>
        ) : wishlist.length === 0 ? (
          /* Empty Wishlist */
          <div className="tech-card p-10 text-center max-w-lg mx-auto bg-white border border-slate-200 rounded-xl shadow-xs space-y-6">
            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 grid place-items-center mx-auto border border-slate-200">
              <Heart className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                Explore our catalog of AI, Robotics, and Web blueprints and click the heart icon on any project card to bookmark it here.
              </p>
            </div>
            <Button
              onClick={() => navigate("/marketplace")}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10 shadow-xs"
            >
              Explore Project Marketplace <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.map((p) => {
              const isHardware = p.delivery_type === "physical" || p.category === "Robotics" || p.category === "IoT";

              return (
                <div
                  key={p.id}
                  className="tech-card bg-white border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={p.thumb || "/placeholder.svg"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200 rounded-md text-[10px] font-bold shadow-xs">
                          {p.category}
                        </Badge>
                        {isHardware && (
                          <Badge className="bg-amber-500 text-white text-[10px] font-bold rounded-md shadow-xs">
                            Hardware Kit
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(p.id, p.wishlist_id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md text-slate-500 hover:text-rose-600 grid place-items-center shadow-xs transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {p.difficulty || "Engineering Grade"}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹{Number(p.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <Link to={`/project/${p.id}`}>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
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
                        className="flex-1 rounded-lg text-xs font-semibold h-9 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 gap-1.5 transition-all shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chat & Inquire</span>
                      </Button>

                      {/* Buy / View Project Button */}
                      <Link to={`/project/${p.id}`} className="flex-1">
                        <Button className="w-full rounded-lg text-xs font-semibold h-9 bg-slate-900 hover:bg-slate-800 text-white gap-1 shadow-xs">
                          <span>View Blueprint</span>
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
