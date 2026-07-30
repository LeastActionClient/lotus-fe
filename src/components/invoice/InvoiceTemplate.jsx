import React from 'react';
import PDFRenderer from './PDFRenderer';

const InvoiceTemplate = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="mx-auto w-full overflow-x-auto">
      <PDFRenderer payment={payment} />
    </div>
  );
};

export default InvoiceTemplate;
