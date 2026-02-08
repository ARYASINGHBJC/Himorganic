import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  ShoppingBag, 
  DollarSign,
  X,
  Save,
  Loader2,
  LayoutGrid,
  List,
  Leaf
} from 'lucide-react'
import { api } from '../lib/api'
import { Product, Order } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

type Tab = 'products' | 'orders'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, ordersData] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
      ])
      setProducts(productsData)
      setOrders(ordersData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        image: product.image,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '100',
        image: '',
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category || 'General',
        stock: parseInt(formData.stock) || 100,
        image: formData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData)
        toast.success('Product updated!')
      } else {
        await api.createProduct(productData)
        toast.success('Product created!')
      }

      closeModal()
      loadData()
    } catch (error) {
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.deleteProduct(id)
      toast.success('Product deleted!')
      loadData()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status)
      toast.success('Order status updated!')
      loadData()
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

  if (loading) {
    return (
      <div className="min-h-screen pt-32 bg-gradient-to-b from-primary-50 to-white">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Leaf className="w-10 h-10 text-primary-600" />
            <span className="text-primary-600">Admin Dashboard</span>
          </h1>
          <p className="text-gray-500">Manage your products and orders</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatCard
            icon={Package}
            label="Total Products"
            value={products.length.toString()}
            color="bg-primary-500"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={orders.length.toString()}
            color="bg-emerald-500"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`₹${totalRevenue.toFixed(2)}`}
            color="bg-lime-500"
          />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <TabButton
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
            icon={LayoutGrid}
          >
            Products
          </TabButton>
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            icon={List}
          >
            Orders
          </TabButton>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'products' ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </motion.button>
              </div>

              {products.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-primary-100">
                  <Package className="w-16 h-16 mx-auto mb-4 text-primary-300" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No Products Yet</h3>
                  <p className="text-gray-500 mb-6">Add your first product to get started!</p>
                  <button onClick={() => openModal()} className="btn-primary">
                    Add Product
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-primary-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-primary-50">
                          <th className="text-left p-4 font-semibold text-gray-600">Image</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Name</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Category</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Price</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Stock</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr
                            key={product.id}
                            className="border-t border-primary-100 hover:bg-primary-50/50 transition-colors"
                          >
                            <td className="p-4">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'
                                }}
                              />
                            </td>
                            <td className="p-4 font-semibold text-gray-800">{product.name}</td>
                            <td className="p-4">
                              <span className="px-3 py-1 rounded-full text-xs bg-primary-100 text-primary-700 font-medium">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-primary-600">
                              ₹{product.price.toFixed(2)}
                            </td>
                            <td className="p-4 text-gray-700">{product.stock}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openModal(product)}
                                  className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200 hover:bg-blue-100"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(product.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-200 hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Orders</h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-primary-100">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary-300" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No Orders Yet</h3>
                  <p className="text-gray-500">Orders will appear here when customers make purchases.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-primary-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-primary-50">
                          <th className="text-left p-4 font-semibold text-gray-600">Order ID</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Customer</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Items</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Total</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                          <th className="text-left p-4 font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-t border-primary-100 hover:bg-primary-50/50 transition-colors"
                          >
                            <td className="p-4 font-mono text-sm text-gray-700">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-gray-800">{order.customer.name}</div>
                              <div className="text-sm text-gray-400">{order.customer.email}</div>
                            </td>
                            <td className="p-4 text-gray-700">{order.items.length} item(s)</td>
                            <td className="p-4 font-semibold text-primary-600">
                              ₹{order.total.toFixed(2)}
                            </td>
                            <td className="p-4">
                              <select
                                value={order.status}
                                onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                                className="bg-white border border-primary-200 rounded-lg px-3 py-1 text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-4 text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-primary-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern"
                    placeholder="Organic Honey"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-modern min-h-[100px]"
                    placeholder="Product description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-modern"
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="input-modern"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-modern"
                    placeholder="Organic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="input-modern"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-primary-100"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold mb-1 text-gray-800">{value}</div>
      <div className="text-gray-500">{label}</div>
    </motion.div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
        active
          ? 'bg-primary-500 text-white shadow-md'
          : 'bg-white text-gray-600 hover:text-primary-600 border border-primary-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </motion.button>
  )
}