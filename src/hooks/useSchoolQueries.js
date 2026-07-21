import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const fetchJson = async (url, config = {}) => {
  const response = await api.get(url, config);
  return response.data;
};

export const schoolQueryKeys = {
  dashboardOverview: ['dashboard', 'overview'],
  students: ['students'],
  student: (id) => ['students', id],
  studentHistory: (id) => ['students', id, 'history'],
  studentNetFees: (id) => ['students', id, 'net-fees'],
  payments: ['payments'],
  paymentInvoice: (id) => ['payments', id, 'invoice'],
  applications: ['applications'],
  application: (id) => ['applications', id],
  classes: ['classes'],
  feeCategories: ['fee-categories'],
  academicYears: ['academic-years'],
  activeAcademicYear: ['academic-years', 'active'],
  concessionsHistory: ['concessions', 'history'],
  activities: ['activities'],
  includedCharges: ['included-charges'],
  admins: ['admins'],
  adminLogs: ['admins', 'logs'],
  reports: (timeframe, startDate, endDate) => ['reports', timeframe, startDate || null, endDate || null],
  pendingFees: ['reports', 'pending-fees'],
};

export const useDashboardOverviewQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.dashboardOverview,
    queryFn: () => fetchJson('/reports/overview'),
    placeholderData: (previous) => previous,
  });

export const useStudentsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.students,
    queryFn: () => fetchJson('/students'),
    placeholderData: (previous) => previous,
  });

export const useStudentQuery = (studentId, enabled = true) =>
  useQuery({
    queryKey: schoolQueryKeys.student(studentId),
    queryFn: () => fetchJson(`/students/${studentId}`),
    enabled: Boolean(studentId) && enabled,
    placeholderData: (previous) => previous,
  });

export const useStudentHistoryQuery = (studentId, enabled = true) =>
  useQuery({
    queryKey: schoolQueryKeys.studentHistory(studentId),
    queryFn: () => fetchJson(`/academic-years/students/${studentId}/history`),
    enabled: Boolean(studentId) && enabled,
    placeholderData: (previous) => previous,
  });

export const useStudentNetFeesQuery = (studentId, enabled = true) =>
  useQuery({
    queryKey: schoolQueryKeys.studentNetFees(studentId),
    queryFn: () => fetchJson(`/concessions/net-fee/${studentId}`),
    enabled: Boolean(studentId) && enabled,
    placeholderData: (previous) => previous,
  });

export const usePaymentsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.payments,
    queryFn: () => fetchJson('/payments'),
    placeholderData: (previous) => previous,
  });

export const usePaymentInvoiceDataQuery = (paymentId, enabled = true) =>
  useQuery({
    queryKey: schoolQueryKeys.paymentInvoice(paymentId),
    queryFn: () => fetchJson(`/payments/invoice-data/${paymentId}`),
    enabled: Boolean(paymentId) && enabled,
    placeholderData: (previous) => previous,
  });

export const useApplicationsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.applications,
    queryFn: () => fetchJson('/applications'),
    placeholderData: (previous) => previous,
  });

export const useApplicationQuery = (applicationId, enabled = true) =>
  useQuery({
    queryKey: schoolQueryKeys.application(applicationId),
    queryFn: () => fetchJson(`/applications/${applicationId}`),
    enabled: Boolean(applicationId) && enabled,
    placeholderData: (previous) => previous,
  });

export const useClassesQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.classes,
    queryFn: () => fetchJson('/classes'),
    placeholderData: (previous) => previous,
  });

export const useFeeCategoriesQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.feeCategories,
    queryFn: () => fetchJson('/fees/categories'),
    placeholderData: (previous) => previous,
  });

export const useAcademicYearsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.academicYears,
    queryFn: () => fetchJson('/academic-years'),
    placeholderData: (previous) => previous,
  });

export const useActiveAcademicYearQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.activeAcademicYear,
    queryFn: () => fetchJson('/academic-years/active'),
    placeholderData: (previous) => previous,
  });

export const useConcessionHistoryQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.concessionsHistory,
    queryFn: () => fetchJson('/concessions/student-fees'),
    placeholderData: (previous) => previous,
  });

export const useActivitiesQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.activities,
    queryFn: () => fetchJson('/activities'),
    placeholderData: (previous) => previous,
  });

export const useIncludedChargesQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.includedCharges,
    queryFn: () => fetchJson('/included-charges'),
    placeholderData: (previous) => previous,
  });

export const useAdminsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.admins,
    queryFn: () => fetchJson('/users'),
    placeholderData: (previous) => previous,
  });

export const useAdminLogsQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.adminLogs,
    queryFn: () => fetchJson('/users/logs'),
    placeholderData: (previous) => previous,
  });

export const useReportDataQuery = (timeframe, startDate, endDate) =>
  useQuery({
    queryKey: schoolQueryKeys.reports(timeframe, startDate, endDate),
    queryFn: () => {
      let endpoint = `/reports/${timeframe}-collection`;
      if (timeframe === 'custom') {
        endpoint = `/reports/custom-collection?startDate=${startDate}&endDate=${endDate}`;
      }
      return fetchJson(endpoint);
    },
    placeholderData: (previous) => previous,
  });

export const usePendingFeesQuery = () =>
  useQuery({
    queryKey: schoolQueryKeys.pendingFees,
    queryFn: () => fetchJson('/reports/pending-fees'),
    placeholderData: (previous) => previous,
  });

export const useQueryInvalidator = () => {
  const queryClient = useQueryClient();

  return {
    invalidateStudents: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.students }),
    invalidateStudent: (studentId) => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.student(studentId) }),
    invalidateStudentHistory: (studentId) => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.studentHistory(studentId) }),
    invalidateStudentNetFees: (studentId) => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.studentNetFees(studentId) }),
    invalidatePayments: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.payments }),
    invalidatePaymentInvoice: (paymentId) => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.paymentInvoice(paymentId) }),
    invalidateApplications: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.applications }),
    invalidateApplication: (applicationId) => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.application(applicationId) }),
    invalidateClasses: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.classes }),
    invalidateFeeCategories: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.feeCategories }),
    invalidateAcademicYears: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.academicYears }),
    invalidateActiveAcademicYear: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.activeAcademicYear }),
    invalidateConcessionsHistory: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.concessionsHistory }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.dashboardOverview }),
    invalidateReports: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
    invalidateActivities: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.activities }),
    invalidateIncludedCharges: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.includedCharges }),
    invalidateAdmins: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.admins }),
    invalidateAdminLogs: () => queryClient.invalidateQueries({ queryKey: schoolQueryKeys.adminLogs }),
  };
};

export { keepPreviousData, useMutation, useQuery, useQueryClient };
