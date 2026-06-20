(function (global) {
  var d3 = global.d3;
  var data = null;

  function initPipelineViz(dataset) {
    data = dataset;
  }

  function chartSize(container) {
    var w = container.clientWidth || 400;
    return { w: Math.max(280, Math.min(520, w)), h: Math.round(Math.min(520, w) * 0.45) };
  }

  function updatePipelineViz(stepIndex, container, pipeline, preset) {
    if (!pipeline || !pipeline.nodes) return;
    var seq = pipeline.sequences[stepIndex] || pipeline.sequences[pipeline.sequences.length - 1] || { visible: [] };
    var visible = {};
    seq.visible.forEach(function (id) { visible[id] = true; });
    var highlight = {};
    (seq.highlight || []).forEach(function (id) { highlight[id] = true; });

    var size = chartSize(container);
    var w = size.w;
    var h = size.h;
    var margin = { top: 24, right: 16, bottom: 28, left: 16 };
    var cols = d3.max(pipeline.nodes, function (d) { return d.column; }) + 1;
    var colW = (w - margin.left - margin.right) / Math.max(cols, 1);

    container.innerHTML = '';
    var svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + w + ' ' + h)
      .attr('width', '100%');

    var nodeById = {};
    pipeline.nodes.forEach(function (n) {
      nodeById[n.id] = {
        id: n.id,
        label: n.label,
        x: margin.left + n.column * colW + colW / 2,
        y: h / 2,
        accuracy: n.accuracy || 'implemented',
      };
    });

    var g = svg.append('g');

    (pipeline.edges || []).forEach(function (e) {
      var a = nodeById[e.from];
      var b = nodeById[e.to];
      if (!a || !b) return;
      var on = visible[e.from] && visible[e.to];
      g.append('line')
        .attr('x1', a.x).attr('y1', a.y)
        .attr('x2', b.x).attr('y2', b.y)
        .attr('stroke', 'var(--chart-muted)')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrow)')
        .attr('opacity', on ? 1 : 0.12);
    });

    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'var(--chart-muted)');

    g.selectAll('.pnode').data(pipeline.nodes).join('g').attr('class', 'pnode')
      .attr('transform', function (d) {
        var p = nodeById[d.id];
        return 'translate(' + p.x + ',' + p.y + ')';
      })
      .each(function (d) {
        var el = d3.select(this);
        var p = nodeById[d.id];
        var on = !!visible[d.id];
        var hi = !!highlight[d.id];
        var spec = d.accuracy === 'spec';
        el.append('rect')
          .attr('x', -52).attr('y', -18)
          .attr('width', 104).attr('height', 36)
          .attr('rx', 6)
          .attr('fill', hi ? 'var(--surface)' : 'var(--bg)')
          .attr('stroke', hi ? 'var(--accent)' : (spec ? 'var(--accent-warm)' : 'var(--border)'))
          .attr('stroke-width', hi ? 2 : 1)
          .attr('stroke-dasharray', spec ? '4,3' : null)
          .attr('opacity', on ? 1 : 0.15);
        el.append('text')
          .attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('font-size', 10)
          .attr('fill', 'var(--text)')
          .attr('opacity', on ? 1 : 0.15)
          .text(d.label);
      });

    if (seq.caption) {
      svg.append('text')
        .attr('x', w / 2).attr('y', h - 6)
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
