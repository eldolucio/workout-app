"use client";

import { Plus, Minus } from "lucide-react";

interface ControlProps {
  label: string;
  value: number;
  suffix?: string;
  onChange: (val: number) => void;
  step?: number;
}

const styles = {
  container: {
    display: "flex",
    gap: "1rem",
    width: "100%",
    justifyContent: "space-between",
  },
  block: {
    flex: 1,
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
  },
  label: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  valueContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  value: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#f0f0f0",
    minWidth: "3ch",
    textAlign: "center" as const,
  },
  btn: {
    background: "#c8f135",
    color: "#0a0a0a",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

const Control = ({ label, value, suffix, onChange, step = 1 }: ControlProps) => (
  <div style={styles.block}>
    <span style={styles.label}>{label}</span>
    <div style={styles.valueContainer}>
      <button style={styles.btn} onClick={() => onChange(Math.max(0, value - step))}>
        <Minus size={16} />
      </button>
      <span style={styles.value}>
        {value}
        {suffix && <span style={{ fontSize: "0.75rem", marginLeft: "2px" }}>{suffix}</span>}
      </span>
      <button style={styles.btn} onClick={() => onChange(value + step)}>
        <Plus size={16} />
      </button>
    </div>
  </div>
);

interface Props {
  reps: number;
  weight: number;
  onRepsChange: (val: number) => void;
  onWeightChange: (val: number) => void;
}

export default function SetControls({ reps, weight, onRepsChange, onWeightChange }: Props) {
  return (
    <div style={styles.container}>
      <Control label="Peso" value={weight} suffix="kg" onChange={onWeightChange} step={2} />
      <Control label="Reps" value={reps} onChange={onRepsChange} step={1} />
    </div>
  );
}
