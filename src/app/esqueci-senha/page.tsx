"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft } from "lucide-react";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Digite um e-mail válido.");
      return;
    }
    setLoading(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    
    // Mostramos sucesso mesmo se falhar para não confirmar existência de dados.
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => router.push("/login")}>
          <ArrowLeft size={16} /> Voltar
        </button>

        {!sent ? (
          <>
            <h1 style={styles.title}>ESQUECI MINHA SENHA</h1>
            <p style={styles.subtitle}>Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
            
            <form onSubmit={handleReset} style={styles.formControls}>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail cadastrado"
              />
              {error && <div style={styles.errorBubble}>{error}</div>}
              
              <button type="submit" style={styles.primaryBtn} disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </>
        ) : (
          <div style={styles.successState}>
            <Mail size={48} color="#c8f135" style={{ marginBottom: "16px" }} />
            <h1 style={styles.title}>LINK ENVIADO!</h1>
            <p style={styles.subtitle}>Verifique sua caixa de entrada e spam.</p>
            <button style={styles.ghostBtn} onClick={() => router.push("/login")}>
              Voltar para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { maxWidth: "300px", width: "100%", display: "flex", flexDirection: "column" as const },
  backBtn: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#555", fontSize: "14px", fontFamily: "Barlow, sans-serif", cursor: "pointer", padding: 0, marginBottom: "24px", alignSelf: "flex-start" },
  title: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "22px", color: "#f0f0f0", margin: "0 0 8px 0" },
  subtitle: { color: "#555", fontSize: "13px", fontFamily: "Barlow, sans-serif", margin: "0 0 24px 0", textAlign: "center" as const },
  formControls: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", fontFamily: "Barlow, sans-serif", outline: "none", boxSizing: "border-box" as const },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "8px" },
  ghostBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: "8px", padding: "12px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer", textTransform: "uppercase" as const, marginTop: "24px" },
  successState: { display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const },
  errorBubble: { background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "10px 14px", color: "#E24B4A", fontSize: "13px" }
};
