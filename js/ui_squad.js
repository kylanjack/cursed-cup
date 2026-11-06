// ui_squad.js — squad strip (match), squad list (map), player info on click. Reads state only.
(function (CC) {
  'use strict';

  var esc = CC.esc;
  var STATUS = { fit: 'FIT', injured: 'INJURED', gone: 'CAREER OVER' };

  function surname(name) { var p = name.split(' '); return p[p.length - 1]; }

  // One line of rules for a player, used in the info box and the map list.
  CC.squadRule = function (p) {
    var d = CC.SQUAD[p.id];
    var t = d.text;
    if (d.trait && d.trait.text) t += ' ' + d.trait.name + ': ' + d.trait.text;
    if (p.status === 'injured') t += ' Injured: no effect until healed. One more injury is career over.';
    if (p.status === 'gone') t += ' Career over: gone for the rest of the run.';
    if (p.status !== 'fit' && d.hook === 'gk') t += ' Your GK is ' + CC.SQUAD_RULES.noKeeperGk + ' without a keeper.';
    return t;
  };

  // Compact strip for the match screen. target: squad id the current DIRTY TACKLE goes after.
  CC.renderSquadStrip = function (squad, target) {
    var open = CC.ui.squadInfo;
    var chips = squad.map(function (p) {
      var d = CC.SQUAD[p.id];
      return '<button type="button" class="pl st-' + p.status + (p.id === target ? ' targeted' : '') + (open === p.id ? ' open' : '') +
        '" data-squad="' + p.id + '"><span class="pl-pos">' + d.pos + '</span><span class="pl-name">' + esc(surname(d.name)) + '</span>' +
        '<span class="pl-st">' + (p.id === target ? 'TARGET' : STATUS[p.status]) + '</span></button>';
    }).join('');
    var info = '';
    var sel = squad.filter(function (p) { return p.id === open; })[0];
    if (sel) {
      var d = CC.SQUAD[sel.id];
      info = '<div class="pl-info"><b>' + esc(d.name) + '</b> · ' + d.pos + (d.trait ? ' · ' + esc(d.trait.name) : '') +
        ' · ' + STATUS[sel.status] + '<br>' + esc(CC.squadRule(sel)) + '</div>';
    }
    return '<div class="pl-row">' + chips + '</div>' + info;
  };

  // Full list for the map side panel.
  CC.renderSquadList = function (squad) {
    return '<p class="side-label">YOUR SQUAD</p><div class="sq-list">' + squad.map(function (p) {
      var d = CC.SQUAD[p.id];
      return '<div class="sq st-' + p.status + '"><div class="sq-top"><span class="pl-pos">' + d.pos + '</span><b>' + esc(d.name) + '</b>' +
        (d.trait ? '<span class="sq-trait">' + esc(d.trait.name) + '</span>' : '') +
        '<span class="pl-st">' + STATUS[p.status] + '</span></div><p>' + esc(CC.squadRule(p)) + '</p></div>';
    }).join('') + '</div>';
  };
})(window.CC);
