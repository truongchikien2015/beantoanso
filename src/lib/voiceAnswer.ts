type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = Event & {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type VoiceAnswerOption<Key extends string = string> = {
  key: Key;
  text: string;
};

export type VoiceAnswerMatch<Key extends string = string> = {
  key: Key;
  transcript: string;
  score: number;
};

const STOP_WORDS = new Set([
  "a",
  "ah",
  "ạ",
  "em",
  "chon",
  "chọn",
  "dap",
  "đáp",
  "an",
  "án",
  "la",
  "là",
  "cau",
  "câu",
  "tra",
  "trả",
  "loi",
  "lời",
]);

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as SpeechRecognitionWindow;
  return (
    speechWindow.SpeechRecognition ||
    speechWindow.webkitSpeechRecognition ||
    null
  );
}

export function voiceAnswerAvailable() {
  return getSpeechRecognition() !== null;
}

export function normalizeVietnameseText(text: string) {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(text: string) {
  return normalizeVietnameseText(text)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function tokenScore(transcript: string, option: string) {
  const transcriptTokens = new Set(tokenize(transcript));
  const optionTokens = tokenize(option);
  if (transcriptTokens.size === 0 || optionTokens.length === 0) return 0;

  const hits = optionTokens.filter((token) => transcriptTokens.has(token)).length;
  return hits / optionTokens.length;
}

export function matchSpokenAnswer<Key extends string>(
  transcript: string,
  options: VoiceAnswerOption<Key>[],
): VoiceAnswerMatch<Key> | null {
  const spoken = normalizeVietnameseText(transcript);
  if (!spoken) return null;

  const normalizedOptions = options
    .map((option) => ({
      ...option,
      normalized: normalizeVietnameseText(option.text),
    }))
    .filter((option) => option.normalized);

  const exactCandidates = normalizedOptions.filter(
    (option) => spoken === option.normalized,
  );
  if (exactCandidates.length === 1) {
    return { key: exactCandidates[0].key, transcript, score: 1 };
  }

  const containmentCandidates = normalizedOptions
    .map((option) => {
      if (spoken.includes(option.normalized)) {
        return {
          ...option,
          score: option.normalized.length / spoken.length,
        };
      }
      if (option.normalized.includes(spoken)) {
        return {
          ...option,
          score: spoken.length / option.normalized.length,
        };
      }
      return { ...option, score: 0 };
    })
    .filter((option) => option.score > 0)
    .sort((a, b) => b.score - a.score);

  if (containmentCandidates.length > 0) {
    const [best, second] = containmentCandidates;
    if (!second || best.score - second.score >= 0.15) {
      return { key: best.key, transcript, score: best.score };
    }
  }

  const scored = options
    .map((option) => ({
      ...option,
      score: tokenScore(transcript, option.text),
    }))
    .sort((a, b) => b.score - a.score);

  const [best, second] = scored;
  if (!best || best.score < 0.67) return null;
  if (second && best.score - second.score < 0.25) return null;

  return { key: best.key, transcript, score: best.score };
}

export function listenForVoiceAnswer(): Promise<string> {
  const Recognition = getSpeechRecognition();
  if (!Recognition) {
    return Promise.reject(new Error("voice-answer-unavailable"));
  }

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      callback();
    };

    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j += 1) {
          const transcript = result[j]?.transcript?.trim();
          if (transcript) transcripts.push(transcript);
        }
      }

      finish(() => resolve(transcripts.join(" ")));
    };

    recognition.onerror = (event) => {
      finish(() => reject(new Error(event.error || "voice-answer-error")));
    };

    recognition.onend = () => {
      finish(() => reject(new Error("voice-answer-empty")));
    };

    try {
      recognition.start();
    } catch (err) {
      finish(() => reject(err));
    }
  });
}
