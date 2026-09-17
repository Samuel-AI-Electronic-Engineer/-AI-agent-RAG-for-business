import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useModal } from '../../context/ModalContext';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const { openModal } = useModal();

    const toggleMenu = () => setIsOpen((current) => !current);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav>
            <div className="inner">
                <a href="#hero" className="nav-logo">
                    Poesía <span>& Ficción</span>
                </a>

                <button
                    type="button"
                    className="nav-toggle"
                    aria-expanded={isOpen}
                    aria-label="Abrir menú"
                    onClick={toggleMenu}
                >
                    ☰
                </button>

                <div className={`nav-links${isOpen ? ' open' : ''}`}>
                    <a href="#poemas" onClick={closeMenu}>
                        Poemas
                    </a>
                    <a href="#featured" onClick={closeMenu}>
                        Destacado
                    </a>
                    <a href="#newsletter" onClick={closeMenu}>
                        Newsletter
                    </a>
                    {user && (
                        <NavLink to="/dashboard" onClick={closeMenu}>
                            Dashboard
                        </NavLink>
                    )}
                </div>

                <div className="nav-actions">
                    {user ? (
                        <button type="button" className="btn-ghost" onClick={() => { logout(); closeMenu(); }}>
                            Salir
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => {
                                    openModal('login');
                                    closeMenu();
                                }}
                            >
                                Entrar
                            </button>
                            <button
                                type="button"
                                className="nav-btn"
                                onClick={() => {
                                    openModal('register');
                                    closeMenu();
                                }}
                            >
                                ✦ Crear cuenta
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
