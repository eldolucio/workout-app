"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";

// Mantenha essa lista atualizada a cada novo deploy com as novidades
const RELEASES = [
  {
    version: "v1.2.0",
    date: "11 de Abril, 2026",
    title: "Módulo Completo de Cardio & Gamificação",
    fixes: [
      "Corrigido bug ao renderizar séries sem valores",
      "Novo visual e melhorias de performance na home",
    ],
    features: [
      "Integração com Bluetooth (Frequência Cardíaca)",
      "Temporizadores dinâmicos para HIIT",
      "XP, Níveis e Conquistas (Achievements) para treinos aeróbicos",
      "Lixeira nas Fichas de Treino para excluir e manter tudo organizado",
    ],
  },
  // pode adicionar mais itens antigos se quiser
];

export function ChangelogModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [latestRelease, setLatestRelease] = useState(RELEASES[0]);

  useEffect(() => {
    // Tenta ler a última versão visualizada
    const lastSeenVersion = localStorage.getItem("last_seen_version");
    
    // Se a última versão vista for diferente da versão atual mais recente do app, mostra
    if (lastSeenVersion !== RELEASES[0].version) {
      setLatestRelease(RELEASES[0]);
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("last_seen_version", latestRelease.version);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#161616", borderRadius: "20px", width: "100%", maxWidth: "420px", border: "1px solid #c8f135", position: "relative", display: "flex", flexDirection: "column", maxHeight: "90vh", overflowY: "auto" }}>
        
        {/* Header Decorativo */}
        <div style={{ background: "#c8f135", padding: "24px 20px", borderTopLeftRadius: "18px", borderTopRightRadius: "18px", position: "relative" }}>
           <h2 style={{ margin: 0, fontFamily: "Barlow Condensed", color: "#000", fontSize: "1.75rem", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={24} /> NOVIDADES DO APP!
           </h2>
           <span style={{ color: "#222", fontSize: "0.875rem", fontWeight: "bold", marginTop: "4px", display: "block" }}>
              Atualização {latestRelease.version} • {latestRelease.date}
           </span>
           <button onClick={handleClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.2)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#000" }}>
             <X size={18} />
           </button>
        </div>

        {/* Corpo do changelog */}
        <div style={{ padding: "24px 20px", color: "#f0f0f0", fontFamily: "Barlow" }}>
           <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "#fff", fontFamily: "Barlow Condensed", textTransform: "uppercase" }}>
             {latestRelease.title}
           </h3>

           {latestRelease.features && latestRelease.features.length > 0 && (
             <div style={{ marginBottom: "20px" }}>
               <span style={{ color: "#c8f135", fontWeight: "bold", fontSize: "0.875rem", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>O QUE HÁ DE NOVO:</span>
               <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                 {latestRelease.features.map((feat, i) => (
                   <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.875rem", lineHeight: "1.4" }}>
                     <CheckCircle2 color="#c8f135" size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                     {feat}
                   </li>
                 ))}
               </ul>
             </div>
           )}

           {latestRelease.fixes && latestRelease.fixes.length > 0 && (
             <div>
               <span style={{ color: "#E24B4A", fontWeight: "bold", fontSize: "0.875rem", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>CORREÇÕES DE BUGS:</span>
               <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                 {latestRelease.fixes.map((fix, i) => (
                   <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.875rem", lineHeight: "1.4" }}>
                     <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E24B4A", marginTop: "7px", flexShrink: 0 }} />
                     {fix}
                   </li>
                 ))}
               </ul>
             </div>
           )}

           <button onClick={handleClose} style={{ width: "100%", background: "#333", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontFamily: "Barlow Condensed", fontSize: "1.125rem", fontWeight: "bold", marginTop: "24px", cursor: "pointer" }}>
             CONTINUAR PRO APP
           </button>
        </div>

      </div>
    </div>
  );
}
