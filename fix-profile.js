const fs = require('fs');
const filePath = 'C:\\Users\\Itokoro\\Downloads\\glm\\TalentFlow AI\\src\\app\\(candidate)\\candidate\\profile\\content.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const line = lines[1160];
console.log('Line 1161:', JSON.stringify(line));

// The line has: setEduForm({ ...eduForm, degree: v })):
// We need:      setEduForm({ ...eduForm, degree: v })>
// Replace the last ): with >
const fixed = line.replace(/\}\)\):$/, '}>)>');
if (fixed !== line) {
  lines[1160] = fixed;
  console.log('Fixed to:', JSON.stringify(fixed));
} else {
  // Try replacing the trailing ): at end
  const fixed2 = line.replace(/\}\)\):/, '}>)>');
  if (fixed2 !== line) {
    lines[1160] = fixed2;
    console.log('Fixed (alt) to:', JSON.stringify(fixed2));
  } else {
    console.log('No match - trying global replace');
    // Just replace all instances of }): at end of onValueChange
    const globalFixed = content.replace(/(\{\s*\.\.\.eduForm,\s*degree:\s*v\s*\}\)):/g, '$1>');
    if (globalFixed !== content) {
      content = globalFixed;
      lines[1160] = lines[1160]; // will be overwritten
      console.log('Global fixed');
    }
  }
}

fs.writeFileSync(filePath, content);
console.log('Saved');
