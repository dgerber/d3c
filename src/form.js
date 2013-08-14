d3c.form = d3c_form;

// boiler plate for html forms
function d3c_form(base, target){

  var self = {}
    , cfg = {}                  // configurable values only
    , fields = {}               // cfg and buttons
  ;

  Array.prototype.slice.call(arguments, 2).forEach(function(x){
    if (typeof x.key === 'undefined') x = {key: x};
    if (x.type !== 'button') cfg[x.key] = x.value;
    fields[x.key] = x;
  });

  self.config = d3c.configurable(self, cfg)
    .on('change.sync_target', sync_target)
    .on('change.sync_form', sync_form);

  if (target.config && target.config.on){
    target.config.on('change.sync_form', function(key, val){
      if (key !== null && key in cfg){
        sync_form(key, val);
      }
    });
  }

  self.refresh = sync_form;

  render();
  return self;

  function render(){

    var labels = base.datum(fields)
      .selectAll('label')
      .data(d3.values, function(d){return d.key;});

    labels.enter()
      .append('label')
      .text(function(d){return d.key;})
      .each(function(d){
        var sel = d3.select(this);
        if (d.type === 'button'){
          render_button(sel, d);
        } else if ((d.type || typeof d.value) === 'boolean'){
          sel
            .append('input')
            .property('type', 'checkbox')
            .property('name', d.key)
            .property('checked', d.value)
            .on('change', function(d){
              self.config(this.name, this.checked);
            });
        } else if (d.options){
          sel
            .append('select')
            .property('name', d.key)
            .on('change', function(d){
              var o = d.options[this.selectedIndex];
              self.config(d.key, o ? o.value || o : o);
            })
            .selectAll('option')
            .data(d.options)
            .enter()
            .append('option')
            .text(function(o){return o ? o.name || o : o;});
        } else {
          sel
            .append('input')
            .property('type', d.type || 'text')
            .property('name', d.key)
            .property('value', d.value)
            .on('change', function(d){
              var val = (d.setter || Number)(this.value);
              self.config(this.name, val);
            });
        }
      });

    function render_button(sel, d) {
      var b = sel
        .text(null)
        .append('button')
        .property('type', 'button')
        .text(d.key)
        .on('click', target[d.key]);

      if (d.key === 'start-stop'){
        var mess = sel.insert('span', 'button')
          .style('opacity', .5);
        b.on('click', function(){
          if (b.text() === 'start') target.start();
          else target.stop();
        });
        target
          .on('tick.button', function(e){
            mess.text('alpha: ' + e.alpha.toFixed(4));
          })
          .on('start.button', function(e){
            b.text('stop');
          })
          .on('end.button', function(e){
            b.text('start');
          });
      }

    }

    sync_form();
    return self;
  }

  function sync_form(key, val, prev){
    if (!arguments.length){
      for (key in cfg){
        sync_form(key, target[key]());
      }
    } else if (key in cfg){
      cfg[key] = val;
      if (fields[key].options) {
        base.selectAll('select[name='+key+'] > option')
          .property('selected', function(o){
            return (o === val) ? true : false;
          });
      } else {
        var i = base.select('input[name='+key+']');
        if (i.property('type') === 'checkbox') i.property('checked', val);
        else i.property('value', val);
      }
    }
    return self;
  }

  function sync_target(key, val){
    if (!arguments.length){
      for (key in cfg){
        if (cfg[key].type !== 'button') sync_target(key, cfg[key]);
      }
    } else if (key in cfg){
      target[key](val);
    }
  }

}