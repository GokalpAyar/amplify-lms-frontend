import { useState } from 'react';
import AudioRecorder from '../../components/speech/AudioRecorder';

const SubmitFeedback = () => {
  const [transcript, setTranscript] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Submit Feedback</h1>
      <p className="text-sm text-gray-600">
        Use your voice to submit course feedback.
      </p>

      <AudioRecorder setTranscript={setTranscript} />

      <div className="p-4 bg-gray-100 border rounded">
        <h2 className="font-semibold mb-2">Transcription Result:</h2>
        <p>{transcript || 'No transcript yet'}</p>
      </div>
    </div>
  );
};

export default SubmitFeedback;
