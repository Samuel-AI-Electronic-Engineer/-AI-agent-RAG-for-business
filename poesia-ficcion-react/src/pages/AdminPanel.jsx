import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const adminSections = [
    { to: '/admin', label: 'Resumen', description: 'Visión general', icon: '◌' },
    { to: '/admin/usuarios', label: 'Usuarios', description: 'Accesos y permisos', icon: '◎' },
    { to: '/admin/publicaciones', label: 'Publicaciones', description: 'Contenido editorial', icon: '✦' },
    { to: '/admin/estadisticas', label: 'Estadísticas', description: 'Rendimiento', icon: '▣' },
    { to: '/admin/moderacion', label: 'Moderación', description: 'Revisión y alertas', icon: '⚑' },
    { to: '/admin/configuracion', label: 'Configuración', description: 'Preferencias', icon: '⚙' },
];

const mockUsers = [
    { id: 1, name: 'Ana Torres', role: 'Admin', status: 'Activo', lastLogin: 'Hace 2 horas' },
    { id: 2, name: 'Mateo Ruiz', role: 'Editor', status: 'Activo', lastLogin: 'Hace 6 horas' },
    { id: 3, name: 'Lucía Gómez', role: 'Lector', status: 'Pendiente', lastLogin: 'Hoy' },
    { id: 4, name: 'Daniel Peña', role: 'Moderador', status: 'Activo', lastLogin: 'Ayer' },
];

const mockPosts = [
    { id: 101, title: 'Voces bajo la lluvia', author: 'Ana Torres', status: 'Publicado', views: 1234 },
    { id: 102, title: 'Piedra de amanecer', author: 'Mateo Ruiz', status: 'Revisión', views: 842 },
    { id: 103, title: 'Bajo la luna de vidrio', author: 'Lucía Gómez', status: 'Borrador', views: 321 },
    { id: 104, title: 'Cartografía de la duda', author: 'Daniel Peña', status: 'Publicado', views: 942 },
];

const adminCards = [
    { label: 'Usuarios activos', value: '1.284', hint: '+12% vs. semana pasada' },
    { label: 'Publicaciones', value: '328', hint: '18 pendientes de revisión' },
    { label: 'Ventas', value: '$14.2K', hint: 'Crecimiento de 9.4%' },
    { label: 'Tasa de lectura', value: '68%', hint: 'Satisfacción alta' },
];

function AdminSidebar() {
    return (
        <aside className="dashboard-sidebar admin-sidebar">
            <div className="sidebar-brand">
                <span className="brand-mark">✦</span>
                <div>
                    <p className="store-kicker">Panel</p>
                    <h2>Administración</h2>
                </div>
            </div>

            <nav className="sidebar-nav">
                {adminSections.map((section) => (
                    <NavLink
                        key={section.to}
                        to={section.to}
                        end={section.to === '/admin'}
                        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    >
                        <span className="sidebar-icon">{section.icon}</span>
                        <span>
                            <strong>{section.label}</strong>
                            <small>{section.description}</small>
                        </span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

function OverviewPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Resumen ejecutivo</p>
                    <h1>Control editorial y de comunidad</h1>
                </div>
                <button type="button" className="btn-primary panel-action">Exportar reporte</button>
            </div>

            <div className="metric-grid">
                {adminCards.map((card) => (
                    <article key={card.label} className="metric-card">
                        <p>{card.label}</p>
                        <h3>{card.value}</h3>
                        <span>{card.hint}</span>
                    </article>
                ))}
            </div>

            <div className="admin-grid">
                <article className="panel-card">
                    <div className="panel-card-head">
                        <div>
                            <p className="store-kicker">Actividad reciente</p>
                            <h2>Ritmo de la plataforma</h2>
                        </div>
                    </div>
                    <div className="activity-list">
                        <div><strong>+42</strong><span>Nuevas suscripciones este mes</span></div>
                        <div><strong>+19</strong><span>Publicaciones aprobadas</span></div>
                        <div><strong>03</strong><span>Reportes de moderación abiertos</span></div>
                        <div><strong>06</strong><span>Compras con envío pendiente</span></div>
                    </div>
                </article>

                <article className="panel-card">
                    <div className="panel-card-head">
                        <div>
                            <p className="store-kicker">Prioridades</p>
                            <h2>Qué revisar hoy</h2>
                        </div>
                    </div>
                    <ul className="checklist">
                        <li>Validar nuevas piezas en revisión editorial.</li>
                        <li>Revisar el inventario de la librería y precios.</li>
                        <li>Confirmar pedidos con estado de preparación.</li>
                        <li>Revisar desempeño de campañas de newsletter.</li>
                    </ul>
                </article>
            </div>
        </section>
    );
}

function UsersPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Gestión de usuarios</p>
                    <h1>Usuarios y permisos</h1>
                </div>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último acceso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockUsers.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.role}</td>
                                <td><span className={`status-pill ${user.status === 'Activo' ? 'success' : 'warning'}`}>{user.status}</span></td>
                                <td>{user.lastLogin}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function PublicationsPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Contenido</p>
                    <h1>Publicaciones editorial</h1>
                </div>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Autor</th>
                            <th>Estado</th>
                            <th>Lecturas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockPosts.map((post) => (
                            <tr key={post.id}>
                                <td>{post.title}</td>
                                <td>{post.author}</td>
                                <td><span className={`status-pill ${post.status === 'Publicado' ? 'success' : post.status === 'Revisión' ? 'warning' : 'neutral'}`}>{post.status}</span></td>
                                <td>{post.views}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function StatsPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Estadísticas</p>
                    <h1>Rendimiento general</h1>
                </div>
            </div>
            <div className="metric-grid">
                <article className="metric-card"><p>Tiempo promedio</p><h3>4m 28s</h3><span>Lectura por sesión</span></article>
                <article className="metric-card"><p>Retención</p><h3>74%</h3><span>Usuarios activos 30 días</span></article>
                <article className="metric-card"><p>Conversión</p><h3>12.8%</h3><span>Visitantes compran alguna edición</span></article>
                <article className="metric-card"><p>Newsletter</p><h3>8.4%</h3><span>CTR sobre campañas</span></article>
            </div>
        </section>
    );
}

function ModerationPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Moderación</p>
                    <h1>Revisión y alertas</h1>
                </div>
            </div>
            <div className="admin-grid">
                <article className="panel-card">
                    <div className="panel-card-head"><h2>Alertas</h2></div>
                    <ul className="checklist">
                        <li>Dos publicaciones con reportes repetidos.</li>
                        <li>Un comentario marcado como spam.</li>
                        <li>Una tienda con stock bajo.</li>
                    </ul>
                </article>
                <article className="panel-card">
                    <div className="panel-card-head"><h2>Tránsito</h2></div>
                    <div className="activity-list">
                        <div><strong>03</strong><span>Casos pendientes de revisión</span></div>
                        <div><strong>11</strong><span>Reportes resueltos hoy</span></div>
                    </div>
                </article>
            </div>
        </section>
    );
}

function SettingsPage() {
    return (
        <section className="panel-section">
            <div className="panel-header">
                <div>
                    <p className="store-kicker">Configuración</p>
                    <h1>Ajustes del ecosistema</h1>
                </div>
            </div>
            <div className="admin-grid">
                <article className="panel-card">
                    <div className="panel-card-head"><h2>General</h2></div>
                    <ul className="checklist">
                        <li>Nombre del sitio: Poesía y Ficción</li>
                        <li>Idioma por defecto: Español</li>
                        <li>Newsletter habilitada</li>
                    </ul>
                </article>
                <article className="panel-card">
                    <div className="panel-card-head"><h2>Seguridad</h2></div>
                    <ul className="checklist">
                        <li>Autenticación JWT activa</li>
                        <li>Roles y permisos configurados</li>
                        <li>Registro de auditoría habilitado</li>
                    </ul>
                </article>
            </div>
        </section>
    );
}

function AdminPanel() {
    const { token, user } = useAuthStore();

    if (!token) return <Navigate to="/login" replace />;
    if (!user?.is_admin) return <Navigate to="/libreria" replace />;

    return (
        <main className="page admin-page">
            <div className="dashboard-shell admin-shell">
                <AdminSidebar />
                <section className="dashboard-content admin-content">
                    <Routes>
                        <Route index element={<OverviewPage />} />
                        <Route path="usuarios" element={<UsersPage />} />
                        <Route path="publicaciones" element={<PublicationsPage />} />
                        <Route path="estadisticas" element={<StatsPage />} />
                        <Route path="moderacion" element={<ModerationPage />} />
                        <Route path="configuracion" element={<SettingsPage />} />
                    </Routes>
                </section>
            </div>
        </main>
    );
}

export default AdminPanel;
