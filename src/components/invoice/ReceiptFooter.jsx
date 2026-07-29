import React, { memo } from 'react';

const ReceiptFooter = memo(() => {
  return (
    <footer className="shrink-0 rounded-b-[12px] bg-[#F58220] px-3 py-[4px] text-center text-white">
      <div className="text-[7px] font-medium leading-none">
        #15 &amp; 44, Eda Street, Saidapet, Vellore - 632 012. Ph : 0416 - 2211877
      </div>
    </footer>
  );
});

ReceiptFooter.displayName = 'ReceiptFooter';

export default ReceiptFooter;
