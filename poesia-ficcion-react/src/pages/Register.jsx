import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerRequest } from '../services/authService';
import useAuthStore from '../store/authStore';

function Register() {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const data = await registerRequest({ username, full_name: name, email, password });
            login(data.user, data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError('No se pudo crear la cuenta. Revisa los datos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page page-form">
            <section>
                <h1>Regístrate</h1>
                <p>Crea tu cuenta para publicar poemas y explorar tu universo creativo.</p>

                <form className="form-card" onSubmit={handleSubmit}>
                    <label>
                        Nombre de usuario
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={50}
                            required
                        />
                    </label>

                    <label>
                        Nombre completo
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Contraseña
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && <p className="status-text error">{error}</p>}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Register;
