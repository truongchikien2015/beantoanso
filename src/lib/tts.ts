let voicesLoaded = false;
let apiAudio: HTMLAudioElement | null = null;

function pickVnVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("vi")) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
    voices[0] ||
    null
  );
}

async function speakWithEvenlab(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof Audio === "undefined") return false;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    apiAudio?.pause();
    apiAudio = new Audio(audioUrl);
    apiAudio.onended = () => URL.revokeObjectURL(audioUrl);
    apiAudio.onerror = () => URL.revokeObjectURL(audioUrl);
    await apiAudio.play();
    return true;
  } catch {
    return false;
  }
}

function speakWithBrowser(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  if (!voicesLoaded) {
    synth.getVoices();
    voicesLoaded = true;
  }
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVnVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || "vi-VN";
  u.rate = 0.95;
  u.pitch = 1.05;
  synth.speak(u);
}

export function speak(text: string) {
  void speakWithEvenlab(text).then((spoken) => {
    if (!spoken) speakWithBrowser(text);
  });
}

export function stopSpeaking() {
  if (apiAudio) {
    apiAudio.pause();
    apiAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function ttsAvailable() {
  return typeof window !== "undefined" && (typeof Audio !== "undefined" || "speechSynthesis" in window);
}
