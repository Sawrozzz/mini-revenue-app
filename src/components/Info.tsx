import type { ReactNode } from "react";

export function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="font-medium text-slate-800 mt-0.5 text-sm">{value}</p>
    </div>
  );
}
