import { Rocket, Heart, Users, Target } from "lucide-react";
import Layout from "@/components/Layout";

export default function About() {
  const values = [
    { icon: Rocket, title: "Ship by default", desc: "We obsess over delivery — code, docs, deployment, done." },
    { icon: Heart, title: "Craft & care", desc: "Every project is reviewed by senior engineers before listing." },
    { icon: Users, title: "Built for builders", desc: "Students, indie hackers and startups, all in one place." },
    { icon: Target, title: "Real outcomes", desc: "Average ship time across our marketplace: 3.2 days." },
  ];
  return (
    <Layout>
      <section className="bg-mesh py-24">
        <div className="container-px max-w-4xl mx-auto text-center">
          <h1 className="text-display text-5xl md:text-7xl text-navy">We help builders ship.</h1>
          <p className="text-navy/70 mt-6 text-lg max-w-2xl mx-auto">ProjectDukaan is a curated marketplace and custom build studio for the engineers, students and founders who'd rather ship than scaffold.</p>
        </div>
      </section>

      <section className="container-px py-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-5">
          {values.map(v => (
            <div key={v.title} className="bg-white border border-border rounded-3xl p-8 shadow-soft">
              <div className="w-11 h-11 rounded-2xl bg-primary-gradient grid place-items-center text-white shadow-elegant"><v.icon className="w-5 h-5" /></div>
              <h3 className="text-xl font-semibold text-navy mt-5">{v.title}</h3>
              <p className="text-muted-foreground mt-2">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px py-20">
        <div className="max-w-3xl mx-auto bg-navy text-white rounded-[2rem] p-12 text-center">
          <h2 className="text-display text-4xl">From a hostel room to 38,000 builders.</h2>
          <p className="text-white/70 mt-4">ProjectDukaan started as a side-hustle to help juniors finish their final-year projects. Today, our marketplace powers final-year submissions, hackathon wins and indie product launches across 42 countries.</p>
        </div>
      </section>
    </Layout>
  );
}
