import React, { memo } from 'react';

const ReceiptFooter = memo(() => {
  return (
    <footer className="shrink-0 rounded-b-[12px] bg-[#013e8b] px-3 py-[4px] text-center text-white">
      <div className="text-[9px] font-bold leading-none">
        #20/16, Mariyamman Koil St, Kagithapattarai, Vellore.
      </div>
    </footer>
  );
});

ReceiptFooter.displayName = 'ReceiptFooter';

export default ReceiptFooter;
