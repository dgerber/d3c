d3c.configurable = d3c_configurable;

function d3c_configurable(support, cfg){

  var event = d3.dispatch('change');
  cfg = cfg || {};

  config.accessor = function(key){
    return function(){
      return config.apply(support, Array.prototype.concat.call(key, Array.prototype.slice.call(arguments,0)));
    };
  };

  for (var key in cfg){
    support[key] = config.accessor(key);
  }

  return d3.rebind(config, event, 'on');

  function config(key, val){
    var changes = 0,
        a = arguments.length;
    if (a == 0) return cfg;
    if (a == 1){
      if (typeof key === 'object'){
        for (var k in key){
          changes += set(k, key[k]);
        }
        return this;
      }
      return cfg[key];
    }
    if (a == 2) changes += set(key, val);
    // if (a > 2) throw 'too many arguments';
    if (changes) event.change(null, changes);
    return this;
  }

  function set(key, val){
    var prev = cfg[key];
    cfg[key] = val;
    if (val !== prev){
      event.change(key, val, prev);
      return 1;
    }
    return 0;
  }

};
