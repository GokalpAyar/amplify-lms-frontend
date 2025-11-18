import React from 'react';

const mockGrades = [
  {
    id: 'g1',
    title: 'Photosynthesis Quiz',
    type: 'Quiz',
    score: 8.5,
    total: 10,
    feedback: 'Great job! You clearly understand the topic.'
  },
  {
    id: 'g2',
    title: 'Chapter 1 Essay',
    type: 'Assignment',
    score: 15,
    total: 20,
    feedback: 'Good effort, but some points lacked clarity.'
  },
  {
    id: 'g3',
    title: 'Midterm Exam',
    type: 'Quiz',
    score: 42,
    total: 50,
    feedback: 'Well done! Consider revising genetics for better results.'
  }
];

const CourseGrades = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grades</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockGrades.map((grade) => (
          <div key={grade.id} className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-lg font-semibold">{grade.title}</h2>
            <p className="text-sm text-gray-600">Type: {grade.type}</p>
            <p className="mt-2 font-medium">
              Score: <span className="text-green-600">{grade.score}/{grade.total}</span>
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Feedback: {grade.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseGrades;
