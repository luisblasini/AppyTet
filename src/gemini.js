export const getGeminiKey = () => localStorage.getItem('TET_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';

export const setGeminiKey = (key) => {
    if (key) {
        localStorage.setItem('TET_GEMINI_API_KEY', key);
    } else {
        localStorage.removeItem('TET_GEMINI_API_KEY');
    }
};

const callGemini = async (prompt, systemInstruction = "Você é um assistente de viagens. Retorne APENAS um JSON válido. Não inclua blocos markdown.") => {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        throw new Error('A chave da API do Gemini não está configurada. Vá na aba Configuração para inseri-la.');
    }

    // Updated to gemini-2.5-flash-lite (as explicitly requested)
    console.log(`Using Gemini Key prefix: ${apiKey.substring(0, 8)}...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
        throw new Error('Resposta vazia da IA.');
    }

    try {
        let cleanText = textResponse.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
        }
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON from AI:", textResponse);
        throw new Error('A resposta da IA não é um JSON válido.');
    }
};

export const parseWhatsAppMessageAI = async (message, pricesDb) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Optimized catalog string: Send only essential fields to reduce token usage
    const catalogStr = JSON.stringify(pricesDb.map(p => ({
        id: p.id || p.ID, 
        n: p.Passeio, 
        c: p.Ciudad || 'Cartagena',
        v: p.Valor_venda_COP, 
        e: p.ENTRADA,
        cost: p.Preco_custo_COP || 0
    })));

    const prompt = `
HOJE É: ${dateStr}

Abaixo está uma mensagem de WhatsApp de um cliente querendo comprar passeios em Cartagena/San Andrés.
Extraia os dados pessoais do cliente e compare os passeios solicitados com nosso catálogo (disponível abaixo).

MENSAGEM DO CLIENTE:
${message}

CATÁLOGO DE PASSEIOS DISPONÍVEIS (JSON):
${catalogStr}

Você deve retornar EXATAMENTE um JSON na seguinte estrutura:
{
  "name": "Nome",
  "phone": "Telefone extraído (com código de área)",
  "passport": "RG ou Passaporte",
  "cpf": "CPF se houver",
  "address": "Endereço completo",
  "cep": "CEP",
  "dob": "Data de nascimento",
  "email": "Email",
  "instagram": "Instagram sem o @",
  "city": "Cidade de origem ou moradia",
  "arrival": "Data de Chegada",
  "departure": "Data de Saída",
  "pax": "Número total de pessoas (apenas os dígitos)",
  "paxChildren": "Número de crianças",
  "companionList": [
    { "name": "Nome Completo", "doc": "RG/Passaporte se houver" }
  ],
  "hotel": "Hotel/Hospedagem",
  "source": "Como encontrou a viagem",
  "nextDestination": "Próximo destino",
  "emergency": "Contato de emergência",
  "motivoViagem": "Motivo",
  "geniLink": "Algum link geni.travel se houver",
  "tours": [
    {
      "ID": "id original do catálogo se houver match. Nulo se for novo.",
      "Passeio": "Nome do Passeio (idêntico ao catálogo se houver match)",
      "Ciudad": "Cidade onde ocorre",
      "Valor_venda_COP": 0,
      "Preco_custo_COP": 0,
      "ENTRADA": 0,
      "Local": "Local do catálogo ou em branco",
      "Hora": "Hora do catálogo ou em branco",
      "Taxas_valor": 0,
      "date": "Data sugerida (formato YYYY-MM-DD)",
      "Descricao": "Ad-hoc ou Catalog"
    }
  ]
}

REGRAS DE LIMPEZA E EXTRAÇÃO:
1. ACOMPANHANTES: Se houver 3 pessoas (1 titular + 2 acompanhantes), o array 'companionList' deve ter exatamente 2 objetos. Se o cliente apenas disser "vou com minha esposa Maria", coloque {"name": "Maria", "doc": ""}.
2. REMOVA prefixos de listas numeradas. Por exemplo, se na mensagem diz "5. CEP: 01000", retorne apenas "01000". NUNCA inclua o texto do rótulo (ex: "CPF:", "Email:") dentro do valor.
3. DATA ATUAL: Use a data de hoje (${dateStr}) para interpretar termos como "amanhã", "depois de amanhã" ou dias da semana.
4. Se a mensagem for um formulário preenchido, extraia apenas os valores após os dois pontos.
5. MATCH ESTRITO DE TOURS: Se o cliente pedir um passeio (ex: 'bora'), busque no catálogo o MATCH EXATO (ex: 'Bora Bora Club' ou 'Bora Vip'). O campo "Passeio" DEVE SER 100% IDÊNTICO ao valor 'n' do catálogo. Se não tiver certeza absoluta de qual é, defina o "ID" como null e coloque exatamente o que o cliente escreveu no campo "Passeio". É PROIBIDO inventar variações (ex: criar "Bora VIP" se o catálogo diz "Bora Vip").
6. DATAS DISTINTAS (NÃO MESCLAR): Se o cliente pedir passeios similares em DUAS DATAS DIFERENTES (ex: '23/4 bora' e '26/4 bora vip'), VOCÊ DEVE CRIAR DOIS OBJETOS DISTINTOS no array 'tours', um para cada data. NUNCA agrupe passeios com datas diferentes.
7. Tudo que não for encontrado, deixe como string vazia "".
`;

    return await callGemini(prompt);
};

export const parseSmartNotesAI = async (notes, currentBooking, pricesDb) => {
    const currentDataStr = JSON.stringify({
        name: currentBooking.name, pax: currentBooking.pax, tours: currentBooking.tours,
        hotel: currentBooking.hotel, arrival: currentBooking.arrival
    });

    const catalogStr = JSON.stringify(pricesDb.map(p => ({
        ID: p.ID || p.id, Passeio: p.Passeio, Cidade: p.Ciudad,
        Venda: p.Valor_venda_COP, Entrada: p.ENTRADA, Custo: p.Preco_custo_COP,
        Local: p.Local, Hora: p.Hora, Taxas: p.Taxas_valor
    })));

    const prompt = `
Você é o assistente "Smart Chat" de um sistema de viagens.
O agente de viagens fez a seguinte anotação sobre uma reserva existente:
"${notes}"

DADOS ATUAIS DA RESERVA:
${currentDataStr}

CATÁLOGO DE PASSEIOS:
${catalogStr}

Atue modificando os dados atuais com base na nota.
Retorne APENAS UM JSON contendo OS CAMPOS QUE DEVEM SER ATUALIZADOS na reserva.

REGRAS ABSOLUTAS PARA O CAMPO "tours":
1. NUNCA remova um passeio já existente no array, a menos que a nota diga EXPLICITAMENTE "remover X" ou "cancelar X".
2. Se a nota pede para modificar um passeio (ex: "mudar Capri Classic para Premium"), encontre o passeio no array ATUAL e altere apenas os campos mencionados, mantendo todos os outros passeios intactos.
3. Se a nota pede para adicionar um passeio, agregue-o AO FINAL do array existente.
4. Se o campo "tours" não foi alterado, NÃO o inclua no JSON de retorno.
5. Quando retornar "tours", retorne o array COMPLETO com TODOS os passeios (os inalterados + as modificações).

Exemplo de retorno JSON:
{
  "hotel": "Hotel Movich",
  "tours": [ /* TODOS os tours existentes, com as modificações aplicadas */ ]
}
`;

    return await callGemini(prompt);
};

export const parsePriceUpdateAI = async (text, pricesDb) => {
    const catalogStr = JSON.stringify(pricesDb.map(p => ({
        ID: p.ID || p.id, Passeio: p.Passeio, Cidade: p.Ciudad,
        Venda: p.Valor_venda_COP, Entrada: p.ENTRADA, Custo: p.Preco_custo_COP,
        Local: p.Local, Hora: p.Hora, Taxas: p.Taxas_valor
    })));

    const prompt = `
Você é o analisador de tabela de preços do sistema.
O operador colou o seguinte texto livre com atualizações de tarifas e passeios:
"${text}"

CATÁLOGO ATUAL:
${catalogStr}

Analise a mensagem. Para cada alteração solicitada (de preço, hora ou nome), retorne a lista dos PASSEIOS QUE MUDARAM. Se é um passeio totalmente novo, inclua-o tbm.
Retorne um JSON com a propriedade "updates" sendo um array de objetos. 
Ex:
{
  "updates": [
    {
      "id": "ID existente se for atualização",
      "isNew": false,
      "Passeio": "Nome do Passeio",
      "Valor_venda_COP": novo valor,
      "ENTRADA": nova entrada,
      "Preco_custo_COP": novo custo
    }
  ]
}
`;

    return await callGemini(prompt);
};
