"use client";

function scoreColor(score: number): string {
  if (score >= 80) return "rgb(var(--scanza-success))";
  if (score >= 60) return "rgb(var(--scanza-warning))";
  return "rgb(var(--scanza-danger))";
}

export default function ScoreGauge({ score, size = 140, label }: { score: number; size?: number; label?: string }) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="scanza-score-gauge relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgb(var(--scanza-border))" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-bold text-scanza-text">{score}</span>
        <span className="text-xs text-scanza-text-muted">{label ?? "/ 100"}</span>
      </div>
    </div>
  );
}
