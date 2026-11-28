import { Loader2 } from 'lucide-react';

export default function DepartmentDetailLoading() {
  return (
    <main className="flex-1 bg-[#F8F7F4]">
      <section
        aria-busy="true"
        aria-live="polite"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10"
      >
        <div className="rounded-2xl border border-pust-200 bg-[#FAF9F6] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-pust-50 border border-pust-200 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-pust-700" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-700">
                Opening Academic Department
              </p>
              <h1 className="font-serif text-lg sm:text-xl font-medium text-slate-900">
                Loading Department Prospectus &amp; Faculty Directory...
              </h1>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-500 shrink-0">
            Please wait a moment
          </span>
        </div>

        <div className="border-b border-stone-200 pb-8 space-y-4 animate-pulse">
          <div className="h-3 w-40 rounded bg-stone-200" />
          <div className="h-9 w-2/3 max-w-lg rounded-lg bg-stone-200" />
          <div className="h-4 w-full max-w-2xl rounded bg-stone-200/70" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-2"
              >
                <div className="h-3 w-20 rounded bg-stone-200" />
                <div className="h-5 w-24 rounded bg-stone-300/70" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded bg-stone-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-5 space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-stone-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-stone-200" />
                    <div className="h-3 w-1/2 rounded bg-stone-200/70" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-stone-200/80">
                  <div className="h-3 w-5/6 rounded bg-stone-200/70" />
                  <div className="h-3 w-2/3 rounded bg-stone-200/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
