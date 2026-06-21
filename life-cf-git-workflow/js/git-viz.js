(function (global) {
  var GitgraphJS = global.GitgraphJS;
  var data = null;

  var DEFAULT_OPTIONS = {
    template: 'metro',
    orientation: 'vertical',
    commit: {
      message: { display: true, displayAuthor: false, font: 'normal 10px sans-serif' },
    },
  };

  function isMobile() {
    return global.matchMedia('(max-width: 768px)').matches;
  }

  function mergeOptions(preset) {
    var base = Object.assign({}, DEFAULT_OPTIONS);
    if (preset === 'sfcr') {
      base.branchColors = ['#5eb8c9', '#7aa8b8', '#D67A60', '#4a8a9a', '#2a4750'];
    } else if (preset === 'ink') {
      base.branchColors = ['#326891', '#555', '#121212', '#888'];
    } else {
      base.branchColors = ['#D67A60', '#1a1a1a', '#888', '#c4a882'];
    }
    if (isMobile()) {
      base.mode = 'compact';
      base.commit = Object.assign({}, base.commit, {
        message: { display: false, displayAuthor: false },
      });
      if (base.branch) {
        base.branch.spacing = 14;
      }
      if (base.commit.spacing !== undefined) {
        base.commit.spacing = 28;
      }
    }
    return Object.assign(base, (data && data.gitgraph_options) || {});
  }

  function initGitViz(dataset) {
    data = dataset;
  }

  function branchRegistry() {
    return { map: {}, current: null };
  }

  function ensureBranch(reg, gitgraph, name, fromName) {
    if (reg.map[name]) return reg.map[name];
    var parentName = fromName || 'main';
    if (!reg.map[parentName] && name !== parentName) {
      ensureBranch(reg, gitgraph, parentName, null);
    }
    if (!reg.map[parentName]) {
      reg.map[parentName] = gitgraph.branch(parentName);
    }
    if (name === parentName) return reg.map[parentName];
    reg.map[name] = reg.map[parentName].branch(name);
    return reg.map[name];
  }

  function runCommand(reg, gitgraph, cmd) {
    switch (cmd.op) {
      case 'commit':
        ensureBranch(reg, gitgraph, cmd.branch).commit(cmd.message || '');
        reg.current = cmd.branch;
        break;
      case 'branch':
        ensureBranch(reg, gitgraph, cmd.name, cmd.from || 'main');
        reg.current = cmd.name;
        break;
      case 'merge': {
        var into = ensureBranch(reg, gitgraph, cmd.into);
        var from = ensureBranch(reg, gitgraph, cmd.from);
        into.merge(from);
        reg.current = cmd.into;
        break;
      }
      case 'tag':
        ensureBranch(reg, gitgraph, cmd.on).tag(cmd.name);
        reg.current = cmd.on;
        break;
      default:
        break;
    }
  }

  function collectCommandsThrough(stepIndex, steps) {
    var out = [];
    for (var i = 0; i <= stepIndex && i < steps.length; i++) {
      var step = steps[i];
      if (step.gitCommands && step.gitCommands.length) {
        out = out.concat(step.gitCommands);
      }
    }
    return out;
  }

  function fitGitGraph(host) {
    var svg = host.querySelector('svg');
    if (!svg) return;
    var pane = host.closest('#viz-root') || host.parentElement;
    var maxW = (pane && pane.clientWidth) || 320;
    var maxH = (pane && pane.clientHeight) || 280;
    if (maxW < 40 || maxH < 40) return;

    svg.style.transform = '';
    svg.style.transformOrigin = '';
    host.style.height = '';
    host.style.width = '';

    var box = svg.getBBox();
    if (!box.width || !box.height) return;

    var pad = 8;
    var scale = Math.min((maxW - pad) / box.width, (maxH - pad) / box.height, 1);
    if (scale < 1) {
      svg.style.transformOrigin = 'top center';
      svg.style.transform = 'scale(' + scale.toFixed(3) + ')';
      host.style.height = Math.ceil(box.height * scale) + 'px';
      host.style.width = '100%';
    }
  }

  function renderGit(container, commands, preset) {
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'gitgraph-host';
    container.appendChild(wrap);
    var gitgraph = GitgraphJS.createGitgraph(wrap, mergeOptions(preset));
    var reg = branchRegistry();
    if (!commands.length) {
      ensureBranch(reg, gitgraph, 'main').commit('start');
    } else {
      commands.forEach(function (cmd) { runCommand(reg, gitgraph, cmd); });
    }
    global.requestAnimationFrame(function () {
      fitGitGraph(wrap);
    });
  }

  function updateGitViz(stepIndex, container, steps, preset) {
    if (!GitgraphJS) return;
    var cmds = collectCommandsThrough(stepIndex, steps || []);
    renderGit(container, cmds, preset);
  }

  global.GitViz = {
    initGitViz: initGitViz,
    updateGitViz: updateGitViz,
    collectCommandsThrough: collectCommandsThrough,
    fitGitGraph: fitGitGraph,
  };
})(window);
