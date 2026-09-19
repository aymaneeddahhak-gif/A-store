export interface ProductItem {
  id: string
  name: string
  description: string
  price: string
  stock: string
  discount: string
  discountType: string
  category: string
  gender: "Men" | "Woman" | "Unisex"
  sizes: string[]
  colors: string[]
  sku: string
  productType: string
  images: string[]
  sales: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export interface ColorOption {
  name: string
  hex: string
}
