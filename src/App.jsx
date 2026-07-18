import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Admissions from './pages/Admissions';
import Students from './pages/Students';
import FeeCategories from './pages/FeeCategories';
import Payments from './pages/Payments';
import InvoiceGenerated from './pages/InvoiceGenerated';
import Reports from './pages/Reports';
import Admins from './pages/Admins';
import PrintExport from './pages/PrintExport';
import IncludedCharges from './pages/IncludedCharges';
import Activities from './pages/Activities';
import StudentEdit from './pages/StudentEdit';
import OldStudents from './pages/OldStudents';
import PendingFees from './pages/PendingFees';
import AcademicYearPage from './pages/AcademicYear';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="students" element={<Students />} />
        <Route path="academic-year" element={<AcademicYearPage />} />
        <Route path="old-students" element={<OldStudents />} />
        <Route path="pending-fees" element={<PendingFees />} />
        <Route path="students/edit/:id" element={<StudentEdit />} />
        <Route path="fee-categories" element={<FeeCategories />} />
        <Route path="fee-categories/included-charges" element={<IncludedCharges />} />
        <Route path="fee-categories/activities" element={<Activities />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/invoice/:id" element={<InvoiceGenerated />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admins" element={<Admins />} />
        <Route path="print-export" element={<PrintExport />} />
      </Route>
    </Routes>
  );
};

export default App;
