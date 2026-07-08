import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Printer, Download, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const PrintExport = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data);
        setFilteredStudents(res.data);
      } catch (error) {
        console.error("Error fetching students", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const uniqueClasses = [...new Set(students.map(s => s.currentClass).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.filter(s => !selectedClass || s.currentClass === selectedClass).map(s => s.section).filter(Boolean))].sort();

  useEffect(() => {
    let result = students;
    
    if (selectedClass) {
      result = result.filter(s => s.currentClass === selectedClass);
    }
    if (selectedSection) {
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

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = () => {
    const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Father Name', 'Father Phone', 'Mother Phone'];
    const rows = filteredStudents.map(s => [
      s.admissionNumber || '',
      s.studentName || '',
      s.currentClass || '',
      s.section || '',
      s.fatherName || '',
      s.fatherPhone || '',
      s.motherPhone || ''
    ]);
    
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
          <p className="text-gray-500 mt-2">Filter students by class, section, or contact number to generate lists.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classFilter">Class</Label>
              <select 
                id="classFilter" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                }}
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
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
                disabled={!selectedClass}
              >
                <option value="">All Sections</option>
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
        </CardContent>
      </Card>

      <Card className="print-table-container">
        <CardHeader className="print:hidden">
          <CardTitle>Results ({filteredStudents.length} Students)</CardTitle>
        </CardHeader>
        {/* Added a title that only shows when printing */}
        <div className="hidden print:block text-center text-xl font-bold mb-4 mt-8 print-header">
          Student List
          {selectedClass && ` - Class ${selectedClass}`}
          {selectedSection && ` Section ${selectedSection}`}
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
                filteredStudents.map((student) => (
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
        </CardContent>
      </Card>
      
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
