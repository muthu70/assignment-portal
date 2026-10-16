import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, toFormData } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyAssignment = {
  title: '',
  description: '',
  dueDate: '',
  maxMarks: '100',
  allowLate: false,
  allowResubmit: true,
};

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user.role === 'teacher' || user.role === 'admin';

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyAssignment);
  const [files, setFiles] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([api(`/courses/${id}`), api(`/courses/${id}/assignments`)]);
      setCourse(c);
      setAssignments(a);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const createAssignment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fd = toFormData(
        {
          ...form,
          // Send explicit "true" / "false" so unchecked boxes are not treated as missing.
          allowLate: String(form.allowLate),
          allowResubmit: String(form.allowResubmit),
        },
        { attachments: files }
      );
      await api(`/courses/${id}/assignments`, { method: 'POST', form: fd });
      setForm(emptyAssignment);
      setFiles(null);
      setFileKey((k) => k + 1);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/courses/${id}/students`, { method: 'POST', body: { email: studentEmail } });
      setStudentEmail('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      await api(`/courses/${id}/students/${studentId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment and all its submissions?')) return;
    try {
      await api(`/assignments/${assignmentId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCourse = async () => {
    if (!window.confirm('Delete this course, its assignments and all submissions?')) return;
    try {
      await api(`/courses/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!course) return error ? <p className="error">{error}</p> : <p>Loading...</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{course.code} · {course.title}</h1>
          <p className="muted">
            {course.semester} {course.teacher?.name && `· Teacher: ${course.teacher.name}`}
          </p>
          {isStaff && <p className="muted">Join code: <strong>{course.joinCode}</strong></p>}
        </div>
        {isStaff && <button className="btn danger" onClick={deleteCourse}>Delete course</button>}
      </div>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Assignments</h2>

        {isStaff && (
          <form className="card" onSubmit={createAssignment}>
            <h3>New assignment</h3>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea
              placeholder="Description / instructions"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid">
              <label>
                Due date
                <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              </label>
              <label>
                Max marks
                <input type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} required />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={form.allowLate} onChange={(e) => setForm({ ...form, allowLate: e.target.checked })} />
              Allow late submissions
            </label>
            <label className="check">
              <input type="checkbox" checked={form.allowResubmit} onChange={(e) => setForm({ ...form, allowResubmit: e.target.checked })} />
              Allow resubmission
            </label>
            <label>
              Attachments (up to 5)
              <input key={fileKey} type="file" multiple onChange={(e) => setFiles(e.target.files)} />
            </label>
            <div><button className="btn primary">Create assignment</button></div>
          </form>
        )}

        <div className="list">
          {assignments.map((a) => (
            <div className="card row" key={a._id}>
              <div>
                <Link to={`/assignments/${a._id}`}><strong>{a.title}</strong></Link>
                <div className="muted">
                  Due {new Date(a.dueDate).toLocaleString()} · {a.maxMarks} marks
                </div>
              </div>
              <div className="actions">
                {isStaff ? (
                  <>
                    <span className="badge">{a.submissionCount} submitted</span>
                    <button className="btn ghost small" onClick={() => deleteAssignment(a._id)}>Delete</button>
                  </>
                ) : (
                  <StudentStatus assignment={a} />
                )}
              </div>
            </div>
          ))}
          {!assignments.length && <p className="muted">No assignments yet.</p>}
        </div>
      </section>

      {isStaff && (
        <section>
          <h2>Students ({course.students?.length || 0})</h2>
          <form className="card inline" onSubmit={addStudent}>
            <input type="email" placeholder="Student's registered email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
            <button className="btn primary">Add student</button>
          </form>
          <div className="list">
            {course.students?.map((s) => (
              <div className="card row" key={s._id}>
                <span>
                  {s.name} <small className="muted">{s.rollNo} · {s.email}</small>
                </span>
                <button className="btn ghost small" onClick={() => removeStudent(s._id)}>Remove</button>
              </div>
            ))}
            {!course.students?.length && <p className="muted">No students enrolled yet.</p>}
          </div>
        </section>
      )}
    </div>
  );
}

function StudentStatus({ assignment }) {
  const s = assignment.mySubmission;
  if (!s) return <span className="badge warn">Not submitted</span>;
  if (s.released && s.marks !== null) return <span className="badge ok">{s.marks} / {assignment.maxMarks}</span>;
  return <span className="badge">Submitted</span>;
}
