import { useParams } from 'react-router-dom';
import { useState } from 'react';
import AudioRecorder from '../../../../components/speech/AudioRecorder';
import { apiUrl } from '@/config';

const AssignmentView = () => {
  const { assignmentId } = useParams();
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      type: 'assignment',
      id: assignmentId,
      written: writtenAnswer,
      spoken: transcript,
    };

    try {
      const res = await fetch(apiUrl('/api/v1/submit/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      alert('Assignment submitted!');
    } catch (err) {
      console.error(err);
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Assignment: {assignmentId}</h2>

      <textarea
        value={writtenAnswer}
        onChange={(e) => setWrittenAnswer(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        placeholder="Write your answer..."
        rows={6}
      />

      <AudioRecorder setTranscript={setTranscript} context="assignment" />

      {transcript && (
        <div className="bg-gray-100 p-3 rounded">
          <strong>Transcript:</strong> {transcript}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

export default AssignmentView;
