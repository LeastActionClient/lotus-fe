import React from 'react';
import ReceiptSheet from './ReceiptSheet';

const InvoiceTemplate = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="receipt-page mx-auto w-full max-w-[210mm] overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm">
      <ReceiptSheet payment={payment} />
    </div>
  );
};

export default InvoiceTemplate;
