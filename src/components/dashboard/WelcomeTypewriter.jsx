import { useState, useEffect, useRef } from "react";

// "Welcome back, {name}" in various languages, keeping the name intact at the end
const GREETINGS = [
  { lang: "English",    template: "Welcome back, " },
  { lang: "Spanish",    template: "Bienvenido de nuevo, " },
  { lang: "French",     template: "Bon retour, " },
  { lang: "Japanese",   template: "おかえりなさい、" },
  { lang: "Arabic",     template: "مرحباً بعودتك، " },
  { lang: "Portuguese", template: "Bem-vindo de volta, " },
  { lang: "German",     template: "Willkommen zurück, " },
  { lang: "Korean",     template: "다시 오신 것을 환영합니다, " },
  { lang: "Italian",    template: "Bentornato, " },
  { lang: "Swahili",    template: "Karibu tena, " },
  { lang: "Chinese",    template: "欢迎回来，" },
  { lang: "Hindi",      template: "वापस स्वागत है, " },
  { lang: "Russian",    template: "С возвращением, " },
  { lang: "Turkish",    template: "Tekrar hoş geldin, " },
  { lang: "Yoruba",     template: "E kaabọ pada, " },
];

// Spray-paint style: each letter pops in with a slight random offset/rotation then settles
function SprayLetter({ char, delay, color }) {
  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(false);

  const randX = (Math.random() - 0.5) * 14;
  const randY = (Math.random() - 0.5) * 14;
  const randR = (Math.random() - 0.5) * 30;
  const randS = 0.4 + Math.random() * 0.6;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setSettled(true), delay + 120);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  if (!visible) return <span style={{ display: "inline-block", opacity: 0 }}>{char === " " ? "\u00A0" : char}</span>;

  return (
    <span
      style={{
        display: "inline-block",
        color,
        transform: settled
          ? "translate(0,0) rotate(0deg) scale(1)"
          : `translate(${randX}px, ${randY}px) rotate(${randR}deg) scale(${randS})`,
        opacity: settled ? 1 : 0.6,
        transition: "transform 0.18s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.15s ease",
        textShadow: settled ? `0 0 12px ${color}55` : "none",
        whiteSpace: "pre",
      }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  );
}

const COLORS = [
  "#f59e0b", "#10b981", "#3b82f6", "#ec4899",
  "#8b5cf6", "#f97316", "#06b6d4", "#84cc16",
];

export default function WelcomeTypewriter({ firstName }) {
  const [greetingIdx, setGreetingIdx] = useState(() => Math.floor(Math.random() * GREETINGS.length));
  const [displayedLetters, setDisplayedLetters] = useState([]);
  const [langLabel, setLangLabel] = useState("");
  const intervalRef = useRef(null);

  const name = firstName || "User";

  useEffect(() => {
    const idx = Math.floor(Math.random() * GREETINGS.length);
    setGreetingIdx(idx);
    const fullText = GREETINGS[idx].template + name;
    setLangLabel(GREETINGS[idx].lang);
    setDisplayedLetters([]);

    // Pick a random color palette for this greeting
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(intervalRef.current);
        return;
      }
      const charIndex = i;
      setDisplayedLetters(prev => [
        ...prev,
        { char: fullText[charIndex], color, delay: 0 }
      ]);
      i++;
    }, 60);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // only on mount

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold tracking-tight" style={{ minHeight: "2.5rem" }}>
        {displayedLetters.map((l, i) => (
          <SprayLetter key={i} char={l.char} delay={0} color={l.color} />
        ))}
        {displayedLetters.length === 0 && <span className="opacity-0">.</span>}
      </h1>
      {langLabel && (
        <p className="text-xs text-muted-foreground/60 mt-0.5 italic">in {langLabel}</p>
      )}
      <p className="text-muted-foreground mt-1">Here's your financial overview</p>
    </div>
  );
}