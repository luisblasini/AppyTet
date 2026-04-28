import React from 'react';
import { DollarSign } from 'lucide-react';

export default function FinanceDashboard({
  historyData,
  loadingTab,
  getConfirmations,
  setHistoryData,
  setLoadingTab,
  formatCOP
}) {
  return (
    <div className="booking-flow">
      <div className="card fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3><DollarSign size={20} className="inline-icon" /> Dashboard Financeiro</h3>
          <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={async () => {
            setLoadingTab(true);
            const data = await getConfirmations(100);
            setHistoryData(data);
            setLoadingTab(false);
          }}>Atualizar</button>
        </div>

        {loadingTab && <p>Carregando dados financeiros...</p>}

        <div className="dashboard-grid my-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="card text-center" style={{ padding: '25px', background: '#f8fafc', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>🏷️ VENDAS TOTAIS (Global)</div>
            <div style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 800, marginTop: '10px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.totals?.totalCOP || 0), 0))}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>Todas as vendas registradas</div>
          </div>

          <div className="card text-center" style={{ padding: '25px', background: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>💵 RECEITAS / ENTRADAS</div>
            <div style={{ fontSize: '2rem', color: '#15803d', fontWeight: 800, marginTop: '10px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.paymentMethod === 'total_pix' ? (item.totals?.totalCOP || 0) : (item.totals?.entradaCOP || 0)), 0))}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>Dinheiro já recebido e em caixa</div>
          </div>

          <div className="card text-center" style={{ padding: '25px', background: '#fffbeb', borderColor: '#fde68a', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>⚠️ A COBRAR / SALDO PENDENTE</div>
            <div style={{ fontSize: '2rem', color: '#d97706', fontWeight: 800, marginTop: '10px' }}>
              $ {formatCOP(historyData.reduce((acc, item) => acc + (item.paymentMethod === 'total_pix' ? 0 : (item.totals?.saldoCOP || 0)), 0))}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>Pagos ao chegar no destino</div>
          </div>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
          <h4 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Módulo de Lucratividade
          </h4>
          <p style={{ color: '#7f1d1d', marginTop: '10px', fontSize: '0.9rem' }}>
            Este módulo calculará o Lucro Real (Lucro Líquido = Vendas - Custos dos Provedores) após a reestruturación IA. Atualmente, o Preço de Custo (COP) de todos os passeios está cadastrado como zero na Tabela de Preços, exigindo atualização massiva de base de datos antes do cálculo entrar em operação.
          </p>
        </div>
      </div>
    </div>
  );
}
