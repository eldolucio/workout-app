"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import { WorkoutSession } from "@/types";
import { History, Calendar, Clock, ChevronRight, Dumbbell } from "lucide-react";

export default function HistoricoPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("workout_sessions")
          .select(`
            id,
            started_at,
            finished_at,
            notes,
            training_days (
              label,
              focus
            )
          `)
          .eq("user_id", user.id)
          .order("started_at", { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [router]);

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <History size={28} color="#c8f135" />
        <h1 style={styles.title}>Meu Histórico</h1>
        <p style={styles.subtitle}>{history.length} treinos concluídos</p>
      </header>

      <div style={styles.list}>
        {history.length > 0 ? history.map((session: any) => (
          <div key={session.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.iconBox}>
                <Dumbbell size={18} color="#c8f135" />
              </div>
              <div style={styles.info}>
                <span style={styles.workoutName}>
                  {session.training_days?.label || "Treino"}
                </span>
                <span style={styles.workoutFocus}>
                  {session.training_days?.focus || "Geral"}
                </span>
              </div>
              <div style={styles.dateBadge}>
                {new Date(session.started_at).toLocaleDateString()}
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.footer}>
              <div style={styles.meta}>
                <Calendar size={12} />
                <span>{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {session.finished_at && (
                <div style={styles.meta}>
                  <Clock size={12} />
                  <span>
                    {Math.floor((new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min
                  </span>
                </div>
              )}
              <ChevronRight size={16} color="#333" style={{ marginLeft: "auto" }} />
            </div>
          </div>
        )) : (
          <div style={styles.empty}>
            <History size={48} color="#222" />
            <p>Você ainda não realizou nenhum treino.</p>
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1.5rem 100px 1.5rem",
  },
  header: {
    marginBottom: "2.5rem",
    textAlign: "center" as const,
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#f0f0f0",
    textTransform: "uppercase" as const,
    margin: "12px 0 4px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontFamily: "Barlow",
    fontSize: "0.875rem",
    color: "#555",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  card: {
    background: "#161616",
    borderRadius: "20px",
    border: "1px solid #222",
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #222",
  },
  info: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
  },
  workoutName: {
    fontFamily: "Barlow Condensed",
    color: "#f0f0f0",
    fontWeight: 800,
    fontSize: "1rem",
    textTransform: "uppercase" as const,
  },
  workoutFocus: {
    fontFamily: "Barlow",
    color: "#555",
    fontSize: "0.75rem",
  },
  dateBadge: {
    fontSize: "10px",
    color: "#c8f135",
    background: "rgba(200, 241, 53, 0.1)",
    padding: "4px 8px",
    borderRadius: "6px",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
  },
  divider: {
    height: "1px",
    background: "#222",
    width: "100%",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#444",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.75rem",
    fontFamily: "Barlow",
  },
  empty: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "16px",
    color: "#333",
    fontFamily: "Barlow",
  }
};
