import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Users, Calendar, Plus, Trash2, Edit, CheckCircle, XCircle, DollarSign, User } from 'lucide-react';
import { Employee } from '../types';

type Tab = 'employees' | 'attendance';

export default function EmployeeManagement() {
    const { employees, addEmployee, updateEmployee, deleteEmployee, markAttendance, attendance } = useStore();
    const [activeTab, setActiveTab] = useState<Tab>('employees');

    // Employee Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        position: '',
        salaryPerMonth: ''
    });

    // Attendance State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Employee Handlers ---

    const handleEdit = (emp: Employee) => {
        setFormData({
            name: emp.name,
            phone: emp.phone,
            position: emp.position,
            salaryPerMonth: emp.salaryPerMonth.toString()
        });
        setEditingId(emp.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            await deleteEmployee(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const salary = parseFloat(formData.salaryPerMonth);
        if (!formData.name || isNaN(salary)) return;

        const payload = {
            name: formData.name,
            phone: formData.phone,
            position: formData.position,
            salaryPerMonth: salary
        };

        if (editingId) {
            await updateEmployee(editingId, payload);
        } else {
            await addEmployee(payload);
        }

        setFormData({ name: '', phone: '', position: '', salaryPerMonth: '' });
        setEditingId(null);
        setIsFormOpen(false);
    };

    // --- Attendance Handlers ---

    const getAttendanceForDate = (empId: string) => {
        // Convert selectedDate string to timestamp range or just match day
        // For simplicity, let's assume we store midnight timestamp in DB and compare
        const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
        return attendance.find(a => a.employeeId === empId && a.date === startOfDay);
    };

    const handleMarkAttendance = async (emp: Employee, status: 'present' | 'absent', type: 'full' | 'half' = 'full') => {
        const dateTimestamp = new Date(selectedDate).setHours(0, 0, 0, 0);

        // Check if already marked
        const existing = attendance.find(a => a.employeeId === emp.id && a.date === dateTimestamp);
        if (existing) {
            alert("Attendance already marked for this day.");
            return;
        }

        let wage = 0;
        if (status === 'present') {
            wage = type === 'full' ? (emp.salaryPerMonth / 30) : (emp.salaryPerMonth / 60);
        }

        await markAttendance({
            employeeId: emp.id,
            date: dateTimestamp,
            status,
            type: status === 'present' ? type : undefined,
            wage
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'employees' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Employees
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Attendance
                </button>
            </div>

            {/* Content */}
            {activeTab === 'employees' ? (
                <div className="space-y-6">
                    {/* Add Button */}
                    {!isFormOpen && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add New Employee
                        </button>
                    )}

                    {/* Form */}
                    {isFormOpen && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-4">{editingId ? 'Edit Employee' : 'New Employee Entry'}</h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel" required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Position</label>
                                    <input
                                        type="text" required
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Salary / 30 Days</label>
                                    <input
                                        type="number" required min="0"
                                        value={formData.salaryPerMonth}
                                        onChange={e => setFormData({ ...formData, salaryPerMonth: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-2 mt-2">
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                                        {editingId ? 'Update Employee' : 'Save Employee'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({ name: '', phone: '', position: '', salaryPerMonth: '' }); }}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Name</th>
                                    <th className="px-6 py-3 font-semibold">Phone</th>
                                    <th className="px-6 py-3 font-semibold">Position</th>
                                    <th className="px-6 py-3 font-semibold">Monthly Salary</th>
                                    <th className="px-6 py-3 font-semibold">Total Due</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No employees found.</td></tr>
                                ) : (
                                    employees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-900">{emp.name}</td>
                                            <td className="px-6 py-3 text-slate-600">{emp.phone}</td>
                                            <td className="px-6 py-3 text-slate-600">{emp.position}</td>
                                            <td className="px-6 py-3 text-slate-600">${emp.salaryPerMonth.toLocaleString()}</td>
                                            <td className="px-6 py-3 font-bold text-orange-600">${emp.totalDueSalary.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEdit(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(emp.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Date Picker */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <label className="font-medium text-slate-700">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg"
                        />
                    </div>

                    {/* Attendance List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Employee</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold">Type</th>
                                    <th className="px-6 py-3 font-semibold">Wage for Day</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map(emp => {
                                    const att = getAttendanceForDate(emp.id);
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-900 flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" /> {emp.name}
                                            </td>
                                            <td className="px-6 py-3">
                                                {att ? (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${att.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {att.status === 'present' ? 'Present' : 'Absent'}
                                                    </span>
                                                ) : <span className="text-slate-400 italic">Not marked</span>}
                                            </td>
                                            <td className="px-6 py-3">
                                                {att && att.status === 'present' ? (
                                                    <span className="text-slate-700">{att.type === 'full' ? 'Full Day' : 'Half Day'}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-slate-600">
                                                {att ? `$${att.wage.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {!att ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp, 'present', 'full')}
                                                            className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-xs font-medium"
                                                        >
                                                            Full Day
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp, 'present', 'half')}
                                                            className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-xs font-medium"
                                                        >
                                                            Half Day
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(emp, 'absent')}
                                                            className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-xs font-medium"
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Marked</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
