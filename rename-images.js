
const fs = require('fs');
const path = require('path');

const dir = 'public/images';
const map = {
    'Generated Image November 15, 2025 - 6_24PM.png': 'product-1.png',
    'Generated Image November 15, 2025 - 6_25PM.png': 'product-2.png',
    'Generated Image November 15, 2025 - 6_26PM.png': 'product-3.png',
    'Generated Image November 15, 2025 - 6_24PM (1).png': 'product-4.png'
};

Object.entries(map).forEach(([oldName, newName]) => {
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldName} -> ${newName}`);
    } else {
        console.log(`Skipped (not found): ${oldName}`);
    }
});
