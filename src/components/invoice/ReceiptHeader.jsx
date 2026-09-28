import React, { memo } from 'react';

const ReceiptHeader = memo(({ headerTitle }) => {
  const line1 = headerTitle?.line1 || 'FEE';
  const line2 = headerTitle?.line2 || 'RECEIPT';

  return (
    <header className="border-b border-[#ECECEC] pb-[1.4mm]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/KSlogo.jpg"
            alt="Lotus Nursery and Primary School logo"
            className="h-[14.5mm] w-auto object-contain object-left"
          />
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <h1 className="text-[15px] font-black text-[#013e8b] leading-[1.1]" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>LOTUS</h1>
            <h2 className="text-[11px] font-bold text-[#b89531] leading-[1.1]">Nursery & Primary School</h2>
            <div className="h-[0.5px] w-full bg-[#00a2e8] my-[1px]"></div>
            <p className="text-[8px] text-[#00a2e8] font-medium leading-[1.2] whitespace-nowrap">#20/16, Mariyamman Koil St,</p>
            <p className="text-[8px] text-[#00a2e8] font-medium leading-[1.2] whitespace-nowrap">Kagithapattarai, Vellore.</p>
          </div>
        </div>

        <div className="shrink-0 rounded-[14px] bg-[#E0F2FE] px-[14px] py-[4px] text-center shadow-sm border border-[#BAE6FD] ml-auto">
          <div className="text-[11.3px] font-bold uppercase tracking-[0.08em] text-[#013e8b]">{line1}</div>
          <div className="mt-0.5 text-[11.3px] font-bold uppercase tracking-[0.08em] text-[#013e8b]">{line2}</div>
        </div>
      </div>
    </header>
  );
});

ReceiptHeader.displayName = 'ReceiptHeader';

export default ReceiptHeader;
