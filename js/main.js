// main.js — boot and input wiring. Scene router arrives with the run map (Milestone 4).
(function (CC) {
  'use strict';

  var s = null;
  var confirmNewUntil = 0;

  function commit() {
    CC.save(s);
    CC.render(s);
  }

  function startNew() {
    CC.clearReason();
    CC.ui.overlayClosed = false;
    s = CC.newMatch(CC.newSeed());
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

  function onEndTurn() {
    CC.clearReason();
    CC.endTurn(s);
    commit();
  }

  // Two taps within 3s to abandon a live match. No browser dialogs.
  function onNewTap(e) {
    var btn = e.currentTarget;
    if (s.over || Date.now() < confirmNewUntil) {
      confirmNewUntil = 0;
      btn.textContent = 'New match';
      startNew();
      return;
    }
    confirmNewUntil = Date.now() + 3000;
    btn.textContent = 'Tap again';
    setTimeout(function () {
      if (Date.now() >= confirmNewUntil) btn.textContent = 'New match';
    }, 3100);
  }

  function boot() {
    s = CC.load();
    if (!s) s = CC.newMatch(CC.newSeed());
    document.getElementById('hand').addEventListener('click', onHandTap);
    document.getElementById('btn-end').addEventListener('click', onEndTurn);
    document.getElementById('btn-new').addEventListener('click', onNewTap);
    document.getElementById('overlay').addEventListener('click', function (e) {
      if (e.target.closest('[data-act="new"]')) startNew();
      else if (e.target.closest('[data-act="close"]')) { CC.ui.overlayClosed = true; CC.render(s); }
    });
    commit();
  }

  document.addEventListener('DOMContentLoaded', boot);
})(window.CC);
