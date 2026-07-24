import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Percent, Trash2, Download, AlertCircle, RefreshCw, Layers, Sparkles, UserCheck, ChevronDown } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';

const Concessions = () => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const confirm = useConfirm();

  // Main Page Concession History Table State
  const [concessionsHistory, setConcessionsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 10;

  // Master Data
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Modal Controls
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Modal Flow States
  const [modalClass, setModalClass] = useState('');
  const [modalSection, setModalSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalFeeCategory, setModalFeeCategory] = useState('');
  const [isFeeCatDropdownOpen, setIsFeeCatDropdownOpen] = useState(false);

  // Modal Client-side search to filter Student dropdown
  const [searchName, setSearchName] = useState('');

  // Modal Form Inputs
  const [modalLessAmount, setModalLessAmount] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Selected Student Fees fetched dynamically on selection
  const [selectedStudentFees, setSelectedStudentFees] = useState([]);
  const [studentFeesLoading, setStudentFeesLoading] = useState(false);

  // Concessions Assigned in Current Modal Session
  const [sessionAssignedConcessions, setSessionAssignedConcessions] = useState([]);

  // Fetch Concessions History for Main Table
  const fetchConcessionsHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/concessions/student-fees');
      const assignedOnly = res.data.filter(item => ['Active', 'Inactive', 'Completed', 'Expired', 'Cancelled'].includes(item.status));
      const seen = new Set();
      const deduped = assignedOnly.filter(item => {
        const id = item._id || item.concessionId;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setConcessionsHistory(deduped);
    } catch (err) {
      console.error('Error fetching concessions list:', err);
      toastError('Failed to fetch concessions history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Master Data
  const fetchMasterData = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        api.get('/classes'),
        api.get('/students')
      ]);
      setClasses(classRes.data);
      setAllStudents(studentRes.data);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchConcessionsHistory();
  }, []);

  // Fetch selected student's fees dynamically from the server
  useEffect(() => {
    const fetchSelectedStudentFees = async () => {
      if (!selectedStudentId) {
        setSelectedStudentFees([]);
        return;
      }
      setStudentFeesLoading(true);
      try {
        const res = await api.get(`/concessions/net-fee/${selectedStudentId}`);
        setSelectedStudentFees(res.data.fees || []);
      } catch (err) {
        console.error('Error fetching student fees:', err);
        setSelectedStudentFees([]);
      } finally {
        setStudentFeesLoading(false);
      }
    };
    fetchSelectedStudentFees();
  }, [selectedStudentId]);

  // Sections dependent on selected class
  const classObj = classes.find(c => c.name === modalClass);
  const sections = classObj ? (classObj.sections || []) : [];

  const normalizeText = (value) => `${value ?? ''}`.trim().toLowerCase();
  const isActiveStudent = (student) => {
    const status = normalizeText(student.studentStatus);
    return !status || status === 'active';
  };

  // Filter students belonging to the selected Class and Section
  const modalStudents = allStudents.filter(s =>
    normalizeText(s.currentClass) === normalizeText(modalClass) &&
    normalizeText(s.section) === normalizeText(modalSection) &&
    isActiveStudent(s)
  );

  // Filter student dropdown options dynamically based on search input
  const filteredStudentDropdownOptions = modalStudents.filter(s => {
    const q = normalizeText(searchName);
    if (!q) return true;
    return (
      normalizeText(s.studentName).includes(q) ||
      normalizeText(s.admissionNumber).includes(q)
    );
  });

  // Selected Student Object
  const selectedStudent = modalStudents.find(s => s._id === selectedStudentId);

  // Map fee category options from fetched student fees list
  const feeCategoryOptions = selectedStudentFees.map(fee => ({
    id: fee.feeCategoryId,
    name: fee.feeCategoryName,
    totalAmount: fee.originalAmount,
    pricingLabel: fee.pricingLabel
  }));

  // Selected Fee Option
  const selectedFeeOpt = feeCategoryOptions.find(opt => opt.id === modalFeeCategory);
  const originalAmount = selectedFeeOpt ? selectedFeeOpt.totalAmount : 0;

  // Live Summary calculation
  const lessAmt = parseFloat(modalLessAmount) || 0;
  const netPayable = Math.max(0, originalAmount - lessAmt);

  // Submit Concession Assignment
  const handleAssignConcession = async (e) => {
    if (e) e.preventDefault();

    if (!selectedStudentId) {
      toastError('Please select a student.');
      return;
    }
    if (!modalFeeCategory) {
      toastError('Please select a fee category.');
      return;
    }

    const lessAmountNum = parseFloat(modalLessAmount);
    if (isNaN(lessAmountNum) || lessAmountNum <= 0) {
      toastError('Less Amount must be greater than 0.');
      return;
    }

    if (lessAmountNum > originalAmount) {
      toastError(`Concession amount (₹${lessAmountNum}) cannot exceed the Original Fee (₹${originalAmount}).`);
      return;
    }

    if (!modalReason.trim()) {
      toastError('Concession Reason is required.');
      return;
    }

    setAssignLoading(true);
    try {
      const payload = {
        studentIds: [selectedStudentId],
        feeCategoryId: modalFeeCategory,
        academicYear: selectedStudent?.currentEnrollment?.academicYear || selectedStudent?.academicYear || '',
        academicYearId: selectedStudent?.currentEnrollment?.academicYearId || '',
        lessAmount: lessAmountNum,
        reason: modalReason,
        remarks: modalRemarks
      };

      const res = await api.post('/concessions', payload);
      toastSuccess(res.data.message || 'Concession assigned successfully');

      // Append assigned concessions to session list
      const timestamp = new Date().toISOString();
      const newAssignment = {
        admissionNumber: selectedStudent.admissionNumber,
        studentName: selectedStudent.studentName,
        academicYear: selectedStudent?.currentEnrollment?.academicYear || selectedStudent?.academicYear || '',
        feeCategory: selectedFeeOpt.name,
        originalAmount: originalAmount,
        lessAmount: lessAmountNum,
        netPayable: netPayable,
        reason: modalReason,
        remarks: modalRemarks,
        assignedDate: timestamp,
        assignedBy: currentUser.username || 'Super Admin',
        status: 'Active'
      };

      setSessionAssignedConcessions(prev => [newAssignment, ...prev]);

      // Close modal and reset fields
      setIsAssignModalOpen(false);
      handleResetModal();

      // Refresh data
      await fetchMasterData();
      fetchConcessionsHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  // Reset Modal Fields
  const handleResetModal = () => {
    setModalClass('');
    setModalSection('');
    setSelectedStudentId('');
    setModalFeeCategory('');
    setIsFeeCatDropdownOpen(false);
    setSearchName('');
    setModalLessAmount('');
    setModalReason('');
    setModalRemarks('');
  };

  // Handle Cancel Concession
  const handleDeleteConcession = async (item) => {
    const concessionId = item.concessionId || item._id;
    if (!concessionId) return;

    const confirmed = await confirm({
      title: 'Cancel Fee Concession',
      message: `Are you sure you want to cancel the fee concession of ₹${item.lessAmount} for ${item.studentName || item.studentId?.studentName}?`
    });

    if (!confirmed) return;

    setActionLoadingId(concessionId);
    try {
      const res = await api.delete(`/concessions/${concessionId}`);
      toastSuccess(res.data.message || 'Concession cancelled successfully.');
      await fetchMasterData();
      fetchConcessionsHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle Concession Status
  const handleToggleStatus = async (item) => {
    const concessionId = item.concessionId || item._id;
    if (!concessionId) return;

    const isCurrentlyActive = item.status === 'Active';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    const confirmed = await confirm({
      title: isCurrentlyActive ? 'Deactivate Fee Concession' : 'Activate Fee Concession',
      message: isCurrentlyActive
        ? 'This will stop applying the concession to future fee calculations. The concession history will remain. Do you want to proceed?'
        : 'This will reapply the concession to future fee calculations. Do you want to proceed?'
    });

    if (!confirmed) return;

    setActionLoadingId(concessionId);
    try {
      const res = await api.patch(`/concessions/${concessionId}/status`, { status: newStatus });
      toastSuccess(res.data.message || 'Concession status updated successfully.');
      await fetchMasterData();
      fetchConcessionsHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export Data to CSV
  const handleExport = () => {
    if (concessionsHistory.length === 0) {
      toastError('No concessions data to export.');
      return;
    }

    const headers = [
      'Admission Number',
      'Student Name',
      'Academic Year',
      'Class',
      'Section',
      'Fee Category',
      'Original Amount',
      'Less Amount',
      'Net Amount',
      'Reason',
      'Remarks',
      'Assigned By',
      'Assigned Date',
      'Status'
    ];

    const rows = concessionsHistory.map(item => {
      const admissionNumber = item.admissionNumber || item.studentId?.admissionNumber || 'N/A';
      const studentName = item.studentName || item.studentId?.studentName || 'N/A';
      const academicYear = item.academicYear || item.studentId?.academicYear || 'N/A';
      const className = item.className || 'N/A';
      const section = item.section || 'N/A';
      const feeCategoryName = item.feeCategory || item.feeCategoryId?.name || 'N/A';
      const original = item.originalAmount || 0;
      const less = item.lessAmount || 0;
      const net = ['Active', 'Completed', 'Expired'].includes(item.status) ? (original - less) : original;
      const reason = item.reason || 'N/A';
      const remarks = item.remarks || 'N/A';
      const assignedBy = item.assignedBy || item.createdBy?.username || 'N/A';
      const assignedDate = item.assignedDate || item.createdAt;

      return [
        admissionNumber,
        studentName,
        academicYear,
        className,
        section,
        feeCategoryName,
        original,
        less,
        net,
        reason,
        remarks,
        assignedBy,
        assignedDate ? new Date(assignedDate).toLocaleDateString() : 'N/A',
        item.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assigned_fee_concessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Assign Modal
  const handleOpenAssignModal = () => {
    handleResetModal();
    setSessionAssignedConcessions([]);
    setIsAssignModalOpen(true);
  };

  // Pagination for main table
  const totalHistoryItems = concessionsHistory.length;
  const totalHistoryPages = Math.ceil(totalHistoryItems / historyItemsPerPage);
  const indexOfLastHistoryItem = historyPage * historyItemsPerPage;
  const indexOfFirstHistoryItem = indexOfLastHistoryItem - historyItemsPerPage;
  const currentHistoryItems = concessionsHistory.slice(indexOfFirstHistoryItem, indexOfLastHistoryItem);

  return (
    <div className="space-y-6">
      {/* Premium Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-250/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Percent className="text-orange-600 animate-pulse bg-orange-50 p-1.5 rounded-lg border border-orange-100" size={32} />
            Student Fee Concession Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Super Admin dashboard to assign, view, and audit fee concessions. Original fees are preserved.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Button
              onClick={handleOpenAssignModal}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm transition-all rounded-xl px-5 py-2.5"
              loading={assignLoading}
              loadingText="Opening..."
            >
              Assign Less Amount
            </Button>
          )}
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 font-semibold hover:bg-gray-50 transition-colors rounded-xl px-5 py-2.5"
          >
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Main Table: Assigned Concessions List */}
      <Card className="shadow-sm border border-gray-200 rounded-2xl overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-gray-800">Assigned Concessions List</h2>
          <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
            Total Records: {totalHistoryItems}
          </span>
        </div>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="py-20 flex justify-center items-center">
              <PageLoader />
            </div>
          ) : concessionsHistory.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <AlertCircle className="mx-auto text-gray-400 mb-3" size={42} />
              <p className="text-base font-bold text-gray-850">No concessions currently assigned.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Assign Less Amount" to create a new student fee concession.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="py-4">Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Fee Category</TableHead>
                    <TableHead>Original Fee</TableHead>
                    <TableHead>Less Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Status</TableHead>
                    {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentHistoryItems.map((item) => {
                    const admissionNo = item.admissionNumber || item.studentId?.admissionNumber || 'N/A';
                    const name = item.studentName || item.studentId?.studentName || 'N/A';
                    const academicYear = item.academicYear || item.studentId?.academicYear || 'N/A';
                    const className = item.className || 'N/A';
                    const section = item.section || 'N/A';
                    const feeCategoryName = item.feeCategory || item.feeCategoryId?.name || 'N/A';
                    const original = item.originalAmount || 0;
                    const less = item.lessAmount || 0;
                    const net = ['Active', 'Completed', 'Expired'].includes(item.status) ? (original - less) : original;
                    const reason = item.reason || 'N/A';
                    const assignedDate = item.assignedDate || item.createdAt;
                    const assignedBy = item.assignedBy || item.createdBy?.username || 'N/A';

                    return (
                      <TableRow key={item._id || item.concessionId} className="border-b border-gray-100 hover:bg-orange-50/10 transition-colors">
                        <TableCell className="font-bold text-gray-800 py-3.5">{admissionNo}</TableCell>
                        <TableCell className="font-semibold text-gray-900">{name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{academicYear}</TableCell>
                        <TableCell>{className}</TableCell>
                        <TableCell>{section}</TableCell>
                        <TableCell className="font-medium text-gray-600">{feeCategoryName}</TableCell>
                        <TableCell className="font-semibold text-gray-855">₹{original.toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-orange-600">-₹{less.toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{net.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-650 font-medium">{reason}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {assignedDate ? new Date(assignedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-655 font-medium">{assignedBy}</TableCell>
                        <TableCell>
                          {item.status === 'Cancelled' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              Cancelled
                            </span>
                          ) : ['Completed', 'Expired'].includes(item.status) ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              item.status === 'Completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                disabled={!isSuperAdmin}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-70 disabled:cursor-wait ${
                                  item.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                                } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={`Toggle to ${item.status === 'Active' ? 'Inactive' : 'Active'}`}
                              >
                                {actionLoadingId === (item.concessionId || item._id) ? (
                                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  </span>
                                ) : (
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      item.status === 'Active' ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                )}
                              </button>
                              <span className={`text-xs font-bold ${item.status === 'Active' ? 'text-green-700' : 'text-gray-500'}`}>
                                {item.status}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            {item.status === 'Active' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteConcession(item)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                title="Cancel Concession"
                                loading={actionLoadingId === (item.concessionId || item._id)}
                                loadingText="Deleting..."
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Page Pagination */}
      {!historyLoading && totalHistoryItems > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{indexOfFirstHistoryItem + 1}</span> to{' '}
            <span className="font-medium">{Math.min(indexOfLastHistoryItem, totalHistoryItems)}</span> of{' '}
            <span className="font-medium">{totalHistoryItems}</span> concessions
          </p>
          <Pagination
            page={historyPage}
            totalPages={totalHistoryPages}
            onPageChange={(page) => setHistoryPage(page)}
          />
        </div>
      )}

      {/* ASSIGN CONCESSION MODAL - RE-REDESIGNED FOR SINGLE GUIDED WORKFLOW */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Fee Concession"
        className="max-w-5xl md:max-w-5xl w-full rounded-2xl"
      >
        <div className="flex flex-col h-[75vh] md:h-[80vh] justify-between">
          
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-6">
            
            {/* Subtitle & Info Header */}
            <div className="pb-4 border-b border-gray-150">
              <p className="text-sm text-gray-500 font-medium">
                Assign student-specific fee concessions without modifying original fee amounts.
              </p>
            </div>

            {/* Section 1: Student Filters & Selectors */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
                <Layers className="text-orange-500" size={18} />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Step 1: Student Selection</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Class */}
                <div className="space-y-1.5">
                  <Label htmlFor="modalClass" className="text-gray-700 font-semibold">Select Class *</Label>
                  <select
                    id="modalClass"
                    className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-shadow"
                    value={modalClass}
                    onChange={(e) => {
                      setModalClass(e.target.value);
                      setModalSection('');
                      setSelectedStudentId('');
                      setModalFeeCategory('');
                    }}
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <Label htmlFor="modalSection" className="text-gray-700 font-semibold">Select Section *</Label>
                  <select
                    id="modalSection"
                    className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-shadow"
                    value={modalSection}
                    onChange={(e) => {
                      setModalSection(e.target.value);
                      setSelectedStudentId('');
                      setModalFeeCategory('');
                    }}
                    disabled={!modalClass}
                    required
                  >
                    <option value="">-- Choose Section --</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Student Name Filter */}
                <div className="space-y-1.5">
                  <Label htmlFor="searchStudentInput" className="text-gray-700 font-semibold">Filter by Name or Admission No</Label>
                  <Input
                    id="searchStudentInput"
                    placeholder="Search by name or admission number"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    disabled={!modalSection}
                    className="h-11 rounded-xl placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Admission Number Selector (Dropdown) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="modalStudentSelect" className="text-gray-700 font-semibold">Admission Number *</Label>
                  <select
                    id="modalStudentSelect"
                    className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-shadow"
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setModalFeeCategory('');
                    }}
                    disabled={!modalSection}
                    required
                  >
                    <option value="">-- Select Admission Number --</option>
                    {filteredStudentDropdownOptions.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.admissionNumber} — {s.studentName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Selected Student Information Card */}
            {selectedStudent && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-5 py-4 border-b border-gray-150 bg-gray-50/50 flex items-center gap-2">
                  <UserCheck className="text-orange-500" size={18} />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Selected Student Information</h3>
                </div>
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">Admission No:</span>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedStudent.admissionNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Student Name:</span>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedStudent.studentName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Class:</span>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedStudent.currentClass}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Section:</span>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedStudent.section || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Fee Category selection, Original Fee, Concession Details */}
            {selectedStudent && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
                  <Sparkles className="text-orange-500" size={18} />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Step 2: Concession details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Fee Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="modalCategorySelect" className="text-gray-700 font-semibold">Select Fee Category *</Label>
                    <div className="relative">
                      <button
                        id="modalCategorySelect"
                        type="button"
                        onClick={() => !studentFeesLoading && setIsFeeCatDropdownOpen(!isFeeCatDropdownOpen)}
                        disabled={studentFeesLoading}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={modalFeeCategory ? 'text-gray-900' : 'text-gray-500'}>
                          {studentFeesLoading
                            ? 'Loading Categories...'
                            : (() => {
                                const selectedOpt = feeCategoryOptions.find(fc => fc.id === modalFeeCategory);
                                if (!selectedOpt) return '-- Select Fee Category --';
                                return selectedOpt.pricingLabel
                                  ? `${selectedOpt.name} (${selectedOpt.pricingLabel})`
                                  : `${selectedOpt.name} (₹${selectedOpt.totalAmount})`;
                              })()}
                        </span>
                        <ChevronDown size={18} className="text-gray-500 animate-in fade-in duration-200" />
                      </button>

                      {isFeeCatDropdownOpen && (
                        <div 
                          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
                          onMouseLeave={() => setIsFeeCatDropdownOpen(false)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setModalFeeCategory('');
                              setIsFeeCatDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            -- Select Fee Category --
                          </button>
                          {feeCategoryOptions.map((fc) => (
                            <button
                              key={fc.id}
                              type="button"
                              onClick={() => {
                                setModalFeeCategory(fc.id);
                                setIsFeeCatDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex flex-col items-start ${
                                modalFeeCategory === fc.id
                                  ? 'bg-orange-50 text-orange-955'
                                  : 'text-gray-700 hover:bg-orange-50/50 hover:text-orange-955'
                              }`}
                            >
                              <div className="flex justify-between w-full">
                                <span>{fc.name}</span>
                                {!fc.pricingLabel && <span className="text-gray-550 font-bold">₹{fc.totalAmount}</span>}
                              </div>
                              {fc.pricingLabel && (
                                <span className="text-xs text-gray-500 font-normal mt-1 block">
                                  Rates: {fc.pricingLabel}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Original Fee (Read Only) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="originalFeeInput" className="text-gray-700 font-semibold">Original Fee (Read Only)</Label>
                    <Input
                      id="originalFeeInput"
                      value={modalFeeCategory ? `₹${originalAmount.toFixed(2)}` : '₹0.00'}
                      disabled
                      className="h-11 rounded-xl bg-gray-50 border-gray-300 font-bold text-gray-900"
                    />
                  </div>

                  {/* Less Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="modalLessAmount" className="text-gray-700 font-semibold">Less Amount (Concession) *</Label>
                    <Input
                      id="modalLessAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Enter concession amount"
                      value={modalLessAmount}
                      onChange={(e) => setModalLessAmount(e.target.value)}
                      disabled={!modalFeeCategory}
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="modalReason" className="text-gray-700 font-semibold">Concession Reason *</Label>
                    <Input
                      id="modalReason"
                      placeholder="Example: Financial Support"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      disabled={!modalFeeCategory}
                      required
                    />
                  </div>
                </div>

                {/* Live Summary Calculation Panel */}
                {modalFeeCategory && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-orange-200/50 text-center font-mono">
                    <div className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-sm">
                      <div className="text-[11px] font-bold text-gray-500 uppercase">Original Fee</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">₹{originalAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-sm animate-pulse">
                      <div className="text-[11px] font-bold text-gray-500 uppercase">Less Amount</div>
                      <div className="text-lg font-bold text-orange-600 mt-1">-₹{lessAmt.toFixed(2)}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-sm">
                      <div className="text-[11px] font-bold text-gray-500 uppercase">Net Payable</div>
                      <div className="text-lg font-black text-green-600 mt-1">₹{netPayable.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If no Class/Section selected yet */}
            {(!modalClass || !modalSection) && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500 bg-gray-50/50 border border-dashed border-gray-250 rounded-2xl">
                <div className="bg-orange-50 p-4 rounded-full text-orange-500 mb-3 border border-orange-100">
                  <Percent size={28} />
                </div>
                <p className="font-bold text-gray-800 text-sm">Select Class and Section to load students.</p>
                <p className="text-xs text-gray-400 mt-1">This guided system will fetch live student and fee details.</p>
              </div>
            )}

            {/* Assigned Concessions inside Modal (Current Session) */}
            {sessionAssignedConcessions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm animate-in fade-in duration-300">
                <div className="px-5 py-3.5 border-b border-gray-150 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Assigned Concessions in This Session</h3>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                    {sessionAssignedConcessions.length} Assigned
                  </span>
                </div>
                <div className="overflow-x-auto max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs py-2.5">Admission No</TableHead>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs">Fee Category</TableHead>
                        <TableHead className="text-xs">Original Fee</TableHead>
                        <TableHead className="text-xs">Less Amount</TableHead>
                        <TableHead className="text-xs">Net Amount</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Assigned By</TableHead>
                        <TableHead className="text-xs">Assigned Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAssignedConcessions.map((c, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-gray-50/50">
                          <TableCell className="font-bold py-2.5">{c.admissionNumber}</TableCell>
                          <TableCell className="font-semibold text-gray-800">{c.studentName}</TableCell>
                          <TableCell>{c.feeCategory}</TableCell>
                          <TableCell>₹{c.originalAmount.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-orange-600">-₹{c.lessAmount.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-green-600">₹{c.netPayable.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-gray-600">{c.reason}</TableCell>
                          <TableCell>{c.assignedBy}</TableCell>
                          <TableCell>{new Date(c.assignedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                              {c.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed Layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 mt-4 bg-white">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignModalOpen(false)}
                className="border-gray-300 rounded-xl px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetModal}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-2.5 font-semibold transition-colors border border-dashed border-gray-250"
              >
                Reset
              </Button>
            </div>
            
            <Button
              type="button"
              onClick={handleAssignConcession}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm rounded-xl px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={!selectedStudentId || !modalFeeCategory || !modalLessAmount || parseFloat(modalLessAmount) <= 0 || parseFloat(modalLessAmount) > originalAmount || !modalReason.trim()}
              loading={assignLoading}
              loadingText="Saving..."
            >
              Assign Less Amount
            </Button>
          </div>
          
        </div>
      </Modal>
    </div>
  );
};

export default Concessions;
