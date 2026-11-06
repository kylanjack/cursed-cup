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

  CC.renderCard = function (s, inst) {
    var c = CC.card(inst);
    var block = CC.cardBlock(s, inst);
    return '<button type="button" class="card type-' + c.type + (block ? ' blocked' : '') + '"' +
      ' data-uid="' + inst.uid + '" aria-disabled="' + (block ? 'true' : 'false') + '">' +
      '<span class="card-cost">' + c.cost + '</span>' +
      '<span class="card-name">' + esc(c.name) + '</span>' +
      '<span class="card-type">' + c.type.toUpperCase() + '</span>' +
      '<span class="card-text">' + esc(c.text) + '</span>' +
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
    var y = s.score.you, t = s.score.them;
    var verdict = y > t ? 'You win.' : (y < t ? 'You lose.' : 'Draw. Golden goal comes in Milestone 2.');
    ov.innerHTML = '<div class="overlay-box">' +
      '<h2>FULL TIME</h2>' +
      '<p class="overlay-score">' + y + ' - ' + t + '</p>' +
      '<p>' + verdict + '</p>' +
      '<button class="btn btn-main" type="button" data-act="new">New match</button>' +
      '</div>';
    ov.hidden = false;
  }

  CC.render = function (s) {
    $('score-you').textContent = s.score.you;
    $('score-them').textContent = s.score.them;
    $('opp-short').textContent = s.opponent.short;
    $('clock-min').textContent = CC.clockMinute(s) + "'";
    $('clock-turn').textContent = s.over ? 'FT' : 'T' + s.turn + '/' + CC.MATCH_RULES.turns;

    $('intent').innerHTML = '<span class="intent-label">' + esc(s.opponent.name.toUpperCase()) +
      '</span><span class="intent-val">No intent yet</span>';

    $('pitch').innerHTML = renderPitch(s);

    $('stats').innerHTML =
      stat('ATK', s.atk, 'accent') +
      stat('SHP', s.shp) +
      stat('CONTROL', s.control);

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

    $('log').innerHTML = s.log.slice(-8).reverse().map(function (e) {
      return '<div class="log-line"><span class="log-min">' + e.min + "'</span>" + esc(e.text) + '</div>';
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
