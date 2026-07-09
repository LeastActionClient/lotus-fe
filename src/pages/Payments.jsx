import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { CreditCard, Plus, Download, Trash2, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import Select from 'react-select';
import { getStudentCategoryLabel } from '../utils/studentCategory';

const Payments = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [paymentData, setPaymentData] = useState({
    studentFeeId: '',
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      const [payRes, stuRes, catRes] = await Promise.all([
        api.get('/payments'),
        api.get('/students'),
        api.get('/fees/categories')
      ]);
      setPayments(payRes.data);
      setStudents(stuRes.data);
      setFeeCategories(catRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => (s._id || s.id) === selectedStudentId);
      if (student && student.studentFees) {
        const pendingFees = student.studentFees.filter((f) => f.remainingAmount > 0);
        setStudentFees(pendingFees);
        if (pendingFees.length === 1) {
          setPaymentData(prev => ({
            ...prev,
            studentFeeId: pendingFees[0]._id || pendingFees[0].id,
            amount: pendingFees[0].remainingAmount.toString()
          }));
        } else {
          setPaymentData(prev => ({...prev, studentFeeId: '', amount: ''}));
        }
      } else {
        setStudentFees([]);
        setPaymentData(prev => ({...prev, studentFeeId: '', amount: ''}));
      }
    } else {
      setStudentFees([]);
      setPaymentData(prev => ({...prev, studentFeeId: '', amount: ''}));
    }
  }, [selectedStudentId, students]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payments', {
        studentId: selectedStudentId,
        studentFeeId: paymentData.studentFeeId,
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        remarks: paymentData.remarks
      });
      setIsModalOpen(false);
      setSelectedStudentId('');
      setSelectedSection('');
      setPaymentData({
        studentFeeId: '',
        amount: '',
        paymentMethod: 'CASH',
        referenceNumber: '',
        remarks: ''
      });
      fetchData();
    } catch (error) {
      console.error("Error creating payment", error);
      alert(error.response?.data?.error || "Error recording payment");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const response = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading invoice", error);
      alert("Failed to download invoice");
    }
  };

  const uniqueClasses = [...new Set(students.map(s => s.currentClass).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.filter(s => !selectedClass || s.currentClass === selectedClass).map(s => s.section).filter(Boolean))].sort();
  const uniqueCategories = feeCategories.map(c => c.name).sort();

  const filteredPayments = filterCategory === 'All' 
    ? payments 
    : payments.filter(p => p.studentFee?.feeCategory?.name === filterCategory);
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, payments.length]);

  const studentOptions = students
    .filter(s => !selectedClass || s.currentClass === selectedClass)
    .filter(s => !selectedSection || s.section === selectedSection)
    .map(s => ({
      value: s._id || s.id,
      label: `${s.admissionNumber} - ${s.studentName} (Class: ${s.currentClass}, Sec: ${s.section || 'N/A'})`
    }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <DollarSign className="mr-3 text-emerald-600" size={32} />
            Payments & Invoices
          </h1>
          <p className="text-gray-500  mt-2">Record fee collections and generate receipts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={filterCategory === 'All' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilterCategory('All')}
          className={`rounded-full px-4 ${filterCategory === 'All' ? 'bg-orange-600 hover:bg-orange-700 text-white border-0' : 'bg-white'}`}
        >
          All
        </Button>
        {uniqueCategories.map(cat => (
          <Button 
            key={cat} 
            variant={filterCategory === cat ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterCategory(cat)}
            className={`rounded-full px-4 whitespace-nowrap ${filterCategory === cat ? 'bg-orange-600 hover:bg-orange-700 text-white border-0' : 'bg-white'}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Fee Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-32 text-gray-500">
                    No payment history found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment._id || payment.id}>
                    <TableCell className="font-mono text-sm">{payment.invoice?.invoiceNumber || 'N/A'}</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-gray-900 ">
                      {payment.student?.studentName}
                      <span className="block text-xs text-gray-500">{payment.student?.admissionNumber}</span>
                      <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        getStudentCategoryLabel(payment.student) === 'RCC'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getStudentCategoryLabel(payment.student)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.isFullPayment ? (
                        <span className="font-semibold text-emerald-600">Full Fees</span>
                      ) : (
                        payment.studentFee?.feeCategory?.name || 'N/A'
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">Rs. {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.recordedBy?.username}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {payment.invoice && (
                        <Button variant="outline" size="sm" onClick={() => downloadInvoice(payment._id || payment.id, payment.invoice.invoiceNumber)}>
                          <Download className="h-4 w-4 mr-2" /> PDF
                        </Button>
                      )}
                      {currentUser.role === 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                          if(window.confirm('Are you sure you want to delete this payment?')) {
                            try {
                              await api.delete(`/payments/${payment._id || payment.id}`);
                              fetchData();
                            } catch(e) { alert('Error deleting payment'); }
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Payment">
        <form onSubmit={handlePayment} className="space-y-4 pt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classFilter">Filter by Class (Optional)</Label>
              <select 
                id="classFilter" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                  setSelectedStudentId('');
                }}
              >
                <option value="">-- All Classes --</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionFilter">Filter by Section (Optional)</Label>
              <select 
                id="sectionFilter" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedStudentId('');
                }}
              >
                <option value="">-- All Sections --</option>
                {uniqueSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentSelect">Search & Select Student</Label>
            <Select
              id="studentSelect"
              options={studentOptions}
              value={studentOptions.find(o => o.value === selectedStudentId) || null}
              onChange={(option) => setSelectedStudentId(option ? option.value : '')}
              placeholder="Type to search student name or admission number..."
              isClearable
              isSearchable={true}
              required
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '0.375rem',
                  borderColor: '#d1d5db'
                })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeSelect">Select Assigned Fee</Label>
            <select 
              id="feeSelect" 
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
              value={paymentData.studentFeeId}
              onChange={(e) => {
                const feeId = e.target.value;
                if (feeId === 'FULL') {
                  const total = studentFees.reduce((sum, f) => sum + f.remainingAmount, 0);
                  setPaymentData({
                    ...paymentData, 
                    studentFeeId: feeId,
                    amount: total.toString()
                  });
                } else {
                  const selectedFee = studentFees.find(f => (f._id || f.id) === feeId);
                  setPaymentData({
                    ...paymentData, 
                    studentFeeId: feeId,
                    amount: selectedFee ? selectedFee.remainingAmount.toString() : ''
                  });
                }
              }}
              required
              disabled={!selectedStudentId || studentFees.length === 0}
            >
              <option value="">-- Choose Fee (Unpaid) --</option>
              {studentFees.length > 1 && (
                <option value="FULL" className="font-bold text-emerald-600">
                  Full Fees - Rs. {studentFees.reduce((sum, f) => sum + f.remainingAmount, 0)}
                </option>
              )}
              {studentFees.map(f => (
                <option key={f._id || f.id} value={f._id || f.id}>
                  {f.feeCategory.name} - Rs. {f.remainingAmount}
                </option>
              ))}
            </select>
            {selectedStudentId && studentFees.length === 0 && (
              <p className="text-xs text-red-500">This student has no pending fee dues.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input 
                id="amount" 
                type="number" 
                min="0.01" step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select 
                id="paymentMethod" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input 
              id="referenceNumber" 
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({...paymentData, referenceNumber: e.target.value})}
              placeholder="e.g., Transaction ID"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !selectedStudentId || !paymentData.studentFeeId}>
              {loading ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
