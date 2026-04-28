import { useAuth } from '../context/AuthContext';

export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h2><i className="bi bi-person me-2"></i>Mi Perfil</h2>
      </div>

      <div className="card card-agro">
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: 80, height: 80 }}>
              <i className="bi bi-person-fill text-success fs-1"></i>
            </div>
            <h4 className="fw-bold mb-0">{user?.nombreCompleto}</h4>
            <span className="text-muted">{user?.email}</span>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">ID de Usuario</div>
                <div className="fw-semibold">{user?.usuarioId}</div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">Roles</div>
                <div className="d-flex gap-1 flex-wrap">
                  {user?.roles?.map((r) => (
                    <span key={r} className="badge bg-success bg-opacity-10 text-success">
                      {r.replace('ROLE_', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
