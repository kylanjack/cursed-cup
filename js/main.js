// main.js — boot, scene router (map / match) and input wiring. Game rules live elsewhere.
(function (CC) {
  'use strict';

  var run = null;
  var confirmNewUntil = 0;
  var TEST = /[?&]test=1\b/.test(location.search);

  // Every completed action: settle a finished match, save, redraw.
  function commit() {
    if (run.match) CC.settleMatch(run);
    CC.save(run);
    CC.render(run);
  }

  function startNew() {
    CC.clearReason();
    CC.ui.overlayClosed = false;
    CC.ui.view = null;
    CC.ui.selected = null;
    CC.ui.notice = '';
    run = CC.newRun(CC.newSeed(), TEST);
    commit();
  }

  function onHandTap(e) {
    var btn = e.target.closest('.card');
    if (!btn || !run.match) return;
    e.stopPropagation();
    var s = run.match;
    var uid = Number(btn.getAttribute('data-uid'));
    var inst = s.hand.filter(function (h) { return h.uid === uid; })[0];
    if (!inst) return;
    var block = CC.cardBlock(s, inst);
    if (block) {
      CC.showReason(uid, block);
      CC.render(run);
      return;
    }
    CC.clearReason();
    CC.playCard(s, uid);
    commit();
  }

  // Overlay, viewer, piles, map and top bar share one handler. stopPropagation keeps nested clicks from leaking.
  function onUiTap(e) {
    var el = e.target.closest('[data-pick],[data-act],[data-view],[data-node]');
    if (!el) return;
    e.stopPropagation();
    var pick = el.getAttribute('data-pick');
    var act = el.getAttribute('data-act');
    var view = el.getAttribute('data-view');
    var node = el.getAttribute('data-node');
    if (pick) { CC.pickReward(run, pick); commit(); return; }
    if (view) { CC.ui.view = view; CC.render(run); return; }
    if (node) { CC.ui.selected = CC.ui.selected === node ? null : node; CC.render(run); return; }
    if (act === 'new') startNew();
    else if (act === 'kickoff') {
      CC.ui.notice = '';
      if (CC.enterNode(run, CC.ui.selected)) {
        CC.ui.selected = null;
        CC.ui.overlayClosed = false;
        CC.clearReason();
      }
      commit();
    }
    else if (act === 'map') { CC.ui.overlayClosed = false; CC.toMap(run); commit(); }
    else if (act === 'close') { CC.ui.overlayClosed = true; CC.render(run); }
    else if (act === 'close-view') { CC.ui.view = null; CC.render(run); }
  }

  function onEndTurn() {
    if (!run.match) return;
    if (run.match.over) { CC.ui.overlayClosed = false; CC.render(run); return; }
    CC.clearReason();
    CC.endTurn(run.match);
    commit();
  }

  // Two clicks within 3s to abandon a live run. No browser dialogs.
  function onNewTap(e) {
    var btn = e.currentTarget;
    var fresh = !run.path.length && !run.match;
    if (run.result || fresh || Date.now() < confirmNewUntil) {
      confirmNewUntil = 0;
      btn.textContent = 'New run';
      startNew();
      return;
    }
    confirmNewUntil = Date.now() + 3000;
    btn.textContent = 'Click again';
    setTimeout(function () {
      if (Date.now() >= confirmNewUntil) btn.textContent = 'New run';
    }, 3100);
  }

  var NOTICES = {
    old: 'Your save was from an older version and could not be kept. New run started.',
    corrupt: 'Your save could not be read. New run started.'
  };

  function boot() {
    var loaded = CC.load();
    run = loaded.run;
    // A test link always gets a test run; a normal link never continues a test run.
    if (!run || !!run.test !== TEST) {
      run = CC.newRun(CC.newSeed(), TEST);
      CC.ui.notice = NOTICES[loaded.status] || '';
    }
    document.getElementById('hand').addEventListener('click', onHandTap);
    document.getElementById('btn-end').addEventListener('click', onEndTurn);
    document.getElementById('btn-new').addEventListener('click', onNewTap);
    ['overlay', 'viewer', 'piles', 'map', 'map-side', 'btn-deck'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', onUiTap);
    });
    try {
      commit();
    } catch (err) {
      // A save that loads but breaks rendering: drop it rather than show a blank screen.
      run = CC.newRun(CC.newSeed(), TEST);
      CC.ui.notice = NOTICES.corrupt;
      commit();
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})(window.CC);
