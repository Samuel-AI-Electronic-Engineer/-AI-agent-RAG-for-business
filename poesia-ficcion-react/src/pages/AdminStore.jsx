import { useState } from 'react';
import { useStore } from '../context/useStore';

const emptyProduct = {
    title: '',
    author: '',
    description: '',
    price: '',
    format: 'Edición impresa',
    category: 'Poesía',
    accent: 'gold',
    stock: 1,
};

function AdminStore() {
    const { products, addProduct } = useStore();
    const [newProduct, setNewProduct] = useState(emptyProduct);
    const [message, setMessage] = useState('');

    const updateField = (field, value) => setNewProduct((current) => ({ ...current, [field]: value }));

    const handleSubmit = (event) => {
        event.preventDefault();
        const price = Number(newProduct.price);
        const stock = Number(newProduct.stock);
        if (!newProduct.title.trim() || !newProduct.author.trim() || !newProduct.description.trim() || price <= 0 || stock < 0) {
            setMessage('Completa título, autor, descripción, precio y existencias válidas.');
            return;
        }

        addProduct({
            ...newProduct,
            title: newProduct.title.trim(),
            author: newProduct.author.trim(),
            description: newProduct.description.trim(),
            price,
            stock,
        });
        setNewProduct(emptyProduct);
        setMessage('Libro publicado en el catálogo público.');
    };

    return (
        <main className="page store-page admin-store-page">
            <section className="admin-heading">
                <div>
                    <p className="store-kicker">Panel privado · Administración</p>
                    <h1>Gestionar <em>librería</em></h1>
                    <p>Desde aquí controlas las ediciones que aparecen para el público. Esta sección solo está disponible para cuentas administradoras.</p>
                </div>
                <span className="admin-badge">✦ Superusuario</span>
            </section>

            <section className="admin-layout">
                <form className="product-modal admin-product-form" onSubmit={handleSubmit}>
                    <p className="store-kicker">Nueva ficha editorial</p>
                    <h2>Agregar libro</h2>
                    <p className="modal-sub">Completa los detalles comerciales que verá tu audiencia.</p>
                    <div className="product-form-grid">
                        <label>Título<input value={newProduct.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Título del libro" required /></label>
                        <label>Autor<input value={newProduct.author} onChange={(event) => updateField('author', event.target.value)} placeholder="Nombre del autor" required /></label>
                        <label>Categoría<select value={newProduct.category} onChange={(event) => updateField('category', event.target.value)}><option>Poesía</option><option>Ficción</option><option>Ensayo</option><option>Edición especial</option></select></label>
                        <label>Formato<select value={newProduct.format} onChange={(event) => updateField('format', event.target.value)}><option>Edición impresa</option><option>Edición digital</option><option>Edición de autor</option></select></label>
                        <label>Precio<input type="number" min="0.01" step="0.01" value={newProduct.price} onChange={(event) => updateField('price', event.target.value)} placeholder="24.90" required /></label>
                        <label>Existencias<input type="number" min="0" step="1" value={newProduct.stock} onChange={(event) => updateField('stock', event.target.value)} required /></label>
                        <label>Color de portada<select value={newProduct.accent} onChange={(event) => updateField('accent', event.target.value)}><option value="gold">Dorado</option><option value="rose">Rosa</option><option value="teal">Turquesa</option></select></label>
                    </div>
                    <label>Descripción<textarea rows="5" value={newProduct.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Descripción comercial del libro" required /></label>
                    {message && <p className={message.startsWith('Libro') ? 'status-text success' : 'status-text error'} role="status">{message}</p>}
                    <button type="submit" className="btn-primary">Publicar libro</button>
                </form>

                <section className="admin-inventory">
                    <div className="catalog-heading">
                        <div><p className="store-kicker">Inventario actual</p><h2>{products.length} ediciones</h2></div>
                    </div>
                    <div className="admin-product-list">
                        {products.map((product) => (
                            <article className="admin-product-row" key={product.id}>
                                <div className={`book-cover mini-cover cover-${product.accent}`}><span>{product.title.charAt(0)}</span></div>
                                <div><h3>{product.title}</h3><p>{product.author} · {product.category}</p><strong>${product.price.toFixed(2)} · {product.stock} disponibles</strong></div>
                            </article>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}

export default AdminStore;
