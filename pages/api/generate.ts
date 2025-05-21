import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  project: process.env.OPENAI_PROJECT_ID,
});

function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');

  return base.slice(0, 50).replace(/-+$/, '') || randomUUID().slice(0, 8);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { prompt, model, projectId } = JSON.parse(req.body);

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um web designer profissional que gera sites HTML modernos, com estilo limpo, visual elegante e bom espaçamento.
Use fontes legíveis (ex: sans-serif), paleta de cores harmônica (ex: azul, cinza, branco), sombras suaves, cantos arredondados e layout responsivo.
Utilize CSS inline e não adicione comentários. Comece com <!DOCTYPE html>.`,
        },
        {
          role: 'user',
          content: `Crie um site com base nesta descrição: ${prompt}`,
        },
      ],
    });

    const html = completion.choices[0].message.content;
    let id = projectId;
    let finalSlug = '';

    // ✅ Salvar também na tabela "history"
    await supabase.from('history').insert([{ prompt, html, model }]);

    // ✅ Novo projeto
    if (!projectId) {
      let slug = slugify(prompt);

      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug);

      if (existing && existing.length > 0) {
        slug = `${slug}-${randomUUID().slice(0, 6)}`;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{ prompt, html, model, slug }])
        .select()
        .single();

      console.log('📌 Resultado do insert:', { data, error });

      if (error || !data) throw new Error('Erro ao criar projeto');
      id = data.id;
      finalSlug = slug;
    } else {
      // ✅ Atualiza projeto existente
      await supabase
        .from('projects')
        .update({ prompt, html, model })
        .eq('id', projectId);

      const { data: existing } = await supabase
        .from('projects')
        .select('slug')
        .eq('id', projectId)
        .single();

      if (existing) finalSlug = existing.slug;
    }

    // ✅ Criar nova versão
    await supabase
      .from('project_versions')
      .insert([{ html, model, prompt, project_id: id }]);

    res.status(200).json({ html, projectId: id, slug: finalSlug });
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    res.status(500).json({ error: 'Erro ao gerar o site' });
  }
}
