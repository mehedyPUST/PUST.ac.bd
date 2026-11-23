import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 bg-[#FAF8F4]">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-5">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
          HTTP 404 · Page Not Found
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
          The requested PUST record or page could not be found
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Please return to the university homepage, explore the 21 academic departments, or open the
          Digital Campus Portal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
          >
            Return to Homepage
          </Link>
          <Link
            href="/portal"
            className="px-5 py-2.5 text-sm font-medium border border-stone-300 bg-white text-slate-800 hover:border-emerald-800 hover:text-emerald-800 transition-colors"
          >
            Open Campus Portal
          </Link>
        </div>
      </section>
    </main>
  );
}
