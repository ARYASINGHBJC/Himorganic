export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
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