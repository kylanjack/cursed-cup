// screens.js — overlays: full time / reward / run over, and the card pile viewer.
(function (CC) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = CC.esc;

  function rewardBlock(s) {
    var r = s.reward;
    if (!r) return '';
    if (!r.picked) {
      return '<p class="ov-label">PICK A CARD FOR YOUR DECK</p>' +
        '<div class="reward-cards">' + r.offer.map(function (id) {
          return CC.renderCard(s, { id: id }, false, ' data-pick="' + id + '"');
        }).join('') + '</div>' +
        '<button class="btn btn-ghost" type="button" data-pick="skip">Skip</button>';
    }
    var line = r.picked === 'skip' ? 'Skipped. Deck unchanged.' : CC.CARDS[r.picked].name + ' added.';
    return '<p>' + esc(line) + ' Deck: ' + s.run.deck.length + ' cards.</p>' +
      '<button class="btn btn-main" type="button" data-act="next">Next match</button>';
  }

  CC.renderOverlay = function (s) {
    var ov = $('overlay');
    if (!s.over || CC.ui.overlayClosed) { ov.hidden = true; ov.innerHTML = ''; return; }
    var win = s.result === 'win';
    var last = s.log[s.log.length - 1];
    ov.innerHTML = '<div class="overlay-box' + (win ? ' wide' : ' lose') + '">' +
      '<h2>' + (win ? 'YOU WIN' : 'RUN OVER') + '</h2>' +
      '<p class="overlay-score">' + s.score.you + ' - ' + s.score.them + '</p>' +
      '<p>' + esc(last ? last.text : '') + '</p>' +
      (win ? rewardBlock(s)
        : '<p>Matches won this run: ' + s.run.won + '.</p>' +
          '<button class="btn btn-main" type="button" data-act="new">New run</button>') +
      '<div class="ov-row">' +
      '<button class="btn btn-ghost" type="button" data-view="deck">Deck ' + s.run.deck.length + '</button>' +
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

  CC.renderViewer = function (s) {
    var v = $('viewer');
    var view = CC.ui.view;
    if (!view) { v.hidden = true; v.innerHTML = ''; return; }
    var ids = view === 'deck' ? s.run.deck : s[view].map(function (i) { return i.id; });
    v.innerHTML = '<div class="viewer-box">' +
      '<div class="viewer-head"><h3>' + TITLES[view] + ' · ' + ids.length + '</h3>' +
      '<button class="btn btn-ghost" type="button" data-act="close-view">Close</button></div>' +
      (ids.length ? '<div class="viewer-cards">' + sortIds(ids).map(function (id) {
        return CC.renderCard(s, { id: id }, false);
      }).join('') + '</div>' : '<p class="empty">Empty.</p>') +
      '</div>';
    v.hidden = false;
  };
})(window.CC);
