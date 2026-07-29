import React, { memo, useMemo } from 'react';
import { calculateReceiptTotals, formatReceiptDate, groupFeeAllocations } from './invoiceUtils';
import ReceiptHeader from './ReceiptHeader';
import StudentInfo from './StudentInfo';
import FeeTable from './FeeTable';
import GrandTotal from './GrandTotal';
import ReceiptFooter from './ReceiptFooter';

const ReceiptSheet = memo(({ payment }) => {
  const receiptData = useMemo(() => {
    const groupedRows = groupFeeAllocations(payment);
    const totals = calculateReceiptTotals(groupedRows);

    return {
      groupedRows,
      totals,
      receiptDate: formatReceiptDate(payment?.paymentDate || payment?.invoice?.generatedDate || payment?.createdAt)
    };
  }, [payment]);

  if (!payment) return null;

  return (
    <div className="receipt-print-shell mx-auto flex w-full justify-center">
      <section className="receipt-page print-color-exact flex h-[138mm] w-[95mm] flex-col overflow-hidden rounded-[12px] border border-[#ECECEC] bg-white shadow-sm">
        <div className="flex flex-1 flex-col px-[4mm] pt-[4mm] pb-[2.5mm]">
          <ReceiptHeader />
          <div className="pt-[1.4mm]">
            <StudentInfo payment={{ ...payment, receiptDate: receiptData.receiptDate }} />
          </div>
          <div className="pt-[1.4mm]">
            <FeeTable groupedRows={receiptData.groupedRows} />
          </div>
          <div className="pt-[1.2mm]">
            <GrandTotal amount={receiptData.totals.totalAmount} />
          </div>
        </div>
        <ReceiptFooter />
      </section>
    </div>
  );
});

ReceiptSheet.displayName = 'ReceiptSheet';

export default ReceiptSheet;
