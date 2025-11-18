import { Link, useParams } from 'react-router-dom';

const mockQuizzes = [
  { id: 'q1', title: 'Biology Quiz 1' },
  { id: 'q2', title: 'Tech History Quiz' },
];

const QuizList = () => {
  const { courseId } = useParams();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quizzes</h2>
      {mockQuizzes.map((q) => (
        <div key={q.id} className="p-4 border rounded bg-white shadow-sm">
          <p className="font-medium">{q.title}</p>
          <Link
            to={`/dashboard/student/courses/${courseId}/quizzes/${q.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            Take Quiz
          </Link>
        </div>
      ))}
    </div>
  );
};

export default QuizList;