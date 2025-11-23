import { Link, useParams } from 'react-router-dom';

const mockAssignments = [
  { id: 'a1', title: 'Photosynthesis Essay' },
  { id: 'a2', title: 'History of Computing' },
];

const AssignmentsList = () => {
  const { courseId } = useParams();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Assignments</h2>
      {mockAssignments.map((a) => (
        <div key={a.id} className="p-4 border rounded bg-white shadow-sm">
          <p className="font-medium">{a.title}</p>
          <Link
            to={`/dashboard/student/courses/${courseId}/assignments/${a.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            Submit Answer
          </Link>
        </div>
      ))}
    </div>
  );
};

export default AssignmentsList;