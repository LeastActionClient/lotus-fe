import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, UserPlus, DollarSign, FileCheck, PieChart, LogOut, Printer, Menu, X } from 'lucide-react';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const timeoutRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // 5 minutes = 300,000 ms
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, 300000);
  };

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') return;

    // Setup initial timer
    resetTimer();

    // Listeners for user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user.role]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Applications', path: '/dashboard/applications', icon: <FileText size={20} /> },
    { name: 'Admissions', path: '/dashboard/admissions', icon: <UserPlus size={20} /> },
    { name: 'Students', path: '/dashboard/students', icon: <Users size={20} /> },
    { name: 'Old Students', path: '/dashboard/old-students', icon: <Users size={20} /> },
    { name: 'Pending Fees', path: '/dashboard/pending-fees', icon: <DollarSign size={20} /> },
    { name: 'Fee Categories', path: '/dashboard/fee-categories', icon: <FileCheck size={20} /> },
    { name: 'Payments', path: '/dashboard/payments', icon: <DollarSign size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <PieChart size={20} /> },
    { name: 'Print & Export', path: '/dashboard/print-export', icon: <Printer size={20} /> },
  ];

  if (user.role === 'SUPER_ADMIN') {
    navItems.push({ name: 'Manage Admins', path: '/dashboard/admins', icon: <Users size={20} /> });
  }

  return (
    <div className="dashboard-shell flex h-auto bg-gray-100 ">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 relative">
          <button 
            className="absolute top-4 right-4 md:hidden text-gray-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="Logo" className="w-24 h-24" />
          </div>
          <p className="text-sm text-gray-500 mt-1 text-center">Logged in as {user.username}</p>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => {
            const isActive = item.path === '/dashboard'
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

            return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                isActive ? 'bg-orange-50 border-r-4 border-orange-600 text-orange-600 font-medium' : ''
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="dashboard-mobile-header md:hidden bg-white shadow-sm flex items-center p-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 p-2 rounded-md"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-900">Kasthuri School</h1>
        </header>

        {/* Main Content */}
        <main className="dashboard-main flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="dashboard-content-inner p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
