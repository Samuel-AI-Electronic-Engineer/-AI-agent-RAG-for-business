import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useModal } from '../../context/useModal';
import { useStore } from '../../context/useStore';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuthStore();
    const { openModal } = useModal();
    const { cartCount, setIsCartOpen } = useStore();

    const toggleMenu = () => setIsOpen((current) => !current);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav>
            <div className="inner">
                <button
                    type="button"
                    className="nav-toggle"
                    aria-expanded={isOpen}
                    aria-label="Abrir menú"
                    onClick={toggleMenu}
                >
                    ☰
                </button>

                <NavLink to="/" className="nav-logo" onClick={closeMenu}>
                    Poesía <span>& Ficción</span>
                </NavLink>

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
                    <NavLink to="/libreria" onClick={closeMenu}>
                        Librería
                    </NavLink>
                    {user && (
                        <>
                            <NavLink to="/dashboard" onClick={closeMenu}>Perfil</NavLink>
                            {user.is_admin && <NavLink to="/libreria/edit/" onClick={closeMenu}>Administrar librería</NavLink>}
                        </>
                    )}
                </div>

                <div className="nav-actions">
                    <button type="button" className="nav-cart-button" onClick={() => setIsCartOpen(true)} aria-label="Abrir canasta">
                        ♡ <span>{cartCount}</span>
                    </button>
                    {user ? (
                        <NavLink to="/dashboard" className="user-profile-button" onClick={closeMenu} aria-label="Abrir mi perfil" title="Mi perfil">
                            <span className="user-profile-icon">♙</span>
                            <span className="user-profile-name">{user.username}</span>
                        </NavLink>
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
