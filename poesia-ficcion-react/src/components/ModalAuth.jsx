import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { login as loginRequest, register as registerRequest } from '../services/authService';
import { useModal } from '../context/useModal';
import { getApiErrorMessage, getPasswordRules, isStrongPassword } from '../utils/authValidation';

function ModalAuth() {
    const { modal, closeModal, openModal } = useModal();
    const navigate = useNavigate();
    const loginStore = useAuthStore((state) => state.login);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const registerPasswordChecks = getPasswordRules(registerPassword);

    const handleLogin = async (event) => {
        event.preventDefault();
        if (!loginEmail || !loginPassword) {
            setStatusMessage('Completa todos los campos.');
            setStatusType('error');
            return;
        }

        setSubmitting(true);
        setStatusMessage('');

        try {
            const data = await loginRequest(loginEmail.trim().toLowerCase(), loginPassword);
            loginStore(data.user, data.access_token || data.token);
            setStatusMessage('✦ Bienvenido de vuelta, ' + (data.user?.username || data.user?.full_name || 'poeta') + '!');
            setStatusType('success');
            setTimeout(() => {
                closeModal();
                navigate('/dashboard');
            }, 1200);
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Error al iniciar sesión.'));
            setStatusType('error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        if (!registerUsername || !registerEmail || !registerPassword) {
            setStatusMessage('Completa los campos requeridos.');
            setStatusType('error');
            return;
        }
        if (registerPassword.length < 8) {
            setStatusMessage('La contraseña debe tener al menos 8 caracteres.');
            setStatusType('error');
            return;
        }
        if (!isStrongPassword(registerPassword)) {
            setStatusMessage('La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.');
            setStatusType('error');
            return;
        }

        setSubmitting(true);
        setStatusMessage('');

        try {
            const data = await registerRequest({ username: registerUsername.trim().toLowerCase(), full_name: registerName.trim(), email: registerEmail.trim().toLowerCase(), password: registerPassword });
            loginStore(data.user, data.access_token || data.token);
            setStatusMessage('Bienvenido al universo, ' + (data.user?.username || data.user?.full_name || 'poeta') + '!');
            setStatusType('success');
            setTimeout(() => {
                closeModal();
                navigate('/dashboard');
            }, 1200);
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Error al registrarse.'));
            setStatusType('error');
        } finally {
            setSubmitting(false);
        }
    };

    const mode = modal || 'login';
    const isLogin = mode === 'login';

    if (!modal) {
        return null;
    }

    return (
        <div className="modal-overlay active" onClick={(event) => event.target === event.currentTarget && closeModal()}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <button className="modal-close" type="button" onClick={closeModal}>
                    ✕
                </button>

                {isLogin ? (
                    <>
                        <h2>Bienvenido de vuelta</h2>
                        <p className="modal-sub">El universo te esperaba</p>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Correo electrónico</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <button className="modal-btn" type="submit" disabled={submitting} aria-busy={submitting}>
                                {submitting ? 'Entrando...' : 'Entrar al cosmos'}
                            </button>
                            <div className={statusType ? `msg ${statusType}` : 'msg'}>{statusMessage}</div>
                        </form>
                        <p className="modal-switch">
                            ¿No tienes cuenta?{' '}
                            <button type="button" className="modal-link" onClick={() => openModal('register')}>
                                Crear una
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <h2>Únete al universo</h2>
                        <p className="modal-sub">Comparte tu luz con el cosmos</p>
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label>Nombre de usuario</label>
                                <input
                                    type="text"
                                    value={registerUsername}
                                    onChange={(e) => setRegisterUsername(e.target.value)}
                                    placeholder="poetaurbano"
                                />
                            </div>
                            <div className="form-group">
                                <label>Nombre completo</label>
                                <input
                                    type="text"
                                    value={registerName}
                                    onChange={(e) => setRegisterName(e.target.value)}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div className="form-group">
                                <label>Correo electrónico</label>
                                <input
                                    type="email"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </div>
                            <button className="modal-btn" type="submit" disabled={submitting} aria-busy={submitting}>
                                {submitting ? 'Creando cuenta...' : 'Comenzar mi viaje'}
                            </button>
                            <ul className="password-rules" aria-label="Requisitos de contraseña">
                                {registerPasswordChecks.map((rule) => (
                                    <li key={rule.key} className={rule.valid ? 'valid' : ''}>{rule.label}</li>
                                ))}
                            </ul>
                            <div className={statusType ? `msg ${statusType}` : 'msg'}>{statusMessage}</div>
                        </form>
                        <p className="modal-switch">
                            ¿Ya tienes cuenta?{' '}
                            <button type="button" className="modal-link" onClick={() => openModal('login')}>
                                Iniciar sesión
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ModalAuth;
