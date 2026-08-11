import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { PageLoader } from './components/ui/Spinner';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Applications = lazy(() => import('./pages/Applications'));
const Admissions = lazy(() => import('./pages/Admissions'));
const Students = lazy(() => import('./pages/Students'));
const FeeCategories = lazy(() => import('./pages/FeeCategories'));
const Payments = lazy(() => import('./pages/Payments'));
const InvoiceGenerated = lazy(() => import('./pages/InvoiceGenerated'));
const Reports = lazy(() => import('./pages/Reports'));
const Admins = lazy(() => import('./pages/Admins'));
const Teachers = lazy(() => import('./pages/Teachers'));
const PrintExport = lazy(() => import('./pages/PrintExport'));
const IncludedCharges = lazy(() => import('./pages/IncludedCharges'));
const Activities = lazy(() => import('./pages/Activities'));
const StudentEdit = lazy(() => import('./pages/StudentEdit'));
const OldStudents = lazy(() => import('./pages/OldStudents'));
const PendingFees = lazy(() => import('./pages/PendingFees'));
const AcademicYearPage = lazy(() => import('./pages/AcademicYear'));
const Concessions = lazy(() => import('./pages/Concessions'));
const IdCards = lazy(() => import('./pages/IdCards'));

const ProtectedRoute = ({ children }) => {

  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Suspense fallback={<PageLoader text="Loading page..." />}>
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
          <Route path="teachers" element={<Teachers />} />
          <Route path="print-export" element={<PrintExport />} />
          <Route path="id-cards" element={<IdCards />} />
          <Route path="concessions" element={<Concessions />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
