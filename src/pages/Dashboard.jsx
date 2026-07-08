import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    applications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    students: 0,
    collections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appsRes, studentsRes, paymentsRes] = await Promise.all([
          api.get('/applications'),
          api.get('/students'),
          api.get('/payments'),
        ]);

        const totalCollections = paymentsRes.data.reduce((sum, payment) => sum + payment.amount, 0);

        const pendingApps = appsRes.data.filter(app => app.status === 'PENDING').length;
        const approvedApps = appsRes.data.filter(app => app.status === 'APPROVED').length;

        setStats({
          applications: appsRes.data.length,
          pendingApplications: pendingApps,
          approvedApplications: approvedApps,
          students: studentsRes.data.length,
          collections: totalCollections,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 ">Dashboard Overview</h1>
        <p className="text-gray-500  mt-2">Welcome to the School Management System</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white  ">
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

        <Card className="bg-gradient-to-br from-emerald-50 to-white  ">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 ">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">{stats.students}</div>
            <p className="text-xs text-gray-500  mt-1">Enrolled for this academic year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white  ">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 ">Total Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600 " />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 ">
              ₹{stats.collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500  mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Collected through fees
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
