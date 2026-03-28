import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabaseServer = await createClient();
    // Efetua a troca de código por autorização de sessão, criando o cookie no navegador
    const { error } = await supabaseServer.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verifica se o usuário recém-logado já tem um perfil ou é totalmente novo
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user) {
        const { data: profile } = await supabaseServer
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        // Usuário novo não tem nome definido no banco, enviar para configuração inicial
        if (!profile?.name || profile.name.trim() === '') {
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
        }
      }
    } else {
       console.error("[supabase] OAuth Exchange Error:", error.message);
    }
  }

  // Fallback padrão se sucesso e já for veterano
  return NextResponse.redirect(new URL('/home', requestUrl.origin));
}
