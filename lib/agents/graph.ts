import { StateGraph, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// === DEFINIÇÃO DO ESTADO ===
const SiteBuilderState = Annotation.Root({
  prompt: Annotation<string>(),
  model: Annotation<string>(), // 🆕 modelo dinâmico
  estrutura: Annotation<string>(),
  conteudo: Annotation<string>(),
  design: Annotation<string>(),
  codigo_html: Annotation<string>(),
});

type SiteBuilderStateType = typeof SiteBuilderState.State;

// === AGENTES (nós do grafo) ===

const gerarEstrutura = async (state: SiteBuilderStateType) => {
  const llm = new ChatOpenAI({ model: state.model, temperature: 0.2 });
  const resposta = await llm.invoke(
    `Você é um especialista experiênte em crie a estrutura completa de sites. Utilize este pedido de base: ${state.prompt}`
  );
  return { estrutura: resposta.content };
};

const gerarConteudo = async (state: SiteBuilderStateType) => {
  const llm = new ChatOpenAI({ model: state.model, temperature: 0.2 });
  const resposta = await llm.invoke(
    `Você é um especialista em escrever textos com otimizados para SEO com intuito de estruturar o site a seguir:\n${state.estrutura}`
  );
  return { conteudo: resposta.content };
};

const gerarDesign = async (state: SiteBuilderStateType) => {
  const llm = new ChatOpenAI({ model: state.model, temperature: 0.4 });
  const resposta = await llm.invoke(
    `Com base neste conteúdo, defina um design moderno e minimalista (paleta de cores, fontes, espaçamentos):\n${state.conteudo}`
  );
  return { design: resposta.content };
};

const gerarHTML = async (state: SiteBuilderStateType) => {
  const llm = new ChatOpenAI({ model: state.model, temperature: 0.3 });

  const prompt = `
Você é um web designer profissional.
Gere um site HTML moderno e completo com base nas seguintes informações:

Estrutura:
${state.estrutura}

Conteúdo:
${state.conteudo}

Design:
${state.design}

⚠️ Responda apenas com o HTML final, começando com <!DOCTYPE html>.
Use CSS inline (dentro de <style>) e sem comentários.
Não escreva explicações, apenas o código completo renderizável.
  `;

  const resposta = await llm.invoke(prompt);
  return { codigo_html: resposta.content };
};

// === CRIAÇÃO DO GRAFO ===
const graphBuilder = new StateGraph(SiteBuilderState);

graphBuilder.addNode("agente_estrutura", gerarEstrutura);
graphBuilder.addNode("agente_conteudo", gerarConteudo);
graphBuilder.addNode("agente_design", gerarDesign);
graphBuilder.addNode("agente_html", gerarHTML);

graphBuilder.addEdge("__start__" as any, "agente_estrutura" as any);
graphBuilder.addEdge("agente_estrutura" as any, "agente_conteudo" as any);
graphBuilder.addEdge("agente_conteudo" as any, "agente_design" as any);
graphBuilder.addEdge("agente_design" as any, "agente_html" as any);
graphBuilder.addEdge("agente_html" as any, "__end__" as any);

export const siteGenerator = graphBuilder.compile();
