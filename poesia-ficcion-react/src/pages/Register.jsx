import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerRequest } from '../services/authService';
import useAuthStore from '../store/authStore';
import { getApiErrorMessage, getPasswordRules, isStrongPassword } from '../utils/authValidation';

function Register() {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const passwordChecks = getPasswordRules(password);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!isStrongPassword(password)) {
                setError('La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.');
                setIsSubmitting(false);
                return;
            }

            const data = await registerRequest({ username: username.trim().toLowerCase(), full_name: name.trim(), email: email.trim().toLowerCase(), password });
            login(data.user, data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo crear la cuenta. Revisa los datos.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page page-form">
            <section>
                <h1>Regístrate</h1>
                <p>Crea tu cuenta para publicar poemas y explorar tu universo creativo.</p>

                <form className="form-card" onSubmit={handleSubmit} noValidate>
                    <label>
                        Nombre de usuario
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={50}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label>
                        Nombre completo
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            required
                        />
                    </label>

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
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            required
                        />
                    </label>

                    <ul className="password-rules" aria-label="Requisitos de contraseña">
                        {passwordChecks.map((rule) => (
                            <li key={rule.key} className={rule.valid ? 'valid' : ''}>{rule.label}</li>
                        ))}
                    </ul>

                    {error && <p className="status-text error" role="alert">{error}</p>}

                    <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Register;
