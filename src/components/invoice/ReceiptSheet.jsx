import React from 'react';
import ReceiptCopy from './ReceiptCopy';

const SHEET_OUTER_WIDTH_MM = 200;
const SHEET_OUTER_HEIGHT_MM = 287;
const SHEET_PADDING_MM = 3;
const SHEET_GAP_MM = 2.5;

const toMm = (value) => `${value}mm`;

const ReceiptSheet = ({ payment }) => {
  const innerWidthMm = SHEET_OUTER_WIDTH_MM - SHEET_PADDING_MM * 2;
  const innerHeightMm = SHEET_OUTER_HEIGHT_MM - SHEET_PADDING_MM * 2;
  const cellWidthMm = (innerWidthMm - SHEET_GAP_MM) / 2;
  const cellHeightMm = (innerHeightMm - SHEET_GAP_MM) / 2;

  return (
    <div
      className="receipt-sheet mx-auto grid w-full max-w-[200mm] grid-cols-2 gap-[2.5mm] overflow-hidden bg-white text-slate-900"
      style={{
        width: toMm(SHEET_OUTER_WIDTH_MM),
        height: toMm(SHEET_OUTER_HEIGHT_MM),
        padding: toMm(SHEET_PADDING_MM)
      }}
    >
      {Array.from({ length: 1 }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-[2px] border border-dashed border-slate-200 bg-white"
          style={{
            width: toMm(cellWidthMm),
            height: toMm(cellHeightMm)
          }}
        >
          <div className="h-full w-full">
            <ReceiptCopy payment={payment} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceiptSheet;
