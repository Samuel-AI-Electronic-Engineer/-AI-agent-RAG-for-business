import { useEffect, useState } from 'react';
import { StoreContext } from './StoreContextDef';

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

export function StoreProvider({ children }) {
    const [products, setProducts] = useState(() => readStorage('pf_products', starterProducts));
    const [cart, setCart] = useState(() => readStorage('pf_cart', []));
    const [orders, setOrders] = useState(() => readStorage('pf_orders', []));
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('pf_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('pf_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('pf_orders', JSON.stringify(orders));
    }, [orders]);

    const addProduct = (product) => {
        setProducts((current) => [{ ...product, id: `book-${Date.now()}` }, ...current]);
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
    const placeOrder = (paymentMethod, shippingAddress, orderId, orderDate) => {
        const order = {
            id: orderId,
            date: orderDate,
            status: 'Pendiente de preparación',
            paymentMethod,
            shippingAddress,
            items: cart,
            total: cartTotal,
        };
        setOrders((current) => [order, ...current]);
        setCart([]);
        return order;
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

