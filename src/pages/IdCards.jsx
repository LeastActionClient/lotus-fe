import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Contact, Eye, Download, Printer, Search, CheckSquare, Square, ZoomIn, ZoomOut, RefreshCw, X, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import StudentIdCard from '../components/StudentIdCard';
import { getImageUrl } from '../utils/imageUrl';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const IdCards = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterYear, setFilterYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRteType, setFilterRteType] = useState('all');

  // Selection & Pagination State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Processing Loading States
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printingCard, setPrintingCard] = useState(false);

  const previewRef = useRef(null);
  const hiddenRenderRef = useRef(null);
  const [batchStudentsToRender, setBatchStudentsToRender] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesRes, yearsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/academic-years')
      ]);
      setClasses(classesRes.data || []);
      setAcademicYears(yearsRes.data || []);
      fetchStudents();
    } catch (error) {
      console.error('Error loading initial ID card data:', error);
      toastError('Failed to load ID card filters data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = {};
      if (filterYear) params.academicYear = filterYear;
      if (filterClass) params.currentClass = filterClass;
      if (filterSection) params.section = filterSection;
      if (filterSearch) params.search = filterSearch;
      if (filterStatus) params.studentStatus = filterStatus;
      if (filterRteType) params.rteType = filterRteType;

      const res = await api.get('/id-cards', { params });
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching ID card students:', error);
      toastError('Error loading students list.');
    }
  };

  useEffect(() => {
    fetchStudents();
    setCurrentPage(1);
    setSelectedStudentIds([]);
  }, [filterYear, filterClass, filterSection, filterSearch, filterStatus, filterRteType]);

  const selectedClassObj = classes.find(c => c.name === filterClass);
  const availableSections = selectedClassObj?.sections || [];

  const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage));
  const paginatedStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedStudents.map(s => s._id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdsSet = new Set(paginatedStudents.map(s => s._id));
      setSelectedStudentIds(prev => prev.filter(id => !pageIdsSet.has(id)));
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const openPreview = (student) => {
    setPreviewStudent(student);
    setZoomLevel(1);
    setIsPreviewModalOpen(true);
  };

  // PDF Generation Logic (CR80 standard 54mm x 85.6mm PVC portrait per page)
  const generatePdfForStudents = async (studentList) => {
    if (!studentList || studentList.length === 0) {
      toastWarning('No students selected for PDF download.');
      return;
    }

    setDownloadingPdf(true);
    setBatchStudentsToRender(studentList);

    // Wait for DOM render of hidden cards
    setTimeout(async () => {
      try {
        const container = hiddenRenderRef.current;
        if (!container) {
          throw new Error('Container reference missing');
        }

        const cardElements = container.querySelectorAll('.batch-id-card');
        if (cardElements.length === 0) {
          throw new Error('No card elements found for rendering');
        }

        // Standard PVC Card size in mm: 54mm x 85.6mm
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [54, 85.6]
        });

        for (let i = 0; i < cardElements.length; i++) {
          const el = cardElements[i];
          const canvas = await html2canvas(el, {
            scale: 3, // High DPI rendering
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);

          if (i > 0) {
            pdf.addPage([54, 85.6], 'portrait');
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, 54, 85.6);
        }

        const filename = studentList.length === 1
          ? `ID_Card_${studentList[0].studentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
          : `Student_ID_Cards_Batch_${studentList.length}.pdf`;

        pdf.save(filename);
        toastSuccess(`PDF generated successfully (${studentList.length} card(s))!`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toastError('Failed to generate ID Card PDF.');
      } finally {
        setDownloadingPdf(false);
        setBatchStudentsToRender([]);
      }
    }, 300);
  };

  // Print Logic using native window print with styled PVC media
  const handlePrintStudents = (studentList) => {
    if (!studentList || studentList.length === 0) {
      toastWarning('No students selected for printing.');
      return;
    }

    setPrintingCard(true);
    setBatchStudentsToRender(studentList);

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toastError('Pop-up blocked! Please allow pop-ups to print ID Cards.');
        setPrintingCard(false);
        return;
      }

      const containerHtml = hiddenRenderRef.current ? hiddenRenderRef.current.innerHTML : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Student ID Cards</title>
            <style>
              @page {
                size: 54mm 85.6mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: 'Outfit', 'Inter', system-ui, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .batch-id-card {
                width: 54mm !important;
                height: 85.6mm !important;
                page-break-after: always;
                page-break-inside: avoid;
                margin: 0 auto;
                box-sizing: border-box;
                transform: scale(0.67);
                transform-origin: top left;
              }
              .id-card-container {
                box-shadow: none !important;
                border: none !important;
              }
            </style>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${containerHtml}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      setPrintingCard(false);
      setBatchStudentsToRender([]);
    }, 300);
  };

  const getSelectedStudentsObjects = () => {
    return students.filter(s => selectedStudentIds.includes(s._id));
  };

  if (loading) return <PageLoader text="Loading ID Cards Module..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <Contact className="mr-3 text-orange-600" size={32} />
            Student ID Cards
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Generate, preview, print, and export high-resolution PVC Student ID Cards</p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={selectedStudentIds.length === 0}
            onClick={() => {
              const selected = getSelectedStudentsObjects();
              if (selected.length > 0) openPreview(selected[0]);
            }}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold disabled:opacity-50 shadow-xs text-xs h-9"
          >
            <Eye className="mr-1.5 h-4 w-4 text-purple-600" />
            Preview ID Card {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
          </Button>

          <Button
            variant="outline"
            disabled={selectedStudentIds.length === 0 || downloadingPdf}
            onClick={() => generatePdfForStudents(getSelectedStudentsObjects())}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 font-bold disabled:opacity-50 shadow-xs text-xs h-9"
          >
            <Download className="mr-1.5 h-4 w-4 text-blue-600" />
            {downloadingPdf ? 'Generating...' : `Download PDF ${selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}`}
          </Button>

          <Button
            disabled={selectedStudentIds.length === 0 || printingCard}
            onClick={() => handlePrintStudents(getSelectedStudentsObjects())}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50 shadow-xs text-xs h-9"
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print Selected {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
          </Button>
        </div>
      </div>

      {/* Top Filters Bar */}
      <Card className="bg-gray-50/80 border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Academic Year */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Academic Year</Label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-orange-600"
              >
                <option value="">-- All Years --</option>
                {academicYears.map(ay => (
                  <option key={ay._id || ay.year} value={ay.year}>{ay.year}</option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Class</Label>
              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setFilterSection('');
                }}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-orange-600"
              >
                <option value="">-- All Classes --</option>
                {classes.map(c => (
                  <option key={c._id || c.name} value={c.name}>Class {c.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Section</Label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-orange-600"
                disabled={!filterClass}
              >
                <option value="">-- All Sections --</option>
                {availableSections.map(s => (
                  <option key={s._id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            {/* Student Status */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Student Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-orange-600"
              >
                <option value="all">-- All Statuses --</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Promoted">Promoted</option>
              </select>
            </div>

            {/* RTE / General */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">RTE / General</Label>
              <select
                value={filterRteType}
                onChange={(e) => setFilterRteType(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-orange-600"
              >
                <option value="all">-- All Types --</option>
                <option value="General">General</option>
                <option value="RTE">RTE</option>
              </select>
            </div>

            {/* Student Search */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Student Search</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Name / Adm No..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="h-9 text-xs pl-8 bg-white"
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50/70 p-3 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-purple-900">
            Selected: <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">{selectedStudentIds.length} of {students.length} Students</span>
          </span>

          {selectedStudentIds.length > 0 && (
            <button
              onClick={handleClearSelection}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Clear Selection
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStudentIds(students.map(s => s._id))}
            className="text-xs font-bold text-purple-800 hover:bg-purple-100 h-8"
          >
            Select All ({students.length})
          </Button>
        </div>
      </div>

      {/* Student List Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedStudents.length > 0 &&
                      paginatedStudents.every(s => selectedStudentIds.includes(s._id))
                    }
                    onChange={handleSelectAllOnPage}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                    title="Select all on this page"
                  />
                </TableHead>
                <TableHead className="w-20">Photo</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Course Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-32 text-gray-500">
                    No matching students found for ID Card generation.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student._id);
                  const photo = student.passport_photo || student.photoUrl || '';
                  return (
                    <TableRow key={student._id} className={isSelected ? 'bg-orange-50/40' : ''}>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student._id)}
                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-9 h-11 rounded border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center shadow-2xs">
                          {photo ? (
                            <img
                              src={getImageUrl(photo)}
                              alt={student.studentName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full bg-gray-100 flex items-center justify-center"
                            style={{ display: photo ? 'none' : 'flex' }}
                          >
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-gray-900">
                        {student.admissionNumber}
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 text-xs">
                        {student.studentName}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-700">
                        {student.currentClass}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-700">
                        {student.section || 'A'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.courseType === 'RTE' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {student.courseType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreview(student)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                            title="Preview ID Card"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generatePdfForStudents([student])}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintStudents([student])}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 w-8 p-0"
                            title="Print Card"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      {/* ID Card Full-Size Interactive Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Student ID Card Preview"
        className="max-w-md"
      >
        {previewStudent && (
          <div className="space-y-4 pt-2">
            {/* Modal Controls Toolbar */}
            <div className="flex items-center justify-between bg-gray-100 p-2 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.5))}
                  className="h-8 w-8 p-0"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.6))}
                  className="h-8 w-8 p-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                  className="h-8 w-8 p-0"
                  title="Reset Zoom"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-bold text-gray-600 ml-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePdfForStudents([previewStudent])}
                  className="h-8 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-blue-600" /> PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePrintStudents([previewStudent])}
                  className="h-8 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              </div>
            </div>

            {/* Centered ID Card Display Box */}
            <div className="flex justify-center p-4 bg-gray-100/60 rounded-2xl border border-gray-200 overflow-auto max-h-[560px]">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
              >
                <StudentIdCard ref={previewRef} student={previewStudent} />
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setIsPreviewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Render Container for Batch Export & Printing */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }} ref={hiddenRenderRef}>
        {batchStudentsToRender.map(student => (
          <div key={`render-${student._id}`} className="batch-id-card p-2 bg-white">
            <StudentIdCard student={student} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdCards;
