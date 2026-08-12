import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { ShieldAlert, Plus, ShieldOff, ShieldCheck, Trash2, Eye, EyeOff, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { toastError } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [historyPage, setHistoryPage] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'ADMIN'
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const confirm = useConfirm();

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/users');
      setAdmins(res.data);
    } catch (error) {
      console.error("Error fetching admins", error);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/users/logs');
      setLogs(res.data.filter(log => log.action === 'LOGGED_IN'));
    } catch (error) {
      console.error("Error fetching logs", error);
    }
  };

  const openHistory = async () => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      await fetchLogs();
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const totalPages = Math.max(1, Math.ceil(admins.length / itemsPerPage));
  const paginatedAdmins = admins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const historyPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const paginatedLogs = logs.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [admins.length]);

  useEffect(() => {
    setHistoryPage(1);
  }, [logs.length, isHistoryModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', formData);
      setIsModalOpen(false);
      setFormData({ username: '', password: '', role: 'ADMIN' });
      fetchAdmins();
    } catch (error) {
      console.error("Error creating admin", error);
      toastError(error.response?.data?.error || "Error creating admin");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    setStatusLoadingId(id);
    try {
      await api.put(`/users/${id}`, { isActive: !currentStatus });
      fetchAdmins();
    } catch (error) {
      console.error("Error toggling status", error);
    } finally {
      setStatusLoadingId(null);
    }
  };

  const deleteAdmin = async (id) => {
    const accepted = await confirm({
      title: 'Delete Admin',
      description: 'Are you sure you want to delete this admin? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) {
      return;
    }

    setDeleteLoadingId(id);
    try {
      await api.delete(`/users/${id}`);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin", error);
      toastError(error.response?.data?.error || "Error deleting admin");
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
            Manage Admins
          </h1>
          <p className="text-gray-500  mt-2">Super Admin controls for system access</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openHistory} loading={historyLoading} loadingText="Loading...">
            <History className="mr-2 h-4 w-4" /> Login History
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Admin
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Online Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                    No admins found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdmins.map((admin) => {
                  const lastActiveDate = admin.lastActivity ? new Date(admin.lastActivity) : new Date(admin.createdAt);
                  const hasActivity = admin.lastActivity && Math.abs(lastActiveDate.getTime() - new Date(admin.createdAt).getTime()) > 1000;
                  const isOnline = hasActivity ? (new Date().getTime() - lastActiveDate.getTime()) < 300000 : false;

                  return (
                  <TableRow key={admin._id || admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        admin.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' : 'bg-orange-600 text-orange-100'
                      }`}>
                        {admin.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {isOnline ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                            <span className="w-2 h-2 mr-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 w-fit">
                            <span className="w-2 h-2 mr-1.5 bg-gray-400 rounded-full"></span>
                            Offline
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {admin.lastLogin 
                            ? `Logged in: ${new Date(admin.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` 
                            : hasActivity 
                              ? `Last seen: ${lastActiveDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` 
                              : 'Never logged in'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {admin.role !== 'SUPER_ADMIN' && (
                        <Button 
                          variant={admin.isActive ? "danger" : "secondary"} 
                          size="sm"
                          onClick={() => toggleStatus(admin._id || admin.id, admin.isActive)}
                          loading={statusLoadingId === (admin._id || admin.id)}
                          loadingText="Updating..."
                        >
                          {admin.isActive ? <><ShieldOff className="h-4 w-4 mr-2"/> Disable</> : <><ShieldCheck className="h-4 w-4 mr-2"/> Enable</>}
                        </Button>
                      )}
                      {currentUser.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteAdmin(admin._id || admin.id)}
                          loading={deleteLoadingId === (admin._id || admin.id)}
                          loadingText="Deleting..."
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Admin">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Initial Password</Label>
            <div className="relative">
              <input 
                id="password" 
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 pr-10"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" loading={loading} loadingText="Creating...">
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Admin Login History" className="max-w-2xl">
        <div className="max-h-[60vh] overflow-y-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Login Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24 text-gray-500">
                    No login history found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userId?.username || log.user?.username || 'Unknown'}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={historyPage} totalPages={historyPages} onPageChange={setHistoryPage} className="mt-4" />
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
          <Button onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Admins;
