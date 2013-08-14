
var d3c_sources=[["core.js"], ["force.js"], ["carto.js"], ["form.js"]];
d3c = (typeof d3c === 'undefined') ? {} : d3c;
(d3c.SRC_FILES || d3c_sources).forEach(function(s){
  document.write('<script src="'+(d3c.SRC_DIR || 'http://d3c.github.com/d3c/src/')+s[0]+'" charset="utf-8"></script>');
});
