import { Link } from 'react-router-dom';

function PoemCard({ poem }) {
    return (
        <article className="poem-card">
            <header>
                <span className="poem-type">{poem.content_type || 'Poesía'}</span>
                <h3>{poem.title || 'Título sin nombre'}</h3>
            </header>

            <p className="poem-excerpt">
                {poem.excerpt || (poem.content ? `${poem.content.substring(0, 140)}...` : 'Sin descripción aún.')}
            </p>

            <footer className="poem-footer">
                <span>✦ {poem.author?.full_name || poem.author?.username || 'Anónimo'}</span>
                <span>⊙ {poem.views ?? 0} lecturas</span>
            </footer>

            <div style={{ marginTop: '1rem' }}>
                <Link to={`/poema/${poem.id}`} className="btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '0.6rem 1rem' }}>
                    Leer más
                </Link>
            </div>
        </article>
    );
}

export default PoemCard;
