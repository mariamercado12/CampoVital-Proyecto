import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fincaService, cultivoService, alertaService, recomendacionService } from '../services/apiServices';
import { LoadingSpinner } from '../components/UIComponents';

const TIPO_ALERTA_ICON = {
  SEQUIA: '☀️', INUNDACION: '🌊', HELADA: '❄️', PLAGA: '🐛', ENFERMEDAD: '🦠', VIENTO: '🌬️',
};

export default function DashboardPage() {
  const { user, isProductor, isTecnico, isAdmin } = useAuth();
  const [stats, setStats] = useState({ fincas: 0, cultivos: 0, alertas: 0, recomendaciones: 0, sinConexion: 0 });
  const [alertas, setAlertas] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const uid = user?.usuarioId;
      if (!uid) { setLoading(false); return; }

      // Cargar solo los datos del usuario logueado
      const [fincasRes, cultivosRes, alertasRes, recomRes] = await Promise.allSettled([
        fincaService.listarPorProductor(uid, 0),
        cultivoService.listarPorProductor(uid, 0),
        alertaService.listarActivas(0),
        recomendacionService.listarPorProductor(uid, 0),
      ]);

      const totalFincas   = fincasRes.status   === 'fulfilled' ? (fincasRes.value.data?.datos?.totalElements   || fincasRes.value.data?.datos?.content?.length || 0) : 0;
      const totalCultivos = cultivosRes.status === 'fulfilled' ? (cultivosRes.value.data?.datos?.totalElements || cultivosRes.value.data?.datos?.content?.length || 0) : 0;
      const totalAlertas  = alertasRes.status  === 'fulfilled' ? (alertasRes.value.data?.datos?.totalElements  || alertasRes.value.data?.datos?.content?.length || 0) : 0;
      const totalRecom    = recomRes.status    === 'fulfilled' ? (recomRes.value.data?.datos?.totalElements    || recomRes.value.data?.datos?.content?.length || 0) : 0;

      // Datos sin internet (guardados localmente)
      let sinConexion = 0;
      try { sinConexion = JSON.parse(localStorage.getItem('offlineQueue') || '[]').length; } catch {}

      setStats({ fincas: totalFincas, cultivos: totalCultivos, alertas: totalAlertas, recomendaciones: totalRecom, sinConexion });
      setAlertas(alertasRes.status === 'fulfilled' ? (alertasRes.value.data?.datos?.content?.slice(0, 3) || []) : []);
      setRecomendaciones(recomRes.status === 'fulfilled' ? (recomRes.value.data?.datos?.content?.slice(0, 3) || []) : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando tu panel..." />;

  const nombre = user?.nombreCompleto?.split(' ')[0] || 'Agricultor';

  return (
    <div className="content-wrapper">

      {/* ── Saludo ────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">¡Hola, {nombre}!</h2>
        <p className="text-muted mb-0">
          {isAdmin()    && 'Panel de administración del sistema'}
          {isProductor()&& 'Este es el resumen de tu campo hoy'}
          {isTecnico()  && 'Tus recomendaciones y zonas asignadas'}
        </p>
      </div>

      {/* ── Tarjetas de estadísticas ───────────────────── */}
      <div className="row g-3 mb-4">
        {/* Fincas */}
        <div className="col-6 col-md-3">
          <Link to="/fincas" className="text-decoration-none">
            <div className="stat-card">
              <div className="stat-icon bg-green"><i className="bi bi-geo-alt-fill"></i></div>
              <div>
                <div className="stat-value">{stats.fincas}</div>
                <div className="stat-label">Mis Fincas</div>
              </div>
            </div>
          </Link>
        </div>
        {/* Cultivos */}
        <div className="col-6 col-md-3">
          <Link to="/cultivos" className="text-decoration-none">
            <div className="stat-card" style={{ borderLeftColor: 'var(--color-accent)' }}>
              <div className="stat-icon bg-amber"><i className="bi bi-flower1"></i></div>
              <div>
                <div className="stat-value">{stats.cultivos}</div>
                <div className="stat-label">Cultivos Activos</div>
              </div>
            </div>
          </Link>
        </div>
        {/* Alertas */}
        <div className="col-6 col-md-3">
          <Link to="/alertas" className="text-decoration-none">
            <div className="stat-card" style={{ borderLeftColor: 'var(--color-danger)' }}>
              <div className="stat-icon bg-red"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <div>
                <div className="stat-value">{stats.alertas}</div>
                <div className="stat-label">Alertas del Clima</div>
              </div>
            </div>
          </Link>
        </div>
        {/* Recomendaciones */}
        <div className="col-6 col-md-3">
          <Link to="/recomendaciones" className="text-decoration-none">
            <div className="stat-card" style={{ borderLeftColor: 'var(--color-info)' }}>
              <div className="stat-icon bg-blue"><i className="bi bi-lightbulb-fill"></i></div>
              <div>
                <div className="stat-value">{stats.recomendaciones}</div>
                <div className="stat-label">Consejos Pendientes</div>
              </div>
            </div>
          </Link>
        </div>
        {/* Sin conexión (antes "Pendientes de Sync") */}
        {isProductor() && (
          <div className="col-6 col-md-3">
            <Link to="/sincronizacion" className="text-decoration-none">
              <div className="stat-card" style={{ borderLeftColor: '#6c757d' }}>
                <div className="stat-icon" style={{ background: '#6c757d', color: '#fff' }}>
                  <i className="bi bi-wifi-off"></i>
                </div>
                <div>
                  <div className="stat-value">{stats.sinConexion}</div>
                  <div className="stat-label">Guardados sin Internet</div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>


      <div className="card card-agro mb-4">
        <div className="card-header"><i className="bi bi-lightning-charge me-2"></i>Acciones Rápidas</div>
        <div className="card-body">
          <div className="row g-2">
            {(isProductor() || isAdmin()) && (<>
              <div className="col-6 col-md-3">
                <Link to="/fincas/nueva" className="btn btn-agro-outline w-100 d-flex flex-column align-items-center py-3">
                  <i className="bi bi-plus-circle fs-4 mb-1"></i><small>Nueva Finca</small>
                </Link>
              </div>
              <div className="col-6 col-md-3">
                <Link to="/cultivos/nuevo" className="btn btn-agro-outline w-100 d-flex flex-column align-items-center py-3">
                  <i className="bi bi-flower1 fs-4 mb-1"></i><small>Registrar Cultivo</small>
                </Link>
              </div>
            </>)}
            <div className="col-6 col-md-3">
              <Link to="/alertas" className="btn btn-agro-outline w-100 d-flex flex-column align-items-center py-3">
                <i className="bi bi-cloud-sun fs-4 mb-1"></i><small>Alertas del Clima</small>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/recomendaciones" className="btn btn-agro-outline w-100 d-flex flex-column align-items-center py-3">
                <i className="bi bi-journal-check fs-4 mb-1"></i><small>Ver Consejos</small>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alertas recientes ─────────────────────────── */}
      {alertas.length > 0 && (
        <div className="card card-agro mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-exclamation-triangle me-2 text-danger"></i>Alertas Climáticas Activas</span>
            <Link to="/alertas" className="btn btn-sm btn-light">Ver todas</Link>
          </div>
          <div className="card-body p-0">
            {alertas.map((a) => (
              <div key={a.id} className="d-flex align-items-start gap-3 p-3 border-bottom">
                <span style={{ fontSize: '1.5rem' }}>{TIPO_ALERTA_ICON[a.tipo] || '⚠️'}</span>
                <div className="flex-grow-1">
                  <div className="fw-semibold small">{a.titulo}</div>
                  <div className="text-muted small">{a.descripcion?.substring(0, 100)}...</div>
                  {a.municipiosAfectados?.length > 0 && (
                    <div className="text-muted small mt-1">
                      <i className="bi bi-geo-alt me-1"></i>{a.municipiosAfectados.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Consejos recientes ────────────────────────── */}
      {recomendaciones.length > 0 && (
        <div className="card card-agro">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-lightbulb me-2 text-warning"></i>Últimos Consejos Recibidos</span>
            <Link to="/recomendaciones" className="btn btn-sm btn-light">Ver todos</Link>
          </div>
          <div className="card-body p-0">
            {recomendaciones.map((r) => (
              <div key={r.id} className="d-flex align-items-start gap-3 p-3 border-bottom">
                <span className="badge bg-warning bg-opacity-20 text-warning p-2 rounded">
                  <i className="bi bi-lightbulb"></i>
                </span>
                <div className="flex-grow-1">
                  <div className="fw-semibold small">{r.titulo || 'Consejo del sistema'}</div>
                  <div className="text-muted small">{r.descripcion?.substring(0, 120)}...</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-person me-1"></i>
                    {r.tecnicoNombre ? `Técnico: ${r.tecnicoNombre}` : '🤖 Generado por el sistema'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
