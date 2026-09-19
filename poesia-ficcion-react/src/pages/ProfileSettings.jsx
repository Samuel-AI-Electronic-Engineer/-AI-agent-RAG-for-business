import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../config/api';
import useAuthStore from '../store/authStore';

function ProfileSettings() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [message, setMessage] = useState('');
    const updateMutation = useMutation({
        mutationFn: async () => (await api.put('/users/me', { full_name: fullName.trim() })).data,
        onSuccess: (updatedUser) => { setUser(updatedUser); setMessage('Perfil actualizado correctamente.'); },
        onError: () => setMessage('No fue posible actualizar tu perfil.'),
    });

    return (
        <main className="page page-dashboard profile-subpage">
            <div className="subpage-heading"><div><p className="store-kicker">Tu espacio personal</p><h1>Configurar <em>perfil</em></h1><p>Actualiza la información que identifica tu presencia en la comunidad.</p></div></div>
            <section className="dashboard-card profile-card subpage-card settings-card">
                <div className="subpage-card-heading"><div><p className="store-kicker">Datos personales</p><h2>Información pública</h2></div><Link to="/dashboard" className="btn-ghost compact-button">Volver al perfil</Link></div>
                <form className="profile-settings-form" onSubmit={(event) => { event.preventDefault(); if (fullName.trim()) updateMutation.mutate(); }}>
                    <label>Nombre completo<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Tu nombre" /></label>
                    <label>Nombre de usuario<input value={user?.username || ''} disabled /></label>
                    <label>Correo electrónico<input value={user?.email || ''} disabled /></label>
                    {message && <p className={message.includes('correctamente') ? 'status-text success' : 'status-text error'} role="status">{message}</p>}
                    <button type="submit" className="btn-primary subpage-action" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}</button>
                </form>
            </section>
        </main>
    );
}

export default ProfileSettings;
