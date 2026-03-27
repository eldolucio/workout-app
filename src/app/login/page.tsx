"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Globe } from "lucide-react";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "#0a0a0a",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "3rem",
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.75rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontFamily: "Barlow",
    fontSize: "0.875rem",
    color: "#555",
    marginTop: "0.5rem",
  },
  form: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  inputGroup: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "0.875rem 1rem 0.875rem 2.75rem",
    color: "#f0f0f0",
    fontFamily: "Barlow",
    fontSize: "0.875rem",
    outline: "none",
  },
  icon: {
    position: "absolute" as const,
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#555",
  },
  primaryBtn: {
    background: "#c8f135",
    color: "#0a0a0a",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "1rem",
    padding: "1rem",
    borderRadius: "14px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginTop: "0.5rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#555",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "0.875rem",
    padding: "0.875rem",
    borderRadius: "14px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginTop: "0.5rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    margin: "1.5rem 0",
    width: "100%",
    maxWidth: "400px",
  },
  line: {
    flex: 1,
    height: "1px",
    background: "#1a1a1a",
  },
  dividerText: {
    color: "#2a2a2a",
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
  },
  googleBtn: {
    width: "100%",
    maxWidth: "400px",
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "0.875rem",
    color: "#f0f0f0",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "0.875rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push("/home");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>SEU TREINO. SUA REGRA.</h1>
        <p style={styles.subtitle}>Ficha do personal direto no bolso.</p>
      </header>

      <form style={styles.form} onSubmit={handleLogin}>
        <div style={styles.inputGroup}>
          <Mail size={18} style={styles.icon} />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <Lock size={18} style={styles.icon} />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <button type="submit" style={styles.primaryBtn} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <button type="button" style={styles.ghostBtn}>
          Criar Conta
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.line} />
        <span style={styles.dividerText}>ou</span>
        <div style={styles.line} />
      </div>

      <button style={styles.googleBtn} onClick={handleGoogleLogin}>
        <Globe size={20} color="#c8f135" />
        Entrar com Google
      </button>
    </div>
  );
}
