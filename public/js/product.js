// Product Detail Page
const API_URL = '/api';

async function loadProduct() {
    const container = document.getElementById('product-detail');
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        
        const product = await response.json();
        
        document.title = `${product.name} - Himorganic`;

        container.innerHTML = `
            <div>
                <img src="${product.image}" alt="${product.name}" class="product-detail-image"
                     onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
            </div>
            <div class="product-detail-info">
                <span class="product-category">${product.category}</span>
                <h1>${product.name}</h1>
                <div class="product-detail-price">₹${product.price.toFixed(2)}</div>
                <p class="product-detail-description">${product.description || 'No description available.'}</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <span style="color: ${product.stock > 0 ? 'var(--green)' : 'var(--orange)'}; font-weight: 600;">
                        ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
                    </span>
                </div>

                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem;">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQty(-1)">-</button>
                        <span class="quantity-display" id="quantity">1</span>
                        <button class="quantity-btn" onclick="updateQty(1)">+</button>
                    </div>
                    <button class="btn btn-pink" onclick="addToCartWithQty('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>

                <a href="/" class="btn btn-secondary">← Continue Shopping</a>
            </div>
        `;

        // Store product for cart
        window.currentProduct = product;

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>Product Not Found</h3>
                <p>The product you're looking for doesn't exist.</p>
                <a href="/" class="btn btn-primary" style="margin-top: 1rem;">Back to Shop</a>
            </div>
        `;
    }
}

function updateQty(change) {
    const qtyEl = document.getElementById('quantity');
    let qty = parseInt(qtyEl.textContent) + change;
    qty = Math.max(1, Math.min(qty, window.currentProduct?.stock || 99));
    qtyEl.textContent = qty;
}

function addToCartWithQty(productId) {
    const qty = parseInt(document.getElementById('quantity').textContent);
    
    if (window.currentProduct) {
        Cart.addItem(window.currentProduct, qty);
        showToast(`${window.currentProduct.name} (x${qty}) added to cart!`);
    }
}

document.addEventListener('DOMContentLoaded', loadProduct);