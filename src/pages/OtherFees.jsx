import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { FileCheck, Plus, Trash2, Edit, Package, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { Link } from 'react-router-dom';
import { toastError } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';

const OtherFees = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const confirm = useConfirm();
  const [charges, setCharges] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [stockUnit, setStockUnit] = useState('pcs');
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [stockHistoryOpen, setStockHistoryOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [adjustForm, setAdjustForm] = useState({ type: 'IN', quantity: '', reason: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [stockAdjustLoading, setStockAdjustLoading] = useState(false);
  const [historyLoadingId, setHistoryLoadingId] = useState(null);

  // Search, Pagination, Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchCharges();
  }, []);

  const getChargeId = (charge) => charge?._id || charge?.id;

  const fetchCharges = async () => {
    try {
      const res = await api.get('/included-charges');
      setCharges(res.data);
    } catch (error) {
      console.error("Error fetching Other Fees", error);
    }
  };

  const openStockAdjust = (charge) => {
    setSelectedCharge(charge);
    setAdjustForm({ type: 'IN', quantity: '', reason: '' });
    setStockAdjustOpen(true);
  };

  const openStockHistory = async (charge) => {
    setSelectedCharge(charge);
    const chargeId = getChargeId(charge);
    setHistoryLoadingId(chargeId);
    try {
      const res = await api.get(`/included-charges/${chargeId}/stock-transactions`);
      setStockTransactions(res.data);
      setStockHistoryOpen(true);
    } catch (error) {
      console.error('Error fetching stock history', error);
      toastError('Failed to load stock history');
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        name,
        amount: parseFloat(amount),
        description,
        status,
        stockQuantity: Number(stockQuantity || 0),
        lowStockThreshold: Number(lowStockThreshold || 5),
        stockUnit
      };
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
      toastError(error.response?.data?.error || "Error saving other fee.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const accepted = await confirm({
      title: 'Delete other fee',
      description: 'Are you sure you want to delete this other fee?',
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) {
      return;
    }

    setDeleteLoadingId(id);
    try {
      await api.delete(`/included-charges/${id}`);
      fetchCharges();
    } catch(error) {
      toastError(error.response?.data?.error || "Error deleting charge.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openEdit = (charge) => {
    setEditingId(getChargeId(charge));
    setName(charge.name);
    setAmount(charge.amount);
    setDescription(charge.description || '');
    setStatus(charge.status);
    setStockQuantity(charge.stockQuantity ?? 0);
    setLowStockThreshold(charge.lowStockThreshold ?? 5);
    setStockUnit(charge.stockUnit || 'pcs');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setDescription('');
    setStatus(true);
    setStockQuantity('');
    setLowStockThreshold('5');
    setStockUnit('pcs');
  };

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    if (!selectedCharge) return;
    setStockAdjustLoading(true);
    try {
      const chargeId = getChargeId(selectedCharge);
      await api.post(`/included-charges/${chargeId}/stock`, {
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason
      });
      setStockAdjustOpen(false);
      fetchCharges();
    } catch (error) {
      console.error('Error adjusting stock', error);
      toastError(error.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setStockAdjustLoading(false);
    }
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
            Other Fees
          </h1>
          <p className="text-gray-500 mt-2">Manage additional Other Fees</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input 
            placeholder="Search charges..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add other fee
          </Button>
        </div>
      </div>



      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stock</TableHead>
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
                  <TableCell colSpan={8} className="text-center h-32 text-gray-500">
                    No Other Fees found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCharges.map((charge) => (
                  <TableRow key={getChargeId(charge)}>
                    <TableCell className="font-medium text-gray-900">{charge.name}</TableCell>
                    <TableCell>₹ {charge.amount}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${
                          (charge.stockQuantity || 0) <= 0
                            ? 'bg-red-100 text-red-800'
                            : (charge.stockQuantity || 0) <= (charge.lowStockThreshold ?? 5)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          <Package className="mr-1 h-3 w-3" />
                          {charge.stockQuantity || 0} {charge.stockUnit || 'pcs'}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-1">
                          Low stock at {charge.lowStockThreshold ?? 5}
                        </span>
                      </div>
                    </TableCell>
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
                      <Button variant="ghost" size="sm" onClick={() => openStockAdjust(charge)} title="Adjust stock">
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStockHistory(charge)}
                        title="Stock history"
                        loading={historyLoadingId === getChargeId(charge)}
                        loadingText="Loading..."
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(getChargeId(charge))}
                        loading={deleteLoadingId === getChargeId(charge)}
                        loadingText="Deleting..."
                      >
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit other fee" : "Create other fee"}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>other fee Name *</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label>Stock Unit</Label>
              <Input
                value={stockUnit}
                onChange={(e) => setStockUnit(e.target.value)}
                placeholder="pcs, kg, packets"
              />
            </div>
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
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saveLoading}>Cancel</Button>
            <Button type="submit" loading={saveLoading} loadingText="Saving...">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={stockAdjustOpen} onClose={() => setStockAdjustOpen(false)} title={`Adjust Stock${selectedCharge ? ` - ${selectedCharge.name}` : ''}`}>
        <form onSubmit={handleStockAdjust} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
              value={adjustForm.type}
              onChange={(e) => setAdjustForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="RETURN">Return to Stock</option>
              <option value="ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setStockAdjustOpen(false)} disabled={stockAdjustLoading}>Cancel</Button>
            <Button type="submit" loading={stockAdjustLoading} loadingText="Saving...">Save Adjustment</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={stockHistoryOpen} onClose={() => setStockHistoryOpen(false)} title={`Stock History${selectedCharge ? ` - ${selectedCharge.name}` : ''}`} className="max-w-3xl">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Prev</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                    No stock history found.
                  </TableCell>
                </TableRow>
              ) : (
                stockTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.quantity}</TableCell>
                    <TableCell>{tx.previousStock}</TableCell>
                    <TableCell>{tx.newStock}</TableCell>
                    <TableCell>{tx.reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Modal>
    </div>
  );
};

export default OtherFees;
