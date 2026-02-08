// Checkout Page JavaScript
const API_URL = '/api';

function renderCheckoutSummary() {
    const cart = Cart.getCart();
    const itemsContainer = document.getElementById('checkout-items');
    const totalContainer = document.getElementById('checkout-total');

    if (cart.length === 0) {
        window.location.href = '/cart';
        return;
    }

    const subtotal = Cart.getTotal();
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    itemsContainer.innerHTML = cart.map(item => `
        <div class="summary-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('') + `
        <div class="summary-row" style="border-top: 1px solid var(--gray); margin-top: 1rem; padding-top: 1rem;">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
        </div>
    `;

    totalContainer.innerHTML = `
        <span>Total</span>
        <span>₹${total.toFixed(2)}</span>
    `;
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const cart = Cart.getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const customer = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value,
        city: document.getElementById('customer-city').value,
        pincode: document.getElementById('customer-pincode').value
    };

    const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
    }));

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, customer })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to place order');
        }

        const order = await response.json();
        
        // Clear cart
        Cart.clear();
        
        // Show success modal
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('success-modal').classList.add('active');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', renderCheckoutSummary);