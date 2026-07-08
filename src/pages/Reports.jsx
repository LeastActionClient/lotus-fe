import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PieChart, TrendingUp, Calendar, LayoutList } from 'lucide-react';

const Reports = () => {
  const [daily, setDaily] = useState([]);
  const [pending, setPending] = useState([]);
  const [categoryWise, setCategoryWise] = useState([]);
  const [loading, setLoading] = useState(true);

  const [timeframe, setTimeframe] = useState('daily');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [collectionRes, pendingRes] = await Promise.all([
          api.get(`/reports/${timeframe}-collection`),
          api.get('/reports/pending-fees'),
        ]);
        setDaily(collectionRes.data.payments || []);
        setPending(pendingRes.data.pendingFees || []);
      } catch (error) {
        console.error("Error fetching reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [timeframe]);

  const downloadCSV = () => {
    const headers = ['Date', 'Student Name', 'Admission No', 'Fee Category', 'Amount', 'Collected By'];
    const rows = daily.map(item => [
      new Date(item.paymentDate).toLocaleDateString(),
      item.student?.studentName || '',
      item.student?.admissionNumber || '',
      item.studentFee?.feeCategory?.name || '',
      item.amount?.toFixed(2) || '0.00',
      item.recordedBy?.username || 'System'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${timeframe}_collection_report.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center p-12">Loading reports...</div>;

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center text-gray-700 ">
              <Calendar className="h-5 w-5 mr-2 text-orange-600" /> Collections
            </CardTitle>
            <div className="flex gap-2">
              <select 
                className="border-gray-300 rounded-md text-sm p-1"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <Button size="sm" variant="outline" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!daily || daily.length === 0 ? <p className="text-gray-500">No recent collections.</p> : (
              <div className="space-y-4">
                {daily.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{new Date(item.paymentDate).toLocaleDateString()} - {item.student?.studentName}</span>
                      <span className="text-xs text-gray-500">Collected by: {item.recordedBy?.username || 'System'}</span>
                    </div>
                    <span className="font-bold text-emerald-600">Rs. {item.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
  );
};

export default Reports;
