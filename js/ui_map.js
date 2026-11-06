// ui_map.js — run map screen: nodes, links, selected-node panel. Reads run state only.
(function (CC) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = CC.esc;

  function pos(node) {
    var R = CC.MAP_RULES;
    return { x: (node.row + 0.5) / R.rows * 100, y: (node.lane + 0.5) / R.lanes * 100 };
  }

  function nodeState(run, node, reach) {
    var at = run.path.indexOf(node.id);
    if (at >= 0) return at === run.path.length - 1 ? 'current' : 'done';
    if (reach.indexOf(node.id) >= 0) return 'open';
    return 'locked';
  }

  function result(run, node) {
    for (var i = 0; i < run.history.length; i++) {
      var h = run.history[i];
      if (h.node === node.id) return h.you + '-' + h.them;
    }
    return '';
  }

  function renderNode(run, node, reach) {
    var st = nodeState(run, node, reach);
    var od = CC.OPPONENTS[node.opp];
    var p = pos(node);
    var sel = CC.ui.selected === node.id;
    var res = result(run, node);
    return '<button type="button" class="node node-' + node.type + ' st-' + st + (sel ? ' selected' : '') + '"' +
      ' style="left:' + p.x + '%;top:' + p.y + '%"' +
      (st === 'open' ? ' data-node="' + node.id + '"' : ' aria-disabled="true"') + '>' +
      '<span class="node-type">' + CC.NODE_NAMES[node.type] + '</span>' +
      '<span class="node-opp">' + esc(od.name) + '</span>' +
      (res ? '<span class="node-res">' + res + '</span>' : '') +
      '</button>';
  }

  function renderLinks(run, reach) {
    var cur = run.path[run.path.length - 1];
    var lines = '';
    run.map.rows.forEach(function (row) {
      row.forEach(function (n) {
        var a = pos(n);
        n.next.forEach(function (id) {
          var m = CC.mapNode(run.map, id), b = pos(m);
          var walked = run.path.indexOf(n.id) >= 0 && run.path.indexOf(id) === run.path.indexOf(n.id) + 1;
          var live = !run.result && n.id === cur && reach.indexOf(id) >= 0;
          lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"' +
            ' class="' + (walked ? 'walked' : (live ? 'live' : '')) + '" vector-effect="non-scaling-stroke"/>';
        });
      });
    });
    return '<svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>';
  }

  function rowLabels() {
    var R = CC.MAP_RULES, out = '';
    for (var r = 0; r < R.rows; r++) {
      out += '<span style="left:' + ((r + 0.5) / R.rows * 100) + '%">' + (r === R.rows - 1 ? 'FINAL' : 'ROUND ' + (r + 1)) + '</span>';
    }
    return '<div class="row-labels">' + out + '</div>';
  }

  function panel(run, reach) {
    var id = CC.ui.selected;
    if (id && reach.indexOf(id) >= 0) {
      var node = CC.mapNode(run.map, id);
      var od = CC.OPPONENTS[node.opp];
      var st = CC.oppStats(node.opp, node.row);
      return '<p class="side-label">' + CC.NODE_NAMES[node.type] + ' · ROUND ' + (node.row + 1) + '</p>' +
        '<h2>' + esc(od.name) + '</h2>' +
        '<p>' + esc(od.style) + '</p>' +
        '<div class="opp-stats">' +
        '<span>YOUR SHOT MUST BEAT</span><b>' + (st.def + st.gk) + '</b>' +
        '<span>DEF + GK</span><b>' + st.def + ' + ' + st.gk + '</b>' +
        '<span>STEAL MUST BEAT CTRL</span><b>' + st.control + '</b>' +
        '<span>THEIR SHOTS</span><b>' + st.shotMin + '–' + st.shotMax + ' + ATK</b>' +
        '</div>' +
        '<button type="button" class="btn btn-main" data-act="kickoff">Kick off</button>';
    }
    var hist = run.history.length ? '<div class="history">' + run.history.map(function (h) {
      return '<div><span>' + esc(CC.OPPONENTS[h.opp].name) + '</span><b>' + h.you + '-' + h.them + '</b></div>';
    }).join('') + '</div>' : '';
    return '<p class="side-label">THE CUP</p>' +
      '<h2>' + (run.path.length ? 'Pick the next match' : 'Pick your first match') + '</h2>' +
      '<p>Click a lit node to see the opponent. Lines show where each path leads. Every path ends at the FINAL. Lose once and the run is over.</p>' +
      '<p class="dim">Market, training, events and rivals arrive in later milestones. For now every node is a match.</p>' +
      hist;
  }

  CC.renderMap = function (run) {
    var reach = CC.reachable(run);
    if (CC.ui.selected && reach.indexOf(CC.ui.selected) < 0) CC.ui.selected = null;
    var nodes = '';
    run.map.rows.forEach(function (row) {
      row.forEach(function (n) { nodes += renderNode(run, n, reach); });
    });
    $('map').innerHTML = rowLabels() + '<div class="map-field">' + renderLinks(run, reach) + nodes + '</div>';
    $('map-side').innerHTML = panel(run, reach);
  };
})(window.CC);
