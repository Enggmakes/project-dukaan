import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { FileText, Award, AlertTriangle, Scale } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      icon: FileText,
      title: "1. Acceptable Terms & Usage",
      content: "Welcome to ProjectDukaan. By registering an account, purchasing premium engineering blueprints, or commissioning a custom hardware build, you explicitly agree to follow and be bound by these Terms of Service."
    },
    {
      icon: Award,
      title: "2. Single-Use Educational License",
      content: "All purchased digital codebases (.zip), circuit diagrams, 3D CAD schematics, and testing documentation are granted under a strictly educational, single-user license. Commercial redistribution, resale, or publishing ProjectDukaan files to public repositories (such as public GitHub repos) is strictly prohibited."
    },
    {
      icon: AlertTriangle,
      title: "3. Digital Refund & Shipping Policy",
      content: "Due to the instantaneous delivery and reproducible nature of source-code blueprints, all sales of digital files are final and non-refundable. For physical hardware projects, refunds or replacement calibrations are eligible only prior to shipping dispatch via our DTDC registry courier."
    },
    {
      icon: Scale,
      title: "4. Limitations of Liability",
      content: "ProjectDukaan provides premium engineering reference materials. We are not responsible or liable for any university grading outcomes, academic policy violations, or physical component damage/injuries caused during live hardware calibration and testing."
    }
  ];

  return (
    <Layout>
      <MeshGradient className="py-24">
        <div className="container-px max-w-4xl mx-auto text-center">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Rules</span>
          <h1 className="text-display text-5xl md:text-7xl text-navy mt-4">Terms of Service</h1>
          <p className="text-navy/70 mt-6 text-lg max-w-2xl mx-auto">
            Last Updated: May 23, 2026. Understand your licensing rights, download boundaries, and client responsibilities.
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
            <h4 className="text-lg font-semibold text-navy mb-2">Need clarification on licensing?</h4>
            <p className="text-sm text-muted-foreground">
              If you have any questions regarding intellectual property rights, custom milestone contracts, or download limitations, please contact our legal desk at <a href="mailto:legal@projectdukaan.com" className="text-primary hover:underline font-medium">legal@projectdukaan.com</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
