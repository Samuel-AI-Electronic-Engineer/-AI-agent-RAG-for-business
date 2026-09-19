import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '../services/authService';
import useAuthStore from '../store/authStore';
import { useStore } from '../context/useStore';
import api from '../config/api';

function Dashboard() {
    const storedUser = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const logout = useAuthStore((state) => state.logout);
    const { cartCount, cartTotal, orders, products, setIsCartOpen } = useStore();
    const effectiveOrders = orders;
    const purchasedIds = new Set(effectiveOrders.flatMap((order) => order.items.map((item) => item.product_id ?? item.id)));
    const purchasedCategories = new Set(effectiveOrders.flatMap((order) => order.items.map((item) => item.category)));
    const recommendations = products.filter((product) => !purchasedIds.has(product.id) && (purchasedCategories.size === 0 || purchasedCategories.has(product.category))).slice(0, 3);
    const pendingOrders = effectiveOrders.filter((order) => order.status !== 'entregado' && order.status !== 'Entregado');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user = storedUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        staleTime: 60_000,
    });

    const { data: myPosts = [], isLoading: isLoadingPosts } = useQuery({
        queryKey: ['posts', 'mine'],
        queryFn: async () => {
            const { data } = await api.get('/posts');
            const items = data?.items || [];
            return items.filter((post) => post.author?.id === user?.id);
        },
        enabled: !!user?.id,
    });

    const subscriptionKey = user?.email ? `pf_subscription_${user.email}` : null;
    const [isSubscribed, setIsSubscribed] = useState(() => storedUser?.email ? localStorage.getItem(`pf_subscription_${storedUser.email}`) === 'active' : false);

    useEffect(() => {
        if (user && user !== storedUser) {
            setUser(user);
        }
    }, [setUser, storedUser, user]);

    const totalViews = useMemo(
        () => myPosts.reduce((sum, post) => sum + (post.views || 0), 0),
        [myPosts],
    );

    const deleteMutation = useMutation({
        mutationFn: async (postId) => {
            await api.delete(`/posts/${postId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts', 'mine'] });
        },
    });

    const toggleSubscription = () => {
        if (!subscriptionKey) return;
        const nextValue = !isSubscribed;
        if (nextValue) localStorage.setItem(subscriptionKey, 'active');
        else localStorage.removeItem(subscriptionKey);
        setIsSubscribed(nextValue);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDelete = (postId) => {
        const ok = window.confirm('¿Seguro que quieres eliminar esta obra?');
        if (ok) {
            deleteMutation.mutate(postId);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <main className="page page-dashboard">
            <section className="profile-header">
                <div className="profile-avatar">{(user.full_name || user.username).charAt(0).toUpperCase()}</div>
                <div>
                    <p className="store-kicker">Tu espacio personal</p>
                    <h1>Hola, <em>{user.full_name || user.username}</em>.</h1>
                    <p>Un lugar para guardar tus lecturas, publicar tus palabras y seguir tu recorrido por el cosmos literario.</p>
                </div>
                <Link to="/libreria" className="btn-primary profile-store-link">Visitar librería</Link>
            </section>

            <div className="profile-grid">
                <section className="dashboard-card profile-card">
                    <p className="store-kicker">Perfil de lector</p>
                    <h2>{user.username}</h2>
                    <p>{user.email}</p>
                    <div className="profile-meta"><span>Miembro desde</span><strong>{user.created_at ? new Date(user.created_at).toLocaleDateString('es-CO') : 'Hoy'}</strong></div>
                    <button type="button" className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
                </section>
                <section className="dashboard-card profile-card profile-cart-card">
                    <p className="store-kicker">Tu canasta</p>
                    <h2>{cartCount} {cartCount === 1 ? 'libro' : 'libros'}</h2>
                    <p>Subtotal actual: <strong>${cartTotal.toFixed(2)}</strong></p>
                    <button type="button" className="btn-ghost" onClick={() => setIsCartOpen(true)}>Abrir canasta</button>
                </section>
            </div>

            <section className="profile-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="dashboard-card profile-card">
                    <p className="store-kicker">Mis publicaciones</p>
                    <h2>{myPosts.length}</h2>
                    <p>Obras activas y listas para publicar, editar o compartir.</p>
                    <Link to="/dashboard/publicaciones" className="btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '0.65rem 1rem' }}>
                        Gestionar obras
                    </Link>
                </div>

                <div className="dashboard-card profile-card">
                    <p className="store-kicker">Mis pedidos</p>
                    <h2>{pendingOrders.length}</h2>
                    <p>Seguimiento de compras y estados de preparación.</p>
                    <Link to="/dashboard/pedidos" className="btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '0.65rem 1rem' }}>
                        Ver pedidos
                    </Link>
                </div>

                <div className="dashboard-card profile-card">
                    <p className="store-kicker">Libros recomendados</p>
                    <h2>{recommendations.length}</h2>
                    <p>Lecturas sugeridas según tus gustos y tus compras.</p>
                    <Link to="/dashboard/recomendados" className="btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '0.65rem 1rem' }}>
                        Ver recomendados
                    </Link>
                </div>
            </section>

            <section className="dashboard-card subscription-card">
                <div>
                    <p className="store-kicker">Club de lectores</p>
                    <h2>{isSubscribed ? 'Suscripción activa' : 'Recibe lo mejor del cosmos'}</h2>
                    <p>{isSubscribed ? 'Recibirás descuentos, ofertas y novedades de la librería en tu correo.' : 'Activa las novedades para recibir descuentos exclusivos, últimas ofertas y nuevos lanzamientos.'}</p>
                </div>
                <button type="button" className={isSubscribed ? 'btn-ghost' : 'btn-primary'} onClick={toggleSubscription}>
                    {isSubscribed ? 'Cancelar suscripción' : 'Suscribirme a ofertas'}
                </button>
            </section>

            <section className="dashboard-card dashboard-library">
                <div>
                    <p className="store-kicker">Tu biblioteca creativa</p>
                    <h2>{myPosts.length} obras publicadas</h2>
                    <p>Gestiona tus poemas, cuentos y piezas en una sola vista.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Link to="/publicar" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.2rem' }}>
                        Nueva publicación
                    </Link>
                    <span className="dashboard-star">✦</span>
                </div>
            </section>

            <section className="dashboard-card" style={{ maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <p className="store-kicker">Mis publicaciones</p>
                        <h2>Biblioteca personal</h2>
                    </div>
                    <div>
                        <strong>{myPosts.length}</strong> obras · <strong>{totalViews}</strong> vistas
                    </div>
                </div>

                {isLoadingPosts ? (
                    <p>Cargando publicaciones...</p>
                ) : myPosts.length === 0 ? (
                    <p>Aún no tienes publicaciones. Crea tu primera obra desde “Nueva publicación”.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {myPosts.map((post) => (
                            <article key={post.id} style={{ border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--gold)' }}>{post.content_type}</p>
                                        <h3 style={{ margin: '0.25rem 0' }}>{post.title}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-dim)' }}>
                                            {post.views ?? 0} lecturas · {new Date(post.created_at).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <Link to={`/poema/${post.id}`} className="btn-ghost" style={{ width: 'auto', padding: '0.55rem 1rem' }}>
                                            Ver
                                        </Link>
                                        <button type="button" className="btn-ghost" style={{ width: 'auto', padding: '0.55rem 1rem' }}>
                                            Editar
                                        </button>
                                        <button type="button" className="btn-ghost" style={{ width: 'auto', padding: '0.55rem 1rem', color: '#ff9aa7' }} onClick={() => handleDelete(post.id)} disabled={deleteMutation.isPending}>
                                            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <div className="profile-grid profile-commerce-grid">
                <section className="dashboard-card profile-card">
                    <p className="store-kicker">Mis pedidos</p>
                    <h2>{pendingOrders.length} pendientes</h2>
                    {pendingOrders.length === 0 ? <p>Aquí aparecerán tus pedidos cuando completes una compra.</p> : pendingOrders.slice(0, 3).map((order) => <div className="order-row" key={order.id}><span>{order.id}<small>{new Date(order.created_at || order.date).toLocaleDateString('es-CO')}</small></span><strong>{order.status}</strong></div>)}
                </section>
                <section className="dashboard-card profile-card">
                    <p className="store-kicker">Para seguir leyendo</p>
                    <h2>Recomendados para ti</h2>
                    {recommendations.length === 0 ? <p>Explora la librería para construir tus recomendaciones.</p> : recommendations.map((product) => <div className="recommendation-row" key={product.id}><span className={`book-cover mini-cover cover-${product.accent}`}><b>{product.title.charAt(0)}</b></span><span><strong>{product.title}</strong><small>{product.category} · ${product.price.toFixed(2)}</small></span></div>)}
                </section>
            </div>
        </main>
    );
}

export default Dashboard;
