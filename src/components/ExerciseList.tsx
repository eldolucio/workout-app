"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  completedSets?: number;
}

interface Props {
  exercises: Exercise[];
  activeIndex: number;
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    padding: "1rem",
  },
  card: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
  },
  info: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  name: {
    fontFamily: "Barlow Condensed",
    fontSize: "1rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  meta: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressText: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#c8f135",
  },
};

export default function ExerciseList({ exercises, activeIndex }: Props) {
  return (
    <div style={styles.container}>
      {exercises.map((ex, idx) => {
        const isActive = idx === activeIndex;
        const isDone = (ex.completedSets || 0) >= ex.sets;
        const color = isActive ? "#c8f135" : "#222";

        return (
          <div key={ex.id} style={{ ...styles.card, borderColor: color, opacity: isDone ? 0.5 : 1 }}>
            <div style={styles.info}>
              <span style={styles.name}>{ex.name}</span>
              <span style={styles.meta}>
                {ex.muscle_group} • {ex.sets}x{ex.reps}
              </span>
            </div>
            <div style={styles.status}>
              <span style={styles.progressText}>
                {ex.completedSets || 0}/{ex.sets}
              </span>
              {isDone ? (
                <CheckCircle2 color="#c8f135" size={20} />
              ) : (
                <Circle color={isActive ? "#c8f135" : "#222"} size={20} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
