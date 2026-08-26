const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSpaces = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const titleCase = (value) =>
  normalizeSpaces(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const splitFeeName = (value) => {
  const rawName = normalizeSpaces(value);
  const match = rawName.match(/^(.*?)(?:\s*[-–—]?\s*)(\d{1,2})$/i);

  if (!match || !normalizeSpaces(match[1])) {
    return {
      rawName,
      baseName: rawName,
      suffix: null,
      isGroupedCandidate: false
    };
  }

  return {
    rawName,
    baseName: normalizeSpaces(match[1]),
    suffix: Number(match[2]),
    isGroupedCandidate: true
  };
};

const buildFeeEntry = (source, fallbackAmount = 0) => {
  const fee = source?.studentFeeId || source?.studentFee || source || {};
  const feeName = fee.feeCategoryId?.name || fee.includedChargeId?.name || fee.name || 'Fee';
  const totalAmount = toNumber(fee.totalAmount);
  const paidAmount = toNumber(source?.amount ?? fallbackAmount);
  const balanceAmount = toNumber(fee.remainingAmount);
  const discountAmount = toNumber(
    source?.discountAmount ??
      source?.lessAmount ??
      source?.concessionAmount ??
      fee.discountAmount ??
      fee.lessAmount ??
      fee.concessionAmount
  );

  return {
    rawName: feeName,
    displayName: titleCase(feeName),
    totalAmount,
    paidAmount,
    balanceAmount: Number.isFinite(balanceAmount) && balanceAmount >= 0 ? balanceAmount : 0,
    discountAmount
  };
};

export const parsePaymentEntries = (payment) => {
  if (payment?.paymentType === 'APPLICATION') {
    return [{
      rawName: 'Application Fee',
      displayName: 'Application Fee',
      totalAmount: payment.amount,
      paidAmount: payment.amount,
      balanceAmount: 0,
      discountAmount: 0
    }];
  }

  const feeAllocations = Array.isArray(payment?.feeAllocations) ? payment.feeAllocations : [];
  const studentFee = payment?.studentFee || payment?.studentFeeId || null;

  return feeAllocations.length > 0
    ? feeAllocations.map((allocation) => buildFeeEntry(allocation))
    : studentFee
      ? [buildFeeEntry(studentFee, payment?.amount)]
      : [];
};

export const groupReceiptEntriesList = (entries = []) => {
  const grouped = [];
  const groupedMap = new Map();

  entries.forEach((entry, index) => {
    const { baseName, suffix, isGroupedCandidate } = splitFeeName(entry.rawName);
    const groupKey = isGroupedCandidate ? normalizeSpaces(baseName).toLowerCase() : `__single_${index}`;

    if (!groupedMap.has(groupKey)) {
      const group = {
        key: groupKey,
        baseName: titleCase(baseName),
        displayName: entry.displayName,
        terms: [],
        rows: [],
        totalAmount: 0,
        discountAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        sortIndex: index
      };
      groupedMap.set(groupKey, group);
      grouped.push(group);
    }

    const group = groupedMap.get(groupKey);
    group.rows.push(entry);
    group.totalAmount += entry.totalAmount;
    group.discountAmount += entry.discountAmount;
    group.paidAmount += entry.paidAmount;
    group.balanceAmount += entry.balanceAmount;

    if (suffix !== null && suffix !== undefined && Number.isFinite(suffix)) {
      group.terms.push(suffix);
    }
  });

  return grouped.map((group) => {
    const sortedTerms = [...new Set(group.terms)].sort((a, b) => a - b);
    const shouldCollapse = sortedTerms.length > 1;
    const groupDisplayName = shouldCollapse
      ? `${group.baseName || group.displayName} - ${sortedTerms.join(',')}`
      : group.rows[0]?.displayName || group.displayName;

    return {
      name: group.baseName || group.displayName,
      displayName: groupDisplayName,
      terms: sortedTerms,
      totalAmount: group.totalAmount,
      discountAmount: group.discountAmount,
      paidAmount: group.paidAmount,
      balanceAmount: group.balanceAmount,
      rows: group.rows,
      sortIndex: group.sortIndex
    };
  });
};

export const groupFeeAllocations = (payment) => {
  return groupReceiptEntriesList(parsePaymentEntries(payment));
};

export const groupReceiptEntries = (payment) => groupFeeAllocations(payment);

export const calculateReceiptTotals = (groupedRows) =>
  groupedRows.reduce(
    (acc, row) => ({
      totalAmount: acc.totalAmount + toNumber(row.totalAmount),
      discountAmount: acc.discountAmount + toNumber(row.discountAmount),
      paidAmount: acc.paidAmount + toNumber(row.paidAmount),
      balanceAmount: acc.balanceAmount + toNumber(row.balanceAmount)
    }),
    {
      totalAmount: 0,
      discountAmount: 0,
      paidAmount: 0,
      balanceAmount: 0
    }
  );

export const ACADEMIC_FEE_CATEGORIES = [
  'book fee',
  'term 1',
  'term 2',
  'term 3',
  'tuition term 1',
  'tuition term 2',
  'tuition term 3',
  'abacus term 1',
  'abacus term 2',
  'abacus term 3',
  'term',
  'tuition term',
  'abacus term'
];

export const isAcademicCategory = (feeName) => {
  if (!feeName) return false;
  const normalized = normalizeSpaces(feeName).toLowerCase();

  if (ACADEMIC_FEE_CATEGORIES.includes(normalized)) {
    return true;
  }

  return (
    /^book fee/i.test(normalized) ||
    /^term\s*\d*$/i.test(normalized) ||
    /^tuition\s*term\s*\d*$/i.test(normalized) ||
    /^abacus\s*term\s*\d*$/i.test(normalized)
  );
};

export const getSplitBillsForPayment = (payment) => {
  const allEntries = parsePaymentEntries(payment);

  const academicEntries = [];
  const additionalEntries = [];

  allEntries.forEach((entry) => {
    if (isAcademicCategory(entry.rawName)) {
      academicEntries.push(entry);
    } else {
      additionalEntries.push(entry);
    }
  });

  const bills = [];

  if (academicEntries.length > 0) {
    const groupedRows = groupReceiptEntriesList(academicEntries);
    bills.push({
      id: 'academic',
      type: 'ACADEMIC',
      headerTitle: { line1: 'ACADEMIC FEE', line2: 'RECEIPT' },
      entries: academicEntries,
      groupedRows,
      totals: calculateReceiptTotals(groupedRows)
    });
  }

  if (additionalEntries.length > 0) {
    const groupedRows = groupReceiptEntriesList(additionalEntries);
    bills.push({
      id: 'additional',
      type: 'ADDITIONAL',
      headerTitle: { line1: 'ADDITIONAL CHARGES', line2: 'RECEIPT' },
      entries: additionalEntries,
      groupedRows,
      totals: calculateReceiptTotals(groupedRows)
    });
  }

  if (bills.length === 0) {
    const groupedRows = groupReceiptEntries(payment);
    bills.push({
      id: 'academic',
      type: 'ACADEMIC',
      headerTitle: { line1: 'ACADEMIC FEE', line2: 'RECEIPT' },
      entries: allEntries,
      groupedRows,
      totals: calculateReceiptTotals(groupedRows)
    });
  }

  return bills;
};

export const formatCurrency = (value) => `${toNumber(value).toFixed(2)}`;

export const formatReceiptDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};
