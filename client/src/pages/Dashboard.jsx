import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyCourse = { title: '', code: '', semester: '', teacherId: '' };

// Classroom-style colours for course tiles
const TILE_COLORS = ['#1a73e8', '#137333', '#e37400', '#d93025', '#129eaf', '#a142f4'];

const roleIntro = {
  admin: 'Manage users, assign teachers and keep an eye on the whole portal.',
  teacher: 'Create courses, post assignments and grade student work.',
  student: 'Join your courses and keep track of upcoming deadlines.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyCourse);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const canCreate = user.role === 'teacher' || user.role === 'admin';

  const loadCourses = () => api('/courses').then(setCourses).catch((e) => setError(e.message));

  useEffect(() => {
    loadCourses();
    if (user.role === 'admin') {
      api('/admin/users?role=teacher').then(setTeachers).catch(() => {});
    }
  }, [user.role]);

  const createCourse = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/courses', { method: 'POST', body: form });
      setForm(emptyCourse);
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const joinCourse = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/courses/join', { method: 'POST', body: { joinCode } });
      setJoinCode('');
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div>
      <section className="banner">
        <p className="eyebrow">Welcome back</p>
        <h1>Hi, {firstName}</h1>
        <p>{roleIntro[user.role]}</p>
      </section>

      {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}

      {user.role === 'student' && (
        <form className="card inline" onSubmit={joinCourse}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ margin: 0 }}>Join a class</h3>
            <p className="hint">Ask your teacher for the join code.</p>
          </div>
          <input placeholder="Enter join code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
          <button className="btn primary">Join</button>
        </form>
      )}

      {canCreate && (
        <form className="card" onSubmit={createCourse}>
          <h3>Create a course</h3>
          <div className="grid">
            <input placeholder="Course title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input placeholder="Course code (e.g. CS301)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <input placeholder="Semester (e.g. Fall 2026)" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            {user.role === 'admin' && (
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
                <option value="">Assign a teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
          {user.role === 'admin' && teachers.length === 0 && (
            <p className="hint">No teachers yet. Create a teacher account in the Admin panel first.</p>
          )}
          <div><button className="btn primary">Create course</button></div>
        </form>
      )}

      <h2>{user.role === 'student' ? 'My classes' : 'Classes'}</h2>
      <div className="cards">
        {courses.map((c, i) => (
          <Link to={`/courses/${c._id}`} className="course-tile" key={c._id}>
            <div className="course-head" style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}>
              <h3>{c.title}</h3>
              <p>{c.code}</p>
            </div>
            <div className="course-body">
              <span className="muted">{c.teacher?.name || 'Teacher'}</span>
              {c.semester && <span className="muted">{c.semester}</span>}
            </div>
          </Link>
        ))}
        {!courses.length && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>No classes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
