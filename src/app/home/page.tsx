"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import ErrorMessage from "@/components/ErrorMessage";
import { Profile, TrainingDay, WorkoutSession } from "@/types";
import { PlayCircle, Clock, Dumbbell, ChevronRight, LogOut, User, Flame } from "lucide-react";
import { getLevelProgress, getLevelTitle } from "@/lib/gamification";

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1.5rem 80px 1.5rem",
  },
  header: {
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column" as const,
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
  avatarDropdownContainer: {
    position: "relative" as const,
  },
  headerAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#1e1e1e",
    border: "2px solid #2a2a2a",
    color: "#c8f135",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Barlow Condensed, sans-serif",
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  dropdownMenu: {
    position: "absolute" as const,
    top: "50px",
    right: 0,
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "6px",
    minWidth: "160px",
    zIndex: 10,
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  dropdownItem: {
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#e0e0e0",
    fontSize: "13px",
    fontFamily: "Barlow, sans-serif",
    cursor: "pointer",
    borderRadius: "6px",
  },
  dropdownDivider: {
    height: "1px",
    background: "#1e1e1e",
    margin: "4px 0",
  },
  modalOverlay: { position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#161616", border: "1px solid #222", borderRadius: "16px", padding: "24px 20px", maxWidth: "320px", width: "90%", textAlign: "center" as const },
  modalPrimary: { background: "#E24B4A", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "16px" },
  modalGhost: { background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "13px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "8px" },
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
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getWeekday = () => {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date());
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (prof) {
          if (prof.avatar_url) {
            prof.avatar_url = `${prof.avatar_url}${prof.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          }
          setProfile(prof);
        }

        // Fetch User Stats (Gamification)
        const { data: st } = await supabase.from("user_stats").select("*").eq("user_id", user.id).single();
        if (st) setUserStats(st);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;

  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : "AA";

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.greeting}>Olá, {profile?.name || "atleta"}</span>
          <span style={styles.weekday}>{getWeekday()}</span>
        </div>
        <div style={styles.avatarDropdownContainer} ref={menuRef}>
          <div style={styles.headerAvatar} onClick={() => setMenuOpen(!menuOpen)}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="User" style={styles.headerAvatarImage} />
            ) : (
              initials
            )}
          </div>
          {menuOpen && (
            <div style={styles.dropdownMenu}>
              <div style={styles.dropdownItem} onClick={() => router.push("/perfil")}>
                <User size={16} /> Ver perfil
              </div>
              <div style={styles.dropdownDivider} />
              <div style={{ ...styles.dropdownItem, color: "#E24B4A" }} onClick={() => setLogoutModal(true)}>
                <LogOut size={16} /> Sair
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Gamification Widget */}
      {userStats && (
        <div 
          onClick={() => router.push("/conquistas")}
          style={{
            background: "#161616",
            border: "1px solid #222",
            borderRadius: "14px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            margin: "0 20px 24px 20px",
            cursor: "pointer"
          }}
        >
          {(() => {
            const progress = getLevelProgress(userStats.xp_total || 0);
            return (
              <>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "2px solid #c8f135",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#0a0a0a"
                }}>
                  <span style={{ fontSize: "7px", color: "#555", fontWeight: 800 }}>LVL</span>
                  <span style={{ fontSize: "18px", color: "#c8f135", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, marginTop: "-5px" }}>
                    {progress.level}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase" }}>
                      {getLevelTitle(progress.level)}
                    </span>
                    <span style={{ color: "#555", fontSize: "11px" }}>
                      {userStats.xp_total || 0} XP
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "#0a0a0a", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#c8f135", width: `${progress.percent}%` }} />
                  </div>
                </div>

                <div style={{ textAlign: "right", borderLeft: "1px solid #222", paddingLeft: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                    <span style={{ color: "#c8f135", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "18px" }}>
                      {userStats.streak_days || 0}
                    </span>
                    <Flame size={16} color="#c8f135" />
                  </div>
                  <span style={{ color: "#444", fontSize: "9px", textTransform: "uppercase", fontWeight: 800 }}>Dias</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

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

      {logoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <LogOut size={32} color="#E24B4A" style={{ margin: "auto", marginBottom: "12px" }} />
            <h2 style={{ color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "20px", margin: 0 }}>SAIR DO APP?</h2>
            <p style={{ color: "#555", fontFamily: "Barlow, sans-serif", fontSize: "13px", margin: "8px 0 20px 0" }}>
              Você precisará fazer login novamente para acessar seus treinos.
            </p>
            <button style={styles.modalPrimary} onClick={handleLogout}>SAIR</button>
            <button style={styles.modalGhost} onClick={() => setLogoutModal(false)}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
