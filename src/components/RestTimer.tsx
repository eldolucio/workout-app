"use client";

import { useState, useEffect } from "react";

interface Props {
  seconds: number;
  onSkip: () => void;
  onFinish: () => void;
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(8px)",
  },
  title: {
    color: "#555",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "1rem",
    textTransform: "uppercase" as const,
    marginBottom: "2rem",
    letterSpacing: "0.1em",
  },
  timerContainer: {
    position: "relative" as const,
    width: "240px",
    height: "240px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    fontFamily: "Barlow Condensed",
    fontWeight: 800,
    fontSize: "4.5rem",
    color: "#f0f0f0",
  },
  skipBtn: {
    marginTop: "3rem",
    padding: "0.75rem 2rem",
    border: "1px solid #2a2a2a",
    color: "#555",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderRadius: "14px",
    fontSize: "0.875rem",
  },
  circleBackground: {
    fill: "none",
    stroke: "#161616",
    strokeWidth: "8",
  },
  circleProgress: {
    fill: "none",
    stroke: "#c8f135",
    strokeWidth: "8",
    strokeLinecap: "round" as const,
    transition: "stroke-dashoffset 1s linear",
  },
};

export default function RestTimer({ seconds, onSkip, onFinish }: Props) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const size = 240;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFinish]);

  const offset = circumference - (timeLeft / seconds) * circumference;

  return (
    <div style={styles.overlay}>
      <span style={styles.title}>Descanso</span>
      <div style={styles.timerContainer}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            style={styles.circleBackground}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            style={{
              ...styles.circleProgress,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div style={{ position: "absolute" }}>
          <span style={styles.counter}>{timeLeft}</span>
        </div>
      </div>
      <button style={styles.skipBtn} onClick={onSkip}>
        Pular Descanso
      </button>
    </div>
  );
}
