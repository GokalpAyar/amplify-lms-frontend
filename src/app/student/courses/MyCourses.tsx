import { Link } from 'react-router-dom';

const mockCourses = [
  { id: 'c1', title: 'Biology 101' },
  { id: 'c2', title: 'World Literature' },
];

const MyCourses = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Courses</h1>
      <ul className="space-y-3">
        {mockCourses.map((course) => (
          <li key={course.id} className="p-4 bg-white border rounded shadow-sm">
            <p className="font-semibold text-lg">{course.title}</p>
            <Link
              to={`/dashboard/student/courses/${course.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              View Course
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyCourses;
