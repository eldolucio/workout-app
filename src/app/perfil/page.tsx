"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import Image from "next/image";
import { Camera, Edit2, Lock, ClipboardList, History, LogOut, ArrowLeft } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [stats, setStats] = useState({
    treinos: 0,
    semana: 0,
    fichas: 0,
    sequencia: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");
        setUserAuth(user);

        const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (prof) setProfile(prof);

        // Fetch stats
        const { count: sessionCount } = await supabase.from("workout_sessions").select("id", { count: "exact" }).eq("user_id", user.id);
        const { count: fichasCount } = await supabase.from("training_sheets").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_active", true);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: weekCount } = await supabase.from("workout_sessions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("started_at", sevenDaysAgo.toISOString());

        // Basic sequence implementation (placeholder logic or simplified for now)
        const { data: allSessions } = await supabase.from("workout_sessions").select("started_at").eq("user_id", user.id).order("started_at", { ascending: false });
        let sequence = 0;
        if (allSessions && allSessions.length > 0) {
           sequence = allSessions.length > 0 ? 1 : 0; // naive sequence computation
        }

        setStats({
          treinos: sessionCount || 0,
          semana: weekCount || 0,
          fichas: fichasCount || 0,
          sequencia: sequence
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userAuth) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Imagem muito grande. Máximo 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Selecione uma imagem válida.");
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);
    const ext = file.name.split(".").pop();
    const path = `${userAuth.id}/avatar.${ext}`;

    await supabase.storage.from("avatars").remove([
      `${userAuth.id}/avatar.jpg`,
      `${userAuth.id}/avatar.png`,
      `${userAuth.id}/avatar.webp`
    ]);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setErrorMsg("Erro ao salvar foto.");
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    // Force public bypass cache by appending timestamp
    const cUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userAuth.id);
    setProfile((prev: any) => ({ ...prev, avatar_url: cUrl }));
    setUploadingAvatar(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;

  const isGoogle = userAuth?.app_metadata?.provider === "google";
  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : "AA";

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>MEU PERFIL</span>
        <div style={{ width: 60 }} />
      </header>

      {errorMsg && <div style={styles.errorBubble}>{errorMsg}</div>}

      <div style={styles.avatarSection}>
        <div style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" style={styles.avatarImage} />
          ) : (
            <div style={styles.avatarPlaceholder}>{initials}</div>
          )}
          <button style={styles.cameraBtn} onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
            <Camera size={12} color="#0a0a0a" />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <h2 style={styles.userName}>{profile?.name || "Atleta Sem Nome"}</h2>
        <p style={styles.userEmail}>{userAuth?.email}</p>
        <div style={styles.badge}>
          {isGoogle ? "Conta Google" : "Conta com e-mail"}
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{stats.treinos}</span>
          <span style={styles.statLabel}>Total de Treinos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{stats.semana}</span>
          <span style={styles.statLabel}>Semana Atual</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{stats.sequencia}</span>
          <span style={styles.statLabel}>Sequência Dias</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{stats.fichas}</span>
          <span style={styles.statLabel}>Fichas Ativas</span>
        </div>
      </div>

      <div style={styles.menuList}>
        <div style={styles.menuItem} onClick={() => router.push("/perfil/editar")}>
          <Edit2 size={18} color="#555" />
          <span style={styles.menuText}>Editar perfil</span>
          <span style={styles.chevron}>›</span>
        </div>
        {!isGoogle && (
          <div style={styles.menuItem} onClick={() => router.push("/perfil/senha")}>
            <Lock size={18} color="#555" />
            <span style={styles.menuText}>Alterar senha</span>
            <span style={styles.chevron}>›</span>
          </div>
        )}
        <div style={styles.menuItem} onClick={() => router.push("/fichas")}>
          <ClipboardList size={18} color="#555" />
          <span style={styles.menuText}>Minhas fichas</span>
          <span style={styles.chevron}>›</span>
        </div>
        <div style={{...styles.menuItem, borderBottom: "none"}} onClick={() => router.push("/home")}>
          <History size={18} color="#555" />
          <span style={styles.menuText}>Histórico de treinos</span>
          <span style={styles.chevron}>›</span>
        </div>
      </div>

      <div style={{ margin: "0 20px 16px" }}>
        <button style={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
          <LogOut size={18} color="#E24B4A" />
          SAIR DO APP
        </button>
      </div>

      <div style={styles.deleteSection}>
        <span style={styles.deleteLink} onClick={() => router.push("/perfil/excluir")}>
          Excluir minha conta
        </span>
      </div>

      <NavBar />

      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <LogOut size={32} color="#E24B4A" style={{ marginBottom: "12px" }} />
            <h2 style={styles.modalTitle}>SAIR DO APP?</h2>
            <p style={styles.modalText}>Você precisará fazer login novamente para acessar seus treinos.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button style={styles.modalPrimary} onClick={handleLogout}>Sair</button>
              <button style={styles.modalGhost} onClick={() => setShowLogoutModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", maxWidth: "430px", margin: "auto", paddingBottom: "100px", display: "flex", flexDirection: "column" as const },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" },
  backBtn: { display: "flex", alignItems: "center", gap: "4px", color: "#555", background: "none", border: "none", fontSize: "14px", fontFamily: "Barlow, sans-serif", cursor: "pointer", width: 60, padding: 0 },
  pageTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "16px", textTransform: "uppercase" as const },
  avatarSection: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "28px 20px" },
  avatarContainer: { position: "relative" as const, width: "88px", height: "88px" },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" as const, borderRadius: "50%", border: "2px solid #222" },
  avatarPlaceholder: { width: "100%", height: "100%", background: "#1e1e1e", borderRadius: "50%", border: "2px solid #2a2a2a", color: "#c8f135", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "28px" },
  cameraBtn: { position: "absolute" as const, bottom: 0, right: 0, width: "26px", height: "26px", background: "#c8f135", border: "2px solid #0a0a0a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 },
  userName: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "22px", marginTop: "12px", textTransform: "uppercase" as const },
  userEmail: { color: "#555", fontFamily: "Barlow, sans-serif", fontSize: "13px", marginTop: "4px" },
  badge: { marginTop: "10px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#888", padding: "3px 8px", fontSize: "11px", fontFamily: "Barlow, sans-serif" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "0 20px", marginBottom: "20px" },
  statCard: { background: "#161616", border: "1px solid #222", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  statNumber: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "26px" },
  statLabel: { color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" as const, marginTop: "4px", letterSpacing: ".06em" },
  menuList: { background: "#161616", border: "1px solid #222", borderRadius: "14px", margin: "0 20px 16px", overflow: "hidden" },
  menuItem: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #1a1a1a", cursor: "pointer" },
  menuText: { color: "#e0e0e0", fontSize: "14px", fontFamily: "Barlow, sans-serif", flex: 1 },
  chevron: { color: "#333", fontSize: "18px", paddingBottom: "2px" },
  logoutBtn: { width: "100%", padding: "14px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#E24B4A", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: ".08em", cursor: "pointer" },
  deleteSection: { textAlign: "center" as const, marginBottom: "20px" },
  deleteLink: { fontSize: "12px", color: "#333", fontFamily: "Barlow, sans-serif", cursor: "pointer", textDecoration: "underline" },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px", margin: "0 20px" },
  modalOverlay: { position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#161616", border: "1px solid #222", borderRadius: "16px", padding: "24px 20px", maxWidth: "320px", width: "90%", textAlign: "center" as const },
  modalTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "20px", margin: 0 },
  modalText: { color: "#555", fontFamily: "Barlow, sans-serif", fontSize: "13px", margin: "8px 0 20px 0", lineHeight: "1.5" },
  modalPrimary: { background: "#E24B4A", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, cursor: "pointer" },
  modalGhost: { background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "13px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, cursor: "pointer" }
};
