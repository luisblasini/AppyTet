import React from 'react';
import { History, Trash2 } from 'lucide-react';

export default function HistoryDashboard({
  historyData,
  loadingTab,
  historySearch,
  setHistorySearch,
  expandedHistoryId,
  setExpandedHistoryId,
  handleDeleteConfirmation,
  loadFromHistory,
  getConfirmations,
  setHistoryData,
  setLoadingTab
}) {
  const formatCOP = (num) => {
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0 });
  };

  return (
    <div className="booking-flow">
      <div className="card fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3><History size={20} className="inline-icon" /> Histórico de Confirmações</h3>
          <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={async () => {
            setLoadingTab(true);
            const data = await getConfirmations(50);
            setHistoryData(data);
            setLoadingTab(false);
          }}>Atualizar</button>
        </div>

        {/* Dashboard Financiero */}
        <div className="dashboard-grid my-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="card text-center" style={{ padding: '15px', background: '#f8fafc', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'solid' }}>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>🏷️ VENDAS TOTAIS (COP)</div>
            <div style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: 800, marginTop: '5px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.totals?.totalCOP || 0), 0))}
            </div>
          </div>
          <div className="card text-center" style={{ padding: '15px', background: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: '1px', borderStyle: 'solid' }}>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>💵 RECEITAS / ENTRADAS (COP)</div>
            <div style={{ fontSize: '1.4rem', color: '#15803d', fontWeight: 800, marginTop: '5px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.paymentMethod === 'total_pix' ? (item.totals?.totalCOP || 0) : (item.totals?.entradaCOP || 0)), 0))}
            </div>
          </div>
          <div className="card text-center" style={{ padding: '15px', background: '#fffbeb', borderColor: '#fde68a', borderWidth: '1px', borderStyle: 'solid' }}>
            <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>⚠️ A COBRAR / SALDO (COP)</div>
            <div style={{ fontSize: '1.4rem', color: '#d97706', fontWeight: 800, marginTop: '5px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.paymentMethod === 'total_pix' ? 0 : (item.totals?.saldoCOP || 0)), 0))}
            </div>
          </div>
        </div>

        <input
          className="input-field mb-4"
          placeholder="🔍 Buscar por nome, hotel ou passeio..."
          value={historySearch}
          onChange={e => setHistorySearch(e.target.value)}
        />
        {loadingTab && <p>Carregando...</p>}
        {historyData.length === 0 && !loadingTab && <p style={{ color: 'var(--text-light)' }}>Nenhuma confirmação salva ainda. Salve um voucher para ver aqui.</p>}
        {historyData
          .filter(item => {
            if (!historySearch) return true;
            const s = historySearch.toLowerCase();
            const nameMatch = (item.name || '').toLowerCase().includes(s);
            const hotelMatch = (item.hotel || '').toLowerCase().includes(s);
            const tourMatch = (item.tours || []).some(t => (t.Passeio || '').toLowerCase().includes(s));
            return nameMatch || hotelMatch || tourMatch;
          })
          .map((item, idx) => (
            <div key={item.id || idx} className="tour-item-edit card" style={{ margin: '10px 0', padding: '12px', cursor: 'pointer' }} onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}>
              <div className="flex justify-between">
                <strong>{item.name || 'Sem nome'}</strong>
                <span className="label">{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : '—'}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>
                Pax: {item.pax || '—'} | Hotel: {item.hotel || '—'} | <span style={{ background: item.status === 'confirmed' ? '#dcfce7' : '#fef9c3', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{item.status || 'pending'}</span>
              </div>
              <div className="flex justify-end mt-2">
                <button className="btn-icon-subtle danger" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(item.id); }}>
                  <Trash2 size={16} />
                </button>
              </div>
              {expandedHistoryId === item.id && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div className="grid-2" style={{ gap: '8px' }}>
                    <div><span className="label">Passaporte</span><br />{item.passport || '—'}</div>
                    <div><span className="label">Chegada</span><br />{item.arrival || '—'}</div>
                    <div><span className="label">Saída</span><br />{item.departure || '—'}</div>
                    <div><span className="label">Pagamento</span><br />{item.paymentMethod === 'total_pix' ? 'Integral PIX' : 'Entrada + Saldo'}</div>
                  </div>
                  {item.totals && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="total-pill pill-turquoise" style={{ padding: '6px 10px' }}>Total COP: {(item.totals.totalCOP || 0).toLocaleString('es-CO')}</div>
                      <div className="total-pill pill-pink" style={{ padding: '6px 10px' }}>Entrada BRL: R$ {(item.totals.entradaBRL || 0).toLocaleString('pt-BR')}</div>
                    </div>
                  )}
                  {item.tours && item.tours.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span className="label">Passeios</span>
                      <div style={{ marginTop: '4px' }}>{item.tours.map((t, ti) => <span key={ti} style={{ background: '#e0fcfc', padding: '3px 10px', borderRadius: '4px', marginRight: '6px', display: 'inline-block', marginBottom: '4px' }}>{t.Passeio}</span>)}</div>
                    </div>
                  )}
                  {item.notes && <div style={{ marginTop: '10px' }}><span className="label">Notas</span><br />{item.notes}</div>}
                  <button className="btn-primary w-full mt-4" onClick={(e) => { e.stopPropagation(); loadFromHistory(item); }}>
                    ✏️ Abrir para Editar
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
