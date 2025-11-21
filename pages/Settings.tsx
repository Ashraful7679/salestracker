import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, User, Save, Lock } from 'lucide-react';

export default function Settings() {
  const { user, allUsers, updateUser } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', password: '' });

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({ name: u.name, password: '' }); // Don't show existing password
  };

  const saveUser = (id: string) => {
    const updates: any = { name: formData.name };
    if (formData.password) {
      updates.password = formData.password;
    }
    updateUser(id, updates);
    setEditingId(null);
    setFormData({ name: '', password: '' });
  };

  // Filter users: Admin sees all, others see only themselves
  const visibleUsers = user?.role === 'admin' ? allUsers : allUsers.filter(u => u.id === user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'admin'
              ? "Manage user profiles. Note: You can only change your own password."
              : "Manage your profile settings."}
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {visibleUsers.map(u => (
            <div key={u.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                  {u.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>

                {editingId === u.id ? (
                  <div className="space-y-3 w-full max-w-md">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Password Field - Only visible if editing OWN profile */}
                    {u.id === user?.id && (
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">New Password (leave blank to keep current)</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="block w-full pl-9 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="New Password"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-slate-900">{u.name} {u.id === user?.id && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 ml-2">You</span>}</p>
                    <p className="text-sm text-slate-500 capitalize">{u.role}</p>
                  </div>
                )}
              </div>

              <div className="ml-4">
                {editingId === u.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveUser(u.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(u)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}