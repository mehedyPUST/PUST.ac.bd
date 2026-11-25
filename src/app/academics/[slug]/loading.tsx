import { Loader2 } from 'lucide-react';

export default function AcademicsSectionLoading() {
  return (
    <main className="flex-1 bg-white">
      <section
        aria-busy="true"
        aria-live="polite"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8"
      >
        <div className="rounded-2xl border border-pust-800/20 bg-[#FAF8F4] px-6 py-4 flex items-center gap-3.5 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-pust-800 shrink-0" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-800">
              PUST Academics
            </p>
            <p className="text-sm font-medium text-slate-900">
              Loading academic directory...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-[#FAF8F4] p-5 space-y-3"
            >
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-6 w-3/4 rounded bg-slate-200" />
              <div className="pt-3 border-t border-slate-200/70 flex justify-between">
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
