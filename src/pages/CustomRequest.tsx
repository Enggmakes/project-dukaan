import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Upload, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import MeshGradient from "@/components/MeshGradient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CATEGORIES } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(120),
  phone: z.string().trim().min(7, "Invalid phone").max(20),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().min(3, "Title too short").max(120),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(20, "Tell us more (20+ chars)").max(2000),
  tech: z.string().trim().max(200).optional().or(z.literal("")),
  budget: z.string().min(1, "Select a budget"),
  deadline: z.string().min(1, "Pick a deadline"),
  notes: z.string().max(500).optional().or(z.literal("")),
  contact: z.string(),
});

type FormData = z.infer<typeof schema>;

const steps = ["Your info", "Project details", "Scope & budget", "Review"];

export default function CustomRequest() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>({
    fullName: "", email: "", phone: "", college: "", title: "", category: "",
    description: "", tech: "", budget: "", deadline: "", notes: "", contact: "email",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      const allowedExtensions = ["pdf", "docx", "png", "jpg", "jpeg"];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        toast.error("Only PDF, DOCX, PNG, and JPG files are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

  const validateStep = (): boolean => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      0: ["fullName", "email", "phone"],
      1: ["title", "category", "description"],
      2: ["budget", "deadline"],
      3: [],
    };
    const fields = stepFields[step];
    const partial = Object.fromEntries(fields.map(f => [f, data[f]]));
    const result = schema.partial().safeParse(partial);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return false;
    }
    // Manually check required for this step
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = data[f] as string;
      const full = schema.shape[f];
      const r = full.safeParse(v);
      if (!r.success) errs[f] = r.error.errors[0].message;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => validateStep() && setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    const result = schema.safeParse(data);
    if (!result.success) { toast.error("Please complete required fields"); return; }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your request...");
    
    try {
      let documentUrl = null;
      if (selectedFile) {
        toast.loading("Uploading requirement document...", { id: toastId });
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `custom-requests/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('requirements-files')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw new Error("File upload failed: " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage
          .from('requirements-files')
          .getPublicUrl(filePath);
          
        documentUrl = publicUrlData.publicUrl;
      }

      toast.loading("Submitting project details...", { id: toastId });

      const { error } = await supabase.from('custom_requests').insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        college: data.college || null,
        title: data.title,
        category: data.category,
        description: data.description,
        tech: data.tech || null,
        budget: data.budget,
        deadline: data.deadline,
        contact_method: data.contact,
        notes: data.notes || null,
        document_url: documentUrl
      });

      if (error) throw new Error(error.message);

      // Send email notification via EmailJS
      const emailParams = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        college: data.college || "N/A",
        title: data.title,
        category: data.category,
        tech: data.tech || "N/A",
        budget: data.budget,
        deadline: data.deadline,
        description: data.description,
        notes: data.notes || "None",
        contact: data.contact,
        documentUrl: documentUrl || "None"
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        emailParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast.success("Request submitted successfully!", { id: toastId });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="container-px py-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-12 border border-border shadow-elegant text-center">
            <div className="w-16 h-16 rounded-full bg-primary-gradient grid place-items-center mx-auto shadow-elegant">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-display text-4xl text-navy mt-6">Thank you.</h1>
            <p className="text-navy/70 mt-3 text-lg">Our team will contact you shortly.</p>
            <p className="text-muted-foreground text-sm mt-2">We typically reply within 24 hours with a scoped quote and timeline.</p>
            <Button className="mt-8 rounded-full bg-navy hover:bg-navy-light" onClick={() => { setSubmitted(false); setStep(0); }}>Submit another</Button>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <MeshGradient className="py-16">
        <div className="container-px max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-navy mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Custom builds
          </div>
          <h1 className="text-display text-5xl md:text-6xl text-navy">Request a custom project</h1>
          <p className="text-navy/60 mt-3 text-lg">Tell us what you need — we'll design, build & deliver.</p>
        </div>
      </MeshGradient>

      <section className="container-px py-12">
        <div className="max-w-3xl mx-auto">
          {/* Stepper */}
          <div className="relative mb-8">
            {/* Progress Lines Container */}
            <div className="absolute left-[18px] right-[18px] h-0.5 -translate-y-1/2 z-0" style={{ top: "18px" }}>
              {/* Background Line */}
              <div className="absolute inset-0 bg-border" />
              {/* Active Progress Line */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Circles */}
            <div className="flex items-center justify-between relative z-10">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-9 h-9 rounded-full grid place-items-center text-sm font-medium transition-all ${
                    i < step ? "bg-primary text-white" : i === step ? "bg-navy text-white scale-110" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs text-navy hidden sm:block font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 border border-border shadow-elegant">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {step === 0 && (
                  <div className="space-y-5">
                    <h2 className="text-2xl font-semibold text-navy">Tell us about you</h2>
                    <Field label="Full name *" error={errors.fullName}><Input value={data.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Jane Doe" /></Field>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Email *" error={errors.email}><Input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" /></Field>
                      <Field label="Phone *" error={errors.phone}><Input value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98xxxx0000" /></Field>
                    </div>
                    <Field label="College / Company" error={errors.college}><Input value={data.college} onChange={e => set("college", e.target.value)} placeholder="IIT Delhi" /></Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <h2 className="text-2xl font-semibold text-navy">Project details</h2>
                    <Field label="Project title *" error={errors.title}><Input value={data.title} onChange={e => set("title", e.target.value)} placeholder="AI-powered crop disease detector" /></Field>
                    <Field label="Domain / Category *" error={errors.category}>
                      <Select value={data.category} onValueChange={v => set("category", v)}>
                        <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Project description *" error={errors.description}>
                      <Textarea rows={5} value={data.description} onChange={e => set("description", e.target.value)} placeholder="What should the project do? Who is it for?" />
                    </Field>
                    <Field label="Technologies required" error={errors.tech}><Input value={data.tech} onChange={e => set("tech", e.target.value)} placeholder="Python, TensorFlow, React" /></Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-2xl font-semibold text-navy">Scope & budget</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Budget range *" error={errors.budget}>
                        <Select value={data.budget} onValueChange={v => set("budget", v)}>
                          <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<5k">Under ₹5,000</SelectItem>
                            <SelectItem value="5k-15k">₹5,000 – ₹15,000</SelectItem>
                            <SelectItem value="15k-50k">₹15,000 – ₹50,000</SelectItem>
                            <SelectItem value="50k+">₹50,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Deadline *" error={errors.deadline}><Input type="date" value={data.deadline} onChange={e => set("deadline", e.target.value)} /></Field>
                    </div>
                    <Field label="Upload requirement documents">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative ${
                          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary"
                        }`}
                      >
                        {selectedFile ? (
                          <div className="space-y-2">
                            <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="text-sm font-medium text-navy">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="text-xs text-destructive hover:underline mt-2 block mx-auto font-medium"
                            >
                              Remove File
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-navy">Drop files or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("File size exceeds 10MB limit");
                              return;
                            }
                            setSelectedFile(file);
                          }
                        }}
                        className="hidden" 
                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                      />
                    </Field>
                    <Field label="Preferred contact method">
                      <RadioGroup value={data.contact} onValueChange={v => set("contact", v)} className="flex gap-4">
                        {["email", "phone", "whatsapp"].map(c => (
                          <label key={c} className="flex items-center gap-2 capitalize text-sm cursor-pointer">
                            <RadioGroupItem value={c} /> {c}
                          </label>
                        ))}
                      </RadioGroup>
                    </Field>
                    <Field label="Additional notes" error={errors.notes}>
                      <Textarea rows={3} value={data.notes} onChange={e => set("notes", e.target.value)} placeholder="Anything else we should know?" />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-2xl font-semibold text-navy">Review & submit</h2>
                    <div className="bg-secondary rounded-2xl p-5 space-y-2 text-sm">
                      <Row label="Name" value={data.fullName} />
                      <Row label="Email" value={data.email} />
                      <Row label="Phone" value={data.phone} />
                      <Row label="College/Company" value={data.college || "—"} />
                      <Row label="Project" value={data.title} />
                      <Row label="Category" value={data.category} />
                      <Row label="Budget" value={data.budget} />
                       <Row label="Deadline" value={data.deadline} />
                      <Row label="Contact via" value={data.contact} />
                      {selectedFile && <Row label="Document" value={selectedFile.name} />}
                    </div>
                    <p className="text-xs text-muted-foreground">By submitting you agree to be contacted by our team about this project.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" className="rounded-full" onClick={prev} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} className="rounded-full bg-primary hover:bg-primary/90 px-6">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button onClick={submit} disabled={isSubmitting} className="rounded-full bg-navy hover:bg-navy-light px-6">
                  {isSubmitting ? "Submitting..." : "Submit request"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-navy text-sm mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-navy font-medium text-right">{value}</span>
    </div>
  );
}
