import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Users, Search, Filter, IndianRupee, GraduationCap, XCircle, UserMinus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Link, useNavigate } from 'react-router-dom';

const OldStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  // Filters
  const [quickFeeFilter, setQuickFeeFilter] = useState('ALL'); // 'ALL', 'PENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const [exitTypeFilter, setExitTypeFilter] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All'); // 'All', 'Pending', 'Paid'
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      // Filter for old students only
      const oldStudents = res.data.filter(s => s.studentStatus && s.studentStatus !== 'Active');
      setStudents(oldStudents);
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

  const clearFilters = () => {
    setSearchQuery('');
    setExitTypeFilter('All');
    setFeeStatusFilter('All');
    setClassFilter('All');
    setSectionFilter('All');
    setAcademicYearFilter('All');
    setQuickFeeFilter('ALL');
  };

  const getStudentTotalPending = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
  };

  const getStudentTotalPaid = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
  };

  const getStudentTotalFee = (s) => {
    return s.studentFees?.reduce((sum, f) => sum + (f.totalAmount || 0), 0) || 0;
  };

  // Derived arrays
  const uniqueAcademicYears = useMemo(() => {
    const years = new Set(students.map(s => s.academicYear).filter(Boolean));
    return Array.from(years).sort();
  }, [students]);

  const availableSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const cls = classes.find(c => c.name === classFilter);
    return cls?.sections || [];
  }, [classFilter, classes]);

  const filteredStudents = students.filter(s => {
    const totalPending = getStudentTotalPending(s);

    // Quick filter
    if (quickFeeFilter === 'PENDING' && totalPending <= 0) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.studentName?.toLowerCase().includes(q) && !s.admissionNumber?.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Advanced filters
    if (exitTypeFilter !== 'All' && s.studentStatus !== exitTypeFilter) return false;
    
    if (feeStatusFilter === 'Pending' && totalPending <= 0) return false;
    if (feeStatusFilter === 'Paid' && totalPending > 0) return false;

    if (classFilter !== 'All' && s.currentClass !== classFilter) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
    if (academicYearFilter !== 'All' && s.academicYear !== academicYearFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: students.length,
    graduated: students.filter(s => s.studentStatus === 'Graduated').length,
    transferred: students.filter(s => s.studentStatus === 'Transferred').length,
    discontinued: students.filter(s => s.studentStatus === 'Discontinued').length,
    leftSchool: students.filter(s => s.studentStatus === 'Left School').length,
    pendingFees: students.filter(s => getStudentTotalPending(s) > 0).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <Users className="mr-3 text-orange-600" size={32} />
            Old Students Archive
          </h1>
          <p className="text-gray-500 mt-2">Permanent archive of students who are no longer active in the school.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Total Old Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <GraduationCap className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Graduated</p>
            <p className="text-2xl font-bold text-gray-900">{stats.graduated}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Transferred</p>
            <p className="text-2xl font-bold text-gray-900">{stats.transferred}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <XCircle className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Discontinued</p>
            <p className="text-2xl font-bold text-gray-900">{stats.discontinued}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <UserMinus className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-xs text-gray-500 font-medium">Left School</p>
            <p className="text-2xl font-bold text-gray-900">{stats.leftSchool}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <IndianRupee className="h-6 w-6 text-orange-600 mb-2" />
            <p className="text-xs text-gray-500 font-medium">With Pending Fees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingFees}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Filter Bar */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5 text-gray-500" /> Filters
              </h2>
              <div className="flex gap-2">
                <Button 
                  variant={quickFeeFilter === 'ALL' ? 'default' : 'outline'} 
                  onClick={() => setQuickFeeFilter('ALL')}
                  className={quickFeeFilter === 'ALL' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                >
                  All Old Students
                </Button>
                <Button 
                  variant={quickFeeFilter === 'PENDING' ? 'default' : 'outline'} 
                  onClick={() => setQuickFeeFilter('PENDING')}
                  className={quickFeeFilter === 'PENDING' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                >
                  Pending Fees
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Search</Label>
                <Input 
                  placeholder="Name or Admin No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Exit Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={exitTypeFilter}
                  onChange={(e) => setExitTypeFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Completed">Completed</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Left School">Left School</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label>Fee Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={feeStatusFilter}
                  onChange={(e) => setFeeStatusFilter(e.target.value)}
                >
                  <option value="All">All Students</option>
                  <option value="Pending">Pending Fees</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>

              <div>
                <Label>Last Class</Label>
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
                <Label>Last Section</Label>
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
                <Label>Last Academic Year</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                >
                  <option value="All">All Academic Years</option>
                  {uniqueAcademicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Exit Type</TableHead>
                  <TableHead>Class & Section</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Exit Date</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Pending Fee</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-32 text-gray-500">
                      No old students match the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map(student => {
                    const totalPending = getStudentTotalPending(student);
                    const totalPaid = getStudentTotalPaid(student);
                    const totalFee = getStudentTotalFee(student);
                    
                    return (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium text-gray-900">{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Link to={`/dashboard/students/edit/${student._id}`} className="text-orange-600 hover:underline">
                            {student.studentName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {student.studentStatus}
                          </span>
                        </TableCell>
                        <TableCell>{student.currentClass} {student.section ? `- ${student.section}` : ''}</TableCell>
                        <TableCell>{student.academicYear || 'N/A'}</TableCell>
                        <TableCell>{new Date(student.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{totalFee.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">₹{totalPaid.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-bold ${totalPending > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          ₹{totalPending.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {totalPending > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              PENDING
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              PAID
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {totalPending > 0 ? (
                            <Button 
                              size="sm" 
                              onClick={() => navigate('/dashboard/payments')}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Pay Pending Fee
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Fully Paid</span>
                          )}
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

export default OldStudents;
