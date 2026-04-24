
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'images');
console.log('Target Dir:', dir);

try {
    const files = fs.readdirSync(dir);
    console.log('Files found:', files);

    files.forEach(file => {
        let newName = null;
        if (file.includes('6_24PM (1)')) newName = 'product-4.png';
        else if (file.includes('6_24PM')) newName = 'product-1.png';
        else if (file.includes('6_25PM')) newName = 'product-2.png';
        else if (file.includes('6_26PM')) newName = 'product-3.png';

        if (newName) {
            const oldPath = path.join(dir, file);
            const newPath = path.join(dir, newName);
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`SUCCESS: ${file} -> ${newName}`);
            } catch (err) {
                console.error(`ERROR renaming ${file}:`, err.message);
            }
        }
    });

} catch (e) {
    console.error("Directory error:", e.message);
}
