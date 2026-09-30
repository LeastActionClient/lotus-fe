import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Users, Upload, UserPlus, Eye, Folder, FolderOpen, ArrowLeft, Search, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link, useLocation } from 'react-router-dom';
import { getStudentCategoryLabel, isRTEStudent } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import ExportModal from '../components/ExportModal';
import { toastError, toastSuccess } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useClassesQuery, useQueryInvalidator, useStudentsQuery } from '../hooks/useSchoolQueries';

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const hasProgramFee = (student, keyword) =>
  (student.studentFees || []).some((fee) => {
    const feeName = normalizeText(fee.feeCategory?.name || fee.feeCategoryId?.name || fee.categoryName || '');
    return feeName.includes(keyword);
  });

const getStudentProgramType = (student) => {
  const hasTuition = hasProgramFee(student, 'tuition');
  const hasAbacus = hasProgramFee(student, 'abacus');

  if (hasTuition && hasAbacus) return 'BOTH';
  if (hasTuition) return 'TUITION';
  if (hasAbacus) return 'ABACUS';
  return 'OTHER';
};

const Students = () => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  const confirm = useConfirm();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const { data: studentsData = [], isLoading: studentsLoading } = useStudentsQuery();
  const { data: classesData = [], isLoading: classesLoading } = useClassesQuery();
  const { invalidateStudents, invalidateClasses, invalidateDashboard } = useQueryInvalidator();
  
  const normalizeClassName = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => {
      const preSchoolOrder = { 'prekg': 1, 'lkg': 2, 'ukg': 3 };
      const aNorm = normalizeClassName(a.name);
      const bNorm = normalizeClassName(b.name);
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
    });
  }, [classes]);
  
  const [viewMode, setViewMode] = useState('CLASSES');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState('ALL');
  const [studentGroupFilter, setStudentGroupFilter] = useState('All');
  const [studentProgramFilter, setStudentProgramFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editClassName, setEditClassName] = useState('');

  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [classLoading, setClassLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [editClassLoading, setEditClassLoading] = useState(false);
  const [editSectionLoading, setEditSectionLoading] = useState(false);
  const [viewLoadingId, setViewLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [academicHistory, setAcademicHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (studentsData) setStudents(studentsData);
  }, [studentsData]);

  useEffect(() => {
    if (classesData) setClasses(classesData);
  }, [classesData]);

  const openViewModal = async (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
    setViewLoadingId(student._id);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/academic-years/students/${student._id}/history`);
      setAcademicHistory(res.data || []);
    } catch (e) {
      console.error("Error fetching student history:", e);
      setAcademicHistory([]);
    } finally {
      setHistoryLoading(false);
      setViewLoadingId(null);
    }
  };

  const fetchStudents = async () => {
    await invalidateStudents();
  };

  const fetchClasses = async () => {
    await invalidateClasses();
  };

  useEffect(() => {
    if (classes.length > 0 && location.state) {
      const { fromClassId, fromSectionId, feeFilter, studentGroupFilter, studentProgramFilter, searchQuery } = location.state;
      if (fromClassId) {
        const clsObj = classes.find(c => c._id === fromClassId);
        if (clsObj) {
          setSelectedClass(clsObj);
          if (fromSectionId) {
            const secObj = clsObj.sections?.find(s => s._id === fromSectionId);
            if (secObj) {
              setSelectedSection(secObj);
              setViewMode('STUDENTS');
            } else {
              setViewMode('SECTIONS');
            }
          } else {
            setViewMode('SECTIONS');
          }
        }
      }
      if (feeFilter) setFeeFilter(feeFilter);
      if (studentGroupFilter) setStudentGroupFilter(studentGroupFilter);
      if (studentProgramFilter) setStudentProgramFilter(studentProgramFilter);
      if (searchQuery) {
        setSearchQuery(searchQuery);
        setViewMode('SEARCH_RESULTS');
      }
    }
  }, [classes, location.state]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassLoading(true);
    try {
      await api.post('/classes', { name: newClassName });
      setNewClassName('');
      setIsClassModalOpen(false);
      fetchClasses();
      toastSuccess('Class added successfully!');
    } catch (error) {
      console.error("Error creating class", error);
    } finally {
      setClassLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setSectionLoading(true);
    try {
      await api.post(`/classes/${selectedClass._id}/sections`, { name: newSectionName });
      setNewSectionName('');
      setIsSectionModalOpen(false);
      fetchClasses(); // Refresh classes which includes sections
      // Update selected class reference
      const res = await api.get('/classes');
      setClasses(res.data);
      setSelectedClass(res.data.find((c) => c._id === selectedClass._id));
    } catch (error) {
      console.error("Error creating section", error);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    setEditClassLoading(true);
    try {
      await api.put(`/classes/${editingClass._id}`, { name: editClassName });
      setEditClassName('');
      setEditingClass(null);
      setIsEditClassModalOpen(false);
      const res = await api.get('/classes');
      setClasses(res.data);
      if (selectedClass?._id === editingClass._id) {
        setSelectedClass(res.data.find((c) => c._id === editingClass._id));
      }
    } catch (error) {
      toastError(error.response?.data?.error || 'Error updating class');
    } finally {
      setEditClassLoading(false);
    }
  };

  const handleDeleteClass = async (cls) => {
    const accepted = await confirm({
      title: 'Delete Class',
      description: `Are you sure you want to delete Class ${cls.name}? All sections in this class will also be deleted.`,
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) return;

    setDeleteLoadingId(`class-${cls._id}`);
    try {
      await api.delete(`/classes/${cls._id}`);
      if (selectedClass?._id === cls._id) {
        setViewMode('CLASSES');
        setSelectedClass(null);
      }
      fetchClasses();
    } catch (error) {
      toastError(error.response?.data?.error || 'Error deleting class');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    if (!editingSection || !selectedClass) return;
    setEditSectionLoading(true);
    try {
      await api.put(`/classes/${selectedClass._id}/sections/${editingSection._id}`, { name: editSectionName });
      setEditSectionName('');
      setEditingSection(null);
      setIsEditSectionModalOpen(false);
      const res = await api.get('/classes');
      setClasses(res.data);
      setSelectedClass(res.data.find((c) => c._id === selectedClass._id));
    } catch (error) {
      toastError(error.response?.data?.error || 'Error updating section');
    } finally {
      setEditSectionLoading(false);
    }
  };

  const handleDeleteSection = async (sec) => {
    if (!selectedClass) return;
    const accepted = await confirm({
      title: 'Delete Section',
      description: `Are you sure you want to delete Section ${sec.name} from Class ${selectedClass.name}?`,
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) return;

    setDeleteLoadingId(`section-${sec._id}`);
    try {
      await api.delete(`/classes/${selectedClass._id}/sections/${sec._id}`);
      const res = await api.get('/classes');
      setClasses(res.data);
      setSelectedClass(res.data.find((c) => c._id === selectedClass._id));
    } catch (error) {
      toastError(error.response?.data?.error || 'Error deleting section');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeleteStudent = async (student) => {
    const accepted = await confirm({
      title: 'Delete Student?',
      description: 'This action cannot be undone. The following will also be deleted:',
      list: [
        'Fee Records',
        'Receipts',
        'Payment History',
        'Fee Concessions',
        'Academic Enrollment History',
        'Included Charges & Activities',
        'Uploaded Photos'
      ],
      confirmText: 'Delete Permanently',
      tone: 'danger'
    });

    if (!accepted) return;

    setDeleteLoadingId(`student-${student._id}`);
    try {
      const res = await api.delete(`/students/${student._id}`);
      toastSuccess(res.data?.message || 'Student deleted successfully');
      fetchStudents();
      invalidateDashboard();
    } catch (e) {
      toastError(e.response?.data?.error || 'Error deleting student');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const baseFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.studentStatus && s.studentStatus !== 'Active') return false;

      let match = false;
      if (viewMode === 'SEARCH_RESULTS') {
        const q = searchQuery.toLowerCase();
        const combinedClassSection = `${s.currentClass || ''} ${s.section || ''}`.toLowerCase();
        match = s.studentName.toLowerCase().includes(q) ||
               combinedClassSection.includes(q) ||
               s.admissionNumber.toLowerCase().includes(q);
      } else if (viewMode === 'STUDENTS') {
        match = s.currentClass === selectedClass?.name && s.section === selectedSection?.name;
      }

      if (!match) return false;

      if (studentGroupFilter === 'RTE' && !isRTEStudent(s)) return false;
      if (studentGroupFilter === 'General' && isRTEStudent(s)) return false;

      if (feeFilter !== 'ALL') {
        const totalPending = s.studentFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
        const hasFees = s.studentFees?.length > 0;
        if (feeFilter === 'PAID') {
          return hasFees && totalPending === 0;
        }
        if (feeFilter === 'PENDING') {
          return totalPending > 0;
        }
      }

      return true;
    });
  }, [students, viewMode, selectedClass, selectedSection, searchQuery, studentGroupFilter, feeFilter]);

  const studentProgramCounts = useMemo(() => {
    return baseFilteredStudents.reduce(
      (acc, student) => {
        if (hasProgramFee(student, 'tuition')) acc.TUITION++;
        if (hasProgramFee(student, 'abacus')) acc.ABACUS++;
        return acc;
      },
      { TUITION: 0, ABACUS: 0 }
    );
  }, [baseFilteredStudents]);

  const filteredStudents = useMemo(() => {
    if (studentProgramFilter === 'ALL') return baseFilteredStudents;
    if (studentProgramFilter === 'TUITION') {
      return baseFilteredStudents.filter((student) => hasProgramFee(student, 'tuition'));
    }
    if (studentProgramFilter === 'ABACUS') {
      return baseFilteredStudents.filter((student) => hasProgramFee(student, 'abacus'));
    }
    return baseFilteredStudents;
  }, [baseFilteredStudents, studentProgramFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedClass, selectedSection, searchQuery, feeFilter, studentGroupFilter, studentProgramFilter]);

  useEffect(() => {
    // Keep selection in sync with the current filtered view so exports do not use stale rows.
    setSelectedStudentIds([]);
  }, [viewMode, selectedClass, selectedSection, searchQuery, feeFilter, studentGroupFilter, studentProgramFilter]);

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

  if (studentsLoading || classesLoading) return <PageLoader />;

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() === '') {
      setViewMode('CLASSES');
    } else {
      setViewMode('SEARCH_RESULTS');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <Users className="mr-3 text-blue-600" size={32} />
            Students Directory
          </h1>
          <p className="text-gray-500  mt-2">Manage all enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsExportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <FolderOpen className="h-4 w-4 mr-2" /> Export Center
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name, class (e.g. 12 B)..." 
              className="pl-9 w-full sm:w-64 md:w-80"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {viewMode === 'CLASSES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Classes</h2>
            <Button onClick={() => setIsClassModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Class
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedClasses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No classes found. Add one to get started.</div>
            ) : (
              sortedClasses.map((cls) => (
                <Card 
                  key={cls._id} 
                  className="cursor-pointer hover:border-blue-600 hover:shadow-md transition-all group relative"
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingClass(cls); setEditClassName(cls.name); setIsEditClassModalOpen(true); }}
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit Class"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls); }}
                      disabled={deleteLoadingId === `class-${cls._id}`}
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Class"
                    >
                      {deleteLoadingId === `class-${cls._id}` ? (
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <CardContent 
                    className="p-6 flex flex-col items-center justify-center text-center space-y-3"
                    onClick={() => { setSelectedClass(cls); setViewMode('SECTIONS'); }}
                  >
                    <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-600 transition-colors">
                      <Folder className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 ">{cls.name}</h3>
                      <p className="text-xs text-gray-500">{cls.sections?.length || 0} Sections</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'SECTIONS' && selectedClass && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('CLASSES')} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">Class {selectedClass.name} - Sections</h2>
            </div>
            <Button onClick={() => setIsSectionModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Section
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedClass.sections?.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No sections found for this class. Add one.</div>
            ) : (
              selectedClass.sections?.map((sec) => (
                <Card 
                  key={sec._id} 
                  className="cursor-pointer hover:border-blue-600 hover:shadow-md transition-all group relative"
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSection(sec); setEditSectionName(sec.name); setIsEditSectionModalOpen(true); }}
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit Section"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec); }}
                      disabled={deleteLoadingId === `section-${sec._id}`}
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Section"
                    >
                      {deleteLoadingId === `section-${sec._id}` ? (
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <CardContent 
                    className="p-6 flex flex-col items-center justify-center text-center space-y-3"
                    onClick={() => { setSelectedSection(sec); setViewMode('STUDENTS'); }}
                  >
                    <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-600 transition-colors">
                      <FolderOpen className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 ">Section {sec.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {(viewMode === 'STUDENTS' || viewMode === 'SEARCH_RESULTS') && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            {viewMode === 'STUDENTS' && (
              <Button variant="ghost" size="sm" onClick={() => setViewMode('SECTIONS')} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-xl font-semibold flex-1">
              {viewMode === 'SEARCH_RESULTS' ? 'Search Results' : `Class ${selectedClass?.name} - Section ${selectedSection?.name} Students`}
            </h2>
            <div className="flex flex-wrap gap-2">
              <select 
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
              >
                <option value="ALL">All Fee Status</option>
                <option value="PAID">Fully Paid</option>
                <option value="PENDING">Pending Dues</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={studentGroupFilter}
                onChange={(e) => setStudentGroupFilter(e.target.value)}
              >
                <option value="All">All Groups</option>
                <option value="RTE">RTE</option>
                <option value="General">General</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={studentProgramFilter}
                onChange={(e) => setStudentProgramFilter(e.target.value)}
              >
                <option value="ALL">All Programs</option>
                <option value="TUITION">Tuition ({studentProgramCounts.TUITION})</option>
                <option value="ABACUS">Abacus ({studentProgramCounts.ABACUS})</option>
                {/* <option value="BOTH">Tuition + Abacus ({studentProgramCounts.BOTH})</option>
                <option value="OTHER">Other ({studentProgramCounts.OTHER})</option> */}
              </select>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
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
                    <TableHead>Class & Section</TableHead>
                    <TableHead>Prev Year Paid</TableHead>
                    <TableHead>Prev Pend</TableHead>
                    <TableHead>Curr Year Paid</TableHead>
                    <TableHead>Curr Pend</TableHead>
                    <TableHead>Father Mobile</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-32 text-gray-500">
                        {viewMode === 'SEARCH_RESULTS' ? 'No results found.' : 'No students found in this section.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {student.studentName}
                          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            getStudentCategoryLabel(student) === 'RTE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getStudentCategoryLabel(student)}
                          </span>
                        </TableCell>
                        <TableCell>{student.currentClass} - {student.section}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          Rs. {student.previousPaid !== undefined ? student.previousPaid : (student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0)}
                        </TableCell>
                        <TableCell className={`font-medium ${(student.previousPending !== undefined ? student.previousPending : student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.remainingAmount || 0), 0)) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          Rs. {student.previousPending !== undefined ? student.previousPending : (student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          Rs. {student.currentPaid !== undefined ? student.currentPaid : (student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0)}
                        </TableCell>
                        <TableCell className={`font-medium ${(student.currentPending !== undefined ? student.currentPending : student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.remainingAmount || 0), 0)) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          Rs. {student.currentPending !== undefined ? student.currentPending : (student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0)}
                        </TableCell>
                        <TableCell>{student.fatherPhone}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(student)}
                            loading={viewLoadingId === student._id}
                            loadingText="Loading..."
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                          <Link to={`/dashboard/students/edit/${student._id}`} state={{ fromClassId: selectedClass?._id, fromSectionId: selectedSection?._id, feeFilter, studentGroupFilter, studentProgramFilter, searchQuery }}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                          </Link>
                          {currentUser.role === 'SUPER_ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteStudent(student)}
                              loading={deleteLoadingId === `student-${student._id}`}
                              loadingText="Deleting..."
                            >
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
      </div>
      )}

      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Add New Class">
        <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="newClassName">Class Name</Label>
            <Input 
              id="newClassName" 
              value={newClassName} 
              onChange={(e) => setNewClassName(e.target.value)} 
              required 
              placeholder="e.g. 10" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={classLoading} loadingText="Saving...">Add Class</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Add New Section">
        <form onSubmit={handleCreateSection} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="newSectionName">Section Name</Label>
            <Input 
              id="newSectionName" 
              value={newSectionName} 
              onChange={(e) => setNewSectionName(e.target.value.replace(/[^a-zA-Z]/g, ''))} 
              required 
              placeholder="e.g. A" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={sectionLoading} loadingText="Saving...">Add Section</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditClassModalOpen} onClose={() => { setIsEditClassModalOpen(false); setEditingClass(null); setEditClassName(''); }} title="Edit Class">
        <form onSubmit={handleEditClass} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="editClassName">Class Name</Label>
            <Input 
              id="editClassName" 
              value={editClassName} 
              onChange={(e) => setEditClassName(e.target.value)} 
              required 
              placeholder="e.g. 10" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => { setIsEditClassModalOpen(false); setEditingClass(null); setEditClassName(''); }}>Cancel</Button>
            <Button type="submit" loading={editClassLoading} loadingText="Saving...">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditSectionModalOpen} onClose={() => { setIsEditSectionModalOpen(false); setEditingSection(null); setEditSectionName(''); }} title="Edit Section">
        <form onSubmit={handleEditSection} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="editSectionName">Section Name</Label>
            <Input 
              id="editSectionName" 
              value={editSectionName} 
              onChange={(e) => setEditSectionName(e.target.value.replace(/[^a-zA-Z]/g, ''))} 
              required 
              placeholder="e.g. A" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => { setIsEditSectionModalOpen(false); setEditingSection(null); setEditSectionName(''); }}>Cancel</Button>
            <Button type="submit" loading={editSectionLoading} loadingText="Saving...">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details" className="max-w-4xl">
        {selectedStudent && (
          <div className="space-y-5">
            {/* Personal Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">Personal Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Admission No</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{selectedStudent.admissionNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Student Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedStudent.studentName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-sm text-gray-900">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm text-gray-900">{selectedStudent.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm text-gray-900">{selectedStudent.bloodGroup || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Aadhaar Number</p>
                  <p className="text-sm text-gray-900">{selectedStudent.aadhaarNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Religion</p>
                  <p className="text-sm text-gray-900">{selectedStudent.religion || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Community</p>
                  <p className="text-sm text-gray-900">{selectedStudent.community || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Caste</p>
                  <p className="text-sm text-gray-900">{selectedStudent.caste || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nationality</p>
                  <p className="text-sm text-gray-900">{selectedStudent.nationality || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enrollment Date</p>
                  <p className="text-sm text-gray-900">{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">Academic Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="text-sm font-medium text-gray-900">{selectedStudent.currentClass || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Section</p>
                  <p className="text-sm text-gray-900">{selectedStudent.section || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Roll Number</p>
                  <p className="text-sm text-gray-900">{selectedStudent.rollNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">EMIS No</p>
                  <p className="text-sm text-gray-900">{selectedStudent.emisNo || selectedStudent.emisNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Admission Date</p>
                  <p className="text-sm text-gray-900">{selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="text-sm text-gray-900">{selectedStudent.academicYear || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Student Status</p>
                  <p className={`text-sm font-medium ${selectedStudent.studentStatus === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{selectedStudent.studentStatus || 'Active'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Course Group</p>
                  <p className="text-sm text-gray-900">{selectedStudent.RTE === 'RTE' ? 'RTE' : 'General'}</p>
                </div>
              </div>
            </div>

            {/* Parent Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">Parent Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Father Name</p>
                  <p className="text-sm text-gray-900">{selectedStudent.fatherName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Father Mobile</p>
                  <p className="text-sm text-gray-900">{selectedStudent.fatherPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Father Occupation</p>
                  <p className="text-sm text-gray-900">{selectedStudent.fatherOccupation || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mother Name</p>
                  <p className="text-sm text-gray-900">{selectedStudent.motherName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mother Mobile</p>
                  <p className="text-sm text-gray-900">{selectedStudent.motherPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mother Occupation</p>
                  <p className="text-sm text-gray-900">{selectedStudent.motherOccupation || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Guardian Name</p>
                  <p className="text-sm text-gray-900">{selectedStudent.guardianName || selectedStudent.guardian || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">WhatsApp Number</p>
                  <p className="text-sm text-gray-900">{selectedStudent.whatsappNumber || '-'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">Address</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-4">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{selectedStudent.address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm text-gray-900">{selectedStudent.city || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">State</p>
                  <p className="text-sm text-gray-900">{selectedStudent.state || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pincode</p>
                  <p className="text-sm text-gray-900">{selectedStudent.pincode || '-'}</p>
                </div>
              </div>
            </div>

            {/* Academic Journey History */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Academic Journey History</p>
              {historyLoading ? (
                <p className="text-xs text-gray-500">Loading academic history...</p>
              ) : academicHistory.length === 0 ? (
                <p className="text-xs text-gray-500">No promotion history found.</p>
              ) : (
                <div className="relative border-l-2 border-blue-200 ml-2 pl-4 space-y-4 py-1">
                  {academicHistory.map((h, idx) => (
                    <div key={h._id || idx} className="relative">
                      <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                      <p className="text-xs font-bold text-gray-800 tracking-wider uppercase">{h.academicYear}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Class {h.className} {h.sectionName && `(Section ${h.sectionName})`} &bull; Status: <span className="font-semibold text-blue-600">{h.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-200">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedStudentIds={selectedStudentIds}
        filteredStudentIds={filteredStudents.map(student => student._id)}
        defaultScope={
          selectedStudentIds.length > 0
            ? (selectedStudentIds.length === 1 ? 'SINGLE' : 'SELECTED')
            : 'FILTERED'
        }
      />

    </div>
  );
};

export default Students;
