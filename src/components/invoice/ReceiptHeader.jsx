import React, { memo } from 'react';

const ReceiptHeader = memo(({ headerTitle }) => {
  const line1 = headerTitle?.line1 || 'FEE';
  const line2 = headerTitle?.line2 || 'RECEIPT';

  return (
    <header className="border-b border-[#ECECEC] pb-[1.4mm]">
      <div className="flex items-start justify-between gap-3">
        <img
          src="/KSlogo.jpg"
          alt="Kasthuri Nursery and Primary School logo"
          className="h-[14.5mm] w-[39mm] object-contain object-left"
        />

        <div className="shrink-0 rounded-[14px] bg-[#FDE9D9] px-[14px] py-[4px] text-center shadow-sm">
          <div className="text-[11.3px] font-bold uppercase tracking-[0.08em] text-[#111111]">{line1}</div>
          <div className="mt-0.5 text-[11.3px] font-bold uppercase tracking-[0.08em] text-[#111111]">{line2}</div>
        </div>
      </div>

      <div className="mt-1 text-center text-[9.8px] font-bold leading-tight text-[#8A8A8A]">
        Approved by Govt. of Tamilnadu - 2349
      </div>
    </header>
  );
});

ReceiptHeader.displayName = 'ReceiptHeader';

export default ReceiptHeader;
