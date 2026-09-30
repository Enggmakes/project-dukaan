import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export default function ProjectCard({ project, view = "grid" }: { project: Project; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Link 
        to={`/project/${project.id}`} 
        className="group bento-card rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row gap-5 transition-all bg-white hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-200 will-change-transform block border border-slate-200/85"
      >
        {/* Thumbnail Preview */}
        <div className="w-full sm:w-56 md:w-64 h-48 sm:h-auto rounded-2xl shrink-0 overflow-hidden relative bg-slate-100 border border-slate-100 aspect-[16/10] sm:aspect-auto" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
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
            <Badge className="bg-white/95 text-slate-900 font-bold text-[10px] border border-slate-200/90 shadow-2xs rounded-full px-2 py-0.5">
              {project.category}
            </Badge>
          </div>
          <Badge className="absolute top-2.5 right-2.5 bg-slate-950/85 text-white font-semibold text-[10px] border border-white/10 shadow-2xs rounded-full px-2 py-0.5 pointer-events-none sm:hidden">
            {project.difficulty}
          </Badge>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="hidden sm:flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/60">
                    {project.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">• Verified Blueprint</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {project.short}
                </p>
              </div>

              {/* Price on Desktop (Right Aligned) */}
              <div className="mt-1 sm:mt-0 sm:text-right shrink-0">
                <div className="text-2xl font-black text-slate-900 tracking-tight">₹{Number(project.price).toLocaleString()}</div>
                {project.price_note ? (
                  <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full mt-1 border border-rose-100/80 inline-block truncate max-w-[180px]" title={project.price_note}>
                    {project.price_note}
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-100/80 inline-block">
                    Complete Blueprint
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer: Tech Pills + Action Button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {(project.tech || []).slice(0, 4).map(t => (
                <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100/90 text-slate-700 font-semibold border border-slate-200/60">{t}</span>
              ))}
              {(project.tech || []).length > 4 && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 font-semibold border border-slate-200/60">
                  +{(project.tech || []).length - 4}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 shrink-0">
              <span>Inspect Blueprint</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 grid place-items-center transition-all duration-200 shadow-2xs">
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="h-full transition-transform duration-200 ease-out hover:-translate-y-1 will-change-transform">
      <Link to={`/project/${project.id}`} className="group bento-card rounded-[2rem] overflow-hidden transition-all h-full bg-white flex flex-col justify-between border border-slate-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5">
        <div className="flex-1 flex flex-col">
          {/* Framed Thumbnail Preview */}
          <div className="p-3 pb-0">
            <div className="aspect-[16/10] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100" style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#E2E8F0' }}>
              {project.thumb?.startsWith('http') && (
                <img 
                  src={project.thumb} 
                  alt={project.title} 
                  loading="lazy" 
                  decoding="async" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Top badges without heavy backdrop-filter */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                <Badge className="bg-white/95 text-slate-900 font-bold text-[11px] border border-slate-200/90 shadow-2xs rounded-full px-2.5 py-0.5">
                  {project.category}
                </Badge>
                <Badge className="bg-slate-950/85 text-white border border-white/10 text-[10px] shadow-2xs font-semibold rounded-full px-2.5 py-0.5">
                  {project.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {project.short}
              </p>
            </div>

            {/* Tech Badges inside Body */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-3 border-t border-slate-100">
              {(project.tech || []).slice(0, 3).map(t => (
                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60">
                  {t}
                </span>
              ))}
              {(project.tech || []).length > 3 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                  +{(project.tech || []).length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Unified Baseline Footer */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
          <div className="min-w-0">
            <div className="text-xl font-black text-slate-900 tracking-tight">₹{Number(project.price).toLocaleString()}</div>
            {project.price_note ? (
              <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-1 border border-rose-100/80 inline-block truncate max-w-[150px]" title={project.price_note}>
                {project.price_note}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100/80 inline-block">
                Complete Blueprint
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 grid place-items-center transition-all duration-200 shadow-xs shrink-0">
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </div>
  );
}
