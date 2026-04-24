const fs = require('fs');
const path = require('path');
const content = `import ElectricBorderCard from "@/components/electric-border-card"

export default function Home() {
  return (
    <main className="main-container">
      {Array.from({ length: 3 }).map((_, i) => (
        <ElectricBorderCard key={i} />
      ))}
    </main>
  )
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'page.tsx'), content);
console.log('app/page.tsx updated successfully');
