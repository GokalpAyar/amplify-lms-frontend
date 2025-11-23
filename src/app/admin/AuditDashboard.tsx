import { useEffect, useState } from 'react';
import { apiUrl } from '@/config';

interface ActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
}

interface Transcript {
  id: string;
  user: string;
  context: string;
  content: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalTranscripts: number;
  speechSubmissions: number;
  textSubmissions: number;
}

const AuditDashboard = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const [logRes, transcriptRes, statsRes] = await Promise.all([
          fetch(apiUrl('/api/v1/admin/activity')),
          fetch(apiUrl('/api/v1/admin/transcripts')),
          fetch(apiUrl('/api/v1/admin/stats')),
        ]);
        setLogs(await logRes.json());
        setTranscripts(await transcriptRes.json());
        setStats(await statsRes.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchAuditData();
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Admin Audit Dashboard</h1>

      {/* === Stats === */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 bg-white border p-4 rounded shadow-sm">
          <div><strong>Total Users:</strong> {stats.totalUsers}</div>
          <div><strong>Total Transcripts:</strong> {stats.totalTranscripts}</div>
          <div><strong>Speech Submissions:</strong> {stats.speechSubmissions}</div>
          <div><strong>Text Submissions:</strong> {stats.textSubmissions}</div>
        </div>
      )}

      {/* === Activity Logs === */}
      <div>
        <h2 className="text-xl font-semibold mb-2">User Activity Logs</h2>
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="p-3 border rounded bg-white shadow-sm">
              <p><strong>{log.user}</strong> ({log.role}) — {log.action}</p>
              <p className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* === Transcripts === */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Transcript Records</h2>
        <ul className="space-y-2 max-h-[400px] overflow-y-auto">
          {transcripts.map((t) => (
            <li key={t.id} className="p-3 border rounded bg-white">
              <p><strong>User:</strong> {t.user}</p>
              <p><strong>Context:</strong> {t.context}</p>
              <p><strong>Transcript:</strong> {t.content}</p>
              <p className="text-sm text-gray-500">
                {new Date(t.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AuditDashboard;
