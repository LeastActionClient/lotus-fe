import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { FileCheck, Plus, Users, User, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import Select from 'react-select';
import { Link, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/ui/Spinner';

const FeeCategories = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  
  const [catName, setCatName] = useState('');
  const [catMandatory, setCatMandatory] = useState(false);
  
  // For Assign to Student (Special Fee)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [specialFees, setSpecialFees] = useState({});
  const [selectedClassForStudent, setSelectedClassForStudent] = useState('');
  const [selectedSectionForStudent, setSelectedSectionForStudent] = useState('');

  // For Assign to Class (Bulk)
  const [bulkAssignData, setBulkAssignData] = useState({
    className: '',
    sectionName: ''
  });
  const [bulkFees, setBulkFees] = useState({});
  const [selectedBulkCats, setSelectedBulkCats] = useState({});
  const [isEditingBulkFees, setIsEditingBulkFees] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [catRes, stuRes, classRes] = await Promise.all([
        api.get('/fees/categories'),
        api.get('/students'),
        api.get('/classes')
      ]);
      setCategories(catRes.data);
      setStudents(stuRes.data);
      setClasses(classRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initializeBulkAssign = (clsName, secName) => {
    let defaultFees = {};
    const clsObj = classes.find(c => c.name === clsName);
    if (clsObj) {
      if (secName) {
        const secObj = clsObj.sections?.find(s => s.name === secName);
        if (secObj && secObj.defaultFees && Object.keys(secObj.defaultFees).length > 0) {
          defaultFees = secObj.defaultFees;
        } else if (clsObj.defaultFees) {
          defaultFees = clsObj.defaultFees;
        }
      } else if (clsObj.defaultFees) {
        defaultFees = clsObj.defaultFees;
      }
    }

    const initialFees = {};
    const initialSelected = {};

    categories.forEach(cat => {
      if (!cat.isEnabled || ['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(cat.name)) {
        return;
      }
      
      const savedFeeConfig = defaultFees[cat._id];
      if (savedFeeConfig !== undefined && savedFeeConfig !== null) {
        initialSelected[cat._id] = true;
        if (cat.name.toLowerCase() === 'uniform') {
          initialFees[`${cat._id}_top`] = savedFeeConfig?.pricing?.topPerMetre || '';
          initialFees[`${cat._id}_bottom`] = savedFeeConfig?.pricing?.bottomPerMetre || '';
        } else {
          initialFees[cat._id] = typeof savedFeeConfig === 'number' ? savedFeeConfig : (savedFeeConfig?.amount || '');
        }
      } else {
        initialSelected[cat._id] = cat.mandatory ? true : false;
        if (cat.name.toLowerCase() === 'uniform') {
          initialFees[`${cat._id}_top`] = '';
          initialFees[`${cat._id}_bottom`] = '';
        } else {
          initialFees[cat._id] = '';
        }
      }
    });

    setBulkFees(initialFees);
    setSelectedBulkCats(initialSelected);
    setIsEditingBulkFees(Object.keys(defaultFees).length === 0);
  };

  useEffect(() => {
    if (isBulkAssignModalOpen) {
      setBulkAssignData({ className: '', sectionName: '' });
      setBulkFees({});
      setSelectedBulkCats({});
      setIsEditingBulkFees(true);
    }
  }, [isBulkAssignModalOpen]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/categories', { name: catName, mandatory: catMandatory });
      setIsNewCatModalOpen(false);
      setCatName('');
      setCatMandatory(false);
      fetchData();
    } catch (error) {
      console.error("Error creating category", error);
    }
  };

  const handleToggleCategory = async (category) => {
    try {
      await api.put(`/fees/categories/${category._id}`, { 
        name: category.name, 
        mandatory: category.mandatory, 
        isEnabled: !category.isEnabled 
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling category", error);
      alert(error.response?.data?.error || 'Error updating category');
    }
  };

  const handleAssignFee = async (e) => {
    e.preventDefault();
    try {
      if (!selectedStudentId) {
        alert("Please select a student.");
        return;
      }

      const activeCats = categories.filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name));
      
      const promises = activeCats.map(cat => {
        let amount = specialFees[cat._id];
        let totalAmountToSend = 0;
        
        if (amount !== undefined && amount !== '') {
          totalAmountToSend = Number(amount);
        }

        return api.post(`/fees/assign/${selectedStudentId}`, {
          feeCategoryId: cat._id,
          totalAmount: totalAmountToSend
        });
      });

      if (promises.length === 0) {
        alert("No fee categories available to assign.");
        return;
      }

      await Promise.all(promises);

      setIsAssignModalOpen(false);
      setSelectedStudentId('');
      setSpecialFees({});
      setSelectedClassForStudent('');
      setSelectedSectionForStudent('');
      fetchData();
      alert("Special fees assigned successfully!");
    } catch (error) {
      console.error("Error assigning fee", error);
      alert("Error assigning fee. Please check details.");
    }
  };

  const handleBulkAssignFee = async (e) => {
    e.preventDefault();
    try {
      const feesPayload = Object.entries(selectedBulkCats)
        .filter(([_, isChecked]) => isChecked)
        .map(([feeCategoryId]) => {
          const cat = categories.find(c => c._id === feeCategoryId);
          if (cat && cat.name.toLowerCase() === 'uniform') {
            return {
              feeCategoryId,
              topPerMetre: bulkFees[`${feeCategoryId}_top`] !== '' ? Number(bulkFees[`${feeCategoryId}_top`]) : 0,
              bottomPerMetre: bulkFees[`${feeCategoryId}_bottom`] !== '' ? Number(bulkFees[`${feeCategoryId}_bottom`]) : 0
            };
          } else {
            return {
              feeCategoryId,
              amount: bulkFees[feeCategoryId] !== '' ? Number(bulkFees[feeCategoryId]) : 0
            };
          }
        });

      const hasInvalidAmount = feesPayload.some(f => {
        if (f.topPerMetre !== undefined) {
          return f.topPerMetre <= 0 || f.bottomPerMetre <= 0;
        }
        return f.amount <= 0;
      });

      if (hasInvalidAmount) {
        alert("Please enter a valid rate/amount greater than 0 for all checked categories.");
        return;
      }

      const res = await api.post('/fees/assign-bulk', {
        className: bulkAssignData.className,
        sectionName: bulkAssignData.sectionName || undefined,
        fees: feesPayload
      });
      setIsBulkAssignModalOpen(false);
      setBulkAssignData({ className: '', sectionName: '' });
      setBulkFees({});
      setSelectedBulkCats({});
      setIsEditingBulkFees(true);
      fetchData();
      alert(res.data.message);
    } catch (error) {
      console.error("Error bulk assigning fee", error);
      alert(error.response?.data?.error || "Error assigning fees. Please check details.");
    }
  };

  const selectedClassObjBulk = classes.find(c => c.name === bulkAssignData.className);

  const uniqueClassesStudent = [...new Set(students.map(s => s.currentClass).filter(Boolean))].sort();
  const uniqueSectionsStudent = [...new Set(students.filter(s => !selectedClassForStudent || s.currentClass === selectedClassForStudent).map(s => s.section).filter(Boolean))].sort();

  const studentOptions = students
    .filter(s => !selectedClassForStudent || s.currentClass === selectedClassForStudent)
    .filter(s => !selectedSectionForStudent || s.section === selectedSectionForStudent)
    .map(s => ({
      value: s._id,
      label: `${s.admissionNumber} - ${s.studentName} (Class: ${s.currentClass}, Sec: ${s.section || 'N/A'})`
    }));

  const selectedStudent = students.find(s => s._id === selectedStudentId);
  const visibleCategories = categories.filter(c => !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name));
  const totalPages = Math.max(1, Math.ceil(visibleCategories.length / itemsPerPage));
  const paginatedCategories = visibleCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <FileCheck className="mr-3 text-orange-600" size={32} />
            Fee Categories
          </h1>
          <p className="text-gray-500  mt-2">Manage fee types and assignments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setIsBulkAssignModalOpen(true)}>
            <Users className="mr-2 h-4 w-4" /> Assign Fee to Class
          </Button>
          <Button variant="outline" onClick={() => setIsAssignModalOpen(true)}>
            <User className="mr-2 h-4 w-4" /> Assign Special Fee
          </Button>
          <Button onClick={() => setIsNewCatModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-gray-500">
                    No fee categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell className="font-medium text-gray-900 ">{cat.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat.mandatory ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cat.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleToggleCategory(cat)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                        cat.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cat.isEnabled ? 'Active' : 'Disabled'}
                      </button>
                    </TableCell>
                    <TableCell>{new Date(cat.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {currentUser.role === 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                          if(window.confirm('Are you sure you want to delete this category?')) {
                            try {
                              await api.delete(`/fees/categories/${cat._id}`);
                              fetchData();
                            } catch(e) { 
                              alert(e.response?.data?.error || 'Error deleting category'); 
                            }
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isNewCatModalOpen} onClose={() => { setIsNewCatModalOpen(false); setCatName(''); setCatMandatory(false); }} title="Create Fee Category">
        <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="catName">Category Name</Label>
            <Input 
              id="catName" 
              value={catName} 
              onChange={(e) => setCatName(e.target.value)} 
              placeholder="e.g., Tuition Fee, Transport Fee"
              required 
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox"
              id="catMandatory" 
              checked={catMandatory} 
              onChange={(e) => setCatMandatory(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <Label htmlFor="catMandatory" className="cursor-pointer font-medium text-gray-700">Mandatory</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200  mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsNewCatModalOpen(false); setCatName(''); setCatMandatory(false); }}>Cancel</Button>
            <Button type="submit">Create Category</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)} title="Assign Fee to Class">
        <form onSubmit={handleBulkAssignFee} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50   "
                value={bulkAssignData.className}
                onChange={(e) => {
                  const clsName = e.target.value;
                  setBulkAssignData({...bulkAssignData, className: clsName, sectionName: ''});
                  initializeBulkAssign(clsName, '');
                }}
                required
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Select Section (Optional)</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50   "
                value={bulkAssignData.sectionName}
                onChange={(e) => {
                  const secName = e.target.value;
                  setBulkAssignData({...bulkAssignData, sectionName: secName});
                  initializeBulkAssign(bulkAssignData.className, secName);
                }}
                disabled={!bulkAssignData.className}
              >
                <option value="">-- All Sections --</option>
                {selectedClassObjBulk?.sections?.map((s) => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Enter Fee Amounts</Label>
            <div className="border border-gray-200  rounded-md overflow-hidden max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-1/2">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">No active fee categories available.</TableCell>
                    </TableRow>
                  ) : (
                    categories.filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).map(cat => {
                      const isUniform = cat.name.toLowerCase() === 'uniform';
                      return (
                        <React.Fragment key={cat._id}>
                          <TableRow>
                            <TableCell className="w-10">
                              <input 
                                type="checkbox"
                                checked={!!selectedBulkCats[cat._id]}
                                onChange={(e) => {
                                  if (!isEditingBulkFees) return;
                                  setSelectedBulkCats({
                                    ...selectedBulkCats,
                                    [cat._id]: e.target.checked
                                  });
                                }}
                                disabled={!isEditingBulkFees}
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {cat.name} {cat.mandatory && <span className="text-xs text-orange-600 font-normal">(Mandatory)</span>}
                            </TableCell>
                            <TableCell>
                              {!isUniform ? (
                                <Input 
                                  type="number" 
                                  min="0" step="0.01"
                                  placeholder="e.g., 5000"
                                  value={bulkFees[cat._id] || ''}
                                  onChange={(e) => setBulkFees({...bulkFees, [cat._id]: e.target.value})}
                                  readOnly={!isEditingBulkFees || !selectedBulkCats[cat._id]}
                                  className={(!isEditingBulkFees || !selectedBulkCats[cat._id]) ? "bg-gray-100" : ""}
                                  required={selectedBulkCats[cat._id]}
                                />
                              ) : (
                                <span className="text-xs text-gray-500 font-semibold">Configure per metre rates below</span>
                              )}
                            </TableCell>
                          </TableRow>
                          
                          {isUniform && selectedBulkCats[cat._id] && (
                            <TableRow className="bg-orange-50/30">
                              <TableCell></TableCell>
                              <TableCell colSpan={2} className="py-3 px-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Top Price / Metre (₹)</Label>
                                    <Input 
                                      type="number"
                                      min="0" step="0.01"
                                      placeholder="e.g., 450"
                                      value={bulkFees[`${cat._id}_top`] || ''}
                                      onChange={(e) => setBulkFees({...bulkFees, [`${cat._id}_top`]: e.target.value})}
                                      readOnly={!isEditingBulkFees}
                                      className={!isEditingBulkFees ? "bg-gray-100 h-8 text-xs" : "h-8 text-xs"}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Bottom Price / Metre (₹)</Label>
                                    <Input 
                                      type="number"
                                      min="0" step="0.01"
                                      placeholder="e.g., 350"
                                      value={bulkFees[`${cat._id}_bottom`] || ''}
                                      onChange={(e) => setBulkFees({...bulkFees, [`${cat._id}_bottom`]: e.target.value})}
                                      readOnly={!isEditingBulkFees}
                                      className={!isEditingBulkFees ? "bg-gray-100 h-8 text-xs" : "h-8 text-xs"}
                                      required
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
            {!isEditingBulkFees ? (
              <Button type="button" variant="outline" onClick={() => setIsEditingBulkFees(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Amounts
              </Button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsBulkAssignModalOpen(false)}>Cancel</Button>
              {isEditingBulkFees && <Button type="submit">Assign to Class</Button>}
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => { setIsAssignModalOpen(false); setSelectedStudentId(''); setSpecialFees({}); setSelectedClassForStudent(''); setSelectedSectionForStudent(''); }} title="Assign Special Fee (Discount) to Student" size="lg">
        <form onSubmit={handleAssignFee} className="space-y-4 pt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialClassFilter">Filter by Class (Optional)</Label>
              <select 
                id="specialClassFilter" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                value={selectedClassForStudent}
                onChange={(e) => {
                  setSelectedClassForStudent(e.target.value);
                  setSelectedSectionForStudent('');
                  setSelectedStudentId('');
                  setSpecialFees({});
                }}
              >
                <option value="">-- All Classes --</option>
                {uniqueClassesStudent.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialSectionFilter">Filter by Section (Optional)</Label>
              <select 
                id="specialSectionFilter" 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                value={selectedSectionForStudent}
                onChange={(e) => {
                  setSelectedSectionForStudent(e.target.value);
                  setSelectedStudentId('');
                  setSpecialFees({});
                }}
              >
                <option value="">-- All Sections --</option>
                {uniqueSectionsStudent.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialStudentSelect">Search & Select Student</Label>
            <Select
              id="specialStudentSelect"
              options={studentOptions}
              value={studentOptions.find(o => o.value === selectedStudentId) || null}
              onChange={(option) => {
                const studentId = option ? option.value : '';
                setSelectedStudentId(studentId);
                
                if (studentId) {
                  const student = students.find(s => s._id === studentId);
                  if (student && student.studentFees) {
                    const initialFees = {};
                    student.studentFees.forEach(f => {
                      const catId = f.feeCategory?._id || f.feeCategoryId?._id || f.feeCategoryId;
                      if (catId) {
                        initialFees[catId] = f.totalAmount.toString();
                      }
                    });
                    setSpecialFees(initialFees);
                  } else {
                    setSpecialFees({});
                  }
                } else {
                  setSpecialFees({});
                }
              }}
              placeholder="Type to search student name or admission number..."
              isClearable
              isSearchable={true}
              required
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '0.375rem',
                  borderColor: '#d1d5db'
                })
              }}
            />
          </div>

          {selectedStudent && (
            <div className="space-y-3 mt-4">
              <Label>Enter Discounted Fee Amounts</Label>
              <div className="border border-gray-200 rounded-md overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Original Amount</TableHead>
                      <TableHead className="w-1/3">New Special Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">No active fee categories available.</TableCell>
                      </TableRow>
                    ) : (
                      categories.filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).map(cat => {
                        const existingFee = selectedStudent.studentFees?.find(f => {
                          const catId = f.feeCategory?._id || f.feeCategoryId?._id || f.feeCategoryId;
                          return catId === cat._id;
                        });
                        return (
                          <TableRow key={cat._id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-gray-600">
                              {existingFee ? `Rs. ${existingFee.totalAmount}` : 'Not Assigned'}
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="0" step="0.01"
                                placeholder={existingFee ? 'Enter new total' : 'Assign fee'}
                                value={specialFees[cat._id] || ''}
                                onChange={(e) => setSpecialFees({...specialFees, [cat._id]: e.target.value})}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsAssignModalOpen(false); setSelectedStudentId(''); setSpecialFees({}); }}>Cancel</Button>
            <Button type="submit" disabled={!selectedStudentId}>Save Special Fees</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeCategories;
