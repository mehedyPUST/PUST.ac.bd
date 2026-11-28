import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 w-full bg-[#F8F7F4]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="font-mono text-xs uppercase tracking-widest text-pust-700">
            HTTP 404 · Page Not Found
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
            The requested PUST record or page could not be found
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Please return to the university homepage, explore our academic departments, or open the
            Digital Campus Portal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/"
              className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-pust-700 text-white hover:bg-pust-800 transition-colors"
            >
              Return to Homepage
            </Link>
            <Link
              href="/portal"
              className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg border border-stone-300 bg-white text-slate-800 hover:border-pust-700 hover:text-pust-800 transition-colors"
            >
              Open Campus Portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
