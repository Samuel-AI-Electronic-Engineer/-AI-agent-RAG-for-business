import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { deletePost, getMyPosts, submitPostForReview } from '../services/postsService';

const STATUS_LABELS = {
    draft: { label: 'Borrador', pill: 'neutral' },
    pending_review: { label: 'En revisión', pill: 'warning' },
    published: { label: 'Publicado', pill: 'success' },
    rejected: { label: 'Rechazado', pill: 'danger' },
};

const TABS = [
    { value: null, label: 'Todas' },
    { value: 'draft', label: 'Borradores' },
    { value: 'pending_review', label: 'En revisión' },
    { value: 'published', label: 'Publicadas' },
    { value: 'rejected', label: 'Rechazadas' },
];

function ProfilePublications() {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(null);
    const [feedback, setFeedback] = useState('');

    const { data: posts = [], isLoading, isError } = useQuery({
        queryKey: ['posts', 'mine', activeTab],
        queryFn: async () => {
            const data = await getMyPosts(1, 50, activeTab);
            return data?.items || [];
        },
        enabled: !!user?.id,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['posts', 'mine'] });

    const deleteMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: invalidate,
    });

    const submitMutation = useMutation({
        mutationFn: submitPostForReview,
        onSuccess: () => {
            setFeedback('La obra fue enviada a revisión.');
            invalidate();
        },
        onError: (err) => setFeedback(err?.response?.data?.detail || 'No se pudo enviar a revisión.'),
    });

    const handleDelete = (postId) => {
        if (window.confirm('¿Seguro que quieres eliminar esta obra?')) deleteMutation.mutate(postId);
    };

    return (
        <main className="page page-dashboard profile-subpage">
            <div className="subpage-heading">
                <div>
                    <p className="store-kicker">Tu espacio personal</p>
                    <h1>Mis <em>publicaciones</em></h1>
                    <p>Administra tus poemas, cuentos y piezas publicadas desde un solo lugar.</p>
                </div>
                <Link to="/publicar" className="btn-primary subpage-action">Nueva obra</Link>
            </div>

            {location.state?.justCreated && (
                <p className="status-text success" role="status" style={{ marginBottom: '1rem' }}>
                    Tu obra se guardó como borrador. Puedes seguir editándola o enviarla a revisión cuando estés lista.
                </p>
            )}

            <section className="dashboard-card profile-card subpage-card">
                <div className="subpage-card-heading">
                    <div><p className="store-kicker">Biblioteca creativa</p><h2>{posts.length} obras</h2></div>
                    <Link to="/dashboard" className="btn-ghost compact-button">Volver al perfil</Link>
                </div>

                <div className="category-tabs" role="tablist" aria-label="Filtrar por estado" style={{ marginBottom: '1rem' }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.label}
                            type="button"
                            className={activeTab === tab.value ? 'active' : ''}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {feedback && <p className="status-text" role="status" style={{ marginBottom: '1rem' }}>{feedback}</p>}

                {isLoading ? (
                    <p>Cargando publicaciones...</p>
                ) : isError ? (
                    <p className="status-text error" role="alert">No fue posible cargar tus publicaciones. Intenta de nuevo.</p>
                ) : posts.length === 0 ? (
                    <div className="empty-state"><p>Aún no tienes publicaciones en este estado.</p><Link to="/publicar" className="btn-ghost compact-button">Crear primera obra</Link></div>
                ) : (
                    <div className="publication-list">
                        {posts.map((post) => {
                            const statusInfo = STATUS_LABELS[post.publication_status] || STATUS_LABELS.draft;
                            const canSubmit = post.publication_status === 'draft' || post.publication_status === 'rejected';
                            return (
                                <article className="publication-row" key={post.id}>
                                    <div>
                                        <p className="publication-type">{post.content_type}</p>
                                        <h3>{post.title}</h3>
                                        <span className={`status-pill ${statusInfo.pill}`} style={{ marginRight: '0.5rem' }}>{statusInfo.label}</span>
                                        <span>{post.views ?? 0} lecturas · {new Date(post.created_at).toLocaleDateString('es-CO')}</span>
                                    </div>
                                    <div className="row-actions">
                                        <Link to={`/poema/${post.id}`} className="btn-ghost compact-button">Ver</Link>
                                        {canSubmit && (
                                            <button
                                                type="button"
                                                className="btn-ghost compact-button"
                                                onClick={() => submitMutation.mutate(post.id)}
                                                disabled={submitMutation.isPending}
                                            >
                                                Enviar a revisión
                                            </button>
                                        )}
                                        <button type="button" className="btn-ghost compact-button danger-button" onClick={() => handleDelete(post.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}</button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ProfilePublications;

