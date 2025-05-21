import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { siteGenerator } from '@/lib/agents/graph';

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
    const { prompt, model, projectId, useLangGraph } = JSON.parse(req.body);

    let html = '';
    let estrutura = '';
    let conteudo = '';
    let design = '';
    let id = projectId;
    let finalSlug = '';

    if (useLangGraph) {
      const result = await siteGenerator.invoke({ prompt });
      html = result.codigo_html;
      estrutura = result.estrutura;
      conteudo = result.conteudo;
      design = result.design;
    } else {
      throw new Error('Este endpoint atualmente suporta apenas LangGraph.'); // opcional
    }

    // ✅ Salvar histórico
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

    res.status(200).json({
      html,
      estrutura,
      conteudo,
      design,
      projectId: id,
      slug: finalSlug,
    });
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    res.status(500).json({ error: 'Erro ao gerar o site' });
  }
}
