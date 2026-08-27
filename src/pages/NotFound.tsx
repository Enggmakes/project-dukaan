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
      <div className="py-28 container-px flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 grid place-items-center mx-auto mb-6 shadow-sm">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">Error 404</span>
          <h1 className="text-display text-3xl sm:text-4xl font-bold text-slate-900 mt-4">Page not found</h1>
          <p className="text-slate-600 mt-3 text-sm leading-relaxed">
            The page or project blueprint you were looking for doesn't exist or has moved.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold">
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
