import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPost } from '../services/postsService';

function PoemDetail() {
    const { id } = useParams();

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ['post', id],
        queryFn: () => getPost(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <main className="page">
                <div className="form-card" style={{ maxWidth: '760px' }}>
                    <p>Cargando obra...</p>
                </div>
            </main>
        );
    }

    if (isError || !post) {
        return (
            <main className="page">
                <div className="form-card" style={{ maxWidth: '760px' }}>
                    <p className="status-text error">No se pudo cargar esta obra.</p>
                    <Link to="/" className="btn-ghost" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Volver al inicio
                    </Link>
                </div>
            </main>
        );
    }

    const tags = post.tags_list || [];

    return (
        <main className="page">
            <article className="form-card" style={{ maxWidth: '820px' }}>
                <Link to="/" className="btn-ghost" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                    ← Volver
                </Link>

                <p className="section-label">{post.content_type === 'poema' ? 'Poema' : 'Cuento'}</p>
                <h1 style={{ marginTop: 0 }}>{post.title}</h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                    <span>Por {post.author?.full_name || post.author?.username || 'Anónimo'}</span>
                    <span>{new Date(post.created_at).toLocaleDateString('es-CO')}</span>
                    <span>{post.views ?? 0} lecturas</span>
                </div>

                {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {tags.map((tag) => (
                            <span key={tag} className="msg" style={{ margin: 0, padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: '1.1rem' }}>
                    {post.content}
                </div>
            </article>
        </main>
    );
}

export default PoemDetail;
