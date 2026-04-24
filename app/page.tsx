"use client"
import ElectricBorderCard from "@/components/electric-border-card"
import { HeroSection } from "@/components/hero-section"
import { useShop } from "@/contexts/shop-context"

// Structured Product Data — using actual image filenames
const PRODUCTS = [
  {
    id: 1,
    name: "Stealth Earbuds Pro",
    price: 249,
    category: "Electronics",
    image: '/images/airpods.png',
    description: "Advanced active noise cancellation with 48h battery life.",
  },
  {
    id: 2,
    name: "Artisan Petit Pain",
    price: 12,
    category: "Food",
    image: '/images/pteitpain.png',
    description: "Flaky, buttery perfection baked fresh daily.",
  },
  {
    id: 3,
    name: "Madrid Kit 25/26",
    price: 120,
    category: "Fashion",
    image: '/images/RMADRIDKIT.png',
    description: "Official home kit, breathable tech fabric.",
  },
  {
    id: 4,
    name: "Urban Kicks White",
    price: 180,
    category: "Fashion",
    image: '/images/sneakers.png',
    description: "Street-ready minimalist design with cloud foam sole.",
  },
  {
    id: 5,
    name: "Cyber Pods Max",
    price: 349,
    category: "Electronics",
    image: '/images/airpods.png',
    description: "Holographic sound stage with spatial audio.",
  },
  {
    id: 6,
    name: "Morning Bread Roll",
    price: 8,
    category: "Food",
    image: '/images/pteitpain.png',
    description: "Artisan sourdough with golden crust, baked at dawn.",
  },
  {
    id: 7,
    name: "Street Runner Kit",
    price: 150,
    category: "Fashion",
    image: '/images/RMADRIDKIT.png',
    description: "Aerodynamic silhouette for urban exploration.",
  },
  {
    id: 8,
    name: "Cloud Walk Sneakers",
    price: 199,
    category: "Fashion",
    image: '/images/sneakers.png',
    description: "Ultra-light foam sole with premium leather upper.",
  },
]

export default function Home() {
  const { selectedCategory, searchQuery } = useShop()

  // Filter by category
  let displayedProducts = selectedCategory === "All"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === selectedCategory)

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    displayedProducts = displayedProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  }

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Grid */}
      <div className="cards-grid">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product) => (
            <ElectricBorderCard
              key={product.id}
              image={product.image}
              product={product}
            />
          ))
        ) : (
          <div className="col-span-full h-64 flex items-center justify-center text-[var(--foreground)] opacity-50 text-xl">
            {searchQuery.trim()
              ? `No results for "${searchQuery}"`
              : `No products found in ${selectedCategory}`
            }
          </div>
        )}
      </div>
    </div>
  )
}
