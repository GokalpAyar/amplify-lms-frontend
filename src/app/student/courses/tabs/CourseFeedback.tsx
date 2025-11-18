import { useState } from 'react';
import { apiUrl } from '@/config';

const CourseFeedback = () => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/feedback/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedback })
      });

      if (res.ok) {
        setSubmitted(true);
        setFeedback('');
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting feedback');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Course Feedback</h1>

      {submitted ? (
        <p className="text-green-600">Thank you for your feedback!</p>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            What do you think about this course?
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            className="w-full border rounded p-2"
            placeholder="Your feedback helps us improve..."
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseFeedback;
