// Cart Page JavaScript

function renderCart() {
    const container = document.getElementById('cart-content');
    const cart = Cart.getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
                <a href="/" class="btn btn-pink" style="margin-top: 1rem;">Start Shopping</a>
            </div>
        `;
        return;
    }

    const subtotal = Cart.getTotal();
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    container.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                         onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="changeQuantity('${item.productId}', -1)">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="changeQuantity('${item.productId}', 1)">+</button>
                        </div>
                        <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
                        <button class="btn btn-danger btn-small" onclick="removeFromCart('${item.productId}')">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="cart-summary">
            <h3 style="margin-bottom: 1rem;">Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
            </div>
            ${shipping > 0 ? `
                <p style="color: var(--gray-dark); font-size: 0.85rem; margin-top: 0.5rem;">
                    Add ₹${(500 - subtotal).toFixed(2)} more for free shipping!
                </p>
            ` : ''}
            <div class="summary-row summary-total">
                <span>Total</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
            <a href="/checkout" class="btn btn-pink" style="width: 100%; margin-top: 1.5rem; justify-content: center;">
                Proceed to Checkout
            </a>
            <a href="/" class="btn btn-secondary" style="width: 100%; margin-top: 0.75rem; justify-content: center;">
                Continue Shopping
            </a>
        </div>
    `;
}

function changeQuantity(productId, change) {
    const cart = Cart.getCart();
    const item = cart.find(i => i.productId === productId);
    
    if (item) {
        const newQty = item.quantity + change;
        if (newQty < 1) {
            removeFromCart(productId);
        } else {
            Cart.updateQuantity(productId, newQty);
            renderCart();
        }
    }
}

function removeFromCart(productId) {
    Cart.removeItem(productId);
    renderCart();
    showToast('Item removed from cart');
}

document.addEventListener('DOMContentLoaded', renderCart);