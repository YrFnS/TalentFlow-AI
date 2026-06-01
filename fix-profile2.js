const fs = require('fs');
const filePath = 'C:\\Users\\Itokoro\\Downloads\\glm\\TalentFlow AI\\src\\app\\(candidate)\\candidate\\profile\\content.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The exact broken string: })):
// The fix: replace with })>
content = content.replace(/setEduForm\(\{ \.\.\.eduForm, degree: v \}\)\):/g, 'setEduForm({ ...eduForm, degree: v })>');

fs.writeFileSync(filePath, content);
console.log('Done - replaced all instances');
