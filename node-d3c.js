var d3 = require('d3'),
    fs = require('fs');

eval(fs.readFileSync('./d3c.js', 'utf-8'));
exports.d3c = d3c;