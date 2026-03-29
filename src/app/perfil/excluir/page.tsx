"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function ExcluirPage() {
  const router = useRouter();
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmValue !== "DELETE") return;
    setDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]);
      await supabase.from("profiles").delete().eq("id", user.id);

      await fetch("/api/delete-account", { method: "DELETE" });

      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      console.error(e);
      setDeleting(false);
      alert("Erro ao excluir conta");
    }
  };

  const isEnabled = confirmValue === "DELETE";

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>EXCLUIR CONTA</span>
        <div style={{ width: 60 }} />
      </header>

      <div style={styles.content}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <AlertTriangle size={40} color="#E24B4A" />
        </div>
        <h1 style={styles.alertTitle}>ISSO É IRREVERSÍVEL</h1>
        
        <ul style={styles.ul}>
          <li>Todas as suas fichas de treino</li>
          <li>Todo o seu histórico de sessões concluídas</li>
          <li>Foto de perfil e dados pessoais configurados</li>
        </ul>

        <div style={styles.confirmBox}>
          <label style={styles.label}>Para confirmar, digite DELETE abaixo:</label>
          <input
            style={styles.input}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder="DELETE"
          />
        </div>

        <button 
          style={{ ...styles.dangerBtn, opacity: isEnabled ? 1 : 0.3, cursor: isEnabled ? "pointer" : "not-allowed" }} 
          disabled={!isEnabled || deleting}
          onClick={handleDelete}
        >
          {deleting ? "Excluindo..." : "Excluir minha conta permanentemente"}
        </button>

        <button style={styles.ghostBtn} onClick={() => router.back()}>
          Cancelar, quero ficar
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", maxWidth: "430px", margin: "auto", display: "flex", flexDirection: "column" as const },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px" },
  backBtn: { display: "flex", alignItems: "center", gap: "4px", color: "#555", background: "none", border: "none", fontSize: "14px", fontFamily: "Barlow, sans-serif", cursor: "pointer", width: 60, padding: 0 },
  pageTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "16px", textTransform: "uppercase" as const },
  content: { padding: "0 20px", display: "flex", flexDirection: "column" as const },
  alertTitle: { color: "#E24B4A", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "20px", textAlign: "center" as const, margin: "0 0 16px 0" },
  ul: { listStyleType: "disc", paddingLeft: "20px", margin: "0 0 32px 0", color: "#888", fontSize: "13px", fontFamily: "Barlow, sans-serif", display: "flex", flexDirection: "column" as const, gap: "8px" },
  confirmBox: { display: "flex", flexDirection: "column" as const, gap: "8px", marginBottom: "24px" },
  label: { color: "#555", fontSize: "13px", fontFamily: "Barlow, sans-serif" },
  input: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#E24B4A", fontFamily: "Barlow Condensed, sans-serif", fontSize: "16px", padding: "12px", outline: "none", letterSpacing: "1px", textTransform: "uppercase" as const },
  dangerBtn: { background: "#E24B4A", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "15px", textTransform: "uppercase" as const, marginBottom: "12px" },
  ghostBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: "10px", padding: "14px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer", textTransform: "uppercase" as const }
};
