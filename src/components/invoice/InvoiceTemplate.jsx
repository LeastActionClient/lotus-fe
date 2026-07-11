import React from 'react';

const money = (value) => `Rs. ${(Number(value) || 0).toFixed(2)}`;

const InvoiceTemplate = ({ payment }) => {
  if (!payment) return null;

  const student = payment.studentId || payment.student || {};
  const feeAllocations = Array.isArray(payment.feeAllocations) ? payment.feeAllocations : [];
  const hasAllocations = feeAllocations.length > 0;
  const singleFee = payment.studentFee || payment.studentFeeId || null;

  const rows = hasAllocations
    ? feeAllocations.map((allocation) => {
        const fee = allocation.studentFeeId || {};
        return {
          description: fee.feeCategoryId?.name || 'Fee',
          totalAmount: fee.totalAmount || 0,
          paidAmount: allocation.amount || 0,
          balanceAmount: fee.remainingAmount || 0
        };
      })
    : singleFee
      ? [
          {
            description: singleFee.feeCategoryId?.name || 'Fee',
            totalAmount: singleFee.totalAmount || 0,
            paidAmount: payment.amount || 0,
            balanceAmount: singleFee.remainingAmount || 0
          }
        ]
      : [];

  const remainingBalance = hasAllocations
    ? feeAllocations.reduce((sum, allocation) => sum + (Number(allocation.studentFeeId?.remainingAmount) || 0), 0)
    : Number(singleFee?.remainingAmount) || 0;

  return (
    <div className="invoice-sheet mx-auto w-full max-w-[210mm] overflow-hidden bg-white text-gray-900">
      <div className="h-2 bg-blue-800" />

      <div className="px-6 pb-6 pt-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <img src="/logo.svg" alt="Kasthuri School Logo" className="mt-1 h-11 w-11 object-contain" />
            <div>
              <h2 className="text-[15px] font-bold uppercase leading-tight text-blue-800 sm:text-[17px]">
                KASTHURI NURSERY &amp; PRIMARY SCHOOL
              </h2>
              <p className="text-[11px] leading-4 text-gray-600">
                No.15 &amp; 44 Eda Street, Saidapet, Vellore - 632 012.
              </p>
              <p className="text-[11px] leading-4 text-gray-600">
                Phone: 0416-2211877, +91 97919 50179 | Email: Kasthurinurseryschool@gmail.com
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <h3 className="text-[15px] font-bold uppercase leading-tight text-gray-900 sm:text-[17px]">
              FEE RECEIPT /
              <br />
              INVOICE
            </h3>
          </div>
        </div>

        <div className="my-4 h-px bg-gray-200" />

        {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="invoice-section">
            <p className="text-[13px] font-bold text-gray-700">Invoice Details:</p>
            <div className="mt-1 space-y-1 text-[12px] leading-5 text-gray-900">
              <p>Date: {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</p>
              <p>Payment Method: {payment.paymentMethod || '-'}</p>
            </div>
          </section>

          <section className="invoice-section md:pl-6">
            <p className="text-[13px] font-bold text-gray-700">Student Details:</p>
            <div className="mt-1 space-y-1 text-[12px] leading-5 text-gray-900">
              <p>Name: {student.studentName || '-'}</p>
              <p>Admission No: {student.admissionNumber || '-'}</p>
              <p>
                Class &amp; Section: {student.currentClass || '-'} {student.section || ''}
              </p>
            </div>
          </section>
        </div> */}
        <section className="invoice-section">
         <div className="grid grid-cols-2 gap-8 print:grid-cols-2">
           {/* Left Side - Invoice Details */}
           <div>
             <p className="text-[13px] font-bold text-gray-700 mb-2">
               Invoice Details
             </p>
       
             <div className="space-y-1 text-[12px] leading-5 text-gray-900">
               <p>
                 <span className="font-medium">Date:</span>{" "}
                 {payment.paymentDate
                   ? new Date(payment.paymentDate).toLocaleDateString()
                   : "-"}
               </p>
       
               <p>
                 <span className="font-medium">Payment Method:</span>{" "}
                 {payment.paymentMethod || "-"}
               </p>
       
               {payment.referenceNumber && (
                 <p>
                   <span className="font-medium">Reference No:</span>{" "}
                   {payment.referenceNumber}
                 </p>
               )}
             </div>
           </div>
       
           {/* Right Side - Student Details */}
           <div>
             <p className="text-[13px] font-bold text-gray-700 mb-2">
               Student Details
             </p>
       
             <div className="space-y-1 text-[12px] leading-5 text-gray-900">
               <p>
                 <span className="font-medium">Name:</span>{" "}
                 {student.studentName || "-"}
               </p>
       
               <p>
                 <span className="font-medium">Admission No:</span>{" "}
                 {student.admissionNumber || "-"}
               </p>
       
               <p>
                 <span className="font-medium">Class & Section:</span>{" "}
                 {student.currentClass || "-"} {student.section || ""}
               </p>
             </div>
           </div>
         </div>
       </section>

        <div className="mt-5 overflow-hidden rounded-sm border border-gray-200">
          <table className="invoice-table w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100 text-left text-gray-700">
                <th className="px-3 py-2 font-bold">Fee Description</th>
                <th className="px-3 py-2 font-bold">Total Amount</th>
                <th className="px-3 py-2 font-bold">Paid (This Receipt)</th>
                <th className="px-3 py-2 font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={`${row.description}-${index}`} className="invoice-row border-b border-gray-200">
                    <td className="px-3 py-2 align-top">{row.description}</td>
                    <td className="px-3 py-2 align-top">{money(row.totalAmount)}</td>
                    <td className="px-3 py-2 align-top">{money(row.paidAmount)}</td>
                    <td className="px-3 py-2 align-top">{money(row.balanceAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr className="invoice-row border-b border-gray-200">
                  <td className="px-3 py-2 text-gray-500" colSpan={4}>
                    No fee details available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <section className="invoice-section w-full max-w-[300px] rounded-sm border border-gray-200 bg-white px-3 py-2">
            <p className="border-b border-gray-200 pb-2 text-[13px] font-bold text-gray-700">
              Payment Summary
            </p>
            <div className="space-y-1 pt-2 text-[12px] leading-5 text-gray-900">
              <div className="flex items-center justify-between gap-4">
                <span>Amount Received:</span>
                <span className="font-semibold">{money(payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Remaining Balance:</span>
                <span>{money(remainingBalance)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
