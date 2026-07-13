import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Users, Upload, UserPlus, Eye, Folder, FolderOpen, ArrowLeft, Search, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link } from 'react-router-dom';
import { getStudentCategoryLabel, isRTEStudent } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import ExportModal from '../components/ExportModal';


const Students = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [viewMode, setViewMode] = useState('CLASSES');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState('ALL');
  const [studentGroupFilter, setStudentGroupFilter] = useState('All');
  const [loading, setLoading] = useState(true);
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

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
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

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', { name: newClassName });
      setNewClassName('');
      setIsClassModalOpen(false);
      fetchClasses();
    } catch (error) {
      console.error("Error creating class", error);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
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
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
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
      alert(error.response?.data?.error || 'Error updating class');
    }
  };

  const handleDeleteClass = async (cls) => {
    if (!window.confirm(`Are you sure you want to delete Class ${cls.name}? All sections in this class will also be deleted.`)) return;
    try {
      await api.delete(`/classes/${cls._id}`);
      if (selectedClass?._id === cls._id) {
        setViewMode('CLASSES');
        setSelectedClass(null);
      }
      fetchClasses();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting class');
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    if (!editingSection || !selectedClass) return;
    try {
      await api.put(`/classes/${selectedClass._id}/sections/${editingSection._id}`, { name: editSectionName });
      setEditSectionName('');
      setEditingSection(null);
      setIsEditSectionModalOpen(false);
      const res = await api.get('/classes');
      setClasses(res.data);
      setSelectedClass(res.data.find((c) => c._id === selectedClass._id));
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating section');
    }
  };

  const handleDeleteSection = async (sec) => {
    if (!selectedClass) return;
    if (!window.confirm(`Are you sure you want to delete Section ${sec.name} from Class ${selectedClass.name}?`)) return;
    try {
      await api.delete(`/classes/${selectedClass._id}/sections/${sec._id}`);
      const res = await api.get('/classes');
      setClasses(res.data);
      setSelectedClass(res.data.find((c) => c._id === selectedClass._id));
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting section');
    }
  };

  const filteredStudents = students.filter(s => {
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
      const totalPending = s.studentFees?.reduce((sum, f) => sum + f.remainingAmount, 0) || 0;
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

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedClass, selectedSection, searchQuery, feeFilter, studentGroupFilter]);

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
            <Users className="mr-3 text-orange-600" size={32} />
            Students Directory
          </h1>
          <p className="text-gray-500  mt-2">Manage all enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsExportModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
            <FolderOpen className="h-4 w-4 mr-2" /> Export Center
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name, class (e.g. 12 B)..." 
              className="pl-9 w-64 md:w-80"
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
            {classes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No classes found. Add one to get started.</div>
            ) : (
              classes.map((cls) => (
                <Card 
                  key={cls._id} 
                  className="cursor-pointer hover:border-orange-600 hover:shadow-md transition-all group relative"
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
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CardContent 
                    className="p-6 flex flex-col items-center justify-center text-center space-y-3"
                    onClick={() => { setSelectedClass(cls); setViewMode('SECTIONS'); }}
                  >
                    <div className="p-3 bg-orange-50 rounded-full group-hover:bg-orange-600 transition-colors">
                      <Folder className="h-8 w-8 text-orange-600 group-hover:text-white transition-colors" />
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
            <div className="flex items-center gap-3">
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
                  className="cursor-pointer hover:border-orange-600 hover:shadow-md transition-all group relative"
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
                      className="p-1.5 rounded-md bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CardContent 
                    className="p-6 flex flex-col items-center justify-center text-center space-y-3"
                    onClick={() => { setSelectedSection(sec); setViewMode('STUDENTS'); }}
                  >
                    <div className="p-3 bg-orange-50 rounded-full group-hover:bg-orange-600 transition-colors">
                      <FolderOpen className="h-8 w-8 text-orange-600 group-hover:text-white transition-colors" />
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
          <div className="flex items-center gap-3 mb-4">
            {viewMode === 'STUDENTS' && (
              <Button variant="ghost" size="sm" onClick={() => setViewMode('SECTIONS')} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-xl font-semibold flex-1">
              {viewMode === 'SEARCH_RESULTS' ? 'Search Results' : `Class ${selectedClass?.name} - Section ${selectedSection?.name} Students`}
            </h2>
            <select 
              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
            >
              <option value="ALL">All Fee Status</option>
              <option value="PAID">Fully Paid</option>
              <option value="PENDING">Pending Dues</option>
            </select>
            <select
              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
              value={studentGroupFilter}
              onChange={(e) => setStudentGroupFilter(e.target.value)}
            >
              <option value="All">All Groups</option>
              <option value="RTE">RTE</option>
              <option value="General">General</option>
            </select>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-4 w-4 cursor-pointer"
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
                      <TableCell colSpan={5} className="text-center h-32 text-gray-500">
                        {viewMode === 'SEARCH_RESULTS' ? 'No matching students found.' : 'No students found in this section.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-4 w-4 cursor-pointer"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                        <TableCell className="font-medium text-orange-600">
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
                        <TableCell className="text-green-600 font-medium">Rs. {student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0}</TableCell>
                        <TableCell className={`font-medium ${student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          Rs. {student.studentFees?.filter(f => (f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass)).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">Rs. {student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0}</TableCell>
                        <TableCell className={`font-medium ${student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          Rs. {student.studentFees?.filter(f => !((f.academicYear && student.academicYear && f.academicYear !== student.academicYear) || (!f.academicYear && f.className && student.currentClass && f.className !== student.currentClass))).reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0}
                        </TableCell>
                        <TableCell>{student.fatherPhone}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewModal(student)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                          <Link to={`/dashboard/students/edit/${student._id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                          </Link>
                          {currentUser.role === 'SUPER_ADMIN' && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                              if(window.confirm('Are you sure you want to delete this student?')) {
                                try {
                                  await api.delete(`/students/${student._id}`);
                                  fetchStudents();
                                } catch(e) { 
                              alert(e.response?.data?.error || 'Error deleting student'); 
                            }
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
            <Button type="submit">Add Class</Button>
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
              onChange={(e) => setNewSectionName(e.target.value)} 
              required 
              placeholder="e.g. A" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Section</Button>
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
            <Button type="submit">Save Changes</Button>
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
              onChange={(e) => setEditSectionName(e.target.value)} 
              required 
              placeholder="e.g. A" 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            <Button type="button" variant="ghost" onClick={() => { setIsEditSectionModalOpen(false); setEditingSection(null); setEditSectionName(''); }}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 ">Student Name</p>
                <p className="font-medium text-gray-900 ">{selectedStudent.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Admission No</p>
                <p className="font-mono text-gray-900 ">{selectedStudent.admissionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Class & Section</p>
                <p className="font-medium text-gray-900 ">{selectedStudent.currentClass} {selectedStudent.section && `- ${selectedStudent.section}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Enrollment Date</p>
                <p className="text-gray-900 ">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200  pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 ">Father Name</p>
                <p className="text-gray-900 ">{selectedStudent.fatherName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Mother Name</p>
                <p className="text-gray-900 ">{selectedStudent.motherName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Father Phone</p>
                <p className="text-gray-900 ">{selectedStudent.fatherPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 ">Mother Phone</p>
                <p className="text-gray-900 ">{selectedStudent.motherPhone}</p>
              </div>
            </div>

            <div className="border-t border-gray-200  pt-4">
              <p className="text-sm text-gray-500 ">Address</p>
              <p className="text-gray-900 ">{selectedStudent.address}</p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedStudentIds={selectedStudentIds}
        defaultScope={selectedStudentIds.length > 0 ? (selectedStudentIds.length === 1 ? 'SINGLE' : 'SELECTED') : 'CLASS'}
      />

    </div>
  );
};

export default Students;
