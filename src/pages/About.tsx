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
      <div className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-slate-900 font-extrabold tracking-tight">Engineering Capstones Built to Ship</h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">ProjectDukaan is an engineering blueprint repository and custom prototyping studio built for engineers, researchers, and students who want verified, compilable hardware and software architectures.</p>
        </div>
      </div>

      <section className="container-px py-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-5">
          {values.map(v => (
            <div key={v.title} className="tech-card bg-white border border-slate-200/90 rounded-xl p-7 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center text-blue-600 shadow-xs"><v.icon className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">{v.title}</h3>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px pb-20">
        <div className="max-w-4xl mx-auto bg-slate-950 text-white rounded-xl p-10 sm:p-12 text-center shadow-xl border border-slate-800 tech-card-dark">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">From Lab Workbenches to Verified Capstones</h2>
          <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">ProjectDukaan was founded by engineers frustrated by broken GitHub repositories and incomplete thesis submissions. Today, our blueprints provide verified datasets, verified BOM schematics, and guaranteed first-run compilation for engineering departments worldwide.</p>
        </div>
      </section>
    </Layout>
  );
}
