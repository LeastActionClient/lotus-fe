import React, { memo } from 'react';

const ReceiptHeader = memo(() => {
  return (
    <header className="border-b border-[#ECECEC] pb-[1mm]">
      <div className="flex items-center justify-between gap-3">
        <img
          src="/KSlogo.jpg"
          alt="Kasthuri Nursery and Primary School logo"
          className="h-[14.5mm] w-[40mm] object-contain object-left"
        />

        <div className="shrink-0 rounded-[14px] bg-[#FDE9D9] px-[15px] py-[4px] text-center shadow-sm">
          <div className="text-[9.8px] font-bold uppercase tracking-[0.08em] text-[#111111]">FEE</div>
          <div className="mt-0.5 text-[9.8px] font-bold uppercase tracking-[0.08em] text-[#111111]">RECEIPT</div>
        </div>
      </div>

      <div className="mt-1 text-center text-[8px] font-medium leading-tight text-[#8A8A8A]">
        Approved by Govt. of Tamilnadu - 2349
      </div>
    </header>
  );
});

ReceiptHeader.displayName = 'ReceiptHeader';

export default ReceiptHeader;
