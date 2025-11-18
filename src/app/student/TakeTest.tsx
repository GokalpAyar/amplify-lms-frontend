import { useState, ChangeEvent } from 'react';
import AudioRecorder from '../../components/speech/AudioRecorder';
import { BASE_URL } from '@/config';
import { useLoading } from '../../context/LoadingContext';
import toast from 'react-hot-toast';

const mockAssignment = {
  id: 'a1',
  title: 'Describe Photosynthesis',
  instructions: 'Explain the process of photosynthesis in your own words.',
  allowSpeech: true,
  allowAttachment: true,
  type: 'essay', // could also be 'multiple-choice'
  options: ['A. Chlorophyll traps sunlight', 'B. Glucose breaks down', 'C. Carbon forms water'], // if type === 'multiple-choice'
};

const TakeTest = () => {
  const [response, setResponse] = useState('');
  const [transcript, setTranscript] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const { setLoading } = useLoading();

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append('assignmentId', mockAssignment.id);
    formData.append('writtenAnswer', response);
    formData.append('spokenAnswer', transcript);
    if (mockAssignment.type === 'multiple-choice') {
      formData.append('multipleChoiceAnswer', selectedOption);
    }
    if (attachment) {
      formData.append('file', attachment);
    }

    try {
      const res = await fetch(`${BASE_URL}/submissions/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Submission failed');
      await res.json();

      toast.success('✅ Submitted successfully!');
      setResponse('');
      setTranscript('');
      setAttachment(null);
      setSelectedOption('');
    } catch (err) {
      console.error(err);
      toast.error('❌ Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{mockAssignment.title}</h1>
      <p className="text-gray-700">{mockAssignment.instructions}</p>

      {mockAssignment.type === 'essay' && (
        <div className="space-y-2">
          <label className="font-medium">Written Response:</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={6}
            placeholder="Type your answer here..."
          />
        </div>
      )}

      {mockAssignment.type === 'multiple-choice' && (
        <div className="space-y-2">
          <label className="font-medium">Select an answer:</label>
          {mockAssignment.options.map((opt) => (
            <div key={opt}>
              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="mcq"
                  value={opt}
                  checked={selectedOption === opt}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                {opt}
              </label>
            </div>
          ))}
        </div>
      )}

      {mockAssignment.allowSpeech && (
        <div className="space-y-2">
          <label className="font-medium">Optional Spoken Response:</label>
          <AudioRecorder setTranscript={setTranscript} context="assignment" />
          {transcript && (
            <p className="bg-gray-100 p-3 rounded border text-sm">
              <strong>Transcript:</strong> {transcript}
            </p>
          )}
        </div>
      )}

      {mockAssignment.allowAttachment && (
        <div className="space-y-2">
          <label className="font-medium">Upload Attachment (image, PDF, video):</label>
          <input type="file" onChange={handleAttachmentChange} />
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </div>
  );
};

export default TakeTest;
