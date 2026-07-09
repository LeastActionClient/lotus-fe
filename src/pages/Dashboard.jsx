import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, FileText, DollarSign, TrendingUp, ArrowUpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { isRccStudent } from '../utils/studentCategory';

const Dashboard = () => {
  const [stats, setStats] = useState({
    applications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    students: 0,
    collections: 0,
    rccStudents: 0,
    generalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  // Promote Modal State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [classMapping, setClassMapping] = useState({});
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [appsRes, studentsRes, paymentsRes, classesRes] = await Promise.all([
        api.get('/applications'),
        api.get('/students'),
        api.get('/payments'),
        api.get('/classes')
      ]);

      const totalCollections = paymentsRes.data.reduce((sum, payment) => sum + payment.amount, 0);

      const pendingApps = appsRes.data.filter(app => app.status === 'PENDING').length;
      const approvedApps = appsRes.data.filter(app => app.status === 'APPROVED').length;

      const rccStudents = studentsRes.data.filter(s => isRccStudent(s)).length;
      const generalStudents = studentsRes.data.length - rccStudents;

      setStats({
        applications: appsRes.data.length,
        pendingApplications: pendingApps,
        approvedApplications: approvedApps,
        students: studentsRes.data.filter(s => !s.studentStatus || s.studentStatus === 'Active').length,
        collections: totalCollections,
        rccStudents,
        generalStudents,
      });

      // Prepare data for promotion modal
      setClasses(classesRes.data);
      const years = new Set(studentsRes.data.map(s => s.academicYear).filter(Boolean));
      const sortedYears = Array.from(years).sort().reverse();
      setAcademicYears(sortedYears);
      if (sortedYears.length > 0) {
        setFromYear(sortedYears[0]);
      }
      
      // Default class mapping: Shift each class to the next in the array, last class graduates
      const defaultMapping = {};
      classesRes.data.forEach((c, idx) => {
        if (idx < classesRes.data.length - 1) {
          defaultMapping[c.name] = classesRes.data[idx + 1].name;
        } else {
          defaultMapping[c.name] = 'Graduated';
        }
      });
      setClassMapping(defaultMapping);

    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Try to intelligently guess the next academic year based on 'fromYear'
  useEffect(() => {
    if (fromYear) {
      const parts = fromYear.split('-');
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setToYear(`${parseInt(parts[0]) + 1}-${parseInt(parts[1]) + 1}`);
      }
    }
  }, [fromYear]);

  const handleClassMapChange = (currentClass, nextClass) => {
    setClassMapping(prev => ({
      ...prev,
      [currentClass]: nextClass
    }));
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!fromYear || !toYear) {
      alert("Please specify From and To academic years.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to promote students from ${fromYear} to ${toYear}? This will update their current class and academic year.`)) {
      return;
    }

    setIsPromoting(true);
    try {
      const res = await api.post('/students/promote', {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        classMapping: classMapping
      });
      alert(res.data.message);
      setIsPromoteModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error promoting students", error);
      alert("Failed to promote students. Check console for details.");
    } finally {
      setIsPromoting(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 ">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Welcome to the School Management System</p>
        </div>
        <div>
          <Button 
            onClick={() => setIsPromoteModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
          >
            <ArrowUpCircle className="mr-2 h-5 w-5" /> Bulk Promote Students
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 ">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-orange-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">{stats.applications}</div>
            <div className="flex gap-4 mt-2">
              <p className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pending: {stats.pendingApplications}</p>
              <p className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Approved: {stats.approvedApplications}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 ">Active Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">{stats.students}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 ">Total Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">
              ₹{stats.collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Collected through fees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 ">RCC Students</CardTitle>
            <Users className="h-4 w-4 text-violet-700 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">{stats.rccStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Students marked as RCC</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 ">General Students</CardTitle>
            <Users className="h-4 w-4 text-slate-700 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">{stats.generalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Students marked as General</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Promote Students Modal */}
      <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Bulk Promote Students">
        <form onSubmit={handlePromoteSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <div>
              <Label>From Academic Year</Label>
              {academicYears.length > 0 ? (
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  required
                >
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : (
                <Input 
                  value={fromYear} 
                  onChange={e => setFromYear(e.target.value)} 
                  placeholder="e.g. 2023-2024" 
                  required 
                />
              )}
            </div>
            <div>
              <Label>To Academic Year</Label>
              <Input 
                value={toYear} 
                onChange={e => setToYear(e.target.value)} 
                placeholder="e.g. 2024-2025" 
                required 
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700 border-b flex justify-between">
              <span>Current Class</span>
              <span>Promote To</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {classes.map(c => (
                <div key={c._id} className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <select 
                    className="flex h-9 w-48 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    value={classMapping[c.name] || ''}
                    onChange={(e) => handleClassMapChange(c.name, e.target.value)}
                  >
                    <option value="" disabled>Select next class...</option>
                    {classes.map(targetClass => (
                      <option key={targetClass._id} value={targetClass.name}>{targetClass.name}</option>
                    ))}
                    <option value="Graduated" className="font-bold text-red-600">Graduated (Old Students)</option>
                  </select>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No classes available.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsPromoteModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={isPromoting}>
              {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
