import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Download, Trash2, DollarSign, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import Select from 'react-select';
import { getStudentCategoryLabel } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import { useLocation, useNavigate } from 'react-router-dom';

const Payments = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const navigate = useNavigate();
  const incomingStudentId = useRef(location.state?.studentId);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterTableClass, setFilterTableClass] = useState('All');
  const [filterTableSection, setFilterTableSection] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [paymentData, setPaymentData] = useState({
    studentFeeIds: [],
    amount: '0',
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
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const sid = incomingStudentId.current;
    if (!sid) return;
    const loadIncomingStudent = async () => {
      try {
        const res = await api.get(`/students/${sid}`);
        const student = res.data;
        setStudents(prev => {
          const idx = prev.findIndex(s => (s._id || s.id) === sid);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = student;
            return updated;
          }
          return [student, ...prev];
        });
        setSelectedStudentId(sid);
        setIsModalOpen(true);
        window.history.replaceState({}, document.title);
      } catch (err) {
        console.error('Failed to load student for payment', err);
      }
    };
    loadIncomingStudent();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      api.get(`/students/${selectedStudentId}`).then(res => {
        const student = res.data;
        if (student && student.studentFees) {
          const getFeeRemainingDisplay = (f) => {
            if (!f) return 0;
            if (f.remainingAmount > 0) return f.remainingAmount;
            if (f.paidAmount === 0) return f.totalAmount > 0 ? f.totalAmount : (f.feeCategory?.amount || 0);
            return 0;
          };
          const pendingFees = student.studentFees.filter((f) => f.remainingAmount > 0 || (f.paidAmount === 0 && (f.totalAmount > 0 || f.feeCategory?.amount > 0)));
          setStudentFees(pendingFees);
          if (pendingFees.length === 1) {
            const feeAmt = getFeeRemainingDisplay(pendingFees[0]);
            setPaymentData(prev => ({
              ...prev,
              studentFeeIds: [pendingFees[0]._id || pendingFees[0].id],
              amount: feeAmt.toString()
            }));
          } else {
            setPaymentData(prev => ({...prev, studentFeeIds: [], amount: '0'}));
          }
        } else {
          setStudentFees([]);
          setPaymentData(prev => ({...prev, studentFeeIds: [], amount: '0'}));
        }
      }).catch(err => {
        console.error("Error fetching fresh student fees for payment modal:", err);
      });
    } else {
      setStudentFees([]);
      setPaymentData(prev => ({...prev, studentFeeIds: [], amount: '0'}));
    }
  }, [selectedStudentId]);

  const selectedStudent = students.find(s => (s._id || s.id) === selectedStudentId);
  const isPreviousYearFee = (f, student) => {
    if (!student) return false;
    return (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || 
           (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass);
  };
  const hasPreviousYearPending = studentFees.some(f => isPreviousYearFee(f, selectedStudent) && f.remainingAmount > 0);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentData.studentFeeIds.length === 0) {
      alert("Please select at least one fee to pay.");
      return;
    }

    if (hasPreviousYearPending) {
      const selectedPreviousYearFees = paymentData.studentFeeIds.filter(id => {
        const fee = studentFees.find(f => (f._id || f.id) === id);
        return fee && isPreviousYearFee(fee, selectedStudent);
      });
      const totalPreviousYearPending = studentFees.filter(f => isPreviousYearFee(f, selectedStudent) && f.remainingAmount > 0).length;
      
      if (selectedPreviousYearFees.length < totalPreviousYearPending) {
        alert("STRICT RULE: Please select all previous year pending fees before proceeding with current year payments.");
        return;
      }
    }
    setLoading(true);
    try {
      await api.post('/payments', {
        studentId: selectedStudentId,
        studentFeeIds: paymentData.studentFeeIds,
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        remarks: paymentData.remarks
      });
      setIsModalOpen(false);
      setSelectedStudentId('');
      setSelectedSection('');
      setPaymentData({
        studentFeeIds: [],
        amount: '0',
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

  const openInvoicePreview = (payment) => {
    const paymentId = payment._id || payment.id;
    navigate(`/dashboard/payments/invoice/${paymentId}`, {
      state: { payment }
    });
  };

  const uniqueClasses = [...new Set(students.map(s => s.currentClass).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.filter(s => !selectedClass || s.currentClass === selectedClass).map(s => s.section).filter(Boolean))].sort();
  
  const uniqueTableClasses = [...new Set(payments.map(p => p.studentId?.currentClass).filter(Boolean))].sort();
  const uniqueTableSections = [...new Set(payments.filter(p => filterTableClass === 'All' || p.studentId?.currentClass === filterTableClass).map(p => p.studentId?.section).filter(Boolean))].sort();
  
  const uniqueCategories = [
    ...feeCategories.map(c => c.name)
  ].filter((value, index, arr) => arr.indexOf(value) === index).sort();

  const getPaymentCategoryDescriptors = (payment) => {
    if (payment.paymentType === 'APPLICATION') {
      return [{ id: 'app_fee', name: 'Application Fee', title: 'Application Fee' }];
    }

    const allocationDescriptors = (payment.feeAllocations || [])
      .map((alloc) => {
        const feeCategory = alloc.studentFeeId?.feeCategoryId;
        if (!feeCategory) return null;
        return {
          id: feeCategory._id || feeCategory.id || feeCategory.name,
          name: feeCategory.name,
          title: feeCategory.name
        };
      })
      .filter(Boolean);

    if (allocationDescriptors.length > 0) {
      return allocationDescriptors;
    }

    const singleCategory = payment.studentFee?.feeCategory;
    if (singleCategory) {
      return [{
        id: singleCategory._id || singleCategory.id || singleCategory.name,
        name: singleCategory.name,
        title: singleCategory.name
      }];
    }

    return [];
  };

  const matchesCategoryFilter = (payment) => {
    if (filterCategory === 'All') return true;
    return getPaymentCategoryDescriptors(payment).some((category) => category.name === filterCategory);
  };

  const filteredPayments = payments.filter(p => {
    const matchCategory = matchesCategoryFilter(p);
    const matchClass = filterTableClass === 'All' || p.studentId?.currentClass === filterTableClass;
    const matchSection = filterTableSection === 'All' || p.studentId?.section === filterTableSection;
    return matchCategory && matchClass && matchSection;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadCSV = () => {
    const headers = ["Invoice No", "Date", "Student Name", "Admission No", "Class", "Section", "Fee Category", "Amount", "Method", "Recorded By"];
    const rows = filteredPayments.map(p => {
      const feeCategory = getPaymentCategoryDescriptors(p).map((category) => category.title).join(', ') || 'N/A';
      return [
        p.invoice?.invoiceNumber || '-',
        new Date(p.paymentDate).toLocaleDateString(),
        p.paymentType === 'APPLICATION' ? (p.application?.studentName || '-') : (p.student?.studentName || '-'),
        p.paymentType === 'APPLICATION' ? `App: ${p.application?.applicationId || '-'}` : (p.student?.admissionNumber || '-'),
        p.paymentType === 'APPLICATION' ? (p.application?.applyingClass || '-') : (p.student?.currentClass || '-'),
        p.student?.section || '-',
        feeCategory,
        p.amount,
        p.paymentMethod,
        p.recordedBy?.username || '-'
      ];
    });
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterTableClass, filterTableSection, payments.length]);

  if (pageLoading) return <PageLoader />;

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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
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
        
        <div className="flex space-x-2 pb-2">
          <select 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white min-w-[120px]" 
            value={filterTableClass} 
            onChange={(e) => { setFilterTableClass(e.target.value); setFilterTableSection('All'); }}
          >
            <option value="All">All Classes</option>
            {uniqueTableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white min-w-[120px]" 
            value={filterTableSection} 
            onChange={(e) => setFilterTableSection(e.target.value)} 
            disabled={filterTableClass === 'All'}
          >
            <option value="All">All Sections</option>
            {uniqueTableSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
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
                      {payment.paymentType === 'APPLICATION' ? (
                        <>
                          {payment.application?.studentName || '-'}
                          <span className="block text-xs text-gray-500">Application: {payment.application?.applicationId || '-'}</span>
                          <span className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            Applicant
                          </span>
                        </>
                      ) : (
                        <>
                          {payment.student?.studentName || '-'}
                          <span className="block text-xs text-gray-500">{payment.student?.admissionNumber || '-'}</span>
                          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            getStudentCategoryLabel(payment.student) === 'RTE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getStudentCategoryLabel(payment.student) || '-'}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPaymentCategoryDescriptors(payment).length > 0 ? (
                          getPaymentCategoryDescriptors(payment).map((category) => (
                            <span key={category.id} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700" title={category.title}>
                              {category.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">Rs. {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.recordedBy?.username}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {payment.invoice && (
                        <Button variant="outline" size="sm" onClick={() => openInvoicePreview(payment)}>
                          <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                      )}
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
            <Label>Select Fees to Pay</Label>
            <div className="max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-md bg-white space-y-2">
            {studentFees.length === 0 && (
              <p className="text-xs text-red-500">This student has no pending fee dues.</p>
            )}
            {studentFees.map(f => {
              const feeId = f._id || f.id;
              const isPrev = isPreviousYearFee(f, selectedStudent);
              const isDisabled = hasPreviousYearPending && !isPrev && !paymentData.studentFeeIds.includes(feeId);
              
              const classLabel = f.className && f.academicYear
                ? `[${f.className} - ${f.academicYear}]`
                : f.className
                  ? `[${f.className}]`
                  : '';
              
              const isChecked = paymentData.studentFeeIds.includes(feeId);

              return (
                <div key={feeId} className={`flex items-center space-x-2 py-1 ${isDisabled ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    id={`fee-${feeId}`}
                    checked={isChecked}
                    disabled={isDisabled}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                    onChange={(e) => {
                      let newIds;
                      if (e.target.checked) {
                        newIds = [...paymentData.studentFeeIds, feeId];
                      } else {
                        newIds = paymentData.studentFeeIds.filter(id => id !== feeId);
                      }
                      
                      const getFeeRemainingDisplay = (f) => {
                        if (!f) return 0;
                        if (f.remainingAmount > 0) return f.remainingAmount;
                        if (f.paidAmount === 0) return f.totalAmount > 0 ? f.totalAmount : (f.feeCategory?.amount || 0);
                        return 0;
                      };

                      const newTotal = newIds.reduce((sum, id) => {
                        const fee = studentFees.find(sf => (sf._id || sf.id) === id);
                        return sum + getFeeRemainingDisplay(fee);
                      }, 0);

                      setPaymentData({
                        ...paymentData,
                        studentFeeIds: newIds,
                        amount: newTotal.toString()
                      });
                    }}
                  />
                  <Label htmlFor={`fee-${feeId}`} className={`text-sm cursor-pointer ${isChecked ? 'font-medium text-orange-700' : 'text-gray-700'}`}>
                    {classLabel} {f.feeCategory?.name || 'Fee'} - Rs. {f.remainingAmount > 0 ? f.remainingAmount : (f.totalAmount > 0 ? f.totalAmount : (f.feeCategory?.amount || 0))} {isDisabled && !isChecked ? '(Clear previous dues first)' : ''}
                  </Label>
                </div>
              );
            })}
          </div>
            {selectedStudentId && (() => {
              const student = students.find(s => (s._id || s.id) === selectedStudentId);
              const prevPending = student?.previousClassFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
              if (prevPending > 0) {
                return (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <p className="text-xs font-semibold text-purple-700">Previous Class Pending Fees</p>
                    <p className="text-sm font-bold text-purple-800">₹{prevPending.toFixed(2)}</p>
                    <p className="text-xs text-purple-600 mt-1">These fees are carried over from a previous academic year and are included in the list above.</p>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount (Rs.)</Label>
              <Input 
                id="amount" 
                type="text" 
                value={paymentData.amount}
                readOnly
                className="bg-gray-100 font-bold text-gray-900 cursor-not-allowed"
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
            <Button type="submit" disabled={loading || !selectedStudentId || paymentData.studentFeeIds.length === 0}>
              {loading ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
