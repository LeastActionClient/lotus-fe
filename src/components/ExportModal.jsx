import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from './ui/Modal';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toastWarning } from '../services/toastService';

const ExportModal = ({
  isOpen,
  onClose,
  selectedStudentIds = [],
  filteredStudentIds = [],
  defaultScope = 'CLASS',
  isOldStudentsPage = false
}) => {
  const [exportScope, setExportScope] = useState(defaultScope);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [academicYear, setAcademicYear] = useState('All');
  const [exitType, setExitType] = useState('All');
  const [feeStatus, setFeeStatus] = useState('All');
  const [studentGroup, setStudentGroup] = useState('All');
  const [searchName, setSearchName] = useState('');
  const [searchAdmissionNumber, setSearchAdmissionNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const effectiveStudentIds = selectedStudentIds.length > 0 ? selectedStudentIds : filteredStudentIds;

  const resetFilters = () => {
    setClassFilter('All');
    setSectionFilter('All');
    setAcademicYear('All');
    setExitType('All');
    setFeeStatus('All');
    setStudentGroup('All');
    setSearchName('');
    setSearchAdmissionNumber('');
  };

  const handleScopeChange = (newScope) => {
    setExportScope(newScope);
    resetFilters();
    if (newScope === 'FILTERED') {
      return;
    }
    if (newScope === 'CLASS') {
      if (classes.length > 0) {
        setClassFilter(classes[0].name);
      }
    } else if (newScope === 'SECTION') {
      if (classes.length > 0) {
        setClassFilter(classes[0].name);
        if (classes[0].sections && classes[0].sections.length > 0) {
          setSectionFilter(classes[0].sections[0].name);
        } else {
          setSectionFilter('');
        }
      }
    } else if (newScope === 'ACADEMIC_YEAR') {
      if (academicYears.length > 0) {
        setAcademicYear(academicYears[0]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      let targetScope = defaultScope;
      if (effectiveStudentIds.length === 1) {
        targetScope = 'SINGLE';
      } else if (effectiveStudentIds.length > 1) {
        targetScope = defaultScope === 'FILTERED' ? 'FILTERED' : 'SELECTED';
      }
      setExportScope(targetScope);
      
      const fetchFilters = async () => {
        try {
          const [clsRes, stuRes, ayRes] = await Promise.all([
            api.get('/classes'),
            api.get('/students'),
            api.get('/academic-years').catch(() => ({ data: [] }))
          ]);
          setClasses(clsRes.data);
          
          let years = ayRes.data.map(y => y.year);
          if (years.length === 0) {
            years = [...new Set(stuRes.data.map(s => s.academicYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
          }
          setAcademicYears(years);

          // Populate initial defaults based on resolved scope
          if (targetScope === 'CLASS') {
            if (clsRes.data.length > 0) setClassFilter(clsRes.data[0].name);
          } else if (targetScope === 'SECTION') {
            if (clsRes.data.length > 0) {
              setClassFilter(clsRes.data[0].name);
              if (clsRes.data[0].sections?.length > 0) {
                setSectionFilter(clsRes.data[0].sections[0].name);
              } else {
                setSectionFilter('');
              }
            }
          } else if (targetScope === 'ACADEMIC_YEAR') {
            if (years.length > 0) setAcademicYear(years[0]);
          } else if (targetScope === 'OLD_STUDENTS') {
            setClassFilter('All');
            setSectionFilter('All');
            setAcademicYear('All');
          } else if (targetScope === 'FILTERED') {
            // Current visible rows should export exactly as filtered on the page.
            setClassFilter('All');
            setSectionFilter('All');
            setAcademicYear('All');
          }
        } catch (error) {
          console.error("Error fetching filters", error);
        }
      };
      fetchFilters();
    }
  }, [isOpen, effectiveStudentIds.length, defaultScope]);

  const selectedClassObj = classes.find(c => c.name === classFilter);

  const handleExport = async (exportType) => {
    setLoading(true);
    setProgressText('Preparing Export...');
    
    try {
      setTimeout(() => setProgressText(`Generating ${exportType}...`), 1000);
      
      const payload = {
        exportScope,
        exportType,
        studentIds: effectiveStudentIds,
        classFilter: exportScope === 'FILTERED' ? null : (classFilter === 'All' ? null : classFilter),
        sectionFilter: sectionFilter === 'All' ? null : sectionFilter,
        academicYear: academicYear === 'All' ? null : academicYear,
        exitType,
        feeStatus,
        studentGroup,
        searchName,
        searchAdmissionNumber
      };

      const response = await api.post('/exports/students', payload, {
        responseType: 'blob', // Important for file download
        timeout: 60000 // 60 seconds timeout for large exports
      });

      setProgressText('Downloading...');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_export_${new Date().getTime()}.${exportType === 'Excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      onClose();
    } catch (error) {
      console.error("Export error", error);
      let errorMessage = 'Error generating export. Please check filters or try a smaller batch.';
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          if (json.error) errorMessage = json.error;
        } catch (e) {
          // ignore parsing error
        }
      }
      toastWarning(errorMessage);
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={!loading ? onClose : () => {}} title="Export Student Records" size="lg">
      <div className="space-y-6 pt-4">
        {/* Scope Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Choose Export Scope</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${effectiveStudentIds.length <= 1 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-orange-50'}`}>
              <input type="radio" name="scope" value="SELECTED" checked={exportScope === 'SELECTED'} onChange={(e) => handleScopeChange(e.target.value)} disabled={effectiveStudentIds.length <= 1} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm">Selected Students ({effectiveStudentIds.length})</span>
            </label>
            <label className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${effectiveStudentIds.length !== 1 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-orange-50'}`}>
              <input type="radio" name="scope" value="SINGLE" checked={exportScope === 'SINGLE'} onChange={(e) => handleScopeChange(e.target.value)} disabled={effectiveStudentIds.length !== 1} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm">Single Student</span>
            </label>
            {!isOldStudentsPage && (
              <>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
                  <input type="radio" name="scope" value="CLASS" checked={exportScope === 'CLASS'} onChange={(e) => handleScopeChange(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
                  <span className="text-sm">Entire Class</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
                  <input type="radio" name="scope" value="SECTION" checked={exportScope === 'SECTION'} onChange={(e) => handleScopeChange(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
                  <span className="text-sm">Entire Section</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
                  <input type="radio" name="scope" value="ACADEMIC_YEAR" checked={exportScope === 'ACADEMIC_YEAR'} onChange={(e) => handleScopeChange(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
                  <span className="text-sm">Entire Academic Year</span>
                </label>
              </>
            )}
            <label className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${effectiveStudentIds.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-orange-50'}`}>
              <input type="radio" name="scope" value="FILTERED" checked={exportScope === 'FILTERED'} onChange={(e) => handleScopeChange(e.target.value)} disabled={effectiveStudentIds.length === 0} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm">Current Visible Results ({effectiveStudentIds.length})</span>
            </label>
            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
              <input type="radio" name="scope" value="OLD_STUDENTS" checked={exportScope === 'OLD_STUDENTS'} onChange={(e) => handleScopeChange(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm">Entire Old Students</span>
            </label>
          </div>
        </div>

        {/* Dynamic Filters based on Scope */}
        {(exportScope === 'SELECTED' || exportScope === 'CLASS' || exportScope === 'SECTION' || exportScope === 'ACADEMIC_YEAR' || exportScope === 'OLD_STUDENTS') && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <Label className="text-base font-semibold">Filter Students</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {(exportScope === 'ACADEMIC_YEAR' || exportScope === 'OLD_STUDENTS') && (
                <div className="space-y-1">
                  <Label>Academic Year</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                    <option value="All">All Years</option>
                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {(exportScope === 'CLASS' || exportScope === 'SECTION' || exportScope === 'OLD_STUDENTS') && (
                <div className="space-y-1">
                  <Label>Class</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={classFilter} onChange={(e) => {
                    const newClass = e.target.value;
                    setClassFilter(newClass);
                    const clsObj = classes.find(c => c.name === newClass);
                    if (clsObj && clsObj.sections && clsObj.sections.length > 0) {
                      setSectionFilter(clsObj.sections[0].name);
                    } else {
                      setSectionFilter('');
                    }
                  }}>
                    {exportScope === 'OLD_STUDENTS' && <option value="All">All Classes</option>}
                    {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {((exportScope === 'SECTION' || exportScope === 'CLASS') || (exportScope === 'OLD_STUDENTS' && classFilter !== 'All')) && selectedClassObj?.sections?.length > 0 && (
                <div className="space-y-1">
                  <Label>Section</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    {exportScope === 'OLD_STUDENTS' && <option value="All">All Sections</option>}
                    {selectedClassObj?.sections?.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {exportScope === 'OLD_STUDENTS' && (
                <div className="space-y-1">
                  <Label>Exit Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={exitType} onChange={(e) => setExitType(e.target.value)}>
                    <option value="All">All Exit Types</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Discontinued">Discontinued</option>
                    <option value="Left School">Left School</option>
                    <option value="Completed">Completed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label>Fee Status</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)}>
                  <option value="All">All Students</option>
                  <option value="Pending">Pending Fee Students</option>
                  <option value="Paid">Fully Paid Students</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Student Group</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={studentGroup} onChange={(e) => setStudentGroup(e.target.value)}>
                  <option value="All">All Groups</option>
                  <option value="RTE">RTE Students</option>
                  <option value="General">General Students</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <Label>Search Name</Label>
                <Input placeholder="Filter by Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Search Admission No</Label>
                <Input placeholder="Filter by Adm No" value={searchAdmissionNumber} onChange={(e) => setSearchAdmissionNumber(e.target.value)} />
              </div>

            </div>
          </div>
        )}

        {/* Actions / Progress */}
        <div className="pt-6 flex justify-end gap-3 border-t border-gray-200">
          {loading ? (
            <div className="flex items-center text-orange-600 font-medium">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {progressText}
            </div>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => handleExport('PDF')}>
                <FileText className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleExport('Excel')}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
