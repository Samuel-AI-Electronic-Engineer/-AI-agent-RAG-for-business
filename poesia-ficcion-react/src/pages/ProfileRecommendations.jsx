import { Link } from 'react-router-dom';
import { useStore } from '../context/useStore';

function ProfileRecommendations() {
    const { orders, products } = useStore();
    const purchasedIds = new Set(orders.flatMap((order) => order.items.map((item) => item.id)));
    const purchasedCategories = new Set(orders.flatMap((order) => order.items.map((item) => item.category)));
    const recommendations = products.filter((product) => !purchasedIds.has(product.id) && (purchasedCategories.size === 0 || purchasedCategories.has(product.category)));

    return (
        <main className="page page-dashboard profile-subpage">
            <div className="subpage-heading"><div><p className="store-kicker">Tu espacio personal</p><h1>Lecturas <em>recomendadas</em></h1><p>Una selección de ediciones para continuar tu recorrido literario.</p></div><Link to="/libreria" className="btn-primary subpage-action">Explorar todo</Link></div>
            <section className="dashboard-card profile-card subpage-card">
                <div className="subpage-card-heading"><div><p className="store-kicker">Para seguir leyendo</p><h2>{recommendations.length} sugerencias</h2></div><Link to="/dashboard" className="btn-ghost compact-button">Volver al perfil</Link></div>
                {recommendations.length === 0 ? <div className="empty-state"><p>Explora la librería para construir tus recomendaciones.</p><Link to="/libreria" className="btn-ghost compact-button">Ver catálogo</Link></div> : <div className="recommendation-grid">{recommendations.map((product) => <article className="recommendation-card" key={product.id}><span className={`book-cover mini-cover cover-${product.accent}`}><b>{product.title.charAt(0)}</b></span><div><p>{product.category}</p><h3>{product.title}</h3><span>{product.author} · ${product.price.toFixed(2)}</span></div></article>)}</div>}
            </section>
        </main>
    );
}

export default ProfileRecommendations;
