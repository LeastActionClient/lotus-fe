import React, { memo } from 'react';
import { formatReceiptMoney } from './receiptHelpers';

const TableCell = ({ children, align = 'right', className = '', isFirst = false }) => (
  // <td
  //   className={`align-top px-2.5 py-1.5 ${
  //     align === 'left' ? 'text-left' : 'text-right'
  //   } ${isFirst ? '' : 'border-l border-[#F2D7BD]'} ${className}`.trim()}
  // >
  //   {children}
  // </td>
  <td
  className={`align-top px-[5px] py-[5px] ${
    align === 'left' ? 'text-left' : 'text-right'
  } ${isFirst ? '' : 'border-r border-[#F2D7BD]'} ${className}`.trim()}
>
  {children}
</td>
);

const FeeTable = memo(({ groupedRows }) => {
  const showLessAmount = groupedRows.some((row) => Number(row.discountAmount || row.lessAmount || 0) > 0);
  const columnCount = showLessAmount ? 5 : 4;

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#ECECEC] shadow-sm">
      <table className="w-full table-fixed border-separate border-spacing-0 text-[8.5px] leading-[1.0]">
        <colgroup>
          <col className={showLessAmount ? 'w-[38%]' : 'w-[49%]'} />
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
          {showLessAmount && <col className="w-[15.5%]" />}
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
          <col className={showLessAmount ? 'w-[15.5%]' : 'w-[17%]'} />
        </colgroup>
        <thead className="bg-[#F58220] text-white">
          <tr>
            <th className="rounded-tl-[14px] px-2 py-[5px] text-left font-semibold">Fee Description</th>
            <th className="border-l border-[#F4B372] px-2 py-[5px] text-right font-semibold">Total</th>
            {showLessAmount && <th className="border-l border-[#F4B372] px-2 py-[5px] text-right font-semibold">Less Amount</th>}
            <th className="border-l border-[#F4B372] px-2 py-[5px] text-right font-semibold">Paid</th>
            <th className="rounded-tr-[14px] border-l border-[#F4B372] px-2 py-[5px] text-right font-semibold">Balance</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {groupedRows.length > 0 ? (
            groupedRows.map((row, index) => (
              <tr
                key={`${row.displayName}-${index}`}
                className={index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}
              >
                <TableCell isFirst align="left" className="font-semibold text-[#111111]">
                  <span className="block truncate leading-[1.0]" title={row.displayName}>
                    {row.displayName}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-[#111111]">{formatReceiptMoney(row.totalAmount)}</TableCell>
                {showLessAmount && (
                  <TableCell className="font-semibold text-[#111111]">
                    {formatReceiptMoney(row.discountAmount || row.lessAmount || 0)}
                  </TableCell>
                )}
                <TableCell className="font-semibold text-[#111111]">{formatReceiptMoney(row.paidAmount)}</TableCell>
                <TableCell className="font-semibold text-[#111111]">{formatReceiptMoney(row.balanceAmount)}</TableCell>
              </tr>
            ))
          ) : (
            <tr className="bg-white">
              <td colSpan={columnCount} className="px-3 py-2.5 text-center text-[8.4px] font-medium text-[#555555]">
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
