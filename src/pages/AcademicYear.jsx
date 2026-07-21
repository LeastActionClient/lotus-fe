import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Calendar, Plus, CheckCircle, AlertCircle, PlayCircle, ToggleRight } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import { useAcademicYearsQuery, useQueryInvalidator } from '../hooks/useSchoolQueries';

const AcademicYearPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    year: '',
    status: 'Active'
  });
  const { data: academicYears = [], isLoading } = useAcademicYearsQuery();
  const { invalidateAcademicYears, invalidateDashboard } = useQueryInvalidator();

  const academicYears = academicYearsData;
  const currentActiveYear = academicYears.find(y => y.status === 'Active');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Format helper: auto replace characters other than numbers and hyphens
    let processedValue = value.replace(/[^0-9–-]/g, '');
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const validateAcademicYear = (year) => {
    const yearRegex = /^(\d{4})[–-](\d{4})$/;
    const match = year.match(yearRegex);
    if (!match) {
      return 'Academic Year format must be YYYY–YYYY (e.g., 2028–2029).';
    }
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (end !== start + 1) {
      return 'The ending year must always equal the starting year + 1.';
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errorMsg = validateAcademicYear(formData.year);
    if (errorMsg) {
      toastWarning(errorMsg);
      return;
    }

    setSaveLoading(true);
    try {
      await api.post('/academic-years', formData);
      toastSuccess('Academic Year created successfully.');
      setIsModalOpen(false);
      setFormData({ year: '', status: 'Active' });
      await Promise.all([invalidateAcademicYears(), invalidateDashboard()]);
    } catch (error) {
      console.error('Error saving academic year:', error);
      toastError(error.response?.data?.error || 'Failed to save Academic Year');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Completed' : 'Active';
    try {
      await api.put(`/academic-years/${id}/status`, { status: nextStatus });
      toastSuccess(`Academic Year status updated to ${nextStatus}.`);
      await Promise.all([invalidateAcademicYears(), invalidateDashboard()]);
    } catch (error) {
      console.error('Error updating status:', error);
      toastError(error.response?.data?.error || 'Failed to update Academic Year status');
    }
  };

  if (isLoading) return <PageLoader text="Loading Academic Years..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <Calendar className="mr-3 text-orange-600 animate-pulse" size={32} />
            Academic Year Management
          </h1>
          <p className="text-gray-500 mt-2">Manage ERP centralized academic years, activate default sessions, and view promotion status</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all duration-200 active:scale-95 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Academic Year
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Current Status Card */}
        <div className="md:col-span-1">
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <Calendar size={200} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-orange-100 flex items-center">
                Current Academic Year
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {currentActiveYear ? (
                <>
                  <div className="text-5xl font-extrabold tracking-tight drop-shadow">
                    {currentActiveYear.year}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-orange-700 shadow-sm uppercase tracking-wider">
                      {currentActiveYear.status}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-orange-100">
                    No Active Year
                  </div>
                  <p className="text-sm text-orange-100 mt-2">
                    Please activate an academic year below to configure the ERP session.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Academic Year History */}
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader className="border-b pb-4 bg-gray-50/50">
              <CardTitle className="text-lg font-semibold text-gray-700">Academic Year History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Created Date</TableHead>
                      <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-32 text-gray-500 font-medium">
                          No academic years configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      academicYears.map((ay) => (
                        <TableRow key={ay._id} className="hover:bg-gray-50/50 transition-all duration-150">
                          <TableCell className="font-semibold text-gray-800 text-sm tracking-wide">
                            {ay.year}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              ay.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {ay.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-500 text-xs">
                            {new Date(ay.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-gray-500 text-xs">
                            {new Date(ay.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </TableCell>
                          <TableCell className="text-right">
                            {ay.status === 'Active' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleStatusChange(ay._id, 'Active')}
                                className="text-amber-600 border-amber-200 hover:bg-amber-50 active:scale-95 transition-all duration-150"
                              >
                                <AlertCircle className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Complete</span><span className="sm:hidden">Done</span>
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleStatusChange(ay._id, 'Completed')}
                                className="text-green-600 border-green-200 hover:bg-green-50 active:scale-95 transition-all duration-150"
                                disabled={!!currentActiveYear}
                                title={currentActiveYear ? "Complete current active year first" : "Activate this session"}
                              >
                                <PlayCircle className="h-4 w-4 mr-1" /> Activate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Academic Year Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Academic Year">
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="year">Academic Year *</Label>
            <Input 
              id="year" 
              name="year" 
              value={formData.year} 
              onChange={handleInputChange} 
              placeholder="e.g. 2028–2029" 
              required 
              maxLength={9}
            />
            <p className="text-xs text-gray-400 font-medium">Use YYYY–YYYY format. Ending year must be starting year + 1.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all active:scale-95" disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicYearPage;
