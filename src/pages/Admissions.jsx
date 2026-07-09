import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { UserPlus, Eye, Upload, Plus, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { isRccStudent } from '../utils/studentCategory';

const Admissions = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [studentGroupFilter, setStudentGroupFilter] = useState('All');
  
  const [manualForm, setManualForm] = useState({
    studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '', admissionNumber: '',
    dateOfBirth: '', gender: '', bloodGroup: '', aadhaarNumber: '', religion: '', community: '', caste: '', rcc: '', nationality: '', 
    fatherOccupation: '', motherOccupation: '', guardian: '', city: '', state: '', pincode: '', whatsappNumber: '', emisNumber: '',
    isRcc: false
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching admissions", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error("Error fetching classes", error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert("Please select a class first in the main screen.");
      return;
    }
    try {
      await api.post('/students/manual', { ...manualForm, rcc: manualForm.isRcc ? 'RCC' : 'General', currentClass: selectedClass, section: selectedSection });
      setIsManualModalOpen(false);
      setManualForm({ 
        studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '', admissionNumber: '',
        dateOfBirth: '', gender: '', bloodGroup: '', aadhaarNumber: '', religion: '', community: '', caste: '', rcc: '', nationality: '', 
        fatherOccupation: '', motherOccupation: '', guardian: '', city: '', state: '', pincode: '', whatsappNumber: '', emisNumber: '',
        isRcc: false
      });
      fetchStudents();
      alert("Student added successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Error adding student.");
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !file) {
      alert("Please select a class and an Excel file.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('currentClass', selectedClass);
    if (selectedSection) formData.append('section', selectedSection);

    try {
      const res = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsImportModalOpen(false);
      setFile(null);
      fetchStudents();
      
      if (res.data.errors) {
        alert(res.data.message + "\n\nErrors:\n" + res.data.errors.join("\n"));
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error importing students.");
    }
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const visibleStudents = students.filter(student => {
    if (studentGroupFilter === 'RCC') return isRccStudent(student);
    if (studentGroupFilter === 'General') return !isRccStudent(student);
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / itemsPerPage));
  const paginatedStudents = visibleStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [students.length, selectedClass, selectedSection, studentGroupFilter]);

  const currentClassObj = classes.find(c => c.name === selectedClass);
  const sections = currentClassObj ? currentClassObj.sections : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          <UserPlus className="mr-3 text-orange-600" size={32} />
          Admissions
        </h1>
        <p className="text-gray-500 mt-2">Manage student admissions and enrollments</p>
      </div>

      <Card className="bg-orange-50 border-orange-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex w-full md:flex-1 gap-4">
              <div className="flex-1 space-y-1">
                <Label>Class</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c._id || c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="whitespace-nowrap">Section (Optional)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass || sections.length === 0}
                >
                  <option value="">No Section</option>
                  {sections.map((s) => (
                    <option key={s._id || s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="space-y-1 min-w-44">
                <Label>Student Group</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={studentGroupFilter}
                  onChange={(e) => setStudentGroupFilter(e.target.value)}
                >
                  <option value="All">All Students</option>
                  <option value="RCC">RCC Students</option>
                  <option value="General">General Students</option>
                </select>
              </div>
              <Button onClick={() => {
                if (!selectedClass) { alert("Please select a class first"); return; }
                setIsImportModalOpen(true);
              }} className="flex items-center bg-orange-100 text-orange-700 hover:bg-orange-200" type="button">
                <Upload className="h-4 w-4 mr-2" /> Bulk Import
              </Button>
              <Button onClick={() => {
                if (!selectedClass) { alert("Please select a class first"); return; }
                setIsManualModalOpen(true);
              }} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parents</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-gray-500">
                    No recent admissions.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow key={student._id || student.id}>
                    <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell>{student.currentClass} {student.section && `- ${student.section}`}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-gray-500">F:</span> {student.fatherName}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">M:</span> {student.motherName}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {student.addedById?.username || 'System/Unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(student)}>
                        <Eye className="h-4 w-4 text-orange-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details" className="max-w-4xl">
        {selectedStudent && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-medium text-gray-900">{selectedStudent.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Admission No</p>
                  <p className="font-mono text-gray-900">{selectedStudent.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">EMIS No</p>
                  <p className="font-mono text-gray-900">{selectedStudent.emisNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class & Section</p>
                  <p className="font-medium text-gray-900">{selectedStudent.currentClass} {selectedStudent.section && `- ${selectedStudent.section}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enrollment Date</p>
                  <p className="text-gray-900">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-gray-900">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-gray-900">{selectedStudent.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="text-gray-900">{selectedStudent.bloodGroup || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aadhaar No</p>
                  <p className="text-gray-900">{selectedStudent.aadhaarNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Religion</p>
                  <p className="text-gray-900">{selectedStudent.religion || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Community</p>
                  <p className="text-gray-900">{selectedStudent.community || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Caste</p>
                  <p className="text-gray-900">{selectedStudent.caste || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RCC</p>
                  <p className="text-gray-900">{selectedStudent.rcc || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="text-gray-900">{selectedStudent.nationality || '-'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Parent & Guardian Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Father Name</p>
                  <p className="text-gray-900">{selectedStudent.fatherName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother Name</p>
                  <p className="text-gray-900">{selectedStudent.motherName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guardian Name</p>
                  <p className="text-gray-900">{selectedStudent.guardian || '-'}</p>
                </div>
                <div className="hidden md:block"></div> {/* spacer */}
                <div>
                  <p className="text-sm text-gray-500">Father Phone</p>
                  <p className="text-gray-900">{selectedStudent.fatherPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother Phone</p>
                  <p className="text-gray-900">{selectedStudent.motherPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Whatsapp Number</p>
                  <p className="text-gray-900">{selectedStudent.whatsappNumber || '-'}</p>
                </div>
                <div className="hidden md:block"></div> {/* spacer */}
                <div>
                  <p className="text-sm text-gray-500">Father Occupation</p>
                  <p className="text-gray-900">{selectedStudent.fatherOccupation || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother Occupation</p>
                  <p className="text-gray-900">{selectedStudent.motherOccupation || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4">
                  <p className="text-sm text-gray-500">Street Address</p>
                  <p className="text-gray-900">{selectedStudent.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="text-gray-900">{selectedStudent.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="text-gray-900">{selectedStudent.state || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pincode</p>
                  <p className="text-gray-900">{selectedStudent.pincode || '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end sticky bottom-0 bg-white border-t py-3 z-10">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Student Manually" className="max-w-4xl">
        <form onSubmit={handleManualSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          <div className="bg-orange-50 p-3 rounded-md border border-orange-100 flex items-center sticky top-0 z-10 shadow-sm">
            <Users className="text-orange-600 mr-2 h-5 w-5" />
            <span className="text-sm font-medium text-orange-900">
              Adding to Class: {selectedClass} {selectedSection && `(Section ${selectedSection})`}
            </span>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Admission Number</Label>
                <Input value={manualForm.admissionNumber} onChange={(e) => setManualForm({...manualForm, admissionNumber: e.target.value})} placeholder="Auto-generated if empty" />
              </div>
              <div className="space-y-2">
                <Label>EMIS No</Label>
                <Input value={manualForm.emisNumber} onChange={(e) => setManualForm({...manualForm, emisNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input required value={manualForm.studentName} onChange={(e) => setManualForm({...manualForm, studentName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={manualForm.dateOfBirth} onChange={(e) => setManualForm({...manualForm, dateOfBirth: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={manualForm.gender} onChange={(e) => setManualForm({...manualForm, gender: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Input value={manualForm.bloodGroup} onChange={(e) => setManualForm({...manualForm, bloodGroup: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar No</Label>
                <Input value={manualForm.aadhaarNumber} onChange={(e) => setManualForm({...manualForm, aadhaarNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Input value={manualForm.religion} onChange={(e) => setManualForm({...manualForm, religion: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Community</Label>
                <Input value={manualForm.community} onChange={(e) => setManualForm({...manualForm, community: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Caste</Label>
                <Input value={manualForm.caste} onChange={(e) => setManualForm({...manualForm, caste: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>RCC</Label>
                <Input value={manualForm.rcc} onChange={(e) => setManualForm({...manualForm, rcc: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={manualForm.nationality} onChange={(e) => setManualForm({...manualForm, nationality: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label className="font-bold text-gray-900">Student Group</Label>
                <label className="flex items-center gap-3 rounded-md border-2 border-purple-300 bg-purple-50/30 px-3 py-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={manualForm.isRcc || false}
                    onChange={(e) => setManualForm({ ...manualForm, isRcc: e.target.checked })}
                    className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-600"
                  />
                  <span>{manualForm.isRcc ? 'RCC Course Student' : 'General (Non-RCC) Student'}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Parent & Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Father Name</Label>
                <Input value={manualForm.fatherName} onChange={(e) => setManualForm({...manualForm, fatherName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mother Name</Label>
                <Input value={manualForm.motherName} onChange={(e) => setManualForm({...manualForm, motherName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input value={manualForm.guardian} onChange={(e) => setManualForm({...manualForm, guardian: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Father Phone</Label>
                <Input value={manualForm.fatherPhone} onChange={(e) => setManualForm({...manualForm, fatherPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mother Phone</Label>
                <Input value={manualForm.motherPhone} onChange={(e) => setManualForm({...manualForm, motherPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Whatsapp Number</Label>
                <Input value={manualForm.whatsappNumber} onChange={(e) => setManualForm({...manualForm, whatsappNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Father Occupation</Label>
                <Input value={manualForm.fatherOccupation} onChange={(e) => setManualForm({...manualForm, fatherOccupation: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mother Occupation</Label>
                <Input value={manualForm.motherOccupation} onChange={(e) => setManualForm({...manualForm, motherOccupation: e.target.value})} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Address Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input value={manualForm.address} onChange={(e) => setManualForm({...manualForm, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={manualForm.city} onChange={(e) => setManualForm({...manualForm, city: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={manualForm.state} onChange={(e) => setManualForm({...manualForm, state: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={manualForm.pincode} onChange={(e) => setManualForm({...manualForm, pincode: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-white border-t py-3 z-10">
            <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Student</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Bulk Import Students">
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-md mb-4 border border-orange-100 flex items-center">
            <Users className="text-orange-600 mr-2 h-5 w-5" />
            <span className="text-sm font-medium text-orange-900">
              Importing to Class: {selectedClass} {selectedSection && `(Section ${selectedSection})`}
            </span>
          </div>

          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-100 mb-4">
            <strong>Expected Excel Columns:</strong>
            <ul className="list-disc ml-5 mt-1 grid grid-cols-2 gap-x-4">
              <li>Student Name (Required)</li>
              <li>Admission No</li>
              <li>EMIS No</li>
              <li>DOB (YYYY-MM-DD)</li>
              <li>Gender / Sex</li>
              <li>Blood Group</li>
              <li>Aadhar No</li>
              <li>Religion</li>
              <li>Community</li>
              <li>Caste</li>
              <li>RCC</li>
              <li>Nationality</li>
              <li>Father Name</li>
              <li>Father Phone</li>
              <li>Father Occupation</li>
              <li>Mother Name</li>
              <li>Mother Phone</li>
              <li>Mother Occupation</li>
              <li>Guardian Name</li>
              <li>Whatsapp Number</li>
              <li>Address</li>
              <li>City</li>
              <li>State</li>
              <li>Pincode</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Label>Select Excel File (.xlsx, .csv)</Label>
            <Input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              required 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="pt-1.5"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!file} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" /> Upload & Import
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Admissions;
