import { useEffect, useState } from 'react';
import { apiUrl } from '@/config';

interface GradeRecord {
  id: string;
  assignmentTitle: string;
  score: string;
  feedback?: string;
  submittedAt: string;
}

const ViewGrades = () => {
  const [grades, setGrades] = useState<GradeRecord[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch(apiUrl('/api/v1/grades/me'));
        const data = await res.json();
        setGrades(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchGrades();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Grades</h1>
      {grades.length === 0 ? (
        <p>No grades available yet.</p>
      ) : (
        <ul className="space-y-4">
          {grades.map((g) => (
            <li key={g.id} className="p-4 bg-white border rounded shadow-sm">
              <p><strong>Assignment:</strong> {g.assignmentTitle}</p>
              <p><strong>Grade:</strong> {g.score}</p>
              {g.feedback && <p><strong>Feedback:</strong> {g.feedback}</p>}
              <p className="text-sm text-gray-500">
                Submitted: {new Date(g.submittedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewGrades;
