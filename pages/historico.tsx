import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Item = {
  id: string;
  created_at: string;
  prompt: string;
  html: string;
  model: string;
};

export default function Historico() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);

useEffect(() => {
  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Histórico do Supabase:', data, error);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  fetchHistory();
}, []);


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Histórico de Sites Gerados</h1>

      {loading ? (
        <p>Carregando histórico...</p>
      ) : items.length === 0 ? (
        <p>Nenhum site gerado ainda.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded shadow p-4 border relative"
            >
              <div className="text-sm text-gray-500 mb-1">
                Gerado em {new Date(item.created_at).toLocaleString()} usando <strong>{item.model}</strong>
              </div>
              <p className="mb-4"><strong>Prompt:</strong> {item.prompt}</p>
              <div className="flex gap-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setSelectedHtml(item.html)}
                >
                  Ver Prévia
                </button>
                <button
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
                  onClick={() => {
                    navigator.clipboard.writeText(item.html);
                    alert('Código HTML copiado!');
                  }}
                >
                  Copiar Código
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-[90%] h-[90%] p-4 overflow-auto relative">
            <button
              className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => setSelectedHtml(null)}
            >
              Fechar
            </button>
            <iframe
              srcDoc={selectedHtml}
              title="Prévia"
              className="w-full h-full border rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
