import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fileHref, toFormData } from '../api.js';

export default function AssignmentView() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [mine, setMine] = useState(undefined); // undefined = loading, null = not submitted
  const [submissions, setSubmissions] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const a = await api(`/assignments/${id}`);
      setAssignment(a);
      if (a.canManage) {
        setSubmissions(await api(`/assignments/${id}/submissions`));
      } else {
        setMine(await api(`/assignments/${id}/my-submission`));
      }
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDone = (message) => {
    setNotice(message);
    setError('');
    load();
  };

  const handleError = (message) => {
    setError(message);
    setNotice('');
  };

  if (!assignment) return error ? <p className="error">{error}</p> : <p>Loading...</p>;

  const deadlinePassed = new Date() > new Date(assignment.dueDate);

  return (
    <div>
      <p>
        <Link to={`/courses/${assignment.course._id}`}>← {assignment.course.code} · {assignment.course.title}</Link>
      </p>
      <h1>{assignment.title}</h1>
      <p className="muted">
        Due {new Date(assignment.dueDate).toLocaleString()} · {assignment.maxMarks} marks{' '}
        {deadlinePassed && <span className="badge warn">Deadline passed</span>}
      </p>

      {assignment.description && <p className="description">{assignment.description}</p>}

      {assignment.attachments?.length > 0 && (
        <div className="card">
          <h3>Attachments</h3>
          {assignment.attachments.map((f) => (
            <a key={f.filename} href={fileHref(f.filename)} className="file">{f.originalName}</a>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}

      {assignment.canManage ? (
        <TeacherGrading
          assignment={assignment}
          submissions={submissions}
          onDone={handleDone}
          onError={handleError}
        />
      ) : mine === undefined ? (
        <p>Loading...</p>
      ) : (
        <StudentSubmission
          assignment={assignment}
          mine={mine}
          deadlinePassed={deadlinePassed}
          onDone={handleDone}
          onError={handleError}
        />
      )}
    </div>
  );
}

// ---------- Student view ----------

function StudentSubmission({ assignment, mine, deadlinePassed, onDone, onError }) {
  const [text, setText] = useState(mine?.text || '');
  const [files, setFiles] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const closed = deadlinePassed && !assignment.allowLate;
  const canSubmit = !closed && (!mine || assignment.allowResubmit);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = toFormData({ text }, { files });
      await api(`/assignments/${assignment._id}/submit`, { method: 'POST', form: fd });
      setFiles(null);
      setFileKey((k) => k + 1);
      onDone('Your submission has been saved.');
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>Your submission</h2>

      {mine && (
        <div className="status">
          <span className="badge">Submitted</span>{' '}
          {mine.isLate && <span className="badge warn">Late</span>}{' '}
          <small className="muted">
            on {new Date(mine.submittedAt).toLocaleString()} · attempt {mine.attempts}
          </small>

          {mine.released ? (
            <p className="grade">
              Marks: <strong>{mine.marks}</strong> / {assignment.maxMarks}
            </p>
          ) : (
            <p className="muted">Your grade will appear here once your teacher releases it.</p>
          )}

          {mine.released && mine.feedback && (
            <div className="feedback">
              <h4>Feedback</h4>
              <p>{mine.feedback}</p>
            </div>
          )}

          {mine.text && <p className="my-text">{mine.text}</p>}
          {mine.files?.map((f) => (
            <a key={f.filename} href={fileHref(f.filename)} className="file">{f.originalName}</a>
          ))}
        </div>
      )}

      {canSubmit ? (
        <form onSubmit={submit}>
          {mine?.released && (
            <p className="hint">Resubmitting will clear your current grade until your teacher grades the new work.</p>
          )}
          <textarea
            placeholder="Type your answer here (optional if you attach files)"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <label>
            Attach files (up to 5)
            <input key={fileKey} type="file" multiple onChange={(e) => setFiles(e.target.files)} />
          </label>
          <div>
            <button className="btn primary" disabled={busy}>
              {busy ? 'Submitting...' : mine ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </form>
      ) : (
        <p className="muted">
          {closed ? 'The deadline has passed.' : 'Resubmission is not allowed for this assignment.'}
        </p>
      )}
    </section>
  );
}

// ---------- Teacher / admin view ----------

function TeacherGrading({ assignment, submissions, onDone, onError }) {
  const unreleased = submissions.some((s) => s.status === 'graded' && !s.released);

  const releaseAll = async () => {
    try {
      const r = await api(`/assignments/${assignment._id}/release-grades`, { method: 'POST' });
      onDone(`Released ${r.released} grade(s) to students.`);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>Submissions ({submissions.length})</h2>
        {unreleased && <button className="btn primary" onClick={releaseAll}>Release all grades</button>}
      </div>

      {!submissions.length && <p className="muted">No submissions yet.</p>}

      {submissions.map((s) => (
        <GradeRow
          key={s._id}
          submission={s}
          maxMarks={assignment.maxMarks}
          onDone={onDone}
          onError={onError}
        />
      ))}
    </section>
  );
}

function GradeRow({ submission, maxMarks, onDone, onError }) {
  const [marks, setMarks] = useState(submission.marks ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [busy, setBusy] = useState(false);

  const save = async (release) => {
    setBusy(true);
    try {
      const body = { feedback };
      if (marks !== '') body.marks = Number(marks);
      if (release !== undefined) body.release = release;
      await api(`/submissions/${submission._id}/grade`, { method: 'PATCH', body });
      onDone(release ? 'Grade saved and released to the student.' : 'Grade saved.');
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card grade-row">
      <div className="grade-head">
        <div>
          <strong>{submission.student?.name}</strong>{' '}
          <small className="muted">{submission.student?.rollNo} · {submission.student?.email}</small>
        </div>
        <div>
          {submission.isLate && <span className="badge warn">Late</span>}{' '}
          {submission.released && <span className="badge ok">Released</span>}{' '}
          <small className="muted">
            {new Date(submission.submittedAt).toLocaleString()} · attempt {submission.attempts}
          </small>
        </div>
      </div>

      {submission.text && <p className="my-text">{submission.text}</p>}
      {submission.files?.map((f) => (
        <a key={f.filename} href={fileHref(f.filename)} className="file">{f.originalName}</a>
      ))}

      <div className="grid">
        <label>
          Marks (out of {maxMarks})
          <input
            type="number"
            min="0"
            max={maxMarks}
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </label>
        <label className="wide">
          Feedback
          <textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </label>
      </div>

      <div className="actions">
        <button className="btn" disabled={busy} onClick={() => save(undefined)}>Save</button>
        <button className="btn primary" disabled={busy} onClick={() => save(true)}>
          {submission.released ? 'Save & keep released' : 'Save & release'}
        </button>
      </div>
    </div>
  );
}
