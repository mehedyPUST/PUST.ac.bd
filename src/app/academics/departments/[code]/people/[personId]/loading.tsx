export default function DepartmentPersonLoading() {
  return (
    <main className="flex-1 bg-white">
      <div className="border-b border-slate-200 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="h-4 w-52 bg-stone-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-stone-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-8 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-stone-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-3 w-36 bg-stone-200 rounded animate-pulse" />
            <div className="h-8 w-72 bg-stone-200 rounded animate-pulse" />
            <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-stone-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-44 rounded-2xl border border-stone-200 bg-white animate-pulse" />
        <div className="h-56 rounded-2xl border border-stone-200 bg-[#FAF9F6] animate-pulse" />
      </section>
    </main>
  );
}
