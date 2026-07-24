import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { UserPlus, Eye, Upload, Plus, Users, Pencil, Save, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { isRTEStudent } from '../utils/studentCategory';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';

const Admissions = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    studentName: '', currentClass: '', section: '',
    fatherName: '', motherName: '', fatherPhone: '', motherPhone: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [fullStudentData, setFullStudentData] = useState(null);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [studentGroupFilter, setStudentGroupFilter] = useState('All');
  const [pageLoading, setPageLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  const [manualForm, setManualForm] = useState({
    admissionNumber: '',
    studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '',
    dateOfBirth: '', gender: '', bloodGroup: '', aadhaarNumber: '', religion: '', community: '', caste: '', RTE: '', nationality: '', 
    fatherOccupation: '', motherOccupation: '', guardian: '', city: '', state: '', pincode: '', whatsappNumber: '', emisNumber: '',
    isRTE: false
  });
  const [file, setFile] = useState(null);
  const [activeYear, setActiveYear] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchClasses().then((fetchedClasses) => {
      const urlParams = new URLSearchParams(window.location.search);
      const appId = urlParams.get('applicationId');
      if (appId) {
        handleApplicationAdmission(appId, fetchedClasses);
      }
    });

    api.get('/academic-years/active')
      .then(res => {
        if (res.data) setActiveYear(res.data.year);
      })
      .catch(err => console.error("Error fetching active academic year", err));
  }, []);

  const getMatchedClass = (className, classList) => {
    if (!className || !classList) return null;
    const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = normalize(className);
    return classList.find(c => normalize(c.name) === target);
  };


  const handleValidatedChange = (field, e, validationType, stateObj, setState, maxLen) => {
    let val = e.target.value;
    if (validationType === 'letters') {
      val = val.replace(/[^a-zA-Z\s]/g, '');
    } else if (validationType === 'parentName') {
      val = val.replace(/[^a-zA-Z\s.]/g, '');
    } else if (validationType === 'admissionNumber') {
      val = val.replace(/[^a-zA-Z0-9\-\/]/g, '');
    } else if (validationType === 'numbers') {
      if (field === 'whatsappNumber' || field === 'aadhaarNumber') {
        val = val.replace(/[^0-9*Xx]/g, '');
      } else {
        val = val.replace(/[^0-9]/g, '');
      }
    } else if (validationType === 'alphanumeric') {
      val = val.replace(/[^a-zA-Z0-9\s\-\+]/g, '');
    } else if (validationType === 'bloodGroup') {
      val = val.replace(/[^a-zA-Z\s\-\+]/g, '');
    } else if (validationType === 'occupation') {
      val = val.replace(/[^a-zA-Z0-9\s\-./()&,]/g, '');
    } else if (validationType === 'caste') {
      val = val.replace(/[^a-zA-Z\s\-./]/g, '');
    }
    const limit = maxLen ?? (field === 'pincode' ? 6 : field === 'aadhaarNumber' ? 12 : (field === 'emisNumber' || field === 'emisNo') ? 10 : (field === 'fatherPhone' || field === 'motherPhone' || field === 'whatsappNumber') ? 10 : null);
    if (limit && val.length > limit) {
      val = val.slice(0, limit);
    }
    setState({ ...stateObj, [field]: val });
  };

  const handleApplicationAdmission = async (appId, classList) => {
    try {
      const res = await api.get(`/applications/${appId}`);
      const app = res.data;
      
      const matchedClass = getMatchedClass(app.applyingClass, classList);
      const finalClassName = matchedClass ? matchedClass.name : app.applyingClass;
      
      setSelectedClass(finalClassName);
      
      setManualForm(prev => ({
        ...prev,
        applicationId: app._id || app.id,
        studentName: app.studentName || '',
        fatherName: app.fatherName || '',
        motherName: app.motherName || '',
        guardian: app.parentName || app.guardian || '',
        fatherPhone: app.fatherPhone || '',
        motherPhone: app.motherPhone || '',
        address: app.address || '',
        admissionNumber: ''
      }));
      
      setIsManualModalOpen(true);
      
      // Clean up URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } catch (error) {
      console.error("Error fetching application details", error);
      toastError("Failed to load application details.");
    }
  };

  const handleOpenManualModal = async () => {
    if (!selectedClass) {
      toastWarning("Please select a class first");
      return;
    }
    
    setManualForm({
      admissionNumber: '',
      studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '',
      dateOfBirth: '', gender: '', bloodGroup: '', aadhaarNumber: '', religion: '', community: '', caste: '', RTE: '', nationality: '', 
      fatherOccupation: '', motherOccupation: '', guardian: '', guardianName: '', city: '', state: '', pincode: '', whatsappNumber: '', emisNumber: '', emisNo: '',
      isRTE: false,
      section: selectedSection || '',
      applicationId: ''
    });

    setIsManualModalOpen(true);
  };

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
      return res.data;
    } catch (error) {
      console.error("Error fetching classes", error);
      return [];
    } finally {
      setPageLoading(false);
    }
  };

  const validateFields = (form) => {
    // Admission Number validation
    const admissionNumber = (form.admissionNumber || '').trim();
    if (!admissionNumber) return "Admission Number is required.";
    if (admissionNumber.length < 3 || admissionNumber.length > 30) return "Admission Number must be between 3 and 30 characters.";
    if (!/^[a-zA-Z0-9\-/]+$/.test(admissionNumber)) return "Admission Number must contain only letters, numbers, hyphens (-), and forward slashes (/).";

    // Father Name validation (Optional)
    const fatherName = (form.fatherName || '').trim();
    if (fatherName) {
      if (!/^[a-zA-Z\s.]+$/.test(fatherName)) return "Father Name must contain only alphabets, spaces, and dots.";
      if (fatherName.length < 3 || fatherName.length > 100) return "Father Name must be between 3 and 100 characters.";
    }

    // Mother Name validation (Optional)
    const motherName = (form.motherName || '').trim();
    if (motherName) {
      if (!/^[a-zA-Z\s.]+$/.test(motherName)) return "Mother Name must contain only alphabets, spaces, and dots.";
      if (motherName.length < 3 || motherName.length > 100) return "Mother Name must be between 3 and 100 characters.";
    }

    // Guardian Name validation (Optional)
    const guardian = (form.guardian || form.guardianName || '').trim();
    if (guardian) {
      if (!/^[a-zA-Z\s.]+$/.test(guardian)) return "Guardian Name must contain only alphabets, spaces, and dots.";
      if (guardian.length < 3 || guardian.length > 100) return "Guardian Name must be between 3 and 100 characters.";
    }

    // Father Phone validation (Optional)
    const fatherPhone = (form.fatherPhone || '').trim();
    if (fatherPhone) {
      if (!/^[5-9]\d{9}$/.test(fatherPhone)) return "Father Phone must be exactly 10 digits and start with 5, 6, 7, 8, or 9.";
    }

    // Mother Phone validation (Optional)
    const motherPhone = (form.motherPhone || '').trim();
    if (motherPhone) {
      if (!/^[5-9]\d{9}$/.test(motherPhone)) return "Mother Phone must be exactly 10 digits and start with 5, 6, 7, 8, or 9.";
    }

    // WhatsApp Number validation (Optional)
    const whatsappNumber = (form.whatsappNumber || '').trim();
    if (whatsappNumber) {
      const isMasked = /[*Xx]/.test(whatsappNumber);
      const isValid = isMasked ? /^[0-9*Xx]{10}$/.test(whatsappNumber) : /^[5-9]\d{9}$/.test(whatsappNumber);
      if (!isValid) return "WhatsApp Number must be exactly 10 digits and start with 5, 6, 7, 8, or 9.";
    }

    // Father Occupation validation (Optional)
    const fatherOccupation = (form.fatherOccupation || '').trim();
    if (fatherOccupation) {
      if (!/^[a-zA-Z\s\-./()&,]+$/.test(fatherOccupation)) return "Father Occupation must contain only alphabets, spaces, and common characters (- . / ( ) & ,).";
      if (fatherOccupation.length > 100) return "Father Occupation must not exceed 100 characters.";
    }

    // Mother Occupation validation (Optional)
    const motherOccupation = (form.motherOccupation || '').trim();
    if (motherOccupation) {
      if (!/^[a-zA-Z\s\-./()&,]+$/.test(motherOccupation)) return "Mother Occupation must contain only alphabets, spaces, and common characters (- . / ( ) & ,).";
      if (motherOccupation.length > 100) return "Mother Occupation must not exceed 100 characters.";
    }

    // Caste validation (Optional)
    const caste = (form.caste || '').trim();
    if (caste) {
      if (!/^[a-zA-Z\s\-./]+$/.test(caste)) return "Caste must contain only alphabets, spaces, hyphens, dots, and slashes.";
      if (caste.length > 50) return "Caste must not exceed 50 characters.";
    }

    // EMIS No validation (Optional)
    const emisNo = (form.emisNumber || form.emisNo || '').trim();
    if (emisNo && !/^\d{10}$/.test(emisNo)) return "EMIS No must be exactly 10 digits.";

    // Pincode validation (Optional, but must be exactly 6 digits if provided)
    const pincode = (form.pincode || '').trim();
    if (pincode && !/^\d{6}$/.test(pincode)) return "Pincode must be exactly 6 digits.";

    return null;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toastWarning("Please select a class first in the main screen.");
      return;
    }

    const err = validateFields(manualForm);
    if (err) {
      toastWarning(err);
      return;
    }

    if (manualForm.bloodGroup && /\d/.test(manualForm.bloodGroup)) {
      toastWarning("Blood Group should not contain numbers.");
      return;
    }

    if (manualForm.aadhaarNumber && !/^(\d{12}|[xX]{8}\d{4})$/.test(manualForm.aadhaarNumber.replace(/\s/g, ''))) {
      toastWarning("Aadhaar Number must be exactly 12 digits.");
      return;
    }

    setManualLoading(true);
    try {
      const res = await api.post('/students/manual', { 
        ...manualForm, 
        caste: (manualForm.caste || '').trim(),
        emisNumber: (manualForm.emisNumber || manualForm.emisNo || '').trim(),
        emisNo: (manualForm.emisNumber || manualForm.emisNo || '').trim(),
        guardian: (manualForm.guardian || manualForm.guardianName || '').trim(),
        guardianName: (manualForm.guardian || manualForm.guardianName || '').trim(),
        whatsappNumber: (manualForm.whatsappNumber || '').trim(),
        RTE: manualForm.isRTE ? 'RTE' : 'General', 
        currentClass: selectedClass, 
        section: manualForm.section || selectedSection 
      });
      setIsManualModalOpen(false);
      setManualForm({ 
        admissionNumber: '',
        studentName: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', address: '',
        dateOfBirth: '', gender: '', bloodGroup: '', aadhaarNumber: '', religion: '', community: '', caste: '', RTE: '', nationality: '', 
        fatherOccupation: '', motherOccupation: '', guardian: '', guardianName: '', city: '', state: '', pincode: '', whatsappNumber: '', emisNumber: '', emisNo: '',
        isRTE: false,
        section: '',
        applicationId: ''
      });
      fetchStudents();
      const createdAdmissionNumber = res.data?.admissionNumber || res.data?.data?.admissionNumber;
      toastSuccess(createdAdmissionNumber
        ? `Student added successfully. Admission No: ${createdAdmissionNumber}`
        : (manualForm.applicationId ? "Student added successfully and application approved." : "Student added successfully!"));
    } catch (error) {
      toastError(error.response?.data?.error || "Error adding student.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !file) {
      toastWarning("Please select a class and an Excel file.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('currentClass', selectedClass);
    if (selectedSection) formData.append('section', selectedSection);

    setImporting(true);
    try {
      const res = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const {
        message,
        successCount,
        duplicateCount,
        validationErrorsCount,
        dbErrorsCount,
        errors
      } = res.data;

      let summary = `${message}\n\nSuccessfully Imported : ${successCount}\nDuplicate Records : ${duplicateCount}\nValidation Errors : ${validationErrorsCount}\nDatabase Errors : ${dbErrorsCount}\n`;

      if (successCount > 0) {
        if (errors && errors.length > 0) {
          summary += `\n\nSome rows were skipped. Check the console for row-level details.`;
          console.warn('Bulk import row issues:', errors);
        }
        toastSuccess(summary);
      } else {
        if (errors && errors.length > 0) {
          let errorDisplay = errors.slice(0, 20).join('\n');
          if (errors.length > 20) {
            errorDisplay += `\n...and ${errors.length - 20} more errors`;
          }
          summary += `\nErrors:\n${errorDisplay}`;
        }
        toastError(summary);
      }

      setIsImportModalOpen(false);
      setFile(null);
      fetchStudents();
    } catch (error) {
      toastError(error.response?.data?.error || "Error importing students.");
    } finally {
      setImporting(false);
    }
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  const openEditModal = async (student) => {
    try {
      const res = await api.get(`/students/${student._id || student.id}`);
      const data = res.data;
      setFullStudentData(data);
      setEditForm({
        admissionNumber: data.admissionNumber || '',
        studentName: data.studentName || '',
        currentClass: data.currentClass || '',
        section: data.section || '',
        fatherName: data.fatherName || '',
        motherName: data.motherName || '',
        fatherPhone: data.fatherPhone || '',
        motherPhone: data.motherPhone || '',
        caste: data.caste || '',
        emisNumber: data.emisNumber || data.emisNo || '',
        guardian: data.guardian || data.guardianName || '',
        whatsappNumber: data.whatsappNumber || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || '',
        bloodGroup: data.bloodGroup || '',
        aadhaarNumber: data.aadhaarNumber || '',
        religion: data.religion || '',
        community: data.community || '',
        RTE: data.RTE || 'General',
        isRTE: data.RTE === 'RTE',
        nationality: data.nationality || '',
        fatherOccupation: data.fatherOccupation || '',
        motherOccupation: data.motherOccupation || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        academicYear: data.academicYear || ''
      });
      setSelectedStudent(student);
      setIsEditing(true);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error loading student for edit", error);
      toastError("Failed to load student details for editing.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'section') {
      val = val.replace(/[^a-zA-Z]/g, '');
    } else if (name === 'admissionNumber') {
      val = val.replace(/[^a-zA-Z0-9\-\/]/g, '').slice(0, 30);
    } else if (name === 'fatherName' || name === 'motherName' || name === 'guardian' || name === 'guardianName') {
      val = val.replace(/[^a-zA-Z\s.]/g, '').slice(0, 100);
    } else if (name === 'fatherPhone' || name === 'motherPhone') {
      val = val.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (name === 'whatsappNumber') {
      val = val.replace(/[^0-9*Xx]/g, '').slice(0, 10);
    } else if (name === 'fatherOccupation' || name === 'motherOccupation') {
      val = val.replace(/[^a-zA-Z0-9\s\-./()&,]/g, '').slice(0, 100);
    } else if (name === 'caste') {
      val = val.replace(/[^a-zA-Z\s\-./]/g, '').slice(0, 50);
    } else if (name === 'emisNumber' || name === 'emisNo') {
      val = val.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (name === 'aadhaarNumber') {
      val = val.replace(/[^0-9*Xx]/g, '').slice(0, 12);
    } else if (name === 'bloodGroup') {
      val = val.replace(/[^a-zA-Z\s\-\+]/g, '');
    }
    setEditForm(prev => ({ ...prev, [name]: val }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    const err = validateFields(editForm);
    if (err) {
      toastWarning(err);
      return;
    }

    setEditLoading(true);
    try {
      const includedChargesIds = (fullStudentData.includedCharges || [])
        .map(c => c.includedChargeId?._id || c.includedChargeId)
        .filter(Boolean);
      const activitiesIds = (fullStudentData.activities || [])
        .map(a => a.activityId?._id || a.activityId)
        .filter(Boolean);

      const payload = {
        ...fullStudentData,
        admissionNumber: editForm.admissionNumber,
        studentName: editForm.studentName,
        currentClass: editForm.currentClass,
        section: editForm.section || '',
        fatherName: editForm.fatherName,
        motherName: editForm.motherName,
        fatherPhone: editForm.fatherPhone,
        motherPhone: editForm.motherPhone,
        caste: (editForm.caste || '').trim(),
        emisNumber: (editForm.emisNumber || '').trim(),
        emisNo: (editForm.emisNumber || '').trim(),
        guardian: (editForm.guardian || '').trim(),
        guardianName: (editForm.guardian || '').trim(),
        whatsappNumber: (editForm.whatsappNumber || '').trim(),
        dateOfBirth: editForm.dateOfBirth || null,
        gender: editForm.gender || '',
        bloodGroup: editForm.bloodGroup || '',
        aadhaarNumber: editForm.aadhaarNumber || '',
        religion: editForm.religion || '',
        community: editForm.community || '',
        RTE: editForm.isRTE ? 'RTE' : 'General',
        nationality: editForm.nationality || '',
        fatherOccupation: editForm.fatherOccupation || '',
        motherOccupation: editForm.motherOccupation || '',
        address: editForm.address || '',
        city: editForm.city || '',
        state: editForm.state || '',
        pincode: editForm.pincode || '',
        academicYear: editForm.academicYear || '',
        includedChargesIds,
        activitiesIds,
        admissionDate: fullStudentData.admissionDate ? fullStudentData.admissionDate.split('T')[0] : ''
      };
      delete payload._id;
      delete payload.id;
      delete payload.includedCharges;
      delete payload.activities;
      delete payload.studentFees;
      delete payload.currentClassFees;
      delete payload.previousClassFees;
      delete payload.payments;
      delete payload.addedById;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      await api.put(`/students/${selectedStudent._id || selectedStudent.id}`, payload);
      setIsEditing(false);
      setIsViewModalOpen(false);
      fetchStudents();
      toastSuccess("Student updated successfully!");
    } catch (error) {
      console.error("Error updating student", error);
      toastError(error.response?.data?.error || "Error updating student.");
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const visibleStudents = students.filter(student => {
    if (studentGroupFilter === 'RTE') return isRTEStudent(student);
    if (studentGroupFilter === 'General') return !isRTEStudent(student);
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / itemsPerPage));
  const paginatedStudents = visibleStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [students.length, selectedClass, selectedSection, studentGroupFilter]);

  const currentClassObj = classes.find(c => c.name === selectedClass);
  const sections = currentClassObj ? currentClassObj.sections : [];

  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <UserPlus className="mr-3 text-orange-600" size={32} />
            Admissions
          </h1>
          <p className="text-gray-500 mt-2">Manage student admissions and enrollments</p>
        </div>
        <div className="space-y-1 min-w-44 w-full sm:w-auto">
          <Label>Student Group</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
            value={studentGroupFilter}
            onChange={(e) => setStudentGroupFilter(e.target.value)}
          >
            <option value="All">All Students</option>
            <option value="RTE">RTE Students</option>
            <option value="General">General Students</option>
          </select>
        </div>
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
                <Label className="whitespace-nowrap">Section</Label>
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
              <Button onClick={() => {
                if (!selectedClass) { toastWarning("Please select a class first"); return; }
                setIsImportModalOpen(true);
              }} className="flex items-center bg-orange-100 text-orange-700 hover:bg-orange-200" type="button">
                <Upload className="h-4 w-4 mr-2" /> Bulk Import
              </Button>
              <Button onClick={handleOpenManualModal} className="flex items-center">
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
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(student)}>
                          <Eye className="h-4 w-4 text-orange-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(student)}>
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsEditing(false); setIsViewModalOpen(false); }} title={isEditing ? "Edit Student" : "Student Details"} className="max-w-4xl">
        {selectedStudent && !isEditing && (
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
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="text-gray-900">{selectedStudent.academicYear || '-'}</p>
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
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="text-gray-900">{selectedStudent.nationality || '-'}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-sm text-gray-500">Student Group</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedStudent.RTE === 'RTE' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedStudent.RTE === 'RTE' ? 'RTE Course Student' : 'General (Non-RTE) Student'}
                  </span>
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
                <div className="hidden md:block"></div>
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
                <div className="hidden md:block"></div>
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
              <Button variant="outline" onClick={() => openEditModal(selectedStudent)} className="mr-2">
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}

        {selectedStudent && isEditing && (
          <form onSubmit={handleEditSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-center sticky top-0 z-10 shadow-sm">
              <Pencil className="text-blue-600 mr-2 h-5 w-5" />
              <span className="text-sm font-medium text-blue-900">
                Editing: {selectedStudent.admissionNumber} - {selectedStudent.studentName}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Admission Number *</Label>
                  <Input name="admissionNumber" value={editForm.admissionNumber || ''} onChange={handleEditChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input name="academicYear" value={editForm.academicYear || ''} readOnly className="bg-gray-100 cursor-not-allowed font-medium text-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label>EMIS No</Label>
                  <Input name="emisNumber" value={editForm.emisNumber} onChange={handleEditChange} maxLength={10} placeholder="10 digits" />
                </div>
                <div className="space-y-2">
                  <Label>Student Name *</Label>
                  <Input name="studentName" value={editForm.studentName} onChange={handleEditChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select name="gender" value={editForm.gender} onChange={handleEditChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Input name="bloodGroup" value={editForm.bloodGroup} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Aadhaar No</Label>
                  <Input name="aadhaarNumber" value={editForm.aadhaarNumber} maxLength={12} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Input name="religion" value={editForm.religion} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Community</Label>
                  <Input name="community" value={editForm.community} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Caste</Label>
                  <Input name="caste" value={editForm.caste} onChange={handleEditChange} maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input name="nationality" value={editForm.nationality} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <select name="currentClass" value={editForm.currentClass} onChange={handleEditChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" required>
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c._id || c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input name="section" value={editForm.section} onChange={handleEditChange} placeholder="e.g., A" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="font-bold text-gray-900">Student Group</Label>
                  <label className="flex items-center gap-3 rounded-md border-2 border-purple-300 bg-purple-50/30 px-3 py-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={editForm.isRTE || false}
                      onChange={(e) => setEditForm({ ...editForm, isRTE: e.target.checked })}
                      className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-600"
                    />
                    <span>{editForm.isRTE ? 'RTE Course Student' : 'General (Non-RTE) Student'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Parent & Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Father Name</Label>
                  <Input name="fatherName" value={editForm.fatherName} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Mother Name</Label>
                  <Input name="motherName" value={editForm.motherName} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Guardian Name</Label>
                  <Input name="guardian" value={editForm.guardian} onChange={handleEditChange} maxLength={100} placeholder="Guardian name" />
                </div>
                <div className="space-y-2">
                  <Label>Father Phone</Label>
                  <Input name="fatherPhone" value={editForm.fatherPhone} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Mother Phone</Label>
                  <Input name="motherPhone" value={editForm.motherPhone} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input name="whatsappNumber" value={editForm.whatsappNumber} onChange={handleEditChange} placeholder="WhatsApp Number" />
                </div>
                <div className="space-y-2">
                  <Label>Father Occupation</Label>
                  <Input name="fatherOccupation" value={editForm.fatherOccupation} onChange={handleEditChange} />
                </div>
                <div className="space-y-2">
                  <Label>Mother Occupation</Label>
                  <Input name="motherOccupation" value={editForm.motherOccupation} onChange={handleEditChange} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Address Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input name="address" value={editForm.address} onChange={handleEditChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input name="city" value={editForm.city} onChange={handleEditChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input name="state" value={editForm.state} onChange={handleEditChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input name="pincode" value={editForm.pincode} onChange={(e) => handleValidatedChange('pincode', e, 'numbers', editForm, setEditForm)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-white border-t py-3 z-10">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button type="submit" loading={editLoading} loadingText="Saving...">
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="KASTHURI NURSERY & PRIMARY SCHOOL APPLICATION FORM" className="max-w-4xl">
        <form onSubmit={handleManualSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {manualForm.applicationId ? (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 shadow-sm gap-2">
              <div className="flex items-center">
                <Users className="text-blue-600 mr-2 h-5 w-5" />
                <span className="text-sm font-medium text-blue-900">
                  Application Admission | Applied Class: {selectedClass}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap text-sm text-blue-900 font-semibold">Section <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="flex h-8 w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={manualForm.section || ''}
                  onChange={(e) => setManualForm({...manualForm, section: e.target.value})}
                >
                  <option value="">Select Section</option>
                  {classes.find(c => c.name === selectedClass)?.sections?.map((s) => (
                    <option key={s._id || s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 p-3 rounded-md border border-orange-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center">
                <Users className="text-orange-600 mr-2 h-5 w-5" />
                <span className="text-sm font-medium text-orange-900">
                  Adding to Class: {selectedClass} {selectedSection && `(Section ${selectedSection})`}
                </span>
              </div>
              {!selectedSection && (
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap text-sm text-orange-900 font-semibold">Section</Label>
                  <select
                    className="flex h-8 w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    value={manualForm.section || ''}
                    onChange={(e) => setManualForm({...manualForm, section: e.target.value})}
                  >
                    <option value="">No Section</option>
                    {classes.find(c => c.name === selectedClass)?.sections?.map((s) => (
                      <option key={s._id || s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Admission Number *</Label>
                <Input value={manualForm.admissionNumber || ''} placeholder="e.g. ADM-001" onChange={(e) => handleValidatedChange('admissionNumber', e, 'admissionNumber', manualForm, setManualForm, 30)} required />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={activeYear || 'Loading...'} readOnly className="bg-gray-100 cursor-not-allowed font-medium text-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>EMIS No</Label>
                <Input value={manualForm.emisNumber} maxLength={10} placeholder="10 digits" onChange={(e) => handleValidatedChange('emisNumber', e, 'numbers', manualForm, setManualForm, 10)} />
              </div>
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input required value={manualForm.studentName} onChange={(e) => handleValidatedChange('studentName', e, 'letters', manualForm, setManualForm)} />
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
                <Input value={manualForm.bloodGroup} onChange={(e) => handleValidatedChange('bloodGroup', e, 'bloodGroup', manualForm, setManualForm)} />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar No</Label>
                <Input value={manualForm.aadhaarNumber} maxLength={12} onChange={(e) => handleValidatedChange('aadhaarNumber', e, 'numbers', manualForm, setManualForm, 12)} />
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Input value={manualForm.religion} onChange={(e) => handleValidatedChange('religion', e, 'letters', manualForm, setManualForm)} />
              </div>
              <div className="space-y-2">
                <Label>Community</Label>
                <Input value={manualForm.community} onChange={(e) => handleValidatedChange('community', e, 'letters', manualForm, setManualForm)} />
              </div>
              <div className="space-y-2">
                <Label>Caste</Label>
                <Input value={manualForm.caste} maxLength={50} onChange={(e) => handleValidatedChange('caste', e, 'caste', manualForm, setManualForm, 50)} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={manualForm.nationality} onChange={(e) => handleValidatedChange('nationality', e, 'letters', manualForm, setManualForm)} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label className="font-bold text-gray-900">Student Group</Label>
                <label className="flex items-center gap-3 rounded-md border-2 border-purple-300 bg-purple-50/30 px-3 py-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={manualForm.isRTE || false}
                    onChange={(e) => setManualForm({ ...manualForm, isRTE: e.target.checked })}
                    className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-600"
                  />
                  <span>{manualForm.isRTE ? 'RTE Course Student' : 'General (Non-RTE) Student'}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Parent & Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Father Name</Label>
                <Input value={manualForm.fatherName} onChange={(e) => handleValidatedChange('fatherName', e, 'parentName', manualForm, setManualForm, 100)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Name</Label>
                <Input value={manualForm.motherName} onChange={(e) => handleValidatedChange('motherName', e, 'parentName', manualForm, setManualForm, 100)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input value={manualForm.guardian} maxLength={100} placeholder="Guardian name" onChange={(e) => handleValidatedChange('guardian', e, 'parentName', manualForm, setManualForm, 100)} />
              </div>
              <div className="space-y-2">
                <Label>Father Phone</Label>
                <Input value={manualForm.fatherPhone} onChange={(e) => handleValidatedChange('fatherPhone', e, 'numbers', manualForm, setManualForm, 10)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Phone</Label>
                <Input value={manualForm.motherPhone} onChange={(e) => handleValidatedChange('motherPhone', e, 'numbers', manualForm, setManualForm, 10)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={manualForm.whatsappNumber} placeholder="WhatsApp Number" onChange={(e) => handleValidatedChange('whatsappNumber', e, 'numbers', manualForm, setManualForm, 10)} />
              </div>
              <div className="space-y-2">
                <Label>Father Occupation</Label>
                <Input value={manualForm.fatherOccupation} onChange={(e) => handleValidatedChange('fatherOccupation', e, 'occupation', manualForm, setManualForm)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Occupation</Label>
                <Input value={manualForm.motherOccupation} onChange={(e) => handleValidatedChange('motherOccupation', e, 'occupation', manualForm, setManualForm)} />
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
                  <Input value={manualForm.city} onChange={(e) => handleValidatedChange('city', e, 'letters', manualForm, setManualForm)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={manualForm.state} onChange={(e) => handleValidatedChange('state', e, 'letters', manualForm, setManualForm)} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={manualForm.pincode} onChange={(e) => handleValidatedChange('pincode', e, 'numbers', manualForm, setManualForm)} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-white border-t py-3 z-10">
            <Button type="button" variant="outline" onClick={() => {
              setIsManualModalOpen(false);
              setManualForm(prev => ({...prev, applicationId: ''}));
            }} disabled={manualLoading}>Cancel</Button>
            <Button type="submit" loading={manualLoading} loadingText="Saving...">
              Add Student
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={importing ? () => {} : () => setIsImportModalOpen(false)} title="Bulk Import Students">
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
              <li>RTE</li>
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
              disabled={importing}
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="pt-1.5"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)} disabled={importing}>Cancel</Button>
            <Button type="submit" loading={importing} loadingText="Importing..." disabled={!file} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" /> Upload & Import
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Admissions;
