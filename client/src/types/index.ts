export interface ProductVariant {
  label: string
  price: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
  unit?: string
  weight?: string
  variants?: ProductVariant[]
  createdAt: string
}

export interface CartItem {
  cartItemId: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  variantLabel?: string
}

export interface Customer {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pincode: string
}

export interface Order {
  id: string
  items: {
    productId: string
    name: string
    price: number
    quantity: number
    variantLabel?: string
  }[]
  customer: Customer
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: 'upi' | 'card'
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export interface PaymentDetails {
  method: 'upi' | 'card'
  upiId?: string
  cardNumber?: string
  cardExpiry?: string
  cardCvv?: string
  cardName?: string
}