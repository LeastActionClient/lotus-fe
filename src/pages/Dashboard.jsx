import React, { useMemo, useState } from 'react';

import { ArrowUpCircle, Calendar, DollarSign, FileText, IndianRupee, TrendingUp, Users } from 'lucide-react';
import api from '../services/api';
import { useDashboardOverviewQuery, useQueryInvalidator } from '../hooks/useSchoolQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';

const Dashboard = () => {
  const { data: overview = {}, isLoading, refetch } = useDashboardOverviewQuery();
  const { invalidateDashboard, invalidateAcademicYears } = useQueryInvalidator();
  const confirm = useConfirm();

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [classMapping, setClassMapping] = useState({});
  const [isPromoting, setIsPromoting] = useState(false);

  const stats = overview.stats || {
    applications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    students: 0,
    collections: 0,
    RTEStudents: 0,
    generalStudents: 0,
  };
  const classes = overview.classes || [];
  const activeYear = overview.activeYear || null;
  const academicYears = overview.academicYears || [];

  const toYearExists = useMemo(() => {
    if (!toYear) return false;
    return academicYears.some((year) => year.year === toYear);
  }, [academicYears, toYear]);

  const handleOpenPromote = () => {
    if (activeYear?.year) {
      setFromYear(activeYear.year);
      const parts = String(activeYear.year).split(/[-\u2013]/);
      if (parts.length === 2 && !Number.isNaN(Number(parts[0])) && !Number.isNaN(Number(parts[1]))) {
        setToYear(`${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`);
      }
    }

    const mapping = {};
    classes.forEach((c, idx) => {
      mapping[c.name] = idx < classes.length - 1 ? classes[idx + 1].name : 'Graduated';
    });
    setClassMapping(mapping);
    setIsPromoteModalOpen(true);
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!fromYear || !toYear) {
      toastWarning('Please specify From and To academic years.');
      return;
    }

    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(fromYear) || !yearRegex.test(toYear)) {
      toastWarning('Academic years must be in YYYY-YYYY format.');
      return;
    }

    const accepted = await confirm({
      title: 'Bulk Promote Students',
      description: `Are you sure you want to promote students from ${fromYear} to ${toYear}? This will update their current class and academic year.`,
      confirmText: 'Promote',
      tone: 'primary'
    });

    if (!accepted) return;

    setIsPromoting(true);
    try {
      const response = await api.post('/students/promote', {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        classMapping
      });
      toastSuccess(response.data.message);
      setIsPromoteModalOpen(false);
      await Promise.all([invalidateDashboard(), invalidateAcademicYears(), refetch()]);
    } catch (error) {
      console.error('Error promoting students', error);
      toastError('Failed to promote students. Check console for details.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoading) return <PageLoader text="Loading dashboard..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-500">Welcome to the School Management System</p>
        </div>
        <Button onClick={handleOpenPromote} className="bg-orange-600 text-white shadow-md hover:bg-orange-700">
          <ArrowUpCircle className="mr-2 h-5 w-5" /> Bulk Promote Students
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.applications}</div>
            <div className="mt-2 flex gap-4">
              <p className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-600">Pending: {stats.pendingApplications}</p>
              <p className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-600">Approved: {stats.approvedApplications}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Active Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.students}</div>
            <p className="mt-1 text-xs text-gray-500">Currently active enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 ">Total Collections</CardTitle>
            <IndianRupee className="h-4 w-4 text-orange-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats.collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              Collected through fees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-700">RTE Students</CardTitle>
            <Users className="h-4 w-4 text-violet-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.RTEStudents}</div>
            <p className="mt-1 text-xs text-gray-500">Students marked as RTE</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Academic Year</CardTitle>
            <Calendar className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeYear?.year || 'None'}</div>
            <p className="mt-1 text-xs text-gray-500">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeYear?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {activeYear?.status || 'Inactive'}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Bulk Promote Students">
        <form onSubmit={handlePromoteSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4">
            <div>
              <Label>From Academic Year</Label>
              <Input value={fromYear} readOnly className="cursor-not-allowed bg-gray-100 font-medium text-gray-800" />
            </div>
            <div>
              <Label>To Academic Year</Label>
              <Input value={toYear} readOnly className="cursor-not-allowed bg-gray-100 font-medium text-gray-800" />
            </div>
          </div>

          {!toYearExists && toYear && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              Please create Academic Year {toYear} before promoting students.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <div className="flex justify-between border-b bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              <span>Current Class</span>
              <span>Promote To</span>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto p-4">
              {classes.map((c) => (
                <div key={c._id} className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <select
                    className="flex h-9 w-48 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    value={classMapping[c.name] || ''}
                    onChange={(e) => setClassMapping((prev) => ({ ...prev, [c.name]: e.target.value }))}
                  >
                    <option value="" disabled>Select next class...</option>
                    {classes.map((targetClass) => (
                      <option key={targetClass._id} value={targetClass.name}>{targetClass.name}</option>
                    ))}
                    <option value="Graduated" className="font-bold text-red-600">Graduated (Old Students)</option>
                  </select>
                </div>
              ))}
              {classes.length === 0 && <p className="py-4 text-center text-sm text-gray-500">No classes available.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPromoteModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700" disabled={isPromoting || !toYearExists}>
              {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
