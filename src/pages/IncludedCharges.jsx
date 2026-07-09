import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { FileCheck, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link } from 'react-router-dom';

const IncludedCharges = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [charges, setCharges] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);

  // Search, Pagination, Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    try {
      const res = await api.get('/included-charges');
      setCharges(res.data);
    } catch (error) {
      console.error("Error fetching included charges", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, amount: parseFloat(amount), description, status };
      if (editingId) {
        await api.put(`/included-charges/${editingId}`, payload);
      } else {
        await api.post('/included-charges', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchCharges();
    } catch (error) {
      console.error("Error saving charge", error);
      alert(error.response?.data?.error || "Error saving included charge.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this Included Charge?')) {
      try {
        await api.delete(`/included-charges/${id}`);
        fetchCharges();
      } catch(error) {
        alert(error.response?.data?.error || "Error deleting charge.");
      }
    }
  };

  const openEdit = (charge) => {
    setEditingId(charge.id);
    setName(charge.name);
    setAmount(charge.amount);
    setDescription(charge.description || '');
    setStatus(charge.status);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setDescription('');
    setStatus(true);
  };

  const filteredCharges = charges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.amount.toString().includes(searchTerm)
  );
  const totalPages = Math.max(1, Math.ceil(filteredCharges.length / itemsPerPage));
  const paginatedCharges = filteredCharges.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
            <FileCheck className="mr-3 text-orange-600" size={32} />
            Included Charges
          </h1>
          <p className="text-gray-500 mt-2">Manage additional included charges</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input 
            placeholder="Search charges..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Included Charge
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200">
        <Link 
          to="/dashboard/fee-categories" 
          className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm"
        >
          Fee Categories
        </Link>
        <Link 
          to="/dashboard/fee-categories/included-charges" 
          className="border-orange-500 text-orange-600 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm"
        >
          Included Charges
        </Link>
        <Link 
          to="/dashboard/fee-categories/activities" 
          className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm"
        >
          Activities
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-gray-500">
                    No included charges found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="font-medium text-gray-900">{charge.name}</TableCell>
                    <TableCell>₹ {charge.amount}</TableCell>
                    <TableCell>{charge.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        charge.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {charge.status ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(charge.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{charge.createdBy?.username || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(charge)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(charge.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Included Charge" : "Create Included Charge"}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Included Charge Name *</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Library Fee"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input 
              type="number"
              min="0"
              step="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select 
              value={status ? 'true' : 'false'}
              onChange={(e) => setStatus(e.target.value === 'true')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncludedCharges;
