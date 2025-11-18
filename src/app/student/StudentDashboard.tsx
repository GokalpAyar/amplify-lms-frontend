import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Link
        to="/dashboard/student/courses"
        className="p-6 rounded-lg bg-blue-100 hover:bg-blue-200 transition"
      >
        <h2 className="text-xl font-semibold text-blue-800">My Courses</h2>
        <p className="text-sm text-blue-700">View and explore enrolled courses</p>
      </Link>

      <Link
        to="/dashboard/student/grades"
        className="p-6 rounded-lg bg-green-100 hover:bg-green-200 transition"
      >
        <h2 className="text-xl font-semibold text-green-800">Grades</h2>
        <p className="text-sm text-green-700">Check your grades and performance</p>
      </Link>

      <Link
        to="/dashboard/student/courses/COURSE1/assignments"
        className="p-6 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition"
      >
        <h2 className="text-xl font-semibold text-yellow-800">Assignments</h2>
        <p className="text-sm text-yellow-700">Submit and review assignments</p>
      </Link>

      <Link
        to="/dashboard/student/courses/COURSE1/quizzes"
        className="p-6 rounded-lg bg-red-100 hover:bg-red-200 transition"
      >
        <h2 className="text-xl font-semibold text-red-800">Quizzes</h2>
        <p className="text-sm text-red-700">Take upcoming quizzes</p>
      </Link>
    </div>
  );
};

export default StudentDashboard;
