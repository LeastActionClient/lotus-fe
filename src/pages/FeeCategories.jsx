import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { FileCheck, Plus, Users, User, Trash2, Edit, UserPlus, Search, Lock, UserCheck, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import Select from 'react-select';
import { Link, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useClassesQuery, useFeeCategoriesQuery, useQueryInvalidator, useStudentsQuery, useAcademicYearsQuery } from '../hooks/useSchoolQueries';

const FeeCategories = () => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const { data: categoriesData = [], isLoading: categoriesLoading } = useFeeCategoriesQuery();
  const { data: studentsData = [], isLoading: studentsLoading } = useStudentsQuery();
  const { data: classesData = [], isLoading: classesLoading } = useClassesQuery();
  const { invalidateFeeCategories, invalidateStudents, invalidateClasses } = useQueryInvalidator();
  const { data: academicYearsData = [] } = useAcademicYearsQuery();

  // For Bulk Optional Fee Category Assignment
  const [selectedOptionalCatIds, setSelectedOptionalCatIds] = useState([]);
  const [isBulkOptionalModalOpen, setIsBulkOptionalModalOpen] = useState(false);
  const [bulkOptionalFilterYear, setBulkOptionalFilterYear] = useState('');
  const [bulkOptionalFilterClass, setBulkOptionalFilterClass] = useState('');
  const [bulkOptionalFilterSection, setBulkOptionalFilterSection] = useState('');
  const [bulkOptionalSearch, setBulkOptionalSearch] = useState('');
  const [bulkOptionalStatus, setBulkOptionalStatus] = useState('all');
  const [bulkOptionalRteType, setBulkOptionalRteType] = useState('all');
  const [bulkOptionalStudentList, setBulkOptionalStudentList] = useState([]);
  const [bulkOptionalStudentListLoading, setBulkOptionalStudentListLoading] = useState(false);
  const [selectedBulkOptionalStudentIds, setSelectedBulkOptionalStudentIds] = useState([]);
  const [bulkOptionalCategoryAmounts, setBulkOptionalCategoryAmounts] = useState({});
  const [bulkOptionalSubmitLoading, setBulkOptionalSubmitLoading] = useState(false);

  // Summary Modal state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isAssignRTEModalOpen, setIsAssignRTEModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  
  const [catName, setCatName] = useState('');
  const [catMandatory, setCatMandatory] = useState(false);
  const [catIsStockItem, setCatIsStockItem] = useState(false);
  const [catInitialStock, setCatInitialStock] = useState('0');
  const [catTopStock, setCatTopStock] = useState('0');
  const [catBottomStock, setCatBottomStock] = useState('0');

  // For Assign RTE Students
  const [rteFilterYear, setRteFilterYear] = useState('');
  const [rteFilterClass, setRteFilterClass] = useState('');
  const [rteFilterSection, setRteFilterSection] = useState('');
  const [rteSearch, setRteSearch] = useState('');
  const [rteStudentList, setRteStudentList] = useState([]);
  const [rteStudentListLoading, setRteStudentListLoading] = useState(false);
  const [selectedRTEStudentIds, setSelectedRTEStudentIds] = useState([]);
  const [selectedRTECategories, setSelectedRTECategories] = useState({});
  const [rteCategoryAmounts, setRteCategoryAmounts] = useState({});
  const [rteCategorySearch, setRteCategorySearch] = useState('');
  const [rteSubmitLoading, setRteSubmitLoading] = useState(false);

  // For Edit Fee Category
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatMandatory, setEditCatMandatory] = useState(false);
  const [editCatIsStockItem, setEditCatIsStockItem] = useState(false);
  const [editCatCurrentStock, setEditCatCurrentStock] = useState('0');
  const [editCatTopStock, setEditCatTopStock] = useState('0');
  const [editCatBottomStock, setEditCatBottomStock] = useState('0');
  
  // For Assign Students to Category (Student-wise Fee Assignment)
  const [isAssignStudentsModalOpen, setIsAssignStudentsModalOpen] = useState(false);
  const [assignCategory, setAssignCategory] = useState(null);
  const [assignFilterYear, setAssignFilterYear] = useState('');
  const [assignFilterClass, setAssignFilterClass] = useState('');
  const [assignFilterSection, setAssignFilterSection] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignFeeAmount, setAssignFeeAmount] = useState('');
  const [assignSubmitLoading, setAssignSubmitLoading] = useState(false);
  const [removingFeeId, setRemovingFeeId] = useState(null);

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [categoryActionLoadingId, setCategoryActionLoadingId] = useState(null);

  const openBulkOptionalModal = () => {
    if (selectedOptionalCatIds.length === 0) {
      toastWarning("Please select at least one optional fee category.");
      return;
    }
    const initialAmounts = {};
    selectedOptionalCatIds.forEach(catId => {
      const cat = categories.find(c => c._id === catId);
      if (cat && cat.amount) {
        initialAmounts[catId] = String(cat.amount);
      } else {
        initialAmounts[catId] = '';
      }
    });
    setBulkOptionalCategoryAmounts(initialAmounts);
    setBulkOptionalFilterYear('');
    setBulkOptionalFilterClass('');
    setBulkOptionalFilterSection('');
    setBulkOptionalSearch('');
    setBulkOptionalStatus('all');
    setBulkOptionalRteType('all');
    setSelectedBulkOptionalStudentIds([]);
    setIsBulkOptionalModalOpen(true);
  };

  const fetchStudentsForBulkOptional = async () => {
    setBulkOptionalStudentListLoading(true);
    try {
      const params = new URLSearchParams();
      if (bulkOptionalFilterClass) params.append('className', bulkOptionalFilterClass);
      if (bulkOptionalFilterSection) params.append('section', bulkOptionalFilterSection);
      if (bulkOptionalFilterYear) params.append('academicYear', bulkOptionalFilterYear);
      if (bulkOptionalSearch) params.append('search', bulkOptionalSearch);
      if (bulkOptionalStatus && bulkOptionalStatus !== 'all') params.append('studentStatus', bulkOptionalStatus);
      if (bulkOptionalRteType && bulkOptionalRteType !== 'all') params.append('rteType', bulkOptionalRteType);

      const res = await api.get(`/fees/students-for-assignment?${params.toString()}`);
      setBulkOptionalStudentList(res.data || []);
    } catch (error) {
      console.error("Error fetching students for bulk assignment:", error);
      toastError("Error loading student list");
    } finally {
      setBulkOptionalStudentListLoading(false);
    }
  };

  useEffect(() => {
    if (isBulkOptionalModalOpen) {
      fetchStudentsForBulkOptional();
    }
  }, [
    isBulkOptionalModalOpen,
    bulkOptionalFilterClass,
    bulkOptionalFilterSection,
    bulkOptionalFilterYear,
    bulkOptionalSearch,
    bulkOptionalStatus,
    bulkOptionalRteType
  ]);

  const handleBatchAssignSelectedCategories = async (e) => {
    e.preventDefault();
    if (selectedOptionalCatIds.length === 0) {
      toastWarning("Please select at least one fee category.");
      return;
    }
    if (selectedBulkOptionalStudentIds.length === 0) {
      toastWarning("Please select at least one student.");
      return;
    }

    const categoryAmountsPayload = selectedOptionalCatIds.map(catId => ({
      feeCategoryId: catId,
      amount: parseFloat(bulkOptionalCategoryAmounts[catId] || 0)
    }));

    const hasInvalidAmount = categoryAmountsPayload.some(ca => isNaN(ca.amount) || ca.amount <= 0);
    if (hasInvalidAmount) {
      toastWarning("Please enter a valid amount greater than zero for all selected fee categories.");
      return;
    }

    setBulkOptionalSubmitLoading(true);
    try {
      const res = await api.post('/fees/assign-multiple-categories-students', {
        categoryAmounts: categoryAmountsPayload,
        studentIds: selectedBulkOptionalStudentIds
      });

      setIsBulkOptionalModalOpen(false);
      setSelectedOptionalCatIds([]);
      setSelectedBulkOptionalStudentIds([]);
      toastSuccess(res.data.message || "Assigned selected fee categories successfully!");
      fetchData();
    } catch (error) {
      console.error("Error assigning selected categories to students:", error);
      toastError(error.response?.data?.error || "Error assigning categories to students.");
    } finally {
      setBulkOptionalSubmitLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([invalidateFeeCategories(), invalidateStudents(), invalidateClasses()]);
  };

  useEffect(() => {
    if (categoriesData) setCategories(categoriesData);
  }, [categoriesData]);

  useEffect(() => {
    if (studentsData) setStudents(studentsData);
  }, [studentsData]);

  useEffect(() => {
    if (classesData) setClasses(classesData);
  }, [classesData]);

  const openAssignStudentsModal = (category) => {
    setAssignCategory(category);
    setAssignFilterClass('');
    setAssignFilterSection('');
    setAssignFilterYear('');
    setAssignSearch('');
    setSelectedStudentIds([]);
    setAssignFeeAmount('');
    setIsAssignStudentsModalOpen(true);
  };

  const fetchCategoryStudents = async (catId) => {
    if (!catId) return;
    setStudentListLoading(true);
    try {
      const params = new URLSearchParams();
      if (assignFilterClass) params.append('className', assignFilterClass);
      if (assignFilterSection) params.append('section', assignFilterSection);
      if (assignFilterYear) params.append('academicYear', assignFilterYear);
      if (assignSearch) params.append('search', assignSearch);

      const res = await api.get(`/fees/category-assignments/${catId}?${params.toString()}`);
      setStudentList(res.data.students || []);
    } catch (error) {
      console.error("Error fetching category students:", error);
      toastError("Error loading student list");
    } finally {
      setStudentListLoading(false);
    }
  };

  useEffect(() => {
    if (isAssignStudentsModalOpen && assignCategory) {
      fetchCategoryStudents(assignCategory._id);
    }
  }, [
    isAssignStudentsModalOpen, 
    assignCategory, 
    assignFilterClass, 
    assignFilterSection, 
    assignFilterYear, 
    assignSearch
  ]);

  const handleBatchAssignStudents = async (e) => {
    e.preventDefault();
    if (!assignCategory) return;
    if (selectedStudentIds.length === 0) {
      toastWarning("Please select at least one student.");
      return;
    }
    const amt = parseFloat(assignFeeAmount);
    if (!amt || amt <= 0) {
      toastWarning("Please enter a valid fee amount greater than 0.");
      return;
    }

    setAssignSubmitLoading(true);
    try {
      const res = await api.post('/fees/assign-category-students', {
        feeCategoryId: assignCategory._id,
        studentIds: selectedStudentIds,
        amount: amt
      });

      toastSuccess(res.data.message || "Assigned fees successfully!");
      setSelectedStudentIds([]);
      fetchData();
      fetchCategoryStudents(assignCategory._id);
    } catch (error) {
      console.error("Error assigning fees to students", error);
      toastError(error.response?.data?.error || "Error assigning fees.");
    } finally {
      setAssignSubmitLoading(false);
    }
  };

  const handleRemoveStudentAssignment = async (studentFeeId, paidAmount) => {
    if (paidAmount > 0) {
      toastError("This fee has payment history and cannot be removed.");
      return;
    }
    setRemovingFeeId(studentFeeId);
    try {
      await api.delete(`/fees/remove-student-assignment/${studentFeeId}`);
      toastSuccess("Fee assignment removed successfully!");
      fetchData();
      if (assignCategory) {
        fetchCategoryStudents(assignCategory._id);
      }
    } catch (error) {
      console.error("Error removing fee assignment:", error);
      toastError(error.response?.data?.error || "Error removing fee assignment.");
    } finally {
      setRemovingFeeId(null);
    }
  };

  const openAssignRTEModal = () => {
    setRteFilterClass('');
    setRteFilterSection('');
    setRteFilterYear('');
    setRteSearch('');
    setRteStudentList([]);
    setSelectedRTEStudentIds([]);
    setSelectedRTECategories({});
    setRteCategoryAmounts({});
    setRteCategorySearch('');
    setIsAssignRTEModalOpen(true);
  };

  const fetchRTEStudents = async () => {
    setRteStudentListLoading(true);
    try {
      const params = new URLSearchParams();
      if (rteFilterClass) params.append('className', rteFilterClass);
      if (rteFilterSection) params.append('section', rteFilterSection);
      if (rteFilterYear) params.append('academicYear', rteFilterYear);
      if (rteSearch) params.append('search', rteSearch);

      const res = await api.get(`/fees/rte-students?${params.toString()}`);
      setRteStudentList(res.data || []);
    } catch (error) {
      console.error("Error fetching RTE students:", error);
      toastError("Error loading RTE student list");
    } finally {
      setRteStudentListLoading(false);
    }
  };

  useEffect(() => {
    if (isAssignRTEModalOpen) {
      fetchRTEStudents();
    }
  }, [isAssignRTEModalOpen, rteFilterClass, rteFilterSection, rteFilterYear, rteSearch]);

  useEffect(() => {
    if (!isAssignRTEModalOpen || selectedRTEStudentIds.length === 0 || rteStudentList.length === 0) return;

    const selectedStudents = rteStudentList.filter(s => selectedRTEStudentIds.includes(s._id));
    if (selectedStudents.length === 0) return;

    const newCatSelections = {};
    const newCatAmounts = {};

    categories.forEach(cat => {
      const catIdStr = cat._id?.toString();
      
      let foundFeeAmt = null;
      let countAssigned = 0;

      for (const student of selectedStudents) {
        const matchingFee = (student.studentFees || []).find(f => {
          const rawCatId = f.feeCategoryId?._id || f.feeCategoryId;
          return rawCatId ? rawCatId.toString() === catIdStr : false;
        });

        if (matchingFee && matchingFee.totalAmount !== undefined && matchingFee.totalAmount !== null && Number(matchingFee.totalAmount) > 0) {
          countAssigned++;
          if (foundFeeAmt === null) {
            foundFeeAmt = Number(matchingFee.totalAmount);
          }
        }
      }

      if (countAssigned > 0) {
        newCatSelections[cat._id] = true;
        if (foundFeeAmt !== null) {
          newCatAmounts[cat._id] = String(foundFeeAmt);
        }
      }
    });

    if (Object.keys(newCatSelections).length > 0) {
      setSelectedRTECategories(prev => ({ ...newCatSelections, ...prev }));
      setRteCategoryAmounts(prev => ({ ...newCatAmounts, ...prev }));
    }
  }, [selectedRTEStudentIds, rteStudentList, categories, isAssignRTEModalOpen]);

  const handleAssignRTEFee = async (e) => {
    e.preventDefault();
    if (selectedRTEStudentIds.length === 0) {
      toastWarning("Please select at least one RTE student.");
      return;
    }

    const categoryAmountsPayload = Object.entries(selectedRTECategories)
      .filter(([_, isChecked]) => isChecked)
      .map(([catId]) => ({
        feeCategoryId: catId,
        amount: parseFloat(rteCategoryAmounts[catId] || 0)
      }));

    if (categoryAmountsPayload.length === 0) {
      toastWarning("Please select at least one fee category.");
      return;
    }

    const hasInvalidAmount = categoryAmountsPayload.some(ca => isNaN(ca.amount) || ca.amount <= 0);
    if (hasInvalidAmount) {
      toastWarning("Please enter a valid amount greater than ₹0 for all selected fee categories.");
      return;
    }

    setRteSubmitLoading(true);
    try {
      const res = await api.post('/fees/assign-rte-students', {
        studentIds: selectedRTEStudentIds,
        categoryAmounts: categoryAmountsPayload
      });
      toastSuccess(res.data.message || "Fee assigned to RTE students successfully!");
      setIsAssignRTEModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error assigning fees to RTE students:", error);
      toastError(error.response?.data?.error || "Error assigning fees to RTE students.");
    } finally {
      setRteSubmitLoading(false);
    }
  };

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
      if (!cat.isEnabled || !cat.mandatory || ['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(cat.name)) {
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
    setCreateLoading(true);
    try {
      const isUniform = catName.trim().toLowerCase() === 'uniform';
      await api.post('/fees/categories', { 
        name: catName, 
        mandatory: catMandatory,
        isStockItem: catIsStockItem,
        initialStock: catIsStockItem && !isUniform ? Math.max(0, parseInt(catInitialStock || '0', 10)) : 0,
        topStock: catIsStockItem && isUniform ? Math.max(0, parseFloat(catTopStock || '0')) : 0,
        bottomStock: catIsStockItem && isUniform ? Math.max(0, parseFloat(catBottomStock || '0')) : 0
      });
      setIsNewCatModalOpen(false);
      setCatName('');
      setCatMandatory(false);
      setCatIsStockItem(false);
      setCatInitialStock('0');
      setCatTopStock('0');
      setCatBottomStock('0');
      toastSuccess("Fee category created successfully!");
      invalidateFeeCategories();
      fetchData();
    } catch (error) {
      console.error("Error creating category", error);
      toastError(error.response?.data?.error || "Error creating category");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditCategoryModal = (category) => {
    setEditingCat(category);
    setEditCatName(category.name || '');
    setEditCatMandatory(!!category.mandatory);
    setEditCatIsStockItem(!!category.isStockItem);
    setEditCatCurrentStock(String(category.currentStock ?? 0));
    setEditCatTopStock(String(category.topStock ?? 0));
    setEditCatBottomStock(String(category.bottomStock ?? 0));
    setIsEditCatModalOpen(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat) return;
    setEditLoading(true);
    try {
      const isUniform = editCatName.trim().toLowerCase() === 'uniform';
      await api.put(`/fees/categories/${editingCat._id}`, {
        name: editCatName,
        mandatory: editCatMandatory,
        isEnabled: editingCat.isEnabled,
        isStockItem: editCatIsStockItem,
        updatedStock: editCatIsStockItem && !isUniform ? Math.max(0, parseInt(editCatCurrentStock || '0', 10)) : 0,
        updatedTopStock: editCatIsStockItem && isUniform ? Math.max(0, parseFloat(editCatTopStock || '0')) : 0,
        updatedBottomStock: editCatIsStockItem && isUniform ? Math.max(0, parseFloat(editCatBottomStock || '0')) : 0
      });
      setIsEditCatModalOpen(false);
      setEditingCat(null);
      toastSuccess("Fee category updated successfully!");
      invalidateFeeCategories();
      fetchData();
    } catch (error) {
      console.error("Error updating category", error);
      toastError(error.response?.data?.error || "Error updating category");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleCategory = async (category) => {
    const loadingKey = category._id;
    setCategoryActionLoadingId(loadingKey);
    try {
      await api.put(`/fees/categories/${category._id}`, { 
        name: category.name, 
        mandatory: category.mandatory, 
        isEnabled: !category.isEnabled 
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling category", error);
      toastError(error.response?.data?.error || 'Error updating category');
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const handleAssignFee = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      if (!selectedStudentId) {
        toastWarning("Please select a student.");
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
        toastWarning("No fee categories available to assign.");
        return;
      }

      await Promise.all(promises);

      setIsAssignModalOpen(false);
      setSelectedStudentId('');
      setSpecialFees({});
      setSelectedClassForStudent('');
      setSelectedSectionForStudent('');
      fetchData();
      toastSuccess("Special fees assigned successfully!");
    } catch (error) {
      console.error("Error assigning fee", error);
      toastError("Error assigning fee. Please check details.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleBulkAssignFee = async (e) => {
    e.preventDefault();
    setBulkAssignLoading(true);
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
        toastWarning("Please enter a valid rate/amount greater than 0 for all checked categories.");
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
      toastSuccess(res.data.message);
    } catch (error) {
      console.error("Error bulk assigning fee", error);
      toastError(error.response?.data?.error || "Error assigning fees. Please check details.");
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const accepted = await confirm({
      title: 'Delete Category',
      description: 'Are you sure you want to delete this category?',
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) {
      return;
    }

    setCategoryActionLoadingId(category._id);
    try {
      await api.delete(`/fees/categories/${category._id}`);
      fetchData();
    } catch (e) {
      toastError(e.response?.data?.error || 'Error deleting category');
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const selectedClassObjBulk = classes.find(c => c.name === bulkAssignData.className);

  const visibleCategories = categories.filter(c => !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name));
  const totalPages = Math.max(1, Math.ceil(visibleCategories.length / itemsPerPage));
  const paginatedCategories = visibleCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  const pageLoading = categoriesLoading || studentsLoading || classesLoading;
  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <FileCheck className="mr-3 text-blue-600" size={32} />
            Fee Categories
          </h1>
          <p className="text-gray-500 mt-2">Manage fee types and assignments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            disabled={selectedOptionalCatIds.length === 0} 
            onClick={openBulkOptionalModal} 
            className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <UserPlus className="mr-2 h-4 w-4 text-purple-600" />
            Assign Selected Categories {selectedOptionalCatIds.length > 0 ? `(${selectedOptionalCatIds.length})` : ''}
          </Button>
          <Button variant="secondary" onClick={() => setIsBulkAssignModalOpen(true)}>
            <Users className="mr-2 h-4 w-4" /> Assign Fee to Class
          </Button>
          <Button variant="outline" onClick={openAssignRTEModal} className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold">
            <UserCheck className="mr-2 h-4 w-4 text-purple-600" /> Assign RTE Students
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
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedCategories.filter(c => !c.mandatory).length > 0 &&
                      paginatedCategories.filter(c => !c.mandatory).every(c => selectedOptionalCatIds.includes(c._id))
                    }
                    onChange={(e) => {
                      const pageOptionalIds = paginatedCategories.filter(c => !c.mandatory).map(c => c._id);
                      if (e.target.checked) {
                        setSelectedOptionalCatIds(prev => Array.from(new Set([...prev, ...pageOptionalIds])));
                      } else {
                        setSelectedOptionalCatIds(prev => prev.filter(id => !pageOptionalIds.includes(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    title="Select all optional fee categories on this page"
                  />
                </TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-gray-500">
                    No fee categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((cat) => (
                  <TableRow key={cat._id} className={selectedOptionalCatIds.includes(cat._id) ? 'bg-purple-50/40' : ''}>
                    <TableCell className="w-10 text-center">
                      {!cat.mandatory ? (
                        <input
                          type="checkbox"
                          checked={selectedOptionalCatIds.includes(cat._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOptionalCatIds(prev => [...prev, cat._id]);
                            } else {
                              setSelectedOptionalCatIds(prev => prev.filter(id => id !== cat._id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 ">{cat.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat.mandatory ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cat.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cat.isStockItem ? (
                        cat.name.toLowerCase() === 'uniform' ? (
                          <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs inline-flex flex-col items-start leading-normal">
                            <span>Top: {cat.topStock ?? 0} m</span>
                            <span>Bottom: {cat.bottomStock ?? 0} m</span>
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                            {cat.currentStock ?? 0}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleToggleCategory(cat)}
                        disabled={categoryActionLoadingId === cat._id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-70 disabled:cursor-wait ${
                        cat.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {categoryActionLoadingId === cat._id ? 'Updating...' : (cat.isEnabled ? 'Active' : 'Disabled')}
                      </button>
                    </TableCell>
                    <TableCell>{new Date(cat.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                          onClick={() => openEditCategoryModal(cat)}
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {cat.mandatory ? null : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteCategory(cat)}
                            loading={categoryActionLoadingId === cat._id}
                            loadingText=""
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      {/* Assign Selected Optional Fee Categories Modal */}
      <Modal 
        isOpen={isBulkOptionalModalOpen} 
        onClose={() => setIsBulkOptionalModalOpen(false)} 
        title="Assign Selected Optional Fee Categories"
        className="max-w-4xl"
      >
        <form onSubmit={handleBatchAssignSelectedCategories} className="space-y-4 pt-1">
          {/* Selected Categories & Individual Amounts Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                Selected Categories & Enter Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                {selectedOptionalCatIds.length} Category(ies) Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-purple-50/50 border border-purple-200 rounded-xl shadow-inner">
              {selectedOptionalCatIds.map(catId => {
                const cat = categories.find(c => c._id === catId);
                if (!cat) return null;
                return (
                  <div key={catId} className="bg-white p-3 rounded-lg border border-purple-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold text-sm">✓</span>
                      <div>
                        <div className="font-bold text-xs text-gray-900">{cat.name}</div>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Optional
                        </span>
                      </div>
                    </div>
                    <div className="w-36">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Amount"
                        value={bulkOptionalCategoryAmounts[catId] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkOptionalCategoryAmounts(prev => ({ ...prev, [catId]: val }));
                        }}
                        className="h-8 text-xs font-bold text-right bg-white"
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Class</Label>
              <select
                value={bulkOptionalFilterClass}
                onChange={(e) => {
                  setBulkOptionalFilterClass(e.target.value);
                  setBulkOptionalFilterSection('');
                }}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- All Classes --</option>
                {classes.map(c => (
                  <option key={c._id || c.name} value={c.name}>Class {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Section</Label>
              <select
                value={bulkOptionalFilterSection}
                onChange={(e) => setBulkOptionalFilterSection(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                disabled={!bulkOptionalFilterClass}
              >
                <option value="">-- All Sections --</option>
                {bulkOptionalFilterClass && classes.find(c => c.name === bulkOptionalFilterClass)?.sections?.map(s => (
                  <option key={s._id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Student Search</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Name / Adm No..."
                  value={bulkOptionalSearch}
                  onChange={(e) => setBulkOptionalSearch(e.target.value)}
                  className="h-9 text-xs pl-8 bg-white"
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Student Selection Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 font-semibold"
                onClick={() => setSelectedBulkOptionalStudentIds(bulkOptionalStudentList.map(s => s._id))}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-gray-600 font-semibold"
                onClick={() => setSelectedBulkOptionalStudentIds([])}
              >
                Clear Selection
              </Button>
            </div>

            <div className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              Selected Students: <span className="text-purple-700 font-extrabold">{selectedBulkOptionalStudentIds.length}</span> of {bulkOptionalStudentList.length}
            </div>
          </div>

          {/* Students Table */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
            {bulkOptionalStudentListLoading ? (
              <div className="p-6 text-center text-gray-500 font-medium text-xs">Loading matching students...</div>
            ) : bulkOptionalStudentList.length === 0 ? (
              <div className="p-6 text-center text-gray-500 font-medium text-xs">
                No matching students found for selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-2xs">
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          bulkOptionalStudentList.length > 0 &&
                          bulkOptionalStudentList.every(s => selectedBulkOptionalStudentIds.includes(s._id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBulkOptionalStudentIds(bulkOptionalStudentList.map(s => s._id));
                          } else {
                            setSelectedBulkOptionalStudentIds([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Course Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkOptionalStudentList.map((student) => {
                    const isSelected = selectedBulkOptionalStudentIds.includes(student._id);
                    return (
                      <TableRow key={student._id} className={isSelected ? 'bg-purple-50/50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBulkOptionalStudentIds(prev => [...prev, student._id]);
                              } else {
                                setSelectedBulkOptionalStudentIds(prev => prev.filter(id => id !== student._id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gray-700">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell className="font-bold text-gray-900 text-xs">
                          {student.studentName}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          {student.currentClass}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          {student.section || 'A'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            student.courseType === 'RTE' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {student.courseType}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBulkOptionalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={bulkOptionalSubmitLoading}
              loadingText="Assigning Categories..."
              disabled={
                selectedOptionalCatIds.length === 0 ||
                selectedBulkOptionalStudentIds.length === 0 ||
                selectedOptionalCatIds.some(catId => !bulkOptionalCategoryAmounts[catId] || parseFloat(bulkOptionalCategoryAmounts[catId]) <= 0)
              }
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Assign Selected Categories
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Fee Category Modal */}
      <Modal isOpen={isNewCatModalOpen} onClose={() => { setIsNewCatModalOpen(false); setCatName(''); setCatMandatory(false); setCatIsStockItem(false); setCatInitialStock('0'); }} title="Create Fee Category">
        <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="catName">Category Name</Label>
            <Input 
              id="catName" 
              value={catName} 
              onChange={(e) => setCatName(e.target.value)} 
              placeholder="e.g., Tuition Fee, Book, Uniform"
              required 
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox"
              id="catMandatory" 
              checked={catMandatory} 
              onChange={(e) => setCatMandatory(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="catMandatory" className="cursor-pointer font-medium text-gray-700">Mandatory</Label>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox"
              id="catIsStockItem" 
              checked={catIsStockItem} 
              onChange={(e) => setCatIsStockItem(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="catIsStockItem" className="cursor-pointer font-medium text-gray-700">Stock Item</Label>
          </div>

          {catIsStockItem && (
            catName.trim().toLowerCase() === 'uniform' ? (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="catTopStock">Top Initial Stock (m)</Label>
                  <Input 
                    id="catTopStock" 
                    type="text" 
                    value={catTopStock} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setCatTopStock(val);
                    }} 
                    placeholder="e.g., 250.5"
                    required={catIsStockItem}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catBottomStock">Bottom Initial Stock (m)</Label>
                  <Input 
                    id="catBottomStock" 
                    type="text" 
                    value={catBottomStock} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setCatBottomStock(val);
                    }} 
                    placeholder="e.g., 300"
                    required={catIsStockItem}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                <Label htmlFor="catInitialStock">Initial Stock</Label>
                <Input 
                  id="catInitialStock" 
                  type="number" 
                  min="0"
                  step="1"
                  value={catInitialStock} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setCatInitialStock(val);
                  }} 
                  placeholder="e.g., 500"
                  required={catIsStockItem}
                />
              </div>
            )
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsNewCatModalOpen(false); setCatName(''); setCatMandatory(false); setCatIsStockItem(false); setCatInitialStock('0'); setCatTopStock('0'); setCatBottomStock('0'); }}>Cancel</Button>
            <Button type="submit" loading={createLoading} loadingText="Creating...">Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Fee Category Modal */}
      <Modal isOpen={isEditCatModalOpen} onClose={() => { setIsEditCatModalOpen(false); setEditingCat(null); }} title="Edit Fee Category">
        <form onSubmit={handleUpdateCategory} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="editCatName">Category Name</Label>
            <Input 
              id="editCatName" 
              value={editCatName} 
              onChange={(e) => setEditCatName(e.target.value)} 
              placeholder="Category Name"
              required 
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox"
              id="editCatMandatory" 
              checked={editCatMandatory} 
              onChange={(e) => setEditCatMandatory(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="editCatMandatory" className="cursor-pointer font-medium text-gray-700">Mandatory</Label>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox"
              id="editCatIsStockItem" 
              checked={editCatIsStockItem} 
              onChange={(e) => setEditCatIsStockItem(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="editCatIsStockItem" className="cursor-pointer font-medium text-gray-700">Stock Item</Label>
          </div>

          {editCatIsStockItem && (
            editCatName.trim().toLowerCase() === 'uniform' ? (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="editCatTopStock">Current Top Stock (m)</Label>
                  <Input 
                    id="editCatTopStock" 
                    type="text" 
                    value={editCatTopStock} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setEditCatTopStock(val);
                    }} 
                    placeholder="e.g., 250.5"
                    required={editCatIsStockItem}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCatBottomStock">Current Bottom Stock (m)</Label>
                  <Input 
                    id="editCatBottomStock" 
                    type="text" 
                    value={editCatBottomStock} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setEditCatBottomStock(val);
                    }} 
                    placeholder="e.g., 300"
                    required={editCatIsStockItem}
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-500">Update values to adjust available uniform cloth meters.</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                <Label htmlFor="editCatCurrentStock">Current Stock</Label>
                <Input 
                  id="editCatCurrentStock" 
                  type="number" 
                  min="0"
                  step="1"
                  value={editCatCurrentStock} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditCatCurrentStock(val);
                  }} 
                  placeholder="Current Stock Quantity"
                  required={editCatIsStockItem}
                />
                <p className="text-xs text-gray-500">Update value to adjust available inventory.</p>
              </div>
            )
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsEditCatModalOpen(false); setEditingCat(null); setEditCatTopStock('0'); setEditCatBottomStock('0'); }}>Cancel</Button>
            <Button type="submit" loading={editLoading} loadingText="Saving...">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)} title="Assign Fee to Class">
        <form onSubmit={handleBulkAssignFee} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50   "
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
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50   "
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
                  {categories.filter(c => c.isEnabled && c.mandatory && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">No mandatory fee categories available.</TableCell>
                    </TableRow>
                  ) : (
                    categories.filter(c => c.isEnabled && c.mandatory && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name)).map(cat => {
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
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {cat.name} {cat.mandatory && <span className="text-xs text-blue-600 font-normal">(Mandatory)</span>}
                            </TableCell>
                            <TableCell>
                              {!isUniform ? (
                                <Input 
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="e.g., 5000"
                                  value={bulkFees[cat._id] || ''}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                    setBulkFees({...bulkFees, [cat._id]: cleaned});
                                  }}
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
                            <TableRow className="bg-blue-50/30">
                              <TableCell></TableCell>
                              <TableCell colSpan={2} className="py-3 px-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Top Price / Metre (₹)</Label>
                                    <Input 
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder="e.g., 450"
                                      value={bulkFees[`${cat._id}_top`] || ''}
                                      onChange={(e) => {
                                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                        setBulkFees({...bulkFees, [`${cat._id}_top`]: cleaned});
                                      }}
                                      readOnly={!isEditingBulkFees}
                                      className={!isEditingBulkFees ? "bg-gray-100 h-8 text-xs" : "h-8 text-xs"}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Bottom Price / Metre (₹)</Label>
                                    <Input 
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder="e.g., 350"
                                      value={bulkFees[`${cat._id}_bottom`] || ''}
                                      onChange={(e) => {
                                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                        setBulkFees({...bulkFees, [`${cat._id}_bottom`]: cleaned});
                                      }}
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
              <Button type="button" variant="ghost" onClick={() => setIsBulkAssignModalOpen(false)} disabled={bulkAssignLoading}>Cancel</Button>
              {isEditingBulkFees && <Button type="submit" loading={bulkAssignLoading} loadingText="Assigning...">Assign to Class</Button>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Assign Students to Fee Category Modal */}
      <Modal 
        isOpen={isAssignStudentsModalOpen} 
        onClose={() => { 
          setIsAssignStudentsModalOpen(false); 
          setAssignCategory(null);
          setStudentList([]);
          setSelectedStudentIds([]);
          setAssignFeeAmount('');
        }} 
        title="Assign Students to Fee Category"
        className="max-w-4xl"
      >
        {assignCategory && (
          <div className="space-y-4 pt-1">
            {/* Top Category Details Banner */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-700">Selected Fee Category</div>
                <div className="text-lg font-black text-purple-950 flex items-center gap-2">
                  <span>{assignCategory.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  assignCategory.mandatory ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {assignCategory.mandatory ? 'Mandatory Fee' : 'Optional Fee'}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  assignCategory.isEnabled ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {assignCategory.isEnabled ? 'Active Category' : 'Disabled Category'}
                </span>
              </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <Label className="text-xs font-bold text-gray-700 mb-1 block">Class</Label>
                <select
                  value={assignFilterClass}
                  onChange={(e) => {
                    setAssignFilterClass(e.target.value);
                    setAssignFilterSection('');
                  }}
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- All Classes --</option>
                  {classes.map(c => (
                    <option key={c._id || c.name} value={c.name}>Class {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700 mb-1 block">Section</Label>
                <select
                  value={assignFilterSection}
                  onChange={(e) => setAssignFilterSection(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  disabled={!assignFilterClass}
                >
                  <option value="">-- All Sections --</option>
                  {assignFilterClass && classes.find(c => c.name === assignFilterClass)?.sections?.map(s => (
                    <option key={s._id || s.name} value={s.name}>Section {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700 mb-1 block">Search Student</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search name or adm no..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="h-9 text-xs pl-8"
                  />
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Selection Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 font-semibold"
                  onClick={() => {
                    const assignableIds = studentList
                      .filter(s => !(s.paidAmount > 0))
                      .map(s => s._id);
                    setSelectedStudentIds(assignableIds);
                  }}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-gray-600 font-semibold"
                  onClick={() => setSelectedStudentIds([])}
                >
                  Clear Selection
                </Button>
              </div>

              <div className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                Selected: <span className="text-purple-700 font-extrabold">{selectedStudentIds.length}</span> of {studentList.length} Students
              </div>
            </div>

            {/* Students Table */}
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
              {studentListLoading ? (
                <div className="p-8 text-center text-gray-500 font-medium text-xs">Loading matching students...</div>
              ) : studentList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium text-xs">
                  No matching students found for selected class/section.
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-2xs">
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            studentList.length > 0 && 
                            studentList.filter(s => !(s.paidAmount > 0)).every(s => selectedStudentIds.includes(s._id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              const ids = studentList.filter(s => !(s.paidAmount > 0)).map(s => s._id);
                              setSelectedStudentIds(ids);
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead>Adm No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class & Sec</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentList.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      const isPaid = student.paidAmount > 0;
                      return (
                        <TableRow 
                          key={student._id}
                          className={isSelected ? 'bg-purple-50/50' : ''}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isPaid}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds(prev => [...prev, student._id]);
                                } else {
                                  setSelectedStudentIds(prev => prev.filter(id => id !== student._id));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-gray-700">
                            {student.admissionNumber}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900 text-xs">
                            {student.studentName}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-700">
                            {student.currentClass} - {student.section || 'A'}
                          </TableCell>
                          <TableCell>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Paid (₹{student.paidAmount})
                              </span>
                            ) : student.isAssigned ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Assigned (₹{student.totalAmount})
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">Not Assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {student.isAssigned && (
                              isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-semibold" title="This fee has payment history and cannot be removed.">
                                  <Lock className="h-3.5 w-3.5 text-gray-400" /> Locked
                                </span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                                  onClick={() => handleRemoveStudentAssignment(student.studentFeeId, student.paidAmount)}
                                  loading={removingFeeId === student.studentFeeId}
                                  loadingText=""
                                  title="Remove Assignment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Fee Amount & Assign Submit Footer */}
            <form onSubmit={handleBatchAssignStudents} className="pt-2 border-t border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                <div className="w-full sm:w-64 space-y-1">
                  <Label htmlFor="assignFeeAmount" className="text-xs font-bold text-purple-950">
                    Fee Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="assignFeeAmount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter amount (e.g. 1000)"
                    value={assignFeeAmount}
                    onChange={(e) => setAssignFeeAmount(e.target.value)}
                    className="h-9 font-bold text-sm bg-white"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAssignStudentsModalOpen(false);
                      setAssignCategory(null);
                      setStudentList([]);
                      setSelectedStudentIds([]);
                      setAssignFeeAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={assignSubmitLoading}
                    loadingText="Assigning Fees..."
                    disabled={selectedStudentIds.length === 0 || !assignFeeAmount || parseFloat(assignFeeAmount) <= 0}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Assign Fee to {selectedStudentIds.length} Student(s)
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Assign Fee to RTE Students Modal */}
      <Modal 
        isOpen={isAssignRTEModalOpen} 
        onClose={() => setIsAssignRTEModalOpen(false)} 
        title="Assign Fee to RTE Students"
        className="max-w-4xl"
      >
        <form onSubmit={handleAssignRTEFee} className="space-y-4 pt-1">
          {/* Top Informative Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-700 font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-purple-700">RTE Fee Assignment Module</div>
                <div className="text-sm font-bold text-purple-950">Assign fee categories directly to enrolled RTE students</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              RTE Students Only
            </span>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Class</Label>
              <select
                value={rteFilterClass}
                onChange={(e) => {
                  setRteFilterClass(e.target.value);
                  setRteFilterSection('');
                }}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- All Classes --</option>
                {classes.map(c => (
                  <option key={c._id || c.name} value={c.name}>Class {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Section</Label>
              <select
                value={rteFilterSection}
                onChange={(e) => setRteFilterSection(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                disabled={!rteFilterClass}
              >
                <option value="">-- All Sections --</option>
                {rteFilterClass && classes.find(c => c.name === rteFilterClass)?.sections?.map(s => (
                  <option key={s._id || s.name} value={s.name}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Search RTE Student</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search name or adm no..."
                  value={rteSearch}
                  onChange={(e) => setRteSearch(e.target.value)}
                  className="h-9 text-xs pl-8 bg-white"
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Student Selection Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 font-semibold"
                onClick={() => setSelectedRTEStudentIds(rteStudentList.map(s => s._id))}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-gray-600 font-semibold"
                onClick={() => setSelectedRTEStudentIds([])}
              >
                Clear Selection
              </Button>
            </div>

            <div className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              Selected RTE Students: <span className="text-purple-700 font-extrabold">{selectedRTEStudentIds.length}</span> of {rteStudentList.length}
            </div>
          </div>

          {/* RTE Students Table */}
          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
            {rteStudentListLoading ? (
              <div className="p-6 text-center text-gray-500 font-medium text-xs">Loading RTE students...</div>
            ) : rteStudentList.length === 0 ? (
              <div className="p-6 text-center text-gray-500 font-medium text-xs">
                No RTE students found for selected class/section filters.
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-2xs">
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          rteStudentList.length > 0 && 
                          rteStudentList.every(s => selectedRTEStudentIds.includes(s._id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRTEStudentIds(rteStudentList.map(s => s._id));
                          } else {
                            setSelectedRTEStudentIds([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Academic Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rteStudentList.map((student) => {
                    const isSelected = selectedRTEStudentIds.includes(student._id);
                    return (
                      <TableRow key={student._id} className={isSelected ? 'bg-purple-50/50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRTEStudentIds(prev => [...prev, student._id]);
                              } else {
                                setSelectedRTEStudentIds(prev => prev.filter(id => id !== student._id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gray-700">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell className="font-bold text-gray-900 text-xs">
                          {student.studentName}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          Class {student.currentClass}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          {student.section || 'A'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-mono">
                          {student.academicYear || '2026-2027'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Fee Categories & Amounts Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                Select Fee Categories & Enter Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <div className="relative w-full sm:w-60">
                <Input
                  type="text"
                  placeholder="Filter category name..."
                  value={rteCategorySearch}
                  onChange={(e) => setRteCategorySearch(e.target.value)}
                  className="h-8 text-xs pl-7 bg-white"
                />
                <Search className="h-3 w-3 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto bg-white shadow-xs">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-2xs">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fee Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-48 text-right">Category Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories
                    .filter(c => c.isEnabled && !['Base Fee', 'Included Charges', 'Activities', 'Full Fees'].includes(c.name))
                    .filter(c => !rteCategorySearch || c.name.toLowerCase().includes(rteCategorySearch.toLowerCase()))
                    .map(cat => {
                      const isChecked = !!selectedRTECategories[cat._id];
                      return (
                        <TableRow key={cat._id} className={isChecked ? 'bg-purple-50/40' : ''}>
                          <TableCell className="w-10">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedRTECategories(prev => ({
                                  ...prev,
                                  [cat._id]: e.target.checked
                                }));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="font-bold text-gray-900 text-xs">
                            {cat.name}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              cat.mandatory ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {cat.mandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="₹ Amount"
                              value={rteCategoryAmounts[cat._id] || ''}
                              disabled={!isChecked}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRteCategoryAmounts(prev => ({
                                  ...prev,
                                  [cat._id]: val
                                }));
                              }}
                              className="h-8 text-xs font-bold text-right bg-white w-36 ml-auto"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAssignRTEModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={rteSubmitLoading}
              loadingText="Assigning RTE Fees..."
              disabled={
                selectedRTEStudentIds.length === 0 || 
                Object.values(selectedRTECategories).filter(Boolean).length === 0
              }
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              Assign Fee to {selectedRTEStudentIds.length} RTE Student(s)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeCategories;
