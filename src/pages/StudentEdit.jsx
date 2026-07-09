import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { ArrowLeft, User, BookOpen, Users, DollarSign, Save } from 'lucide-react';
import { MultiSelectDropdown } from '../components/ui/MultiSelectDropdown';
import { isRccStudent } from '../utils/studentCategory';

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  
  // Master lists for dropdowns
  const [availableCharges, setAvailableCharges] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);

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
    nationality: '',
    email: '',
    currentClass: '',
    section: '',
    rollNumber: '',
    admissionDate: '',
    academicYear: '',
    studentStatus: 'Active',
    isRcc: false,
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
    guardian: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    baseFee: 0,
  });

  const [selectedCharges, setSelectedCharges] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, chargesRes, activitiesRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get('/included-charges'),
        api.get('/activities')
      ]);

      const student = studentRes.data;
      const charges = chargesRes.data;
      const activities = activitiesRes.data;

      setAvailableCharges(charges);
      setAvailableActivities(activities);

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
        nationality: student.nationality || '',
        email: student.email || '',
        currentClass: student.currentClass || '',
        section: student.section || '',
        rollNumber: student.rollNumber || '',
        admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
        academicYear: student.academicYear || '',
        studentStatus: student.studentStatus || 'Active',
        isRcc: isRccStudent(student),
        fatherName: student.fatherName || '',
        fatherPhone: student.fatherPhone || '',
        fatherOccupation: student.fatherOccupation || '',
        motherName: student.motherName || '',
        motherPhone: student.motherPhone || '',
        motherOccupation: student.motherOccupation || '',
        guardian: student.guardian || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        pincode: student.pincode || '',
        baseFee: (() => {
          if (student.baseFee && student.baseFee > 0) return student.baseFee;
          if (student.studentFees && student.studentFees.length > 0) {
            const baseFees = student.studentFees.filter(f => 
              !f.feeCategory?.name?.toLowerCase().includes('included') && 
              !f.feeCategory?.name?.toLowerCase().includes('activities')
            );
            return baseFees.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
          }
          return 0;
        })(),
      });

      setSelectedCharges(student.includedCharges?.map(c => c.includedChargeId?._id || c.includedChargeId) || []);
      setSelectedActivities(student.activities?.map(a => a.activityId?._id || a.activityId) || []);

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

  const handleRccToggleChange = (e) => {
    setFormData(prev => ({ ...prev, isRcc: e.target.checked }));
  };

  // Calculations
  const includedChargesTotal = selectedCharges.reduce((sum, chargeId) => {
    const charge = availableCharges.find(c => (c._id || c.id) === chargeId);
    return sum + (charge ? charge.amount : 0);
  }, 0);

  const activitiesTotal = selectedActivities.reduce((sum, activityId) => {
    const activity = availableActivities.find(a => (a._id || a.id) === activityId);
    return sum + (activity ? activity.amount : 0);
  }, 0);

  const grandTotal = Number(formData.baseFee || 0) + includedChargesTotal + activitiesTotal;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        rcc: formData.isRcc ? 'RCC' : 'General',
        baseFee: Number(formData.baseFee),
        includedChargesTotal,
        activitiesTotal,
        grandTotal,
        includedChargesIds: selectedCharges,
        activitiesIds: selectedActivities
      };

      await api.put(`/students/${id}`, payload);
      alert("Student updated successfully!");
      navigate('/dashboard/students');
    } catch (error) {
      console.error("Error updating student", error);
      alert("Error saving student data.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading student details...</div>;

  const chargeOptions = availableCharges.filter(c => c.status !== false).map(c => ({ value: c._id || c.id, label: `${c.name} (₹${c.amount})` }));
  const activityOptions = availableActivities.filter(a => a.status !== false).map(a => ({ value: a._id || a.id, label: `${a.name} (₹${a.amount})` }));

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
                <Input name="admissionNumber" value={formData.admissionNumber} onChange={handleInputChange} disabled />
              </div>
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input name="studentName" value={formData.studentName} onChange={handleInputChange} required />
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
                <Input name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} placeholder="e.g. O+" />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar Number</Label>
                <Input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Input name="religion" value={formData.religion} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Community</Label>
                <Input name="community" value={formData.community} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input name="nationality" value={formData.nationality} onChange={handleInputChange} />
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

              {/* NEW SELECTION MODULE: Choose between RCC or General Group classification */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-900">Course Group Type *</Label>
                <label className="flex items-center gap-3 rounded-md border-2 border-purple-300 bg-purple-50/30 px-3 py-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isRcc}
                    onChange={handleRccToggleChange}
                    className="h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-600"
                  />
                  <span>{formData.isRcc ? 'RCC Course Student' : 'General (Non-RCC) Student'}</span>
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
                <Input name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Father Mobile</Label>
                <Input name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Father Occupation</Label>
                <Input name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Mother Name</Label>
                <Input name="motherName" value={formData.motherName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Mother Mobile</Label>
                <Input name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Mother Occupation</Label>
                <Input name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" value={formData.city} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input name="state" value={formData.state} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input name="pincode" value={formData.pincode} onChange={handleInputChange} />
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
                <Label>Base Fee Amount</Label>
                <Input type="number" min="0" name="baseFee" value={formData.baseFee} onChange={handleInputChange} />
              </div>

              {currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? (
                <>
                  <MultiSelectDropdown 
                    label="Included Charges"
                    options={chargeOptions}
                    selected={selectedCharges}
                    onChange={setSelectedCharges}
                    placeholder="Search charges..."
                  />

                  <MultiSelectDropdown 
                    label="Activities"
                    options={activityOptions}
                    selected={selectedActivities}
                    onChange={setSelectedActivities}
                    placeholder="Search activities..."
                  />
                </>
              ) : null}

              {/* Fee Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6 space-y-3">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Fee Summary</h3>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base Fee</span>
                  <span>₹ {Number(formData.baseFee || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Included Charges</span>
                  <span>₹ {includedChargesTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Activities</span>
                  <span>₹ {activitiesTotal.toFixed(2)}</span>
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
