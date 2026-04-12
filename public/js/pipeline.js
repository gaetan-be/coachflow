// Get coachee ID from URL
var pathParts = window.location.pathname.split('/');
var coacheeId = pathParts[pathParts.length - 1];

// State
var mbtiSelections = { ei: '', sn: '', tf: '', jp: '' };
var riasecOrder = [];

// ── SECTION TOGGLE ──
function toggleSection(header) {
  header.classList.toggle('collapsed');
  var body = header.nextElementSibling;
  body.classList.toggle('collapsed');
}

// ── WORD DIAL ──
function updateDial(key) {
  var input = document.getElementById('words_' + key);
  var display = document.getElementById('dial_' + key);
  display.innerHTML = input.value + '<span>mots</span>';
}

// ── ENNEAGRAMME ──
document.querySelectorAll('#ennea-base .ennea-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#ennea-base .ennea-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

document.querySelectorAll('#sous-type .sous-type-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#sous-type .sous-type-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// ── MBTI ──
document.querySelectorAll('.mbti-option').forEach(function(opt) {
  opt.addEventListener('click', function() {
    var group = opt.dataset.group;
    var val = opt.dataset.val;
    // Deselect others in same group
    document.querySelectorAll('.mbti-option[data-group="' + group + '"]').forEach(function(o) {
      o.classList.remove('active');
    });
    opt.classList.add('active');
    mbtiSelections[group] = val;
    updateMbtiResult();
  });
});

function updateMbtiResult() {
  var result = (mbtiSelections.ei || '_') + ' ' + (mbtiSelections.sn || '_') + ' ' + (mbtiSelections.tf || '_') + ' ' + (mbtiSelections.jp || '_');
  document.getElementById('mbti-result').textContent = result;
}

function getMbtiString() {
  if (mbtiSelections.ei && mbtiSelections.sn && mbtiSelections.tf && mbtiSelections.jp) {
    return mbtiSelections.ei + mbtiSelections.sn + mbtiSelections.tf + mbtiSelections.jp;
  }
  return '';
}

// ── RIASEC ──
document.querySelectorAll('#riasec-row .riasec-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var val = item.dataset.val;
    var idx = riasecOrder.indexOf(val);
    if (idx >= 0) {
      riasecOrder.splice(idx, 1);
      item.classList.remove('active');
    } else if (riasecOrder.length < 3) {
      riasecOrder.push(val);
      item.classList.add('active');
    }
    updateRiasecRanks();
  });
});

function updateRiasecRanks() {
  document.querySelectorAll('#riasec-row .riasec-item').forEach(function(item) {
    var val = item.dataset.val;
    var rank = riasecOrder.indexOf(val);
    var rankEl = item.querySelector('.riasec-rank');
    if (rank >= 0) {
      rankEl.textContent = rank + 1;
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ── COLLECT DATA ──
function collectPipelineData() {
  var enneaBtn = document.querySelector('#ennea-base .ennea-btn.active');
  var sousBtn = document.querySelector('#sous-type .sous-type-btn.active');

  return {
    prenom: document.getElementById('prenom').value.trim(),
    nom: document.getElementById('nom').value.trim(),
    date_naissance: document.getElementById('date_naissance').value,
    ecole_nom: document.getElementById('ecole_nom').value.trim(),
    code_postal: document.getElementById('code_postal').value.trim(),
    date_seance: document.getElementById('date_seance').value || null,
    choix: document.getElementById('choix').value.trim(),
    loisirs: document.getElementById('loisirs').value.trim(),
    ennea_base: enneaBtn ? parseInt(enneaBtn.dataset.val) : null,
    ennea_sous_type: sousBtn ? sousBtn.dataset.val : null,
    mbti: getMbtiString() || null,
    riasec: riasecOrder.length > 0 ? riasecOrder.join(',') : null,
    words_ennea: parseInt(document.getElementById('words_ennea').value),
    words_mbti: parseInt(document.getElementById('words_mbti').value),
    words_riasec: parseInt(document.getElementById('words_riasec').value),
    notes_coach: document.getElementById('notes_coach').value.trim()
  };
}

// ── SAVE ──
function saveCoachee() {
  var data = collectPipelineData();
  fetch('/api/coachee/' + coacheeId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Erreur de sauvegarde');
    var el = document.getElementById('save-status');
    el.classList.add('visible');
    setTimeout(function() { el.classList.remove('visible'); }, 2000);
  })
  .catch(function(err) { alert(err.message); });
}

// ── MAKE REPORT ──
function makeReport() {
  var btn = document.getElementById('btn-report');
  btn.disabled = true;
  btn.textContent = 'En cours...';

  // Save first, then queue report
  var data = collectPipelineData();
  fetch('/api/coachee/' + coacheeId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function() {
    return fetch('/api/coachee/' + coacheeId + '/report', { method: 'POST' });
  })
  .then(function(r) {
    if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Erreur'); });
    return r.json();
  })
  .then(function() {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge queued" style="margin-top:8px;display:inline-block;">En attente de g&eacute;n&eacute;ration...</span>';
    pollReportStatus();
  })
  .catch(function(err) {
    btn.disabled = false;
    btn.textContent = 'Créer le rapport';
    alert(err.message);
  });
}

// ── POLL REPORT STATUS ──
function pollReportStatus() {
  var interval = setInterval(function() {
    fetch('/api/coachee/' + coacheeId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.report_status === 'done') {
          clearInterval(interval);
          var btn = document.getElementById('btn-report');
          btn.disabled = false;
          btn.textContent = 'Créer le rapport';
          document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge done" style="margin-top:8px;display:inline-block;">Rapport g&eacute;n&eacute;r&eacute; !</span>';
          document.getElementById('download-link-wrapper').innerHTML = '<br><a href="/api/coachee/' + coacheeId + '/report/download" class="btn-download">T&eacute;l&eacute;charger le rapport</a>';
        } else if (data.report_status === 'error') {
          clearInterval(interval);
          var btn2 = document.getElementById('btn-report');
          btn2.disabled = false;
          btn2.textContent = 'Créer le rapport';
          document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge error" style="margin-top:8px;display:inline-block;">Erreur lors de la g&eacute;n&eacute;ration</span>';
        }
      });
  }, 3000);
}

// ── LOAD DATA ──
function populateForm(data) {
  document.getElementById('prenom').value = data.prenom || '';
  document.getElementById('nom').value = data.nom || '';
  document.getElementById('date_naissance').value = data.date_naissance ? data.date_naissance.slice(0, 10) : '';
  document.getElementById('ecole_nom').value = data.ecole_nom || '';
  document.getElementById('code_postal').value = data.code_postal || '';
  document.getElementById('date_seance').value = data.date_seance ? data.date_seance.slice(0, 10) : '';
  document.getElementById('choix').value = data.choix || '';
  document.getElementById('loisirs').value = data.loisirs || '';
  document.getElementById('notes_coach').value = data.notes_coach || '';

  // Enneagramme
  if (data.ennea_base) {
    var enneaBtn = document.querySelector('#ennea-base .ennea-btn[data-val="' + data.ennea_base + '"]');
    if (enneaBtn) enneaBtn.classList.add('active');
  }
  if (data.ennea_sous_type) {
    var sousBtn = document.querySelector('#sous-type .sous-type-btn[data-val="' + data.ennea_sous_type + '"]');
    if (sousBtn) sousBtn.classList.add('active');
  }

  // MBTI
  if (data.mbti && data.mbti.length === 4) {
    var groups = ['ei', 'sn', 'tf', 'jp'];
    for (var i = 0; i < 4; i++) {
      var letter = data.mbti[i];
      var opt = document.querySelector('.mbti-option[data-group="' + groups[i] + '"][data-val="' + letter + '"]');
      if (opt) {
        opt.classList.add('active');
        mbtiSelections[groups[i]] = letter;
      }
    }
    updateMbtiResult();
  }

  // RIASEC
  if (data.riasec) {
    riasecOrder = data.riasec.split(',').filter(Boolean);
    updateRiasecRanks();
  }

  // Word dials
  if (data.words_ennea) {
    document.getElementById('words_ennea').value = data.words_ennea;
    updateDial('ennea');
  }
  if (data.words_mbti) {
    document.getElementById('words_mbti').value = data.words_mbti;
    updateDial('mbti');
  }
  if (data.words_riasec) {
    document.getElementById('words_riasec').value = data.words_riasec;
    updateDial('riasec');
  }

  // Report status
  if (data.report_status === 'done') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge done" style="margin-top:8px;display:inline-block;">Rapport disponible</span>';
    document.getElementById('download-link-wrapper').innerHTML = '<br><a href="/api/coachee/' + coacheeId + '/report/download" class="btn-download">T&eacute;l&eacute;charger le rapport</a>';
  } else if (data.report_status === 'queued' || data.report_status === 'processing') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge queued" style="margin-top:8px;display:inline-block;">En cours de g&eacute;n&eacute;ration...</span>';
    document.getElementById('btn-report').disabled = true;
    pollReportStatus();
  } else if (data.report_status === 'error') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge error" style="margin-top:8px;display:inline-block;">Erreur lors de la derni&egrave;re g&eacute;n&eacute;ration</span>';
  }
}

function logout() {
  fetch('/api/logout', { method: 'POST' }).then(function() {
    window.location.href = '/login';
  });
}

// Load on page load
fetch('/api/coachee/' + coacheeId)
  .then(function(r) {
    if (!r.ok) throw new Error('Coachee non trouvé');
    return r.json();
  })
  .then(populateForm)
  .catch(function(err) {
    alert(err.message);
    window.location.href = '/backoffice';
  });
