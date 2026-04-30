import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cultivoService, parcelaService, fincaService } from '../services/apiServices';
import { LoadingSpinner } from '../components/UIComponents';
import { useAuth } from '../context/AuthContext';

export default function CultivoFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

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
  const [imagePreview, setImagePreview] = useState('');
  const [availableFincaArea, setAvailableFincaArea] = useState(0);

  useEffect(() => {
    if (user) {
      loadFincas();
      if (isEdit) loadCultivo();
      else setLoading(false);
    }
  }, [id, user]);

  const loadFincas = async () => {
    try {
      const uid = user?.usuarioId;
      if (!uid) return;
      const res = await fincaService.listarPorProductor(uid, 0);
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
        if (c.imagenUrl) setImagePreview(c.imagenUrl);
        setSelectedFinca(c.fincaId || '');
        if (c.fincaId) loadParcelas(c.fincaId);
      }
    } catch { setError('No se pudo cargar el cultivo'); }
    finally { setLoading(false); }
  };

  const loadParcelas = async (fincaId) => {
    try {
      const res = await parcelaService.listarPorFinca(fincaId, 0);
      const pList = res.data?.datos?.content || [];
      setParcelas(pList);

      // Buscar área total: primero en estado local, si no la tenemos aún re-pedimos
      let finca = fincas.find(x => String(x.id) === String(fincaId));
      if (!finca) {
        const fRes = await fincaService.listar(0, 100);
        const allFincas = fRes.data?.datos?.content || [];
        setFincas(allFincas);
        finca = allFincas.find(x => String(x.id) === String(fincaId));
      }
      if (finca) {
        const usedArea = pList.reduce((acc, p) => acc + (p.areaParcela || 0), 0);
        const available = Math.max(0, finca.areaTotal - usedArea);
        setAvailableFincaArea(available);
      }
    } catch {}
  };

  const handleFincaChange = (e) => {
    const fId = e.target.value;
    setSelectedFinca(fId);
    if (fId) loadParcelas(fId);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Manejo de imagen: convierte a base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm(prev => ({ ...prev, imagenUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setForm(prev => ({ ...prev, imagenUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const parsedArea = form.areaUtilizada ? parseInt(form.areaUtilizada) : null;
    const parsedRendimiento = form.rendimientoEsperado ? parseFloat(form.rendimientoEsperado) : null;

    if (parsedArea && parsedArea <= 0) {
      setError('Las hectáreas deben ser un número mayor a 0');
      setSaving(false); return;
    }
    if (parsedArea && availableFincaArea > 0 && parsedArea > availableFincaArea && !isEdit) {
      setError(`Las hectáreas exceden el máximo disponible (${Math.floor(availableFincaArea)} ha)`);
      setSaving(false); return;
    }

    if (form.fechaSiembra && form.fechaCosechaEstimada && new Date(form.fechaSiembra) > new Date(form.fechaCosechaEstimada)) {
      setError('La fecha de siembra no puede ser posterior a la cosecha estimada');
      setSaving(false); return;
    }

    try {
      let finalParcelaId = form.parcelaId;
      if (!isEdit) {
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
        fechaSiembra: form.fechaSiembra || null,
      };
      if (isEdit) await cultivoService.actualizar(id, data);
      else await cultivoService.crear(data);
      navigate('/cultivos');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el cultivo. Verifica los datos.');
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
            {/* Nombre y Variedad */}
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

            {/* Finca, Lote y Hectáreas */}
            <div className="row mb-3">
              <div className="col-4">
                <label className="form-label">Finca *</label>
                <select className="form-select" value={selectedFinca} onChange={handleFincaChange} required disabled={isEdit}>
                  <option value="">Seleccione finca...</option>
                  {fincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label">Nombre del Lote (Opcional)</label>
                <input type="text" className="form-control" name="nombreLote" placeholder="Ej: Lote Norte"
                  value={form.nombreLote} onChange={handleChange} disabled={isEdit} />
              </div>
              <div className="col-4">
                <label className="form-label">Hectáreas de cultivo *</label>
                {availableFincaArea > 0 && !isEdit &&
                  <div className="text-success small fw-bold mb-1">
                    <i className="bi bi-info-circle me-1"></i>
                    Disponibles: {Math.floor(availableFincaArea)} ha
                  </div>
                }
                <input type="number" step="1" className="form-control" name="areaUtilizada"
                  value={form.areaUtilizada} onChange={handleChange} required disabled={isEdit}
                  min="1"
                  {...(availableFincaArea > 0 && !isEdit ? { max: Math.floor(availableFincaArea) } : {})}
                  placeholder="Ej: 5" />
              </div>
            </div>

            {/* Fechas */}
            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Fecha de siembra <span className="text-muted small">(Opcional)</span></label>
                <input type="date" className="form-control" name="fechaSiembra"
                  value={form.fechaSiembra} onChange={handleChange} />
              </div>
              <div className="col-6">
                <label className="form-label">Cosecha estimada <span className="text-muted small">(Opcional)</span></label>
                <input type="date" className="form-control" name="fechaCosechaEstimada"
                  value={form.fechaCosechaEstimada} onChange={handleChange} />
              </div>
            </div>

            {/* Estado y Rendimiento */}
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
                <label className="form-label">Rendimiento esperado <span className="text-muted small">(Opcional)</span></label>
                <input type="number" step="0.1" className="form-control" name="rendimientoEsperado"
                  placeholder="Ej: 8.5" value={form.rendimientoEsperado} onChange={handleChange} />
              </div>
            </div>

            {/* Foto del cultivo */}
            <div className="mb-3">
              <label className="form-label">
                <i className="bi bi-camera me-1"></i>Foto del cultivo <span className="text-muted small">(Opcional)</span>
              </label>

              {imagePreview ? (
                <div className="position-relative d-inline-block">
                  <img src={imagePreview} alt="Vista previa"
                    className="img-thumbnail rounded shadow-sm"
                    style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }} />
                  <div className="mt-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-primary"
                      onClick={() => fileInputRef.current?.click()}>
                      <i className="bi bi-pencil me-1"></i>Cambiar foto
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger"
                      onClick={handleRemoveImage}>
                      <i className="bi bi-trash me-1"></i>Eliminar foto
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="border border-2 border-dashed rounded p-4 text-center text-muted"
                  style={{ cursor: 'pointer', borderColor: '#ccc' }}
                  onClick={() => fileInputRef.current?.click()}>
                  <i className="bi bi-cloud-upload fs-2 d-block mb-2"></i>
                  <span>Haz clic para subir una foto del cultivo</span>
                  <br /><small>JPG, PNG o WEBP · Máx. 5 MB</small>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleImageChange}
              />
            </div>

            {/* Observaciones */}
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
