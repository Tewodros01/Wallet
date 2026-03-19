// Speaks bingo calls like "B 7", "N 35", "O 72" using Web Speech API
// Falls back silently if not supported

const LETTER = (n: number) =>
  n <= 15 ? "B" : n <= 30 ? "I" : n <= 45 ? "N" : n <= 60 ? "G" : "O";

// Number words for natural speech
const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy"];

function toWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? TENS[t] : `${TENS[t]} ${ONES[o]}`;
}

let synth: SpeechSynthesis | null = null;
let voice: SpeechSynthesisVoice | null = null;

function getSynth() {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  if (!synth) synth = window.speechSynthesis;
  return synth;
}

function getVoice(): SpeechSynthesisVoice | null {
  if (voice) return voice;
  const s = getSynth();
  if (!s) return null;
  const voices = s.getVoices();
  // Prefer a clear English voice
  voice =
    voices.find(
      (v) => v.lang === "en-US" && v.name.toLowerCase().includes("google"),
    ) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0] ??
    null;
  return voice;
}

export function announceNumber(n: number, muted = false) {
  if (muted) return;
  const s = getSynth();
  if (!s) return;

  // Load voices lazily
  if (!getVoice() && s.getVoices().length === 0) {
    s.addEventListener("voiceschanged", () => getVoice(), { once: true });
  }

  s.cancel(); // stop any current speech

  const letter = LETTER(n);
  const words = toWords(n);
  // e.g. "B ... seven" or "N ... thirty five"
  const text = `${letter}... ${words}`;

  const utt = new SpeechSynthesisUtterance(text);
  utt.voice = getVoice();
  utt.rate = 0.88;
  utt.pitch = 1.05;
  utt.volume = 0.95;
  utt.lang = "en-US";

  s.speak(utt);
}

export function cancelAnnouncement() {
  getSynth()?.cancel();
}
