import { useEffect, useState } from 'react';
import { StoreContext } from './StoreContextDef';
import api from '../config/api';

const starterProducts = [
    {
        id: 'book-luna-tinta',
        title: 'La luna entre la tinta',
        author: 'Poesía y Ficción',
        description: 'Una edición íntima de poemas sobre la noche, la memoria y todo lo que todavía nos nombra.',
        price: 24.9,
        format: 'Edición impresa',
        category: 'Poesía',
        accent: 'gold',
        stock: 12,
    },
    {
        id: 'book-ciudad-silencio',
        title: 'La ciudad del silencio',
        author: 'Marina Soler',
        description: 'Relatos breves para caminar por ciudades imaginarias y encontrar una voz en cada esquina.',
        price: 19.5,
        format: 'Edición digital',
        category: 'Ficción',
        accent: 'rose',
        stock: 30,
    },
    {
        id: 'book-constelaciones',
        title: 'Constelaciones domésticas',
        author: 'Nicolás Vega',
        description: 'Ensayos mínimos sobre crear, leer y sostener una vida alrededor de los libros.',
        price: 28,
        format: 'Edición de autor',
        category: 'Ensayo',
        accent: 'teal',
        stock: 8,
    },
];

const readStorage = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const normalizeProduct = (product) => ({
    ...product,
    price: Number(product.price),
    stock: Number(product.stock),
});

export function StoreProvider({ children }) {
    const [products, setProducts] = useState(() => readStorage('pf_products', starterProducts));
    const [cart, setCart] = useState(() => readStorage('pf_cart', []));
    const [orders, setOrders] = useState(() => readStorage('pf_orders', []));
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get('/products')
            .then(({ data }) => {
                if (!cancelled && Array.isArray(data)) {
                    const normalizedProducts = data.map(normalizeProduct);
                    setProducts(normalizedProducts);
                    setCart((current) => current.map((item) => {
                        const persistedProduct = normalizedProducts.find((product) => product.title === item.title);
                        return persistedProduct ? { ...item, id: persistedProduct.id, price: persistedProduct.price, stock: persistedProduct.stock } : item;
                    }));
                }
            })
            .catch(() => {
                // Keep the local catalog available while the API is offline.
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        localStorage.setItem('pf_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('pf_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('pf_orders', JSON.stringify(orders));
    }, [orders]);

    const addProduct = async (product) => {
        const { data } = await api.post('/products', product);
        const normalizedProduct = normalizeProduct(data);
        setProducts((current) => [normalizedProduct, ...current]);
        return normalizedProduct;
    };

    const addToCart = (product) => {
        setCart((current) => {
            const existing = current.find((item) => item.id === product.id);
            if (existing) {
                return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...current, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (productId, quantity) => {
        setCart((current) => quantity < 1
            ? current.filter((item) => item.id !== productId)
            : current.map((item) => item.id === productId ? { ...item, quantity } : item));
    };

    const removeFromCart = (productId) => setCart((current) => current.filter((item) => item.id !== productId));
    const clearCart = () => setCart([]);
    const placeOrder = async (paymentMethod, shippingAddress) => {
        const { data } = await api.post('/orders', {
            payment_method: paymentMethod,
            shipping_address: shippingAddress,
            items: cart.map((item) => ({ product_id: Number(item.id), quantity: item.quantity })),
        });
        setOrders((current) => [data, ...current]);
        setCart([]);
        setProducts((current) => current.map((product) => {
            const purchased = data.items.find((item) => item.product_id === product.id);
            return purchased ? { ...product, stock: product.stock - purchased.quantity } : product;
        }));
        return data;
    };
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const value = {
        products,
        cart,
        cartCount,
        cartTotal,
        orders,
        isCartOpen,
        setIsCartOpen,
        addProduct,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

