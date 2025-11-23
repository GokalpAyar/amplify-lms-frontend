import { useEffect, useState } from 'react';
import { apiUrl } from '@/config';

interface Transcript {
  id: string;
  content: string;
  context: string; // e.g. 'feedback' or 'assignment'
  timestamp: string;
}

const MyTranscripts = () => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const res = await fetch(apiUrl('/api/v1/transcripts/me'));
        const data = await res.json();
        setTranscripts(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTranscripts();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Transcripts</h1>
      <ul className="space-y-4">
        {transcripts.map((t) => (
          <li key={t.id} className="p-4 border rounded bg-white shadow-sm">
            <p><strong>Context:</strong> {t.context}</p>
            <p><strong>Content:</strong> {t.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(t.timestamp).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyTranscripts;
