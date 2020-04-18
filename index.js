const fs = require('fs');
const path = require('path');

const extensions = ['jpg', 'jpeg', 'mov', 'mp3', 'mp4', 'pdf'];
const newdir = __dirname;


const directories = fs.readdirSync(__dirname);
directories.forEach((dir) => {
  const path = path.join(__dirname, dir);
  if (!fs.lstatSync(path).isDirectory()) return;
  const content = fs.readdirSync(path);
  const extension = content.split('.').pop();

  if (extensions.includes(extension)) {
    // Move file to new place
  }
});
