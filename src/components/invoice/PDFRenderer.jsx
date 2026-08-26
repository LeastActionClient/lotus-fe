import React, { memo, useMemo } from 'react';
import {
  formatReceiptDate,
  getSplitBillsForPayment
} from './invoiceUtils';
import { buildReceiptSummaryRows, receiptMetrics, splitReceiptRowsIntoPages } from './receiptHelpers';
import ReceiptHeader from './ReceiptHeader';
import StudentInfo from './StudentInfo';
import FeeTable from './FeeTable';
import Summary from './Summary';
import ReceiptFooter from './ReceiptFooter';

const ReceiptPage = memo(({ payment, rows, totals, receiptDate, isLastPage, showLessAmount, headerTitle }) => {
  const summaryRows = isLastPage ? buildReceiptSummaryRows({ totals, payment }) : [];

  return (
    <section
      className="receipt-page print-color-exact mx-auto flex w-[105mm] h-[148mm] break-inside-avoid flex-col overflow-hidden rounded-[12px] border border-[#ECECEC] bg-white shadow-sm"
      data-receipt-page
    >
      <div className="flex flex-1 flex-col px-[2.5mm] pt-[2.5mm] pb-[1.5mm]">
        <ReceiptHeader headerTitle={headerTitle} />
        <div className="pt-[1.3mm]">
          <StudentInfo payment={{ ...payment, receiptDate }} />
        </div>
        <div className="pt-[1.3mm]">
          <FeeTable groupedRows={rows} showLessAmount={showLessAmount} />
        </div>
        {isLastPage && (
          <div className="mt-auto pt-[1.3mm]">
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
  const billsData = useMemo(() => {
    const bills = getSplitBillsForPayment(payment);
    const receiptDate = formatReceiptDate(payment?.paymentDate || payment?.invoice?.generatedDate || payment?.createdAt);

    return bills.map((bill) => {
      const showLessAmount = bill.groupedRows.some((row) => Number(row.discountAmount || row.lessAmount || 0) > 0);
      const pages = splitReceiptRowsIntoPages(bill.groupedRows, receiptMetrics.maxRowsPerPage);
      return {
        ...bill,
        receiptDate,
        showLessAmount,
        pages
      };
    });
  }, [payment]);

  if (!payment) return null;

  return (
    <div className="receipt-document mx-auto flex w-full flex-col items-center gap-6">
      {billsData.map((bill, billIndex) => (
        <div key={`bill-${bill.id}-${billIndex}`} className="bill-wrapper w-full flex flex-col items-center gap-4">
          {bill.pages.map((rows, pageIndex) => (
            <div key={`receipt-page-${bill.id}-${pageIndex}`} className="receipt-page-wrapper w-full break-after-page">
              <ReceiptPage
                payment={payment}
                rows={rows}
                totals={bill.totals}
                receiptDate={bill.receiptDate}
                showLessAmount={bill.showLessAmount}
                headerTitle={bill.headerTitle}
                isLastPage={pageIndex === bill.pages.length - 1}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

PDFRenderer.displayName = 'PDFRenderer';

export default PDFRenderer;
