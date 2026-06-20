(function (global) {
  var GitgraphJS = global.GitgraphJS;
  var data = null;
  var reduced = false;

  var DEFAULT_OPTIONS = {
    template: 'metro',
    orientation: 'vertical',
    commit: {
      message: { display: true, displayAuthor: false, font: 'normal 10px sans-serif' },
    },
  };

  function mergeOptions(preset) {
    var base = Object.assign({}, DEFAULT_OPTIONS);
    if (preset === 'sfcr') {
      base.branchColors = ['#5eb8c9', '#7aa8b8', '#D67A60', '#4a8a9a', '#2a4750'];
    } else if (preset === 'ink') {
      base.branchColors = ['#326891', '#555', '#121212', '#888'];
    } else {
      base.branchColors = ['#D67A60', '#1a1a1a', '#888', '#c4a882'];
    }
    return Object.assign(base, (data && data.gitgraph_options) || {});
  }

  function initGitViz(dataset) {
    data = dataset;
    reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function renderGit(container, commands, preset) {
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'gitgraph-host';
    container.appendChild(wrap);
    var gitgraph = GitgraphJS.createGitgraph(wrap, mergeOptions(preset));
    var reg = branchRegistry();
    if (!commands.length) {
      ensureBranch(reg, gitgraph, 'main').commit('start');
      return;
    }
    commands.forEach(function (cmd) { runCommand(reg, gitgraph, cmd); });
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
  };
})(window);
