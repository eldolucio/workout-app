# 🏋️‍♂️ WorkoutApp — Seu treino, sua regra.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-blueviolet?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

O **WorkoutApp** é uma plataforma PWA (Progressive Web App) de alta performance desenhada para entusiastas fitness que buscam digitalizar sua rotina sem perder a flexibilidade. Com foco em **Gamificação**, **IA** e **Aura RPG**, o app transforma cada gota de suor em pontos de experiência (XP).

---

## ✨ Principais Diferenciais

- **📸 Importação Inteligente (OCR)**: Tire uma foto da sua ficha de papel e nossa IA (Google Gemini) extrai automaticamente exercícios, séries, repetições e cardios.
- **🎮 Gamificação RPG**: Evolua seu nível (Level Up), desbloqueie conquistas e mantenha sequências (Streaks) para se manter motivado.
- **🏃‍♂️ Cardio & HIIT Flexível**: Cronômetros dinâmicos que resistem ao background do celular, com integração Bluetooth para monitoramento de frequência cardíaca em tempo real.
- **📱 PWA Nativo**: Instale no seu Android ou iOS para uma experiência de tela cheia, offline-first e notificações push de lembretes.
- **🛡️ Segurança de Dados**: Arquitetura robusta utilizando Supabase Auth e Row Level Security (RLS) para total privacidade.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), TypeScript, Lucide Icons.
- **Design System**: Vanilla CSS com foco em estética *Dark Mode* e micro-animações.
- **Backend & Auth**: Supabase (PostgreSQL), Next.js API Routes.
- **IA**: Google Gemini Pro Vision API para processamento de fichas de treino.
- **Sensores**: Web Bluetooth API para integração com cintas cardíacas.

---

## 📦 Como Instalar e Rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/eldolucio/workout-app.git
   cd workout-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz com:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   GEMINI_API_KEY=sua_chave_google_gemini
   VAPID_PUBLIC_KEY=sua_chave_publica_push
   VAPID_PRIVATE_KEY=sua_chave_privada_push
   VAPID_EMAIL=seu@email.com
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 🔒 Hardening & Segurança

Para garantir a integridade do sistema de XP e a privacidade dos dados, consulte o nosso [Guia de Hardening](./HARDENING_REPORT.md) contendo as políticas de banco de dados recomendadas.

---

## 🚀 Próximos Passos

- [ ] Modo Offline completo via IndexedDB.
- [ ] Gráficos de volume de treinamento semanal.
- [ ] Exportação de fichas para PDF/Excel.

---

Desenvolvido com ❤️ por [Eldo Lucio](https://github.com/eldolucio) e equipe.
