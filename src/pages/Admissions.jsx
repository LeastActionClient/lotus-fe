import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { UserPlus, Eye, Upload, Plus, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const Admissions = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [manualForm, setManualForm] = useState({
    studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '', admissionNumber: ''
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
      await api.post('/students/manual', { ...manualForm, currentClass: selectedClass, section: selectedSection });
      setIsManualModalOpen(false);
      setManualForm({ studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '', admissionNumber: '' });
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
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <Label>Section (Optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass || sections.length === 0}
              >
                <option value="">No Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
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
                students.map((student) => (
                  <TableRow key={student.id}>
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
                        {student.addedBy?.username || 'System/Unknown'}
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
        </CardContent>
      </Card>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-medium text-gray-900">{selectedStudent.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admission No</p>
                <p className="font-mono text-gray-900">{selectedStudent.admissionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class & Section</p>
                <p className="font-medium text-gray-900">{selectedStudent.currentClass} {selectedStudent.section && `- ${selectedStudent.section}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enrollment Date</p>
                <p className="text-gray-900">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Father Name</p>
                <p className="text-gray-900">{selectedStudent.fatherName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mother Name</p>
                <p className="text-gray-900">{selectedStudent.motherName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Father Phone</p>
                <p className="text-gray-900">{selectedStudent.fatherPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mother Phone</p>
                <p className="text-gray-900">{selectedStudent.motherPhone}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900">{selectedStudent.address}</p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Student Manually">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-md mb-4 border border-orange-100 flex items-center">
            <Users className="text-orange-600 mr-2 h-5 w-5" />
            <span className="text-sm font-medium text-orange-900">
              Adding to Class: {selectedClass} {selectedSection && `(Section ${selectedSection})`}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Admission Number</Label>
              <Input value={manualForm.admissionNumber} onChange={(e) => setManualForm({...manualForm, admissionNumber: e.target.value})} placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label>Student Name *</Label>
              <Input required value={manualForm.studentName} onChange={(e) => setManualForm({...manualForm, studentName: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Father Name</Label>
              <Input value={manualForm.fatherName} onChange={(e) => setManualForm({...manualForm, fatherName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mother Name</Label>
              <Input value={manualForm.motherName} onChange={(e) => setManualForm({...manualForm, motherName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Father Phone</Label>
              <Input value={manualForm.fatherPhone} onChange={(e) => setManualForm({...manualForm, fatherPhone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mother Phone</Label>
              <Input value={manualForm.motherPhone} onChange={(e) => setManualForm({...manualForm, motherPhone: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={manualForm.address} onChange={(e) => setManualForm({...manualForm, address: e.target.value})} />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
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
              <li>Admission No (Optional)</li>
              <li>DOB (YYYY-MM-DD)</li>
              <li>Gender / Sex</li>
              <li>Blood Group</li>
              <li>Aadhar No</li>
              <li>Religion</li>
              <li>Community / Caste</li>
              <li>Nationality</li>
              <li>Father Name</li>
              <li>Father Phone</li>
              <li>Father Occupation</li>
              <li>Mother Name</li>
              <li>Mother Phone</li>
              <li>Mother Occupation</li>
              <li>Guardian Name</li>
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
