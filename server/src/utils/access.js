// Access rules in one place so every controller applies the same logic.

// Admins manage everything. A teacher manages only the courses they teach.
export const isStaffOf = (user, course) =>
  user.role === 'admin' || (user.role === 'teacher' && String(course.teacher) === String(user._id));

// A student is enrolled if their id is in the course's student list.
export const isEnrolled = (user, course) =>
  user.role === 'student' && course.students.some((id) => String(id) === String(user._id));

export const isMemberOf = (user, course) => isStaffOf(user, course) || isEnrolled(user, course);
