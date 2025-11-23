import React, { useState, useRef } from "react";

interface AudioRecorderLocalProps {
  onRecorded: (url: string) => void;
}

export default function AudioRecorderLocal({ onRecorded }: AudioRecorderLocalProps) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onRecorded(url); // Pass to parent (TakeAssignment)
        chunks.current = [];
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="p-3 border rounded bg-white shadow space-y-2">
      <p>Status: {recording ? "🎙️ Recording..." : "Idle"}</p>
      <button
        className={`px-4 py-2 rounded text-white ${
          recording ? "bg-red-500" : "bg-blue-600"
        } hover:opacity-90`}
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {audioURL && <audio controls src={audioURL} className="w-full mt-2" />}
    </div>
  );
}
