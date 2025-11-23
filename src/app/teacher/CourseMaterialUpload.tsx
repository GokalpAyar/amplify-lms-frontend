// src/app/teacher/CourseMaterialUpload.tsx

import { useState } from 'react';
import { BASE_URL } from '@/config';
import toast from 'react-hot-toast';
import { useLoading } from '../../context/LoadingContext';

const mockCourses = [
  { id: 'c1', name: 'Intro to Biology' },
  { id: 'c2', name: 'World History' },
];

const CourseMaterialUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>(mockCourses[0]?.id || '');
  const { setLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', selectedCourse);
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/materials/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      toast.success('✅ Material uploaded successfully');
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error('❌ Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Upload Course Material</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          {mockCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Material Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows={4}
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Upload Material
        </button>
      </form>
    </div>
  );
};

export default CourseMaterialUpload;
