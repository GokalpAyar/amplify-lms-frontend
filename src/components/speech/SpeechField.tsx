import { useState } from "react";
import AudioRecorder from "./AudioRecorder";

const SpeechField = () => {
  const [transcript, setTranscript] = useState("");

  return (
    <div className="space-y-4">
      <AudioRecorder setTranscript={setTranscript} context="assignment" />
      <textarea
        className="w-full p-2 border rounded h-32"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Transcript will appear here..."
      />
    </div>
  );
};

export default SpeechField;
