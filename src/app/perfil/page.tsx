"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import heic2any from "heic2any";
import { Camera, Lock, ClipboardList, History, LogOut, ArrowLeft, Bell, User, Trophy } from "lucide-react";

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

        const [profRes, statsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("user_stats").select("*").eq("user_id", user.id).single()
        ]);

        if (profRes.data) {
          const prof = profRes.data;
          if (prof.avatar_url) {
            prof.avatar_url = `${prof.avatar_url}${prof.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          }
          setProfile(prof);
        }

        // Fetch counts for dashboard
        const { count: sessionCount } = await supabase.from("workout_sessions").select("id", { count: "exact" }).eq("user_id", user.id);
        const { count: fichasCount } = await supabase.from("training_sheets").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_active", true);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: weekCount } = await supabase.from("workout_sessions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("started_at", sevenDaysAgo.toISOString());

        setStats({
          treinos: sessionCount || 0,
          semana: weekCount || 0,
          fichas: fichasCount || 0,
          sequencia: statsRes.data?.streak_days || 0
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
    let file = e.target.files?.[0];
    if (!file || !userAuth) return;

    setUploadingAvatar(true);
    setErrorMsg(null);

    if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
      try {
        const convertedBlob = await heic2any({ 
          blob: file, 
          toType: "image/jpeg",
          quality: 0.8 
        });
        const converted = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        file = new File([converted], "avatar.jpg", { type: "image/jpeg" });
      } catch (convErr) {
        console.error('[perfil] conversion error:', convErr);
      }
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Imagem muito grande. Máximo 2MB.");
      setUploadingAvatar(false);
      return;
    }

    const path = `${userAuth.id}/avatar.jpg`;
    await supabase.storage.from("avatars").remove([path]);
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (uploadError) {
      setErrorMsg(`Erro no Storage: ${uploadError.message}`);
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
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
          <span style={styles.statLabel}>Total Treinos</span>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statNumber, color: '#c8f135'}}>{stats.sequencia}</span>
          <span style={styles.statLabel}>Sequência Dias</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{stats.fichas}</span>
          <span style={styles.statLabel}>Fichas Ativas</span>
        </div>
        <div style={{...styles.statCard, cursor: 'pointer'}} onClick={() => router.push("/conquistas")}>
          <Trophy size={20} color="#555" />
          <span style={styles.statLabel}>Conquistas</span>
        </div>
      </div>

      <div style={styles.menuList}>
        <div style={styles.menuItem} onClick={() => router.push("/perfil/editar")}>
          <User size={18} color="#555" />
          <span style={styles.menuText}>Editar Perfil</span>
          <span style={styles.chevron}>›</span>
        </div>
        <div style={styles.menuItem} onClick={() => router.push("/perfil/notificacoes")}>
          <Bell size={18} color="#555" />
          <span style={styles.menuText}>Notificações e PWA</span>
          <span style={styles.chevron}>›</span>
        </div>
        {!isGoogle && (
          <div style={styles.menuItem} onClick={() => router.push("/perfil/senha")}>
            <Lock size={18} color="#555" />
            <span style={styles.menuText}>Alterar Senha</span>
            <span style={styles.chevron}>›</span>
          </div>
        )}
        <div style={styles.menuItem} onClick={() => router.push("/fichas")}>
          <ClipboardList size={18} color="#555" />
          <span style={styles.menuText}>Gerenciar Fichas</span>
          <span style={styles.chevron}>›</span>
        </div>
        <div style={{...styles.menuItem, borderBottom: "none"}} onClick={() => router.push("/home")}>
          <History size={18} color="#555" />
          <span style={styles.menuText}>Histórico Recente</span>
          <span style={styles.chevron}>›</span>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <button style={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
          <LogOut size={16} /> SAIR DO APP
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
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px" },
  backBtn: { display: "flex", alignItems: "center", gap: "4px", color: "#555", background: "none", border: "none", fontSize: "14px", fontFamily: "Barlow, sans-serif", cursor: "pointer", width: 60, padding: 0 },
  pageTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "16px", textTransform: "uppercase" as const },
  avatarSection: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "10px 20px 28px" },
  avatarContainer: { position: "relative" as const, width: "88px", height: "88px" },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" as const, borderRadius: "50%", border: "2px solid #222" },
  avatarPlaceholder: { width: "100%", height: "100%", background: "#1e1e1e", borderRadius: "50%", border: "2px solid #2a2a2a", color: "#c8f135", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "28px" },
  cameraBtn: { position: "absolute" as const, bottom: 0, right: 0, width: "26px", height: "26px", background: "#c8f135", border: "2px solid #0a0a0a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 },
  userName: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "22px", marginTop: "12px", textTransform: "uppercase" as const },
  userEmail: { color: "#555", fontFamily: "Barlow, sans-serif", fontSize: "13px", marginTop: "4px" },
  badge: { marginTop: "10px", background: "#1a1a1a", border: "1px solid #222", borderRadius: "4px", color: "#888", padding: "3px 8px", fontSize: "10px", fontFamily: "Barlow, sans-serif", textTransform: "uppercase" as const },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "0 20px", marginBottom: "20px" },
  statCard: { background: "#161616", border: "1px solid #222", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  statNumber: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "24px" },
  statLabel: { color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" as const, marginTop: "4px" },
  menuList: { background: "#161616", border: "1px solid #222", borderRadius: "14px", margin: "0 20px 24px", overflow: "hidden" },
  menuItem: { padding: "16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #1a1a1a", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left" as const },
  menuText: { color: "#ccc", fontSize: "14px", fontFamily: "Barlow, sans-serif", flex: 1 },
  chevron: { color: "#333", fontSize: "18px" },
  logoutBtn: { width: "100%", padding: "14px", background: "transparent", border: "1px solid #2a1a1a", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#E24B4A", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer" },
  deleteSection: { textAlign: "center" as const, marginTop: "20px" },
  deleteLink: { fontSize: "11px", color: "#333", fontFamily: "Barlow, sans-serif", cursor: "pointer", textDecoration: "underline" },
  errorBubble: { background: "#2a1a1a", border: "1px solid #E24B4A", borderRadius: "8px", padding: "12px", color: "#E24B4A", fontSize: "13px", margin: "0 20px 20px", textAlign: "center" as const },
  modalOverlay: { position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#161616", border: "1px solid #222", borderRadius: "20px", padding: "28px 20px", maxWidth: "320px", width: "90%", textAlign: "center" as const },
  modalTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "20px", margin: 0 },
  modalText: { color: "#888", fontFamily: "Barlow, sans-serif", fontSize: "13px", margin: "10px 0 24px 0", lineHeight: "1.5" },
  modalPrimary: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, cursor: "pointer" },
  modalGhost: { background: "transparent", color: "#555", border: "none", padding: "10px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "14px", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "4px" }
};
