// screens.js — overlays: full time / reward / run over, and the card pile viewer.
(function (CC) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = CC.esc;

  function rewardBlock(run) {
    var r = run.reward;
    if (!r) return '';
    var coins = '<p class="ov-coins">+' + r.coins.total + ' COINS <span>' + esc(r.coins.parts.join(' · ')) + '</span></p>';
    if (!r.picked) {
      return coins + '<p class="ov-label">PICK A CARD FOR YOUR DECK</p>' +
        '<div class="reward-cards">' + r.offer.map(function (id) {
          return CC.renderCard(null, { id: id }, false, ' data-pick="' + id + '"');
        }).join('') + '</div>' +
        '<button class="btn btn-ghost" type="button" data-pick="skip">Skip</button>';
    }
    var line = r.picked === 'skip' ? 'Skipped. Deck unchanged.' : CC.CARDS[r.picked].name + ' added.';
    return coins + '<p>' + esc(line) + ' Deck: ' + run.deck.length + ' cards.</p>' +
      '<button class="btn btn-main" type="button" data-act="map">Back to the map</button>';
  }

  function summary(run) {
    var gf = 0, ga = 0;
    run.history.forEach(function (h) { gf += h.you; ga += h.them; });
    return '<div class="opp-stats summary">' +
      '<span>MATCHES WON</span><b>' + run.won + ' / ' + CC.MAP_RULES.rows + '</b>' +
      '<span>GOALS</span><b>' + gf + ' - ' + ga + '</b>' +
      '<span>COINS</span><b>' + run.coins + '</b>' +
      '<span>DECK</span><b>' + run.deck.length + ' cards</b>' +
      '</div>' +
      '<div class="history">' + run.history.map(function (h) {
        return '<div><span>' + esc(CC.OPPONENTS[h.opp].name) + '</span><b>' + h.you + '-' + h.them + '</b></div>';
      }).join('') + '</div>';
  }

  CC.renderOverlay = function (run) {
    var ov = $('overlay');
    var s = run.match;
    if (run.scene !== 'match' || !s || !s.over || CC.ui.overlayClosed) { ov.hidden = true; ov.innerHTML = ''; return; }
    var win = s.result === 'win';
    var champ = run.result === 'champion';
    var last = s.log[s.log.length - 1];
    var body;
    if (champ) {
      body = '<p>You won the cup. The sky closes. Kaz goes home.</p>' + summary(run) +
        '<button class="btn btn-main" type="button" data-act="new">New run</button>';
    } else if (win) {
      body = rewardBlock(run);
    } else {
      body = summary(run) + '<button class="btn btn-main" type="button" data-act="new">New run</button>';
    }
    ov.innerHTML = '<div class="overlay-box' + (win && !champ ? ' wide' : '') + (win ? '' : ' lose') + '">' +
      '<h2>' + (champ ? 'CUP WON' : (win ? 'YOU WIN' : 'RUN OVER')) + '</h2>' +
      '<p class="overlay-score">' + s.score.you + ' - ' + s.score.them + '</p>' +
      '<p>' + esc(last ? last.text : '') + '</p>' +
      body +
      '<div class="ov-row">' +
      '<button class="btn btn-ghost" type="button" data-view="deck">Deck ' + run.deck.length + '</button>' +
      '<button class="btn btn-ghost" type="button" data-act="close">See the log</button>' +
      '</div></div>';
    ov.hidden = false;
  };

  var TITLES = { deck: 'YOUR DECK', draw: 'DRAW PILE (shown sorted)', discard: 'DISCARD PILE', exhaust: 'OUT OF THE MATCH' };

  function sortIds(ids) {
    var order = { starter: 0, common: 1, uncommon: 2, rare: 3 };
    return ids.slice().sort(function (a, b) {
      var ca = CC.CARDS[a], cb = CC.CARDS[b];
      return (order[ca.rarity] - order[cb.rarity]) || ca.name.localeCompare(cb.name);
    });
  }

  CC.renderViewer = function (run) {
    var s = run.match;
    var v = $('viewer');
    var view = CC.ui.view;
    if (view && view !== 'deck' && !s) view = CC.ui.view = null;
    if (!view) { v.hidden = true; v.innerHTML = ''; return; }
    var ids = view === 'deck' ? run.deck : s[view].map(function (i) { return i.id; });
    v.innerHTML = '<div class="viewer-box">' +
      '<div class="viewer-head"><h3>' + TITLES[view] + ' · ' + ids.length + '</h3>' +
      '<button class="btn btn-ghost" type="button" data-act="close-view">Close</button></div>' +
      (ids.length ? '<div class="viewer-cards">' + sortIds(ids).map(function (id) {
        return CC.renderCard(null, { id: id }, false);
      }).join('') + '</div>' : '<p class="empty">Empty.</p>') +
      '</div>';
    v.hidden = false;
  };
})(window.CC);
