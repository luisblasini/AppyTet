import React from 'react';
import { Settings, Trash2, Plus, FileText } from 'lucide-react';

export default function SettingsDashboard({
  aiKeyInput,
  setAiKeyInput,
  saveGeminiKey,
  getGeminiKey,
  manualRate,
  setManualRate,
  exchangeRate,
  setExchangeRate,
  wiseMarkup,
  setWiseMarkup,
  priceSearch,
  setPriceSearch,
  pricesDb,
  setPricesDb,
  formatCOP,
  deleteProduct,
  updateProduct,
  saveProduct,
  cleanDuplicateProducts,
  getProducts,
  priceUpdateText,
  setPriceUpdateText,
  handleAIPriceUpdate,
  isProcessingAI,
  getConfirmations,
  getContacts,
  setHistoryData,
  setContactsData,
  cleanDuplicateContacts,
  loadingTab,
  setLoadingTab,
  globalTaxasText,
  setGlobalTaxasText
}) {
  const formatCOPLocal = (v) => {
    const val = parseFloat(v) || 0;
    return val.toLocaleString('es-CO');
  };

  return (
    <div className="booking-flow fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={26} color="var(--primary)" /> 
          Configurações do Sistema
        </h2>
        <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>Gerencie API Keys, Câmbio, Sincronização e Tabela de Preços.</p>
      </div>

      <div className="grid-2" style={{ gap: '20px', alignItems: 'start' }}>
        
        {/* LADO ESQUERDO: Integrações e Banco de Dados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Inteligência Artificial (Gemini) */}
          <div className="card" style={{ margin: 0, padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#e0fcfc', padding: '8px', borderRadius: '8px', color: '#0891b2' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cérebro IA (Google Gemini)</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '16px' }}>
              Configure a chave da API para habilitar extração de texto, processamento de reservas via WhatsApp e atualizações de preços inteligentes.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                className="input-field"
                placeholder="Insira sua API Key (AIzaSy...)"
                value={aiKeyInput}
                onChange={(e) => setAiKeyInput(e.target.value)}
              />
              <button className="btn-primary" onClick={() => {
                saveGeminiKey(aiKeyInput);
                alert('Chave salva com sucesso no navegador!');
              }}>Salvar</button>
              <button className="btn-secondary" style={{ padding: '8px 12px', background: '#f3f4f6', fontSize: '0.75rem' }} onClick={() => {
                setAiKeyInput('');
                saveGeminiKey('');
                alert('Cache de API limpo! O sistema agora usará a chave definida no arquivo .env');
              }}>🔄 Limpar</button>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Uso atual: <code style={{ background: '#eee', padding: '2px 4px', borderRadius: '4px' }}>{getGeminiKey().substring(0, 8)}...</code> 
              {localStorage.getItem('TET_GEMINI_API_KEY') ? ' (Salva no navegador)' : ' (Configuração .env)'}
            </div>
            {getGeminiKey() ?
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.8rem', color: '#16a34a', fontWeight: '600', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
                IA Ativa e Conectada
              </div> :
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.8rem', color: '#dc2626', fontWeight: '600', padding: '8px', background: '#fef2f2', borderRadius: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></div>
                IA Desconectada (Requer Chave)
              </div>
            }
          </div>

          {/* Card: Sincronização de Banco de Dados */}
          <div className="card" style={{ margin: 0, padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fdf2f8', padding: '8px', borderRadius: '8px', color: '#be185d' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Sincronização & Limpeza</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '16px' }}>
              Gestão direta da base de dados de produção (Histórico de Reservas e Diretório de Contatos).
            </p>
            <div className="grid-2" style={{ gap: '10px' }}>
              <button className="btn-secondary w-full" onClick={async () => {
                setLoadingTab(true);
                const h = await getConfirmations(100);
                const c = await getContacts(100);
                setHistoryData(h);
                setContactsData(c);
                setLoadingTab(false);
                alert(`Sucesso! Foram sincronizadas ${h.length} confirmações e ${c.length} contatos locais.`);
              }}>Sincronizar Cloud</button>
              
              <button className="btn-secondary w-full" style={{ background: '#ef4444', color: 'white' }} onClick={async () => {
                if (window.confirm('Aviso: Ao confirmar, clientes duplicados serão consolidados na versão mais recente. Deseja prosseguir?')) {
                  setLoadingTab(true);
                  try {
                    const deleted = await cleanDuplicateContacts();
                    alert(`${deleted} perfis duplicados foram limpos!`);
                    const c = await getContacts(50);
                    setContactsData(c);
                  } catch (err) {
                    alert('Erro na limpeza de contatos.');
                  } finally {
                    setLoadingTab(false);
                  }
                }
              }}>Limpar Duplicados</button>
            </div>
          </div>

          {/* Card: Voucher & Textos Padrão */}
          <div className="card" style={{ margin: 0, padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px', color: '#7c3aed' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Configuração de Vouchers</h3>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span className="label" style={{ display: 'block', marginBottom: '6px' }}>Texto Padrão de Taxas (Voucher)</span>
              <textarea 
                className="input-field" 
                style={{ fontSize: '0.85rem', height: '80px', fontFamily: 'inherit' }}
                value={globalTaxasText}
                onChange={e => setGlobalTaxasText(e.target.value)}
                placeholder="Ex: Taxas: [VALOR] por pessoa somente em dinheiro..."
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                Use <strong>[VALOR]</strong> para indicar onde o valor numérico da taxa será inserido automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Financeiro e IA de Preços */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Câmbio e Configuração Financeira */}
          <div className="card" style={{ margin: 0, padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Controle Cambial (BRL / COP)</h3>
            </div>
            
            <div className="grid-2">
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Cotação Travada (Manual)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="number" className="input-field" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }} value={manualRate} onChange={e => setManualRate(Number(e.target.value))} />
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Cotação de Referência (API)</span>
                <input type="number" className="input-field" style={{ margin: 0, color: '#94a3b8' }} value={exchangeRate || 0} disabled />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Taxa Bancária / Wise Markup (%)</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" className="input-field" style={{ margin: 0, width: '100px', fontWeight: 'bold' }} value={wiseMarkup} onChange={e => setWiseMarkup(Number(e.target.value))} />
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  Aplica margem percentual no envio do Pix em Reais para suprir IOF e Spread cambial.
                </span>
              </div>
            </div>

            <button className="btn-secondary w-full mt-4" style={{ background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)' }} onClick={() => {
              fetch('https://api.exchangerate-api.com/v4/latest/BRL')
                .then(res => res.json())
                .then(data => {
                  setExchangeRate(data.rates.COP);
                  setManualRate(Math.floor(data.rates.COP));
                  alert('Taxa oficial do dia capturada: ' + Math.floor(data.rates.COP) + ' COP por 1 BRL');
                })
                .catch(() => alert('Erro de rede ao buscar cotação.'));
            }}>
              Consultar Banco Central
            </button>
          </div>

          {/* Card: Leitor Inteligente de Preços */}
          <div className="card" style={{ margin: 0, padding: '24px', background: '#fffbeb', border: '1px solid #fcd34d', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '4px', height: '100%', background: '#fbbf24', position: 'absolute', left: 0, top: 0 }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#b45309' }}>Atualizador Inteligente (Texto Livre)</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '16px' }}>
              Cole mensagens recebidas de fornecedores. A IA da TET reconhece automaticamente quais passeios sofreram variação e prepara a tabela para salvamento.
            </p>
            <textarea
              className="input-field"
              rows="4"
              style={{ border: '1px solid #fde68a', background: 'white' }}
              placeholder="Exemplo recebido no WhatsApp: &#10;'A partir de amanhã o passeio Ilhas do Rosário sobe para COP 400.000...'"
              value={priceUpdateText}
              onChange={e => setPriceUpdateText(e.target.value)}
              disabled={isProcessingAI}
            />
            <button className="btn-primary w-full mt-3" style={{ background: '#d97706' }} onClick={handleAIPriceUpdate} disabled={isProcessingAI}>
              {isProcessingAI ? 'Processando lógica...' : '🪄 Extrair e Atualizar Preços'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Preços (Full Width) */}
      <div className="card mt-6" style={{ margin: '20px 0 0 0', padding: '24px', border: '1px solid #e5e7eb' }}>
        <div className="flex justify-between items-center mb-6">
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem' }}>Catálogo de Produtos e Tarifário</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>Edite e salve permanentemente no banco de dados.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

            <input className="input-field" style={{ margin: 0, width: '250px' }} placeholder="🔍 Localizar produto..." value={priceSearch} onChange={e => setPriceSearch(e.target.value)} />
            <button className="btn-secondary" style={{ background: '#3b82f6', color: 'white' }} onClick={async () => {
              if (window.confirm('Processo irreversível: Deseja formatar nomes (Iniciais Maiúsculas) e remover passeios idênticos do catálogo?')) {
                setLoadingTab(true);
                try {
                  const deleted = await cleanDuplicateProducts();
                  alert(`Auditoria finalizada. ${deleted} produtos duplicados purgados do banco.`);
                  const data = await getProducts();
                  setPricesDb(data);
                } catch (err) {
                  alert('Erro de sistema durante a purga.');
                } finally {
                  setLoadingTab(false);
                }
              }
            }}>Otimizar</button>
          </div>
        </div>

        {/* Product Editor Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', maxHeight: '700px', overflowY: 'auto', paddingRight: '8px' }}>
          {pricesDb
            .filter(p => !priceSearch || (p.Passeio || '').toLowerCase().includes(priceSearch.toLowerCase()))
            .map((p, i) => (
              <div key={p.id || i} className="tour-item-edit fade-in" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'box-shadow 0.2s' }} 
                   onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'} 
                   onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
                  <input 
                    style={{ fontWeight: '700', fontSize: '1.05rem', border: 'none', background: 'transparent', width: '85%', color: 'var(--text)' }} 
                    value={p.Passeio} 
                    placeholder="Denominação do Tour"
                    onChange={e => { 
                      const u = [...pricesDb]; 
                      const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                      if (idx !== -1) { u[idx] = { ...u[idx], Passeio: e.target.value }; setPricesDb(u); }
                    }} 
                  />
                  <button className="btn-icon-subtle danger" onClick={async () => {
                    if (window.confirm('Excluir este passeio permanentemente?')) {
                      if (p.id) { setLoadingTab(true); await deleteProduct(p.id); }
                      setPricesDb(pricesDb.filter(item => item !== p));
                      setLoadingTab(false);
                    }
                  }}><Trash2 size={16} /></button>
                </div>

                <div className="grid-2" style={{ marginBottom: '12px' }}>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>PVP - Venda (COP)</span>
                    <input type="text" className="input-field" style={{ padding: '8px', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--primary)' }} value={formatCOPLocal(p.Valor_venda_COP)} 
                      onChange={e => { 
                        const v = parseFloat(e.target.value.replace(/\D/g, '')) || 0; 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], Valor_venda_COP: v }; setPricesDb(u); }
                      }} />
                  </div>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Sinal - Entrada (COP)</span>
                    <input type="text" className="input-field" style={{ padding: '8px', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)' }} value={formatCOPLocal(p.ENTRADA)} 
                      onChange={e => { 
                        const v = parseFloat(e.target.value.replace(/\D/g, '')) || 0; 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], ENTRADA: v }; setPricesDb(u); }
                      }} />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '12px' }}>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Líquido - Custo (COP)</span>
                    <input type="text" className="input-field" style={{ padding: '8px', fontSize: '0.9rem' }} value={formatCOPLocal(p.Preco_custo_COP)} 
                      onChange={e => { 
                        const v = parseFloat(e.target.value.replace(/\D/g, '')) || 0; 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], Preco_custo_COP: v }; setPricesDb(u); }
                      }} />
                  </div>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Localidade Base</span>
                    <input className="input-field" style={{ padding: '8px', fontSize: '0.9rem' }} value={p.Ciudad || ''} placeholder="Ex: Cartagena" 
                      onChange={e => { 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], Ciudad: e.target.value }; setPricesDb(u); }
                      }} />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span className="label" style={{ fontSize: '0.65rem' }}>Logística Receptiva (Encontro)</span>
                  <textarea style={{ padding: '8px', fontSize: '0.8rem', height: '50px', marginTop: '4px', border: '1px solid #cbd5e1', width: '100%', borderRadius: '6px', fontFamily: 'inherit' }} value={p.Local || ''} 
                    onChange={e => { 
                      const u = [...pricesDb]; 
                      const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                      if (idx !== -1) { u[idx] = { ...u[idx], Local: e.target.value }; setPricesDb(u); }
                    }} />
                </div>

                <div className="grid-2" style={{ marginBottom: '12px' }}>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Taxas - Valor (COP)</span>
                    <input type="text" className="input-field" style={{ padding: '8px', fontSize: '0.9rem' }} value={formatCOPLocal(p.Taxas_valor)} 
                      onChange={e => { 
                        const v = parseFloat(e.target.value.replace(/\D/g, '')) || 0; 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], Taxas_valor: v }; setPricesDb(u); }
                      }} />
                  </div>
                  <div>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Taxas - Descrição</span>
                    <input type="text" className="input-field" style={{ padding: '8px', fontSize: '0.9rem' }} value={p.Taxas_info || ''} 
                      placeholder="Ex: por pessoa, em dinheiro"
                      onChange={e => { 
                        const u = [...pricesDb]; 
                        const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                        if (idx !== -1) { u[idx] = { ...u[idx], Taxas_info: e.target.value }; setPricesDb(u); }
                      }} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <input type="checkbox" id={`varTime_${p.id || p.uuid}`} style={{ transform: 'scale(1.2)' }} checked={p.hasVariableTime === true} onChange={e => {
                    const u = [...pricesDb]; 
                    const idx = pricesDb.findIndex(item => (item.id === p.id && item.id) || item.uuid === p.uuid);
                    if (idx !== -1) { u[idx] = { ...u[idx], hasVariableTime: e.target.checked }; setPricesDb(u); }
                  }} />
                  <label htmlFor={`varTime_${p.id || p.uuid}`} className="label" style={{ fontSize: '0.75rem', margin: 0, textTransform: 'none', cursor: 'pointer', color: '#0f172a' }}>⏰ Horário flexível (permite inserir a hora na reserva)</label>
                </div>
              </div>
            ))}
        </div>

        {/* Ações Inferiores (Tabela) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button className="btn-secondary" style={{ background: 'transparent', border: '1px solid var(--text)', color: 'var(--text)' }} onClick={() => {
            setPricesDb([...pricesDb, { Passeio: 'Novo Passeio Customizado', Valor_venda_COP: 0, ENTRADA: 0, Preco_custo_COP: 0, Ciudad: 'Cartagena', Local: '', Taxas_valor: 0, Taxas_info: '', Hora: '', hasVariableTime: false, Comentarios: '', uuid: Math.random().toString(36).substring(2, 9) }]);
          }}>
            <Plus size={18} /> Adicionar Produto em Branco
          </button>

          <button id="btn-save-cloud" className="btn-primary" style={{ padding: '12px 30px', fontSize: '1rem', background: '#059669' }} onClick={async () => {
            setLoadingTab(true);
            try {
              const toTitleCase = (str) => {
                if (!str) return '';
                return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              };

              const newPrices = [];
              for (const p of pricesDb) {
                const formatted = { ...p, Passeio: toTitleCase(p.Passeio) };
                if (p.id) {
                  await updateProduct(p.id, formatted);
                  newPrices.push(formatted);
                } else {
                  const newId = await saveProduct(formatted);
                  newPrices.push({ ...formatted, id: newId });
                }
              }
              setPricesDb(newPrices);
              alert('Banco de dados operacional atualizado com sucesso na nuvem! ✅');
            } catch (err) {
              console.error(err);
              alert('Falha na persistência de dados. Tente novamente.\nErro técnico: ' + (err.message || err));
            } finally {
              setLoadingTab(false);
            }
          }} disabled={loadingTab}>
            {loadingTab ? 'Propagando Mudanças...' : '💾 SALVAR ALTERAÇÕES (NUVEM)'}
          </button>
        </div>
      </div>
      
      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
        Núcleo Administrativo © TET Appy System v1.5
      </p>
    </div>
  );
}
