import { useParams } from 'react-router-dom';
import { useState } from 'react';
import AudioRecorder from '../../../../components/speech/AudioRecorder';
import { apiUrl } from '@/config';

const QuizView = () => {
  const { quizId } = useParams();
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      type: 'quiz',
      id: quizId,
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
      alert('Quiz submitted!');
    } catch (err) {
      console.error(err);
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Quiz: {quizId}</h2>

      <textarea
        value={writtenAnswer}
        onChange={(e) => setWrittenAnswer(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        placeholder="Type your answer..."
        rows={6}
      />

      <AudioRecorder setTranscript={setTranscript} context="quiz" />

      {transcript && (
        <div className="bg-gray-100 p-3 rounded">
          <strong>Transcript:</strong> {transcript}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

export default QuizView;
