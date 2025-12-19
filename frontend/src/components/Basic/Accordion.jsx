import React, { useId, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const AccordionItem = ({ q, a }) => {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
      >
        <span className="text-sm font-black text-white">{q}</span>
        <FiChevronDown
          className={`h-5 w-5 text-slate-300 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={`panel-${id}`}
        hidden={!open}
        className="px-5 pb-5 text-sm leading-relaxed text-slate-200/90"
      >
        {a}
      </div>
    </div>
  );
};

const Accordion = ({ items }) => {
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <AccordionItem key={it.q} {...it} />
      ))}
    </div>
  );
};

export default Accordion;
