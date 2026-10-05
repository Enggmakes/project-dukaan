import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Project } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export default function ProjectCard({ project, view = "grid" }: { project: Project; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Link 
        to={`/project/${project.id}`} 
        className="group tech-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 transition-all bg-white hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-500/50 will-change-transform block border border-slate-200"
      >
        {/* Thumbnail Preview */}
        <div className="w-full sm:w-56 md:w-64 h-44 sm:h-auto rounded-lg shrink-0 overflow-hidden relative bg-slate-100 border border-slate-200 aspect-[16/10] sm:aspect-auto" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
          {project.thumb?.startsWith('http') && (
            <img 
              src={project.thumb} 
              alt={project.title} 
              loading="lazy" 
              decoding="async" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          )}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
            <Badge className="bg-slate-950/90 text-white font-mono text-[10px] uppercase tracking-wider border border-white/10 shadow-2xs rounded-md px-2 py-0.5">
              {project.category}
            </Badge>
          </div>
          <Badge className="absolute top-2.5 right-2.5 bg-white/95 text-slate-800 font-semibold text-[10px] border border-slate-200 shadow-2xs rounded-md px-2 py-0.5 pointer-events-none sm:hidden">
            {project.difficulty}
          </Badge>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="hidden sm:flex items-center gap-2 mb-1.5 font-mono text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {project.difficulty}
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Verified Architecture
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {project.short}
                </p>
              </div>

              {/* Price on Desktop (Right Aligned) */}
              <div className="mt-1 sm:mt-0 sm:text-right shrink-0">
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline sm:justify-end">
                  <span className="text-amber-600 font-bold text-xs mr-1 select-none">INR</span>
                  <span>₹{Number(project.price).toLocaleString()}</span>
                </div>
                {project.price_note ? (
                  <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 inline-block truncate max-w-[180px]" title={project.price_note}>
                    {project.price_note}
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block">
                    Full Codebase + Docs
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer: Tech Pills + Action Button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-3">
            <div className="flex gap-1.5 flex-wrap font-mono">
              {(project.tech || []).slice(0, 4).map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">{t}</span>
              ))}
              {(project.tech || []).length > 4 && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-400 font-medium border border-slate-200">
                  +{(project.tech || []).length - 4}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 group-hover:text-blue-700 shrink-0 font-mono">
              <span>INSPECT_PKG</span>
              <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 grid place-items-center transition-all duration-200 shadow-2xs retro-btn">
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="h-full transition-all duration-200 ease-out hover:-translate-y-1 will-change-transform">
      <Link to={`/project/${project.id}`} className="group tech-card rounded-xl overflow-hidden transition-all h-full bg-white flex flex-col justify-between border border-slate-200 hover:border-blue-500/50 hover:shadow-lg">
        <div className="flex-1 flex flex-col">
          {/* Framed Thumbnail Preview */}
          <div className="p-2.5 pb-0">
            <div className="aspect-[16/10] relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200/90" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
              {project.thumb?.startsWith('http') && (
                <img 
                  src={project.thumb} 
                  alt={project.title} 
                  loading="lazy" 
                  decoding="async" 
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" 
                />
              )}
              
              {/* Top badges */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                <Badge className="bg-slate-950/90 text-white font-mono text-[10px] uppercase tracking-wider border border-white/10 shadow-2xs rounded px-2 py-0.5">
                  {project.category}
                </Badge>
                <Badge className="bg-white/95 text-slate-800 border border-slate-200 text-[10px] shadow-2xs font-semibold rounded px-2 py-0.5">
                  {project.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {project.short}
              </p>
            </div>

            {/* Tech Badges inside Body */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-3 border-t border-slate-100 font-mono">
              {(project.tech || []).slice(0, 3).map(t => (
                <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {t}
                </span>
              ))}
              {(project.tech || []).length > 3 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200">
                  +{(project.tech || []).length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Unified Baseline Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
          <div className="min-w-0">
            <div className="text-lg font-bold font-mono text-slate-900 tracking-tight flex items-baseline">
              <span className="text-amber-600 font-bold text-[10px] mr-1 select-none">INR</span>
              <span>₹{Number(project.price).toLocaleString()}</span>
            </div>
            {project.price_note ? (
              <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block truncate max-w-[140px]" title={project.price_note}>
                {project.price_note}
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Code + Thesis Paper
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 grid place-items-center transition-all duration-200 shadow-2xs shrink-0 retro-btn">
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </div>
  );
}
