import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <Helmet>
        <title>404 - Page Not Found | ProjectDukaan</title>
        <meta name="description" content="The page you are looking for does not exist on ProjectDukaan." />
      </Helmet>
      <div className="py-24 container-px flex items-center justify-center font-mono">
        <div className="max-w-md w-full text-center bg-[#0a0e17] border-2 border-slate-800 rounded-md p-10 shadow-2xl relative overflow-hidden">
          {/* CRT Corner Decal Ticks */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

          <div className="w-16 h-16 rounded bg-[#161d2d] border border-cyan-800/80 text-cyan-400 grid place-items-center mx-auto mb-6 shadow-sm">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded">
            [ERR_404_ADDR_NOT_FOUND]
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-4 font-mono">SYS:\PAGE_NOT_FOUND</h1>
          <p className="text-slate-400 mt-3 text-xs sm:text-sm leading-relaxed font-mono">
            The target address or project blueprint identifier does not exist in the central repository registry.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono shadow-[0_3px_0_#92400e] border border-amber-300 active:translate-y-0.5 retro-btn text-xs h-10">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1 text-amber-950" /> [←] SYS:\HOME</Link>
            </Button>
            <Button asChild variant="outline" className="rounded border-slate-700 bg-[#0d121e] hover:bg-slate-800 text-cyan-300 hover:text-white font-mono text-xs h-10">
              <Link to="/marketplace">[::] BLUEPRINTS</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
