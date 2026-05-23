import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(1000),
});

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.errors[0].message);
    
    setIsSubmitting(true);
    const toastId = toast.loading("Sending your message...");

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name,
        email: form.email,
        message: form.message
      });

      if (error) throw new Error(error.message);

      toast.success("Message sent! We'll reply within 24 hours.", { id: toastId });
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <MeshGradient className="py-20">
        <div className="container-px max-w-3xl mx-auto text-center">
          <h1 className="text-display text-5xl md:text-6xl text-navy">Get in touch</h1>
          <p className="text-navy/70 mt-4 text-lg">Sales, support, partnerships — we read every message.</p>
        </div>
      </MeshGradient>

      <section className="container-px py-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
          <form onSubmit={submit} className="bg-white rounded-3xl p-8 border border-border shadow-soft space-y-5">
            <h2 className="text-2xl font-semibold text-navy">Send us a message</h2>
            <div>
              <Label className="text-navy text-sm">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-navy text-sm">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-navy text-sm">Message</Label>
              <Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" className="mt-1.5" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="rounded-full bg-primary hover:bg-primary/90 px-6">
              <Send className="w-4 h-4 mr-2" /> {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>

          <aside className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "team@projectdukaan.vercel.app" },
              { icon: Phone, label: "Phone", value: "+91 77569 37861" },
              { icon: MapPin, label: "HQ", value: "Pune, India" },
            ].map(i => (
              <div key={i.label} className="bg-white rounded-3xl p-6 border border-border shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center text-primary"><i.icon className="w-4 h-4" /></div>
                <div className="text-xs text-muted-foreground mt-3">{i.label}</div>
                <div className="text-navy font-medium mt-0.5">{i.value}</div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </Layout>
  );
}
