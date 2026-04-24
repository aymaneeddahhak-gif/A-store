const fs = require('fs');
const path = require('path');

const images = [
  '/images/Generated Image November 15, 2025 - 6_24PM.png',
  '/images/Generated Image November 15, 2025 - 6_25PM.png',
  '/images/Generated Image November 15, 2025 - 6_26PM.png',
];

const content = `import ElectricBorderCard from "@/components/electric-border-card"

const images = [
  '/images/Generated Image November 15, 2025 - 6_24PM.png',
  '/images/Generated Image November 15, 2025 - 6_25PM.png',
  '/images/Generated Image November 15, 2025 - 6_26PM.png',
]

export default function Home() {
  return (
    <main className="main-container">
      {Array.from({ length: 3 }).map((_, i) => (
        <ElectricBorderCard key={i} image={images[i]} />
      ))}
    </main>
  )
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'page.tsx'), content);
console.log('app/page.tsx updated with images');
