// ui.js — DOM builders. Reads state, never changes game rules.
(function (CC) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  CC.ui = { msgUid: null, msgText: '', view: null, overlayClosed: false };

  var esc = CC.esc = function (str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  };

  // Live numbers on shot and steal cards, so the outcome is known before you commit.
  function cardCalc(s, c) {
    if (c.type === 'shot') {
      var p = CC.shotPower(s, c), w = CC.shotWall(s);
      var extra = p - c.params.power - s.atk;
      return '<span class="card-calc' + (p > w ? ' good' : '') + '">' + c.params.power + '+' + s.atk +
        (extra ? '+' + extra : '') + '=' + p + ' vs ' + w + (p > w ? ' GOAL' : ' SAVED') + '</span>';
    }
    if (c.effect === 'steal') {
      var ctrl = CC.oppDef(s).control, win = c.params.steal > ctrl;
      return '<span class="card-calc' + (win ? ' good' : '') + '">' + c.params.steal + ' vs CTRL ' + ctrl +
        (win ? ' WIN' : ' FAIL') + '</span>';
    }
    return '';
  }

  // live: card in hand (blocked state, current cost, live numbers). Otherwise a static card (reward, viewer).
  // attr: extra attribute string for the button, e.g. data-pick="id".
  CC.renderCard = function (s, inst, live, attr) {
    var c = CC.card(inst);
    var block = live ? CC.cardBlock(s, inst) : null;
    var cost = live ? CC.cardCost(s, inst) : c.cost;
    return '<button type="button" class="card type-' + c.type + ' rarity-' + c.rarity + (block ? ' blocked' : '') + '"' +
      (live ? ' data-uid="' + inst.uid + '"' : '') + (attr || '') + ' aria-disabled="' + (block ? 'true' : 'false') + '">' +
      '<span class="card-cost' + (cost < c.cost ? ' cheaper' : '') + '">' + cost + '</span>' +
      '<span class="card-name">' + esc(c.name) + '</span>' +
      '<span class="card-type">' + c.type.toUpperCase() + (c.rarity !== 'starter' ? ' · ' + c.rarity.toUpperCase() : '') + '</span>' +
      '<span class="card-text">' + esc(c.text) + '</span>' +
      (live ? cardCalc(s, c) : '') +
      '</button>';
  };

  // Active powers and one-turn buffs, plus opponent statuses.
  function renderStatus(s) {
    var list = [];
    function add(key, n) {
      var d = CC.STATUS[key];
      list.push('<span class="chip' + (d.them ? ' them' : '') + '"><b>' + d.name + ' ' + n + '</b> ' +
        esc(d.text.replace('{n}', n)) + '</span>');
    }
    Object.keys(s.powers).forEach(function (k) { if (s.powers[k]) add(k, s.powers[k]); });
    if (s.shotBonus) add('shot_bonus', s.shotBonus);
    if (s.costDown) add('cost_down', s.costDown);
    if (s.opp.bus) add('opp_bus', s.opp.bus);
    if (s.opp.perm) add('opp_perm', s.opp.perm);
    return list.join('');
  }

  function renderPitch(s) {
    var html = '<div class="goal-end">YOUR GOAL</div><div class="zones">';
    for (var z = 0; z < 3; z++) {
      var here = s.ball.zone === z;
      html += '<div class="zone' + (here ? ' active' : '') + '">' +
        '<span class="zone-name">' + CC.ZONES[z] + '</span>' +
        (here ? '<span class="ball side-' + s.ball.side + '"></span>' +
          '<span class="poss">' + (s.ball.side === 'you' ? 'YOUR BALL' : 'THEIR BALL') + '</span>' : '') +
        '</div>';
    }
    return html + '</div><div class="goal-end">THEIR GOAL</div>';
  }

  function stat(label, value, cls) {
    return '<div class="stat ' + (cls || '') + '"><span class="stat-label">' + label +
      '</span><span class="stat-val">' + value + '</span></div>';
  }

  CC.render = function (s) {
    $('score-you').textContent = s.score.you;
    $('score-them').textContent = s.score.them;
    $('opp-short').textContent = s.opp.short;
    $('clock-min').textContent = CC.clockLabel(s) + "'";
    $('clock-turn').textContent = s.over ? 'FT' : (s.golden ? 'GOLDEN GOAL' : 'T' + s.turn + '/' + CC.MATCH_RULES.turns);

    var ip = CC.intentPreview(s);
    var box = $('intent');
    box.className = 'intent' + (ip.lost ? ' lost' : '') + (ip.danger ? ' danger' : '');
    box.innerHTML = '<div class="intent-top"><span class="intent-label">' + esc(s.opp.name.toUpperCase()) +
      '</span><span class="intent-head">' + (s.over ? '-' : esc(ip.head)) + '</span></div>' +
      '<div class="intent-val">' + (s.over ? 'Match over.' : esc(ip.detail)) + '</div>';

    $('pitch').innerHTML = renderPitch(s);

    var od = CC.oppDef(s);
    $('stats').innerHTML =
      '<span class="stats-side">YOU</span>' +
      stat('ATK', s.atk, 'accent') +
      stat('SHP', s.shp) +
      stat('CTRL', s.control) +
      stat('GK', s.gk) +
      '<span class="stats-side">' + esc(s.opp.short) + '</span>' +
      stat('ATK', s.opp.atk + (s.opp.perm ? '<small>+' + s.opp.perm + '</small>' : ''), 'danger') +
      stat('DEF', (od.def + s.opp.bus) + (s.opp.bus ? '<small>+' + s.opp.bus + '</small>' : '')) +
      stat('CTRL', od.control) +
      stat('GK', od.gk);

    var st = renderStatus(s);
    $('status').innerHTML = st;
    $('status').hidden = !st;

    var pips = '';
    for (var i = 0; i < CC.MATCH_RULES.energy; i++) {
      pips += '<span class="pip' + (i < s.energy ? ' on' : '') + '"></span>';
    }
    $('energy').innerHTML = '<span class="dim">ENERGY</span>' + pips +
      '<span class="energy-num">' + s.energy + '/' + CC.MATCH_RULES.energy + '</span>';

    $('piles').innerHTML =
      '<button type="button" class="pile" data-view="draw">DRAW <b>' + s.draw.length + '</b></button>' +
      '<button type="button" class="pile" data-view="discard">DISCARD <b>' + s.discard.length + '</b></button>' +
      (s.exhaust.length ? '<button type="button" class="pile" data-view="exhaust">OUT <b>' + s.exhaust.length + '</b></button>' : '') +
      '<button type="button" class="pile" data-view="deck">DECK <b>' + s.run.deck.length + '</b></button>';

    $('hand').innerHTML = s.hand.length
      ? s.hand.map(function (inst) { return CC.renderCard(s, inst, true); }).join('')
      : '<p class="empty">No cards in hand.</p>';

    var msg = $('msg');
    if (CC.ui.msgText) { msg.textContent = CC.ui.msgText; msg.hidden = false; }
    else { msg.hidden = true; }

    $('log').innerHTML = s.log.slice(-12).reverse().map(function (e) {
      return '<div class="log-line' + (e.kind ? ' ' + e.kind : '') + '"><span class="log-min">' + e.min + "'</span>" + esc(e.text) + '</div>';
    }).join('');

    $('btn-end').textContent = s.over ? 'Results' : 'End turn';
    $('seed').textContent = 'SEED ' + s.seed;
    CC.renderOverlay(s);
    CC.renderViewer(s);
  };

  // Tap-to-toggle reason for a blocked card.
  CC.showReason = function (uid, text) {
    if (CC.ui.msgUid === uid) { CC.clearReason(); return; }
    CC.ui.msgUid = uid;
    CC.ui.msgText = text;
  };

  CC.clearReason = function () {
    CC.ui.msgUid = null;
    CC.ui.msgText = '';
  };
})(window.CC);
