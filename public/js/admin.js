// Admin Panel JavaScript
const API_URL = '/api';

let products = [];
let orders = [];
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadOrders();
    setupTabs();
});

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.dataset.tab;
            document.getElementById('products-tab').style.display = tabName === 'products' ? 'block' : 'none';
            document.getElementById('orders-tab').style.display = tabName === 'orders' ? 'block' : 'none';
        });
    });
}

// ============== PRODUCTS ==============

async function loadProducts() {
    const tbody = document.getElementById('products-table');
    
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        
        document.getElementById('total-products').textContent = products.length;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <h3>No products yet</h3>
                        <p>Add your first product to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                         onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                </td>
                <td><strong>${product.name}</strong></td>
                <td><span class="product-category">${product.category}</span></td>
                <td><strong>₹${product.price.toFixed(2)}</strong></td>
                <td>${product.stock}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-small btn-secondary" onclick="editProduct('${product.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <h3>Failed to load products</h3>
                    <p>Please try again later.</p>
                </td>
            </tr>
        `;
    }
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    if (product) {
        title.textContent = 'Edit Product';
        editingProductId = product.id;
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image').value = product.image;
    } else {
        title.textContent = 'Add Product';
        editingProductId = null;
        form.reset();
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
    editingProductId = null;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value || 'General',
        stock: parseInt(document.getElementById('product-stock').value) || 100,
        image: document.getElementById('product-image').value || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    };

    try {
        let response;
        if (editingProductId) {
            response = await fetch(`${API_URL}/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (!response.ok) throw new Error('Failed to save product');

        closeProductModal();
        loadProducts();
        showToast(editingProductId ? 'Product updated!' : 'Product added!');

    } catch (error) {
        showToast('Failed to save product', 'error');
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        openProductModal(product);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete product');

        loadProducts();
        showToast('Product deleted!');

    } catch (error) {
        showToast('Failed to delete product', 'error');
    }
}

// ============== ORDERS ==============

async function loadOrders() {
    const tbody = document.getElementById('orders-table');
    
    try {
        const response = await fetch(`${API_URL}/orders`);
        orders = await response.json();
        
        document.getElementById('total-orders').textContent = orders.length;
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <h3>No orders yet</h3>
                        <p>Orders will appear here when customers make purchases.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><code style="font-size: 0.75rem;">${order.id.substring(0, 8)}...</code></td>
                <td>
                    <strong>${order.customer.name}</strong><br>
                    <small style="color: var(--gray-dark);">${order.customer.email}</small>
                </td>
                <td>${order.items.length} item(s)</td>
                <td><strong>₹${order.total.toFixed(2)}</strong></td>
                <td>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <select class="form-control" style="width: auto; padding: 6px 10px; font-size: 0.8rem;" 
                            onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>Failed to load orders</h3>
                    <p>Please try again later.</p>
                </td>
            </tr>
        `;
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update order');

        loadOrders();
        showToast('Order status updated!');

    } catch (error) {
        showToast('Failed to update order', 'error');
    }
}