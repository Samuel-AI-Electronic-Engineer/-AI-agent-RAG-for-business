import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../services/authService';
import useAuthStore from '../store/authStore';
import { getApiErrorMessage } from '../utils/authValidation';

function Login() {
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
            const data = await loginRequest(email.trim().toLowerCase(), password);
            login(data.user, data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(getApiErrorMessage(err, 'No pudimos iniciar sesión. Revisa tus credenciales.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page page-form">
            <section>
                <h1>Iniciar sesión</h1>
                <p>Accede para ver tu dashboard y gestionar tus publicaciones.</p>

                <form className="form-card" onSubmit={handleSubmit} noValidate>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Contraseña
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    {error && <p className="status-text error" role="alert">{error}</p>}

                    <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Login;
