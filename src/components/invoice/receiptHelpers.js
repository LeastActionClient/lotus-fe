import { formatCurrency } from './invoiceUtils';

export const receiptPalette = {
  orange: '#F58220',
  lightOrange: '#FDE9D9',
  darkGrey: '#555555',
  border: '#ECECEC',
  alternateRow: '#FFF8F2'
};

export const receiptFontClasses = {
  label: 'text-[7px] font-medium tracking-[0.14em] text-[#555555]',
  value: 'text-[8.5px] font-semibold leading-tight text-[#2F2F2F]',
  accentValue: 'text-[8.5px] font-semibold leading-tight text-[#F58220]',
  amount: 'text-[8.5px] font-semibold leading-tight text-[#2F2F2F]',
  heading: 'text-[8px] font-semibold uppercase tracking-[0.14em] text-[#F58220]'
};

export const formatReceiptMoney = (value) => formatCurrency(value);
