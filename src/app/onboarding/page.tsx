"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ErrorMessage from "@/components/ErrorMessage";
import { Loader2 } from "lucide-react";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
  header: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    marginBottom: "1rem",
  },
  label: {
    color: "#c8f135",
    fontFamily: "Barlow Condensed, sans-serif",
    fontSize: "0.875rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  title: {
    color: "#f0f0f0",
    fontFamily: "Barlow Condensed, sans-serif",
    fontSize: "24px",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    margin: 0,
  },
  subtitle: {
    color: "#555",
    fontFamily: "Barlow, sans-serif",
    fontSize: "14px",
    margin: 0,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  inputLabel: {
    color: "#e0e0e0",
    fontFamily: "Barlow, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#e8e8e8",
    fontFamily: "Barlow, sans-serif",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  primaryBtn: {
    background: "#c8f135",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontFamily: "Barlow Condensed, sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "1rem",
  },
  ghostBtn: {
    background: "transparent",
    color: "#444",
    border: "none",
    fontFamily: "Barlow, sans-serif",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
    textAlign: "center" as const,
    marginTop: "0.5rem",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);
        
        const suggestedName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "";
        setName(suggestedName);
        
      } catch (e) {
        console.error("Auth erro:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("O nome é obrigatório para continuar.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      if (!userId) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name: name.trim(),
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
      });

      if (error) throw error;
      router.push('/home');

    } catch (e: any) {
      setErrorMsg(e.message || "Erro inesperado ao salvar perfil");
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/home');
  };

  if (loading) {
    return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.label}>BEM-VINDO</span>
          <h1 style={styles.title}>VAMOS CONFIGURAR SEU PERFIL</h1>
          <p style={styles.subtitle}>Esses dados ajudam a personalizar sua experiência.</p>
        </div>

        {errorMsg && <ErrorMessage message={errorMsg} />}

        <div style={styles.fieldGroup}>
          <label style={styles.inputLabel}>Seu nome *</label>
          <input
            type="text"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
        </div>

        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.inputLabel}>Peso (kg)</label>
            <input
              type="number"
              style={styles.input}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 75.5"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.inputLabel}>Altura (cm)</label>
            <input
              type="number"
              style={styles.input}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ex: 178"
            />
          </div>
        </div>

        <button 
          style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }} 
          disabled={saving} 
          onClick={handleSave}
        >
          {saving ? <Loader2 size={18} className="spin" /> : null}
          {saving ? "Salvando..." : "Começar a treinar"}
        </button>

        <button style={styles.ghostBtn} onClick={handleSkip}>
          Pular por agora
        </button>
      </div>
    </div>
  );
}
