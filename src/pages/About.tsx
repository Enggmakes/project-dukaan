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
      <div className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="container-px max-w-4xl mx-auto text-center">
          <h1 className="text-display text-5xl md:text-7xl text-slate-900 font-bold">We help builders ship.</h1>
          <p className="text-slate-600 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">ProjectDukaan is a curated marketplace and custom build studio for the engineers, students and founders who'd rather ship than scaffold.</p>
        </div>
      </div>

      <section className="container-px py-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-5">
          {values.map(v => (
            <div key={v.title} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-600 shadow-sm"><v.icon className="w-5 h-5" /></div>
              <h3 className="text-xl font-bold text-slate-900 mt-5">{v.title}</h3>
              <p className="text-slate-600 mt-2 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px py-20">
        <div className="max-w-3xl mx-auto bg-slate-900 text-white rounded-[2rem] p-12 text-center shadow-xl border border-slate-800">
          <h2 className="text-display text-4xl font-bold">From a hostel room to 38,000 builders.</h2>
          <p className="text-slate-300 mt-4 leading-relaxed">ProjectDukaan started as a side-hustle to help juniors finish their final-year projects. Today, our marketplace powers final-year submissions, hackathon wins and indie product launches across 42 countries.</p>
        </div>
      </section>
    </Layout>
  );
}
