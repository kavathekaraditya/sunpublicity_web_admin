import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword, deleteUser } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Users, Search, Edit2, Trash2, Plus, X, UserCheck, UserX, Briefcase, Mail, ClipboardList } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWorkers } from '../hooks/useFirestore';

const ManageWorkers = () => {
    const { workers, loading: workersLoading, refetch: fetchWorkers } = useWorkers(true); // Real-time updates
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        active: true,
    });
    const [loadingAction, setLoadingAction] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Task assignment state
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskFormData, setTaskFormData] = useState({
        location: '',
        description: '',
        workerId: '',
    });

    useEffect(() => {
        if (workers) {
            const filtered = workers.filter(worker =>
                worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredWorkers(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, workers]);

    // Pagination
    const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
    const paginatedWorkers = filteredWorkers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name || '',
            email: worker.email || '',
            password: '', // Don't populate password when editing
            active: worker.active !== false,
        });
        setShowModal(true);
    };

    const handleDelete = async (workerId) => {
        if (!window.confirm('Are you sure you want to delete this worker account? This will also delete their authentication account.')) return;

        try {
            // Note: Deleting the auth user requires admin SDK or the user to be signed in
            // For now, we'll just delete the Firestore document
            // You may need to implement a Cloud Function to delete the auth user
            await deleteDoc(doc(db, 'workers', workerId));
            alert('Worker account deleted successfully. Note: Authentication account may need to be deleted separately.');
        } catch (error) {
            console.error('Error deleting worker:', error);
            alert('Failed to delete worker: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoadingAction(true);
            if (editingWorker) {
                // Update existing worker - only non-sensitive data in Firestore
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    active: formData.active,
                    updatedAt: serverTimestamp(),
                };
                
                await updateDoc(doc(db, 'workers', editingWorker.id), updateData);
                
                // Note: Updating password requires the user to be signed in
                // You may need to implement a Cloud Function or password reset email
                if (formData.password) {
                    alert('Worker updated successfully. Note: Password updates require a Cloud Function or password reset email.');
                } else {
                    alert('Worker updated successfully');
                }
            } else {
                // Create new worker with Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
                
                const uid = userCredential.user.uid;
                
                // Store only non-sensitive data in Firestore using Auth UID as document ID
                await setDoc(doc(db, 'workers', uid), {
                    name: formData.name,
                    email: formData.email,
                    active: formData.active,
                    createdAt: serverTimestamp(),
                    role: 'worker'
                });
                
                alert('Worker account created successfully with authentication');
            }
            setShowModal(false);
            setEditingWorker(null);
            setFormData({ name: '', email: '', password: '', active: true });
        } catch (error) {
            console.error('Error saving worker:', error);
            let errorMessage = 'Failed to save worker info';
            
            // Handle specific Firebase Auth errors
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            setLoadingAction(false);
        }
    };

    const toggleWorkerStatus = async (worker) => {
        try {
            await updateDoc(doc(db, 'workers', worker.id), {
                active: !worker.active,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating worker status:', error);
            alert('Failed to update worker status');
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();

        if (!taskFormData.workerId) {
            alert('Please select a worker');
            return;
        }

        try {
            setLoadingAction(true);
            
            // Find the selected worker
            const selectedWorker = workers.find(w => w.id === taskFormData.workerId);
            
            // Create task as a sub-collection inside the worker document
            // Path: workers/{workerId}/tasks/{taskId}
            await addDoc(collection(db, 'workers', taskFormData.workerId, 'tasks'), {
                location: taskFormData.location,
                taskDescription: taskFormData.description,
                assignedBy: 'admin', // You can replace this with actual admin name/email if available
                status: 'assigned',
                createdAt: serverTimestamp(),
            });

            alert('Task assigned successfully to ' + (selectedWorker?.name || 'worker'));
            setShowTaskModal(false);
            setTaskFormData({ location: '', description: '', workerId: '' });
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Failed to assign task: ' + error.message);
        } finally {
            setLoadingAction(false);
        }
    };

    if (workersLoading && workers.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Briefcase className="w-8 h-8 mr-3 text-primary-600" />
                        Manage Workers
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create and manage worker accounts
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setTaskFormData({ location: '', description: '', workerId: '' });
                            setShowTaskModal(true);
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <ClipboardList className="w-5 h-5" />
                        <span>Assign Task</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingWorker(null);
                            setFormData({ name: '', email: '', password: '', active: true });
                            setShowModal(true);
                        }}
                        className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Worker</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </Card>

            {/* Workers Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Info</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedWorkers.length > 0 ? (
                                paginatedWorkers.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                            {worker.name || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex flex-col space-y-1">
                                                {worker.email && (
                                                    <div className="flex items-center space-x-2">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{worker.email}</span>
                                                    </div>
                                                )}
                                                {!worker.email && <span>-</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => toggleWorkerStatus(worker)}
                                                className={`flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${worker.active !== false
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}
                                            >
                                                {worker.active !== false ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                                <span>{worker.active !== false ? 'Active' : 'Inactive'}</span>
                                            </button>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(worker)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit worker"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(worker.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete worker"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                                        No workers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    required
                                    disabled={editingWorker}
                                />
                                {editingWorker && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Email cannot be changed after account creation
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password {editingWorker ? '(Use password reset to change)' : ''}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    required={!editingWorker}
                                    disabled={editingWorker}
                                    placeholder={editingWorker ? 'Password cannot be changed here' : 'Minimum 6 characters'}
                                    minLength={6}
                                />
                                {editingWorker && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Password changes require a password reset email
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Active Account
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingAction}
                                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loadingAction ? (editingWorker ? 'Updating...' : 'Adding...') : (editingWorker ? 'Update' : 'Add')}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Assign Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Assign Task to Worker
                            </h2>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleTaskSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={taskFormData.location}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter task location"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Task Description
                                </label>
                                <textarea
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe the task..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select Worker
                                </label>
                                <select
                                    value={taskFormData.workerId}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, workerId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">-- Select a worker --</option>
                                    {workers
                                        .filter(worker => worker.active !== false)
                                        .map((worker) => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.name} ({worker.email})
                                            </option>
                                        ))}
                                </select>
                                {workers.filter(w => w.active !== false).length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        No active workers available. Please add workers first.
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingAction || workers.filter(w => w.active !== false).length === 0}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loadingAction ? 'Assigning...' : 'Assign Task'}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ManageWorkers;
