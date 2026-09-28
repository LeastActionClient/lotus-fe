import React, { useState, useEffect, useMemo } from 'react';
import { Download, PieChart, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { useFeeCategoriesQuery, usePendingFeesQuery, useReportDataQuery, useDashboardOverviewQuery, useIncludedChargesQuery } from '../hooks/useSchoolQueries';
import * as XLSX from 'xlsx';

const formatDateDDMMYYYY = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const escapeCSVValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const Reports = () => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  const [timeframe, setTimeframe] = useState('daily');
  
  // Custom date range states
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { data: reportData = {}, isLoading: reportLoading } = useReportDataQuery(timeframe, startDate, endDate);
  const { data: pendingData = {}, isLoading: pendingLoading } = usePendingFeesQuery();
  const { data: feeCategories = [], isLoading: categoriesLoading } = useFeeCategoriesQuery();
  const { data: includedCharges = [], isLoading: chargesLoading } = useIncludedChargesQuery();
  const { data: overview = {} } = useDashboardOverviewQuery();

  const allCategories = useMemo(() => {
    const combined = [...feeCategories];
    includedCharges.forEach(charge => {
      combined.push({ _id: charge._id, name: `${charge.name} (Included Charge)` });
    });
    return combined;
  }, [feeCategories, includedCharges]);

  const daily = useMemo(() => {
    const rawPayments = reportData.payments || [];
    const processedPayments = [];

    rawPayments.forEach((payment) => {
      if (payment.feeAllocations && payment.feeAllocations.length > 0) {
        payment.feeAllocations.forEach((alloc) => {
          processedPayments.push({
            ...payment,
            amount: alloc.amount,
            studentFeeId: alloc.studentFeeId,
            isFlattened: true
          });
        });
      } else {
        processedPayments.push(payment);
      }
    });

    return processedPayments;
  }, [reportData]);

  const pending = useMemo(() => pendingData.pendingFees || [], [pendingData]);

  const filteredCollections = daily.filter(item => {
    if (selectedCategory === 'ALL') return true;
    
    const catName = item.studentFee?.feeCategory?.name || item.studentFeeId?.feeCategoryId?.name || item.studentFeeId?.includedChargeId?.name || item.feeCategoryName;
    
    let catId = item.studentFee?.feeCategory?._id || item.studentFee?.feeCategory;
    if (!catId) {
      catId = item.studentFeeId?.feeCategoryId?._id || item.studentFeeId?.feeCategoryId;
    }
    if (!catId) {
      catId = item.studentFeeId?.includedChargeId?._id || item.studentFeeId?.includedChargeId;
    }
    if (!catId) {
      catId = item.studentFeeId;
    }
    
    if (selectedCategory === 'APPLICATION_FEES') {
      return catName === 'Application Fee' || item.paymentType === 'APPLICATION';
    }
    
    // Fuzzy matching fallback if names are very similar (e.g. Abcus kit vs Abacus kit)
    if (String(catId) === String(selectedCategory)) return true;

    const selectedCatObj = allCategories.find(c => String(c._id) === String(selectedCategory));
    if (selectedCatObj && catName) {
        const name1 = selectedCatObj.name.toLowerCase().replace(/[^a-z0-9]/g, '').replace('includedcharge', '');
        const name2 = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (name1 === name2) return true;
        if (name1.includes('abacus') && name2.includes('abcus')) return true;
        if (name1.includes('abcus') && name2.includes('abacus')) return true;
    }

    return false;
  });

  const totalFilteredCollections = filteredCollections.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleExportExcel = () => {
    const data = filteredCollections.map(item => {
      const studentObj = item.student || item.studentId || {};
      const feeCategoryObj = item.studentFee?.feeCategory || item.studentFeeId?.feeCategoryId || item.studentFeeId?.includedChargeId || {};
      const recordedByObj = item.recordedBy || item.recordedById || item.processedById || {};

      return {
        'Date': formatDateDDMMYYYY(item.paymentDate),
        'Class': studentObj.currentClass || item.className || '',
        'Sec': studentObj.section || item.section || '',
        'Admission number': studentObj.admissionNumber || '',
        'Fee category': feeCategoryObj.name || (item.paymentType === 'APPLICATION' ? 'Application Fee' : ''),
        'Amount': item.amount !== undefined ? item.amount.toFixed(2) : '0.00',
        'Method': item.paymentMethod || 'Cash',
        'Collected by': recordedByObj.username || ''
      };
    });

    const overallTotal = filteredCollections.reduce((sum, item) => sum + (item.amount || 0), 0);
    const methodTotals = {};
    filteredCollections.forEach(item => {
      const method = (item.paymentMethod || 'Cash').trim();
      methodTotals[method] = (methodTotals[method] || 0) + (item.amount || 0);
    });

    // Blank separator row
    data.push({
      'Date': '',
      'Class': '',
      'Sec': '',
      'Admission number': '',
      'Fee category': '',
      'Amount': '',
      'Method': '',
      'Collected by': ''
    });

    // Conclusion Row - Total Collection
    data.push({
      'Date': '--- CONCLUSION ---',
      'Class': '',
      'Sec': '',
      'Admission number': '',
      'Fee category': 'TOTAL COLLECTION',
      'Amount': overallTotal.toFixed(2),
      'Method': 'FULL AMOUNT',
      'Collected by': ''
    });

    // Method Breakdown Rows
    Object.keys(methodTotals).forEach(method => {
      data.push({
        'Date': '',
        'Class': '',
        'Sec': '',
        'Admission number': '',
        'Fee category': `${method} Total`,
        'Amount': methodTotals[method].toFixed(2),
        'Method': method,
        'Collected by': ''
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    const filenameTimeframe = timeframe === 'custom' ? `${startDate}_to_${endDate}` : timeframe;
    XLSX.writeFile(workbook, `${filenameTimeframe}_collection_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Class', 'Sec', 'Admission number', 'Fee category', 'Amount', 'Method', 'Collected by'];
    const rows = filteredCollections.map(item => {
      const studentObj = item.student || item.studentId || {};
      const feeCategoryObj = item.studentFee?.feeCategory || item.studentFeeId?.feeCategoryId || item.studentFeeId?.includedChargeId || {};
      const recordedByObj = item.recordedBy || item.recordedById || item.processedById || {};

      return [
        formatDateDDMMYYYY(item.paymentDate),
        studentObj.currentClass || item.className || '',
        studentObj.section || item.section || '',
        studentObj.admissionNumber || '',
        feeCategoryObj.name || (item.paymentType === 'APPLICATION' ? 'Application Fee' : ''),
        item.amount !== undefined ? item.amount.toFixed(2) : '0.00',
        item.paymentMethod || 'Cash',
        recordedByObj.username || ''
      ].map(escapeCSVValue);
    });

    const overallTotal = filteredCollections.reduce((sum, item) => sum + (item.amount || 0), 0);
    const methodTotals = {};
    filteredCollections.forEach(item => {
      const method = (item.paymentMethod || 'Cash').trim();
      methodTotals[method] = (methodTotals[method] || 0) + (item.amount || 0);
    });

    rows.push(['', '', '', '', '', '', '', ''].map(escapeCSVValue));
    rows.push(['--- CONCLUSION ---', '', '', '', 'TOTAL COLLECTION', overallTotal.toFixed(2), 'FULL AMOUNT', ''].map(escapeCSVValue));
    Object.keys(methodTotals).forEach(method => {
      rows.push(['', '', '', '', `${method} Total`, methodTotals[method].toFixed(2), method, ''].map(escapeCSVValue));
    });
    
    const csvContent = [headers.map(escapeCSVValue).join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filenameTimeframe = timeframe === 'custom' ? `${startDate}_to_${endDate}` : timeframe;
    link.download = `${filenameTimeframe}_collection_report.csv`;
    link.click();
  };

  const isPageLoading = reportLoading || pendingLoading || categoriesLoading || chargesLoading;
  if (isPageLoading && daily.length === 0) return <PageLoader text="Loading reports..." />;

  const totalPending = pending.reduce((sum, item) => sum + (item.remainingAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
          <PieChart className="mr-3 text-blue-600" size={32} />
          Reports & Analytics
        </h1>
        <p className="text-gray-500  mt-2">Insights on collections and pending dues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
            <CardTitle className="flex items-center text-gray-700 ">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" /> Collections
            </CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border border-gray-300 rounded-md text-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="APPLICATION_FEES">Application Fees</option>
                {allCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              <select 
                className="border border-gray-300 rounded-md text-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
              
              <Button size="sm" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          
          {timeframe === 'custom' && (
            <div className="px-6 pb-4 flex flex-wrap gap-4 items-center bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">From</span>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-md text-sm p-1.5"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">To</span>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-md text-sm p-1.5"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
          )}

          <CardContent className={timeframe === 'custom' ? "pt-4" : "pt-6"}>
            <div className="flex flex-col gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Overall Total Collected:</span>
                <span className="text-xl font-bold text-green-600">₹{daily.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</span>
              </div>
              {selectedCategory !== 'ALL' && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Filtered Category Total:</span>
                  <span className="text-lg font-bold text-blue-600">₹{totalFilteredCollections.toFixed(2)}</span>
                </div>
              )}
            </div>
            {!filteredCollections || filteredCollections.length === 0 ? <p className="text-gray-500">No recent collections in this period.</p> : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {filteredCollections.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDateDDMMYYYY(item.paymentDate)} - {item.student?.studentName || item.studentId?.studentName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.studentFee?.feeCategory?.name || item.studentFeeId?.feeCategoryId?.name || item.studentFeeId?.includedChargeId?.name || (item.paymentType === 'APPLICATION' ? 'Application Fee' : '')} | Admission No: {item.student?.admissionNumber || item.studentId?.admissionNumber} | Collected by: {item.recordedBy?.username || item.recordedById?.username || item.processedById?.username || ''}
                      </span>
                    </div>
                    <div className="flex justify-between w-28 font-bold text-emerald-600 select-none">
                      <span className="text-gray-500 font-medium text-left">Rs.</span>
                      <span>{item.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="h-fit bg-gradient-to-br from-red-50/50 to-white border-red-100/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-700 ">
                <TrendingUp className="h-5 w-5 mr-2 text-red-500" /> Pending Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-sm text-gray-500 block mb-1">Total Outstanding</span>
                <span className="text-3xl font-bold text-red-600">₹{totalPending.toFixed(2)}</span>
              </div>
              {!pending || pending.length === 0 ? <p className="text-gray-500">No pending dues.</p> : null}
            </CardContent>
          </Card>
          
          {currentUser.role === 'SUPER_ADMIN' && (
            <Card className="h-fit bg-gradient-to-br from-purple-50 to-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 ">Total Collections</CardTitle>
                <IndianRupee className="h-4 w-4 text-blue-600 " />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">₹{(overview?.stats?.collections || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <p className="mt-2 flex items-center text-xs text-gray-500">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Collected through fees
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
