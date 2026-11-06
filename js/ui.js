// ui.js — DOM builders. Reads state, never changes game rules.
(function (CC) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  CC.ui = { msgUid: null, msgText: '' };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // Live numbers on shot and steal cards, so the outcome is known before you commit.
  function cardCalc(s, c) {
    if (c.type === 'shot') {
      var p = CC.shotPower(s, c), w = CC.shotWall(s);
      return '<span class="card-calc' + (p > w ? ' good' : '') + '">' + c.params.power + '+' + s.atk +
        '=' + p + ' vs ' + w + (p > w ? ' GOAL' : ' SAVED') + '</span>';
    }
    if (c.effect === 'steal') {
      var ctrl = CC.oppDef(s).control, win = c.params.steal > ctrl;
      return '<span class="card-calc' + (win ? ' good' : '') + '">' + c.params.steal + ' vs CTRL ' + ctrl +
        (win ? ' WIN' : ' FAIL') + '</span>';
    }
    return '';
  }

  CC.renderCard = function (s, inst) {
    var c = CC.card(inst);
    var block = CC.cardBlock(s, inst);
    return '<button type="button" class="card type-' + c.type + (block ? ' blocked' : '') + '"' +
      ' data-uid="' + inst.uid + '" aria-disabled="' + (block ? 'true' : 'false') + '">' +
      '<span class="card-cost">' + c.cost + '</span>' +
      '<span class="card-name">' + esc(c.name) + '</span>' +
      '<span class="card-type">' + c.type.toUpperCase() + '</span>' +
      '<span class="card-text">' + esc(c.text) + '</span>' +
      cardCalc(s, c) +
      '</button>';
  };

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

  function renderOverlay(s) {
    var ov = $('overlay');
    if (!s.over) { ov.hidden = true; ov.innerHTML = ''; return; }
    var win = s.result === 'win';
    var last = s.log[s.log.length - 1];
    ov.innerHTML = '<div class="overlay-box' + (win ? '' : ' lose') + '">' +
      '<h2>' + (win ? 'YOU WIN' : 'YOU LOSE') + '</h2>' +
      '<p class="overlay-score">' + s.score.you + ' - ' + s.score.them + '</p>' +
      '<p>' + esc(last ? last.text : '') + '</p>' +
      '<button class="btn btn-main" type="button" data-act="new">New match</button>' +
      '<button class="btn btn-ghost" type="button" data-act="close">See the log</button>' +
      '</div>';
    ov.hidden = !!CC.ui.overlayClosed;
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
      stat('ATK', s.opp.atk, 'danger') +
      stat('DEF', (od.def + s.opp.bus) + (s.opp.bus ? '<small>+' + s.opp.bus + '</small>' : '')) +
      stat('CTRL', od.control) +
      stat('GK', od.gk);

    var pips = '';
    for (var i = 0; i < CC.MATCH_RULES.energy; i++) {
      pips += '<span class="pip' + (i < s.energy ? ' on' : '') + '"></span>';
    }
    $('energy').innerHTML = '<span class="dim">ENERGY</span>' + pips +
      '<span class="energy-num">' + s.energy + '/' + CC.MATCH_RULES.energy + '</span>';

    $('piles').innerHTML = '<span>DRAW <b>' + s.draw.length + '</b></span>' +
      '<span>DISCARD <b>' + s.discard.length + '</b></span>';

    $('hand').innerHTML = s.hand.length
      ? s.hand.map(function (inst) { return CC.renderCard(s, inst); }).join('')
      : '<p class="empty">No cards in hand.</p>';

    var msg = $('msg');
    if (CC.ui.msgText) { msg.textContent = CC.ui.msgText; msg.hidden = false; }
    else { msg.hidden = true; }

    $('log').innerHTML = s.log.slice(-12).reverse().map(function (e) {
      return '<div class="log-line' + (e.kind ? ' ' + e.kind : '') + '"><span class="log-min">' + e.min + "'</span>" + esc(e.text) + '</div>';
    }).join('');

    $('btn-end').disabled = s.over;
    $('seed').textContent = 'SEED ' + s.seed;
    renderOverlay(s);
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
