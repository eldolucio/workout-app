"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (cooldown === 0 && resent) {
      setResent(false);
    }
    return () => clearTimeout(timer);
  }, [cooldown, resent]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    await supabase.auth.resend({ type: "signup", email });
    setResent(true);
    setCooldown(60);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Mail size={48} color="#c8f135" style={{ alignSelf: "center", marginBottom: "16px" }} />
        <h1 style={styles.title}>CHEQUE SEU E-MAIL</h1>
        
        <p style={styles.text}>Enviamos um link de confirmação para:</p>
        <p style={styles.emailText}>{email || "seu email"}</p>
        
        <p style={styles.subtext}>
          Clique no link do e-mail para ativar sua conta e começar a treinar.
        </p>

        <button style={styles.ghostBtn} onClick={() => router.push("/login")}>
          Voltar para o login
        </button>

        <div style={styles.footerLink}>
          Não recebeu o e-mail?{" "}
          <button 
            style={{ ...styles.actionBtn, opacity: cooldown > 0 ? 0.6 : 1, cursor: cooldown > 0 ? "not-allowed" : "pointer" }} 
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : resent ? "E-mail reenviado!" : "Reenviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0a0a0a", minHeight: "100vh" }}></div>}>
      <ConfirmContent />
    </Suspense>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { maxWidth: "380px", width: "100%", display: "flex", flexDirection: "column" as const, textAlign: "center" as const },
  title: { fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "24px", color: "#f0f0f0", margin: "0 0 16px 0", letterSpacing: "1px" },
  text: { color: "#555", fontSize: "13px", fontFamily: "Barlow, sans-serif", margin: "0 0 4px 0" },
  emailText: { color: "#e8e8e8", fontWeight: 500, fontSize: "15px", fontFamily: "Barlow, sans-serif", margin: "0 0 16px 0" },
  subtext: { color: "#555", fontSize: "13px", fontFamily: "Barlow, sans-serif", marginTop: "16px", marginBottom: "32px", lineHeight: "1.4" },
  ghostBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: "8px", padding: "12px", width: "100%", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer", textTransform: "uppercase" as const },
  footerLink: { marginTop: "24px", fontSize: "13px", color: "#555", fontFamily: "Barlow, sans-serif" },
  actionBtn: { background: "none", border: "none", color: "#c8f135", fontWeight: 600, fontFamily: "Barlow, sans-serif", fontSize: "13px" }
};
