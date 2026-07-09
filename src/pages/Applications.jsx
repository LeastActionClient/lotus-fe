import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { FileText, Plus, CheckCircle, Trash2, Settings } from 'lucide-react';

const Applications = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [assignSection, setAssignSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [customIds, setCustomIds] = useState({ nextApplicationNo: '' });
  const [formData, setFormData] = useState({
    applicationNo: '', date: '', adminNo: '', emisNo: '',
    studentName: '', studentNameTamil: '',
    sex: '', religion: '', caste: '', specific: '', community: '',
    dob: '', dobInWords: '', aadharNo: '',
    applyingClass: '',
    fatherName: '', fatherQualification: '', fatherOccupation: '', fatherAnnualIncome: '', fatherPhone: '',
    motherName: '', motherQualification: '', motherOccupation: '', motherAnnualIncome: '', motherPhone: '',
    childStayingWith: '', parentsGuardianNameAddress: '',
    referenceNameAddress: '',
    motherTongue: '',
    previousSchool: '', healthIssues: '',
    bloodGroup: '', height: '', weight: '',
    address: '',
    feePaid: false
  });

  const handleNewApplication = async () => {
    setIsModalOpen(true);
    try {
      const res = await api.get('/applications/next-numbers');
      setFormData(prev => ({
        ...prev,
        applicationNo: res.data.applicationNo,
        adminNo: ''
      }));
    } catch (error) {
      console.error("Error fetching next numbers", error);
    }
  };

  const toggleFeePaid = async (id, currentStatus) => {
    try {
      await api.put(`/applications/${id}/fee-status`, { feePaid: !currentStatus });
      fetchApplications();
    } catch (error) {
      console.error("Error updating fee status", error);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (error) {
      console.error("Error fetching applications", error);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchCustomIds();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [applications.length]);

  const fetchCustomIds = async () => {
    try {
      const res = await api.get('/settings');
      setCustomIds({ 
        nextApplicationNo: res.data.nextApplicationNo || '' 
      });
    } catch(e) { console.error(e); }
  };

  const handleSaveCustomIds = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings', customIds);
      setIsCustomizeModalOpen(false);
      alert('Custom ID Formats saved successfully!');
    } catch(e) {
      alert('Error saving custom IDs');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    const englishNameFields = ['studentName', 'fatherName', 'motherName', 'religion', 'caste', 'specific', 'community'];
    if (englishNameFields.includes(name)) {
      processedValue = value.replace(/[^a-zA-Z\s.]/g, '');
    } else if (name === 'studentNameTamil') {
      processedValue = value.replace(/[0-9]/g, '');
    } else if (['aadharNo', 'fatherPhone', 'motherPhone'].includes(name)) {
      processedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', formData);
      setIsModalOpen(false);
      setFormData({
        applicationNo: '', date: '', adminNo: '', emisNo: '',
        studentName: '', studentNameTamil: '',
        sex: '', religion: '', caste: '', specific: '', community: '',
        dob: '', dobInWords: '', aadharNo: '',
        applyingClass: '',
        fatherName: '', fatherQualification: '', fatherOccupation: '', fatherAnnualIncome: '', fatherPhone: '',
        motherName: '', motherQualification: '', motherOccupation: '', motherAnnualIncome: '', motherPhone: '',
        childStayingWith: '', parentsGuardianNameAddress: '',
        referenceNameAddress: '',
        motherTongue: '',
        previousSchool: '', healthIssues: '',
        bloodGroup: '', height: '', weight: '',
        address: '',
        feePaid: false
      });
      fetchApplications();
    } catch (error) {
      console.error("Error creating application", error);
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (id) => {
    setSelectedAppId(id);
    setAssignSection('');
    setIsApproveModalOpen(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedAppId || !assignSection) return;
    
    setLoading(true);
    try {
      await api.put(`/applications/${selectedAppId}/approve`, { section: assignSection });
      setIsApproveModalOpen(false);
      fetchApplications();
    } catch (error) {
      console.error("Error approving application", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(applications.length / itemsPerPage));
  const paginatedApplications = applications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900  flex items-center">
            <FileText className="mr-3 text-orange-600" size={32} />
            Applications
          </h1>
          <p className="text-gray-500  mt-2">Manage student enrollment applications</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsCustomizeModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Customize ID Formats
          </Button>
          <Button onClick={handleNewApplication}>
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Father Mobile</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>App Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-32 text-gray-500">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-sm">{app.applicationId}</TableCell>
                    <TableCell className="font-medium">{app.studentName}</TableCell>
                    <TableCell>{app.applyingClass}</TableCell>
                    <TableCell>{app.fatherPhone}</TableCell>
                    <TableCell>{app.processedById?.username}</TableCell>
                    <TableCell>
                      <select 
                        value={app.feePaid ? "true" : "false"}
                        onChange={(e) => {
                          const isPaid = e.target.value === "true";
                          if(app.feePaid !== isPaid) toggleFeePaid(app.id, app.feePaid);
                        }}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors border-0 outline-none focus:ring-0 appearance-none text-center ${
                          app.feePaid ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        <option value="true" className="bg-white text-emerald-800">Paid</option>
                        <option value="false" className="bg-white text-red-800">Not Paid</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {app.status === 'PENDING' && (
                        <Button variant="outline" size="sm" onClick={() => openApproveModal(app.id)} className="text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      {currentUser.role === 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                          if(window.confirm('Are you sure you want to delete this application?')) {
                            try {
                              await api.delete(`/applications/${app.id}`);
                              fetchApplications();
                            } catch(e) { alert('Error deleting application'); }
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="KASTHURI NURSERY & PRIMARY SCHOOL APPLICATION FORM" className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Header Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
            <div className="space-y-2">
              <Label htmlFor="applicationNo">Application No.</Label>
              <Input id="applicationNo" name="applicationNo" value={formData.applicationNo} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNo">Admin No.</Label>
              <Input id="adminNo" name="adminNo" value={formData.adminNo} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emisNo">EMIS No.</Label>
              <Input id="emisNo" name="emisNo" value={formData.emisNo} onChange={handleInputChange} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <input 
              type="checkbox" 
              id="feePaid" 
              name="feePaid" 
              checked={formData.feePaid} 
              onChange={(e) => setFormData({...formData, feePaid: e.target.checked})} 
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
            />
            <Label htmlFor="feePaid" className="text-sm font-medium text-gray-700">Application Fee Paid</Label>
          </div>

          <h3 className="text-md font-semibold text-gray-700 uppercase tracking-wider">1. Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Name of the Child in English</Label>
              <Input id="studentName" name="studentName" value={formData.studentName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNameTamil">Name of the Child in Tamil</Label>
              <Input id="studentNameTamil" name="studentNameTamil" value={formData.studentNameTamil} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <select id="sex" name="sex" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={formData.sex} onChange={handleInputChange}>
                <option value="">Select...</option>
                <option value="Boy">Boy</option>
                <option value="Girl">Girl</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Input id="religion" name="religion" value={formData.religion} onChange={handleInputChange} pattern="^[a-zA-Z\s]+$" title="Only alphabets and spaces are allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caste">Caste</Label>
              <Input id="caste" name="caste" value={formData.caste} onChange={handleInputChange} pattern="^[a-zA-Z\s]+$" title="Only alphabets and spaces are allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specific">Specific</Label>
              <Input id="specific" name="specific" value={formData.specific || ''} onChange={handleInputChange} pattern="^[a-zA-Z\s]+$" title="Only alphabets and spaces are allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community">Community</Label>
              <Input id="community" name="community" value={formData.community} onChange={handleInputChange} pattern="^[a-zA-Z\s]+$" title="Only alphabets and spaces are allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input type="date" id="dob" name="dob" value={formData.dob} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dobInWords">Date of Birth In Words</Label>
              <Input id="dobInWords" name="dobInWords" value={formData.dobInWords} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadharNo">Aadhar No.</Label>
              <Input id="aadharNo" name="aadharNo" value={formData.aadharNo} onChange={handleInputChange} pattern="^\d{12}$" title="Aadhar number must be exactly 12 digits" maxLength="12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applyingClass">Admission for</Label>
              <select id="applyingClass" name="applyingClass" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600" value={formData.applyingClass} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Pre KG">Pre KG</option>
                <option value="LKG">L.K.G.</option>
                <option value="UKG">U.K.G</option>
                <option value="1">I STD</option>
                <option value="2">II STD</option>
                <option value="3">III STD</option>
                <option value="4">IV STD</option>
                <option value="5">V STD</option>
              </select>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-700 uppercase tracking-wider mt-6 border-t pt-4">2. Parents Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Father</h4>
              <div className="space-y-2">
                <Label htmlFor="fatherName">Name</Label>
                <Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherQualification">Qualification</Label>
                <Input id="fatherQualification" name="fatherQualification" value={formData.fatherQualification} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherOccupation">Occupation</Label>
                <Input id="fatherOccupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherAnnualIncome">Annual Income</Label>
                <Input id="fatherAnnualIncome" name="fatherAnnualIncome" type="number" min="0" value={formData.fatherAnnualIncome} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherPhone">Cell No. (Father)</Label>
                <Input id="fatherPhone" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} pattern="^\d{10}$" title="Phone number must be exactly 10 digits" maxLength="10" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Mother</h4>
              <div className="space-y-2">
                <Label htmlFor="motherName">Name</Label>
                <Input id="motherName" name="motherName" value={formData.motherName} onChange={handleInputChange} pattern="^[a-zA-Z\s.]+$" title="Only alphabets, spaces, and dots are allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherQualification">Qualification</Label>
                <Input id="motherQualification" name="motherQualification" value={formData.motherQualification} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherOccupation">Occupation</Label>
                <Input id="motherOccupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherAnnualIncome">Annual Income</Label>
                <Input id="motherAnnualIncome" name="motherAnnualIncome" type="number" min="0" value={formData.motherAnnualIncome} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherPhone">Cell No. (Mother)</Label>
                <Input id="motherPhone" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} pattern="^\d{10}$" title="Phone number must be exactly 10 digits" maxLength="10" />
              </div>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-700 uppercase tracking-wider mt-6 border-t pt-4">3. Other Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childStayingWith">Child Staying with (Parents/Guardian)</Label>
              <Input id="childStayingWith" name="childStayingWith" value={formData.childStayingWith} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentsGuardianNameAddress">Parents / Guardian Name and Address</Label>
              <Input id="parentsGuardianNameAddress" name="parentsGuardianNameAddress" value={formData.parentsGuardianNameAddress} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNameAddress">Any one Reference Name and Address</Label>
              <Input id="referenceNameAddress" name="referenceNameAddress" value={formData.referenceNameAddress} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherTongue">Mother Tongue</Label>
              <Input id="motherTongue" name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previousSchool">Name of the School last attended</Label>
              <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthIssues">Any special Mention of child's health</Label>
              <Input id="healthIssues" name="healthIssues" value={formData.healthIssues} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Input id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="height">Height (Cm.)</Label>
                <Input id="height" name="height" type="number" step="0.01" min="0" value={formData.height} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="weight">Weight (Kg.)</Label>
                <Input id="weight" name="weight" type="number" step="0.01" min="0" value={formData.weight} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Full Permanent Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Backup address field if needed" />
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-700 uppercase tracking-wider mt-6 border-t pt-4 flex justify-between items-center">
            4. Brother's & Sister's Details
            <Button type="button" variant="outline" size="sm" onClick={() => {
              setFormData(prev => ({
                ...prev,
                siblings: [...(prev.siblings || []), { name: '', schoolName: '', dob: '', qualification: '', employed: '' }]
              }));
            }}>
              <Plus className="h-4 w-4 mr-1" /> Add Sibling
            </Button>
          </h3>
          <div className="space-y-4">
            {(formData.siblings || []).map((sibling, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-gray-50 ">
                <div className="space-y-1 col-span-3">
                  <Label className="text-xs">Name</Label>
                  <Input value={sibling.name} onChange={(e) => {
                    const newSiblings = [...formData.siblings];
                    newSiblings[index].name = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                    setFormData({ ...formData, siblings: newSiblings });
                  }} />
                </div>
                <div className="space-y-1 col-span-3">
                  <Label className="text-xs">School Name</Label>
                  <Input value={sibling.schoolName} onChange={(e) => {
                    const newSiblings = [...formData.siblings];
                    newSiblings[index].schoolName = e.target.value;
                    setFormData({ ...formData, siblings: newSiblings });
                  }} />
                </div>
                <div className="space-y-1 col-span-3">
                  <Label className="text-xs">D.O.B</Label>
                  <Input type="date" value={sibling.dob} onChange={(e) => {
                    const newSiblings = [...formData.siblings];
                    newSiblings[index].dob = e.target.value;
                    setFormData({ ...formData, siblings: newSiblings });
                  }} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Qualification</Label>
                  <Input value={sibling.qualification} onChange={(e) => {
                    const newSiblings = [...formData.siblings];
                    newSiblings[index].qualification = e.target.value;
                    setFormData({ ...formData, siblings: newSiblings });
                  }} />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs">Employed</Label>
                  <div className="flex gap-2">
                    <Input value={sibling.employed} onChange={(e) => {
                      const newSiblings = [...formData.siblings];
                      newSiblings[index].employed = e.target.value;
                      setFormData({ ...formData, siblings: newSiblings });
                    }} />
                    <Button type="button" variant="ghost" className="px-2 text-red-500 hover:text-red-700" onClick={() => {
                      const newSiblings = formData.siblings.filter((_, i) => i !== index);
                      setFormData({ ...formData, siblings: newSiblings });
                    }}>
                      &times;
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!formData.siblings || formData.siblings.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-2">No sibling details added.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Application">
        <form onSubmit={handleApprove} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="assignSection">Assign Section</Label>
            <Input 
              id="assignSection" 
              name="assignSection" 
              value={assignSection} 
              onChange={(e) => setAssignSection(e.target.value)} 
              required 
              placeholder="e.g., A" 
            />
            <p className="text-sm text-gray-500">Please assign a section to complete the enrollment.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200  mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} title="Customize ID Formats">
        <form onSubmit={handleSaveCustomIds} className="space-y-4 pt-2">
            <p className="text-sm text-gray-500 mb-4">Set the starting prefix or full number for the next application. The system will auto-increment from this value.</p>
          <div className="space-y-2">
            <Label htmlFor="nextApplicationNo">Next Application No.</Label>
            <Input id="nextApplicationNo" value={customIds.nextApplicationNo} onChange={(e) => setCustomIds({...customIds, nextApplicationNo: e.target.value})} placeholder="e.g. APP-2027-001" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsCustomizeModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Formats</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Applications;
