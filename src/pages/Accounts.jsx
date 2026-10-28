import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader, Spinner } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useDashboardOverviewQuery } from '../hooks/useSchoolQueries';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Plus,
  Trash2,
  Filter,
  RotateCcw,
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2
  });
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Accounts = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Route safeguard for Super Admin
  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  }, []);

  useEffect(() => {
    if (currentUser.role && currentUser.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser.role, navigate]);

  // Dynamically fetch Total Collections from the exact same source as Reports & Analytics
  const {
    data: overview = {},
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    refetch: refetchOverview
  } = useDashboardOverviewQuery();

  // Financial summary & records from accounts API
  const [apiTotalAmount, setApiTotalAmount] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);

  // Add Expense Modal State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: getTodayDateString(),
    notes: '',
    amount: ''
  });
  const [expenseFormErrors, setExpenseFormErrors] = useState({});

  // Date Filter State
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [filterError, setFilterError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track deleting expense ID
  const [deletingId, setDeletingId] = useState(null);

  // Fetch accounts data from backend
  const fetchAccountsData = useCallback(async (filters = activeFilters) => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/accounts', { params });
      const data = res.data;

      setApiTotalAmount(typeof data.totalAmount === 'number' ? data.totalAmount : 0);
      setTotalExpenses(typeof data.totalExpenses === 'number' ? data.totalExpenses : 0);
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setFilteredTotal(typeof data.filteredTotal === 'number' ? data.filteredTotal : 0);
    } catch (err) {
      console.error('Error fetching accounts data:', err);
    } finally {
      setIsAccountsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchAccountsData();
  }, [fetchAccountsData]);

  // Total Collections value: exactly matching Reports & Analytics page
  const totalCollections = useMemo(() => {
    if (typeof overview?.stats?.collections === 'number') {
      return overview.stats.collections;
    }
    if (typeof apiTotalAmount === 'number') {
      return apiTotalAmount;
    }
    return null;
  }, [overview, apiTotalAmount]);

  // Balance Amount = Total Collections − Total Expenses
  const balance = useMemo(() => {
    if (totalCollections === null) return null;
    return Math.round((totalCollections - totalExpenses) * 100) / 100;
  }, [totalCollections, totalExpenses]);

  // Handle Add Expense
  const handleOpenAddExpense = () => {
    setExpenseForm({
      date: getTodayDateString(),
      notes: '',
      amount: ''
    });
    setExpenseFormErrors({});
    setIsAddExpenseModalOpen(true);
  };

  const handleCloseAddExpense = () => {
    if (isSavingExpense) return;
    setIsAddExpenseModalOpen(false);
    setExpenseFormErrors({});
  };

  const validateExpenseForm = () => {
    const errors = {};
    if (!expenseForm.date) {
      errors.date = 'Date is required.';
    } else {
      const d = new Date(expenseForm.date);
      if (isNaN(d.getTime())) {
        errors.date = 'Please enter a valid date.';
      }
    }

    if (!expenseForm.notes || !expenseForm.notes.trim()) {
      errors.notes = 'Notes or description is required.';
    }

    if (expenseForm.amount === '' || expenseForm.amount === null || expenseForm.amount === undefined) {
      errors.amount = 'Amount is required.';
    } else {
      const amt = Number(expenseForm.amount);
      if (isNaN(amt) || !Number.isFinite(amt)) {
        errors.amount = 'Amount must be a valid number.';
      } else if (amt <= 0) {
        errors.amount = 'Amount must be greater than zero.';
      }
    }

    setExpenseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveExpense = async (e) => {
    if (e) e.preventDefault();
    if (!validateExpenseForm()) return;

    setIsSavingExpense(true);
    try {
      const res = await api.post('/accounts/expenses', {
        date: expenseForm.date,
        notes: expenseForm.notes.trim(),
        amount: Number(expenseForm.amount)
      });
      toastSuccess(res.data.message || 'Expense added successfully');
      setIsAddExpenseModalOpen(false);
      setCurrentPage(1);
      // Re-fetch data to update list and balances
      await Promise.all([fetchAccountsData(), refetchOverview()]);
    } catch (err) {
      console.error('Failed to add expense:', err);
      const errMsg = err.response?.data?.error || 'Failed to add expense';
      setExpenseFormErrors((prev) => ({ ...prev, general: errMsg }));
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expense) => {
    const formattedAmt = formatCurrency(expense.amount);
    const dateFormatted = formatDate(expense.date);

    const isConfirmed = await confirm({
      title: 'Delete Expense',
      description: `Are you sure you want to permanently delete the expense of ${formattedAmt} (${expense.notes}) recorded on ${dateFormatted}? This action cannot be undone.`,
      confirmText: 'Delete Expense',
      cancelText: 'Cancel',
      tone: 'danger'
    });

    if (!isConfirmed) return;

    setDeletingId(expense._id);
    try {
      const res = await api.delete(`/accounts/expenses/${expense._id}`);
      toastSuccess(res.data.message || 'Expense deleted successfully');
      await Promise.all([fetchAccountsData(), refetchOverview()]);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter Handlers
  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    setFilterError('');

    const { startDate, endDate } = filterInputs;

    if (!startDate && !endDate) {
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setFilterError('Start date cannot be after end date.');
        toastWarning('Start date cannot be after end date.');
        return;
      }
    }

    const newActiveFilters = {
      startDate: startDate || '',
      endDate: endDate || ''
    };

    setActiveFilters(newActiveFilters);
    setCurrentPage(1);
    await fetchAccountsData(newActiveFilters);
  };

  const handleClearFilters = async () => {
    const cleared = {
      startDate: '',
      endDate: ''
    };
    setFilterInputs(cleared);
    setActiveFilters(cleared);
    setFilterError('');
    setCurrentPage(1);
    await fetchAccountsData(cleared);
  };

  const isFilterActive = Boolean(activeFilters.startDate || activeFilters.endDate);

  // Pagination Slicing
  const paginatedExpenses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return expenses.slice(startIdx, startIdx + itemsPerPage);
  }, [expenses, currentPage, itemsPerPage]);

  const isInitialLoading = isAccountsLoading && isOverviewLoading;

  if (isInitialLoading) {
    return <PageLoader text="Loading accounts management..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accounts Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor institutional accounts, record expenses, and maintain real-time financial balances.
          </p>
        </div>
        <div>
          <Button
            onClick={handleOpenAddExpense}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Card 1: Total Amount (Dynamically fetched from Total Collections) */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
              <span>Total Amount</span>
            </CardTitle>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isOverviewLoading && totalCollections === null ? (
              <div className="flex items-center gap-2 py-2 text-gray-500 text-sm">
                <Spinner size={16} />
                <span>Loading collections...</span>
              </div>
            ) : isOverviewError && totalCollections === null ? (
              <div className="py-1">
                <p className="text-sm text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>Collections unavailable</span>
                </p>
                <button
                  onClick={() => refetchOverview()}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-words">
                  {formatCurrency(totalCollections)}
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500 font-medium">
                  <TrendingUp className="mr-1 h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Total Collections (from Reports & Analytics)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Total Expenses */}
        <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
            <CardTitle className="text-sm font-medium text-rose-600">Total Expenses</CardTitle>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-words">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Sum of all saved expense amounts
              </p>
              {isFilterActive && (
                <span className="text-xs font-medium text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                  Filtered: {formatCurrency(filteredTotal)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Balance Amount */}
        <Card
          className={`bg-gradient-to-br shadow-sm flex flex-col justify-between ${
            balance === null
              ? 'from-gray-50 to-white border-gray-200'
              : balance < 0
              ? 'from-red-50 to-white border-red-200'
              : 'from-emerald-50 to-white border-emerald-100'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
            <CardTitle
              className={`text-sm font-medium ${
                balance === null
                  ? 'text-gray-600'
                  : balance < 0
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}
            >
              Balance Amount
            </CardTitle>
            <div
              className={`p-2 rounded-lg ${
                balance === null
                  ? 'bg-gray-100 text-gray-600'
                  : balance < 0
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {balance !== null && balance < 0 ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <IndianRupee className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {balance === null ? (
              <div>
                <div className="text-2xl font-bold text-gray-400">—</div>
                <p className="mt-3 text-xs text-gray-500">Awaiting collections data</p>
              </div>
            ) : (
              <div>
                <div
                  className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${
                    balance < 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(balance)}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {balance < 0
                    ? 'Expenses exceed total collections'
                    : 'Total Collections − Total Expenses'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Date Filters Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              <span>Date Filters</span>
              {isFilterActive && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </CardTitle>
            {isFilterActive && (
              <span className="text-xs text-gray-500 font-medium">
                Showing {expenses.length} matching expense{expenses.length === 1 ? '' : 's'} (Filtered Total: {formatCurrency(filteredTotal)})
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <Label htmlFor="filter-start-date" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Start Date
                </Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filterInputs.startDate}
                  onChange={(e) => {
                    setFilterInputs((prev) => ({ ...prev, startDate: e.target.value }));
                    setFilterError('');
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* End Date */}
              <div>
                <Label htmlFor="filter-end-date" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  End Date
                </Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filterInputs.endDate}
                  onChange={(e) => {
                    setFilterInputs((prev) => ({ ...prev, endDate: e.target.value }));
                    setFilterError('');
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {filterError && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                <span>{filterError}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs h-9 px-3"
              >
                <RotateCcw size={14} />
                <span>Clear Filters</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex items-center gap-1.5 text-xs h-9 px-4"
              >
                <Filter size={14} />
                <span>Apply Filters</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Expenses Management Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-gray-200 bg-white flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Expenses List</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {expenses.length} record{expenses.length === 1 ? '' : 's'} (newest first)
            </p>
          </div>
          {isFilterActive && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                Filtered Total: {formatCurrency(filteredTotal)}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <FileSpreadsheet size={28} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {isFilterActive ? 'No matching expenses found' : 'No expenses recorded yet'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                {isFilterActive
                  ? 'No expense records matched the selected date filter. Try selecting a different date range or clearing the filters.'
                  : 'Start tracking school expenses by clicking the "Add Expense" button above.'}
              </p>
              {isFilterActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  <span>Clear Filters</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleOpenAddExpense}
                  className="text-xs"
                >
                  <Plus size={14} className="mr-1.5" />
                  <span>Add Expense</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-[160px] font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Notes / Description</TableHead>
                    <TableHead className="text-right w-[180px] font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="text-center w-[120px] font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense) => (
                    <TableRow key={expense._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(expense.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 max-w-md">
                        <span className="line-clamp-2" title={expense.notes}>
                          {expense.notes}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === expense._id}
                          loading={deletingId === expense._id}
                          onClick={() => handleDeleteExpense(expense)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Expense"
                          aria-label={`Delete expense of ${formatCurrency(expense.amount)}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {expenses.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <Pagination
                currentPage={currentPage}
                totalItems={expenses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={handleCloseAddExpense}
        title="Add Expense"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {expenseFormErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{expenseFormErrors.general}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="expense-date" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Expense Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseForm.date}
              onChange={(e) => {
                setExpenseForm((prev) => ({ ...prev, date: e.target.value }));
                setExpenseFormErrors((prev) => ({ ...prev, date: '' }));
              }}
              className="text-sm"
              required
            />
            {expenseFormErrors.date && (
              <p className="mt-1 text-xs text-red-600 font-medium">{expenseFormErrors.date}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="expense-notes" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Notes / Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expense-notes"
              type="text"
              placeholder="e.g. Science lab equipment, Sports materials..."
              value={expenseForm.notes}
              onChange={(e) => {
                setExpenseForm((prev) => ({ ...prev, notes: e.target.value }));
                setExpenseFormErrors((prev) => ({ ...prev, notes: '' }));
              }}
              className="text-sm"
              maxLength={250}
              required
            />
            {expenseFormErrors.notes && (
              <p className="mt-1 text-xs text-red-600 font-medium">{expenseFormErrors.notes}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="expense-amount" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative rounded-md shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-sm">
                ₹
              </span>
              <Input
                id="expense-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 3500"
                value={expenseForm.amount}
                onChange={(e) => {
                  setExpenseForm((prev) => ({ ...prev, amount: e.target.value }));
                  setExpenseFormErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className="pl-7 pr-3 text-sm"
                required
              />
            </div>
            {expenseFormErrors.amount && (
              <p className="mt-1 text-xs text-red-600 font-medium">{expenseFormErrors.amount}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingExpense}
              onClick={handleCloseAddExpense}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSavingExpense}
              loadingText="Saving..."
              className="text-xs"
            >
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Accounts;
