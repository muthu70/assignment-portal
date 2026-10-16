// What a student is allowed to see about their own submission.
// Marks and feedback stay hidden until the teacher releases the grade.
export const studentView = (sub) => {
  const obj = typeof sub.toObject === 'function' ? sub.toObject() : { ...sub };
  if (!obj.released) {
    obj.marks = null;
    obj.feedback = '';
    obj.status = 'submitted';
    delete obj.gradedBy;
  }
  return obj;
};

export const summarizeForStudent = (sub) => {
  const { _id, status, isLate, submittedAt, attempts, released, marks, feedback } = studentView(sub);
  return { _id, status, isLate, submittedAt, attempts, released, marks, feedback };
};
