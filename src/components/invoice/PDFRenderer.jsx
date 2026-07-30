import React, { memo, useMemo } from 'react';
import {
  calculateReceiptTotals,
  formatReceiptDate,
  groupFeeAllocations
} from './invoiceUtils';
import { buildReceiptSummaryRows, receiptMetrics, splitReceiptRowsIntoPages } from './receiptHelpers';
import ReceiptHeader from './ReceiptHeader';
import StudentInfo from './StudentInfo';
import FeeTable from './FeeTable';
import Summary from './Summary';
import ReceiptFooter from './ReceiptFooter';

const ReceiptPage = memo(({ payment, rows, totals, receiptDate, isLastPage, showLessAmount }) => {
  const summaryRows = isLastPage ? buildReceiptSummaryRows({ totals, payment }) : [];

  return (
    <section
      className="receipt-page print-color-exact mx-auto flex w-[95mm] flex-col overflow-hidden rounded-[12px] border border-[#ECECEC] bg-white shadow-sm"
      data-receipt-page
    >
      <div className="flex flex-1 flex-col px-[4mm] pt-[4mm] pb-[2.6mm]">
        <ReceiptHeader />
        <div className="pt-[1.3mm]">
          <StudentInfo payment={{ ...payment, receiptDate }} />
        </div>
        <div className="pt-[1.3mm]">
          <FeeTable groupedRows={rows} showLessAmount={showLessAmount} />
        </div>
        {isLastPage && (
          <div className="pt-[1.3mm]">
            <Summary rows={summaryRows} />
          </div>
        )}
      </div>
      <ReceiptFooter />
    </section>
  );
});

ReceiptPage.displayName = 'ReceiptPage';

const PDFRenderer = memo(({ payment }) => {
  const receiptData = useMemo(() => {
    const groupedRows = groupFeeAllocations(payment);
    const totals = calculateReceiptTotals(groupedRows);
    const receiptDate = formatReceiptDate(payment?.paymentDate || payment?.invoice?.generatedDate || payment?.createdAt);
    const showLessAmount = groupedRows.some((row) => Number(row.discountAmount || row.lessAmount || 0) > 0);
    const pages = splitReceiptRowsIntoPages(groupedRows, receiptMetrics.maxRowsPerPage);

    return {
      groupedRows,
      totals,
      receiptDate,
      showLessAmount,
      pages
    };
  }, [payment]);

  if (!payment) return null;

  return (
    <div className="receipt-document mx-auto flex w-full flex-col items-center gap-4">
      {receiptData.pages.map((rows, pageIndex) => (
        <div key={`receipt-page-${pageIndex}`} className="receipt-page-wrapper w-full">
          <ReceiptPage
            payment={payment}
            rows={rows}
            totals={receiptData.totals}
            receiptDate={receiptData.receiptDate}
            showLessAmount={receiptData.showLessAmount}
            isLastPage={pageIndex === receiptData.pages.length - 1}
          />
        </div>
      ))}
    </div>
  );
});

PDFRenderer.displayName = 'PDFRenderer';

export default PDFRenderer;
