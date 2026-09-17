import useAuthStore from '../store/authStore';

function Dashboard() {
    const { user } = useAuthStore();

    return (
        <main className="page page-dashboard">
            <section className="dashboard-card">
                <h1>Dashboard</h1>
                {user ? (
                    <>
                        <p>Hola, <strong>{user.full_name || user.username}</strong>.</p>
                        <p>Desde aquí podrás ver tus publicaciones y gestionar tu contenido.</p>
                    </>
                ) : (
                    <p>No has iniciado sesión. Ve a Login para comenzar.</p>
                )}
            </section>
        </main>
    );
}

export default Dashboard;
