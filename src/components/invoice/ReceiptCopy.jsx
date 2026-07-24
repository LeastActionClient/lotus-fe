import React from 'react';
import { logoBase64 } from './logoBase64';
import { calculateReceiptTotals, formatCurrency, formatReceiptDate, groupFeeAllocations } from './invoiceUtils';

const ReceiptCopy = ({ payment }) => {
  const isApplication = payment?.paymentType === 'APPLICATION';
  const student = payment?.studentId || payment?.student || {};
  const application = payment?.applicationId || payment?.application || {};
  const groupedRows = groupFeeAllocations(payment);
  const totals = calculateReceiptTotals(groupedRows);
  const showLessAmountColumn = groupedRows.some((row) => Number(row.discountAmount || 0) > 0);
  const invoiceNumber = payment?.invoice?.invoiceNumber || payment?._id || payment?.id || '-';
  const receiptDate = formatReceiptDate(payment?.paymentDate);

  return (
    <section className="receipt-copy flex h-full min-h-full w-full flex-col overflow-hidden px-[2mm] py-[1.5mm]">
      <div className="border-b border-slate-300 pb-0.5">
        <div className="grid min-h-[14mm] grid-cols-[14mm_minmax(0,1fr)_auto] items-center gap-2">
          <img src={logoBase64} alt="Kasthuri School Logo" className="h-[14mm] w-[14mm] object-contain" />

          <h2 className="text-center text-[13px] font-bold uppercase leading-tight text-slate-900">
            KASTHURI NURSERY AND PRIMARY SCHOOL
          </h2>

          <h3 className="shrink-0 text-right text-[13px] font-bold uppercase leading-tight text-slate-900">
            FEE RECEIPT
          </h3>
        </div>

        <div className="mt-0.5 space-y-0.5 text-center">
          <p className="text-[9.5px] leading-tight text-slate-600">
            No.15 &amp; 44 Eda Street, Saidapet, Vellore - 632 012.
          </p>
          <p className="text-[9.5px] leading-tight text-slate-600">
            Phone: 0416-2211877, +91 97919 50179 | Email: Kasthurinurseryschool@gmail.com
          </p>
        </div>
      </div>

      <div className="mx-auto mt-0.5 grid w-full max-w-none grid-cols-2 gap-x-[4mm] gap-y-0.5 text-[10.5px] leading-tight text-slate-900">
        {isApplication ? (
          <>
            <div className="space-y-0.5 pl-[1mm]">
              <p>
                <span className="font-semibold">Application No:</span> {application.applicationId || '-'}
              </p>
              <p>
                <span className="font-semibold">Receipt No:</span> {invoiceNumber}
              </p>
              <p>
                <span className="font-semibold">Applicant Name:</span> {application.studentName || '-'}
              </p>
            </div>
            <div className="space-y-0.5 pr-[1mm] text-right">
              <p>
                <span className="font-semibold">Applying Class:</span> {application.applyingClass || '-'}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {receiptDate}
              </p>
              <p>
                <span className="font-semibold">Payment Mode:</span> {payment?.paymentMethod || '-'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-0.5 pl-[1mm]">
              <p>
                <span className="font-semibold">Admission No:</span> {student.admissionNumber || '-'}
              </p>
              <p>
                <span className="font-semibold">Student Name:</span> {student.studentName || '-'}
              </p>
              <p>
                <span className="font-semibold">Class &amp; Section:</span>{' '}
                {student.currentClass || '-'} {student.section || ''}
              </p>
            </div>
            <div className="space-y-0.5 pr-[1mm] text-right">
              <p>
                <span className="font-semibold">Receipt No:</span> {invoiceNumber}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {receiptDate}
              </p>
              <p>
                <span className="font-semibold">Payment Mode:</span> {payment?.paymentMethod || '-'}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-0.5 rounded-[2px] border border-slate-300">
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-left text-slate-700">
              <th className="px-1.5 py-0.5 font-bold">Fee Description</th>
              <th className="px-1.5 py-0.5 text-right font-bold">Total</th>
              {showLessAmountColumn && (
                <th className="px-1.5 py-0.5 text-right font-bold">Less</th>
              )}
              <th className="px-1.5 py-0.5 text-right font-bold">Paid</th>
              <th className="px-1.5 py-0.5 text-right font-bold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.length > 0 ? (
              groupedRows.map((row, index) => (
                <tr key={`${row.displayName}-${index}`} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-1 py-[1.5px] align-top">{row.displayName}</td>
                  <td className="px-1 py-[1.5px] text-right align-top">{formatCurrency(row.totalAmount)}</td>
                  {showLessAmountColumn && (
                    <td className="px-1 py-[1.5px] text-right align-top">{formatCurrency(row.discountAmount)}</td>
                  )}
                  <td className="px-1 py-[1.5px] text-right align-top">{formatCurrency(row.paidAmount)}</td>
                  <td className="px-1 py-[1.5px] text-right align-top">{formatCurrency(row.balanceAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-1 py-1.5 text-center text-slate-500" colSpan={showLessAmountColumn ? 5 : 4}>
                  No fee details available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-0.5 flex justify-end">
        <div className="w-full max-w-[70mm] rounded-[2px] border border-slate-300 px-1 py-[2px]">
          <p className="border-b border-slate-200 pb-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-700">
            Grand Total
          </p>
          <div className="mt-0.5 space-y-0.5 text-[10.5px] leading-tight text-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span>Total Amount</span>
              <span className="font-semibold">{formatCurrency(totals.paidAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReceiptCopy;
