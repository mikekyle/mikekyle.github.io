(function (global) {
  var d3 = global.d3;
  var data = null;
  var reduced = false;

  function initPipelineViz(dataset) {
    data = dataset;
    reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMobile() {
    return global.matchMedia('(max-width: 768px)').matches;
  }

  function chartSize(container, nodeCount, vertical) {
    var w = Math.max(260, container.clientWidth || 320);
    var h = vertical
      ? Math.max(160, 36 + nodeCount * 48 + 32)
      : Math.round(Math.max(140, Math.min(220, w * 0.42)));
    return { w: Math.min(520, w), h: h };
  }

  function activeNodes(pipeline, visible) {
    return pipeline.nodes
      .filter(function (n) { return visible[n.id]; })
      .sort(function (a, b) { return a.column - b.column; });
  }

  function layoutNodes(nodes, w, h, margin, vertical) {
    var positions = {};
    if (!nodes.length) return positions;

    if (vertical) {
      var rowH = Math.min(48, (h - margin.top - margin.bottom) / nodes.length);
      nodes.forEach(function (n, i) {
        positions[n.id] = {
          x: w / 2,
          y: margin.top + rowH * i + rowH / 2,
          nodeW: Math.min(200, w - margin.left - margin.right),
          nodeH: Math.min(36, rowH - 8),
        };
      });
      return positions;
    }

    var innerW = w - margin.left - margin.right;
    var colW = innerW / nodes.length;
    var nodeW = Math.min(96, Math.max(52, colW - 10));
    nodes.forEach(function (n, i) {
      positions[n.id] = {
        x: margin.left + colW * i + colW / 2,
        y: h / 2,
        nodeW: nodeW,
        nodeH: 32,
      };
    });
    return positions;
  }

  function updatePipelineViz(stepIndex, container, pipeline, preset) {
    if (!pipeline || !pipeline.nodes) return;
    var seq = pipeline.sequences[stepIndex] || pipeline.sequences[pipeline.sequences.length - 1] || { visible: [] };
    var visible = {};
    seq.visible.forEach(function (id) { visible[id] = true; });
    var highlight = {};
    (seq.highlight || []).forEach(function (id) { highlight[id] = true; });

    var nodes = activeNodes(pipeline, visible);
    var vertical = isMobile() && nodes.length > 3;
    var size = chartSize(container, nodes.length, vertical);
    var w = size.w;
    var h = size.h;
    var margin = { top: 20, right: 12, bottom: vertical ? 16 : 28, left: 12 };
    var positions = layoutNodes(nodes, w, h, margin, vertical);

    container.innerHTML = '';
    var svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + w + ' ' + h)
      .attr('width', '100%');

    svg.append('defs').append('marker')
      .attr('id', 'pipe-arrow').attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'var(--chart-muted)');

    var g = svg.append('g');

    for (var i = 0; i < nodes.length - 1; i++) {
      var a = positions[nodes[i].id];
      var b = positions[nodes[i + 1].id];
      if (!a || !b) continue;
      g.append('line')
        .attr('x1', a.x).attr('y1', a.y)
        .attr('x2', b.x).attr('y2', b.y)
        .attr('stroke', 'var(--chart-muted)')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#pipe-arrow)')
        .attr('opacity', 0.85);
    }

    var dur = reduced ? 0 : 280;

    var ng = g.selectAll('.pnode').data(nodes).join('g')
      .attr('class', 'pnode')
      .attr('transform', function (d) {
        var p = positions[d.id];
        return 'translate(' + p.x + ',' + p.y + ')';
      });

    ng.each(function (d) {
      var el = d3.select(this);
      el.selectAll('*').remove();
      var p = positions[d.id];
      var hi = !!highlight[d.id];
      var spec = d.accuracy === 'spec';
      var label = d.label;
      if (p.nodeW < 72 && label.length > 10) {
        label = label.replace('regression', 'regr.').replace('compose ', '');
      }
      el.append('rect')
        .attr('x', -p.nodeW / 2).attr('y', -p.nodeH / 2)
        .attr('width', p.nodeW).attr('height', p.nodeH)
        .attr('rx', 6)
        .attr('fill', hi ? 'var(--surface)' : 'var(--bg)')
        .attr('stroke', hi ? 'var(--accent)' : (spec ? 'var(--accent-warm)' : 'var(--border)'))
        .attr('stroke-width', hi ? 2 : 1)
        .attr('stroke-dasharray', spec ? '4,3' : null);
      el.append('text')
        .attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('font-size', vertical ? 11 : 10)
        .attr('fill', 'var(--text)')
        .text(label);
    });

    ng.attr('opacity', 0)
      .transition().duration(dur)
      .attr('opacity', 1);

    if (seq.caption) {
      svg.append('text')
        .attr('x', w / 2).attr('y', h - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', 'var(--text-muted)')
        .text(seq.caption);
    }
  }

  global.PipelineViz = {
    initPipelineViz: initPipelineViz,
    updatePipelineViz: updatePipelineViz,
  };
})(window);
