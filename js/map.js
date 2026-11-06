// map.js — run map generation and path rules. No DOM; ui_map.js renders it.
// A map is { rows: [[node]] }. node: { id, row, lane, type, opp, next: [node ids] }.
// Edges only go to the next row and never cross, so every path is readable at a glance.
(function (CC) {
  'use strict';

  function pickLanes(run, width, lanes) {
    var all = [];
    for (var i = 0; i < lanes; i++) all.push(i);
    if (width >= lanes) return all;
    return CC.shuffle(run, all).slice(0, width).sort();
  }

  function pickType(run) {
    var types = CC.MAP_RULES.types, sum = 0, i;
    for (i = 0; i < types.length; i++) sum += types[i].weight;
    var roll = CC.rand(run) * sum;
    for (i = 0; i < types.length; i++) {
      roll -= types[i].weight;
      if (roll < 0) return types[i].type;
    }
    return types[0].type;
  }

  // Monotone staircase between two rows sorted by lane: every node gets at least one edge in
  // and out, no two edges cross. Each step advances one side or both, picked by the RNG.
  function link(run, a, b) {
    var i = 0, j = 0;
    a[0].next.push(b[0].id);
    while (i < a.length - 1 || j < b.length - 1) {
      var r = CC.rand(run);
      if (i === a.length - 1) j++;
      else if (j === b.length - 1) i++;
      else if (r < 0.4) i++;
      else if (r < 0.8) j++;
      else { i++; j++; }
      if (a[i].next.indexOf(b[j].id) < 0) a[i].next.push(b[j].id);
    }
  }

  CC.genMap = function (run) {
    var R = CC.MAP_RULES, rows = [];
    for (var r = 0; r < R.rows; r++) {
      var final = r === R.rows - 1;
      var width = final ? 1 : R.width.min + Math.floor(CC.rand(run) * (R.width.max - R.width.min + 1));
      var lanes = final ? [Math.floor(R.lanes / 2)] : pickLanes(run, width, R.lanes);
      // Different opponents across a row, so the path choice is a real choice.
      var opps = CC.shuffle(run, R.regulars);
      rows.push(lanes.map(function (lane, k) {
        var type = final ? 'final' : pickType(run);
        return {
          id: 'r' + r + 'n' + k, row: r, lane: lane, type: type,
          opp: final ? R.finalOpp : opps[k % opps.length], next: []
        };
      }));
    }
    for (var k = 0; k < rows.length - 1; k++) link(run, rows[k], rows[k + 1]);
    return { rows: rows };
  };

  CC.mapNode = function (map, id) {
    for (var r = 0; r < map.rows.length; r++) {
      for (var k = 0; k < map.rows[r].length; k++) if (map.rows[r][k].id === id) return map.rows[r][k];
    }
    return null;
  };

  // Node ids you may enter next: row 0 at the start, else the last cleared node's links.
  CC.reachable = function (run) {
    if (run.result) return [];
    if (!run.path.length) return run.map.rows[0].map(function (n) { return n.id; });
    var last = CC.mapNode(run.map, run.path[run.path.length - 1]);
    return last ? last.next.slice() : [];
  };
})(window.CC);
