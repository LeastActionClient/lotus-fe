import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { AlertCircle, Search, Filter, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const PendingFees = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // Active, Old
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchCategories();
  }, []);

  const getStudentTotalPending = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
  };

  const getStudentTotalPaid = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
  };

  const getStudentTotalFee = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.totalAmount || 0), 0) || 0;
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      // Filter for all students with pending fees > 0
      const pendingStudents = res.data.filter(s => getStudentTotalPending(s) > 0);
      setStudents(pendingStudents);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error("Error fetching classes", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/fees/categories');
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('All');
    setSectionFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  const availableSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const cls = classes.find(c => c.name === classFilter);
    return cls?.sections || [];
  }, [classFilter, classes]);

  const selectedCategoryName = useMemo(() => {
    if (categoryFilter === 'All') return '';
    const cat = categories.find(c => c._id === categoryFilter);
    return cat ? cat.name : '';
  }, [categoryFilter, categories]);

  const filteredStudents = students.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.studentName?.toLowerCase().includes(q) && !s.admissionNumber?.toLowerCase().includes(q)) {
        return false;
      }
    }

    if (classFilter !== 'All' && s.currentClass !== classFilter) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;

    if (statusFilter === 'Active') {
      if (s.studentStatus && s.studentStatus !== 'Active') return false;
    } else if (statusFilter === 'Old') {
      if (!s.studentStatus || s.studentStatus === 'Active') return false;
    }

    if (categoryFilter !== 'All') {
      const hasPendingSelectedCat = s.studentFees?.some(f => 
        (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter && (f.remainingAmount || 0) > 0
      );
      if (!hasPendingSelectedCat) return false;
    }

    return true;
  });

  const totalPendingAmount = useMemo(() => {
    return filteredStudents.reduce((sum, student) => {
      if (categoryFilter === 'All') {
        return sum + getStudentTotalPending(student);
      } else {
        const specificFee = student.studentFees?.find(f => 
          (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter
        );
        return sum + (specificFee ? (specificFee.remainingAmount || 0) : 0);
      }
    }, 0);
  }, [filteredStudents, categoryFilter]);

  const handleExportExcel = () => {
    const excelData = filteredStudents.map(student => {
      const pendingCats = (student.studentFees || [])
        .filter(f => f.remainingAmount > 0 && f.feeCategoryId)
        .map(f => ({
          id: f.feeCategoryId._id || f.feeCategoryId,
          name: f.feeCategoryId.name || 'Unknown',
          pendingAmount: f.remainingAmount
        }));

      const filteredPendingCats = categoryFilter === 'All'
        ? pendingCats
        : pendingCats.filter(c => c.id === categoryFilter);

      const pendingCategoriesStr = filteredPendingCats.map(c => c.name).join(', ');
      const categoryWisePendingAmountsStr = filteredPendingCats.map(c => `₹${c.pendingAmount}`).join(', ');

      const displayPendingAmount = categoryFilter === 'All' 
        ? getStudentTotalPending(student) 
        : ((student.studentFees || []).find(f => (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter)?.remainingAmount || 0);

      const totalPaid = getStudentTotalPaid(student);
      const totalFee = getStudentTotalFee(student);

      return {
        'Admission Number': student.admissionNumber || '',
        'Student Name': student.studentName || '',
        'Student Status': (!student.studentStatus || student.studentStatus === 'Active') ? 'Active' : student.studentStatus,
        'Class': student.currentClass || '',
        'Section': student.section || '',
        'Pending Categories': pendingCategoriesStr || 'None',
        'Category-wise Pending Amounts': categoryWisePendingAmountsStr || '0',
        'Total Fee': `₹${totalFee}`,
        'Paid Amount': `₹${totalPaid}`,
        'Total Pending': `₹${displayPendingAmount}`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Fees');
    XLSX.writeFile(workbook, `Pending_Fees_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <AlertCircle className="mr-3 text-red-600" size={32} />
            Pending Fees
          </h1>
          <p className="text-gray-500 mt-2">All students (Active & Old) with outstanding fee balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Students with Pending Fees</p>
            <p className="text-3xl font-bold text-gray-900">{filteredStudents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <AlertCircle className="h-6 w-6 text-red-600 mb-2" />
            <p className="text-sm text-red-600 font-medium">Total Pending Amount</p>
            <p className="text-3xl font-bold text-red-700">₹{totalPendingAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5 text-gray-500" /> Filters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Search</Label>
                <Input 
                  placeholder="Name or Admin No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Class</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSectionFilter('All');
                  }}
                >
                  <option value="All">All Classes</option>
                  {classes.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Section</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  disabled={classFilter === 'All'}
                >
                  <option value="All">All Sections</option>
                  {availableSections.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Student Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All (Active & Old)</option>
                  <option value="Active">Active Students Only</option>
                  <option value="Old">Old Students Only</option>
                </select>
              </div>

              <div>
                <Label>Category</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                Export Excel
              </Button>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Class & Section</TableHead>
                  <TableHead>Pending Categories</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right font-bold text-red-600">
                    {categoryFilter === 'All' ? 'Total Pending' : `Pending (${selectedCategoryName})`}
                  </TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-32 text-gray-500">
                      No students with pending fees match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map(student => {
                    const totalPending = getStudentTotalPending(student);
                    const totalPaid = getStudentTotalPaid(student);
                    const totalFee = getStudentTotalFee(student);

                    const pendingCats = (student.studentFees || [])
                      .filter(f => f.remainingAmount > 0 && f.feeCategoryId)
                      .map(f => ({
                        id: f.feeCategoryId._id || f.feeCategoryId,
                        name: f.feeCategoryId.name || 'Unknown',
                        pendingAmount: f.remainingAmount
                      }));

                    const filteredPendingCats = categoryFilter === 'All'
                      ? pendingCats
                      : pendingCats.filter(c => c.id === categoryFilter);

                    const displayPendingAmount = categoryFilter === 'All' 
                      ? totalPending 
                      : ((student.studentFees || []).find(f => (f.feeCategoryId?._id || f.feeCategoryId) === categoryFilter)?.remainingAmount || 0);

                    return (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium text-gray-900">{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Link to={`/dashboard/students/edit/${student._id}`} className="text-orange-600 hover:underline">
                            {student.studentName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {(!student.studentStatus || student.studentStatus === 'Active') ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              {student.studentStatus} (Old)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{student.currentClass} {student.section ? `- ${student.section}` : ''}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 my-1">
                            {filteredPendingCats.map(cat => (
                              <span key={cat.id} className="inline-flex items-center justify-between rounded bg-red-50 border border-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 w-fit gap-2">
                                {cat.name} - ₹{cat.pendingAmount.toFixed(2)}
                              </span>
                            ))}
                            {filteredPendingCats.length === 0 && (
                              <span className="text-xs text-gray-400 italic">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{totalFee.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">₹{totalPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ₹{displayPendingAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => navigate('/dashboard/payments')}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Pay Pending Fee
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingFees;
