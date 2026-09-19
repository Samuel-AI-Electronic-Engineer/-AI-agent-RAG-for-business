import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../context/useStore';

function CartDrawer() {
    const {
        cart,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
    } = useStore();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Tarjeta débito o crédito');
    const [shippingAddress, setShippingAddress] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [checkoutError, setCheckoutError] = useState('');
    const queryClient = useQueryClient();

    const handleCheckout = async (event) => {
        event.preventDefault();
        if (!shippingAddress.trim()) return;
        setCheckoutError('');
        try {
            const order = await placeOrder(paymentMethod, shippingAddress.trim());
            queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] });
            setConfirmation(`Pedido #${order.id} registrado correctamente.`);
            setIsCheckoutOpen(false);
            setShippingAddress('');
        } catch (error) {
            setCheckoutError(error.response?.data?.detail || 'No fue posible registrar el pedido. Revisa el stock e inténtalo de nuevo.');
        }
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-overlay" role="presentation" onClick={(event) => event.target === event.currentTarget && setIsCartOpen(false)}>
            <aside className="cart-drawer" aria-label="Carrito de compra">
                <div className="cart-heading">
                    <div>
                        <p className="store-kicker">Tu selección</p>
                        <h2>Canasta de libros</h2>
                    </div>
                    <button type="button" className="icon-button" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">×</button>
                </div>

                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <span className="cart-empty-mark">✦</span>
                        <h3>Tu canasta está esperando una historia.</h3>
                        <p>Agrega una edición para comenzar tu viaje literario.</p>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map((item) => (
                                <article className="cart-item" key={item.id}>
                                    <div className={`book-cover mini-cover cover-${item.accent}`}><span>{item.title.charAt(0)}</span></div>
                                    <div className="cart-item-info">
                                        <h3>{item.title}</h3>
                                        <p>{item.format}</p>
                                        <strong>${item.price.toFixed(2)}</strong>
                                        <div className="quantity-control">
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Reducir cantidad de ${item.title}`}>−</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Aumentar cantidad de ${item.title}`}>+</button>
                                            <button type="button" className="remove-link" onClick={() => removeFromCart(item.id)}>Quitar</button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="cart-summary">
                            <div><span>Subtotal</span><strong>${cartTotal.toFixed(2)}</strong></div>
                            <p>Envío calculado al finalizar la compra.</p>
                            <button type="button" className="btn-primary checkout-button" onClick={() => setIsCheckoutOpen(true)}>Continuar al pago</button>
                            <button type="button" className="text-button" onClick={clearCart}>Vaciar canasta</button>
                        </div>
                    </>
                )}
                {confirmation && <p className="checkout-confirmation" role="status">✦ {confirmation}</p>}
                {isCheckoutOpen && (
                    <div className="checkout-modal-overlay" role="presentation">
                        <form className="checkout-modal" onSubmit={handleCheckout}>
                            <button type="button" className="modal-close" onClick={() => setIsCheckoutOpen(false)} aria-label="Cerrar pago">×</button>
                            <p className="store-kicker">Finalizar compra</p>
                            <h2>Tu pedido está a un paso</h2>
                            <label>Método de pago
                                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                                    <option>Tarjeta débito o crédito</option>
                                    <option>PSE</option>
                                    <option>Transferencia bancaria</option>
                                    <option>Pago contra entrega</option>
                                </select>
                            </label>
                            <label>Dirección de entrega
                                <textarea rows="3" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="Ciudad, dirección y referencias" required />
                            </label>
                            <div className="checkout-total"><span>Total</span><strong>${cartTotal.toFixed(2)}</strong></div>
                            {checkoutError && <p className="status-text error" role="alert">{checkoutError}</p>}
                            <button type="submit" className="btn-primary checkout-button">Confirmar pedido</button>
                        </form>
                    </div>
                )}
            </aside>
        </div>
    );
}

export default CartDrawer;
