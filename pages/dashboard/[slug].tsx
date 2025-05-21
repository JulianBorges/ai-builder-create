// pages/dashboard/[slug].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const { slug } = router.query;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini-2024-07-18');
  const [html, setHtml] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [tab, setTab] = useState<'editor' | 'preview' | 'code'>('editor');
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchProject();
  }, [slug]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return alert('Projeto não encontrado.');

    setProjectId(data.id);
    setPrompt(data.prompt);
    setHtml(data.html);
    setIframe(data.html);
    fetchVersions(data.id);
  };

  const fetchVersions = async (id: string) => {
    const { data } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (data) setVersions(data);
  };

  const handleGenerate = async () => {
    if (!projectId) return;

    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, projectId }),
    });
    const data = await res.json();
    setHtml(data.html);
    setIframe(data.html);
    fetchVersions(projectId);
    setLoading(false);
    setTab('preview');
  };

  const setIframe = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Dashboard do Projeto</h1>

      <div className="mb-6">
        <label className="block font-medium mb-1">Modelo:</label>
        <select
          className="w-full border p-2 rounded"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
        </select>
      </div>

      <div className="mb-4">
        <textarea
          className="w-full p-4 border rounded"
          rows={4}
          placeholder="Descreva seu site aqui..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          className="mt-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Gerando...' : 'Gerar nova versão'}
        </button>
      </div>

      {html && (
        <div className="flex space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded ${tab === 'preview' ? 'bg-white shadow' : 'bg-gray-300'}`}
            onClick={() => setTab('preview')}
          >
            Visual
          </button>
          <button
            className={`px-4 py-2 rounded ${tab === 'code' ? 'bg-white shadow' : 'bg-gray-300'}`}
            onClick={() => setTab('code')}
          >
            Código
          </button>
        </div>
      )}

      <div className="border rounded bg-white shadow-inner overflow-hidden mb-6">
        {html ? (
          tab === 'preview' ? (
            <iframe
              src={iframeSrc}
              className="w-full h-[70vh] border-none"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <pre className="whitespace-pre-wrap p-4 text-sm overflow-y-scroll h-[70vh]">
              <code>{html}</code>
            </pre>
          )
        ) : (
          <div className="text-gray-500 p-4">Prévia do site aparecerá aqui...</div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">Versões Anteriores</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {versions.map((v) => (
          <div key={v.id} className="bg-white border rounded p-4 shadow">
            <div className="text-sm text-gray-500 mb-2">
              {new Date(v.created_at).toLocaleString()}
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                setHtml(v.html);
                setIframe(v.html);
                setTab('preview');
              }}
            >
              Ver prévia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
