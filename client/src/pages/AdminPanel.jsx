import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyUser = { name: '', email: '', password: '', role: 'teacher', rollNo: '', department: '' };

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(emptyUser);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = () =>
    api(`/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`)
      .then(setUsers)
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  useEffect(() => {
    api('/admin/stats').then(setStats).catch(() => {});
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/admin/users', { method: 'POST', body: form });
      setMessage(`${form.role} account created for ${form.email}`);
      setForm(emptyUser);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetPassword = async (u) => {
    const password = window.prompt(`New password for ${u.name} (at least 6 characters):`);
    if (!password) return;
    try {
      await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { password } });
      setMessage(`Password updated for ${u.email}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const statItems = stats
    ? [
        ['Students', stats.students],
        ['Teachers', stats.teachers],
        ['Courses', stats.courses],
        ['Assignments', stats.assignments],
        ['Submissions', stats.submissions],
        ['Graded', stats.graded],
      ]
    : [];

  return (
    <div>
      <h1>Admin panel</h1>

      {statItems.length > 0 && (
        <div className="stats">
          {statItems.map(([label, value]) => (
            <div className="card stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      <form className="card" onSubmit={createUser}>
        <h3>Create a user</h3>
        <div className="grid">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Temporary password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          <input placeholder="Roll no / employee ID" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
          <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div><button className="btn primary">Create user</button></div>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="page-head">
        <h2>Users</h2>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All roles</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>ID</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.rollNo}</td>
                <td>{u.isActive ? 'Active' : 'Disabled'}</td>
                <td className="actions">
                  <button className="btn ghost small" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn ghost small" onClick={() => resetPassword(u)}>Reset password</button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td colSpan={6} className="muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
