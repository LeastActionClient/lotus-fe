import React, { memo } from 'react';

const Summary = memo(({ rows = [] }) => {
  if (!rows.length) {
    return null;
  }

  return (
    <section className="mt-[2mm] rounded-[12px] border border-[#F4D6BB] bg-[#FFF7EF] px-[3mm] py-[2.4mm] break-inside-avoid">
      <div className="mb-[1.4mm] text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#F58220]">
        Summary
      </div>
      <div className="space-y-[1.1mm]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-[3mm]">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#555555]">
              {row.label}
            </span>
            <span
              className={`text-right text-[10.3px] font-bold tabular-nums ${
                row.accent ? 'text-[#F58220]' : 'text-[#111111]'
              }`}
            >
              Rs. {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
});

Summary.displayName = 'Summary';

export default Summary;
