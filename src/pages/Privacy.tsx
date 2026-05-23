import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Shield, Eye, Lock, Globe } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      icon: Shield,
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when registering an account, purchasing premium project blueprints, or requesting custom hardware builds. This includes your name, email address, phone number, shipping address (for physical kits), and communication history."
    },
    {
      icon: Eye,
      title: "2. How We Use Your Data",
      content: "We use the collected information to process transactions, deliver instant digital ZIP downloads, dispatch hardware kits via our tracking courier registry, and notify you when new premium projects align with your engineering interests."
    },
    {
      icon: Lock,
      title: "3. Source Code & Project Protection",
      content: "At ProjectDukaan, your custom request blueprints, diagrams, and project details are treated with absolute confidentiality. We do not sell, rent, or distribute your custom engineering requests or uploaded academic reference documents with external third parties."
    },
    {
      icon: Globe,
      title: "4. Data Security & Integrity",
      content: "We implement advanced security measures including SSL encryption, tokenized payment gateways, and secure Supabase database authentication to guard your account, personal data registry, and digital license keys from unauthorized access."
    }
  ];

  return (
    <Layout>
      <MeshGradient className="py-24">
        <div className="container-px max-w-4xl mx-auto text-center">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Legal</span>
          <h1 className="text-display text-5xl md:text-7xl text-navy mt-4">Privacy Policy</h1>
          <p className="text-navy/70 mt-6 text-lg max-w-2xl mx-auto">
            Last Updated: May 23, 2026. Learn how we handle, secure, and protect your digital library assets and personal registry.
          </p>
        </div>
      </MeshGradient>

      <section className="container-px py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-12">
            {sections.map((s, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary-gradient grid place-items-center text-white shrink-0 shadow-elegant">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-navy">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-secondary rounded-3xl border border-border">
            <h4 className="text-lg font-semibold text-navy mb-2">Have questions about your data?</h4>
            <p className="text-sm text-muted-foreground">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal registry, please reach out via our <a href="/contact" className="text-primary hover:underline font-medium">Contact Form</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
