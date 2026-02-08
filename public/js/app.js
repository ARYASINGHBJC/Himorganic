// Main storefront app
const API_URL = '/api';

// Fetch and display products
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <h3>No Products Available</h3>
                    <p>Check back soon for new products!</p>
                    <a href="/admin" class="btn btn-pink" style="margin-top: 1rem;">Add Products (Admin)</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="product-card" onclick="viewProduct('${product.id}')">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price.toFixed(2)}</span>
                        <button class="btn btn-pink btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>Failed to load products</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// View single product
function viewProduct(id) {
    window.location.href = `/product/${id}`;
}

// Add to cart
async function addToCart(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        
        const product = await response.json();
        Cart.addItem(product);
        showToast(`${product.name} added to cart!`);
    } catch (error) {
        showToast('Failed to add to cart', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadProducts);