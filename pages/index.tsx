import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState("gpt-4o-mini-2024-07-18");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);

    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, useLangGraph: true }),
    });

    const data = await res.json();
    if (data.slug) {
      router.push(`/dashboard/${data.slug}`);
    } else {
      alert('Erro ao criar projeto.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="max-w-xl w-full space-y-6 bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-center">Construtor de Sites com IA</h1>

        <label className="block font-medium">Modelo:</label>
        <select
          className="w-full border p-2 rounded"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
        </select>

        <textarea
          className="w-full p-4 border rounded"
          rows={6}
          placeholder="Descreva seu site aqui..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? 'Gerando...' : 'Gerar com LangGraph 🔗'}
        </button>
      </div>
    </div>
  );
}
