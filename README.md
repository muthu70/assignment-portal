# College Assignment Portal (MERN)

A Google Classroom-style portal for college. Admins create teacher accounts and courses. Teachers add students, post assignments, and grade submissions. Students join courses, submit work, and see their marks and feedback once released.

## Features

| Role    | What they can do |
|---------|------------------|
| Admin   | Create teacher, student and admin accounts. Create courses and assign teachers. Enable or disable accounts. Reset passwords. View system stats. |
| Teacher | Create courses (they become the teacher). Add students by email or share the join code. Create, edit and delete assignments with attachments, deadlines, max marks, late and resubmission rules. View submissions, grade them, write feedback, and release grades. |
| Student | Self-register. Join a course with a join code. View assignments and deadlines. Submit text and files, and resubmit if allowed. See marks and feedback after they are released. |

Security: passwords are hashed with bcrypt. Sessions use JWT in httpOnly cookies. Every route checks the user's role and course membership. Uploaded files are served only after an access check.

## Project structure

```
assignment-portal/
├── server/          Express + MongoDB API
│   └── src/
│       ├── config/        database connection
│       ├── models/        User, Course, Assignment, Submission
│       ├── middleware/    auth + roles, file uploads, error handling
│       ├── controllers/   business logic for each feature
│       ├── routes/        URL definitions
│       ├── utils/         access rules, file helpers
│       └── scripts/       seedAdmin.js (creates the first admin)
└── client/          React (Vite) frontend
    └── src/
        ├── pages/         Login, Dashboard, CourseView, AssignmentView, AdminPanel
        ├── components/    Layout, ProtectedRoute
        ├── context/       AuthContext (current user and login state)
        └── api.js         fetch helper
```

## Setup

You need Node.js 18 or newer and MongoDB. You can run MongoDB locally or use a free MongoDB Atlas cluster.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then edit the values in .env
npm run seed:admin          # creates the first admin account from .env
npm run dev                 # starts the API on http://localhost:5000
```

Edit `.env` before running the seed script. Set `JWT_SECRET` to a long random string, and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the admin login you want.

### 2. Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev                 # opens on http://localhost:5173
```

Log in at `http://localhost:5173` with the admin account.

## Typical workflow

1. The admin logs in and creates teacher accounts in the Admin panel.
2. The admin creates a course and assigns it to a teacher. (A teacher can also create courses directly, and then they are assigned to that teacher.)
3. Students register themselves on the login page.
4. The teacher adds students by their registered email, or shares the course's join code so students can join.
5. The teacher creates an assignment with a due date, max marks, optional attachments, and late and resubmission rules.
6. Students submit text or files. Students can resubmit if the teacher allows it.
7. The teacher enters marks and feedback for each submission, then releases the grade. "Release all grades" releases everything that has been graded.

## API overview

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/auth/register` | Public | Student self-registration |
| POST | `/api/auth/login` | Public | Log in and set session cookie |
| POST | `/api/auth/logout` | Anyone | Clear session |
| GET | `/api/auth/me` | Logged in | Current user |
| GET | `/api/courses` | Logged in | Courses visible to the user |
| POST | `/api/courses` | Teacher, admin | Create a course |
| POST | `/api/courses/join` | Student | Join with a join code |
| GET | `/api/courses/:id` | Members | Course details |
| PATCH | `/api/courses/:id` | Course staff | Edit a course (admin can change teacher) |
| DELETE | `/api/courses/:id` | Course staff | Delete a course and everything in it |
| POST | `/api/courses/:id/students` | Course staff | Add a student by email |
| DELETE | `/api/courses/:id/students/:studentId` | Course staff | Remove a student |
| GET | `/api/courses/:courseId/assignments` | Members | List assignments |
| POST | `/api/courses/:courseId/assignments` | Course staff | Create assignment (multipart) |
| GET | `/api/assignments/:id` | Members | Assignment details |
| PATCH | `/api/assignments/:id` | Course staff | Edit assignment |
| DELETE | `/api/assignments/:id` | Course staff | Delete assignment and submissions |
| POST | `/api/assignments/:id/submit` | Enrolled student | Submit or resubmit (multipart) |
| GET | `/api/assignments/:id/my-submission` | Enrolled student | Own submission |
| GET | `/api/assignments/:id/submissions` | Course staff | All submissions |
| POST | `/api/assignments/:id/release-grades` | Course staff | Release all graded marks |
| PATCH | `/api/submissions/:id/grade` | Course staff | Set marks, feedback, release |
| GET | `/api/files/:filename` | Authorized users | Download an attachment or submission |
| GET/POST/PATCH | `/api/admin/users` | Admin | List, create, update users |
| GET | `/api/admin/stats` | Admin | Dashboard counts |

## Before deploying

- Serve the site over HTTPS. The cookie is marked `secure` when `NODE_ENV=production`.
- Store uploads in cloud storage such as Cloudinary or S3. Local disk does not survive most hosting platforms.
- Add rate limiting to login, for example with `express-rate-limit`.
- Use a strong `JWT_SECRET` and never commit `.env`.

## Ideas for next steps

- Rubrics with per-criterion scores
- Deadline reminder emails (node-cron and Nodemailer)
- CSV or Excel export of grades
- Basic plagiarism check that compares text submissions
- Course announcements
- An audit log of grade changes
