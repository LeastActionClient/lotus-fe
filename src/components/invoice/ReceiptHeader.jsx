import React, { memo } from 'react';

const ReceiptHeader = memo(() => {
  return (
    <header className="border-b border-[#ECECEC] pb-2.5">
      <div className="flex items-start justify-between gap-3">
        <img
          src="/KSlogo.jpg"
          alt="Kasthuri Nursery and Primary School logo"
          className="h-[23mm] w-[45mm] object-contain object-left"
        />

        <div className="shrink-0 rounded-[15px] bg-[#FDE9D9] px-4 py-3 text-center shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#111111]">FEE</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#111111]">RECEIPT</div>
        </div>
      </div>

      <div className="mt-1.5 text-center text-[11px] font-medium leading-tight text-[#8A8A8A]">
        Approved by Govt. of Tamilnadu - 2349
      </div>
    </header>
  );
});

ReceiptHeader.displayName = 'ReceiptHeader';

export default ReceiptHeader;
