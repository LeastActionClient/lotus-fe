import React, { memo } from 'react';
import { formatReceiptMoney } from './receiptHelpers';

const GrandTotal = memo(({ amount }) => {
  return (
    <section className="ml-auto flex w-full max-w-[60mm] items-start gap-2">
      <div className="mt-2.5 h-px flex-1 bg-[#ECECEC]" />
      <div className="w-[49mm] shrink-0">
        <div className="text-center text-[10.8px] font-semibold uppercase tracking-[0.08em] text-[#F58220]">
          Grand Total
        </div>
        <div className="mt-1 rounded-[10px] border border-[#F4D6BB] bg-[#FDE9D9] px-2.5 py-[6px] shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[6.9px] font-semibold uppercase tracking-[0.14em] text-[#555555]">
              Total Amount
            </span>
            <span className="text-right text-[10.2px] font-bold leading-tight text-[#111111]">
              Rs. {formatReceiptMoney(amount)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

GrandTotal.displayName = 'GrandTotal';

export default GrandTotal;
