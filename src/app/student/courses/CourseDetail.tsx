import { useParams, NavLink, Outlet } from 'react-router-dom';

const CourseDetail = () => {
  const { courseId } = useParams();

  const tabs = [
    { label: 'Assignments', path: 'assignments' },
    { label: 'Materials', path: 'materials' },
    { label: 'Grades', path: 'grades' },
    { label: 'Feedback', path: 'feedback' },
    { label: 'Syllabus', path: 'syllabus' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Course: {courseId}</h1>

      <div className="flex gap-4 border-b pb-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={`/dashboard/student/courses/${courseId}/${tab.path}`}
            className={({ isActive }) =>
              `px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default CourseDetail;
