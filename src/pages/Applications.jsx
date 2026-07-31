import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { FileText, Plus, CheckCircle, Trash2, Settings } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useApplicationsQuery, useClassesQuery, useQueryInvalidator } from '../hooks/useSchoolQueries';

const Applications = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [assignSection, setAssignSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [newAppLoading, setNewAppLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [customIds, setCustomIds] = useState({ nextApplicationNo: '', applicationFeeAmount: '' });
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    applicationNo: '',
    studentName: '',
    applyingClass: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    feePaid: false,
    adminNo: ''
  });
  const { data: applications = [], isLoading: applicationsLoading } = useApplicationsQuery();
  const { data: classesData = [], isLoading: classesLoading } = useClassesQuery();
  const { invalidateApplications } = useQueryInvalidator();

  const isLoading = applicationsLoading || classesLoading;

  const sortedClasses = React.useMemo(() => {
    return [...classesData].sort((a, b) => {
      const preSchoolOrder = { 'prekg': 1, 'lkg': 2, 'ukg': 3 };
      const aNorm = String(a.name).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const bNorm = String(b.name).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const isPreA = preSchoolOrder[aNorm];
      const isPreB = preSchoolOrder[bNorm];
      if (isPreA && isPreB) return isPreA - isPreB;
      if (isPreA) return -1;
      if (isPreB) return 1;
      const numA = parseInt(aNorm, 10);
      const numB = parseInt(bNorm, 10);
      const isNumA = !isNaN(numA);
      const isNumB = !isNaN(numB);
      if (isNumA && isNumB) return numA - numB;
      if (isNumA) return 1;
      if (isNumB) return -1;
      return aNorm.localeCompare(bNorm);
    });
  }, [classesData]);

  const handleNewApplication = async () => {
    setNewAppLoading(true);
    setIsModalOpen(true);
    try {
      const res = await api.get('/applications/next-numbers');
      setFormData(prev => ({
        ...prev,
        applicationNo: res.data.applicationNo,
        adminNo: ''
      }));
    } catch (error) {
      console.error("Error fetching next numbers", error);
    } finally {
      setNewAppLoading(false);
    }
  };

  const toggleFeePaid = async (id, currentStatus) => {
    try {
      await api.put(`/applications/${id}/fee-status`, { feePaid: !currentStatus });
      invalidateApplications();
    } catch (error) {
      console.error("Error updating fee status", error);
    }
  };

  useEffect(() => {
    fetchCustomIds();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [applications.length]);

  const fetchCustomIds = async () => {
    try {
      const res = await api.get('/settings');
      setCustomIds({ 
        nextApplicationNo: res.data.nextApplicationNo || '',
        applicationFeeAmount: res.data.applicationFeeAmount || ''
      });
    } catch(e) { console.error(e); }
  };

  const handleSaveCustomIds = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings', customIds);
      setIsCustomizeModalOpen(false);
      toastSuccess('Custom ID Formats saved successfully!');
    } catch(e) {
      toastError('Error saving custom IDs');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    const englishNameFields = ['studentName', 'parentName', 'fatherName', 'motherName', 'guardianName', 'religion', 'caste', 'specific', 'community'];
    if (englishNameFields.includes(name)) {
      processedValue = value.replace(/[^a-zA-Z\s.]/g, '');
    } else if (name === 'studentNameTamil') {
      processedValue = value.replace(/[0-9]/g, '');
    } else if (['aadharNo', 'fatherPhone', 'motherPhone', 'guardianPhone'].includes(name)) {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fatherPhone && !/^[6-9]\d{9}$/.test(formData.fatherPhone)) {
      toastError("Father Phone Number must be 10 digits starting with 6, 7, 8, or 9.");
      return;
    }
    if (formData.motherPhone && !/^[6-9]\d{9}$/.test(formData.motherPhone)) {
      toastError("Mother Phone Number must be 10 digits starting with 6, 7, 8, or 9.");
      return;
    }
    if (formData.guardianPhone && !/^[6-9]\d{9}$/.test(formData.guardianPhone)) {
      toastError("Guardian Phone Number must be 10 digits starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/applications', formData);
      setIsModalOpen(false);
      setFormData({
        applicationNo: '',
        studentName: '',
        applyingClass: '',
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        guardianName: '',
        guardianPhone: '',
        feePaid: false,
        adminNo: ''
      });
      invalidateApplications();
      toastSuccess('Application submitted successfully.');
    } catch (error) {
      console.error("Error creating application", error);
      toastError(error.response?.data?.error || 'Error creating application');
    } finally {
      setLoading(false);
    }
  };

  const navigateToAdmission = (id) => {
    window.location.href = `/dashboard/admissions?applicationId=${id}`;
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedAppId || !assignSection) return;
    
    setLoading(true);
    try {
      await api.put(`/applications/${selectedAppId}/approve`, { section: assignSection });
      setIsApproveModalOpen(false);
      invalidateApplications();
      toastSuccess('Application approved successfully.');
    } catch (error) {
      console.error("Error approving application", error);
      toastError(error.response?.data?.error || 'Error approving application');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (feeStatusFilter === 'ALL') return true;
    if (feeStatusFilter === 'PAID') return app.feePaid;
    if (feeStatusFilter === 'UNPAID') return !app.feePaid;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const paginatedApplications = filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading && applications.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <FileText className="mr-3 text-orange-600" size={32} />
            Applications
          </h1>
          <p className="text-gray-500  mt-2">Manage student enrollment applications</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={feeStatusFilter}
            onChange={(e) => setFeeStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
          >
            <option value="ALL">All Fees</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Not Paid</option>
          </select>
          <Button variant="outline" onClick={() => setIsCustomizeModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button onClick={handleNewApplication} loading={newAppLoading} loadingText="Preparing...">
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Father Name</TableHead>
                <TableHead>Father Phone</TableHead>
                <TableHead>Mother Name</TableHead>
                <TableHead>Mother Phone</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>App Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center h-32 text-gray-500">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((app) => (
                  <TableRow key={app._id || app.id}>
                    <TableCell className="font-mono text-sm">{app.applicationId}</TableCell>
                    <TableCell className="font-medium">{app.studentName}</TableCell>
                    <TableCell>{/^\d+$/.test(app.applyingClass) ? `${app.applyingClass} STD` : app.applyingClass}</TableCell>
                    <TableCell>{app.fatherName || '-'}</TableCell>
                    <TableCell>{app.fatherPhone || '-'}</TableCell>
                    <TableCell>{app.motherName || '-'}</TableCell>
                    <TableCell>{app.motherPhone || '-'}</TableCell>
                    <TableCell>{app.processedById?.username || '-'}</TableCell>
                    <TableCell>
                      {app.status === 'APPROVED' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.feePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {app.feePaid ? 'Paid' : 'Not Paid'}
                        </span>
                      ) : (
                        <select 
                          value={app.feePaid ? "true" : "false"}
                          onChange={(e) => {
                            const isPaid = e.target.value === "true";
                            if(app.feePaid !== isPaid) toggleFeePaid(app._id || app.id, app.feePaid);
                          }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors border-0 outline-none focus:ring-0 appearance-none text-center ${
                            app.feePaid ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <option value="true" className="bg-white text-emerald-800">Paid</option>
                          <option value="false" className="bg-white text-red-800">Not Paid</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {app.status === 'PENDING' && (
                        <Button variant="outline" size="sm" onClick={() => navigateToAdmission(app._id || app.id)} className="text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      {currentUser.role === 'SUPER_ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                          const accepted = await confirm({
                            title: 'Delete Application',
                            description: 'Are you sure you want to delete this application?',
                            confirmText: 'Delete',
                            tone: 'danger'
                          });

                          if (!accepted) {
                            return;
                          }

                          setDeleteLoadingId(app._id || app.id);
                          try {
                            await api.delete(`/applications/${app._id || app.id}`);
                            invalidateApplications();
                            toastSuccess('Application deleted successfully.');
                          } catch(e) { toastError('Error deleting application'); }
                          finally {
                            setDeleteLoadingId(null);
                          }
                        }}
                        loading={deleteLoadingId === (app._id || app.id)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="KASTHURI NURSERY & PRIMARY SCHOOL APPLICATION FORM" className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Main Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicationNo">Application No. <span className="text-red-500">*</span></Label>
              <Input id="applicationNo" name="applicationNo" value={formData.applicationNo} onChange={handleInputChange} required readOnly className="bg-gray-100 font-bold" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="applyingClass">Admission for <span className="text-red-500">*</span></Label>
              <select id="applyingClass" name="applyingClass" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={formData.applyingClass} onChange={handleInputChange} required>
                <option value="">Select Class...</option>
                {sortedClasses.map((cls) => (
                  <option key={cls._id || cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name <span className="text-red-500">*</span></Label>
              <Input id="studentName" name="studentName" value={formData.studentName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" placeholder="Enter student name" required />
            </div>
          </div>

          {/* Parent & Guardian Details */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-600"></span>
              Parent Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father Name <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" placeholder="Enter father name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherPhone">Father Phone Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="fatherPhone" name="fatherPhone" type="text" maxLength={10} value={formData.fatherPhone} onChange={handleInputChange} placeholder="10 digit mobile number (starts with 6-9)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Mother Name <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="motherName" name="motherName" value={formData.motherName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" placeholder="Enter mother name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherPhone">Mother Phone Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="motherPhone" name="motherPhone" type="text" maxLength={10} value={formData.motherPhone} onChange={handleInputChange} placeholder="10 digit mobile number (starts with 6-9)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian Name <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" placeholder="Enter guardian name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Guardian Phone Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <Input id="guardianPhone" name="guardianPhone" type="text" maxLength={10} value={formData.guardianPhone} onChange={handleInputChange} placeholder="10 digit mobile number (starts with 6-9)" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="feePaid" 
              name="feePaid" 
              checked={formData.feePaid} 
              onChange={(e) => setFormData({...formData, feePaid: e.target.checked})} 
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
            />
            <Label htmlFor="feePaid" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Application Fee Paid</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading} loadingText="Submitting...">
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>



      <Modal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} title="Settings">
        <form onSubmit={handleSaveCustomIds} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nextApplicationNo">Next Application No.</Label>
            <Input id="nextApplicationNo" value={customIds.nextApplicationNo} onChange={(e) => setCustomIds({...customIds, nextApplicationNo: e.target.value})} placeholder="e.g. APP-2027-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="applicationFeeAmount">Application Fee Amount (₹)</Label>
            <Input id="applicationFeeAmount" type="number" value={customIds.applicationFeeAmount} onChange={(e) => setCustomIds({...customIds, applicationFeeAmount: e.target.value})} placeholder="e.g. 500" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsCustomizeModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading} loadingText="Saving...">Save Formats</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Applications;
