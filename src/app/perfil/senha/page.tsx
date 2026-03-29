"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function SenhaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailAuth, setEmailAuth] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      
      const isGoogleUser = user?.app_metadata?.provider === "google";
      if (isGoogleUser) {
        alert("Sua senha é gerenciada pelo Google.");
        router.replace("/perfil");
        return;
      }
      setEmailAuth(user.email || "");
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const getStrengthPercent = () => {
    if (newPassword.length === 0) return 0;
    if (newPassword.length < 6) return 33;
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return 66;
    return 100;
  };

  const strength = getStrengthPercent();
  const strengthColor = strength === 33 ? "#E24B4A" : strength === 66 ? "#EF9F27" : strength === 100 ? "#c8f135" : "transparent";
  const strengthText = strength === 33 ? "Fraca" : strength === 66 ? "Média" : "Forte";

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return setErrorMsg("Senha atual é obrigatória.");
    if (newPassword.length < 8) return setErrorMsg("Nova senha muito curta.");
    if (newPassword !== confirm) return setErrorMsg("As novas senhas não coincidem.");
    if (newPassword === currentPassword) return setErrorMsg("A nova senha deve ser diferente da atual.");

    setSaving(true);
    setErrorMsg(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailAuth,
      password: currentPassword
    });

    if (signInError) {
      setErrorMsg("Senha atual incorreta.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg("Erro ao alterar senha.");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/perfil"), 1500);
  };

  if (loading) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/perfil")}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>ALTERAR SENHA</span>
        <div style={{ width: 60 }} />
      </header>

      <form onSubmit={handleChange} style={styles.formSection}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Senha atual</label>
          <input type="password" style={styles.input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        <div style={{ margin: "10px 0", height: "1px", background: "#1a1a1a" }} />

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Nova senha</label>
          <input type="password" style={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div style={styles.strengthTracker}>
            <div style={{ width: "100%", height: "3px", background: "#1e1e1e", borderRadius: "3px" }}>
              <div style={{ width: `${strength}%`, height: "100%", background: strengthColor, transition: "all 0.3s", borderRadius: "3px" }} />
            </div>
            {strength > 0 && <span style={{ fontSize: "11px", color: strengthColor }}>{strengthText}</span>}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Confirmar nova senha</label>
          <input type="password" style={styles.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>

        {errorMsg && <div style={styles.errorBubble}>{errorMsg}</div>}
        {success && <div style={styles.successText}>Senha alterada!</div>}

        <button type="submit" style={styles.primaryBtn} disabled={saving || success}>
          {saving ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", maxWidth: "430px", margin: "auto", display: "flex", flexDirection: "column" as const },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px" },
  backBtn: { display: "flex", alignItems: "center", gap: "4px", color: "#555", background: "none", border: "none", fontSize: "14px", fontFamily: "Barlow, sans-serif", cursor: "pointer", width: 60, padding: 0 },
  pageTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "16px", textTransform: "uppercase" as const },
  formSection: { display: "flex", flexDirection: "column" as const, padding: "0 20px", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  label: { fontSize: "12px", color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" as const },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", fontFamily: "Barlow, sans-serif", outline: "none", boxSizing: "border-box" as const },
  strengthTracker: { display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "4px" },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "10px" },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px" },
  successText: { color: "#c8f135", fontSize: "14px", fontFamily: "Barlow, sans-serif", fontWeight: 600, textAlign: "center" as const }
};
