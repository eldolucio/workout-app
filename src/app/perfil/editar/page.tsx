"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function EditarPerfilPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");
        setUserId(user.id);
        
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (prof) {
          setName(prof.name || "");
          setWeight(prof.weight_kg ? String(prof.weight_kg) : "");
          setHeight(prof.height_cm ? String(prof.height_cm) : "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Nome muito curto.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
      })
      .eq("id", userId);

    if (error) {
      setErrorMsg("Erro ao salvar.");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/perfil"), 1500);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/perfil")}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>EDITAR PERFIL</span>
        <div style={{ width: 60 }} />
      </header>

      {loading ? (
        <div style={{ padding: "20px" }}>Carregando dados...</div>
      ) : (
        <form onSubmit={handleSave} style={styles.formSection}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nome completo</label>
            <input 
              style={styles.input} 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Peso (kg)</label>
              <input 
                type="number"
                style={styles.input} 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Altura (cm)</label>
              <input 
                type="number"
                style={styles.input} 
                value={height} 
                onChange={(e) => setHeight(e.target.value)} 
              />
            </div>
          </div>

          {errorMsg && <div style={styles.errorText}>{errorMsg}</div>}
          {success && <div style={styles.successText}>Perfil atualizado!</div>}

          <button type="submit" style={styles.primaryBtn} disabled={saving || success}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          
          <button type="button" style={styles.ghostBtn} onClick={() => router.back()}>
            Cancelar
          </button>
        </form>
      )}
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
  errorText: { color: "#E24B4A", fontSize: "13px", fontFamily: "Barlow, sans-serif", marginTop: "4px" },
  successText: { color: "#c8f135", fontSize: "14px", fontFamily: "Barlow, sans-serif", fontWeight: 600, textAlign: "center" as const, marginTop: "8px" },
  primaryBtn: { background: "#c8f135", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: "10px" },
  ghostBtn: { background: "transparent", color: "#555", border: "none", width: "100%", padding: "12px", fontFamily: "Barlow, sans-serif", fontSize: "14px", cursor: "pointer", textDecoration: "underline", alignSelf: "center" }
};
