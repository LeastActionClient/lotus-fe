import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, FileText, Loader2, FolderOpen } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';

const PrintExport = () => {
  const [exportScope, setExportScope] = useState('CLASS');
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [academicYear, setAcademicYear] = useState('');
  const [exitType, setExitType] = useState('All');
  const [feeStatus, setFeeStatus] = useState('All');
  const [studentGroup, setStudentGroup] = useState('All');
  const [searchName, setSearchName] = useState('');
  const [searchAdmissionNumber, setSearchAdmissionNumber] = useState('');

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [clsRes, stuRes] = await Promise.all([
          api.get('/classes'),
          api.get('/students')
        ]);
        setClasses(clsRes.data);
        if (clsRes.data.length > 0) {
          setClassFilter(clsRes.data[0].name);
        }
        const years = [...new Set(stuRes.data.map(s => s.academicYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
        setAcademicYears(years);
        if (years.length > 0) {
          setAcademicYear(years[0]);
        }
      } catch (error) {
        console.error("Error fetching filters", error);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, []);

  const selectedClassObj = classes.find(c => c.name === classFilter);

  const handleExport = async (exportType) => {
    setLoading(true);
    setProgressText('Preparing Export...');
    
    try {
      setTimeout(() => setProgressText(`Generating ${exportType}...`), 1000);
      
      const payload = {
        exportScope,
        exportType,
        studentIds: [],
        classFilter: classFilter === 'All' ? null : classFilter,
        sectionFilter: sectionFilter === 'All' ? null : sectionFilter,
        academicYear,
        exitType,
        feeStatus,
        studentGroup,
        searchName,
        searchAdmissionNumber
      };

      const response = await api.post('/exports/students', payload, {
        responseType: 'blob',
        timeout: 60000
      });

      setProgressText('Downloading...');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_export_${new Date().getTime()}.${exportType === 'Excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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
      alert(errorMessage);
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  if (loadingFilters) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          <FolderOpen className="mr-3 text-orange-600" size={32} />
          Student Export Center
        </h1>
        <p className="text-gray-500 mt-2">Export comprehensive student records in PDF or Excel formats.</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Choose Export Scope</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
              <input type="radio" name="scope" value="CLASS" checked={exportScope === 'CLASS'} onChange={(e) => setExportScope(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm font-medium">Entire Class</span>
            </label>
            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
              <input type="radio" name="scope" value="SECTION" checked={exportScope === 'SECTION'} onChange={(e) => setExportScope(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm font-medium">Entire Section</span>
            </label>
            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
              <input type="radio" name="scope" value="ACADEMIC_YEAR" checked={exportScope === 'ACADEMIC_YEAR'} onChange={(e) => setExportScope(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm font-medium">Entire Academic Year</span>
            </label>
            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
              <input type="radio" name="scope" value="OLD_STUDENTS" checked={exportScope === 'OLD_STUDENTS'} onChange={(e) => setExportScope(e.target.value)} className="text-orange-600 focus:ring-orange-600" />
              <span className="text-sm font-medium">Entire Old Students</span>
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-4 italic">* To export Selected Students or a Single Student, go to the Students Directory and click "Export Center" after selecting students.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Choose Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {(exportScope === 'ACADEMIC_YEAR' || exportScope === 'OLD_STUDENTS') && (
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  <option value="">Select Year</option>
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {(exportScope === 'CLASS' || exportScope === 'SECTION' || exportScope === 'OLD_STUDENTS') && (
              <div className="space-y-2">
                <Label>Class</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter('All'); }}>
                  {exportScope === 'OLD_STUDENTS' && <option value="All">All Classes</option>}
                  {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}

            {(exportScope === 'SECTION' || (exportScope === 'OLD_STUDENTS' && classFilter !== 'All')) && (
              <div className="space-y-2">
                <Label>Section</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                  {exportScope === 'OLD_STUDENTS' && <option value="All">All Sections</option>}
                  {selectedClassObj?.sections?.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {exportScope === 'OLD_STUDENTS' && (
              <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>Fee Status</Label>
              <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)}>
                <option value="All">All Students</option>
                <option value="Pending">Pending Fee Students</option>
                <option value="Paid">Fully Paid Students</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Student Group</Label>
              <select className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={studentGroup} onChange={(e) => setStudentGroup(e.target.value)}>
                <option value="All">All Groups</option>
                <option value="RTE">RTE Students</option>
                <option value="General">General Students</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Search Name</Label>
              <Input placeholder="Filter by Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Search Admission No</Label>
              <Input placeholder="Filter by Adm No" value={searchAdmissionNumber} onChange={(e) => setSearchAdmissionNumber(e.target.value)} />
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t flex justify-end gap-4">
            {loading ? (
              <div className="flex items-center text-orange-600 font-medium bg-orange-50 px-4 py-2 rounded-md">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {progressText}
              </div>
            ) : (
              <>
                <Button type="button" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => handleExport('PDF')}>
                  <FileText className="mr-2 h-4 w-4" /> Generate PDF Report
                </Button>
                <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleExport('Excel')}>
                  <Download className="mr-2 h-4 w-4" /> Generate Excel Report
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintExport;
