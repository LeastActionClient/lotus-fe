import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { AlertCircle, CheckCircle, Download, Filter, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentCategoryLabel, isRTEStudent } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import * as XLSX from 'xlsx';
import Select from 'react-select';

const CategoryMultiSelect = ({ categories, selectedIds, onChange }) => {
  const categoryOptions = useMemo(() => {
    return (categories || []).map(c => ({
      value: String(c._id),
      label: c.name
    }));
  }, [categories]);

  const selectedOptions = useMemo(() => {
    return categoryOptions.filter(opt => selectedIds.includes(opt.value));
  }, [categoryOptions, selectedIds]);

  const handleSelectAll = () => {
    onChange(categoryOptions.map(opt => opt.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-xs text-gray-500 font-medium">
          {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'All Categories'}
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-orange-600 hover:text-orange-800 font-bold hover:underline"
          >
            Select All ({categories.length})
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-gray-500 hover:text-gray-700 font-medium hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <Select
        isMulti
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        menuPortalTarget={document.body}
        options={categoryOptions}
        value={selectedOptions}
        onChange={(selected) => {
          const ids = selected ? selected.map(opt => opt.value) : [];
          onChange(ids);
        }}
        placeholder="Type to search categories..."
        className="text-sm"
        classNamePrefix="category-select"
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            minHeight: '40px',
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#ea580c' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #ea580c' : 'none',
            '&:hover': {
              borderColor: '#ea580c'
            }
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#ffedd5',
            borderRadius: '9999px',
            border: '1px solid #fed7aa',
            paddingLeft: '4px',
            paddingRight: '4px'
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: '#7c2d12',
            fontWeight: '600',
            fontSize: '12px'
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: '#9a3412',
            ':hover': {
              backgroundColor: '#ea580c',
              color: 'white',
              borderRadius: '9999px'
            }
          }),
          option: (base, state) => ({
            ...base,
            fontSize: '13px',
            backgroundColor: state.isSelected
              ? '#ea580c'
              : state.isFocused
              ? '#fff7ed'
              : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer'
          })
        }}
      />
    </div>
  );
};

const PendingFees = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All');
  const [RTEFilter, setRTEFilter] = useState('All');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchCategories();
    fetchAcademicYears();
  }, []);

  const normalizeText = (value) => `${value ?? ''}`.trim().toLowerCase();
  const toTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  };

  const getFeeBucket = (fee, student) => {
    const feeClass = normalizeText(fee.className);
    const currentClass = normalizeText(student.currentClass);
    const feeYear = normalizeText(fee.academicYear);
    const currentYear = normalizeText(student.academicYear);

    if (feeClass && currentClass && feeClass !== currentClass) {
      return 'previous';
    }
    if (feeYear && currentYear && feeYear !== currentYear) {
      return 'previous';
    }
    if (feeClass && currentClass && feeClass === currentClass) {
      return 'current';
    }
    if (feeYear && currentYear && feeYear === currentYear) {
      return 'current';
    }

    const feeCreatedAt = toTime(fee.createdAt);
    const enrollmentBoundary = toTime(student.currentEnrollment?.joinedDate || student.currentEnrollment?.promotedDate || student.currentEnrollment?.createdAt);
    if (feeCreatedAt && enrollmentBoundary) {
      return feeCreatedAt < enrollmentBoundary ? 'previous' : 'current';
    }

    return 'current';
  };

  const getFeeCatId = (fee) => {
    if (fee?.includedChargeId) {
      return String(fee.includedChargeId._id || fee.includedChargeId);
    }
    return String(fee?.feeCategoryId?._id || fee?.feeCategoryId || '');
  };

  const isFeeCategorySelected = (fee, selectedIds = selectedCategoryIds) => {
    if (!selectedIds || selectedIds.length === 0) return true;
    const catId = getFeeCatId(fee);
    return selectedIds.includes(catId);
  };

  const getCurrentFees = (student) => (student.studentFees || []).filter(f => getFeeBucket(f, student) === 'current');
  const getPreviousFees = (student) => (student.studentFees || []).filter(f => getFeeBucket(f, student) === 'previous');

  const getStudentTotalPending = (student, selectedIds = selectedCategoryIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      if (student.totalDue !== undefined) return student.totalDue;
      return (student.studentFees || []).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
    }
    return getPreviousPending(student, selectedIds) + getCurrentPending(student, selectedIds);
  };

  const getStudentTotalPaid = (student) => {
    if (student.currentPaid !== undefined && student.previousPaid !== undefined) {
      return student.currentPaid + student.previousPaid;
    }
    return (student.studentFees || []).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  };

  const getStudentTotalFee = (student) => {
    if (student.totalFee !== undefined) return student.totalFee;
    return (student.studentFees || []).reduce((sum, fee) => {
      const concessionAmount = fee.concessionStatus === 'Active' ? (fee.lessAmount || 0) : 0;
      return sum + Math.max(0, (fee.totalAmount || 0) - concessionAmount);
    }, 0);
  };

  const getCurrentPending = (student, selectedIds = selectedCategoryIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      if (student.currentPending !== undefined) return student.currentPending;
      return getCurrentFees(student).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
    }
    return getCurrentFees(student)
      .filter(f => isFeeCategorySelected(f, selectedIds))
      .reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
  };

  const getPreviousPending = (student, selectedIds = selectedCategoryIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      if (student.previousPending !== undefined) return student.previousPending;
      return getPreviousFees(student).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
    }
    return getPreviousFees(student)
      .filter(f => isFeeCategorySelected(f, selectedIds))
      .reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
  };

  const getCurrentPaid = (student) => {
    if (student.currentPaid !== undefined) return student.currentPaid;
    return getCurrentFees(student).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  };

  const getPreviousPaid = (student) => {
    if (student.previousPaid !== undefined) return student.previousPaid;
    return getPreviousFees(student).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  };

  const formatFeeLabel = (fee) => fee.feeCategory?.name || fee.feeCategoryId?.name || fee.includedChargeId?.name || fee.name || 'Unknown';
  const formatRs = (amount) => `Rs. ${(amount || 0).toFixed(2)}`;
  const renderFeeBreakdown = (fees, emptyMessage = 'No pending fees') => {
    if (!fees || fees.length === 0) {
      return <div className="text-gray-400">{emptyMessage}</div>;
    }

    return (
      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
        {fees.map((fee, idx) => (
          <div key={`${fee._id || idx}`} className="flex justify-between gap-4 text-left font-normal">
            <span className="text-gray-600">{formatFeeLabel(fee)}</span>
            <span className="font-semibold text-red-600">Rs. {(fee.remainingAmount || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error('Error fetching classes', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [catRes, chargeRes] = await Promise.all([
        api.get('/fees/categories'),
        api.get('/included-charges')
      ]);
      const data = catRes.data || [];
      const charges = chargeRes.data?.data || chargeRes.data || [];
      
      const chargeOptions = charges.map(c => ({
        _id: c._id,
        name: c.name
      }));
      
      setCategories([...data, ...chargeOptions]);
    } catch (error) {
      console.error('Error fetching categories', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get('/academic-years');
      setAcademicYears(res.data || []);
    } catch (error) {
      console.error('Error fetching academic years', error);
    }
  };

  const availableAcademicYears = useMemo(() => {
    const yearsSet = new Set();
    (academicYears || []).forEach(ay => {
      if (ay.year) yearsSet.add(ay.year);
    });
    (students || []).forEach(s => {
      const yr = s.academicYear || s.currentEnrollment?.academicYear;
      if (yr) yearsSet.add(yr);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [academicYears, students]);

  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('All');
    setSectionFilter('All');
    setStatusFilter('All');
    setFeeStatusFilter('All');
    setRTEFilter('All');
    setAcademicYearFilter('All');
    setSelectedCategoryIds([]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classFilter, sectionFilter, statusFilter, feeStatusFilter, RTEFilter, academicYearFilter, selectedCategoryIds]);

  const availableSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const cls = classes.find(c => c.name === classFilter);
    return cls?.sections || [];
  }, [classFilter, classes]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Exclude students with no assigned fee amount (i.e. not assigned to class)
      if (getStudentTotalFee(student) <= 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!student.studentName?.toLowerCase().includes(q) && !student.admissionNumber?.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (classFilter !== 'All' && student.currentClass !== classFilter) return false;
      if (sectionFilter !== 'All' && student.section !== sectionFilter) return false;

      if (academicYearFilter !== 'All') {
        const studentYear = student.academicYear || student.currentEnrollment?.academicYear;
        const normFilter = normalizeText(academicYearFilter);
        const normYear = normalizeText(studentYear);
        if (!normYear || normYear !== normFilter) return false;
      }

      if (statusFilter === 'Active') {
        if (student.studentStatus && student.studentStatus !== 'Active') return false;
      } else if (statusFilter === 'Old') {
        if (!student.studentStatus || student.studentStatus === 'Active') return false;
      }

      if (RTEFilter === 'RTE' && !isRTEStudent(student)) return false;
      if (RTEFilter === 'Non-RTE' && isRTEStudent(student)) return false;

      const pendingAmount = getStudentTotalPending(student, []);
      if (feeStatusFilter === 'Pending' && pendingAmount <= 0) return false;
      if (feeStatusFilter === 'Paid' && pendingAmount > 0) return false;

      if (selectedCategoryIds.length > 0) {
        const hasPendingSelectedCat = (student.studentFees || []).some(f =>
          isFeeCategorySelected(f, selectedCategoryIds) && (f.remainingAmount || 0) > 0
        );
        if (!hasPendingSelectedCat) return false;
      }

      return true;
    });
  }, [students, searchQuery, classFilter, sectionFilter, statusFilter, feeStatusFilter, RTEFilter, academicYearFilter, selectedCategoryIds]);

  const allStudentsWithFees = useMemo(() => {
    return students.filter(student => getStudentTotalFee(student) > 0);
  }, [students]);

  const totalStudentsCount = allStudentsWithFees.length;
  const totalPendingAmount = allStudentsWithFees.reduce((sum, student) => sum + getStudentTotalPending(student, selectedCategoryIds), 0);
  const currentPendingAmount = allStudentsWithFees.reduce((sum, student) => sum + getCurrentPending(student, selectedCategoryIds), 0);
  const previousPendingAmount = allStudentsWithFees.reduce((sum, student) => sum + getPreviousPending(student, selectedCategoryIds), 0);
  const totalPaidAmount = allStudentsWithFees.reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
  const RTEPaidAmount = allStudentsWithFees.filter(student => isRTEStudent(student)).reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
  const generalPaidAmount = allStudentsWithFees.filter(student => !isRTEStudent(student)).reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const escapeCSVValue = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const downloadCSV = () => {
    const headers = ['Admission No', 'Student Name', 'Status', 'RTE Status', 'Class', 'Section', 'Total Fee', 'Paid Amount', 'Pending Amount'];

    const rows = filteredStudents.map(student => {
      const totalPending = getStudentTotalPending(student, selectedCategoryIds);
      const totalPaid = getStudentTotalPaid(student);
      const totalFee = getStudentTotalFee(student);

      return [
        student.admissionNumber || '',
        student.studentName || '',
        (!student.studentStatus || student.studentStatus === 'Active') ? 'Active' : `${student.studentStatus} (Old)`,
        getStudentCategoryLabel(student),
        student.currentClass || '',
        student.section || '',
        totalFee.toFixed(2),
        totalPaid.toFixed(2),
        totalPending.toFixed(2)
      ].map(escapeCSVValue);
    });

    const csvContent = [headers.map(escapeCSVValue).join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `pending_fees_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    let targetCategoryNames = [];

    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      const selectedSet = new Set();
      (categories || []).forEach(cat => {
        if (cat && cat._id && selectedCategoryIds.includes(String(cat._id))) {
          if (cat.name) selectedSet.add(cat.name);
        }
      });
      filteredStudents.forEach(student => {
        (student.studentFees || []).forEach(f => {
          if (isFeeCategorySelected(f, selectedCategoryIds)) {
            const lbl = formatFeeLabel(f);
            if (lbl && lbl !== 'Unknown') selectedSet.add(lbl);
          }
        });
      });
      targetCategoryNames = Array.from(selectedSet);
    } else {
      const catNamesSet = new Set();
      (categories || []).forEach(cat => {
        if (cat.name) catNamesSet.add(cat.name);
      });
      filteredStudents.forEach(student => {
        (student.studentFees || []).forEach(f => {
          const lbl = formatFeeLabel(f);
          if (lbl && lbl !== 'Unknown') catNamesSet.add(lbl);
        });
      });
      targetCategoryNames = Array.from(catNamesSet);
    }

    const getCategoryPriority = (name) => {
      const lowerName = String(name || '').toLowerCase();
      if (lowerName.includes('book')) return 1;
      if (lowerName.includes('term') && !lowerName.includes('tuition') && !lowerName.includes('abacus')) return 2;
      if (lowerName.includes('tuition')) return 3;
      if (lowerName.includes('abacus')) return 4;
      return 5;
    };

    targetCategoryNames.sort((a, b) => {
      const priorityA = getCategoryPriority(a);
      const priorityB = getCategoryPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.localeCompare(b);
    });

    const classSortFn = (aCls, bCls) => {
      const normalize = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const order = { prekg: 1, lkg: 2, ukg: 3 };
      const aNorm = normalize(aCls);
      const bNorm = normalize(bCls);
      const aNum = parseInt(aNorm);
      const bNum = parseInt(bNorm);

      const aVal = !isNaN(aNum) ? aNum + 10 : (order[aNorm] || 999);
      const bVal = !isNaN(bNum) ? bNum + 10 : (order[bNorm] || 999);
      return aVal - bVal;
    };

    const sortedStudents = [...filteredStudents].sort((a, b) => {
      const classDiff = classSortFn(a.currentClass, b.currentClass);
      if (classDiff !== 0) return classDiff;
      const secA = String(a.section || '').trim().toLowerCase();
      const secB = String(b.section || '').trim().toLowerCase();
      return secA.localeCompare(secB);
    });

    let totalPrevPending = 0;
    let totalCurrPending = 0;
    let totalCurrFee = 0;
    let totalFee = 0;
    let totalPaidAmount = 0;
    let totalTotalPending = 0;
    const categoryTotals = {};
    targetCategoryNames.forEach(catName => { categoryTotals[catName] = 0; });

    const excelData = sortedStudents.map((student, index) => {
      const displayPendingAmount = getStudentTotalPending(student, selectedCategoryIds);
      const prevPend = getPreviousPending(student, selectedCategoryIds);
      const currPend = getCurrentPending(student, selectedCategoryIds);
      
      const currentSelectedFees = getCurrentFees(student).filter(f => isFeeCategorySelected(f, selectedCategoryIds));
      const currTotalFee = currentSelectedFees.reduce((sum, f) => {
          const concession = f.concessionStatus === 'Active' ? (f.lessAmount || 0) : 0;
          return sum + Math.max(0, (f.totalAmount || 0) - concession);
      }, 0);

      const stuFee = getStudentTotalFee(student);
      const stuPaid = getStudentTotalPaid(student);

      totalPrevPending += prevPend;
      totalCurrPending += currPend;
      totalCurrFee += currTotalFee;
      totalFee += stuFee;
      totalPaidAmount += stuPaid;
      totalTotalPending += displayPendingAmount;

      const categoryColumns = {};
      targetCategoryNames.forEach(catName => {
        const feesForCat = (student.studentFees || []).filter(f => {
          const lbl = formatFeeLabel(f);
          return lbl === catName && isFeeCategorySelected(f, selectedCategoryIds);
        });
        const catPending = feesForCat.reduce((sum, f) => sum + (f.remainingAmount || 0), 0);
        categoryTotals[catName] += catPending;
        categoryColumns[catName] = Number(catPending.toFixed(2));
      });

      return {
        'S.No': index + 1,
        'Admission number': student.admissionNumber || '',
        'Student name': student.studentName || '',
        'class': student.currentClass || '',
        'Section': student.section || '',
        'Previous year pending': Number(prevPend.toFixed(2)),
        ...categoryColumns,
        'Current total': Number(currTotalFee.toFixed(2)),
        'Current pending': Number(currPend.toFixed(2)),
        'Total fees': Number(stuFee.toFixed(2)),
        'Total paid': Number(stuPaid.toFixed(2)),
        'Total pending': Number(displayPendingAmount.toFixed(2))
      };
    });

    const totalRow = {
      'S.No': '',
      'Admission number': '',
      'Student name': 'TOTAL',
      'class': '',
      'Section': '',
      'Previous year pending': Number(totalPrevPending.toFixed(2)),
    };

    targetCategoryNames.forEach(catName => {
      totalRow[catName] = Number(categoryTotals[catName].toFixed(2));
    });

    totalRow['Current total'] = Number(totalCurrFee.toFixed(2));
    totalRow['Current pending'] = Number(totalCurrPending.toFixed(2));
    totalRow['Total fees'] = Number(totalFee.toFixed(2));
    totalRow['Total paid'] = Number(totalPaidAmount.toFixed(2));
    totalRow['Total pending'] = Number(totalTotalPending.toFixed(2));

    excelData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Fees');
    XLSX.writeFile(workbook, `Pending_Fees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          {feeStatusFilter === 'Paid' ? (
            <CheckCircle className="mr-3 text-green-600" size={32} />
          ) : (
            <AlertCircle className="mr-3 text-red-600" size={32} />
          )}
          Fee Status List
        </h1>
        <p className="text-gray-500 mt-2">All students (Active & Old) and their fee balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{totalStudentsCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <AlertCircle className="h-6 w-6 text-red-600 mb-2" />
            <p className="text-sm text-red-600 font-medium">Total Pending</p>
            <p className="text-3xl font-bold text-red-700">Rs. {totalPendingAmount.toLocaleString()}</p>
            <div className="flex gap-4 mt-2 text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
              <span>Prev: Rs. {previousPendingAmount.toLocaleString()}</span>
              <span>Curr: Rs. {currentPendingAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
            <p className="text-sm text-green-600 font-medium">Total Paid</p>
            <p className="text-3xl font-bold text-green-700">Rs. {totalPaidAmount.toLocaleString()}</p>
            <div className="flex gap-4 mt-2 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              <span>RTE: Rs. {RTEPaidAmount.toLocaleString()}</span>
              <span>General: Rs. {generalPaidAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5 text-gray-500" /> Filters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Name or Admin No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Label>Class</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSectionFilter('All');
                  }}
                >
                  <option value="All">All Classes</option>
                  {classes.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Section</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  disabled={classFilter === 'All'}
                >
                  <option value="All">All Sections</option>
                  {availableSections.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Student Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All (Active & Old)</option>
                  <option value="Active">Active Students Only</option>
                  <option value="Old">Old Students Only</option>
                </select>
              </div>

              <div>
                <Label>Fee Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={feeStatusFilter}
                  onChange={(e) => setFeeStatusFilter(e.target.value)}
                >
                  <option value="Pending">Pending Fees Only</option>
                  <option value="Paid">Fully Paid Only</option>
                  <option value="All">All Students</option>
                </select>
              </div>

              <div>
                <Label>RTE Course Group</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 font-medium"
                  value={RTEFilter}
                  onChange={(e) => setRTEFilter(e.target.value)}
                >
                  <option value="All">All Students (RTE & General)</option>
                  <option value="RTE">RTE Course Students Only</option>
                  <option value="Non-RTE">General (Non-RTE) Students Only</option>
                </select>
              </div>

              <div>
                <Label>Academic Year</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 font-medium"
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                >
                  <option value="All">All Academic Years</option>
                  {availableAcademicYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Category</Label>
                <CategoryMultiSelect
                  categories={categories}
                  selectedIds={selectedCategoryIds}
                  onChange={setSelectedCategoryIds}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                Export Excel
              </Button>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[1240px] text-xs">
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Admission No</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Student Name</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Course Type</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Class & Section</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Academic Year</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">Total Fee</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">Prev Paid</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">Curr Paid</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">Prev Pending</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">Curr Pending</TableHead>
                  <TableHead className="px-2.5 py-3 text-xs font-bold text-gray-900 text-right whitespace-nowrap">Total Due</TableHead>
                  <TableHead className="px-3 py-3 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center h-32 text-gray-500 text-xs">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student, index) => {
                    const totalPending = getStudentTotalPending(student, selectedCategoryIds);
                    const totalPaid = getStudentTotalPaid(student);
                    const totalFee = getStudentTotalFee(student);
                    const currentPending = getCurrentPending(student, selectedCategoryIds);
                    const previousPending = getPreviousPending(student, selectedCategoryIds);
                    const hasPreviousFees = getPreviousFees(student).length > 0;
                    const previousPendingFees = getPreviousFees(student).filter(f => (f.remainingAmount || 0) > 0 && isFeeCategorySelected(f, selectedCategoryIds));
                    const currentPendingFees = getCurrentFees(student).filter(f => (f.remainingAmount || 0) > 0 && isFeeCategorySelected(f, selectedCategoryIds));

                    return (
                      <TableRow key={student._id} className="hover:bg-gray-50/60">
                        <TableCell className="px-2.5 py-2.5 text-xs font-semibold text-gray-900 whitespace-nowrap">{student.admissionNumber}</TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs whitespace-nowrap">
                          <Link to={`/dashboard/students/edit/${student._id}`} className="text-orange-600 hover:underline font-medium">
                            {student.studentName}
                          </Link>
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs whitespace-nowrap">
                          {(!student.studentStatus || student.studentStatus === 'Active') ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                              {student.studentStatus}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs whitespace-nowrap">
                          {isRTEStudent(student) ? (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 shadow-sm border border-purple-200">
                              RTE
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              General
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs whitespace-nowrap">
                          {student.currentClass} {student.section ? `- ${student.section}` : ''}
                          {previousPending > 0 && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                              Carried Forward
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                          {student.academicYear || student.currentEnrollment?.academicYear || '-'}
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right font-medium whitespace-nowrap">Rs. {totalFee.toFixed(2)}</TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right text-emerald-600 whitespace-nowrap">Rs. {getPreviousPaid(student).toFixed(2)}</TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right text-emerald-600 whitespace-nowrap">Rs. {getCurrentPaid(student).toFixed(2)}</TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right whitespace-nowrap">
                          {hasPreviousFees ? (
                            <div className="relative group inline-block">
                              <span className={`font-medium cursor-pointer border-b border-dashed ${
                                previousPending > 0
                                  ? 'text-red-600 border-red-400 hover:text-red-700'
                                  : 'text-gray-400 border-gray-300 hover:text-gray-500'
                              }`}>
                                {previousPending > 0 ? formatRs(previousPending) : '-'}
                              </span>
                              <div className={`absolute right-0 ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 invisible group-hover:visible bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 p-3 min-w-[240px] pointer-events-none transition-all duration-200`}>
                                <div className="font-bold border-b border-gray-100 pb-1 mb-1.5 text-gray-700 text-left">
                                  Carried Forward Fees
                                </div>
                                {renderFeeBreakdown(previousPendingFees, 'No carried forward fees')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right whitespace-nowrap">
                          <div className="relative group inline-block">
                            <span className={`font-medium cursor-pointer border-b border-dashed ${
                              currentPending > 0
                                ? 'text-orange-600 border-orange-400 hover:text-orange-700'
                                : 'text-gray-400 border-gray-300 hover:text-gray-500'
                            }`}>
                              {formatRs(currentPending)}
                            </span>
                            <div className={`absolute right-0 ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 invisible group-hover:visible bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 p-3 min-w-[240px] pointer-events-none transition-all duration-200`}>
                              <div className="font-bold border-b border-gray-100 pb-1 mb-1.5 text-gray-700 text-left">
                                Current Year Pending
                              </div>
                              {renderFeeBreakdown(currentPendingFees, 'No current year pending fees')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2.5 py-2.5 text-xs text-right font-bold whitespace-nowrap">
                          <div className="relative group inline-block">
                            <span className={`font-bold cursor-pointer border-b border-dashed ${
                              totalPending > 0
                                ? 'text-red-600 border-red-400 hover:text-red-700'
                                : 'text-gray-500 border-gray-300 hover:text-gray-600'
                            }`}>
                              {formatRs(totalPending)}
                            </span>
                            <div className={`absolute right-0 ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 invisible group-hover:visible bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 p-3 min-w-[220px] pointer-events-none transition-all duration-200`}>
                              <div className="font-bold border-b border-gray-100 pb-1 mb-1.5 text-gray-700 text-left">
                                Pending Fees Breakdown
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-purple-700">Carried Forward</div>
                                  {renderFeeBreakdown(previousPendingFees, 'None')}
                                </div>
                                <div>
                                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-orange-700">Current Year</div>
                                  {renderFeeBreakdown(currentPendingFees, 'None')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-xs text-center whitespace-nowrap">
                          {getStudentTotalPending(student, []) > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => navigate('/dashboard/payments', { state: { studentId: student._id } })}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs px-3 py-1 h-7 whitespace-nowrap shadow-sm"
                            >
                              Pay Pending
                            </Button>
                          ) : (
                            <span className="text-xs font-semibold text-green-600 px-2 flex items-center justify-center gap-1 whitespace-nowrap">
                              <CheckCircle size={14} /> Paid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingFees;
