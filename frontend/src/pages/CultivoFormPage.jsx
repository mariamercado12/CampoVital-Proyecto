import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cultivoService, parcelaService, fincaService } from '../services/apiServices';
import { LoadingSpinner } from '../components/UIComponents';

export default function CultivoFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', variedad: '', nombreLote: '', fechaSiembra: '', fechaCosechaEstimada: '',
    estado: 'PLANIFICADO', areaUtilizada: '', observaciones: '', rendimientoEsperado: '', parcelaId: '',
    imagenUrl: ''
  });
  const [fincas, setFincas] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [selectedFinca, setSelectedFinca] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFincas();
    if (isEdit) loadCultivo();
    else setLoading(false);
  }, [id]);

  const loadFincas = async () => {
    try {
      const res = await fincaService.listar(0, 50);
      setFincas(res.data?.datos?.content || []);
    } catch {}
  };

  const loadCultivo = async () => {
    try {
      const res = await cultivoService.obtener(id);
      const c = res.data?.datos;
      if (c) {
        setForm({
          nombre: c.nombre || '', variedad: c.variedad || '', parcelaId: c.parcelaId || '',
          fechaSiembra: c.fechaSiembra || '', fechaCosechaEstimada: c.fechaCosechaEstimada || '',
          estado: c.estado || 'PLANIFICADO', areaUtilizada: c.areaUtilizada || '',
          observaciones: c.observaciones || '', rendimientoEsperado: c.rendimientoEsperado || '',
          imagenUrl: c.imagenUrl || '',
        });
        setSelectedFinca(c.fincaId || '');
        if (c.fincaId) loadParcelas(c.fincaId);
      }
    } catch { setError('No se pudo cargar el cultivo'); }
    finally { setLoading(false); }
  };

  const [availableFincaArea, setAvailableFincaArea] = useState(0);

  const loadParcelas = async (fincaId) => {
    try {
      const res = await parcelaService.listarPorFinca(fincaId, 0);
      const pList = res.data?.datos?.content || [];
      const f = fincas.find(x => x.id == fincaId);
      if (f) {
        const usedArea = pList.reduce((acc, p) => acc + (p.areaParcela || 0), 0);
        setAvailableFincaArea(Math.max(0, f.areaTotal - usedArea));
      }
    } catch {}
  };

  const handleFincaChange = (e) => {
    const fId = e.target.value;
    setSelectedFinca(fId);
    if (fId) loadParcelas(fId);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const parsedArea = form.areaUtilizada ? parseFloat(form.areaUtilizada) : null;
    const parsedRendimiento = form.rendimientoEsperado ? parseFloat(form.rendimientoEsperado) : null;

    // Validación exhaustiva
    if (parsedArea && parsedArea <= 0) {
      setError('El área utilizada debe ser un número mayor a 0');
      setSaving(false);
      return;
    }
    if (parsedRendimiento && parsedRendimiento < 0) {
      setError('El rendimiento esperado no puede ser negativo');
      setSaving(false);
      return;
    }
    if (form.fechaSiembra && form.fechaCosechaEstimada && new Date(form.fechaSiembra) > new Date(form.fechaCosechaEstimada)) {
      setError('La fecha de siembra no puede ser posterior a la fecha de cosecha estimada');
      setSaving(false);
      return;
    }

    if (parsedArea > availableFincaArea && !isEdit) {
      setError(`El área excede el máximo disponible de la finca (${availableFincaArea.toFixed(2)} ha)`);
      setSaving(false); return;
    }

    try {
      let finalParcelaId = form.parcelaId;
      if (!isEdit) {
        // Auto-crear lote asociado a este cultivo
        const pRes = await parcelaService.crear({
          fincaId: selectedFinca,
          nombre: form.nombreLote || `Lote ${form.nombre}`,
          areaParcela: parsedArea
        });
        finalParcelaId = pRes.data.datos.id;
      }

      const data = {
        ...form,
        parcelaId: finalParcelaId,
        areaUtilizada: parsedArea,
        rendimientoEsperado: parsedRendimiento,
      };
      if (isEdit) await cultivoService.actualizar(id, data);
      else await cultivoService.crear(data);
      navigate('/cultivos');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || 'Error al guardar el cultivo. Verifique los datos o la conectividad.');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h2><i className="bi bi-flower1 me-2"></i>{isEdit ? 'Editar Cultivo' : 'Nuevo Cultivo'}</h2>
      </div>

      <div className="card card-agro">
        <div className="card-body p-3 p-md-4">
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Nombre del cultivo *</label>
                <input type="text" className="form-control" name="nombre" placeholder="Ej: Banano, Cacao"
                  value={form.nombre} onChange={handleChange} required />
              </div>
              <div className="col-6">
                <label className="form-label">Variedad</label>
                <input type="text" className="form-control" name="variedad" placeholder="Ej: Gran Enano"
                  value={form.variedad} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-4">
                <label className="form-label">Finca *</label>
                <select className="form-select" value={selectedFinca} onChange={handleFincaChange} required disabled={isEdit}>
                  <option value="">Seleccione finca...</option>
                  {fincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label">Nombre del Lote (Opc.)</label>
                <input type="text" className="form-control" name="nombreLote" placeholder="Ej: Lote Norte"
                  value={form.nombreLote} onChange={handleChange} disabled={isEdit} />
              </div>
              <div className="col-4">
                <label className="form-label">Hectáreas de cultivo * {availableFincaArea > 0 && !isEdit && <small className="text-success">(Disponibles: {availableFincaArea.toFixed(2)})</small>}</label>
                <input type="number" step="0.1" className="form-control" name="areaUtilizada"
                  value={form.areaUtilizada} onChange={handleChange} required disabled={isEdit} min="0.1" max={isEdit ? '' : availableFincaArea} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Fecha de siembra *</label>
                <input type="date" className="form-control" name="fechaSiembra"
                  value={form.fechaSiembra} onChange={handleChange} required />
              </div>
              <div className="col-6">
                <label className="form-label">Cosecha estimada</label>
                <input type="date" className="form-control" name="fechaCosechaEstimada"
                  value={form.fechaCosechaEstimada} onChange={handleChange} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Estado</label>
                <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
                  <option value="PLANIFICADO">Planificado</option>
                  <option value="SEMBRADO">Sembrado</option>
                  <option value="EN_CRECIMIENTO">En crecimiento</option>
                  <option value="EN_COSECHA">En cosecha</option>
                  <option value="COSECHADO">Cosechado</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Rend. esperado</label>
                <input type="number" step="0.1" className="form-control" name="rendimientoEsperado"
                  placeholder="ton/ha" value={form.rendimientoEsperado} onChange={handleChange} />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">URL de la Imagen del Cultivo (Opcional)</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-camera"></i></span>
                <input type="text" className="form-control" name="imagenUrl" placeholder="https://ejemplo.com/foto.jpg"
                  value={form.imagenUrl} onChange={handleChange} />
              </div>
              <small className="text-muted">Puedes pegar el enlace de una foto de tu cultivo para tener un registro visual.</small>
            </div>

            <div className="mb-4">
              <label className="form-label">Observaciones</label>
              <textarea className="form-control" name="observaciones" rows="2"
                value={form.observaciones} onChange={handleChange} />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-agro flex-grow-1" disabled={saving}>
                {saving ? 'Guardando...' : <><i className="bi bi-check-circle"></i> Guardar</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/cultivos')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
