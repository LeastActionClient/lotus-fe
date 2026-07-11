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

const PendingFees = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All');
  const [RTEFilter, setRTEFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchCategories();
  }, []);

  const isPreviousYearFee = (fee, student) => {
    return (
      (fee.academicYear && student.academicYear && fee.academicYear !== student.academicYear) ||
      (!fee.academicYear && fee.className && student.currentClass && fee.className !== student.currentClass)
    );
  };

  const getCurrentFees = (student) => (student.studentFees || []).filter(f => !isPreviousYearFee(f, student));
  const getPreviousFees = (student) => (student.studentFees || []).filter(f => isPreviousYearFee(f, student));

  const getStudentTotalPending = (student) => {
    return (student.studentFees || []).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
  };

  const getStudentTotalPaid = (student) => {
    return (student.studentFees || []).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  };

  const getStudentTotalFee = (student) => {
    return (student.studentFees || []).reduce((sum, fee) => sum + (fee.totalAmount || 0), 0);
  };

  const getCurrentPending = (student) => {
    return getCurrentFees(student).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
  };

  const getPreviousPending = (student) => {
    return getPreviousFees(student).reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
  };

  const getCurrentPaid = (student) => {
    return getCurrentFees(student).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  };

  const getPreviousPaid = (student) => {
    return getPreviousFees(student).reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
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
      const res = await api.get('/fees/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories', error);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('All');
    setSectionFilter('All');
    setStatusFilter('All');
    setFeeStatusFilter('All');
    setRTEFilter('All');
    setCategoryFilter('All');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classFilter, sectionFilter, statusFilter, feeStatusFilter, RTEFilter, categoryFilter]);

  const availableSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const cls = classes.find(c => c.name === classFilter);
    return cls?.sections || [];
  }, [classFilter, classes]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!student.studentName?.toLowerCase().includes(q) && !student.admissionNumber?.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (classFilter !== 'All' && student.currentClass !== classFilter) return false;
      if (sectionFilter !== 'All' && student.section !== sectionFilter) return false;

      if (statusFilter === 'Active') {
        if (student.studentStatus && student.studentStatus !== 'Active') return false;
      } else if (statusFilter === 'Old') {
        if (!student.studentStatus || student.studentStatus === 'Active') return false;
      }

      if (RTEFilter === 'RTE' && !isRTEStudent(student)) return false;
      if (RTEFilter === 'Non-RTE' && isRTEStudent(student)) return false;

      const pendingAmount = getStudentTotalPending(student);
      if (feeStatusFilter === 'Pending' && pendingAmount <= 0) return false;
      if (feeStatusFilter === 'Paid' && pendingAmount > 0) return false;

      if (categoryFilter !== 'All') {
        const hasPendingSelectedCat = (student.studentFees || []).some(f =>
          (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter && (f.remainingAmount || 0) > 0
        );
        if (!hasPendingSelectedCat) return false;
      }

      return true;
    });
  }, [students, searchQuery, classFilter, sectionFilter, statusFilter, feeStatusFilter, RTEFilter, categoryFilter]);

  const totalPendingAmount = filteredStudents.reduce((sum, student) => sum + getStudentTotalPending(student), 0);
  const currentPendingAmount = filteredStudents.reduce((sum, student) => sum + getCurrentPending(student), 0);
  const previousPendingAmount = filteredStudents.reduce((sum, student) => sum + getPreviousPending(student), 0);
  const totalPaidAmount = filteredStudents.reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
  const RTEPaidAmount = filteredStudents.filter(student => isRTEStudent(student)).reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
  const generalPaidAmount = filteredStudents.filter(student => !isRTEStudent(student)).reduce((sum, student) => sum + getStudentTotalPaid(student), 0);
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
      const totalPending = getStudentTotalPending(student);
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
    const excelData = filteredStudents.map(student => {
      const pendingCats = (student.studentFees || [])
        .filter(f => f.remainingAmount > 0 && f.feeCategoryId)
        .map(f => ({
          id: f.feeCategoryId._id || f.feeCategoryId,
          name: f.feeCategoryId.name || 'Unknown',
          pendingAmount: f.remainingAmount
        }));

      const filteredPendingCats = categoryFilter === 'All'
        ? pendingCats
        : pendingCats.filter(c => c.id === categoryFilter);

      const pendingCategoriesStr = filteredPendingCats.map(c => c.name).join(', ');
      const categoryWisePendingAmountsStr = filteredPendingCats.map(c => `Rs. ${c.pendingAmount}`).join(', ');
      const displayPendingAmount = categoryFilter === 'All'
        ? getStudentTotalPending(student)
        : ((student.studentFees || []).find(f => (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter)?.remainingAmount || 0);

      return {
        'Admission Number': student.admissionNumber || '',
        'Student Name': student.studentName || '',
        'Student Status': (!student.studentStatus || student.studentStatus === 'Active') ? 'Active' : student.studentStatus,
        'Class': student.currentClass || '',
        'Section': student.section || '',
        'Pending Categories': pendingCategoriesStr || 'None',
        'Category-wise Pending Amounts': categoryWisePendingAmountsStr || '0',
        'Total Fee': `Rs. ${getStudentTotalFee(student).toFixed(2)}`,
        'Paid Amount': `Rs. ${getStudentTotalPaid(student).toFixed(2)}`,
        'Total Pending': `Rs. ${displayPendingAmount.toFixed(2)}`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Fees');
    XLSX.writeFile(workbook, `Pending_Fees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Students in View</p>
            <p className="text-3xl font-bold text-gray-900">{filteredStudents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <AlertCircle className="h-6 w-6 text-red-600 mb-2" />
            <p className="text-sm text-red-600 font-medium">Total Pending (Filtered)</p>
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
            <p className="text-sm text-green-600 font-medium">Total Paid (Filtered)</p>
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
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                Export Excel
              </Button>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              <Button variant="outline" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Course Type</TableHead>
                  <TableHead>Class & Section</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Prev Paid</TableHead>
                  <TableHead className="text-right">Curr Paid</TableHead>
                  <TableHead className="text-right">Prev Pending</TableHead>
                  <TableHead className="text-right">Curr Pending</TableHead>
                  <TableHead className="text-right font-bold">Total Due</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center h-32 text-gray-500">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map(student => {
                    const totalPending = getStudentTotalPending(student);
                    const totalPaid = getStudentTotalPaid(student);
                    const totalFee = getStudentTotalFee(student);
                    const currentPending = getCurrentPending(student);
                    const previousPending = getPreviousPending(student);
                    const hasPreviousFees = previousPending > 0;

                    return (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium text-gray-900">{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Link to={`/dashboard/students/edit/${student._id}`} className="text-orange-600 hover:underline font-medium">
                            {student.studentName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {(!student.studentStatus || student.studentStatus === 'Active') ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              {student.studentStatus}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isRTEStudent(student) ? (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 shadow-sm border border-purple-200">
                              RTE
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              General
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.currentClass} {student.section ? `- ${student.section}` : ''}
                          {hasPreviousFees && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              Carried Forward
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">Rs. {totalFee.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">Rs. {getPreviousPaid(student).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">Rs. {getCurrentPaid(student).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {hasPreviousFees ? (
                            <span className="text-red-600 font-medium">Rs. {previousPending.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={currentPending > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                            Rs. {currentPending.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs. {totalPending.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {totalPending > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => navigate('/dashboard/payments', { state: { studentId: student._id } })}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Pay Pending
                            </Button>
                          ) : (
                            <span className="text-sm font-semibold text-green-600 px-3 flex items-center gap-1">
                              <CheckCircle size={16} /> Paid
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
