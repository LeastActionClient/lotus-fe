import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Download, Trash2, IndianRupee, Printer, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import Select from 'react-select';
import { getStudentCategoryLabel } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import { useLocation, useNavigate } from 'react-router-dom';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useFeeCategoriesQuery, usePaymentsQuery, useQueryInvalidator, useStudentQuery, useStudentsQuery, useClassesQuery } from '../hooks/useSchoolQueries';

const Payments = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || Json.parse(sessionStorage.getItem('user')) );
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingStudentId = useRef(location.state?.studentId);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useStudentsQuery();
  const { data: feeCategoriesData, isLoading: feeCategoriesLoading } = useFeeCategoriesQuery();
  const { data: classesData, isLoading: classesLoading } = useClassesQuery();
  const { data: selectedStudentData } = useStudentQuery(selectedStudentId, Boolean(selectedStudentId));
  const { invalidatePayments, invalidateStudents, invalidateFeeCategories } = useQueryInvalidator();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
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
  const [payingAmounts, setPayingAmounts] = useState({});

  useEffect(() => {
    if (paymentsData) setPayments(paymentsData);
  }, [paymentsData]);

  useEffect(() => {
    if (studentsData) setStudents(studentsData);
  }, [studentsData]);

  useEffect(() => {
    if (feeCategoriesData) setFeeCategories(feeCategoriesData);
  }, [feeCategoriesData]);

  useEffect(() => {
    if (classesData) setClasses(classesData);
  }, [classesData]);

  useEffect(() => {
    const sid = incomingStudentId.current;
    if (!sid) return;
    setSelectedStudentId(sid);
    setIsModalOpen(true);
    window.history.replaceState({}, document.title);
  }, []);

  const parseTermInfo = (categoryName) => {
    const name = String(categoryName || '').trim();
    const match = name.match(/term\s*(\d+)/i) || name.match(/\bt(\d+)\b/i) || name.match(/(\d+)(?:st|nd|rd|th)?\s*term/i);
    if (!match) {
      return { isTerm: false, baseCategory: name, termNumber: 0 };
    }
    const termNumber = parseInt(match[1], 10);
    let baseCategory = name.replace(match[0], '').replace(/[-_()\s]+/g, ' ').trim();
    if (!baseCategory) {
      baseCategory = 'General Term';
    }
    return { isTerm: true, baseCategory: baseCategory.toLowerCase(), termNumber };
  };

  const getTermLockInfo = (fee, allFees, selectedIds, amountsMap) => {
    if (!fee) return { isLocked: false, message: '' };
    const catName = fee.feeCategory?.name || fee.feeCategoryId?.name || '';
    const termInfo = parseTermInfo(catName);
    if (!termInfo.isTerm) {
      return { isLocked: false, message: '' };
    }

    const previousTermFees = (allFees || []).filter(otherFee => {
      if ((otherFee._id || otherFee.id) === (fee._id || fee.id)) return false;
      const otherCatName = otherFee.feeCategory?.name || otherFee.feeCategoryId?.name || '';
      const otherTermInfo = parseTermInfo(otherCatName);
      return otherTermInfo.isTerm &&
             otherTermInfo.baseCategory === termInfo.baseCategory &&
             otherTermInfo.termNumber < termInfo.termNumber;
    });

    for (const prevFee of previousTermFees) {
      const prevFeeId = prevFee._id || prevFee.id;
      const dynamicRemaining = typeof prevFee.remainingAmount === 'number'
        ? prevFee.remainingAmount
        : Math.max(0, (prevFee.totalAmount || 0) - (prevFee.concessionStatus === 'Active' ? (prevFee.lessAmount || 0) : 0) - (prevFee.paidAmount || 0));

      const isCheckedInModal = selectedIds.includes(prevFeeId);
      const payingVal = parseFloat(amountsMap[prevFeeId]) || 0;

      const isFullyPaid = dynamicRemaining === 0 || (isCheckedInModal && payingVal >= dynamicRemaining && dynamicRemaining > 0);

      if (!isFullyPaid) {
        return {
          isLocked: true,
          message: 'Please complete payment for the previous term before paying this term.'
        };
      }
    }

    return { isLocked: false, message: '' };
  };

  const filterUnlockedIds = (candidateIds, currentAmounts) => {
    return candidateIds.filter(id => {
      const fee = studentFees.find(sf => (sf._id || sf.id) === id);
      const info = getTermLockInfo(fee, studentFees, candidateIds, currentAmounts);
      return !info.isLocked;
    });
  };

  useEffect(() => {
    if (selectedStudentId && selectedStudentData) {
      const student = selectedStudentData;
      if (student.studentFees) {
        const pendingFees = student.studentFees.filter((f) => {
          const isFullyPaid = (f.paidAmount || 0) > 0 && (f.remainingAmount === 0);
          return !isFullyPaid;
        }).map((f) => ({
          ...f,
          lessAmount: f.lessAmount || 0,
          concessionStatus: f.concessionStatus || 'None'
        }));

        setStudentFees(pendingFees);

        const initialAmounts = {};
        pendingFees.forEach(f => {
          const dynamicRemaining = f.remainingAmount !== undefined ? f.remainingAmount : Math.max(0, (f.totalAmount || 0) - (f.concessionStatus === 'Active' ? (f.lessAmount || 0) : 0) - (f.paidAmount || 0));
          initialAmounts[f._id || f.id] = dynamicRemaining.toString();
        });
        setPayingAmounts(initialAmounts);

        const allPendingIds = pendingFees.map(f => f._id || f.id);
        const unlockedInitialIds = allPendingIds.filter(id => {
          const fee = pendingFees.find(sf => (sf._id || sf.id) === id);
          return !getTermLockInfo(fee, pendingFees, allPendingIds, initialAmounts).isLocked;
        });

        const totalAmt = unlockedInitialIds.reduce((sum, id) => {
          const val = initialAmounts[id] ?? '0';
          return sum + (parseFloat(val) || 0);
        }, 0);

        setPaymentData(prev => ({
          ...prev,
          studentFeeIds: unlockedInitialIds,
          amount: totalAmt.toString()
        }));
      } else {
        setStudentFees([]);
        setPayingAmounts({});
        setPaymentData(prev => ({...prev, studentFeeIds: [], amount: '0'}));
      }
    } else {
      setStudentFees([]);
      setPayingAmounts({});
      setPaymentData(prev => ({...prev, studentFeeIds: [], amount: '0'}));
    }
  }, [selectedStudentId, selectedStudentData]);

  const getDynamicRemaining = (f) => {
    if (!f) return 0;
    if (typeof f.remainingAmount === 'number') return f.remainingAmount;
    const less = f.concessionStatus === 'Active' ? (f.lessAmount || 0) : 0;
    return Math.max(0, (f.totalAmount || 0) - less - (f.paidAmount || 0));
  };

  const isFormInvalid = paymentData.studentFeeIds.some(id => {
    const fee = studentFees.find(sf => (sf._id || sf.id) === id);
    const lockInfo = getTermLockInfo(fee, studentFees, paymentData.studentFeeIds, payingAmounts);
    if (lockInfo.isLocked) return true;

    const dynamicRemaining = getDynamicRemaining(fee);
    const val = payingAmounts[id] ?? '';
    const num = parseFloat(val);
    
    if (dynamicRemaining === 0) {
      return val !== '0' && val !== '';
    }
    
    return val === '' || isNaN(num) || num <= 0 || num > dynamicRemaining;
  });

  const getFeeRemainingDisplay = (f) => (f ? getDynamicRemaining(f) : 0);

  const selectedStudent = selectedStudentData || students.find(s => (s._id || s.id) === selectedStudentId);
  const isPreviousYearFee = (f, student) => {
    if (!student) return false;
    return (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || 
           (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass);
  };
  const hasPreviousYearPending = studentFees.some(f => isPreviousYearFee(f, selectedStudent) && f.remainingAmount > 0);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentData.studentFeeIds.length === 0) {
      toastWarning("Please select at least one fee to pay.");
      return;
    }

    for (const id of paymentData.studentFeeIds) {
      const fee = studentFees.find(sf => (sf._id || sf.id) === id);
      const lockInfo = getTermLockInfo(fee, studentFees, paymentData.studentFeeIds, payingAmounts);
      if (lockInfo.isLocked) {
        toastWarning("Please complete payment for the previous term before paying this term.");
        return;
      }
    }

    if (hasPreviousYearPending) {
      const selectedPreviousYearFees = paymentData.studentFeeIds.filter(id => {
        const fee = studentFees.find(f => (f._id || f.id) === id);
        return fee && isPreviousYearFee(fee, selectedStudent);
      });
      const totalPreviousYearPending = studentFees.filter(f => isPreviousYearFee(f, selectedStudent) && f.remainingAmount > 0).length;
      
      if (selectedPreviousYearFees.length < totalPreviousYearPending) {
        toastWarning("STRICT RULE: Please select all previous year pending fees before proceeding with current year payments.");
        return;
      }
    }
    setLoading(true);
    try {
      const feeAllocations = paymentData.studentFeeIds.map(id => ({
        studentFeeId: id,
        amount: parseFloat(payingAmounts[id] || 0)
      }));

      await api.post('/payments', {
        studentId: selectedStudentId,
        studentFeeIds: paymentData.studentFeeIds,
        amount: Number(paymentData.amount),
        feeAllocations,
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
      setPayingAmounts({});
      invalidatePayments();
      invalidateStudents();
      toastSuccess('Payment recorded successfully.');
    } catch (error) {
      console.error("Error creating payment", error);
      toastError(error.response?.data?.error || "Error recording payment");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    setDownloadingInvoiceId(paymentId);
    try {
      const response = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeInvoiceNumber = String(invoiceNumber || paymentId || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');
      const safePaymentId = String(paymentId || Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');
      link.setAttribute('download', `invoice_${safeInvoiceNumber}_${safePaymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice", error);
      toastError("Failed to download invoice");
    } finally {
      setDownloadingInvoiceId((currentId) => (currentId === paymentId ? null : currentId));
    }
  };

  const openInvoicePreview = (payment) => {
    const paymentId = payment._id || payment.id;
    navigate(`/dashboard/payments/invoice/${paymentId}`, {
      state: { payment }
    });
  };

  const normalizeClassName = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const classSortFn = (a, b) => {
    const preSchoolOrder = { 'prekg': 1, 'lkg': 2, 'ukg': 3 };
    const aNorm = normalizeClassName(a);
    const bNorm = normalizeClassName(b);
    const isPreA = preSchoolOrder[aNorm];
    const isPreB = preSchoolOrder[bNorm];
    if (isPreA && isPreB) return isPreA - isPreB;
    if (isPreA) return -1;
    if (isPreB) return 1;
    const numA = /^(\d+)$/.test(aNorm) ? parseInt(aNorm, 10) : NaN;
    const numB = /^(\d+)$/.test(bNorm) ? parseInt(bNorm, 10) : NaN;
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);
    if (isNumA && isNumB) return numA - numB;
    if (isNumA) return 1;
    if (isNumB) return -1;
    return aNorm.localeCompare(bNorm);
  };

  const uniqueClasses = classes.map(c => c.name).sort(classSortFn);
  const selectedClassObj = classes.find(c => c.name === selectedClass);
  const uniqueSections = selectedClassObj 
    ? (selectedClassObj.sections || []).map(s => s.name).sort() 
    : [];
  
  const uniqueTableClasses = classes.map(c => c.name).sort(classSortFn);
  const selectedTableClassObj = classes.find(c => c.name === filterTableClass);
  const uniqueTableSections = selectedTableClassObj 
    ? (selectedTableClassObj.sections || []).map(s => s.name).sort() 
    : [];
  
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

  const getCategoryDotColorClass = (name) => {
    const norm = name.toLowerCase();
    if (norm.includes('term')) {
      return 'text-blue-500';
    }
    if (norm.includes('uniform') || norm.includes('shoe') || norm.includes('book') || norm.includes('note') || norm.includes('verification')) {
      return 'text-amber-500';
    }
    if (norm.includes('activity') || norm.includes('activities')) {
      return 'text-purple-500';
    }
    if (norm.includes('base') || norm.includes('admission') || norm.includes('application')) {
      return 'text-emerald-500';
    }
    return 'text-slate-400';
  };

  const getPaymentCategoryDetails = (payment) => {
    let rawDetails = [];

    if (payment.paymentType === 'APPLICATION') {
      rawDetails = [{ name: 'Application Fee', amount: payment.amount }];
    } else {
      const allocations = payment.feeAllocations || [];
      if (allocations.length > 0) {
        rawDetails = allocations
          .map((alloc) => {
            const feeCategory = alloc.studentFeeId?.feeCategoryId;
            if (!feeCategory) return null;
            return {
              name: feeCategory.name,
              amount: alloc.amount || 0
            };
          })
          .filter(Boolean);
      } else {
        const singleCategory = payment.studentFee?.feeCategory || payment.studentFeeId?.feeCategoryId;
        if (singleCategory) {
          rawDetails = [{
            name: singleCategory.name,
            amount: payment.amount
          }];
        }
      }
    }

    const grouped = {};
    rawDetails.forEach(item => {
      if (!grouped[item.name]) {
        grouped[item.name] = 0;
      }
      grouped[item.name] += item.amount;
    });

    return Object.keys(grouped).map(name => ({
      name,
      amount: grouped[name]
    }));
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

  const pageLoading = paymentsLoading || studentsLoading || feeCategoriesLoading;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <IndianRupee className="mr-3 text-emerald-600" size={32} />
            Payments & Invoices
          </h1>
          <p className="text-gray-500  mt-2">Record fee collections and generate receipts</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
                <TableHead className="w-[220px] min-w-[220px]">Fee Category</TableHead>
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
                    <TableCell className="align-top py-3">
                      <div className="flex flex-col gap-1.5 w-full min-w-[200px]">
                        {getPaymentCategoryDetails(payment).length > 0 ? (
                          getPaymentCategoryDetails(payment).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-medium text-gray-800 py-0.5">
                              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                <span className={`text-[10px] select-none leading-none ${getCategoryDotColorClass(item.name)}`}>●</span>
                                <span className="truncate" title={item.name}>{item.name}</span>
                              </div>
                              <span className="font-semibold text-gray-950 whitespace-nowrap">₹{item.amount.toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">Rs. {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.recordedBy?.username}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {(payment.invoice || payment.paymentType === 'APPLICATION') && (
                        <Button variant="outline" size="sm" onClick={() => openInvoicePreview(payment)}>
                          <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                      )}
                      {(payment.invoice || payment.paymentType === 'APPLICATION') && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={downloadingInvoiceId === (payment._id || payment.id)}
                          loadingText="PDF"
                          onClick={() => downloadInvoice(payment._id || payment.id, payment.invoice?.invoiceNumber || `invoice_${payment.application?.applicationId || payment._id}`)}
                        >
                          <Download className="h-4 w-4 mr-2" /> PDF
                        </Button>
                      )}
                      {currentUser.role === 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" loading={deletingPaymentId === (payment._id || payment.id)} loadingText="Deleting..." onClick={async () => {
                          const accepted = await confirm({
                            title: 'Delete Payment',
                            description: 'Are you sure you want to delete this payment?',
                            confirmText: 'Delete',
                            tone: 'danger'
                          });

                          if (!accepted) {
                            return;
                          }

                          setDeletingPaymentId(payment._id || payment.id);
                          try {
                            await api.delete(`/payments/${payment._id || payment.id}`);
                            invalidatePayments();
                            invalidateStudents();
                            toastSuccess('Payment deleted successfully.');
                          } catch(e) { toastError('Error deleting payment'); }
                          finally {
                            setDeletingPaymentId((currentId) => (currentId === (payment._id || payment.id) ? null : currentId));
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classFilter">Filter by Class</Label>
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
              <Label htmlFor="sectionFilter">Filter by Section</Label>
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
            <div className="max-h-96 overflow-y-auto p-2 border border-gray-300 rounded-md bg-white space-y-3">
            {studentFees.length === 0 && (
              <p className="text-xs text-red-500">This student has no pending fee dues.</p>
            )}
            {studentFees.map(f => {
              const feeId = f._id || f.id;
              const isPrev = isPreviousYearFee(f, selectedStudent);
              const lockInfo = getTermLockInfo(f, studentFees, paymentData.studentFeeIds, payingAmounts);
              const isLocked = lockInfo.isLocked;
              const isDisabled = (hasPreviousYearPending && !isPrev && !paymentData.studentFeeIds.includes(feeId)) || isLocked;
              
              const classLabel = f.className && f.academicYear
                ? `[${f.className} - ${f.academicYear}]`
                : f.className
                  ? `[${f.className}]`
                  : '';
              
              const isChecked = paymentData.studentFeeIds.includes(feeId) && !isLocked;
              const dynamicRemaining = getDynamicRemaining(f);
              const payingVal = payingAmounts[feeId] ?? '';
              const payingNum = parseFloat(payingVal) || 0;
              const remainingAfter = Math.max(0, dynamicRemaining - payingNum);

              return (
                <div key={feeId} className={`p-3 border rounded-lg space-y-3 transition-all ${
                  isLocked 
                    ? 'bg-gray-100/80 border-gray-200 opacity-60' 
                    : isChecked 
                      ? 'border-orange-200 bg-orange-50/10' 
                      : 'border-gray-200'
                } ${isDisabled && !isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex items-start space-x-2.5">
                    <input
                      type="checkbox"
                      id={`fee-${feeId}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer disabled:cursor-not-allowed"
                      onChange={(e) => {
                        let candidateIds;
                        if (e.target.checked) {
                          candidateIds = [...paymentData.studentFeeIds, feeId];
                        } else {
                          candidateIds = paymentData.studentFeeIds.filter(id => id !== feeId);
                        }
                        
                        const validIds = filterUnlockedIds(candidateIds, payingAmounts);
                        const newTotal = validIds.reduce((sum, id) => {
                          const val = payingAmounts[id] ?? '0';
                          return sum + (parseFloat(val) || 0);
                        }, 0);

                        setPaymentData(prev => ({
                          ...prev,
                          studentFeeIds: validIds,
                          amount: newTotal.toString()
                        }));
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label htmlFor={`fee-${feeId}`} className={`text-sm font-bold select-none ${isDisabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'} ${isChecked ? 'text-orange-950' : 'text-gray-800'}`}>
                          {classLabel} {f.feeCategory?.name || 'Fee'}
                        </Label>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300" title="Complete the previous term payment first.">
                            <Lock className="h-3 w-3 text-amber-700" /> Complete the previous term payment first.
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 font-medium pt-0.5">
                        <div>Original: <span className="font-bold text-gray-700">₹{f.totalAmount}</span></div>
                        {f.concessionStatus === 'Active' && f.lessAmount > 0 && (
                          <>
                            <div>Less: <span className="font-bold text-red-600">₹{f.lessAmount}</span></div>
                            <div>Net Payable: <span className="font-bold text-emerald-700">₹{f.totalAmount - f.lessAmount}</span></div>
                          </>
                        )}
                        <div>Already Paid: <span className="font-bold text-blue-600">₹{f.paidAmount || 0}</span></div>
                        <div>Remaining: <span className="font-bold text-orange-600">₹{dynamicRemaining}</span></div>
                      </div>
                    </div>
                  </div>

                  {isChecked && !isLocked && (
                    <div className="pl-6 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-3 rounded-lg border border-orange-100 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="space-y-1.5">
                        <Label htmlFor={`paying-${feeId}`} className="text-xs font-bold text-gray-700">Amount Paying Now (Rs.)</Label>
                        <Input
                          id={`paying-${feeId}`}
                          type="text"
                          value={payingVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && !/^\d+$/.test(val)) return;

                            const newAmounts = {
                              ...payingAmounts,
                              [feeId]: val
                            };
                            setPayingAmounts(newAmounts);

                            const validIds = filterUnlockedIds(paymentData.studentFeeIds, newAmounts);
                            const newTotal = validIds.reduce((sum, id) => {
                              const currVal = newAmounts[id] ?? '0';
                              return sum + (parseFloat(currVal) || 0);
                            }, 0);

                            setPaymentData(prev => ({
                              ...prev,
                              studentFeeIds: validIds,
                              amount: newTotal.toString()
                            }));
                          }}
                          className={`h-9 font-bold text-sm ${parseFloat(payingVal) > dynamicRemaining ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {parseFloat(payingVal) > dynamicRemaining && (
                          <p className="text-[10px] text-red-500 font-semibold leading-tight mt-0.5">
                            Entered amount cannot exceed the remaining payable amount of ₹{dynamicRemaining}.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col justify-end text-right pr-2">
                        <div className="text-xs text-gray-500 font-medium">Remaining After Payment:</div>
                        <div className={`text-base font-black ${remainingAfter === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          ₹{remainingAfter}
                        </div>
                      </div>
                    </div>
                  )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button type="submit" loading={loading} loadingText="Processing..." disabled={!selectedStudentId || paymentData.studentFeeIds.length === 0 || isFormInvalid}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
