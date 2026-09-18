import { useState } from 'react';
import { useStore } from '../context/useStore';

function Store() {
    const { products, addToCart, cartCount, setIsCartOpen } = useStore();
    const [category, setCategory] = useState('Todos');

    const categories = ['Todos', ...new Set(products.map((product) => product.category))];
    const filteredProducts = category === 'Todos' ? products : products.filter((product) => product.category === category);

    return (
        <main className="page store-page">
            <section className="store-hero">
                <div>
                    <p className="store-kicker">La librería del cosmos</p>
                    <h1>Historias para llevar <em>contigo</em></h1>
                    <p className="store-intro">Ediciones nacidas de la comunidad de Poesía y Ficción. Cada libro abre una puerta distinta hacia lo imaginado.</p>
                    <div className="store-hero-actions">
                        <a className="btn-primary" href="#catalogo">Explorar libros</a>
                    </div>
                </div>
                <div className="store-orbit" aria-hidden="true">
                    <span className="orbit-ring ring-one" />
                    <span className="orbit-ring ring-two" />
                    <div className="featured-cover cover-gold"><span>PF</span><small>Edición inaugural</small></div>
                </div>
            </section>

            <section id="catalogo" className="store-catalog">
                <div className="catalog-heading">
                    <div>
                        <p className="store-kicker">Selección editorial</p>
                        <h2>La mesa de novedades</h2>
                    </div>
                    <button type="button" className="cart-button" onClick={() => setIsCartOpen(true)} aria-label="Abrir canasta">
                        <span>Canasta</span><strong>{cartCount}</strong>
                    </button>
                </div>

                <div className="category-tabs" role="tablist" aria-label="Categorías de libros">
                    {categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}
                </div>

                <div className="book-grid">
                    {filteredProducts.map((product) => (
                        <article className="book-card" key={product.id}>
                            <div className={`book-cover cover-${product.accent}`}><span>{product.title.split(' ').slice(0, 2).map((word) => word[0]).join('')}</span><small>{product.format}</small></div>
                            <div className="book-card-body">
                                <p className="book-category">{product.category} · {product.stock} disponibles</p>
                                <h3>{product.title}</h3>
                                <p className="book-author">Por {product.author}</p>
                                <p className="book-description">{product.description}</p>
                                <div className="book-buy-row"><strong>${product.price.toFixed(2)}</strong><button type="button" className="add-button" onClick={() => addToCart(product)}>Agregar <span>+</span></button></div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

        </main>
    );
}

export default Store;
