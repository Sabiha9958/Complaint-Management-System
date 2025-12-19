import React from "react";

const InfoCard = ({ title, children, right }) => {
  return (
    <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-sm font-black text-white">{title}</h2>
        {right ? <div className="text-xs text-slate-400">{right}</div> : null}
      </div>
      <div className="mt-4 text-sm leading-relaxed text-slate-200/90">
        {children}
      </div>
    </section>
  );
};

export default InfoCard;
