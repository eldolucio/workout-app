"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login"); // Se abrir direto sem sessão do token morre no login
    };
    checkSession();
  }, [router]);

  const getStrengthPercent = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 33;
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 66;
    return 100;
  };

  const strength = getStrengthPercent();
  const strengthColor = strength === 33 ? "#E24B4A" : strength === 66 ? "#EF9F27" : strength === 100 ? "#c8f135" : "transparent";
  const strengthText = strength === 33 ? "Fraca" : strength === 66 ? "Média" : "Forte";

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Mínimo 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    
    if (err) {
      setError("Erro ao salvar senha. Tente novamente.");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/home"), 2000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>NOVA SENHA</h1>
        <p style={styles.subtitle}>Escolha uma senha forte para sua conta.</p>

        {success ? (
          <div style={styles.successBox}>Senha atualizada! Redirecionando...</div>
        ) : (
          <form onSubmit={handleNewPassword} style={styles.formControls}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nova senha</label>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={styles.strengthTracker}>
                <div style={{ width: "100%", height: "3px", background: "#1e1e1e", borderRadius: "3px" }}>
                  <div style={{ width: `${strength}%`, height: "100%", background: strengthColor, transition: "all 0.3s", borderRadius: "3px" }} />
                </div>
                {strength > 0 && <span style={{ fontSize: "11px", color: strengthColor }}>{strengthText}</span>}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmar nova senha</label>
              <input
                type="password"
                style={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error && <div style={styles.errorBubble}>{error}</div>}

            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { maxWidth: "380px", width: "100%", display: "flex", flexDirection: "column" as const },
  title: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "22px", color: "#f0f0f0", margin: "0 0 8px 0" },
  subtitle: { color: "#555", fontSize: "13px", fontFamily: "Barlow, sans-serif", margin: "0 0 24px 0" },
  formControls: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  label: { fontSize: "12px", color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" as const },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", fontFamily: "Barlow, sans-serif", outline: "none", boxSizing: "border-box" as const },
  strengthTracker: { display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "4px" },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "8px" },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px", marginTop: "12px" },
  successBox: { background: "rgba(200, 241, 53, 0.1)", border: "1px solid rgba(200, 241, 53, 0.3)", borderRadius: "8px", padding: "16px", color: "#c8f135", textAlign: "center" as const, fontWeight: 600, fontFamily: "Barlow, sans-serif" }
};
