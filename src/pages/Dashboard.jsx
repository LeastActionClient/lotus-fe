import React, { useMemo, useState } from 'react';

import { ArrowUpCircle, BookOpen, Calculator, Calendar, DollarSign, FileText, GraduationCap, IndianRupee, Layers, School, TrendingUp, Users } from 'lucide-react';
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
  const { invalidateDashboard, invalidateAcademicYears, invalidateStudents } = useQueryInvalidator();
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
    teachers: 0,
    tuitionStudents: 0,
    abacusStudents: 0,
    classesCount: 0,
    feeCategories: 0,
  };
  const normalizeClassName = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const classSortFn = (a, b) => {
    const preSchoolOrder = { 'prekg': 1, 'lkg': 2, 'ukg': 3 };
    const aNorm = normalizeClassName(a);
    const bNorm = normalizeClassName(b);
    const isPreA = preSchoolOrder[aNorm];
    const isPreB = preSchoolOrder[bNorm];
    if (isPreA && isPreB) return isPreA - isPreB;
    if (isPreA) return -1;
    if (isPreB) return 1;
    const numA = /^(\d+)$/.test(aNorm) ? parseInt(aNorm, 10) : NaN;
    const numB = /^(\d+)$/.test(bNorm) ? parseInt(bNorm, 10) : NaN;
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);
    if (isNumA && isNumB) return numA - numB;
    if (isNumA) return 1;
    if (isNumB) return -1;
    return aNorm.localeCompare(bNorm);
  };

  const rawClasses = overview.classes || [];
  const classes = useMemo(() => {
    return [...rawClasses].sort((x, y) => classSortFn(x.name, y.name));
  }, [rawClasses]);

  const activeYear = overview.activeYear || null;
  const academicYears = overview.academicYears || [];

  const normalizeYear = (yr) => {
    if (!yr) return '';
    return String(yr).replace(/[\u2013]/g, '-').trim();
  };

  const matchedFromYearDoc = useMemo(() => {
    const normFrom = normalizeYear(fromYear);
    return academicYears.find((y) => normalizeYear(y.year) === normFrom);
  }, [academicYears, fromYear]);

  const matchedToYearDoc = useMemo(() => {
    const normTo = normalizeYear(toYear);
    return academicYears.find((y) => normalizeYear(y.year) === normTo);
  }, [academicYears, toYear]);

  const toYearExists = useMemo(() => {
    return Boolean(matchedToYearDoc);
  }, [matchedToYearDoc]);

  const handleOpenPromote = async () => {
    let latestOverview = overview;
    try {
      const refetched = await refetch();
      if (refetched.data) {
        latestOverview = refetched.data;
      }
    } catch (err) {
      console.error("Error refetching dashboard overview", err);
    }

    const latestActiveYear = latestOverview.activeYear || null;
    const latestAcademicYears = latestOverview.academicYears || [];
    const latestClasses = latestOverview.classes || [];
    const sortedClasses = [...latestClasses].sort((x, y) => classSortFn(x.name, y.name));

    let defaultFromYear = '';
    if (latestActiveYear?.year) {
      defaultFromYear = latestActiveYear.year;
    } else if (latestAcademicYears.length > 0) {
      defaultFromYear = latestAcademicYears[0].year;
    }

    if (defaultFromYear) {
      setFromYear(defaultFromYear);
      const parts = String(defaultFromYear).split(/[-\u2013]/);
      if (parts.length === 2 && !Number.isNaN(Number(parts[0])) && !Number.isNaN(Number(parts[1]))) {
        setToYear(`${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`);
      }
    } else {
      setFromYear('');
      setToYear('');
    }

    const mapping = {};
    sortedClasses.forEach((c, idx) => {
      mapping[c.name] = idx < sortedClasses.length - 1 ? sortedClasses[idx + 1].name : 'Graduated';
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

    const normalizedFromInput = normalizeYear(fromYear);
    const normalizedToInput = normalizeYear(toYear);
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(normalizedFromInput) || !yearRegex.test(normalizedToInput)) {
      toastWarning('Academic years must be in YYYY-YYYY format.');
      return;
    }

    if (!toYearExists) {
      toastWarning(`Please create Academic Year ${toYear} before promoting students.`);
      return;
    }

    const finalFromYear = matchedFromYearDoc ? matchedFromYearDoc.year : fromYear;
    const finalToYear = matchedToYearDoc ? matchedToYearDoc.year : toYear;

    const accepted = await confirm({
      title: 'Bulk Promote Students',
      description: `Are you sure you want to promote students from ${finalFromYear} to ${finalToYear}? This will update their current class and academic year.`,
      confirmText: 'Promote',
      tone: 'primary'
    });

    if (!accepted) return;

    setIsPromoting(true);
    try {
      const response = await api.post('/students/promote', {
        fromAcademicYear: finalFromYear,
        toAcademicYear: finalToYear,
        fromAcademicYearId: matchedFromYearDoc?._id || null,
        toAcademicYearId: matchedToYearDoc?._id || null,
        classMapping
      }, {
        timeout: 180000, // 3 minutes timeout for bulk promotion
        skipToast: true
      });
      toastSuccess(response.data.message);
      if (response.data.failures && response.data.failures.length > 0) {
        response.data.failures.forEach(f => {
          toastWarning(`Promotion failed for student ${f.studentName} (Adm: ${f.admissionNumber}): ${f.error}`, { duration: 6000 });
        });
      }
      setIsPromoteModalOpen(false);
      await Promise.all([invalidateDashboard(), invalidateAcademicYears(), invalidateStudents()]);
    } catch (error) {
      console.error('Error promoting students', error);
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response;
      toastError(
        isTimeout
          ? 'Failed to promote students due to request timeout. Please check your network connection or if students were already promoted.'
          : (error.response?.data?.error || 'Failed to promote students. Check console for details.')
      );
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
        <Button onClick={handleOpenPromote} className="bg-blue-600 text-white shadow-md hover:bg-blue-700">
          <ArrowUpCircle className="mr-2 h-5 w-5" /> Bulk Promote Students
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.applications}</div>
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
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.students}</div>
            <p className="mt-1 text-xs text-gray-500">Currently active enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-sky-700">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-sky-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.teachers}</div>
            <p className="mt-1 text-xs text-gray-500">Total teaching staff</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Tuition Students</CardTitle>
            <BookOpen className="h-4 w-4 text-teal-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.tuitionStudents}</div>
            <p className="mt-1 text-xs text-gray-500">Enrolled in tuition course</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Abacus Students</CardTitle>
            <Calculator className="h-4 w-4 text-indigo-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.abacusStudents}</div>
            <p className="mt-1 text-xs text-gray-500">Enrolled in abacus course</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700">Classes</CardTitle>
            <School className="h-4 w-4 text-rose-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.classesCount}</div>
            <p className="mt-1 text-xs text-gray-500">Total classes configured</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-lime-700">Fee Categories</CardTitle>
            <Layers className="h-4 w-4 text-lime-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.feeCategories}</div>
            <p className="mt-1 text-xs text-gray-500">Total fee categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-700">RTE Students</CardTitle>
            <Users className="h-4 w-4 text-violet-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{stats.RTEStudents}</div>
            <p className="mt-1 text-xs text-gray-500">Students marked as RTE</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Academic Year</CardTitle>
            <Calendar className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{activeYear?.year || 'None'}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4">
            <div>
              <Label>From Academic Year</Label>
              <Input 
                value={fromYear} 
                onChange={(e) => setFromYear(e.target.value)} 
                placeholder="e.g., 2028-2029" 
                className="font-medium text-gray-800" 
              />
            </div>
            <div>
              <Label>To Academic Year</Label>
              <Input 
                value={toYear} 
                onChange={(e) => setToYear(e.target.value)} 
                placeholder="e.g., 2029-2030" 
                className="font-medium text-gray-800" 
              />
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
                    className="flex h-9 w-48 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" loading={isPromoting} loadingText="Promoting...">
              Confirm Promotion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
