(function (global) {
  function initFlowViz(dataset) {
    global.GitViz.initGitViz(dataset);
    if (dataset.pipeline) global.PipelineViz.initPipelineViz(dataset);
    var root = document.getElementById('graphic');
    if (root) root.innerHTML = '<div id="viz-root"></div>';
  }

  function preset() {
    var body = document.body;
    return (body && body.getAttribute('data-preset')) || 'sfcr';
  }

  function updateFlowViz(stepIndex) {
    var data = global.STORY_DATA;
    if (!data || !data.steps) return;
    var root = document.getElementById('viz-root');
    if (!root) return;
    var step = data.steps[stepIndex] || data.steps[0];
    var mode = step.viz || 'git';

    if (mode === 'pipeline' && data.pipeline) {
      var pIdx = typeof step.pipelineStep === 'number' ? step.pipelineStep : stepIndex;
      global.PipelineViz.updatePipelineViz(pIdx, root, data.pipeline, preset());
    } else {
      global.GitViz.updateGitViz(stepIndex, root, data.steps, preset());
    }
  }

  global.FlowViz = { initFlowViz: initFlowViz, updateFlowViz: updateFlowViz };
})(window);
