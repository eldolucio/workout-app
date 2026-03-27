"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Loader2, FileImage } from "lucide-react";

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1.5rem",
    color: "#f0f0f0",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.75rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
  },
  subtitle: {
    fontFamily: "Barlow",
    fontSize: "0.875rem",
    color: "#555",
    marginTop: "0.5rem",
  },
  uploadArea: {
    border: "2px dashed #222",
    borderRadius: "20px",
    padding: "3rem 1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    background: "#161616",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  uploadIcon: {
    color: "#c8f135",
  },
  uploadText: {
    fontFamily: "Barlow Condensed",
    fontSize: "1rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  },
  uploadHint: {
    color: "#555",
    fontSize: "0.75rem",
    fontFamily: "Barlow",
  },
  progressList: {
    marginTop: "3rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
  progressStep: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  stepIndicator: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontFamily: "Barlow Condensed",
    fontWeight: 800,
  },
  stepLabel: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.875rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
};

const STEPS = [
  "Leitura da imagem",
  "Extração do texto",
  "Identificando exercícios",
  "Salvando",
];

export default function ImportSheetPage() {
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    await startImportProcess(selected);
  };

  const startImportProcess = async (file: File) => {
    setUploading(true);
    setCurrentStep(0); // Reading image

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Storage Upload
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const bucketPath = `${user.id}/${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("workout-sheets")
        .upload(bucketPath, file);

      if (uploadError) throw uploadError;

      // 2. Animate steps while calling API
      setTimeout(() => setCurrentStep(1), 1000); // Extracting text
      setTimeout(() => setCurrentStep(2), 2500); // Identifying exercises
      
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketPath, userId: user.id }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error);

      setCurrentStep(3); // Saving
      
      setTimeout(() => {
        router.push("/home");
      }, 1500);

    } catch (err: any) {
      alert("Erro ao importar: " + err.message);
      setUploading(false);
      setCurrentStep(-1);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Importar Ficha</h1>
        <p style={styles.subtitle}>Use IA para extrair exercícios de uma foto.</p>
      </header>

      {!uploading ? (
        <label style={styles.uploadArea}>
          <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          <div style={styles.uploadIcon}>
            <Upload size={48} />
          </div>
          <span style={styles.uploadText}>Toque para selecionar</span>
          <span style={styles.uploadHint}>JPG, PNG ou PDF (máx. 5MB)</span>
        </label>
      ) : (
        <div style={styles.progressList}>
          {STEPS.map((label, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            const color = isDone || isActive ? "#c8f135" : "#222";
            const textColor = isDone || isActive ? "#f0f0f0" : "#555";

            return (
              <div key={label} style={styles.progressStep}>
                <div style={{ ...styles.stepIndicator, background: isDone ? "#c8f135" : "#161616", border: `1px solid ${color}` }}>
                  {isDone ? (
                    <CheckCircle2 size={16} color="#0a0a0a" />
                  ) : isActive ? (
                    <Loader2 size={16} color="#c8f135" className="animate-spin" />
                  ) : (
                    <span style={{ color: "#222" }}>{idx + 1}</span>
                  )}
                </div>
                <span style={{ ...styles.stepLabel, color: textColor }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {uploading && (
         <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: '0.75rem', fontFamily: 'Barlow' }}>
              Isso pode levar alguns segundos enquanto nossa IA processa a imagem.
            </p>
         </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
