import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../services/postsService';
import PoemCard from '../components/poems/PoemCard';
import Footer from '../components/layout/Footer';
import { useModal } from '../context/ModalContext';

function Home() {
    const { openModal } = useModal();
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [newsletterType, setNewsletterType] = useState('');
    const statsRef = useRef(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['posts', 'home'],
        queryFn: () => getPosts(1, 'poema'),
    });

    const items = data?.items || [];

    useEffect(() => {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        if (!('IntersectionObserver' in window)) {
            revealElements.forEach((el) => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 },
        );

        revealElements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const statsSection = statsRef.current;
        if (!statsSection || !('IntersectionObserver' in window)) {
            return;
        }

        const animateCount = (element, target) => {
            if (!element) return;
            let current = 0;
            const step = Math.max(1, Math.floor(target / 60));
            const interval = setInterval(() => {
                current = Math.min(current + step, target);
                element.textContent = `${current}+`;
                if (current >= target) {
                    clearInterval(interval);
                }
            }, 25);
            return interval;
        };

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCount(document.getElementById('cnt-poems'), 248);
                        animateCount(document.getElementById('cnt-stories'), 97);
                        animateCount(document.getElementById('cnt-authors'), 63);
                        obs.disconnect();
                    }
                });
            },
            { threshold: 0.5 },
        );

        observer.observe(statsSection);
        return () => observer.disconnect();
    }, []);

    const handleSubscribe = () => {
        const email = newsletterEmail.trim();
        if (!email || !email.includes('@')) {
            setNewsletterType('error');
            setNewsletterMessage('Ingresa un correo válido.');
            return;
        }

        setNewsletterType('success');
        setNewsletterMessage('¡Gracias! Pronto recibirás el cosmos en tu correo.');
        setNewsletterEmail('');
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <main>
            <section id="hero">
                <div className="container">
                    <div className="hero-content">
                        <p className="hero-eyebrow reveal">✦ &nbsp; Un universo de palabras &nbsp; ✦</p>
                        <h1 className="hero-title reveal">
                            Donde las palabras <br />
                            <em>se convierten en estrellas</em>
                        </h1>
                        <p className="hero-subtitle reveal">
                            Un espacio para contemplar la poesía y la ficción como se contemplan los astros: con asombro, silencio y el
                            corazón abierto.
                        </p>
                        <div className="hero-actions reveal">
                            <button type="button" className="btn-primary" onClick={() => scrollToSection('poemas')}>
                                Explorar el universo
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => openModal('register')}>
                                Publicar mi obra
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual reveal">
                        <svg viewBox="0 0 580 520" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <defs>
                                <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#9080ff" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#9080ff" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#f0c060" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#f0c060" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="glowrose" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#d060a0" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#d060a0" stopOpacity="0" />
                                </radialGradient>
                                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1a1040" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="#04040f" stopOpacity="0.95" />
                                </linearGradient>
                                <linearGradient id="skyGrad" x1="0" y1="1" x2="0" y2="0">
                                    <stop offset="0%" stopColor="#04040f" stopOpacity="0" />
                                    <stop offset="100%" stopColor="#0d0830" stopOpacity="0.5" />
                                </linearGradient>
                            </defs>
                            <rect x="0" y="0" width="580" height="520" fill="url(#skyGrad)" />
                            <ellipse cx="300" cy="160" rx="220" ry="130" fill="url(#glow1)" opacity="0.6" />
                            <ellipse cx="200" cy="100" rx="100" ry="60" fill="url(#glowrose)" opacity="0.4" />
                            <circle cx="380" cy="115" r="72" fill="#1a1640" stroke="#c8d8f0" strokeWidth="1.2" opacity="0.9" />
                            <circle cx="380" cy="115" r="72" fill="url(#glow2)" opacity="0.6" />
                            <circle cx="380" cy="115" r="65" fill="none" stroke="rgba(240,192,96,0.25)" strokeWidth="0.5" />
                            <circle cx="355" cy="100" r="12" fill="none" stroke="rgba(200,216,240,0.15)" strokeWidth="0.8" />
                            <circle cx="400" cy="130" r="8" fill="none" stroke="rgba(200,216,240,0.12)" strokeWidth="0.8" />
                            <circle cx="370" cy="140" r="5" fill="none" stroke="rgba(200,216,240,0.10)" strokeWidth="0.6" />
                            <ellipse cx="360" cy="90" rx="22" ry="12" fill="rgba(255,255,255,0.06)" />
                            <circle cx="80" cy="60" r="1.8" fill="#f0c060" opacity="0.9" />
                            <circle cx="140" cy="35" r="1.2" fill="#c8d8f0" opacity="0.8" />
                            <circle cx="230" cy="50" r="2.2" fill="#9080ff" opacity="0.9" />
                            <circle cx="470" cy="45" r="1.5" fill="#f0c060" opacity="0.85" />
                            <circle cx="510" cy="80" r="1.0" fill="#c8d8f0" opacity="0.7" />
                            <circle cx="520" cy="30" r="1.8" fill="#d060a0" opacity="0.8" />
                            <circle cx="60" cy="140" r="1.2" fill="#40b0c0" opacity="0.75" />
                            <circle cx="150" cy="170" r="1.5" fill="#c8d8f0" opacity="0.7" />
                            <circle cx="490" cy="160" r="1.2" fill="#9080ff" opacity="0.8" />
                            <circle cx="100" cy="90" r="0.8" fill="#fff" opacity="0.6" />
                            <circle cx="260" cy="25" r="1.0" fill="#fff" opacity="0.7" />
                            <circle cx="450" cy="200" r="1.5" fill="#40b0c0" opacity="0.6" />
                            <g transform="translate(118,118)" opacity="0.85">
                                <polygon points="0,-9 2.5,-3 8,-3 3.5,1.5 5.5,8 0,4 -5.5,8 -3.5,1.5 -8,-3 -2.5,-3" fill="#f0c060" />
                            </g>
                            <g transform="translate(480,95)" opacity="0.7">
                                <polygon points="0,-7 2,-2.5 6.5,-2.5 3,1 4.5,6.5 0,3.5 -4.5,6.5 -3,1 -6.5,-2.5 -2,-2.5" fill="#c8d8f0" />
                            </g>
                            <path d="M0,370 Q60,310 140,340 Q220,370 290,315 Q360,265 430,300 Q500,340 580,295 L580,520 L0,520 Z" fill="url(#groundGrad)" />
                            <path d="M0,400 Q80,365 180,380 Q260,395 340,355 Q420,315 500,350 Q540,368 580,340 L580,520 L0,520 Z" fill="rgba(4,4,15,0.8)" />
                            <path d="M48,400 L48,480" stroke="#1a1440" strokeWidth="5" />
                            <path d="M20,400 Q48,340 76,400 Z" fill="#0d0828" />
                            <path d="M28,370 Q48,320 68,370 Z" fill="#0d0828" />
                            <path d="M34,345 Q48,305 62,345 Z" fill="#0d0828" />
                            <path d="M520,395 L520,480" stroke="#1a1440" strokeWidth="4" />
                            <path d="M498,395 Q520,345 542,395 Z" fill="#0d0828" />
                            <path d="M504,368 Q520,328 536,368 Z" fill="#0d0828" />
                            <g transform="translate(155,370)">
                                <ellipse cx="0" cy="60" rx="22" ry="8" fill="#0a0820" opacity="0.8" />
                                <path d="M-18,55 Q-10,65 10,68 Q22,70 30,66" stroke="#12103a" strokeWidth="7" strokeLinecap="round" fill="none" />
                                <path d="M-5,55 Q-8,35 -6,18" stroke="#12103a" strokeWidth="9" strokeLinecap="round" fill="none" />
                                <circle cx="-4" cy="10" r="11" fill="#12103a" />
                                <path d="M-14,35 Q-20,42 -22,52" stroke="#12103a" strokeWidth="6" strokeLinecap="round" fill="none" />
                                <circle cx="-4" cy="10" r="11" fill="#0e0c30" />
                            </g>
                            <g transform="translate(270,305)">
                                <ellipse cx="0" cy="130" rx="16" ry="5" fill="#04040f" opacity="0.7" />
                                <path d="M-6,115 L-8,130" stroke="#0f0d2e" strokeWidth="7" strokeLinecap="round" />
                                <path d="M6,115 L8,130" stroke="#0f0d2e" strokeWidth="7" strokeLinecap="round" />
                                <path d="M0,85 L0,115" stroke="#0f0d2e" strokeWidth="10" strokeLinecap="round" />
                                <path d="M0,95 L-28,72" stroke="#0f0d2e" strokeWidth="6" strokeLinecap="round" />
                                <path d="M0,95 L28,72" stroke="#0f0d2e" strokeWidth="6" strokeLinecap="round" />
                                <circle cx="0" cy="75" r="13" fill="#0e0c30" />
                                <circle cx="0" cy="75" r="18" fill="none" stroke="#9080ff" strokeWidth="0.8" opacity="0.5" />
                            </g>
                            <g transform="translate(395,375)">
                                <path d="M-15,50 Q-5,60 15,55" stroke="#12103a" strokeWidth="7" strokeLinecap="round" fill="none" />
                                <path d="M-10,45 Q5,56 12,48" stroke="#12103a" strokeWidth="6" strokeLinecap="round" fill="none" />
                                <path d="M0,45 Q2,28 4,12" stroke="#12103a" strokeWidth="9" strokeLinecap="round" fill="none" />
                                <circle cx="5" cy="4" r="11" fill="#0e0c30" />
                                <rect x="-14" y="28" width="22" height="15" rx="1" fill="#1a1650" stroke="#9080ff" strokeWidth="0.8" />
                                <line x1="-3" y1="28" x2="-3" y2="43" stroke="#9080ff" strokeWidth="0.5" opacity="0.6" />
                                <path d="M-8,35 Q-16,32 -18,28" stroke="#12103a" strokeWidth="5" strokeLinecap="round" fill="none" />
                                <path d="M8,35 Q14,32 12,28" stroke="#12103a" strokeWidth="5" strokeLinecap="round" fill="none" />
                            </g>
                            <line x1="380" y1="187" x2="270" y2="368" stroke="rgba(240,192,96,0.06)" strokeWidth="30" />
                            <line x1="380" y1="187" x2="155" y2="420" stroke="rgba(144,128,255,0.04)" strokeWidth="20" />
                            <line x1="380" y1="187" x2="400" y2="400" stroke="rgba(200,216,240,0.05)" strokeWidth="15" />
                        </svg>
                    </div>
                    <div className="scroll-hint reveal">Descubrir</div>
                </div>
            </section>

            <div className="container">
                <div className="stats-row reveal" ref={statsRef}>
                    <div className="stat-item">
                        <span className="stat-num" id="cnt-poems">0+</span>
                        <span className="stat-label">Poemas publicados</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num" id="cnt-stories">0+</span>
                        <span className="stat-label">Cuentos escritos</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num" id="cnt-authors">0+</span>
                        <span className="stat-label">Voces del universo</span>
                    </div>
                </div>
            </div>

            <section id="poemas">
                <div className="container">
                    <p className="section-label reveal">✦ Poemas</p>
                    <h2 className="section-title reveal">
                        Versos que <em>iluminan la noche</em>
                    </h2>
                    <p className="section-intro reveal">
                        Cada poema es una estrella. Algunos brillan solos, otros forman constelaciones que guían el alma.
                    </p>
                    <div className="star-divider reveal">✦ · · ✦ · · ✦</div>

                    {isLoading && <p className="section-intro">Cargando poemas...</p>}
                    {isError && <p className="section-intro">No fue posible cargar los poemas. Intenta de nuevo más tarde.</p>}

                    <div className="poems-grid reveal">
                        {items.length > 0 ? (
                            items.map((poem) => <PoemCard key={poem.id} poem={poem} />)
                        ) : (
                            !isLoading && <p className="section-intro">Todavía no hay poemas disponibles. Vuelve pronto.</p>
                        )}
                    </div>

                    <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <button type="button" className="btn-ghost" onClick={() => openModal('register')}>
                            Ver todo el universo →
                        </button>
                    </div>
                </div>
            </section>

            <section id="featured">
                <div className="container">
                    <p className="section-label reveal" style={{ textAlign: 'center' }}>
                        ✦ Verso del día
                    </p>
                    <div className="featured-poem reveal">
                        <p className="featured-quote">
                            "Somos polvo de estrellas que aprendió a <em>soñar con palabras</em>,<br />
                            y en cada verso que escribimos<br />
                            el cosmos nos recuerda lo que somos."
                        </p>
                        <p className="featured-attr">
                            — <span>Poesía y Ficción</span> · Verso inaugural
                        </p>
                    </div>
                </div>
            </section>

            <section className="cosmos-section">
                <div className="cosmos-svg-wrap reveal">
                    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" fill="none">
                        <defs>
                            <radialGradient id="p1" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#7060d0" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#7060d0" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="p2" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#d060a0" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#d060a0" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="p3" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#40b0c0" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#40b0c0" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <ellipse cx="140" cy="140" rx="80" ry="80" fill="url(#p1)" />
                        <circle cx="140" cy="140" r="52" fill="#12103a" stroke="#7060d0" strokeWidth="1" />
                        <ellipse cx="140" cy="140" rx="90" ry="18" fill="none" stroke="#9080ff" strokeWidth="1.5" opacity="0.5" transform="rotate(-15 140 140)" />
                        <circle cx="140" cy="140" r="52" fill="none" stroke="#9080ff" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4" />
                        <text x="140" y="145" textAnchor="middle" fill="#c8d8f0" fontFamily="Playfair Display, serif" fontSize="13" fontStyle="italic" opacity="0.8">
                            Poesía
                        </text>
                        <ellipse cx="450" cy="140" rx="70" ry="70" fill="url(#p2)" />
                        <circle cx="450" cy="140" r="45" fill="#200a28" stroke="#d060a0" strokeWidth="1" />
                        <ellipse cx="450" cy="140" rx="80" ry="16" fill="none" stroke="#d060a0" strokeWidth="1.2" opacity="0.5" transform="rotate(20 450 140)" />
                        <text x="450" y="145" textAnchor="middle" fill="#f0c0e0" fontFamily="Playfair Display, serif" fontSize="13" fontStyle="italic" opacity="0.8">
                            Ficción
                        </text>
                        <ellipse cx="760" cy="140" rx="60" ry="60" fill="url(#p3)" />
                        <circle cx="760" cy="140" r="38" fill="#061820" stroke="#40b0c0" strokeWidth="1" />
                        <text x="760" y="145" textAnchor="middle" fill="#a0e0e8" fontFamily="Playfair Display, serif" fontSize="13" fontStyle="italic" opacity="0.8">
                            Arte
                        </text>
                        <path d="M192,140 Q320,90 405,140" stroke="rgba(144,128,255,0.2)" strokeWidth="1" strokeDasharray="5 8" />
                        <path d="M495,140 Q610,190 720,140" stroke="rgba(208,96,160,0.2)" strokeWidth="1" strokeDasharray="5 8" />
                        <circle cx="310" cy="60" r="1.8" fill="#f0c060" opacity="0.9" />
                        <circle cx="620" cy="55" r="1.5" fill="#c8d8f0" opacity="0.8" />
                        <circle cx="850" cy="220" r="2" fill="#9080ff" opacity="0.7" />
                        <circle cx="50" cy="230" r="1.5" fill="#d060a0" opacity="0.8" />
                    </svg>
                </div>
            </section>

            <section id="newsletter">
                <div className="container">
                    <div className="newsletter-box reveal">
                        <h2>Únete al cosmos literario</h2>
                        <p>Recibe en tu correo los poemas y cuentos más brillantes del universo de Poesía y Ficción.</p>
                        <div className="input-row">
                            <input
                                type="email"
                                placeholder="tu@correo.com"
                                value={newsletterEmail}
                                onChange={(event) => setNewsletterEmail(event.target.value)}
                            />
                            <button type="button" className="btn-primary" onClick={handleSubscribe}>
                                ✦ Suscribirme
                            </button>
                        </div>
                        <p className="newsletter-msg" aria-live="polite">
                            {newsletterMessage}
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export default Home;
