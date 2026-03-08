import { Product, ProductVariant } from '../types'

export const getProductVariants = (product: Product): ProductVariant[] => {
  if (product.variants?.length) {
    return product.variants.filter((variant) => variant.label && Number.isFinite(variant.price))
  }

  if (product.weight) {
    return [{ label: product.weight, price: product.price }]
  }

  if (product.unit && product.unit !== 'piece') {
    return [{ label: product.unit, price: product.price }]
  }

  return [{ label: 'Standard', price: product.price }]
}
