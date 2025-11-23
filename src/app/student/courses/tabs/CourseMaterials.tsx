import React from 'react';

// Mock data
const mockMaterials = [
  {
    id: 'mat1',
    title: 'Chapter 1 - Introduction to Biology',
    type: 'PDF',
    url: '/assets/materials/intro_biology.pdf'
  },
  {
    id: 'mat2',
    title: 'Photosynthesis Explained (Video)',
    type: 'Video',
    url: 'https://www.youtube.com/watch?v=UPBMG5EYydo'
  },
  {
    id: 'mat3',
    title: 'Lecture Slides - Week 2',
    type: 'Slides',
    url: '/assets/materials/week2_slides.pptx'
  }
];

const CourseMaterials = () => {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Course Materials</h2>
      <p className="text-gray-700">Below are materials related to this course.</p>

      <ul className="space-y-4">
        {mockMaterials.map((item) => (
          <li
            key={item.id}
            className="border rounded p-4 bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-500">Type: {item.type}</p>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              View / Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseMaterials;