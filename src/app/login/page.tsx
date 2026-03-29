"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Globe } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : err.message === "Email not confirmed"
          ? "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
          : "Erro ao entrar. Tente novamente."
      );
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logoW}>WORKOUT</span><span style={styles.logoA}>APP</span>
          <p style={styles.subtitle}>Seu treino, sua regra.</p>
        </div>

        <button type="button" style={styles.googleBtn} onClick={handleGoogle}>
          <Globe size={24} color="#4285F4" />
          <span style={styles.googleBtnText}>Continuar com Google</span>
        </button>

        <div style={styles.divider}>
          <div style={styles.line} />
          <span style={styles.dividerText}>ou</span>
          <div style={styles.line} />
        </div>

        <form onSubmit={handleLogin} style={styles.formControls}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              style={{ ...styles.input, borderColor: error ? "#E24B4A" : "#2a2a2a" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              style={{ ...styles.input, borderColor: error ? "#E24B4A" : "#2a2a2a" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span style={styles.forgotLink} onClick={() => router.push("/esqueci-senha")}>
              Esqueci minha senha
            </span>
          </div>

          {error && <div style={styles.errorBubble}>{error}</div>}

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={styles.createAccount}>
          Não tem conta?{" "}
          <span style={styles.actionSpan} onClick={() => router.push("/cadastro")}>
            Criar conta grátis
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0a0a0a", minHeight: "100vh" }}></div>}>
      <LoginContent />
    </Suspense>
  );
}

const styles = {
  container: {
    minHeight: "100vh", background: "#0a0a0a", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "24px",
  },
  card: { maxWidth: "380px", width: "100%", display: "flex", flexDirection: "column" as const },
  header: { marginBottom: "40px", textAlign: "center" as const },
  logoW: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "40px", letterSpacing: "-.02em", color: "#f0f0f0" },
  logoA: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "40px", letterSpacing: "-.02em", color: "#c8f135" },
  subtitle: { fontFamily: "Barlow, sans-serif", color: "#555", fontSize: "14px", margin: 0, marginTop: "8px" },
  googleBtn: {
    background: "#161616", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "14px 20px", display: "flex",
    alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", width: "100%", transition: "all .15s"
  },
  googleBtnText: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: "15px", letterSpacing: ".04em", color: "#f0f0f0" },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" },
  line: { flex: 1, height: "1px", background: "#1e1e1e" },
  dividerText: { color: "#444", fontSize: "12px", fontFamily: "Barlow, sans-serif" },
  formControls: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  label: { fontSize: "12px", color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" as const },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", fontFamily: "Barlow, sans-serif", outline: "none", boxSizing: "border-box" as const },
  forgotLink: { alignSelf: "flex-end", fontSize: "12px", color: "#555", cursor: "pointer", marginTop: "6px", textDecoration: "underline" },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "20px", transition: "opacity .15s" },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px", marginTop: "12px" },
  createAccount: { textAlign: "center" as const, marginTop: "24px", fontSize: "13px", color: "#555" },
  actionSpan: { color: "#c8f135", cursor: "pointer", fontWeight: 600 }
};
