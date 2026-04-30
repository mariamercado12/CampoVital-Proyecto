import { useState, useEffect, useCallback } from 'react';
import { alertaService } from '../services/apiServices';
import { getClima, getHoyClima, generarAlertasClimaticas, WEATHER_ICONS, WEATHER_CODES } from '../services/climaService';
import { LoadingSpinner, EmptyState } from '../components/UIComponents';

const TIPO_ICONS = {
  SEQUIA: '☀️', INUNDACION: '🌊', HELADA: '❄️', TORMENTA: '⛈️',
  VIENTO_FUERTE: '💨', ONDA_DE_CALOR: '🔥', GRANIZO: '🧊',
  PLAGA: '🐛', ENFERMEDAD: '🦠', VIENTO: '💨', OTRO: '⚠️',
};

const NIVEL_CLASS = { danger: 'border-danger', warning: 'border-warning', info: 'border-info' };
const NIVEL_BADGE = { danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info text-dark' };

// Comprueba si una alerta fue emitida hoy
const esDeHoy = (fechaStr) => {
  if (!fechaStr) return false;
  const hoy = new Date().toISOString().split('T')[0];
  return new Date(fechaStr).toISOString().split('T')[0] === hoy;
};

// Comprueba si una alerta es de los últimos 3 días
const esDeUltimos3Dias = (fechaStr) => {
  if (!fechaStr) return false;
  const hace3dias = new Date();
  hace3dias.setDate(hace3dias.getDate() - 3);
  return new Date(fechaStr) >= hace3dias;
};

export default function AlertasPage() {
  const [alertasDB, setAlertasDB] = useState([]);
  const [alertasClima, setAlertasClima] = useState([]);
  const [climaHoy, setClimaHoy]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('activas');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar alertas del backend
      const [activasRes, historialRes] = await Promise.allSettled([
        alertaService.listarActivas(0),
        alertaService.listarHistorial(0),
      ]);

      const todasActivas  = activasRes.status  === 'fulfilled' ? (activasRes.value.data?.datos?.content  || []) : [];
      const todasHistorial= historialRes.status === 'fulfilled' ? (historialRes.value.data?.datos?.content || []) : [];

      setAlertasDB({
        activas:   todasActivas.filter(a => esDeHoy(a.fechaEmision)),
        historial: todasHistorial.filter(a => esDeUltimos3Dias(a.fechaEmision)),
      });

      // Cargar clima externo (Open-Meteo, con cache 8h)
      const clima = await getClima();
      const hoy = getHoyClima(clima);
      setClimaHoy(hoy);
      setAlertasClima(generarAlertasClimaticas(hoy));
      setUltimaActualizacion(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    // Refrescar cada 8 horas
    const interval = setInterval(cargarDatos, 8 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const alertasActivas  = alertasDB.activas  || [];
  const alertasHistorial= alertasDB.historial || [];

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h2><i className="bi bi-exclamation-triangle me-2"></i>Alertas Climáticas</h2>
        {ultimaActualizacion && (
          <small className="text-muted">
            <i className="bi bi-arrow-repeat me-1"></i>
            Actualizado: {ultimaActualizacion.toLocaleTimeString('es-CO')}
            <span className="ms-1 text-success">(cada 8h)</span>
          </small>
        )}
      </div>

      {/* Widget clima actual */}
      {climaHoy && (
        <div className="card card-agro mb-3" style={{ background: 'linear-gradient(135deg, #1a6b3c 0%, #2d9e5f 100%)', color: '#fff' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div className="small opacity-75">Clima hoy — Magdalena, Colombia</div>
                <div className="fs-4 fw-bold">
                  {WEATHER_ICONS[0]} {climaHoy.tempMax}°C máx / {climaHoy.tempMin}°C mín
                </div>
              </div>
              <div className="d-flex gap-3 flex-wrap text-center">
                <div>
                  <div className="fs-5">🌧️</div>
                  <div className="small">{climaHoy.probLluvia}% lluvia</div>
                  <div className="small opacity-75">{climaHoy.lluviaMm?.toFixed(1)} mm</div>
                </div>
                <div>
                  <div className="fs-5">💨</div>
                  <div className="small">{climaHoy.vientoMax} km/h</div>
                  <div className="small opacity-75">viento</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-3 gap-1">
        <li><button className={`btn btn-sm ${tab === 'activas' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setTab('activas')}>
          <i className="bi bi-bell-fill me-1"></i>Alertas de Hoy
          {(alertasActivas.length + alertasClima.length) > 0 &&
            <span className="badge bg-light text-danger ms-1">{alertasActivas.length + alertasClima.length}</span>}
        </button></li>
        <li><button className={`btn btn-sm ${tab === 'historial' ? 'btn-agro' : 'btn-agro-outline'}`}
          onClick={() => setTab('historial')}>
          <i className="bi bi-clock-history me-1"></i>Historial
        </button></li>
      </ul>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* ── TAB ACTIVAS (solo hoy) ── */}
          {tab === 'activas' && (
            <div className="d-flex flex-column gap-3">
              {/* Alertas generadas por el clima */}
              {alertasClima.map((a, i) => (
                <div key={`clima-${i}`} className={`card border-start border-4 border-0 shadow-sm ${NIVEL_CLASS[a.nivel]}`}>
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-3">
                      <span className="fs-3">{a.icono}</span>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="fw-bold mb-0">{a.titulo}</h6>
                          <div className="d-flex gap-1">
                            <span className="badge bg-danger">Hoy</span>
                            <span className="badge bg-success bg-opacity-20 text-success small">
                              <i className="bi bi-cpu me-1"></i>Sistema
                            </span>
                          </div>
                        </div>
                        <p className="text-muted small mb-2">{a.descripcion}</p>
                        {a.municipio && (
                          <div className="mt-1">
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-geo-alt-fill me-1 text-success"></i>Municipio: {a.municipio}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Alertas del backend emitidas hoy */}
              {alertasActivas.map((a) => (
                <div key={a.id} className="card border-start border-4 border-danger border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-3">
                      <span className="fs-3">{TIPO_ICONS[a.tipo] || '⚠️'}</span>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="fw-bold mb-0">{a.titulo}</h6>
                          <span className="badge bg-danger">Activa</span>
                        </div>
                        <p className="text-muted small mb-2">{a.descripcion}</p>
                        <div className="d-flex flex-wrap gap-2">
                          {a.municipiosAfectados?.map((m, i) => (
                            <span key={i} className="badge bg-light text-dark border small">
                              <i className="bi bi-geo-alt me-1"></i>{m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {alertasClima.length === 0 && alertasActivas.length === 0 && (
                <EmptyState icon="🌤️" text="¡No hay alertas climáticas para hoy! El clima luce estable." />
              )}
            </div>
          )}

          {/* ── TAB HISTORIAL (últimos 3 días) ── */}
          {tab === 'historial' && (
            <div className="d-flex flex-column gap-3">
              {alertasHistorial.length === 0 ? (
                <EmptyState icon="📅" text="No hay alertas en los últimos 3 días" />
              ) : (
                alertasHistorial.map((a) => (
                  <div key={a.id} className={`card border-0 shadow-sm ${a.activa ? 'border-start border-danger border-4' : 'border-start border-secondary border-4'}`}>
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3">
                        <span className="fs-3">{TIPO_ICONS[a.tipo] || '⚠️'}</span>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="fw-bold mb-0">{a.titulo}</h6>
                            {a.activa
                              ? <span className="badge bg-danger">Activa</span>
                              : <span className="badge bg-secondary">Pasada</span>}
                          </div>
                          <p className="text-muted small mb-2">{a.descripcion}</p>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {a.municipiosAfectados?.map((m, i) => (
                              <span key={i} className="badge bg-light text-dark border small">
                                <i className="bi bi-geo-alt me-1"></i>{m}
                              </span>
                            ))}
                          </div>
                          <div className="text-muted small">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(a.fechaEmision).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
