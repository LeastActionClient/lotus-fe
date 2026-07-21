import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PieChart, TrendingUp, Calendar, LayoutList } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';

const Reports = () => {
  const [daily, setDaily] = useState([]);
  const [pending, setPending] = useState([]);
  const [categoryWise, setCategoryWise] = useState([]);
  const [loading, setLoading] = useState(true);

  const [timeframe, setTimeframe] = useState('daily');
  
  // Custom date range states
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [feeCategories, setFeeCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        let collectionEndpoint = `/reports/${timeframe}-collection`;
        
        if (timeframe === 'custom') {
          collectionEndpoint = `/reports/custom-collection?startDate=${startDate}&endDate=${endDate}`;
        }

        const [collectionRes, pendingRes, categoriesRes] = await Promise.all([
          api.get(collectionEndpoint),
          api.get('/reports/pending-fees'),
          api.get('/fees/categories')
        ]);
        
        const rawPayments = collectionRes.data.payments || [];
        const processedPayments = [];
        
        rawPayments.forEach(p => {
          if (p.feeAllocations && p.feeAllocations.length > 0) {
            p.feeAllocations.forEach(alloc => {
              processedPayments.push({
                ...p,
                amount: alloc.amount,
                studentFeeId: alloc.studentFeeId,
                isFlattened: true
              });
            });
          } else {
            processedPayments.push(p);
          }
        });

        setDaily(processedPayments);
        setPending(pendingRes.data.pendingFees || []);
        setFeeCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching reports", error);
      } finally {
        setLoading(false);
      }
    };
    
    // For custom timeframe, only fetch if both dates are set
    if (timeframe !== 'custom' || (startDate && endDate)) {
      fetchReports();
    }
  }, [timeframe, startDate, endDate]);

  const filteredCollections = daily.filter(item => {
    if (selectedCategory === 'ALL') return true;
    
    const catName = item.studentFee?.feeCategory?.name || item.studentFeeId?.feeCategoryId?.name;
    const catId = item.studentFee?.feeCategory?._id || item.studentFee?.feeCategory || item.studentFeeId?.feeCategoryId?._id || item.studentFeeId?.feeCategoryId;
    
    if (selectedCategory === 'APPLICATION_FEES') {
      return catName === 'Application Fee';
    }
    return catId === selectedCategory;
  });

  const totalFilteredCollections = filteredCollections.reduce((sum, item) => sum + (item.amount || 0), 0);

  const downloadCSV = () => {
    const headers = ['Date', 'Student Name', 'Admission No', 'Fee Category', 'Amount', 'Collected By'];
    const rows = filteredCollections.map(item => [
      new Date(item.paymentDate).toLocaleDateString(),
      item.student?.studentName || item.studentId?.studentName || '',
      item.student?.admissionNumber || item.studentId?.admissionNumber || '',
      item.studentFee?.feeCategory?.name || item.studentFeeId?.feeCategoryId?.name || '',
      item.amount?.toFixed(2) || '0.00',
      item.recordedBy?.username || item.recordedById?.username || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filenameTimeframe = timeframe === 'custom' ? `${startDate}_to_${endDate}` : timeframe;
    link.download = `${filenameTimeframe}_collection_report.csv`;
    link.click();
  };

  if (loading && daily.length === 0) return <PageLoader text="Loading reports..." />;

  const totalPending = pending.reduce((sum, item) => sum + (item.remainingAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
          <PieChart className="mr-3 text-orange-600" size={32} />
          Reports & Analytics
        </h1>
        <p className="text-gray-500  mt-2">Insights on collections and pending dues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
            <CardTitle className="flex items-center text-gray-700 ">
              <Calendar className="h-5 w-5 mr-2 text-orange-600" /> Collections
            </CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border border-gray-300 rounded-md text-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 max-w-[200px] truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="APPLICATION_FEES">Application Fees</option>
                {feeCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              <select 
                className="border border-gray-300 rounded-md text-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
              
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
                  <span className="text-lg font-bold text-orange-600">₹{totalFilteredCollections.toFixed(2)}</span>
                </div>
              )}
            </div>
            {!filteredCollections || filteredCollections.length === 0 ? <p className="text-gray-500">No recent collections in this period.</p> : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {filteredCollections.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(item.paymentDate).toLocaleDateString()} - {item.student?.studentName || item.studentId?.studentName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.studentFee?.feeCategory?.name || item.studentFeeId?.feeCategoryId?.name} | Admission No: {item.student?.admissionNumber || item.studentId?.admissionNumber} | Collected by: {item.recordedBy?.username || item.recordedById?.username || ''}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600">Rs. {item.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="md:col-span-1">
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
        </div>
      </div>
    </div>
  );
};

export default Reports;
