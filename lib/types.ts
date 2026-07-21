export type Review = {
  id: string
  user: string
  rating: number
  comment: string
  date: string
  avatar?: string
}

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  images?: string[]
  description?: string
  likes: number
  rating: number
  reviews: Review[]
}

export type Order = {
  id: string
  user_id: string
  items: Product[]
  total: number
  status: string
  created_at: string
}

export type Notification = {
  id: string
  type: "order" | "promo" | "shipping" | "review" | "system"
  title: string
  message: string
  time: string
  read: boolean
}

export type ToastType = "success" | "error" | "info"

export type Toast = {
  id: string
  message: string
  type: ToastType
}
