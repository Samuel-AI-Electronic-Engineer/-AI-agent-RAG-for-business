import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../services/authService';
import useAuthStore from '../store/authStore';
import { useStore } from '../context/useStore';

function Dashboard() {
    const storedUser = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const logout = useAuthStore((state) => state.logout);
    const { cartCount, cartTotal, orders, products, setIsCartOpen } = useStore();
    const purchasedIds = new Set(orders.flatMap((order) => order.items.map((item) => item.id)));
    const purchasedCategories = new Set(orders.flatMap((order) => order.items.map((item) => item.category)));
    const recommendations = products.filter((product) => !purchasedIds.has(product.id) && (purchasedCategories.size === 0 || purchasedCategories.has(product.category))).slice(0, 3);
    const pendingOrders = orders.filter((order) => order.status !== 'Entregado');
    const navigate = useNavigate();
    const { data: user = storedUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        staleTime: 60_000,
    });
    const subscriptionKey = user?.email ? `pf_subscription_${user.email}` : null;
    const [isSubscribed, setIsSubscribed] = useState(() => storedUser?.email ? localStorage.getItem(`pf_subscription_${storedUser.email}`) === 'active' : false);

    useEffect(() => {
        if (user && user !== storedUser) {
            setUser(user);
        }
    }, [setUser, storedUser, user]);

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
                <button type="button" className="btn-primary profile-store-link" onClick={() => window.location.assign('/libreria')}>Visitar librería</button>
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
                    <h2>Próximamente: tus publicaciones</h2>
                    <p>Desde aquí podrás administrar poemas, cuentos y ediciones propias cuando activemos el espacio de autor.</p>
                </div>
                <span className="dashboard-star">✦</span>
            </section>

            <div className="profile-grid profile-commerce-grid">
                <section className="dashboard-card profile-card">
                    <p className="store-kicker">Mis pedidos</p>
                    <h2>{pendingOrders.length} pendientes</h2>
                    {pendingOrders.length === 0 ? <p>Aquí aparecerán tus pedidos cuando completes una compra.</p> : pendingOrders.slice(0, 3).map((order) => <div className="order-row" key={order.id}><span>{order.id}<small>{new Date(order.date).toLocaleDateString('es-CO')}</small></span><strong>{order.status}</strong></div>)}
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
