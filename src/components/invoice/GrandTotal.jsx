import React, { memo } from 'react';
import { formatReceiptMoney } from './receiptHelpers';

const GrandTotal = memo(({ amount }) => {
  return (
    <section className="ml-auto flex w-full max-w-[60mm] items-start gap-2">
      <div className="mt-3 h-px flex-1 bg-[#ECECEC]" />
      <div className="w-[50mm] shrink-0">
        <div className="text-center text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#F58220]">
          Grand Total
        </div>
        <div className="mt-1 rounded-[10px] border border-[#F4D6BB] bg-[#FDE9D9] px-3 py-2 shadow-sm">
          <div className="text-[7px] font-semibold uppercase tracking-[0.14em] text-[#555555]">Total Amount  : 
          <span className="mt-0.5 text-right text-[11px] font-bold leading-tight text-[#111111]"> Rs. {formatReceiptMoney(amount)}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

GrandTotal.displayName = 'GrandTotal';

export default GrandTotal;
