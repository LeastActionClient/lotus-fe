import { formatCurrency } from './invoiceUtils.js';

export const receiptPalette = {
  orange: '#F58220',
  lightOrange: '#FDE9D9',
  darkGrey: '#555555',
  border: '#ECECEC',
  alternateRow: '#FFF8F2',
  text: '#2F2F2F',
  muted: '#8A8A8A'
};

export const receiptMetrics = {
  pageWidthMm: 95,
  pageHeightMm: 138,
  pageMarginMm: 5,
  innerPaddingMm: 4,
  footerHeightMm: 5.5,
  maxRowsPerPage: 12,
  contentGapMm: 1.8
};

export const receiptFontClasses = {
  label: 'text-[7px] font-medium tracking-[0.14em] text-[#555555]',
  value: 'text-[8.5px] font-semibold leading-tight text-[#2F2F2F]',
  accentValue: 'text-[8.5px] font-semibold leading-tight text-[#F58220]',
  amount: 'text-[8.5px] font-semibold leading-tight text-[#2F2F2F]',
  heading: 'text-[8px] font-semibold uppercase tracking-[0.14em] text-[#F58220]'
};

export const formatReceiptMoney = (value) => formatCurrency(value);

export const normalizeReceiptRows = (rows = []) => rows.filter(Boolean);

export const splitReceiptRowsIntoPages = (rows = [], maxRowsPerPage = receiptMetrics.maxRowsPerPage) => {
  const normalizedRows = normalizeReceiptRows(rows);

  if (normalizedRows.length <= maxRowsPerPage) {
    return [normalizedRows];
  }

  const pages = [];

  for (let index = 0; index < normalizedRows.length; index += maxRowsPerPage) {
    pages.push(normalizedRows.slice(index, index + maxRowsPerPage));
  }

  return pages;
};

export const buildReceiptSummaryRows = ({ totals, payment }) => {
  const paidAmount = Number(totals?.paidAmount || payment?.amount || 0);

  return [
    { label: 'Paid Amount', value: formatReceiptMoney(paidAmount), accent: false }
  ];
};

export const formatReceiptDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};
