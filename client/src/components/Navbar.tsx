import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, X, Leaf, LayoutDashboard, User, LogOut, LogIn } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const itemCount = useCartStore((state) => state.getItemCount())
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg"
            >
              <Leaf className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold gradient-text">Himorganic</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Shop</NavLink>
            <NavLink to="/#about">About</NavLink>
            <NavLink to="/#contact">Contact</NavLink>
            
            {isAdmin && (
              <NavLink to="/admin">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </NavLink>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 font-medium"
                >
                  <User className="w-4 h-4" />
                  {user?.name?.split(' ')[0]}
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-primary-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-primary-100">
                        <p className="font-medium text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </motion.span>
              </Link>
            )}

            <Link to="/cart" className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-md"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-12 h-12 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center text-primary-600"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-primary-100"
          >
            <div className="px-4 py-6 space-y-4">
              <MobileNavLink to="/" onClick={() => setIsOpen(false)}>
                Shop
              </MobileNavLink>
              <MobileNavLink to="/#about" onClick={() => setIsOpen(false)}>
                About
              </MobileNavLink>
              <MobileNavLink to="/#contact" onClick={() => setIsOpen(false)}>
                Contact
              </MobileNavLink>
              
              {isAdmin && (
                <MobileNavLink to="/admin" onClick={() => setIsOpen(false)}>
                  Admin Dashboard
                </MobileNavLink>
              )}
              
              <MobileNavLink to="/cart" onClick={() => setIsOpen(false)}>
                Cart ({itemCount})
              </MobileNavLink>

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 bg-primary-50 rounded-xl">
                    <p className="font-medium text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-600 font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <MobileNavLink to="/login" onClick={() => setIsOpen(false)}>
                  Login / Register
                </MobileNavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const isHashLink = to.includes('#')
  
  if (isHashLink) {
    return (
      <a href={to.replace('/', '')}>
        <motion.span
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary-700 hover:text-primary-600 hover:bg-primary-50 transition-colors font-medium"
        >
          {children}
        </motion.span>
      </a>
    )
  }
  
  return (
    <Link to={to}>
      <motion.span
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary-700 hover:text-primary-600 hover:bg-primary-50 transition-colors font-medium"
      >
        {children}
      </motion.span>
    </Link>
  )
}

function MobileNavLink({
  to,
  children,
  onClick,
}: {
  to: string
  children: React.ReactNode
  onClick: () => void
}) {
  const isHashLink = to.includes('#')
  
  if (isHashLink) {
    return (
      <a href={to.replace('/', '')} onClick={onClick}>
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-medium"
        >
          {children}
        </motion.div>
      </a>
    )
  }
  
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-medium"
      >
        {children}
      </motion.div>
    </Link>
  )
}