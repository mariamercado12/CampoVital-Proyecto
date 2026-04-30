import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fincaService, parcelaService } from '../services/apiServices';
import { offlineService } from '../services/offlineService';
import { LoadingSpinner, EmptyState, ConfirmModal } from '../components/UIComponents';
import { useToast } from '../hooks/useAppHooks';
import { useAuth } from '../context/AuthContext';

export default function FincasPage() {
  const [fincas, setFincas] = useState([]);
  const [parcelasPorFinca, setParcelasPorFinca] = useState({});
  const [pendingFincas, setPendingFincas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedFinca, setExpandedFinca] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadFincas(); loadPending(); }, [page]);

  const loadPending = () => {
    const ops = offlineService.getPendingOps();
    const creates = ops.filter(o => o.entidad === 'FINCA' && o.accion === 'CREATE')
                      .map(o => ({...JSON.parse(o.datosJson), id: 'pending-'+o.id, isPending: true}));
    setPendingFincas(creates);
  };

  const loadFincas = async () => {
    setLoading(true);
    try {
      const uid = user?.usuarioId;
      if (!uid) { setFincas([]); setLoading(false); return; }
      const res = await fincaService.listarPorProductor(uid, page);
      const lista = res.data?.datos?.content || [];
      setFincas(lista);
      setTotalPages(res.data?.datos?.totalPages || 0);
      // Cargar parcelas de cada finca en paralelo
      const parcelasMap = {};
      await Promise.all(lista.map(async (f) => {
        try {
          const pr = await parcelaService.listarPorFinca(f.id, 0);
          parcelasMap[f.id] = pr.data?.datos?.content || [];
        } catch { parcelasMap[f.id] = []; }
      }));
      setParcelasPorFinca(parcelasMap);
    } catch { setFincas([]); }
    finally { setLoading(false); }
  };

  const getAreaStats = (finca) => {
    const parcelas = parcelasPorFinca[finca.id] || [];
    const ocupada = parcelas.reduce((acc, p) => acc + (p.areaParcela || 0), 0);
    const libre = Math.max(0, finca.areaTotal - ocupada);
    const pct = finca.areaTotal > 0 ? Math.min(100, (ocupada / finca.areaTotal) * 100) : 0;
    return { ocupada, libre, pct, parcelas };
  };

  const handleDelete = async () => {
    try {
      await fincaService.eliminar(deleteId);
      addToast('Finca eliminada', 'success');
      loadFincas();
    } catch { addToast('No se pudo eliminar', 'danger'); }
    setDeleteId(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h2><i className="bi bi-geo-alt me-2"></i>Mis Fincas</h2>
        <Link to="/fincas/nueva" className="btn btn-agro"><i className="bi bi-plus-circle"></i> Nueva Finca</Link>
      </div>

      {fincas.length === 0 && pendingFincas.length === 0 ? (
        <EmptyState icon="🏡" text="Aún no tienes fincas registradas"
          action={<Link to="/fincas/nueva" className="btn btn-agro">Registrar primera finca</Link>} />
      ) : (
        <>
          <div className="row g-3">
            {[...pendingFincas, ...fincas].map((f) => {
              const stats = f.isPending ? null : getAreaStats(f);
              const isExpanded = expandedFinca === f.id;
              return (
                <div key={f.id} className="col-12 col-md-6">
                  <div className="card card-agro h-100">
                    <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => navigate(`/fincas/${f.id}`)}>
                      {/* Encabezado */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0">{f.nombre}</h6>
                        {f.isPending ? (
                          <span className="badge bg-warning text-dark small"><i className="bi bi-clock me-1"></i>Pendiente</span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success small">Activa</span>
                        )}
                      </div>

                      {/* Info básica */}
                      <div className="d-flex flex-wrap gap-3 text-muted small mb-3">
                        <span><i className="bi bi-geo-alt me-1"></i>{f.municipio}</span>
                        {f.vereda && <span><i className="bi bi-signpost me-1"></i>{f.vereda}</span>}
                        {f.latitud && f.longitud && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${f.latitud},${f.longitud}`}
                            target="_blank" rel="noreferrer" className="text-primary text-decoration-none"
                            onClick={(e) => e.stopPropagation()}>
                            <i className="bi bi-map me-1"></i>Ver Mapa
                          </a>
                        )}
                      </div>

                      {/* Estadísticas de hectáreas */}
                      {stats && (
                        <div className="mb-2">
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="fw-semibold"><i className="bi bi-rulers me-1"></i>{f.areaTotal} ha en total</span>
                            <span>
                              <span className="text-danger me-2">
                                <i className="bi bi-lock-fill me-1"></i>{stats.ocupada.toFixed(0)} ha ocupadas
                              </span>
                              <span className="text-success fw-bold">
                                <i className="bi bi-unlock-fill me-1"></i>{stats.libre.toFixed(0)} ha libres
                              </span>
                            </span>
                          </div>
                          <div className="progress" style={{ height: '10px', borderRadius: '6px' }}>
                            <div className="progress-bar bg-danger" style={{ width: `${stats.pct}%`, borderRadius: '6px 0 0 6px' }}></div>
                            <div className="progress-bar bg-success" style={{ width: `${100 - stats.pct}%`, borderRadius: '0 6px 6px 0', opacity: 0.5 }}></div>
                          </div>
                        </div>
                      )}

                      {/* Desglose de parcelas */}
                      {stats && stats.parcelas.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                            onClick={(e) => { e.stopPropagation(); setExpandedFinca(isExpanded ? null : f.id); }}>
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
                            {stats.parcelas.length} cultivo(s) ocupando hectáreas
                          </button>
                          {isExpanded && (
                            <div className="mt-2 border rounded p-2 bg-light small">
                              {stats.parcelas.map(p => (
                                <div key={p.id} className="d-flex justify-content-between py-1 border-bottom">
                                  <span><i className="bi bi-flower1 me-1 text-success"></i>{p.nombre}</span>
                                  <span className="fw-semibold text-danger">{p.areaParcela} ha</span>
                                </div>
                              ))}
                              <div className="d-flex justify-content-between pt-1 fw-bold">
                                <span className="text-muted">Libre</span>
                                <span className="text-success">{stats.libre.toFixed(0)} ha</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="card-footer bg-transparent border-0 d-flex gap-2 pt-0 pb-3 px-3">
                      <Link to={f.isPending ? "#" : `/fincas/${f.id}/editar`}
                        className={`btn btn-sm btn-agro-outline flex-grow-1 ${f.isPending ? 'disabled' : ''}`}
                        onClick={(e) => { e.stopPropagation(); if(f.isPending) e.preventDefault(); }}>
                        <i className="bi bi-pencil"></i> Editar
                      </Link>
                      <button className="btn btn-sm btn-outline-danger flex-grow-1"
                        disabled={f.isPending}
                        onClick={(e) => { e.stopPropagation(); setDeleteId(f.id); }}>
                        <i className="bi bi-trash"></i> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
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
        </>
      )}

      <ConfirmModal show={!!deleteId} title="Eliminar finca"
        message="¿Está seguro de eliminar esta finca? Los lotes y cultivos asociados también se desactivarán."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
