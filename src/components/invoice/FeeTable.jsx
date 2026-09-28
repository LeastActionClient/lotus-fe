import React, { memo } from 'react';
import { formatReceiptMoney } from './receiptHelpers';

const TableCell = ({ children, align = 'right', className = '' }) => (
  <div
    className={[
      'min-w-0 border-t border-[#ECECEC] px-[2.6mm] py-[1.7mm] text-[10px] font-bold leading-[1.18]',
      align === 'left' ? 'text-left' : 'text-right',
      className
    ].join(' ')}
  >
    {children}
  </div>
);

const FeeTable = memo(({ groupedRows, showLessAmount: forceShowLessAmount }) => {
  const rows = Array.isArray(groupedRows) ? groupedRows : [];
  const showLessAmount = typeof forceShowLessAmount === 'boolean'
    ? forceShowLessAmount
    : rows.some((row) => Number(row.discountAmount || row.lessAmount || 0) > 0);
  const getCellClass = (baseClass, hasLeftBorder = false) => [
    baseClass,
    hasLeftBorder ? 'border-l border-[#ECECEC]' : '',
    'border-t border-[#ECECEC]'
  ].join(' ');

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#ECECEC] shadow-sm break-inside-avoid">
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: showLessAmount
            ? 'minmax(0,1fr) max-content max-content max-content max-content'
            : 'minmax(0,1fr) max-content max-content max-content'
        }}
      >
        <div className="bg-[#013e8b] px-[2.6mm] py-[1.8mm] text-left text-[10px] font-bold text-white">
          Fee Description
        </div>
        <div className="border-l border-[#FFFFFF33] bg-[#013e8b] px-[2.6mm] py-[1.8mm] text-right text-[10px] font-bold text-white">
          Total
        </div>
        {showLessAmount && (
          <div className="border-l border-[#FFFFFF33] bg-[#013e8b] px-[2.6mm] py-[1.8mm] text-right text-[10px] font-bold text-white">
            Less
          </div>
        )}
        <div className="border-l border-[#FFFFFF33] bg-[#013e8b] px-[2.6mm] py-[1.8mm] text-right text-[10px] font-bold text-white">
          Paid
        </div>
        <div className="border-l border-[#FFFFFF33] bg-[#013e8b] px-[2.6mm] py-[1.8mm] text-right text-[10px] font-bold text-white">
          Balance
        </div>

        {rows.length > 0 ? (
          rows.map((row, index) => (
            <React.Fragment key={`${row.displayName}-${index}`}>
              <TableCell
                align="left"
                className={getCellClass(`text-[#111111] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}`)}
              >
                <span className="block whitespace-normal break-words leading-[1.18]">
                  {row.displayName}
                </span>
              </TableCell>
              <TableCell className={getCellClass(`tabular-nums text-[#111111] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}`, true)}>
                {formatReceiptMoney(row.totalAmount)}
              </TableCell>
              {showLessAmount && (
                <TableCell className={getCellClass(`tabular-nums text-[#111111] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}`, true)}>
                  {formatReceiptMoney(row.discountAmount || row.lessAmount || 0)}
                </TableCell>
              )}
              <TableCell className={getCellClass(`tabular-nums text-[#111111] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}`, true)}>
                {formatReceiptMoney(row.paidAmount)}
              </TableCell>
              <TableCell className={getCellClass(`tabular-nums text-[#111111] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F2]'}`, true)}>
                {formatReceiptMoney(row.balanceAmount)}
              </TableCell>
            </React.Fragment>
          ))
        ) : (
          <div className="col-span-4 bg-white px-3 py-3 text-center text-[10.2px] font-bold text-[#555555]">
            No fee details available.
          </div>
        )}
      </div>
    </section>
  );
});

FeeTable.displayName = 'FeeTable';

export default FeeTable;
