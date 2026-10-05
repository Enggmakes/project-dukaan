import { Rocket, Heart, Users, Target } from "lucide-react";
import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Helmet } from "react-helmet-async";

export default function About() {
  const values = [
    { icon: Rocket, title: "Ship by default", desc: "We obsess over delivery — code, docs, deployment, done." },
    { icon: Heart, title: "Craft & care", desc: "Every project is reviewed by senior engineers before listing." },
    { icon: Users, title: "Built for builders", desc: "Students, indie hackers and startups, all in one place." },
    { icon: Target, title: "Real outcomes", desc: "Average ship time across our marketplace: 3.2 days." },
  ];
  return (
    <Layout>
      <Helmet>
        <title>About Us | ProjectDukaan</title>
        <meta name="description" content="Learn more about ProjectDukaan - a premium marketplace and custom project studio built to help engineering students, developers, and founders ship real projects." />
        <meta name="keywords" content="about projectdukaan, final year projects marketplace, engineering project team, ready-made code downloads" />
        <link rel="canonical" href="https://projectdukaan.vercel.app/about" />
      </Helmet>
      <div className="py-16 bg-[#070a12] border-b border-slate-800 relative overflow-hidden">
        <div className="container-px max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/60 border border-amber-800 text-xs text-amber-400 font-mono font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYS:\MANIFESTO_v2.6
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-white font-black tracking-tight font-mono">ENGINEERING_CAPSTONES_BUILT_TO_SHIP</h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-mono">ProjectDukaan is an engineering blueprint repository and custom prototyping studio built for engineers, researchers, and students who want verified, compilable hardware and software architectures.</p>
        </div>
      </div>

      <section className="container-px py-16 font-mono">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-5">
          {values.map((v, idx) => (
            <div key={v.title} className="bg-[#0d121e] border-2 border-slate-800 rounded-md p-7 relative overflow-hidden shadow-xl group hover:border-amber-500/50 transition-colors">
              <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600">0{idx + 1}_SPEC</div>
              <div className="w-10 h-10 rounded bg-[#161d2d] border border-cyan-800/80 grid place-items-center text-cyan-400 shadow-xs"><v.icon className="w-5 h-5" /></div>
              <h3 className="text-base font-bold text-white mt-4 font-mono">// {v.title.toUpperCase()}</h3>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm leading-relaxed font-mono">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px pb-20 font-mono">
        <div className="max-w-4xl mx-auto bg-[#0a0e17] text-white rounded-md p-10 sm:p-12 text-center shadow-2xl border-2 border-slate-800 relative overflow-hidden">
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-3">
            <span>&gt;&gt;&gt; ORIGIN_STORY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-mono">FROM LAB WORKBENCHES TO VERIFIED CAPSTONES</h2>
          <p className="text-slate-400 mt-3 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-mono">ProjectDukaan was founded by engineers frustrated by broken GitHub repositories and incomplete thesis submissions. Today, our blueprints provide verified datasets, verified BOM schematics, and guaranteed first-run compilation for engineering departments worldwide.</p>
        </div>
      </section>
    </Layout>
  );
}
