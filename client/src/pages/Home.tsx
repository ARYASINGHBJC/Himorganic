import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Package, Leaf, Heart, Shield, Truck } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { ProductSkeleton } from '../components/LoadingSpinner'
import HeroScene from '../components/HeroScene'
import { api } from '../lib/api'
import { Product } from '../types'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        
        {/* Floating leaves decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ y: -100, x: Math.random() * 100, rotate: 0 }}
              animate={{ 
                y: '100vh', 
                x: Math.random() * 200 - 100,
                rotate: 360 
              }}
              transition={{ 
                duration: 15 + Math.random() * 10, 
                repeat: Infinity, 
                delay: i * 2,
                ease: 'linear'
              }}
              style={{ left: `${i * 18}%` }}
            >
              <Leaf className="w-8 h-8 text-primary-300 opacity-40" />
            </motion.div>
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-primary-200 mb-8"
            >
              <Leaf className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700">100% Organic & Natural</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6">
              <span className="gradient-text">Fresh Organic</span>
              <br />
              <span className="text-primary-800">Products</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-600/70 max-w-2xl mx-auto mb-10">
              Discover nature's best. Premium organic products delivered directly to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="#products"
                  className="btn-primary inline-flex items-center gap-2 text-lg"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="#about"
                  className="btn-secondary inline-flex items-center gap-2 text-lg"
                >
                  <Heart className="w-5 h-5" />
                  Learn More
                </a>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-6 h-10 rounded-full border-2 border-primary-300 flex justify-center pt-2"
            >
              <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 pointer-events-none" />
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Our Products</span>
            </h2>
            <p className="text-primary-600/70 text-lg max-w-2xl mx-auto">
              Handpicked organic products for a healthier lifestyle
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
                <Package className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-2">No Products Yet</h3>
              <p className="text-primary-600/70 mb-6">
                Check back soon for amazing organic products!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 text-center border border-primary-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div
                  className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${feature.bgColor}`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-primary-800 mb-3">{feature.title}</h3>
                <p className="text-primary-600/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">About Himorganic</span>
              </h2>
              <p className="text-lg text-primary-600/80 mb-6">
                At Himorganic, we believe in bringing nature's purest offerings directly to your home. 
                Founded with a passion for organic living, we source our products from certified organic 
                farms nestled in the pristine Himalayan region.
              </p>
              <p className="text-lg text-primary-600/80 mb-6">
                Every product in our collection is carefully selected to ensure the highest quality, 
                freshness, and nutritional value. We work directly with local farmers who share our 
                commitment to sustainable and chemical-free farming practices.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full">
                  <Leaf className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700 font-medium">100% Organic</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full">
                  <Heart className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700 font-medium">Farm Fresh</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700 font-medium">Quality Assured</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"
                  alt="Organic Farm"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white text-lg font-medium">Fresh from Himalayan farms</p>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-primary-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-800">Free Delivery</p>
                    <p className="text-sm text-primary-600">Orders above ₹500</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Contact Us</span>
            </h2>
            <p className="text-primary-600/70 text-lg max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl border border-primary-100">
                <h3 className="text-xl font-bold text-primary-800 mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-primary-800">Address</p>
                      <p className="text-primary-600/70">123 Organic Lane, Himalayan Valley, India - 175001</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-primary-800">Email</p>
                      <p className="text-primary-600/70">hello@himorganic.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-primary-800">Phone</p>
                      <p className="text-primary-600/70">+91 98765 43210</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl border border-primary-100">
                <h3 className="text-xl font-bold text-primary-800 mb-4">Business Hours</h3>
                <div className="space-y-2 text-primary-600/70">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl border border-primary-100 shadow-lg">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-white"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-white resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full btn-primary py-4 text-lg"
                  >
                    Send Message
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-800 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-8 h-8 text-primary-300" />
                <span className="text-2xl font-bold">Himorganic</span>
              </div>
              <p className="text-primary-200 mb-4 max-w-md">
                Your trusted source for premium organic products sourced directly from the pristine Himalayan region. 
                We bring nature's best to your doorstep.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <div className="space-y-2 text-primary-200">
                <a href="#products" className="block hover:text-white transition-colors">Shop</a>
                <a href="#about" className="block hover:text-white transition-colors">About Us</a>
                <a href="#contact" className="block hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <div className="space-y-2 text-primary-200">
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-white transition-colors">Refund Policy</a>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-700 pt-8 text-center">
            <p className="text-primary-300/60 text-sm">
              © 2026 Himorganic. All rights reserved. Made with <Heart className="w-4 h-4 inline text-red-400" /> for organic living.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Leaf,
    title: '100% Organic',
    description: 'All products are certified organic and naturally sourced.',
    bgColor: 'bg-primary-100',
    iconColor: 'text-primary-600',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick and secure delivery right to your doorstep.',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'Multiple payment options with bank-grade security.',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
]