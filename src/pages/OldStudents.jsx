import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Users, Search, Filter, IndianRupee, GraduationCap, XCircle, UserMinus, Download, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentCategoryLabel, isRTEStudent } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import ExportModal from '../components/ExportModal';

const OldStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  // Filters
  const [quickFeeFilter, setQuickFeeFilter] = useState('ALL'); // 'ALL', 'PENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const [exitTypeFilter, setExitTypeFilter] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All'); // 'All', 'Pending', 'Paid'
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');
  const [studentGroupFilter, setStudentGroupFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      // Filter for old students only
      const oldStudents = res.data.filter(s => s.studentStatus && s.studentStatus !== 'Active');
      setStudents(oldStudents);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error("Error fetching classes", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setExitTypeFilter('All');
    setFeeStatusFilter('All');
    setClassFilter('All');
    setSectionFilter('All');
    setAcademicYearFilter('All');
    setQuickFeeFilter('ALL');
    setStudentGroupFilter('All');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [quickFeeFilter, searchQuery, exitTypeFilter, feeStatusFilter, classFilter, sectionFilter, academicYearFilter, studentGroupFilter]);

  const escapeCSVValue = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const downloadCSV = () => {
    const headers = [
      'Admission No',
      'Student Name',
      'Exit Type',
      'Class',
      'Section',
      'Academic Year',
      'Exit Date',
      'Total Fee',
      'Total Paid',
      'Pending Fee',
      'Fee Status'
    ];

    const rows = filteredStudents.map((student) => {
      const totalPending = getStudentTotalPending(student);
      const totalPaid = getStudentTotalPaid(student);
      const totalFee = getStudentTotalFee(student);

      return [
        student.admissionNumber || '',
        student.studentName || '',
        student.studentStatus || '',
        student.currentClass || '',
        student.section || '',
        student.academicYear || 'N/A',
        student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : '',
        totalFee.toFixed(2),
        totalPaid.toFixed(2),
        totalPending.toFixed(2),
        totalPending > 0 ? 'PENDING' : 'PAID'
      ].map(escapeCSVValue);
    });

    const csvContent = [headers.map(escapeCSVValue).join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `old_students_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getStudentTotalPending = (s) => {
    if (s.totalDue !== undefined) return s.totalDue;
    return s.studentFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
  };

  const getStudentTotalPaid = (s) => {
    if (s.currentPaid !== undefined && s.previousPaid !== undefined) {
      return s.currentPaid + s.previousPaid;
    }
    return s.studentFees?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
  };

  const getStudentTotalFee = (s) => {
    if (s.totalFee !== undefined) return s.totalFee;
    return s.studentFees?.reduce((sum, f) => {
      const concessionAmount = f.concessionStatus === 'Active' ? (f.lessAmount || 0) : 0;
      return sum + Math.max(0, (f.totalAmount || 0) - concessionAmount);
    }, 0) || 0;
  };

  const getCurrentPending = (s) => {
    if (s.currentPending !== undefined) return s.currentPending;
    return s.currentClassFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
  };

  const getPreviousPending = (s) => {
    if (s.previousPending !== undefined) return s.previousPending;
    return s.previousClassFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
  };

  // Derived arrays
  const uniqueAcademicYears = useMemo(() => {
    const years = new Set(students.map(s => s.academicYear).filter(Boolean));
    return Array.from(years).sort();
  }, [students]);

  const availableSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const cls = classes.find(c => c.name === classFilter);
    return cls?.sections || [];
  }, [classFilter, classes]);

  const cohortStudents = useMemo(() => {
    return students.filter(s => {
      // Academic Year Filter
      if (academicYearFilter !== 'All' && s.academicYear !== academicYearFilter) return false;
      // Class Filter
      if (classFilter !== 'All' && s.currentClass !== classFilter) return false;
      // Section Filter
      if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
      // Student Group Filter
      if (studentGroupFilter === 'RTE' && !isRTEStudent(s)) return false;
      if (studentGroupFilter === 'General' && isRTEStudent(s)) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.studentName?.toLowerCase().includes(q) && !s.admissionNumber?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, academicYearFilter, classFilter, sectionFilter, studentGroupFilter, searchQuery]);

  const filteredStudents = useMemo(() => {
    return cohortStudents.filter(s => {
      const totalPending = getStudentTotalPending(s);
      // Quick filter
      if (quickFeeFilter === 'PENDING' && totalPending <= 0) return false;
      // Advanced filters (Exit Type & Fee Status)
      if (exitTypeFilter !== 'All' && s.studentStatus !== exitTypeFilter) return false;
      if (feeStatusFilter === 'Pending' && totalPending <= 0) return false;
      if (feeStatusFilter === 'Paid' && totalPending > 0) return false;
      return true;
    });
  }, [cohortStudents, quickFeeFilter, exitTypeFilter, feeStatusFilter]);

  // Stats computed from cohort (reflects academic year and other sub-cohort filters)
  const stats = {
    total: cohortStudents.length,
    graduated: cohortStudents.filter(s => s.studentStatus === 'Graduated').length,
    transferred: cohortStudents.filter(s => s.studentStatus === 'Transferred').length,
    discontinued: cohortStudents.filter(s => s.studentStatus === 'Discontinued').length,
    pendingFees: cohortStudents.filter(s => getStudentTotalPending(s) > 0).length,
  };
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(paginatedStudents.map(s => s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <Users className="mr-3 text-blue-600" size={32} />
            Old Students Archive
          </h1>
          <p className="text-gray-500 mt-2">Permanent archive of students who are no longer active in the school.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setIsExportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <FolderOpen className="h-4 w-4 mr-2" /> Export Center
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Total Old Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <GraduationCap className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Graduated</p>
            <p className="text-2xl font-bold text-gray-900">{stats.graduated}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Transferred</p>
            <p className="text-2xl font-bold text-gray-900">{stats.transferred}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <XCircle className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Discontinued</p>
            <p className="text-2xl font-bold text-gray-900">{stats.discontinued}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <IndianRupee className="h-6 w-6 text-blue-600 mb-2" />
            <p className="text-xs text-gray-500 font-medium">With Pending Fees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingFees}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Filter Bar */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5 text-gray-500" /> Filters
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={quickFeeFilter === 'ALL' ? 'default' : 'outline'} 
                  onClick={() => setQuickFeeFilter('ALL')}
                  className={quickFeeFilter === 'ALL' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  All Old Students
                </Button>
                <Button 
                  variant={quickFeeFilter === 'PENDING' ? 'default' : 'outline'} 
                  onClick={() => setQuickFeeFilter('PENDING')}
                  className={quickFeeFilter === 'PENDING' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  Pending Fees
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Search</Label>
                <Input 
                  placeholder="Name or Admin No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Exit Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={exitTypeFilter}
                  onChange={(e) => setExitTypeFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Completed">Completed</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label>Fee Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={feeStatusFilter}
                  onChange={(e) => setFeeStatusFilter(e.target.value)}
                >
                  <option value="All">All Students</option>
                  <option value="Pending">Pending Fees</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>

              <div>
                <Label>Last Class</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                <Label>Last Section</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                <Label>Last Academic Year</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                >
                  <option value="All">All Academic Years</option>
                  {uniqueAcademicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Student Group</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={studentGroupFilter}
                  onChange={(e) => setStudentGroupFilter(e.target.value)}
                >
                  <option value="All">All Students</option>
                  <option value="RTE">RTE Students</option>
                  <option value="General">General Students</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              <Button variant="outline" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                      checked={paginatedStudents.length > 0 && selectedStudentIds.length === paginatedStudents.length}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Exit Type</TableHead>
                  <TableHead>Class & Section</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Exit Date</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Pending Fee</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-32 text-gray-500">
                      No old students match the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student, index) => {
                    const totalPending = getStudentTotalPending(student);
                    const totalPaid = getStudentTotalPaid(student);
                    const totalFee = getStudentTotalFee(student);
                    const previousPending = getPreviousPending(student);
                    
                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Link to={`/dashboard/students/edit/${student._id}`} className="text-blue-600 hover:underline">
                            {student.studentName}
                          </Link>
                          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            getStudentCategoryLabel(student) === 'RTE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getStudentCategoryLabel(student)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {student.studentStatus}
                          </span>
                        </TableCell>
                        <TableCell>{student.currentClass} {student.section ? `- ${student.section}` : ''}</TableCell>
                        <TableCell>{student.academicYear || 'N/A'}</TableCell>
                        <TableCell>{new Date(student.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{totalFee.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">₹{totalPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {totalPending > 0 ? (
                            <div className="relative group inline-block">
                              <span className="text-red-600 cursor-pointer border-b border-dashed border-red-400 hover:text-red-700">
                                ₹{totalPending.toFixed(2)}
                              </span>
                              <div className={`absolute right-0 ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 invisible group-hover:visible bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 p-3 min-w-[220px] pointer-events-none transition-all duration-200`}>
                                <div className="font-bold border-b border-gray-100 pb-1 mb-1.5 text-gray-700 text-left">
                                  Pending Fees Breakdown
                                </div>
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                  {(student.studentFees || []).filter(f => f.remainingAmount > 0).map((f, idx) => (
                                    <div key={idx} className="flex justify-between gap-4 text-left font-normal">
                                      <span className="text-gray-600">{f.feeCategory?.name || f.feeCategoryId?.name || 'Unknown'}</span>
                                      <span className="font-semibold text-red-600">₹{f.remainingAmount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {previousPending > 0 && (
                                <span className="block text-xs text-purple-600 font-normal">(includes ₹{previousPending.toFixed(2)} carry-over)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">₹{totalPending.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {totalPending > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              PENDING
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              PAID
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {totalPending > 0 ? (
                            <Button 
                              size="sm" 
                              onClick={() => navigate('/dashboard/payments', { state: { studentId: student._id } })}
                              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-3"
                            >
                              Pay Pending
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Fully Paid</span>
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

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        selectedStudentIds={selectedStudentIds}
        defaultScope={selectedStudentIds.length > 0 ? (selectedStudentIds.length === 1 ? 'SINGLE' : 'SELECTED') : 'OLD_STUDENTS'}
        isOldStudentsPage={true}
      />
    </div>
  );
};

export default OldStudents;
