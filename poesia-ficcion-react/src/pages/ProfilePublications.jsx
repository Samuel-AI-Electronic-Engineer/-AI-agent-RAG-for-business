import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../config/api';
import useAuthStore from '../store/authStore';

function ProfilePublications() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['posts', 'mine'],
        queryFn: async () => {
            const { data } = await api.get('/posts');
            return (data?.items || []).filter((post) => post.author?.id === user?.id);
        },
        enabled: !!user?.id,
    });

    const deleteMutation = useMutation({
        mutationFn: (postId) => api.delete(`/posts/${postId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', 'mine'] }),
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

            <section className="dashboard-card profile-card subpage-card">
                <div className="subpage-card-heading">
                    <div><p className="store-kicker">Biblioteca creativa</p><h2>{posts.length} obras</h2></div>
                    <Link to="/dashboard" className="btn-ghost compact-button">Volver al perfil</Link>
                </div>

                {isLoading ? <p>Cargando publicaciones...</p> : posts.length === 0 ? (
                    <div className="empty-state"><p>Aún no tienes publicaciones.</p><Link to="/publicar" className="btn-ghost compact-button">Crear primera obra</Link></div>
                ) : (
                    <div className="publication-list">
                        {posts.map((post) => (
                            <article className="publication-row" key={post.id}>
                                <div><p className="publication-type">{post.content_type}</p><h3>{post.title}</h3><span>{post.views ?? 0} lecturas · {new Date(post.created_at).toLocaleDateString('es-CO')}</span></div>
                                <div className="row-actions"><Link to={`/poema/${post.id}`} className="btn-ghost compact-button">Ver</Link><button type="button" className="btn-ghost compact-button danger-button" onClick={() => handleDelete(post.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}</button></div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ProfilePublications;
