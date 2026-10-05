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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6 mb-8 font-mono">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/60 border border-rose-800 text-xs font-semibold text-rose-400 mb-2.5">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>SYS:\SAVED_BLUEPRINTS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              ENGINEERING_WISHLIST
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl font-mono">
              Save blueprints to compare architectures, inspect BOMs, or consult directly with our engineering team before ordering.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-slate-300 bg-[#0d121e] px-3.5 py-1.5 rounded border border-slate-800 shadow-xs">
              <span className="text-amber-400 font-bold">{wishlist.length}</span> BLUEPRINTS_SAVED
            </span>
          </div>
        </div>

        {/* Content */}
        {!user ? (
          /* Not Signed In Card */
          <div className="p-10 text-center max-w-md mx-auto bg-[#0a0e17] border-2 border-slate-800 rounded-md shadow-2xl space-y-5 font-mono relative overflow-hidden">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="w-14 h-14 rounded-full bg-rose-950/60 text-rose-400 grid place-items-center mx-auto border border-rose-800 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <Heart className="w-7 h-7 fill-rose-500/20 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono">// AUTHENTICATION_REQUIRED</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-mono">
                Log in to sync your saved blueprints across devices, receive price-drop alerts, and chat live with our technical leads.
              </p>
            </div>
            <Link to="/login?redirect=/wishlist" className="block">
              <Button className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono text-xs h-11 shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn">
                [EXEC] SIGN_IN_TO_ACCESS
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="p-16 text-center bg-[#0d121e] border-2 border-slate-800 rounded-md font-mono">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-mono">SYS:\FETCHING_SAVED_BLUEPRINTS...</p>
          </div>
        ) : wishlist.length === 0 ? (
          /* Empty Wishlist */
          <div className="p-10 text-center max-w-lg mx-auto bg-[#0a0e17] border-2 border-slate-800 rounded-md shadow-2xl space-y-6 font-mono relative overflow-hidden">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="w-14 h-14 rounded-full bg-slate-900 text-slate-500 grid place-items-center mx-auto border border-slate-800">
              <Heart className="w-7 h-7 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono">// WISHLIST_EMPTY</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-sm mx-auto font-mono">
                Explore our catalog of AI, Robotics, and Web blueprints and click the heart icon on any project card to bookmark it here.
              </p>
            </div>
            <Button
              onClick={() => navigate("/marketplace")}
              className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono text-xs px-5 h-11 shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn"
            >
              [+] EXPLORE_BLUEPRINTS <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-mono">
            {wishlist.map((p) => {
              const isHardware = p.delivery_type === "physical" || p.category === "Robotics" || p.category === "IoT";

              return (
                <div
                  key={p.id}
                  className="bg-[#0d121e] border-2 border-slate-800 shadow-xl hover:border-amber-500/60 transition-all duration-200 rounded-md overflow-hidden flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#05070c]">
                      <img
                        src={p.thumb || "/placeholder.svg"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-[#0d121e]/90 backdrop-blur-md text-cyan-300 border border-slate-700 rounded px-2 py-0.5 text-[10px] font-bold shadow-xs">
                          {p.category}
                        </span>
                        {isHardware && (
                          <span className="bg-amber-500 text-amber-950 text-[10px] font-black rounded px-2 py-0.5 shadow-xs">
                            HARDWARE
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(p.id, p.wishlist_id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded bg-[#070a12]/90 backdrop-blur-md text-slate-400 hover:text-rose-400 hover:border-rose-800 grid place-items-center border border-slate-700 shadow-xs transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-cyan-400 text-[11px]">
                          SYS:\BP_{p.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className="font-mono font-black text-amber-400 text-base drop-shadow-[0_0_8px_rgba(255,176,0,0.3)]">
                          ₹{Number(p.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <Link to={`/project/${p.id}`}>
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 hover:text-amber-400 transition-colors font-mono">
                          {p.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-mono">
                        {p.short || p.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 border-t border-slate-800 bg-[#070a12]/60 flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2 pt-3">
                      {/* Direct Chat with Engineer Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChat(p)}
                        className="flex-1 rounded text-xs font-mono font-semibold h-9 border-slate-700 text-slate-300 bg-[#090d16] hover:bg-slate-800 hover:text-white gap-1.5 transition-all shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>CHAT_DESK</span>
                      </Button>

                      {/* Buy / View Project Button */}
                      <Link to={`/project/${p.id}`} className="flex-1">
                        <Button className="w-full rounded text-xs font-mono font-black h-9 bg-amber-500 hover:bg-amber-400 text-amber-950 gap-1 shadow-[0_2px_0_#92400e] border border-amber-300 retro-btn active:translate-y-0.5">
                          <span>[→] VIEW_BP</span>
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
