import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../context/useStore';
import api from '../config/api';

function ProfileOrders() {
    const { orders: localOrders } = useStore();
    const ordersQuery = useQuery({
        queryKey: ['orders', 'mine'],
        queryFn: async () => (await api.get('/orders/me')).data,
        retry: false,
    });
    const orders = ordersQuery.data || localOrders;

    return (
        <main className="page page-dashboard profile-subpage">
            <div className="subpage-heading"><div><p className="store-kicker">Tu espacio personal</p><h1>Mis <em>pedidos</em></h1><p>Consulta el estado de tus compras y conserva el historial de tus ediciones.</p></div><Link to="/libreria" className="btn-primary subpage-action">Visitar librería</Link></div>
            <section className="dashboard-card profile-card subpage-card">
                <div className="subpage-card-heading"><div><p className="store-kicker">Historial de compras</p><h2>{orders.length} pedidos</h2></div><Link to="/dashboard" className="btn-ghost compact-button">Volver al perfil</Link></div>
                {ordersQuery.isLoading ? <p className="panel-feedback">Cargando pedidos...</p> : orders.length === 0 ? <div className="empty-state"><p>Aquí aparecerán tus pedidos cuando completes una compra.</p><Link to="/libreria" className="btn-ghost compact-button">Explorar librería</Link></div> : <div className="order-list">{orders.map((order) => <article className="order-row order-row-large" key={order.id}><span><strong>Pedido #{order.id}</strong><small>{new Date(order.created_at || order.date).toLocaleDateString('es-CO')}</small></span><span>{order.items.length} {order.items.length === 1 ? 'edición' : 'ediciones'}</span><strong>{order.status}</strong></article>)}</div>}
            </section>
        </main>
    );
}

export default ProfileOrders;
