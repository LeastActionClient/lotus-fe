import React from 'react';
import ReceiptCopy from './ReceiptCopy';

const InvoiceTemplate = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="receipt-page mx-auto w-full max-w-[200mm] overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm">
      <ReceiptCopy payment={payment} />
    </div>
  );
};

export default InvoiceTemplate;
