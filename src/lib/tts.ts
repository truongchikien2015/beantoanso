let voicesLoaded = false;

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

export function speak(text: string) {
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

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function ttsAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
