import { useState, useEffect } from 'react';
import { recomendacionService, cultivoService } from '../services/apiServices';
import { getClima, getHoyClima, generarRecomendacionesClima } from '../services/climaService';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, EmptyState } from '../components/UIComponents';

const prioridadBadge = (p) => {
  const map = { BAJA: 'bg-info', MEDIA: 'bg-primary', ALTA: 'bg-warning text-dark', CRITICA: 'bg-danger' };
  return map[p] || 'bg-secondary';
};

const CAT_COLORS = {
  'Riego': '#1565c0', 'Suelo': '#5d4037', 'Cosecha': '#e65100',
  'Enfermedades': '#6a1b9a', 'Agroquímicos': '#c62828', 'Cultivos sensibles': '#2e7d32',
};

export default function RecomendacionesPage() {
  const { user } = useAuth();
  const [items, setItems]           = useState([]);
  const [recomClima, setRecomClima] = useState([]);
  const [climaHoy, setClimaHoy]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [tab, setTab]               = useState('clima'); // clima | tecnico | todas

  useEffect(() => { loadData(); }, [page, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar recomendaciones del backend solo del usuario logueado
      const uid = user?.usuarioId;
      const res = uid
        ? await recomendacionService.listarPorProductor(uid, page)
        : { data: { datos: { content: [], totalPages: 0 } } };
      setItems(res.data?.datos?.content || []);
      setTotalPages(res.data?.datos?.totalPages || 0);

      // Cargar consejos del clima (Open-Meteo)
      const [clima, cultivosRes] = await Promise.allSettled([
        getClima(),
        cultivoService.listar(0),
      ]);
      const climaData = clima.status === 'fulfilled' ? clima.value : null;
      const cultivos  = cultivosRes.status === 'fulfilled'
        ? (cultivosRes.value.data?.datos?.content || []) : [];

      const hoy = getHoyClima(climaData);
      setClimaHoy(hoy);
      setRecomClima(generarRecomendacionesClima(hoy, cultivos));
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const handleAplicar = async (id) => {
    try { await recomendacionService.aplicar(id, 'Aplicada por productor'); loadData(); } catch {}
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h2><i className="bi bi-lightbulb me-2"></i>Recomendaciones</h2>
      </div>

      <ul className="nav nav-pills mb-3 gap-1 flex-wrap">
        <li>
          <button className={`btn btn-sm ${tab === 'clima' ? 'btn-success' : 'btn-agro-outline'}`}
            onClick={() => { setTab('clima'); setPage(0); }}>
            <i className="bi bi-cloud-sun me-1"></i>Del Clima
            {recomClima.length > 0 && <span className="badge bg-light text-success ms-1">{recomClima.length}</span>}
          </button>
        </li>
        <li>
          <button className={`btn btn-sm ${tab === 'tecnico' ? 'btn-agro' : 'btn-agro-outline'}`}
            onClick={() => { setTab('tecnico'); setPage(0); }}>
            <i className="bi bi-person-check me-1"></i>Del Técnico
          </button>
        </li>
        <li>
          <button className={`btn btn-sm ${tab === 'todas' ? 'btn-agro' : 'btn-agro-outline'}`}
            onClick={() => { setTab('todas'); setPage(0); }}>
            <i className="bi bi-list-ul me-1"></i>Todas
          </button>
        </li>
      </ul>

      {loading ? <LoadingSpinner /> : (
        <div className="d-flex flex-column gap-3">

          {/* ── TAB CLIMA ── */}
          {(tab === 'clima' || tab === 'todas') && (
            <>
              {tab === 'todas' && recomClima.length > 0 && (
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-success"><i className="bi bi-cloud-sun me-1"></i>Recomendaciones del Clima</span>
                </div>
              )}
              {recomClima.length === 0 && tab === 'clima' ? (
                <EmptyState icon="🌤️" text="El clima de hoy no requiere acciones especiales. ¡Todo bien!" />
              ) : recomClima.map((r, i) => (
                <div key={`clima-${i}`} className="card card-agro border-start border-4"
                  style={{ borderColor: CAT_COLORS[r.categoria] || '#2c6e49' }}>
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-3">
                      <span className="fs-3">{r.icono}</span>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-1">
                          <h6 className="fw-bold mb-0">{r.titulo}</h6>
                          <div className="d-flex gap-1">
                            <span className="badge bg-success bg-opacity-20 text-success small"><i className="bi bi-cpu me-1"></i>Sistema</span>
                            <span className="badge bg-light text-dark small border">{r.categoria}</span>
                          </div>
                        </div>
                        <p className="text-muted small mb-0">{r.descripcion}</p>
                        {climaHoy && (
                          <div className="text-muted small mt-2">
                            <i className="bi bi-cloud-sun me-1"></i>
                            Basado en: {climaHoy.tempMax}°C · {climaHoy.probLluvia}% lluvia · {climaHoy.vientoMax} km/h viento
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── TAB TÉCNICO ── */}
          {(tab === 'tecnico' || tab === 'todas') && (
            <>
              {tab === 'todas' && items.length > 0 && (
                <div className="d-flex align-items-center gap-2 mt-2 mb-1">
                  <span className="badge bg-success"><i className="bi bi-person-check me-1"></i>Recomendaciones del Técnico</span>
                </div>
              )}
              {items.length === 0 && tab === 'tecnico' ? (
                <EmptyState icon="👨‍🌾" text="No tienes recomendaciones de técnicos por ahora." />
              ) : items.map((r) => (
                <div key={r.id} className="card card-agro">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-0">{r.titulo}</h6>
                        {r.fincaNombre && (
                          <span className="text-success small fw-semibold">
                            <i className="bi bi-geo-alt-fill me-1"></i>Finca: {r.fincaNombre}
                          </span>
                        )}
                        {r.cultivoNombre && (
                          <span className="text-muted small ms-2">
                            <i className="bi bi-flower1 me-1"></i>Cultivo: {r.cultivoNombre}
                          </span>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        <span className={`badge ${prioridadBadge(r.prioridad)} small`}>{r.prioridad}</span>
                        {r.aplicada && <span className="badge bg-success small">✅ Aplicada</span>}
                      </div>
                    </div>
                    <p className="text-muted small mb-2">{r.descripcion}</p>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <span className="text-muted small">
                        <i className="bi bi-person me-1"></i>
                        {r.tecnicoNombre ? `Técnico: ${r.tecnicoNombre}` : 'Sistema'}
                        {r.fechaEmision && <> · <i className="bi bi-calendar me-1"></i>
                          {new Date(r.fechaEmision).toLocaleDateString('es-CO')}</>}
                      </span>
                      {!r.aplicada && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAplicar(r.id)}>
                          <i className="bi bi-check2 me-1"></i>Marcar como aplicada
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {totalPages > 1 && (tab === 'tecnico' || tab === 'todas') && (
        <nav className="mt-4 d-flex justify-content-center">
          <div className="btn-group">
            <button className="btn btn-sm btn-agro-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="btn btn-sm btn-agro disabled">{page + 1} / {totalPages}</span>
            <button className="btn btn-sm btn-agro-outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
