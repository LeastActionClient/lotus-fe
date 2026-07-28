import React, { memo } from 'react';
import { formatReceiptMoney } from './receiptHelpers';

const TableCell = ({ children, align = 'right', className = '' }) => (
  <td className={`px-2 py-1 align-top ${align === 'left' ? 'text-left' : 'text-right'} ${className}`.trim()}>
    {children}
  </td>
);

const FeeTable = memo(({ groupedRows }) => {
  const showLessAmount = groupedRows.some((row) => Number(row.discountAmount || row.lessAmount || 0) > 0);
  const columnCount = showLessAmount ? 5 : 4;

  return (
    <section className="mt-3 overflow-hidden rounded-[14px] border border-[#ECECEC] shadow-sm">
      <table className="w-full table-fixed border-collapse text-[9.0px] leading-tight">
        <colgroup>
          <col className={showLessAmount ? 'w-[38%]' : 'w-[49%]'} />
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
          {showLessAmount && <col className="w-[15.5%]" />}
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
        </colgroup>
        <thead className="bg-[#F58220] text-white">
          <tr>
            <th className="px-2 py-2 text-left font-semibold">Fee Description</th>
            <th className="px-2 py-2 text-right font-semibold">Total</th>
            {showLessAmount && <th className="px-2 py-2 text-right font-semibold">Less Amount</th>}
            <th className="px-2 py-2 text-right font-semibold">Paid</th>
            <th className="px-2 py-2 text-right font-semibold">Balance</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {groupedRows.length > 0 ? (
            groupedRows.map((row, index) => (
              <tr key={`${row.displayName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}>
                <TableCell align="left" className="font-bold text-[#555555]">
                  <span className="block truncate" title={row.displayName}>
                    {row.displayName}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-[#555555]">{formatReceiptMoney(row.totalAmount)}</TableCell>
                {showLessAmount && (
                  <TableCell className="font-bold text-[#555555]">
                    {formatReceiptMoney(row.discountAmount || row.lessAmount || 0)}
                  </TableCell>
                )}
                <TableCell className="font-bold text-[#555555]">{formatReceiptMoney(row.paidAmount)}</TableCell>
                <TableCell className="font-bold text-[#555555]">{formatReceiptMoney(row.balanceAmount)}</TableCell>
              </tr>
            ))
          ) : (
            <tr className="bg-white">
              <td colSpan={columnCount} className="px-3 py-4 text-center text-[9px] font-medium text-[#555555]">
                No fee details available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
});

FeeTable.displayName = 'FeeTable';

export default FeeTable;
