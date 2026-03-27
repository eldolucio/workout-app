"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import SetControls from "@/components/SetControls";
import ExerciseList from "@/components/ExerciseList";
import ErrorMessage from "@/components/ErrorMessage";
import { WorkoutSession, Exercise, SessionSet, TrainingDay } from "@/types";
import { Check, Timer } from "lucide-react";
import dynamic from "next/dynamic";

const ExerciseAnimation = dynamic(
  () => import("@/components/ExerciseAnimation"),
  { ssr: false, loading: () => <span style={{ color: '#555', fontFamily: 'Barlow Condensed' }}>Carregando animação...</span> }
);

const RestTimer = dynamic(
  () => import("@/components/RestTimer"),
  { ssr: false, loading: () => <span style={{ color: '#555', fontFamily: 'Barlow Condensed' }}>Carregando timer...</span> }
);

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "1rem 1rem 120px 1rem",
    fontFamily: "Barlow",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  workoutTitle: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.25rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  sessionTimer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#c8f135",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "1rem",
  },
  progressLabel: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
    marginBottom: "4px",
    display: "block",
  },
  progressContainer: {
    background: "#161616",
    height: "10px",
    borderRadius: "5px",
    marginBottom: "1.5rem",
    overflow: "hidden",
  },
  progressBar: {
    background: "#c8f135",
    height: "100%",
    borderRadius: "5px",
    transition: "width 0.3s ease",
  },
  activeCard: {
    background: "#161616",
    borderRadius: "20px",
    border: "1px solid #222",
    padding: "1.5rem",
    position: "relative" as const,
    marginBottom: "2rem",
  },
  exerciseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  exerciseName: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#c8f135",
    cursor: "pointer",
  },
  muscleGroup: {
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  prescribed: {
    fontSize: "0.875rem",
    color: "#f0f0f0",
    fontWeight: 600,
  },
  setInfoBadge: {
    background: "#222",
    color: "#f0f0f0",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
  },
  setBoxes: {
    display: "flex",
    gap: "8px",
    margin: "1.5rem 0",
    flexWrap: "wrap" as const,
  },
  setBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
  },
  doneWeight: {
    fontSize: "0.625rem",
    color: "#6a9a20",
    marginTop: "2px",
  },
  actionBtn: {
    width: "100%",
    background: "#c8f135",
    color: "#0a0a0a",
    fontFamily: "Barlow Condensed",
    fontWeight: 800,
    fontSize: "1.125rem",
    padding: "1rem",
    borderRadius: "14px",
    textTransform: "uppercase" as const,
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  modal: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  finishBtn: {
    background: "transparent",
    border: "1px solid #c8f135",
    color: "#c8f135",
    padding: "1rem",
    borderRadius: "14px",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "1rem",
    width: "100%",
    marginTop: "1rem",
  },
};

export default function WorkoutSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  
  const [session, setSession] = useState<(WorkoutSession & { training_days: TrainingDay | null }) | null>(null);
  const [exercises, setExercises] = useState<(Exercise & { completedSets: number })[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentReps, setCurrentReps] = useState(12);
  const [currentWeight, setCurrentWeight] = useState(20);
  const [elapsed, setElapsed] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [completedSetsInActive, setCompletedSetsInActive] = useState<SessionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: sess, error: sessError } = await supabase.from("workout_sessions").select("*, training_days(*)").eq("id", sessionId).single();
        if (sessError) {
          console.error('[supabase] workout_sessions.select:', sessError.message);
          throw new Error('Falha ao carregar sessão.');
        }

        if (sess) {
          setSession(sess);
          const { data: exers, error: exersError } = await supabase.from("exercises").select("*").eq("day_id", sess.training_day_id).order("order_index", { ascending: true });
          if (exersError) {
             console.error('[supabase] exercises.select:', exersError.message);
             throw new Error('Falha ao carregar exercícios.');
          }
          
          setExercises(exers || []);

          // Load existing sets for this session
          const { data: existingSets, error: setsError } = await supabase.from("session_sets").select("*").eq("session_id", sessionId);
          if (setsError) {
             console.error('[supabase] session_sets.select:', setsError.message);
          }
          
          const enriched = exers?.map(ex => ({
            ...ex,
            completedSets: existingSets?.filter(s => s.exercise_id === ex.id).length || 0
          }));
          
          setExercises(enriched || []);
        }
      } catch (e) {
         setErrorMsg(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [sessionId]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentExercise = exercises[activeIndex];

  useEffect(() => {
    if (currentExercise) {
      setCurrentReps(parseInt(currentExercise.reps) || 12);
      // Logic for weight can be from last session, defaulting to 20
      setCurrentWeight(20);
      
      const fetchCurrentSets = async () => {
        const { data } = await supabase.from("session_sets").select("*").eq("session_id", sessionId).eq("exercise_id", currentExercise.id).order("set_number", { ascending: true });
        setCompletedSetsInActive(data || []);
      };
      fetchCurrentSets();
    }
  }, [activeIndex, currentExercise, sessionId]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCompleteSet = async () => {
    const setNumber = completedSetsInActive.length + 1;
    
    const { data: newSet, error } = await supabase.from("session_sets").insert({
      session_id: sessionId,
      exercise_id: currentExercise.id,
      set_number: setNumber,
      reps_done: currentReps,
      weight_used_kg: currentWeight,
      completed: true,
    }).select().single();

    if (error) {
       console.error('[supabase] session_sets.insert:', error.message);
       setErrorMsg(error.message);
       return;
    }

    if (newSet) {
      const updatedSets = [...completedSetsInActive, newSet];
      setCompletedSetsInActive(updatedSets);
      
      // Update exercises list state
      const newExercises = [...exercises];
      newExercises[activeIndex].completedSets = updatedSets.length;
      setExercises(newExercises);

      if (updatedSets.length >= currentExercise.sets) {
        // Move to next exercise if available
        if (activeIndex < exercises.length - 1) {
          setShowTimer(true);
        } else {
          // Finished all exercises
          alert("Treino Concluído!");
        }
      } else {
        setShowTimer(true);
      }
    }
  };

  const handleTimerFinish = () => {
    setShowTimer(false);
    if (completedSetsInActive.length >= currentExercise.sets && activeIndex < exercises.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const totalPossibleSets = exercises.reduce((acc, curr) => acc + curr.sets, 0);
  const setsDone = exercises.reduce((acc, curr) => acc + (curr.completedSets || 0), 0);
  const progressPercent = totalPossibleSets > 0 ? (setsDone / totalPossibleSets) * 100 : 0;

  if (loading) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.workoutTitle}>{session?.training_days?.label || "TREINO"}</span>
        <div style={styles.sessionTimer}>
          <Timer size={16} />
          <span>{formatTime(elapsed)}</span>
        </div>
      </header>

      {errorMsg && <ErrorMessage message={errorMsg} />}

      <span style={styles.progressLabel}>Progresso da Sessão</span>
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
      </div>

      {currentExercise && (
        <div style={styles.activeCard}>
          <div style={styles.exerciseHeader}>
            <div>
              <h2 style={styles.exerciseName} onClick={() => setShowAnimation(true)}>
                {currentExercise.name}
              </h2>
              <span style={styles.muscleGroup}>{currentExercise.muscle_group}</span>
            </div>
            <div style={styles.setInfoBadge}>
              {setsDone}/{totalPossibleSets} SÉRIES
            </div>
          </div>

          <div style={styles.prescribed}>
            {currentExercise.sets} x {currentExercise.reps} reps
          </div>

          <div style={styles.setBoxes}>
            {Array.from({ length: currentExercise.sets }).map((_, i) => {
              const num = i + 1;
              const isDone = completedSetsInActive.some(s => s.set_number === num);
              const isActive = completedSetsInActive.length === i;
              const completedData = completedSetsInActive.find(s => s.set_number === num);

              return (
                <div
                  key={i}
                  style={{
                    ...styles.setBox,
                    background: isDone ? "#1a2a00" : isActive ? "#c8f135" : "#1a1a1a",
                    color: isActive ? "#0a0a0a" : isDone ? "#c8f135" : "#555",
                    border: isActive ? "none" : "1px solid #222",
                  }}
                >
                  {isDone ? <Check size={18} /> : isActive ? "AGORA" : num}
                  {isDone && <span style={styles.doneWeight}>{completedData?.weight_used_kg}kg</span>}
                </div>
              );
            })}
          </div>

          <SetControls
            reps={currentReps}
            weight={currentWeight}
            onRepsChange={setCurrentReps}
            onWeightChange={setCurrentWeight}
          />

          <button style={styles.actionBtn} onClick={handleCompleteSet}>
            Concluir Série
          </button>
        </div>
      )}

      {showAnimation && (
        <div style={styles.modal} onClick={() => setShowAnimation(false)}>
           <ExerciseAnimation name={currentExercise.name} />
        </div>
      )}

      {showTimer && currentExercise && (
        <RestTimer
          seconds={parseInt(currentExercise.rest_seconds || "60")}
          onSkip={handleTimerFinish}
          onFinish={handleTimerFinish}
        />
      )}

      <ExerciseList exercises={exercises} activeIndex={activeIndex} />

      <button style={styles.finishBtn} onClick={() => router.push("/home")}>
        ENCERRAR TREINO
      </button>
    </div>
  );
}
