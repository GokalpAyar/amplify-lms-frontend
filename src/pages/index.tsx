import SpeechField from '@/components/SpeechField';

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Speech Transcriber</h1>
      <SpeechField />
    </main>
  );
}
