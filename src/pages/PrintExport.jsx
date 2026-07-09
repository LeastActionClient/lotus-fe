import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Printer, Download, Search, CheckSquare, Square } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';

const AVAILABLE_FIELDS = [
  { id: 'admissionNumber', label: 'Admission No' },
  { id: 'emisNumber', label: 'EMIS Number' },
  { id: 'studentName', label: 'Student Name' },
  { id: 'currentClass', label: 'Class' },
  { id: 'section', label: 'Section' },
  { id: 'dateOfBirth', label: 'Date of Birth', format: (val) => val ? new Date(val).toLocaleDateString() : '' },
  { id: 'gender', label: 'Gender' },
  { id: 'bloodGroup', label: 'Blood Group' },
  { id: 'aadhaarNumber', label: 'Aadhaar No' },
  { id: 'religion', label: 'Religion' },
  { id: 'community', label: 'Community' },
  { id: 'caste', label: 'Caste' },
  { id: 'rcc', label: 'RCC' },
  { id: 'nationality', label: 'Nationality' },
  { id: 'fatherName', label: 'Father Name' },
  { id: 'motherName', label: 'Mother Name' },
  { id: 'guardian', label: 'Guardian Name' },
  { id: 'fatherPhone', label: 'Father Phone' },
  { id: 'motherPhone', label: 'Mother Phone' },
  { id: 'whatsappNumber', label: 'Whatsapp Number' },
  { id: 'fatherOccupation', label: 'Father Occupation' },
  { id: 'motherOccupation', label: 'Mother Occupation' },
  { id: 'address', label: 'Address' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'pincode', label: 'Pincode' }
];

const PrintExport = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('FULL_SCHOOL');
  const [selectedSection, setSelectedSection] = useState('ALL_SECTIONS');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedFields, setSelectedFields] = useState(
    AVAILABLE_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: true }), {})
  );

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const uniqueClasses = [...new Set(students.map(s => s.currentClass).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.filter(s => selectedClass === 'FULL_SCHOOL' || s.currentClass === selectedClass).map(s => s.section).filter(Boolean))].sort();

  useEffect(() => {
    let result = students;
    
    if (selectedClass && selectedClass !== 'FULL_SCHOOL') {
      result = result.filter(s => s.currentClass === selectedClass);
    }
    if (selectedSection && selectedSection !== 'ALL_SECTIONS') {
      result = result.filter(s => s.section === selectedSection);
    }
    if (phoneSearch) {
      result = result.filter(s => 
        (s.fatherPhone && s.fatherPhone.includes(phoneSearch)) || 
        (s.motherPhone && s.motherPhone.includes(phoneSearch))
      );
    }
    
    setFilteredStudents(result);
  }, [selectedClass, selectedSection, phoneSearch, students]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSection, phoneSearch, students.length, selectedFields]);

  const handlePrint = () => {
    window.print();
  };

  const toggleField = (fieldId) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const toggleAllFields = (select) => {
    setSelectedFields(AVAILABLE_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: select }), {}));
  };

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadCSV = () => {
    const fieldsToExport = AVAILABLE_FIELDS.filter(f => selectedFields[f.id]);
    
    if (fieldsToExport.length === 0) {
      alert("Please select at least one field to export.");
      return;
    }

    const headers = fieldsToExport.map(f => f.label);
    
    const rows = filteredStudents.map(student => {
      return fieldsToExport.map(field => {
        const value = student[field.id];
        let displayValue = field.format ? field.format(value) : (value || '');
        if (typeof displayValue === 'string') {
          if (/^\d{8,}$/.test(displayValue)) {
            // Force Excel to treat long numbers as text
            displayValue = `="${displayValue}"`;
          } else if (displayValue.includes(',') || displayValue.includes('"')) {
            displayValue = `"${displayValue.replace(/"/g, '""')}"`;
          }
        }
        return displayValue;
      });
    });
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().getTime()}.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center p-12">Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print-wrapper">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <Printer className="mr-3 text-orange-600" size={32} />
            Print & Export
          </h1>
          <p className="text-gray-500 mt-2">Filter and select specific fields to export your student data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex justify-between items-center">
                Select Fields
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => toggleAllFields(true)}>
                  <CheckSquare className="h-3 w-3 mr-1" /> All
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => toggleAllFields(false)}>
                  <Square className="h-3 w-3 mr-1" /> None
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {AVAILABLE_FIELDS.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`field-${field.id}`}
                      checked={selectedFields[field.id]}
                      onChange={() => toggleField(field.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-4 w-4"
                    />
                    <Label htmlFor={`field-${field.id}`} className="text-sm font-normal cursor-pointer flex-1">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="bg-orange-50 border-orange-100">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classFilter">Select Scope</Label>
                  <select 
                    id="classFilter" 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSection('ALL_SECTIONS');
                    }}
                  >
                    <option value="FULL_SCHOOL">Full School</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sectionFilter">Section</Label>
                  <select 
                    id="sectionFilter" 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={selectedClass === 'FULL_SCHOOL'}
                  >
                    <option value="ALL_SECTIONS">All Sections</option>
                    {uniqueSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneFilter">Phone Number</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      id="phoneFilter" 
                      placeholder="Search by phone..." 
                      className="pl-8"
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6 border-t border-orange-200 pt-4">
                <Button variant="outline" onClick={handlePrint} className="bg-white hover:bg-orange-50 text-orange-700 border-orange-200">
                  <Printer className="mr-2 h-4 w-4" /> Print Results
                </Button>
                <Button onClick={downloadCSV} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Export CSV ({Object.values(selectedFields).filter(Boolean).length} columns)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="print-table-container">
            <CardHeader className="print:hidden pb-3">
              <CardTitle>Preview ({filteredStudents.length} Students)</CardTitle>
            </CardHeader>
            <div className="hidden print:block text-center text-xl font-bold mb-4 mt-8 print-header">
              Student List
              {selectedClass !== 'FULL_SCHOOL' && ` - Class ${selectedClass}`}
              {selectedSection !== 'ALL_SECTIONS' && ` Section ${selectedSection}`}
            </div>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class & Section</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32 text-gray-500">
                        No students found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                        <TableCell className="font-medium text-gray-900">{student.studentName}</TableCell>
                        <TableCell>{student.currentClass} {student.section && `- ${student.section}`}</TableCell>
                        <TableCell>{student.fatherName || '-'}</TableCell>
                        <TableCell>{student.fatherPhone || student.motherPhone || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="print:hidden" />
              {filteredStudents.length > paginatedStudents.length && (
                <div className="text-center p-4 text-sm text-gray-500 bg-gray-50 border-t print:hidden">
                  Showing {paginatedStudents.length} preview results. Export CSV to see all {filteredStudents.length} students.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-wrapper, .print-wrapper * {
            visibility: visible;
          }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintExport;
