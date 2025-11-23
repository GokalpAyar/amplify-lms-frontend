// AudioRecorder.tsx
// ==========================================================
// Handles audio recording with a configurable time limit.
// Displays mm:ss countdown and progress bar.
// Automatically stops when time runs out and uploads to backend.
// ==========================================================

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { apiUrl } from "@/config";
import { useLoading } from "@/context/LoadingContext";
import toast from "react-hot-toast";

interface AudioRecorderProps {
  setTranscript: (text: string) => void;
  context?: "feedback" | "assignment";
  limitSeconds?: number;
}

const AudioRecorder = ({
  setTranscript,
  context = "feedback",
  limitSeconds = 60,
}: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(limitSeconds);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { setLoading } = useLoading();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ----------------------------------------------------------
  // Hard stop utility — ensures mic and recorder are released.
  // ----------------------------------------------------------
  const forceStopRecording = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;

    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* already stopped */
    }

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setRecording(false);
    setStatusMessage(null);
  };

  // ----------------------------------------------------------
  // Start Recording
  // ----------------------------------------------------------
  const startRecording = async () => {
    if (uploading) {
      toast.error("Please wait for the current transcription to finish.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
        setStatusMessage("Preparing audio for upload…");
        await transcribeAudio(blob, "recording.webm");
      };

      recorder.start();
      setRecording(true);
      setTimeLeft(limitSeconds);
      setStatusMessage("Recording in progress…");

      // countdown
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            forceStopRecording(); // 🔹 hard stop at 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // absolute timeout safeguard
      timeoutRef.current = window.setTimeout(() => {
        forceStopRecording();
        setTimeLeft(0);
      }, limitSeconds * 1000);
    } catch (err) {
      console.error(err);
      toast.error("🎤 Microphone access denied or not available");
    }
  };

  // ----------------------------------------------------------
  // Upload Audio
  // ----------------------------------------------------------
  const transcribeAudio = async (payload: Blob | File, filename: string) => {
    const formData = new FormData();
    formData.append("file", payload, filename);
    formData.append("context", context);

    setLoading(true);
    setUploading(true);
    setTranscript("⏳ Processing your audio...");
    setStatusMessage("Uploading audio for transcription…");

    try {
      const res = await fetch(apiUrl("/api/transcribe"), {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const text =
        data.transcription ||
        data.text ||
        data.transcript ||
        (typeof data === "string" ? data : "");
      if (text) {
        setTranscript(text);
        toast.success("✅ Whisper transcription received!");
      } else {
        setTranscript("⚠️ No transcript found.");
        toast.error("⚠️ Whisper returned empty text.");
      }
    } catch (err) {
      console.error("❌ Upload/transcription failed:", err);
      setTranscript("❌ Upload or transcription failed.");
      toast.error("Backend not reachable or Whisper failed.");
    } finally {
      setLoading(false);
      setUploading(false);
      setStatusMessage(null);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioURL(URL.createObjectURL(file));
      await transcribeAudio(file, file.name);
    }
    event.target.value = "";
  };

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------
  useEffect(() => {
    return () => {
      forceStopRecording();
    };
  }, []);

  const progress =
    limitSeconds > 0 ? Math.max(0, (timeLeft / limitSeconds) * 100) : 0;
  const isBusy = recording || uploading;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="p-4 border rounded bg-white shadow-md space-y-3 text-center">
      <p className="text-sm text-gray-600">
        {recording
          ? `Recording... (${formatTime(timeLeft)} remaining)`
          : `Click below to start recording (limit: ${formatTime(limitSeconds)})`}
      </p>
      {statusMessage && (
        <p className="text-xs text-gray-500" aria-live="polite">
          {statusMessage}
        </p>
      )}

      {/* Progress Bar */}
      {recording && (
        <div className="h-2 w-full bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <button
          className={`px-4 py-2 rounded text-white ${
            recording ? "bg-red-500" : "bg-blue-600"
          } hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
          onClick={recording ? forceStopRecording : startRecording}
          disabled={uploading && !recording}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        <label className="flex flex-col text-sm font-medium text-gray-600">
          <span className="mb-1">Or upload audio</span>
          <input
            type="file"
            accept="audio/*"
            disabled={isBusy}
            onChange={handleFileUpload}
            className="text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-600 disabled:opacity-50"
          />
        </label>
      </div>

      {audioURL && (
        <div className="mt-3">
          <audio controls src={audioURL} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
