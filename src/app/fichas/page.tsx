"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { TrainingSheet } from "@/types";
import { Plus, ChevronRight, ListChecks, Trash2 } from "lucide-react";

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1.5rem 100px 1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.75rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  addBtn: {
    background: "#c8f135",
    color: "#0a0a0a",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  sheetItem: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  sheetName: {
    fontFamily: "Barlow Condensed",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f0f0f0",
  },
  sheetMeta: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    color: "#555",
    fontFamily: "Barlow",
  },
};

export default function FichasPage() {
  const router = useRouter();
  const [sheets, setSheets] = useState<TrainingSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSheets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("training_sheets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSheets(data || []);
      setLoading(false);
    };
    fetchSheets();
  }, [router]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevenir clique no card se futuramente tiver navegação
    
    if (!window.confirm("Certeza que deseja excluir esta ficha? Todas as sessões de treino vinculadas também podem ser afetadas.")) return;
    
    // Atualiza estado otimisticamente
    setSheets(prev => prev.filter(s => s.id !== id));
    
    const { error } = await supabase
      .from('training_sheets')
      .delete()
      .eq('id', id);
      
    if (error) {
      alert("Erro ao excluir ficha: " + error.message);
      // Opcional: recarregar as fichas do banco em caso de erro
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Minhas Fichas</h1>
        <button style={styles.addBtn} onClick={() => router.push("/fichas/importar")}>
          <Plus size={24} />
        </button>
      </header>

      <div style={styles.list}>
        {sheets.length > 0 ? (
          sheets.map((sheet) => (
            <div key={sheet.id} style={styles.sheetItem}>
              <div style={styles.sheetInfo}>
                <span style={styles.sheetName}>{sheet.name}</span>
                <span style={styles.sheetMeta}>
                  {sheet.is_active ? "Ativa" : "Arquivada"} • Criada em {new Date(sheet.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={(e) => handleDelete(e, sheet.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}
                >
                  <Trash2 size={20} color="#E24B4A" />
                </button>
                <ChevronRight size={18} color="#222" />
              </div>
            </div>
          ))
        ) : !loading ? (
          <div style={styles.emptyState}>
            <ListChecks size={48} style={{ marginBottom: "1rem", opacity: 0.2 }} />
            <p>Você ainda não tem nenhuma ficha.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              Toque no + para importar sua primeira ficha de treino.
            </p>
          </div>
        ) : null}
      </div>

      <NavBar />
    </div>
  );
}
