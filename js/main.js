// main.js — boot and input wiring. Scene router arrives with the run map (Milestone 4).
(function (CC) {
  'use strict';

  var s = null;
  var confirmNewUntil = 0;

  function commit() {
    CC.save(s);
    CC.render(s);
  }

  var TEST = /[?&]test=1\b/.test(location.search);

  function freshMatch() {
    var seed = CC.newSeed();
    return CC.newMatch(seed, null, TEST ? CC.testRun(seed) : null);
  }

  function startNew() {
    CC.clearReason();
    CC.ui.overlayClosed = false;
    CC.ui.view = null;
    s = freshMatch();
    commit();
  }

  function onHandTap(e) {
    var btn = e.target.closest('.card');
    if (!btn) return;
    e.stopPropagation();
    var uid = Number(btn.getAttribute('data-uid'));
    var inst = s.hand.filter(function (h) { return h.uid === uid; })[0];
    if (!inst) return;
    var block = CC.cardBlock(s, inst);
    if (block) {
      CC.showReason(uid, block);
      CC.render(s);
      return;
    }
    CC.clearReason();
    CC.playCard(s, uid);
    commit();
  }

  // Overlay + viewer + pile buttons share one handler. stopPropagation keeps nested taps from leaking.
  function onUiTap(e) {
    var el = e.target.closest('[data-pick],[data-act],[data-view]');
    if (!el) return;
    e.stopPropagation();
    var pick = el.getAttribute('data-pick');
    var act = el.getAttribute('data-act');
    var view = el.getAttribute('data-view');
    if (pick) { CC.pickReward(s, pick); commit(); return; }
    if (view) { CC.ui.view = view; CC.render(s); return; }
    if (act === 'new') startNew();
    else if (act === 'next') { CC.ui.overlayClosed = false; s = CC.nextMatch(s); commit(); }
    else if (act === 'close') { CC.ui.overlayClosed = true; CC.render(s); }
    else if (act === 'close-view') { CC.ui.view = null; CC.render(s); }
  }

  function onEndTurn() {
    if (s.over) { CC.ui.overlayClosed = false; CC.render(s); return; }
    CC.clearReason();
    CC.endTurn(s);
    commit();
  }

  // Two taps within 3s to abandon a live match. No browser dialogs.
  function onNewTap(e) {
    var btn = e.currentTarget;
    if (s.over || Date.now() < confirmNewUntil) {
      confirmNewUntil = 0;
      btn.textContent = 'New run';
      startNew();
      return;
    }
    confirmNewUntil = Date.now() + 3000;
    btn.textContent = 'Tap again';
    setTimeout(function () {
      if (Date.now() >= confirmNewUntil) btn.textContent = 'New run';
    }, 3100);
  }

  function boot() {
    s = CC.load();
    // A test link always gets a test run; a normal link never continues a test run.
    if (!s || !!s.run.test !== TEST) s = freshMatch();
    document.getElementById('hand').addEventListener('click', onHandTap);
    document.getElementById('btn-end').addEventListener('click', onEndTurn);
    document.getElementById('btn-new').addEventListener('click', onNewTap);
    ['overlay', 'viewer', 'piles'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', onUiTap);
    });
    commit();
  }

  document.addEventListener('DOMContentLoaded', boot);
})(window.CC);
