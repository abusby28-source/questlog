const fs = require('fs');

// Read the original file
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Find all handleSyncXbox functions
const functionIndices = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('const handleSyncXbox = async () => {')) {
    functionIndices.push(i);
  }
}

console.log(`Found ${functionIndices.length} handleSyncXbox functions at lines:`, functionIndices.map(i => i + 1));

if (functionIndices.length < 2) {
  console.log('❌ No duplicate function found');
  process.exit(1);
}

// Keep the first function, remove all others
const firstIndex = functionIndices[0];
const secondIndex = functionIndices[1];

console.log(`Keeping function at line ${firstIndex + 1}, removing from line ${secondIndex + 1}`);

// Find the end of the second function
let braceCount = 0;
let endIndex = -1;

for (let i = secondIndex; i < lines.length; i++) {
  const line = lines[i];
  braceCount += (line.match(/{/g) || []).length;
  braceCount -= (line.match(/}/g) || []).length;
  
  if (braceCount === 0) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.log('❌ Could not find end of second function');
  process.exit(1);
}

console.log(`Removing lines ${secondIndex + 1} to ${endIndex + 1}`);

// Create the new file without the duplicate
const newLines = [
  ...lines.slice(0, secondIndex),
  ...lines.slice(endIndex + 1)
];

// Write the cleaned version
fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log('✅ Successfully removed duplicate handleSyncXbox function');

// Verify the fix
const newContent = fs.readFileSync('src/App.tsx', 'utf8');
const newFunctionCount = (newContent.match(/const handleSyncXbox = async \(\) => \{/g) || []).length;
console.log(`✅ Verification: ${newFunctionCount} handleSyncXbox functions remaining`);
