import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { ArrowLeft, User, BookOpen, Users, DollarSign, Save } from 'lucide-react';
import { MultiSelectDropdown } from '../components/ui/MultiSelectDropdown';
import { isRTEStudent } from '../utils/studentCategory';

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [defaultFees, setDefaultFees] = useState({});
  const [selectedCharges, setSelectedCharges] = useState([]); // Selected optional category IDs
  const [topLength, setTopLength] = useState('');
  const [bottomLength, setBottomLength] = useState('');

  // Form State
  // Form State
  const [formData, setFormData] = useState({
    admissionNumber: '',
    studentName: '',
    photoUrl: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    aadhaarNumber: '',
    religion: '',
    community: '',
    caste: '',
    emisNo: '',
    emisNumber: '',
    nationality: '',
    email: '',
    currentClass: '',
    section: '',
    rollNumber: '',
    admissionDate: '',
    academicYear: '',
    studentStatus: 'Active',
    isRTE: false,
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
    guardian: '',
    guardianName: '',
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleValidatedChange = (field, e, validationType, stateObj, setState, maxLen) => {
    let val = e.target.value;
    if (validationType === 'letters') {
      val = val.replace(/[^a-zA-Z\s]/g, '');
    } else if (validationType === 'numbers') {
      val = val.replace(/[^0-9]/g, '');
    } else if (validationType === 'alphanumeric') {
      val = val.replace(/[^a-zA-Z0-9\s\-\+]/g, '');
    } else if (validationType === 'bloodGroup') {
      val = val.replace(/[^a-zA-Z\s\-\+]/g, '');
    }
    const limit = maxLen ?? (field === 'aadhaarNumber' ? 12 : field === 'emisNumber' ? 10 : null);
    if (limit && val.length > limit) {
      val = val.slice(0, limit);
    }
    if (typeof setState === 'function') {
      setState({ ...stateObj, [field]: val });
    }
  };

  const handleTopLengthChange = (val) => {
    if (val === '') {
      setTopLength('');
      return;
    }
    const num = parseFloat(val);
    if (num >= 0) {
      setTopLength(val);
    }
  };

  const handleBottomLengthChange = (val) => {
    if (val === '') {
      setBottomLength('');
      return;
    }
    const num = parseFloat(val);
    if (num >= 0) {
      setBottomLength(val);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, categoriesRes, classesRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get('/fees/categories'),
        api.get('/classes')
      ]);

      const student = studentRes.data;
      const cats = categoriesRes.data;
      const cls = classesRes.data;

      setCategories(cats);
      setClasses(cls);

      // Find Class and Section default fees
      let defFees = {};
      const clsObj = cls.find(c => c.name === student.currentClass);
      if (clsObj) {
        if (student.section) {
          const secObj = clsObj.sections?.find(s => s.name === student.section);
          if (secObj && secObj.defaultFees && Object.keys(secObj.defaultFees).length > 0) {
            defFees = secObj.defaultFees;
          } else if (clsObj.defaultFees) {
            defFees = clsObj.defaultFees;
          }
        } else if (clsObj.defaultFees) {
          defFees = clsObj.defaultFees;
        }
      }
      setDefaultFees(defFees);

      // Map existing student data to form
      setFormData({
        admissionNumber: student.admissionNumber || '',
        studentName: student.studentName || '',
        photoUrl: student.photoUrl || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        gender: student.gender || '',
        bloodGroup: student.bloodGroup || '',
        aadhaarNumber: student.aadhaarNumber || '',
        religion: student.religion || '',
        community: student.community || '',
        caste: student.caste || '',
        emisNo: student.emisNo || student.emisNumber || '',
        emisNumber: student.emisNo || student.emisNumber || '',
        nationality: student.nationality || '',
        email: student.email || '',
        currentClass: student.currentClass || '',
        section: student.section || '',
        rollNumber: student.rollNumber || '',
        admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
        academicYear: student.academicYear || '',
        studentStatus: student.studentStatus || 'Active',
        isRTE: isRTEStudent(student),
        fatherName: student.fatherName || '',
        fatherPhone: student.fatherPhone || '',
        fatherOccupation: student.fatherOccupation || '',
        motherName: student.motherName || '',
        motherPhone: student.motherPhone || '',
        motherOccupation: student.motherOccupation || '',
        guardian: student.guardianName || student.guardian || '',
        guardianName: student.guardianName || student.guardian || '',
        whatsappNumber: student.whatsappNumber || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        pincode: student.pincode || '',
      });

      // Find which optional categories student has in studentFees (excl. Uniform)
      const studentOptionalFeeCatIds = (student.studentFees || [])
        .filter(f => {
          const catId = f.feeCategoryId?._id || f.feeCategoryId;
          const cat = cats.find(c => c._id === catId);
          return cat && !cat.mandatory && cat.name.toLowerCase() !== 'uniform';
        })
        .map(f => f.feeCategoryId?._id || f.feeCategoryId);

      setSelectedCharges(studentOptionalFeeCatIds);

      // Load Uniform lengths
      const uniformFee = (student.studentFees || []).find(f => {
        const catId = f.feeCategoryId?._id || f.feeCategoryId;
        const cat = cats.find(c => c._id === catId);
        return cat && cat.name.toLowerCase() === 'uniform';
      });

      if (uniformFee && uniformFee.uniformDetails) {
        setTopLength(uniformFee.uniformDetails.topLength !== undefined ? uniformFee.uniformDetails.topLength : 0);
        setBottomLength(uniformFee.uniformDetails.bottomLength !== undefined ? uniformFee.uniformDetails.bottomLength : 0);
      } else {
        setTopLength(0);
        setBottomLength(0);
      }

    } catch (error) {
      console.error("Error fetching student details", error);
      alert("Error loading student data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRTEToggleChange = (e) => {
    setFormData(prev => ({ ...prev, isRTE: e.target.checked }));
  };

  // Recompute defaultFees whenever currentClass or section changes
  useEffect(() => {
    if (classes.length === 0 || categories.length === 0) return;

    let defFees = {};
    const clsObj = classes.find(c => c.name === formData.currentClass);
    if (clsObj) {
      if (formData.section) {
        const secObj = clsObj.sections?.find(s => s.name === formData.section);
        if (secObj && secObj.defaultFees && Object.keys(secObj.defaultFees).length > 0) {
          defFees = secObj.defaultFees;
        } else if (clsObj.defaultFees) {
          defFees = clsObj.defaultFees;
        }
      } else if (clsObj.defaultFees) {
        defFees = clsObj.defaultFees;
      }
    }
    setDefaultFees(defFees);
  }, [formData.currentClass, formData.section, classes, categories]);

  const getFeeAmount = (feeConfig) => {
    if (typeof feeConfig === 'number') return feeConfig;
    if (feeConfig && typeof feeConfig === 'object') {
      if (feeConfig.amount !== undefined) return Number(feeConfig.amount);
    }
    return 0;
  };

  // Calculations
  const mandatoryCats = categories.filter(cat => cat.isEnabled && cat.mandatory && cat.name.toLowerCase() !== 'uniform' && getFeeAmount(defaultFees[cat._id]) > 0);
  const baseFeeAmount = mandatoryCats.reduce((sum, cat) => {
    return sum + getFeeAmount(defaultFees[cat._id]);
  }, 0);

  const optionalCats = categories.filter(cat => cat.isEnabled && !cat.mandatory && cat.name.toLowerCase() !== 'uniform' && getFeeAmount(defaultFees[cat._id]) > 0);
  const chargesOptions = optionalCats.map(cat => {
    const amt = getFeeAmount(defaultFees[cat._id]);
    return {
      value: cat._id,
      label: `${cat.name} (₹${amt})`
    };
  });

  const uniformCategory = categories.find(cat => cat.name.toLowerCase() === 'uniform');
  const uniformConfig = uniformCategory ? defaultFees[uniformCategory._id] : null;
  const hasUniform = !!uniformConfig;

  const topPrice = parseFloat(uniformConfig?.pricing?.topPerMetre || 0);
  const bottomPrice = parseFloat(uniformConfig?.pricing?.bottomPerMetre || 0);

  const topLen = parseFloat(topLength || 0);
  const bottomLen = parseFloat(bottomLength || 0);

  const topTotal = topLen * topPrice;
  const bottomTotal = bottomLen * bottomPrice;
  const uniformTotal = topTotal + bottomTotal;

  const normalChargesTotal = selectedCharges.reduce((sum, catId) => {
    return sum + getFeeAmount(defaultFees[catId]);
  }, 0);

  const chargesTotal = normalChargesTotal + uniformTotal;

  const grandTotal = baseFeeAmount + chargesTotal;

  const handleSave = async (e) => {
    e.preventDefault();
    const caste = (formData.caste || '').trim();
    if (caste && !/^[a-zA-Z\s]+$/.test(caste)) {
      alert("Caste must contain only alphabets and spaces.");
      return;
    }
    if (caste.length > 50) {
      alert("Caste must not exceed 50 characters.");
      return;
    }

    const emisNo = (formData.emisNo || formData.emisNumber || '').trim();
    if (emisNo && !/^\d{10}$/.test(emisNo)) {
      alert("EMIS No must be exactly 10 digits.");
      return;
    }

    const guardianName = (formData.guardianName || formData.guardian || '').trim();
    if (guardianName && !/^[a-zA-Z\s]+$/.test(guardianName)) {
      alert("Guardian Name must contain only alphabets and spaces.");
      return;
    }
    if (guardianName.length > 100) {
      alert("Guardian Name must not exceed 100 characters.");
      return;
    }

    const whatsappNumber = (formData.whatsappNumber || '').trim();
    if (whatsappNumber && !/^\d{10}$/.test(whatsappNumber)) {
      alert("WhatsApp Number must be exactly 10 digits.");
      return;
    }

    if (formData.bloodGroup && /\d/.test(formData.bloodGroup)) {
      alert("Blood Group should not contain numbers.");
      return;
    }

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
      alert("Aadhaar Number must be exactly 12 digits.");
      return;
    }

    try {
      const mandatoryCatIds = categories
        .filter(cat => cat.isEnabled && cat.mandatory && cat.name.toLowerCase() !== 'uniform' && getFeeAmount(defaultFees[cat._id]) > 0)
        .map(cat => cat._id);

      const selectedFeeCategoryIds = [...mandatoryCatIds, ...selectedCharges];

      if (hasUniform && uniformCategory) {
        if (!selectedFeeCategoryIds.includes(uniformCategory._id)) {
          selectedFeeCategoryIds.push(uniformCategory._id);
        }
      }

      const payload = {
        ...formData,
        caste: caste,
        emisNo: emisNo,
        emisNumber: emisNo,
        guardian: guardianName,
        guardianName: guardianName,
        whatsappNumber: whatsappNumber,
        RTE: formData.isRTE ? 'RTE' : 'General',
        baseFee: baseFeeAmount,
        grandTotal: grandTotal,
        selectedFeeCategoryIds,
        uniformDetails: {
          topLength: topLength !== '' ? parseFloat(topLength) : 0,
          bottomLength: bottomLength !== '' ? parseFloat(bottomLength) : 0
        }
      };

      await api.put(`/students/${id}`, payload);
      alert("Student updated successfully!");
      navigate('/dashboard/students');
    } catch (error) {
      console.error("Error updating student", error);
      alert(error.response?.data?.error || "Error saving student data.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading student details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/students')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-500 text-sm">Update details and manage fees for {formData.studentName}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Details */}
          <Card>
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center text-gray-700">
                <User className="mr-2 h-5 w-5 text-orange-600" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Admission Number</Label>
                <Input name="admissionNumber" value={formData.admissionNumber} onChange={(e) => handleValidatedChange('admissionNumber', e, 'alphanumeric', formData, setFormData)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input name="studentName" value={formData.studentName} onChange={(e) => handleValidatedChange('studentName', e, 'letters', formData, setFormData)} required />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Input name="bloodGroup" value={formData.bloodGroup} onChange={(e) => handleValidatedChange('bloodGroup', e, 'bloodGroup', formData, setFormData)} placeholder="e.g. O+" />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar Number</Label>
                <Input name="aadhaarNumber" value={formData.aadhaarNumber} maxLength={12} onChange={(e) => handleValidatedChange('aadhaarNumber', e, 'numbers', formData, setFormData, 12)} />
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Input name="religion" value={formData.religion} onChange={(e) => handleValidatedChange('religion', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Community</Label>
                <Input name="community" value={formData.community} onChange={(e) => handleValidatedChange('community', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Caste</Label>
                <Input name="caste" value={formData.caste} maxLength={50} onChange={(e) => handleValidatedChange('caste', e, 'letters', formData, setFormData, 50)} placeholder="e.g. BC, MBC" />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input name="nationality" value={formData.nationality} onChange={(e) => handleValidatedChange('nationality', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          {/* Academic Details */}
          <Card>
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center text-gray-700">
                <BookOpen className="mr-2 h-5 w-5 text-orange-600" /> Academic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Input name="currentClass" value={formData.currentClass} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input name="section" value={formData.section} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>EMIS No</Label>
                <Input name="emisNo" value={formData.emisNo || formData.emisNumber} maxLength={10} onChange={(e) => handleValidatedChange('emisNo', e, 'numbers', formData, (obj) => setFormData({...obj, emisNumber: obj.emisNo}), 10)} placeholder="10 digits" />
              </div>
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input name="academicYear" value={formData.academicYear} onChange={handleInputChange} placeholder="2023-2024" />
              </div>
              <div className="space-y-2">
                <Label>Student Status</Label>
                <select name="studentStatus" value={formData.studentStatus} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Completed">Completed</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Left School">Left School</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* NEW SELECTION MODULE: Choose between RTE or General Group classification */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-900">Course Group Type *</Label>
                <label className="flex items-center gap-3 rounded-md border-2 border-purple-300 bg-purple-50/30 px-3 py-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isRTE}
                    onChange={handleRTEToggleChange}
                    className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-600"
                  />
                  <span>{formData.isRTE ? 'RTE Course Student' : 'General (Non-RTE) Student'}</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Parent Details */}
          <Card>
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center text-gray-700">
                <Users className="mr-2 h-5 w-5 text-orange-600" /> Parent Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Father Name</Label>
                <Input name="fatherName" value={formData.fatherName} onChange={(e) => handleValidatedChange('fatherName', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Father Mobile</Label>
                <Input name="fatherPhone" value={formData.fatherPhone} onChange={(e) => handleValidatedChange('fatherPhone', e, 'numbers', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Father Occupation</Label>
                <Input name="fatherOccupation" value={formData.fatherOccupation} onChange={(e) => handleValidatedChange('fatherOccupation', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Name</Label>
                <Input name="motherName" value={formData.motherName} onChange={(e) => handleValidatedChange('motherName', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Mobile</Label>
                <Input name="motherPhone" value={formData.motherPhone} onChange={(e) => handleValidatedChange('motherPhone', e, 'numbers', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Mother Occupation</Label>
                <Input name="motherOccupation" value={formData.motherOccupation} onChange={(e) => handleValidatedChange('motherOccupation', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input name="guardianName" value={formData.guardianName || formData.guardian} maxLength={100} onChange={(e) => handleValidatedChange('guardianName', e, 'letters', formData, (obj) => setFormData({...obj, guardian: obj.guardianName}), 100)} placeholder="Guardian name" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input name="whatsappNumber" value={formData.whatsappNumber} maxLength={10} onChange={(e) => handleValidatedChange('whatsappNumber', e, 'numbers', formData, setFormData, 10)} placeholder="10 digits" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" value={formData.city} onChange={(e) => handleValidatedChange('city', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input name="state" value={formData.state} onChange={(e) => handleValidatedChange('state', e, 'letters', formData, setFormData)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input name="pincode" value={formData.pincode} onChange={(e) => handleValidatedChange('pincode', e, 'numbers', formData, setFormData)} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Fee Details */}
        <div className="space-y-6">
          <Card className="border-orange-200 shadow-sm sticky top-6">
            <CardHeader className="bg-orange-50 border-b border-orange-100 pb-4">
              <CardTitle className="text-lg flex items-center text-orange-800">
                <DollarSign className="mr-2 h-5 w-5 text-orange-600" /> Fee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-2">
                <Label>Base Amount</Label>
                <Input type="number" name="baseFee" value={baseFeeAmount} disabled className="bg-gray-100 cursor-not-allowed" />
              </div>

              {currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? (
                <MultiSelectDropdown 
                  label="Charges"
                  options={chargesOptions}
                  selected={selectedCharges}
                  onChange={setSelectedCharges}
                  placeholder="Select optional charges..."
                />
              ) : null}

              {hasUniform && (
                <div className="border border-orange-100 rounded-lg p-4 bg-orange-50/20 space-y-4">
                  <h3 className="font-semibold text-sm text-orange-800 border-b border-orange-100 pb-1 flex items-center">
                    Uniform details
                  </h3>
                  
                  {/* Top Cloth */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Top Cloth</span>
                      <span className="text-gray-500 font-normal">Rate: ₹{topPrice}/m</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Length (Metre)</Label>
                        <Input 
                          type="number"
                          min="0" step="0.01"
                          placeholder="e.g., 2"
                          value={topLength}
                          onChange={(e) => handleTopLengthChange(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Total (₹)</Label>
                        <Input 
                          type="text"
                          value={topTotal.toFixed(2)}
                          disabled
                          className="bg-gray-100 cursor-not-allowed h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Cloth */}
                  <div className="space-y-3 pt-2 border-t border-orange-100">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Bottom Cloth</span>
                      <span className="text-gray-500 font-normal">Rate: ₹{bottomPrice}/m</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Length (Metre)</Label>
                        <Input 
                          type="number"
                          min="0" step="0.01"
                          placeholder="e.g., 2"
                          value={bottomLength}
                          onChange={(e) => handleBottomLengthChange(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Total (₹)</Label>
                        <Input 
                          type="text"
                          value={bottomTotal.toFixed(2)}
                          disabled
                          className="bg-gray-100 cursor-not-allowed h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-orange-800 pt-2 border-t border-orange-100">
                    <span>Uniform Total</span>
                    <span>₹ {uniformTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Fee Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6 space-y-3">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Fee Summary</h3>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base Amount</span>
                  <span>₹ {baseFeeAmount.toFixed(2)}</span>
                </div>
                
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Charges Breakdown</span>
                  
                  {/* Selected charges */}
                  {selectedCharges.map(catId => {
                    const cat = categories.find(c => c._id === catId);
                    if (!cat || cat.name.toLowerCase() === 'uniform') return null;
                    const feeConfig = defaultFees[catId];
                    const amt = typeof feeConfig === 'number' ? feeConfig : Number(feeConfig?.amount || 0);
                    return (
                      <div key={catId} className="flex justify-between text-xs text-gray-600 pl-2">
                        <span>{cat.name}</span>
                        <span>₹ {amt.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  
                  {/* Uniform charge */}
                  {hasUniform && (
                    <div className="flex justify-between text-xs text-gray-600 pl-2">
                      <span>Uniform</span>
                      <span>₹ {uniformTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedCharges.filter(catId => {
                    const cat = categories.find(c => c._id === catId);
                    return cat && cat.name.toLowerCase() !== 'uniform';
                  }).length === 0 && !hasUniform && (
                    <div className="text-xs text-gray-400 italic pl-2">No charges selected</div>
                  )}
                </div>

                <div className="flex justify-between text-sm font-semibold text-gray-700 border-t border-gray-200 pt-2">
                  <span>Charges Total</span>
                  <span>₹ {chargesTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-300 pt-3 mt-3">
                  <span>Grand Total</span>
                  <span className="text-orange-600">₹ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default StudentEdit;
