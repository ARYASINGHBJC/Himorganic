import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductVariant } from '../types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1, variant?: ProductVariant) => {
        set((state) => {
          const cartItemId = `${product.id}::${variant?.label || 'default'}`
          const existingIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId
          )

          if (existingIndex > -1) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += quantity
            return { items: newItems }
          }

          return {
            items: [
              ...state.items,
              {
                cartItemId,
                productId: product.id,
                name: product.name,
                price: variant?.price ?? product.price,
                image: product.image,
                quantity,
                variantLabel: variant?.label,
              },
            ],
          }
        })
      },

      removeItem: (cartItemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }))
      },

      updateQuantity: (cartItemId: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'himorganic-cart',
    }
  )
)