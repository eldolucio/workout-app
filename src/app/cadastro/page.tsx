"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getStrengthPercent = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 33;
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 66;
    return 100;
  };

  const strength = getStrengthPercent();
  const strengthColor = strength === 33 ? "#E24B4A" : strength === 66 ? "#EF9F27" : strength === 100 ? "#c8f135" : "transparent";
  const strengthText = strength === 33 ? "Fraca" : strength === 66 ? "Média" : "Forte";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name || name.trim().length < 2) errs.name = "Nome muito curto.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "E-mail inválido.";
    if (password.length < 8) errs.password = "Mínimo 8 caracteres.";
    if (password !== confirm) errs.confirm = "As senhas não coincidem.";
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setErrors({ email: "Este e-mail já está cadastrado." });
      } else {
        setErrors({ geral: "Erro ao criar conta. Tente novamente." });
      }
      setLoading(false);
      return;
    }

    router.push("/confirmar?email=" + encodeURIComponent(email));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={styles.logoW}>WORKOUT</span><span style={styles.logoA}>APP</span>
          </div>
          <h2 style={styles.title}>CRIAR CONTA</h2>
          <p style={styles.subtitle}>Grátis para sempre.</p>
        </div>

        <form onSubmit={handleSignUp} style={styles.formControls}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nome Completo</label>
            <input
              type="text"
              style={{ ...styles.input, borderColor: errors.name ? "#E24B4A" : "#2a2a2a" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              style={{ ...styles.input, borderColor: errors.email ? "#E24B4A" : "#2a2a2a" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              style={{ ...styles.input, borderColor: errors.password ? "#E24B4A" : "#2a2a2a" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={styles.strengthTracker}>
              <div style={{ width: "100%", height: "3px", background: "#1e1e1e", borderRadius: "3px" }}>
                <div style={{ width: `${strength}%`, height: "100%", background: strengthColor, transition: "all 0.3s", borderRadius: "3px" }} />
              </div>
              {strength > 0 && <span style={{ fontSize: "11px", color: strengthColor }}>{strengthText}</span>}
            </div>
            {errors.password && <span style={styles.errorText}>{errors.password}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirmar senha</label>
            <input
              type="password"
              style={{ ...styles.input, borderColor: errors.confirm ? "#E24B4A" : "#2a2a2a" }}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {errors.confirm && <span style={styles.errorText}>{errors.confirm}</span>}
          </div>

          {errors.geral && <div style={styles.errorBubble}>{errors.geral}</div>}

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <div style={styles.createAccount}>
          Já tem conta?{" "}
          <span style={styles.actionSpan} onClick={() => router.push("/login")}>
            Entrar
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { maxWidth: "380px", width: "100%", display: "flex", flexDirection: "column" as const },
  header: { marginBottom: "30px", textAlign: "center" as const },
  logoW: { fontFamily: "Barlow Condensed", fontWeight: 800, fontSize: "40px", letterSpacing: "-.02em", color: "#f0f0f0" },
  logoA: { fontFamily: "Barlow Condensed", fontWeight: 800, fontSize: "40px", letterSpacing: "-.02em", color: "#c8f135" },
  title: { fontFamily: "Barlow Condensed", fontWeight: 800, fontSize: "22px", color: "#f0f0f0", margin: "4px 0" },
  subtitle: { fontFamily: "Barlow", color: "#555", fontSize: "13px", margin: 0 },
  formControls: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  label: { fontSize: "12px", color: "#555", fontFamily: "Barlow Condensed", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" as const },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", fontFamily: "Barlow", outline: "none", boxSizing: "border-box" as const },
  strengthTracker: { display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "4px" },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "20px" },
  errorText: { fontSize: "11px", color: "#E24B4A" },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px", marginTop: "12px" },
  createAccount: { textAlign: "center" as const, marginTop: "24px", fontSize: "13px", color: "#555" },
  actionSpan: { color: "#c8f135", cursor: "pointer", fontWeight: 600 }
};
