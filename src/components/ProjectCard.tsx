import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Cpu } from "lucide-react";
import { Project } from "@/lib/mockData";

export default function ProjectCard({ project, view = "grid" }: { project: Project; view?: "grid" | "list" }) {
  const projCode = String(project.id).padStart(3, '0');

  if (view === "list") {
    return (
      <Link 
        to={`/project/${project.id}`} 
        className="group retro-card rounded-md p-4 sm:p-5 flex flex-col sm:flex-row gap-5 transition-all bg-[#0d121e] hover:-translate-y-0.5 will-change-transform block border-2 border-slate-800 hover:border-amber-500/70 shadow-xl"
      >
        {/* Thumbnail Preview in Inset CRT Screen Frame */}
        <div 
          className="w-full sm:w-56 md:w-64 h-44 sm:h-auto rounded-xs shrink-0 overflow-hidden relative bg-[#05070c] border-2 border-slate-800 p-1.5 aspect-[16/10] sm:aspect-auto" 
          style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#0b0f19' }}
        >
          {project.thumb?.startsWith('http') && (
            <img 
              src={project.thumb} 
              alt={project.title} 
              loading="lazy" 
              decoding="async" 
              className="w-full h-full object-cover rounded-xs transition-transform duration-500 group-hover:scale-105" 
            />
          )}

          {/* CRT Scanline Texture Layer */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-70" />

          {/* Retro Corner Decal Ticks */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

          <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-10">
            <span className="bg-slate-950/90 text-amber-400 font-mono text-[9px] uppercase tracking-wider border border-amber-500/50 shadow-2xs rounded px-1.5 py-0.5 font-bold">
              [{project.category}]
            </span>
          </div>
          <span className="absolute top-2 right-2 bg-slate-900/90 text-cyan-300 font-mono text-[9px] border border-cyan-800 shadow-2xs rounded px-1.5 py-0.5 pointer-events-none sm:hidden font-bold z-10">
            {project.difficulty}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="hidden sm:flex items-center gap-2 mb-1.5 font-mono text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    [{project.difficulty}]
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> Verified Architecture
                  </span>
                  <span className="text-cyan-400 font-semibold bg-cyan-950/50 border border-cyan-800 px-1.5 py-0.2 rounded text-[10px]">
                    SYS:\BP_{projCode}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg sm:text-xl leading-snug group-hover:text-amber-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {project.short}
                </p>

                {/* Telemetry row */}
                <div className="flex items-center gap-3 mt-2.5 font-mono text-[10px] text-slate-400">
                  <span className="text-slate-500">MEM: <strong className="text-slate-300">CLEAN</strong></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">DOCS: <strong className="text-emerald-400">IEEE THESIS</strong></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">TEST: <strong className="text-cyan-400">PASS_CI</strong></span>
                </div>
              </div>

              {/* Price on Desktop (Right Aligned) */}
              <div className="mt-1 sm:mt-0 sm:text-right shrink-0">
                <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline sm:justify-end">
                  <span className="text-amber-500 font-bold text-xs mr-1 select-none font-mono">INR</span>
                  <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(255,176,0,0.35)]">₹{Number(project.price).toLocaleString()}</span>
                </div>
                {project.price_note ? (
                  <div className="text-[10px] font-mono font-semibold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-800 inline-block truncate max-w-[180px]" title={project.price_note}>
                    {project.price_note}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800 inline-block">
                    Full Code + Thesis
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer: Tech Pills + Action Button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 gap-3">
            <div className="flex gap-1.5 flex-wrap font-mono">
              {(project.tech || []).slice(0, 4).map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#161d2d] text-cyan-300 font-semibold border border-slate-700/80 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  {t}
                </span>
              ))}
              {(project.tech || []).length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-medium border border-slate-800">
                  +{(project.tech || []).length - 4}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold shrink-0 font-mono">
              <span className="retro-btn bg-amber-500 hover:bg-amber-400 text-amber-950 px-3 py-1.5 rounded font-black flex items-center gap-1 shadow-[0_2px_0_#92400e] border border-amber-300 active:translate-y-0.5">
                [EXEC_INSPECT] <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="h-full transition-all duration-200 ease-out hover:-translate-y-1 will-change-transform">
      <Link 
        to={`/project/${project.id}`} 
        className="group retro-card rounded-md overflow-hidden transition-all h-full bg-[#0d121e] flex flex-col justify-between border-2 border-slate-800 hover:border-amber-500/70 shadow-xl"
      >
        <div className="flex-1 flex flex-col">
          {/* Retro OS Window Titlebar with Bevel controls */}
          <div className="px-3 py-1.5 bg-[#090d16] border-b border-slate-800 flex items-center justify-between font-mono text-[10px] select-none text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              <span className="text-slate-200 font-bold tracking-tight">SYS:\BP_{projCode}.BIN</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono">
              <span className="w-3.5 h-3.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xs grid place-items-center">_</span>
              <span className="w-3.5 h-3.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xs grid place-items-center font-bold">□</span>
              <span className="w-3.5 h-3.5 bg-rose-950/60 border border-rose-800 text-rose-400 rounded-2xs grid place-items-center font-bold">✕</span>
            </div>
          </div>

          {/* Framed Inset CRT Screen Preview with Scanlines */}
          <div className="p-2 pb-0">
            <div 
              className="aspect-[16/10] relative rounded-xs overflow-hidden bg-[#05070c] border-2 border-slate-800 p-1" 
              style={project.thumb?.startsWith('http') ? undefined : { background: project.thumb || '#0b0f19' }}
            >
              {project.thumb?.startsWith('http') && (
                <img 
                  src={project.thumb} 
                  alt={project.title} 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-cover object-top rounded-xs transition-transform duration-300 group-hover:scale-105" 
                />
              )}

              {/* CRT Scanline Layer */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-70" />

              {/* Corner Decal Ticks */}
              <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
              
              {/* Top badges */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                <span className="bg-slate-950/90 text-amber-400 font-mono text-[9px] uppercase tracking-wider border border-amber-500/50 shadow-2xs rounded px-1.5 py-0.5 font-bold">
                  [{project.category}]
                </span>
                <span className="bg-slate-900/90 text-cyan-300 border border-cyan-800 text-[9px] font-mono shadow-2xs font-semibold rounded px-1.5 py-0.5">
                  {project.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {project.short}
              </p>

              {/* Micro Hardware Specs Readout */}
              <div className="grid grid-cols-2 gap-1 py-1 px-2 bg-[#070a12] rounded border border-slate-800/80 font-mono text-[9px] text-slate-400 mt-3 select-none">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">IEEE:</span>
                  <span className="text-emerald-400 font-semibold">THESIS</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">PASS:</span>
                  <span className="text-cyan-400 font-semibold">100% CI</span>
                </div>
              </div>
            </div>

            {/* Tech Badges as IC chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-800 font-mono">
              {(project.tech || []).slice(0, 3).map(t => (
                <span key={t} className="text-[9px] font-medium px-1.5 py-0.5 rounded-xs bg-[#161d2d] text-cyan-300 border border-slate-700/80 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5 text-cyan-400 inline" />
                  {t}
                </span>
              ))}
              {(project.tech || []).length > 3 && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-xs bg-slate-900 text-slate-400 border border-slate-800">
                  +{(project.tech || []).length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Unified Retro Workstation Baseline Footer */}
        <div className="px-3.5 pb-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-3 mt-auto bg-[#090d16]">
          <div className="min-w-0">
            <div className="text-lg font-bold font-mono text-white tracking-tight flex items-baseline">
              <span className="text-amber-500 font-bold text-[10px] mr-1 select-none font-mono">INR</span>
              <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(255,176,0,0.35)]">₹{Number(project.price).toLocaleString()}</span>
            </div>
            {project.price_note ? (
              <div className="text-[9px] font-mono font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 inline-block truncate max-w-[130px]" title={project.price_note}>
                {project.price_note}
              </div>
            ) : (
              <div className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 inline-block">
                Code + Thesis Paper
              </div>
            )}
          </div>
          <div className="retro-btn px-2.5 py-1.5 rounded bg-amber-500 text-amber-950 font-mono font-black text-[11px] group-hover:bg-amber-400 flex items-center gap-1 shadow-[0_2px_0_#92400e] border border-amber-300 active:translate-y-0.5 shrink-0">
            <span>[INSPECT]</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2.5]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
