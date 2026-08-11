import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, MoreVertical, Edit, Trash2, IdCard, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { toastError } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    teacherId: '',
    name: '',
    designation: '',
    phoneNumber: '',
    address: ''
  });
  const [editId, setEditId] = useState(null);

  const itemsPerPage = 10;
  const confirm = useConfirm();

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
    } catch (error) {
      console.error("Error fetching teachers", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const totalPages = Math.max(1, Math.ceil(teachers.length / itemsPerPage));
  const paginatedTeachers = teachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [teachers.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedPhotoUrl = formData.photo || '';

      if (photoFile) {
        const uploadData = new FormData();
        uploadData.append('photo', photoFile);
        
        const uploadRes = await api.post('/teachers/upload-photo', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedPhotoUrl = uploadRes.data.photoUrl;
      }

      const dataToSave = { ...formData, photo: uploadedPhotoUrl };

      if (editId) {
        await api.put(`/teachers/${editId}`, dataToSave);
      } else {
        await api.post('/teachers', dataToSave);
      }
      
      setIsModalOpen(false);
      setFormData({ teacherId: '', name: '', designation: '', phoneNumber: '', address: '' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditId(null);
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher", error);
      let errMsg = "Error saving teacher";
      if (error.response && error.response.data && error.response.data.error) {
        errMsg = error.response.data.error;
      } else if (error.message) {
        errMsg = error.message;
      }
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({ ...formData, photo: '' });
  };

  const handleEdit = (teacher) => {
    setFormData({
      teacherId: teacher.teacherId,
      name: teacher.name,
      designation: teacher.designation,
      phoneNumber: teacher.phoneNumber,
      address: teacher.address,
      photo: teacher.photo || ''
    });
    setPhotoPreview(teacher.photo || null);
    setPhotoFile(null);
    setEditId(teacher._id);
    setIsModalOpen(true);
  };

  const deleteTeacher = async (id) => {
    const accepted = await confirm({
      title: 'Delete Teacher',
      description: 'Are you sure you want to delete this teacher? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) {
      return;
    }

    setDeleteLoadingId(id);
    try {
      await api.delete(`/teachers/${id}`);
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher", error);
      toastError(error.response?.data?.error || "Error deleting teacher");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            Teacher Directory
          </h1>
          <p className="text-gray-500 mt-2">Manage teacher records and details</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => {
            setFormData({ teacherId: '', name: '', designation: '', phoneNumber: '', address: '', photo: '' });
            setPhotoFile(null);
            setPhotoPreview(null);
            setEditId(null);
            setIsModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                    No teachers found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTeachers.map((teacher) => (
                  <TableRow 
                    key={teacher._id}
                    className="relative group cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      {teacher.photo ? (
                        <img src={teacher.photo} alt={teacher.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-xs">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{teacher.teacherId}</TableCell>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.designation}</TableCell>
                    <TableCell>{teacher.phoneNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={teacher.address}>
                      {teacher.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(teacher); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTeacher(teacher._id); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                          disabled={deleteLoadingId === teacher._id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Teacher" : "Create New Teacher"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase font-medium">Upload</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {photoPreview && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm hover:bg-red-200 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input 
                id="teacherId" 
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input 
                id="designation" 
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input 
                id="phoneNumber" 
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading} loadingText="Saving...">
              {editId ? "Save Changes" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teachers;
