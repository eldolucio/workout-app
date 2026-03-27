"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ErrorMessage from "@/components/ErrorMessage";
import { Profile, TrainingDay, WorkoutSession } from "@/types";
import { PlayCircle, Clock, Dumbbell, ChevronRight } from "lucide-react";

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1.5rem 80px 1.5rem",
  },
  header: {
    marginBottom: "2rem",
  },
  greeting: {
    fontFamily: "Barlow",
    fontSize: "1.25rem",
    color: "#f0f0f0",
  },
  weekday: {
    fontFamily: "Barlow Condensed",
    color: "#c8f135",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    fontSize: "2rem",
    marginTop: "4px",
    display: "block",
  },
  highlightCard: {
    background: "#161616",
    borderRadius: "20px",
    border: "1px solid #222",
    padding: "1.5rem",
    marginBottom: "2rem",
    position: "relative" as const,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    width: "40%",
    height: "100%",
    background: "linear-gradient(90deg, transparent 0%, rgba(200, 241, 53, 0.05) 100%)",
  },
  cardTitle: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  cardMeta: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#555",
    fontSize: "0.75rem",
    fontFamily: "Barlow",
  },
  startBtn: {
    background: "#c8f135",
    color: "#0a0a0a",
    marginTop: "1.5rem",
    padding: "0.875rem 1.5rem",
    borderRadius: "14px",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "1rem",
    textTransform: "uppercase" as const,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
  },
  sectionTitle: {
    fontFamily: "Barlow Condensed",
    fontSize: "1rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#555",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBarContainer: {
    background: "#161616",
    height: "10px",
    borderRadius: "5px",
    marginBottom: "2rem",
    overflow: "hidden",
  },
  progressBar: {
    background: "#c8f135",
    height: "100%",
    borderRadius: "5px",
    transition: "width 0.5s ease",
  },
  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  historyItem: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  historyName: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.875rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  historyDate: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
  },
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextWorkout, setNextWorkout] = useState<TrainingDay | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getWeekday = () => {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Profile
        const { data: prof, error: profError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profError) {
          console.error('[supabase] profiles.select:', profError.message);
        } else {
          setProfile(prof);
        }

        // Next Workout (Training Day)
        const { data: sheet, error: sheetError } = await supabase.from("training_sheets").select("id").eq("user_id", user.id).eq("is_active", true).single();
        if (sheetError) console.error('[supabase] training_sheets.select:', sheetError.message);
        
        if (sheet) {
          const { data: days, error: daysError } = await supabase.from("training_days").select("*, exercises(count)").eq("sheet_id", sheet.id).order("order_index", { ascending: true }).limit(1);
          if (daysError) console.error('[supabase] training_days.select:', daysError.message);
          if (days && days[0]) setNextWorkout(days[0]);
        }

        // History
        const { data: hist, error: histError } = await supabase.from("workout_sessions").select("*, training_days(label)").eq("user_id", user.id).order("started_at", { ascending: false }).limit(3);
        if (histError) {
          console.error('[supabase] workout_sessions.select:', histError.message);
        } else {
          setHistory(hist || []);
        }
      } catch (e) {
         setErrorMsg(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleStartWorkout = async () => {
    if (!nextWorkout) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        training_day_id: nextWorkout.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[supabase] insert workout session:', error.message);
      setErrorMsg(error.message);
      return;
    }

    if (session) {
      router.push(`/treino/${session.id}`);
    }
  };

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.greeting}>Olá, {profile?.name || "atleta"}</span>
        <span style={styles.weekday}>{getWeekday()}</span>
      </header>

      {errorMsg && <ErrorMessage message={errorMsg} />}

      {nextWorkout ? (
        <div style={styles.highlightCard}>
          <div style={styles.cardAccent} />
          <h2 style={styles.cardTitle}>{nextWorkout.label || "PRÓXIMO TREINO"}</h2>
          <div style={styles.cardMeta}>
            <div style={styles.metaItem}>
              <Dumbbell size={14} /> <span>{nextWorkout.focus || "Geral"}</span>
            </div>
            <div style={styles.metaItem}>
              <Clock size={14} /> <span>45-60 min</span>
            </div>
          </div>
          <button style={styles.startBtn} onClick={handleStartWorkout}>
            <PlayCircle size={20} /> INICIAR TREINO
          </button>
        </div>
      ) : (
        <div style={styles.highlightCard}>
           <h2 style={styles.cardTitle}>Nenhuma ficha ativa</h2>
           <button style={styles.startBtn} onClick={() => router.push('/fichas/importar')}>
             Importar Ficha
           </button>
        </div>
      )}

      <div style={styles.sectionTitle}>
        Progresso Semanal
        <span style={{ color: "#c8f135" }}>3 / 5</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div style={{ ...styles.progressBar, width: "60%" }} />
      </div>

      <div style={styles.sectionTitle}>
        Atividade Recente
        <ChevronRight size={16} />
      </div>
      <div style={styles.historyList}>
        {history.length > 0 ? history.map((h) => (
          <div key={h.id} style={styles.historyItem}>
            <div style={styles.historyInfo}>
              <span style={styles.historyName}>{h.training_days?.label || "Treino"}</span>
              <span style={styles.historyDate}>
                {new Date(h.started_at).toLocaleDateString()} • {h.notes || "Concluído"}
              </span>
            </div>
            <ChevronRight size={18} color="#222" />
          </div>
        )) : <p style={{ color: "#555", fontSize: "0.875rem" }}>Nenhum treino registrado ainda.</p>}
      </div>

      <NavBar />
    </div>
  );
}
