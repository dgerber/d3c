d3c.carto = {
  noncontiguous: d3c_carto_nc
};

function d3c_carto_nc(base){

  var self = {}
    , cfg = {

      projection: d3.geo.mercator(),

      shape: 'feature',

      scale: 1,                // shadows area if truthy
      area: 1,                 // normalized to density * mark area
      density: .5,

      title: function(d){ return d.id; },
      fill: null,
      opacity: null,
      stroke: null,

      // transitions: false,
      gabarit: false,

      features: undefined
    }
    , force = self.force = d3c.force.separate()
  ;

  self.config = d3c.configurable(self, cfg);

  self.config.on('change.shape', function(key, val, prev){
    if (key === 'shape'){
      if (val === 'ellipse' || val === 'circle') force.shape('ellipse');
      else if (val === 'rectangle' || val === 'square') force.shape('rectangle');
    }
  });

  self.render = render;

  return self;

  // closure: force, base
  function render(){

    var sel = base.selectAll('g.d3c-node')
      .data(cfg.features, cfg.id || cfg.title)
      , enter = sel.enter().append('g').attr('class', 'd3c-node')
      .call(force.drag);

    gabarit_enter(enter);
    sel.exit().transition().attr('opacity', 0).remove();

    mark_enter(enter.append('g').attr('class', 'd3c-xy'), cfg);
    mark_update(sel.select('g.d3c-xy'), cfg);

    gabarit_update(sel);

    force
      .on('tick.render', make_tick_renderer())
      .on('tick.render_gabarit',
          cfg.gabarit ? make_tick_renderer_gabarit() : null)
      .nodes(cfg.features)
      .initXY()
      .start();

    return self;
  }

  // closure: base
  function make_tick_renderer(){
    // avoid reselecting on tick
    var xy = base.selectAll('g.d3c-xy');
    return function(e){
      xy
        .attr('transform', function(n){
          return 'translate('+(n.x-n.x0)+','+(n.y-n.y0)+')';
        });
    };
  }

  function make_tick_renderer_gabarit(){
    var g = base.selectAll('g.d3c-gabarit')
      , line = g.select('line')
      , end = g.select('circle.end')
      , bbox = g.select('rect.bbox');
    return function(e){
      line
        .attr('x2', function(d){ return d.x; })
        .attr('y2', function(d){ return d.y; });
      end
        .attr('cx', function(d){ return d.x; })
        .attr('cy', function(d){ return d.y; });
      bbox
        .attr('transform', function(n){
          return 'translate('+(n.x-n.x0)+','+(n.y-n.y0)+')';
        });
    };
  }

  function gabarit_enter(sel){
    sel = sel.append('g').attr('class', 'd3c-gabarit');
    sel.append('circle').attr('class', 'start').attr('r', 2);
    sel.append('line');
    sel.append('rect').attr('class', 'bbox');
    sel.append('circle').attr('class', 'end').attr('r', 2);
  }

  function gabarit_update(sel){
    sel = sel.select('g.d3c-gabarit')
      .attr('display', cfg.gabarit ? null : 'none');
    if (cfg.gabarit){
      sel = sel.transition().duration(1000);
      sel.select('circle.start')
        .attr('cx', function(d) { return d.x0; })
        .attr('cy', function(d) { return d.y0; });
      sel.select('line')
        .attr('x1', function(d) { return d.x0; })
        .attr('y1', function(d) { return d.y0; })
      sel.select('rect.bbox')
        .attr('x', function(d){ return d.x0 - d.width / 2; })
        .attr('y', function(d){ return d.y0 - d.height / 2; })
        .attr('width', function(d){ return d.width; })
        .attr('height', function(d){ return d.height; });
      sel.select('circle.end')
        .attr('cx', function(f){ return f.x0; })
        .attr('cy', function(f){ return f.y0; });
    }
  }

  // function gabarit_exit(sel){
  //   sel.selectAll('g.d3c-gabarit').remove();
  // }

  function mark_enter(sel, cfg){
    sel.append('path')
      .attr('vector-effect', 'non-scaling-stroke');
  }

  function mark_update(sel, cfg){
    var scale
      , path = d3.geo.path().projection(cfg.projection)
      , area;

    if (cfg.scale){
      scale = d3.functor(cfg.scale);
      if (cfg.density){
        area = function(f){ return scale(f) * f.raw_area;};
      }
    }
    if (area || !scale) {
      var raw_areas = 0
        , target_areas = 0
        , R;
      area = area || d3.functor(cfg.area);

      sel.each(function(f){
        raw_areas += (f.raw_area = path.area(f) || 1);
        target_areas += (f.target_area = area(f));
      });

      R = (cfg.density || 1) * raw_areas / target_areas;
      scale = function(f){
        return Math.sqrt(R * f.target_area / f.raw_area);
      };
    }

    sel.each(function(f){
      f.scale = scale(f);
      compute_bbox(f);
    });

    function compute_bbox(f){
      var b = path.bounds(f)
        , c = path.centroid(f);
      f.centroid = c;  // dilation centered on centroid
      f.width = f.scale * (b[1][0] - b[0][0]);
      f.height = f.scale * (b[1][1] - b[0][1]);
      if (cfg.shape === 'feature'){
        f.x0 = c[0] + f.scale * ((b[1][0] + b[0][0]) / 2 - c[0]);
        f.y0 = c[1] + f.scale * ((b[1][1] + b[0][1]) / 2 - c[1]);
      } else {
        f.x0 = c[0];
        f.y0 = c[1];
      }
    }

    var p = sel.select('path')
      .attr('title', cfg.title || cfg.id);

    var shape = d3c_carto_nc.shapes[cfg.shape] || cfg.shape;
    p.style('fill', cfg.fill)
      .style('fill-opacity', cfg.opacity)
      .style('stroke', cfg.stroke)
      .call(shape, cfg);

  }

}


d3c_carto_nc.shapes = {

  feature: function(sel, cfg){
    sel
      .attr('d', d3.geo.path().projection(cfg.projection))
      .attr('transform', function(f){
        var c = f.centroid;
        return 'translate('+c[0]+','+c[1]
      +')scale('+ f.scale
      +')translate('+-c[0]+','+-c[1]+')';
      });

    // if (cfg.transitions){
    //   sel.transition().duration(1200)//.delay(10)
    //     .attrTween('d', d3c.svg.pathTween(..., 4));
    // } else {
    //   sel.attr('d', ...);
    // }

  },

  ellipse: function(sel){
    sel
      .attr('d', function(f){
        var s = f.scale * Math.sqrt(f.raw_area / (f.width * f.height * Math.PI / 4));
        f.width *= s;
        f.height *= s;
        var a = f.width / 2, b = f.height / 2;
        return 'M'+a+',0'
      +'A'+a+','+b+' 0 1,1 '+-a+',0'
      +'A'+a+','+b+' 0 1,1 '+a+',0'
      +'Z';
      })
      .attr('transform', function(f){
        var c = f.centroid;
        return 'translate('+c[0]+','+c[1]+')';
      });
  },

  rectangle: function(sel){
    sel
      .attr('d', function(f){
        var s = f.scale * Math.sqrt(f.raw_area / (f.width * f.height));
        f.width *= s;
        f.height *= s;
        return 'M'+-f.width/2+','+-f.height/2
      +'h'+f.width+'v'+f.height+'h'+-f.width+'v'+-f.height+'Z';
      })
      .attr('transform', function(f){
        var c = f.centroid;
        return 'translate('+c[0]+','+c[1]+')';
      });
  },

  circle: function(sel){
    sel
      .attr('d', function(f){
        var r = f.scale * Math.sqrt(f.raw_area / Math.PI);
        f.width = f.height = 2 * r;
        return 'M'+r+','+'0'
      +'A'+r+','+r+' 0 1,1 '+-r+',0'
      +'A'+r+','+r+' 0 1,1 '+r+',0'
      +'Z';
      })
      .attr('transform', function(f){
        var c = f.centroid;
        return 'translate('+c[0]+','+c[1]+')';
      });
  },

  square: function(sel){
    sel
      .attr('d', function(f){
        var r = f.scale * Math.sqrt(f.raw_area) / 2;
        f.width = f.height = 2 * r;
        return 'M'+-f.width/2+','+-f.height/2
      +'h'+f.width+'v'+f.height+'h'+-f.width+'v'+-f.height+'Z';
      })
      .attr('transform', function(f){
        var c = f.centroid;
        return 'translate('+c[0]+','+c[1]+')';
      });
  }

};
