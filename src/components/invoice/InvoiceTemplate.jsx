import React from 'react';
import ReceiptSheet from './ReceiptSheet';

const InvoiceTemplate = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="mx-auto w-full overflow-x-auto">
      <ReceiptSheet payment={payment} />
    </div>
  );
};

export default InvoiceTemplate;
