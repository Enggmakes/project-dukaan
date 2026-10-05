import { Rocket, Heart, Users, Target, CheckCircle2, Cpu, ShieldCheck, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  const values = [
    { 
      icon: Rocket, 
      spec: "01_SPEC",
      title: "Ship by default", 
      desc: "We obsess over delivery — verified source code, IEEE schematics, and zero-headache deployment." 
    },
    { 
      icon: Heart, 
      spec: "02_SPEC",
      title: "Craft & care", 
      desc: "Every project repository is benchmarked and reviewed by senior engineers before listing." 
    },
    { 
      icon: Users, 
      spec: "03_SPEC",
      title: "Built for builders", 
      desc: "Engineering researchers, final-year capstone teams, and indie robotics creators in one ecosystem." 
    },
    { 
      icon: Target, 
      spec: "04_SPEC",
      title: "Real outcomes", 
      desc: "Guaranteed compilable code, viva defense presentations, and 3.2-day average dispatch time." 
    },
  ];

  return (
    <Layout>
      <Helmet>
        <title>About Us | ProjectDukaan</title>
        <meta name="description" content="Learn more about ProjectDukaan - a verified engineering blueprint repository and custom prototyping studio built for capstone builders." />
        <meta name="keywords" content="about projectdukaan, final year projects marketplace, engineering project team, ready-made code downloads" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/about" />
      </Helmet>

      {/* Hero Manifesto Header */}
      <div className="py-14 sm:py-20 bg-[#070a12] border-b border-slate-800/80 relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0d121e] border border-amber-500/40 text-xs text-amber-300 font-mono font-semibold mb-5 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYS:\MANIFESTO_v2.6
          </div>
          
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-black tracking-tight font-mono leading-tight break-words max-w-4xl mx-auto">
            ENGINEERING_CAPSTONES <br className="hidden sm:inline" />
            <span className="text-amber-400">BUILT_TO_SHIP</span>
          </h1>

          <p className="text-slate-400 mt-4 sm:mt-6 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-mono">
            ProjectDukaan is an engineering blueprint repository and custom prototyping studio built for engineers, researchers, and students who want verified, compilable hardware and software architectures.
          </p>
        </div>
      </div>

      {/* Spec Values Grid */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {values.map((v) => (
            <div 
              key={v.title} 
              className="bg-[#090e1c] border border-slate-800 rounded-xl p-6 sm:p-7 relative overflow-hidden shadow-xl group hover:border-amber-500/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.1)] transition-all"
            >
              <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 bg-[#070a12] px-2 py-0.5 rounded border border-slate-800/80">
                {v.spec}
              </div>
              
              <div className="w-10 h-10 rounded-lg bg-[#070a12] border border-cyan-500/30 grid place-items-center text-cyan-400 shadow-inner group-hover:border-cyan-400 transition-colors">
                <v.icon className="w-5 h-5" />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white mt-4 font-mono flex items-center gap-2">
                <span className="text-amber-400">//</span>
                {v.title.toUpperCase()}
              </h3>

              <p className="text-slate-400 mt-2 text-xs leading-relaxed font-mono">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Origin Story Panel */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 font-mono">
        <div className="bg-[#090e1c] text-white rounded-2xl p-8 sm:p-12 text-center shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-3">
            <span>&gt;&gt;&gt; ORIGIN_STORY</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight font-mono">
            FROM LAB WORKBENCHES TO VERIFIED CAPSTONES
          </h2>

          <p className="text-slate-400 mt-4 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-mono">
            ProjectDukaan was founded by engineers frustrated by broken GitHub repositories, deprecated sensor libraries, and incomplete thesis submissions. Today, our verified blueprints provide clean datasets, exact BOM schematics, and guaranteed first-run compilation for engineering defense teams worldwide.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-slate-800/80">
            <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">Compiled Code & Schematics</div>
            </div>
            <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">3.2 DAYS</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">Avg Courier Dispatch</div>
            </div>
            <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">IEEE 2026</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">Standard Defense Docs</div>
            </div>
          </div>

          {/* CTA Link Buttons */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs h-10 px-5 rounded-lg shadow-md">
              <Link to="/marketplace">
                EXPLORE_CATALOG <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-800 bg-[#070a12] text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs h-10 px-5 rounded-lg">
              <Link to="/custom-request">
                CUSTOM_SPEC_BUILD ↗
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
