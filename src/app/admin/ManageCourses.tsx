import { useState } from 'react';

const mockCourses = [
  { id: 'c1', title: 'Biology 101', teacher: 'Bob' },
  { id: 'c2', title: 'Literature', teacher: 'Unassigned' },
];

const ManageCourses = () => {
  const [courses, setCourses] = useState(mockCourses);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = () => {
    if (!newTitle) return;
    setCourses((prev) => [
      ...prev,
      { id: `c${Date.now()}`, title: newTitle, teacher: 'Unassigned' },
    ]);
    setNewTitle('');
  };

  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Courses</h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New course title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="border px-3 py-1 rounded w-64"
        />
        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Create
        </button>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Title</th>
            <th className="border px-4 py-2 text-left">Teacher</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td className="border px-4 py-2">{c.title}</td>
              <td className="border px-4 py-2">{c.teacher}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(c.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageCourses;
