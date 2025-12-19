import React from "react";

const PageShell = ({ title, subtitle, children, meta }) => {
  return (
    <div className="bg-slate-950 text-slate-100">
      <header className="border-b border-white/10">
        <div className="bg-gradient-to-b from-blue-500/15 via-transparent to-transparent">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black tracking-widest text-blue-200/80">
                {meta}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6">{children}</div>
      </main>
    </div>
  );
};

export default PageShell;
