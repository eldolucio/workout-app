const fs = require('fs');
const path = require('path');

const files = [
  'src/app/fichas/importar/page.tsx',
  'src/app/fichas/page.tsx',
  'src/app/home/page.tsx',
  'src/app/treino/[sessionId]/page.tsx',
  'src/components/ExerciseAnimation.tsx',
  'src/components/ExerciseList.tsx',
  'src/components/NavBar.tsx',
  'src/components/RestTimer.tsx',
  'src/components/SetControls.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/import React(?:, \{[^}]*\})? from ["']react["'];?\n/g, (match) => {
      // If it has hooks like { useState }, keep them.
      const hooks = match.match(/\{([^}]+)\}/);
      if (hooks) {
        return `import { ${hooks[1].trim()} } from "react";\n`;
      }
      return '';
    });
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Done');
