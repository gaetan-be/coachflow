// Get coachee ID from URL
var pathParts = window.location.pathname.split('/');
var coacheeId = pathParts[pathParts.length - 1];

// State
var mbtiSelections = { ei: '', sn: '', tf: '', jp: '' };
var riasecOrder = [];
var enneaOrder = [];
var tagData = { valeurs: [], competences: [], besoins: [] };
var metierCount = 0;

// ── SECTION TOGGLE ──
function toggleSection(header) {
  var body = header.nextElementSibling;
  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    body.style.maxHeight = 'none';
    body.style.opacity = '1';
    body.style.padding = '24px';
    header.classList.remove('collapsed');
  } else {
    body.style.maxHeight = '0px';
    body.style.opacity = '0';
    body.style.padding = '0 24px';
    body.classList.add('collapsed');
    header.classList.add('collapsed');
  }
}

function toggleAll() {
  var btn = document.getElementById('toggle-all-btn');
  var shouldCollapse = btn && btn.innerHTML.indexOf('replier') !== -1;
  var sections = document.querySelectorAll('.form-wrapper .section');
  sections.forEach(function(s, i) {
    if (i === 0) return;
    var header = s.querySelector('.section-header');
    var body = s.querySelector('.section-body');
    if (shouldCollapse) {
      body.style.maxHeight = '0px';
      body.style.opacity = '0';
      body.style.padding = '0 24px';
      body.classList.add('collapsed');
      header.classList.add('collapsed');
    } else {
      body.classList.remove('collapsed');
      body.style.maxHeight = 'none';
      body.style.opacity = '1';
      body.style.padding = '24px';
      header.classList.remove('collapsed');
    }
  });
  if (btn) {
    btn.innerHTML = shouldCollapse ? '&#9660; Tout d&eacute;plier' : '&#9650; Tout replier';
  }
}

function updateToggleAllBtn() {
  var btn = document.getElementById('toggle-all-btn');
  if (!btn) return;
  var sections = document.querySelectorAll('.form-wrapper .section');
  var allOpen = Array.from(sections).every(function(s, i) {
    if (i === 0) return true;
    return !s.querySelector('.section-body').classList.contains('collapsed');
  });
  btn.innerHTML = allOpen ? '&#9650; Tout replier' : '&#9660; Tout d&eacute;plier';
}

// ── WORD DIAL ──
function updateDial(key) {
  var input = document.getElementById('words_' + key);
  var display = document.getElementById('dial_' + key);
  display.innerHTML = input.value + '<span>mots</span>';
}

// ══════════════════════════════════════════════
// ── ENNEAGRAMME — Multi-selection (max 3) ──
// ══════════════════════════════════════════════
document.querySelectorAll('#ennea-base .ennea-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var val = btn.dataset.val;
    var idx = enneaOrder.indexOf(val);

    if (idx >= 0) {
      enneaOrder.splice(idx, 1);
    } else {
      if (enneaOrder.length >= 3) return;
      enneaOrder.push(val);
    }

    updateEnneaRanks();
  });
});

function updateEnneaRanks() {
  document.querySelectorAll('#ennea-base .ennea-btn').forEach(function(b) {
    b.classList.remove('ennea-rank-1', 'ennea-rank-2', 'ennea-rank-3');
    var rank = enneaOrder.indexOf(b.dataset.val);
    if (rank >= 0) {
      b.classList.add('ennea-rank-' + (rank + 1));
      b.querySelector('.ennea-badge').textContent = rank + 1;
    }
  });
}

// ── SOUS-TYPE ──
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

// ══════════════════════════════════════════════
// ── TAG INPUT SYSTEM (Valeurs, Competences, Besoins) ──
// ══════════════════════════════════════════════
var tagConfig = {
  valeurs:     { containerId: 'valeurs-tags',     inputId: 'valeur-input',     cssClass: 'green-tag' },
  competences: { containerId: 'competences-tags',  inputId: 'competence-input', cssClass: 'teal-tag' },
  besoins:     { containerId: 'besoins-tags',      inputId: 'besoin-input',     cssClass: 'warm-tag' }
};

function addTag(type) {
  var cfg = tagConfig[type];
  var input = document.getElementById(cfg.inputId);
  var val = input.value.trim();
  if (!val) return;
  if (tagData[type].indexOf(val) >= 0) { input.value = ''; return; }

  tagData[type].push(val);
  input.value = '';
  renderTags(type);
  input.focus();
}

function removeTag(type, idx) {
  tagData[type].splice(idx, 1);
  renderTags(type);
}

function renderTags(type) {
  var cfg = tagConfig[type];
  var container = document.getElementById(cfg.containerId);
  container.innerHTML = tagData[type].map(function(t, i) {
    return '<span class="tag-chip ' + cfg.cssClass + '" onclick="removeTag(\'' + type + '\',' + i + ')">' + t + '<span class="tag-x">&times;</span></span>';
  }).join('');
}

// Enter key support for tag inputs
['valeur-input', 'competence-input', 'besoin-input'].forEach(function(id) {
  document.getElementById(id).addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var type = id === 'valeur-input' ? 'valeurs' : id === 'competence-input' ? 'competences' : 'besoins';
      addTag(type);
    }
  });
});

// ══════════════════════════════════════════════
// ── METIER BLOCKS (Section 07) ──
// ══════════════════════════════════════════════
function addMetierBlock() {
  metierCount++;
  var container = document.getElementById('metiers-container');
  var block = document.createElement('div');
  block.className = 'metier-block';
  block.innerHTML =
    '<div class="metier-block-header">' +
      '<div class="metier-number">' + (container.children.length + 1) + '</div>' +
      '<label style="flex:1;margin:0;font-size:11px;">Piste m\u00e9tier</label>' +
      '<button class="metier-remove" onclick="removeMetierBlock(this)">&times;</button>' +
    '</div>' +
    '<div class="metier-fields">' +
      '<div class="field-group">' +
        '<label>Nom du m\u00e9tier</label>' +
        '<input type="text" class="metier-nom" placeholder="ex. Game Designer, UX Designer...">' +
      '</div>' +
      '<div class="field-group">' +
        '<label>Mots-cl\u00e9s / pourquoi \u00e7a matche</label>' +
        '<textarea class="multi metier-motscles" placeholder="R\u00e9solution de probl\u00e8mes complexes, cr\u00e9ativit\u00e9 appliqu\u00e9e..."></textarea>' +
      '</div>' +
      '<div class="field-group">' +
        '<label>Formations / \u00c9coles</label>' +
        '<div class="formations-list"></div>' +
        '<button class="btn-add-formation" onclick="addFormationRow(this)">+ Ajouter une formation</button>' +
      '</div>' +
    '</div>';
  container.appendChild(block);
  addFormationRow(block.querySelector('.btn-add-formation'));
  renumberMetiers();
}

function removeMetierBlock(btn) {
  btn.closest('.metier-block').remove();
  renumberMetiers();
}

function renumberMetiers() {
  document.querySelectorAll('.metier-block').forEach(function(block, i) {
    block.querySelector('.metier-number').textContent = i + 1;
  });
}

function addFormationRow(btn) {
  var list = btn.previousElementSibling;
  var row = document.createElement('div');
  row.className = 'formation-row';
  row.innerHTML =
    '<input type="text" class="formation-ecole" placeholder="Nom de l\'\u00e9cole / universit\u00e9">' +
    '<input type="text" class="formation-ville" placeholder="Ville" style="max-width:140px;">' +
    '<button class="formation-remove" onclick="this.parentElement.remove()">&times;</button>';
  list.appendChild(row);
}

function collectMetiers() {
  var metiers = [];
  document.querySelectorAll('.metier-block').forEach(function(block) {
    var formations = [];
    block.querySelectorAll('.formation-row').forEach(function(row) {
      var ecole = row.querySelector('.formation-ecole').value.trim();
      var ville = row.querySelector('.formation-ville').value.trim();
      if (ecole) formations.push({ ecole: ecole, ville: ville });
    });
    var nom = block.querySelector('.metier-nom').value.trim();
    if (nom) {
      metiers.push({
        nom: nom,
        motscles: block.querySelector('.metier-motscles').value.trim(),
        formations: formations
      });
    }
  });
  return metiers.length > 0 ? metiers : null;
}

function populateMetiers(data) {
  if (!data || !Array.isArray(data)) return;
  data.forEach(function(m) {
    addMetierBlock();
    var blocks = document.querySelectorAll('.metier-block');
    var block = blocks[blocks.length - 1];
    block.querySelector('.metier-nom').value = m.nom || '';
    block.querySelector('.metier-motscles').value = m.motscles || '';
    // Remove the auto-added first formation row before populating
    var firstRow = block.querySelector('.formation-row');
    if (firstRow) firstRow.remove();
    if (m.formations && m.formations.length > 0) {
      m.formations.forEach(function(f) {
        var addBtn = block.querySelector('.btn-add-formation');
        addFormationRow(addBtn);
        var rows = block.querySelectorAll('.formation-row');
        var row = rows[rows.length - 1];
        row.querySelector('.formation-ecole').value = f.ecole || '';
        row.querySelector('.formation-ville').value = f.ville || '';
      });
    }
  });
}

// ══════════════════════════════════════════════
// ── COLLECT DATA ──
// ══════════════════════════════════════════════
function collectPipelineData() {
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
    ennea_base: enneaOrder.length > 0 ? enneaOrder.join(',') : null,
    ennea_sous_type: sousBtn ? sousBtn.dataset.val : null,
    mbti: getMbtiString() || null,
    riasec: riasecOrder.length > 0 ? riasecOrder.join(',') : null,
    words_ennea: parseInt(document.getElementById('words_ennea').value),
    words_mbti: parseInt(document.getElementById('words_mbti').value),
    words_riasec: parseInt(document.getElementById('words_riasec').value),
    valeurs: tagData.valeurs.length > 0 ? tagData.valeurs.join(',') : null,
    competences: tagData.competences.length > 0 ? tagData.competences.join(',') : null,
    besoins: tagData.besoins.length > 0 ? tagData.besoins.join(',') : null,
    words_comp_besoins: parseInt(document.getElementById('words_comp_besoins').value),
    metiers: collectMetiers(),
    words_metiers: parseInt(document.getElementById('words_metiers').value),
    plan_action: document.getElementById('plan_action').value.trim() || null,
    words_plan_action: parseInt(document.getElementById('words_plan_action').value),
    notes_coach: document.getElementById('notes_coach').value.trim()
  };
}

// ── SAVE ──
function saveCoachee() {
  var btn = document.querySelector('.btn-save');
  var statusEl = document.getElementById('save-status');
  var originalLabel = btn ? btn.innerHTML : '';

  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  var data = collectPipelineData();
  fetch('/api/coachee/' + coacheeId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Erreur de sauvegarde');
    if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
    if (statusEl) {
      statusEl.textContent = 'Sauvegard\u00e9 \u2713';
      statusEl.classList.add('visible');
      setTimeout(function() {
        statusEl.classList.remove('visible');
        setTimeout(function() { statusEl.textContent = ''; }, 300);
      }, 2000);
    }
  })
  .catch(function(err) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
    alert(err.message);
  });
}

// ── MAKE REPORT ──
function makeReport() {
  var btn = document.getElementById('btn-report');
  var saveBtn = document.querySelector('.btn-save');
  var originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Sauvegarde...';
  if (saveBtn) saveBtn.disabled = true;

  var data = collectPipelineData();
  fetch('/api/coachee/' + coacheeId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Erreur de sauvegarde');
    btn.textContent = 'G\u00e9n\u00e9ration...';
    return fetch('/api/coachee/' + coacheeId + '/report', { method: 'POST' });
  })
  .then(function(r) {
    if (!r.ok) return r.json().then(function(j) { throw new Error(j.error || 'Erreur'); });
    return r.json();
  })
  .then(function() {
    if (saveBtn) saveBtn.disabled = false;
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge queued" style="margin-top:8px;display:inline-block;">En attente de g\u00e9n\u00e9ration...</span>';
    pollReportStatus();
  })
  .catch(function(err) {
    btn.disabled = false;
    btn.innerHTML = originalLabel;
    if (saveBtn) saveBtn.disabled = false;
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
          btn.textContent = 'Cr\u00e9er le rapport';
          document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge done" style="margin-top:8px;display:inline-block;">Rapport g\u00e9n\u00e9r\u00e9 !</span>';
          document.getElementById('download-link-wrapper').innerHTML = '<br><a href="/api/coachee/' + coacheeId + '/report/download" class="btn-download">T\u00e9l\u00e9charger le rapport</a>';
        } else if (data.report_status === 'error') {
          clearInterval(interval);
          var btn2 = document.getElementById('btn-report');
          btn2.disabled = false;
          btn2.textContent = 'Cr\u00e9er le rapport';
          document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge error" style="margin-top:8px;display:inline-block;">Erreur lors de la g\u00e9n\u00e9ration</span>';
        }
      });
  }, 3000);
}

// ── LOAD DATA ──
function populateForm(data) {
  document.getElementById('prenom').value = data.prenom || '';
  var headerPrenom = document.getElementById('header-prenom');
  if (headerPrenom) headerPrenom.textContent = data.prenom || '...';
  document.getElementById('nom').value = data.nom || '';
  document.getElementById('date_naissance').value = data.date_naissance ? data.date_naissance.slice(0, 10) : '';
  document.getElementById('ecole_nom').value = data.ecole_nom || '';
  document.getElementById('code_postal').value = data.code_postal || '';
  document.getElementById('date_seance').value = data.date_seance ? data.date_seance.slice(0, 10) : '';
  document.getElementById('choix').value = data.choix || '';
  document.getElementById('loisirs').value = data.loisirs || '';
  document.getElementById('notes_coach').value = data.notes_coach || '';

  // Enneagramme (multi-select)
  if (data.ennea_base) {
    enneaOrder = String(data.ennea_base).split(',').filter(Boolean);
    updateEnneaRanks();
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

  // Tags
  if (data.valeurs) {
    tagData.valeurs = data.valeurs.split(',').filter(Boolean);
    renderTags('valeurs');
  }
  if (data.competences) {
    tagData.competences = data.competences.split(',').filter(Boolean);
    renderTags('competences');
  }
  if (data.besoins) {
    tagData.besoins = data.besoins.split(',').filter(Boolean);
    renderTags('besoins');
  }

  // Metiers
  if (data.metiers) {
    populateMetiers(data.metiers);
  }

  // Plan d'action
  document.getElementById('plan_action').value = data.plan_action || '';

  // Word dials
  var dials = [
    { key: 'ennea', field: 'words_ennea' },
    { key: 'mbti', field: 'words_mbti' },
    { key: 'riasec', field: 'words_riasec' },
    { key: 'comp_besoins', field: 'words_comp_besoins' },
    { key: 'metiers', field: 'words_metiers' },
    { key: 'plan_action', field: 'words_plan_action' }
  ];
  dials.forEach(function(d) {
    if (data[d.field]) {
      var val = Math.min(data[d.field], 350);
      document.getElementById('words_' + d.key).value = val;
      updateDial(d.key);
    }
  });

  // Report status
  if (data.report_status === 'done') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge done" style="margin-top:8px;display:inline-block;">Rapport disponible</span>';
    document.getElementById('download-link-wrapper').innerHTML = '<br><a href="/api/coachee/' + coacheeId + '/report/download" class="btn-download">T\u00e9l\u00e9charger le rapport</a>';
  } else if (data.report_status === 'queued' || data.report_status === 'processing') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge queued" style="margin-top:8px;display:inline-block;">En cours de g\u00e9n\u00e9ration...</span>';
    document.getElementById('btn-report').disabled = true;
    pollReportStatus();
  } else if (data.report_status === 'error') {
    document.getElementById('report-status-text').innerHTML = '<br><span class="status-badge error" style="margin-top:8px;display:inline-block;">Erreur lors de la derni\u00e8re g\u00e9n\u00e9ration</span>';
  }
}

function logout() {
  fetch('/api/logout', { method: 'POST' }).then(function() {
    window.location.href = '/coach';
  });
}

// ── DYNAMIC HEADER PRENOM ──
document.addEventListener('DOMContentLoaded', function() {
  var prenomInput = document.getElementById('prenom');
  var headerPrenom = document.getElementById('header-prenom');
  if (prenomInput && headerPrenom) {
    prenomInput.addEventListener('input', function() {
      headerPrenom.textContent = prenomInput.value.trim() || '...';
    });
  }

  // Collapse sections 2–9 on load
  var sections = document.querySelectorAll('.form-wrapper .section');
  sections.forEach(function(s, i) {
    if (i === 0) return;
    var header = s.querySelector('.section-header');
    var body = s.querySelector('.section-body');
    if (body && header) {
      body.style.maxHeight = '0px';
      body.style.opacity = '0';
      body.style.padding = '0 24px';
      body.classList.add('collapsed');
      header.classList.add('collapsed');
    }
  });
  updateToggleAllBtn();
});

// Load on page load
fetch('/api/coachee/' + coacheeId)
  .then(function(r) {
    if (!r.ok) throw new Error('Coachee non trouv\u00e9');
    return r.json();
  })
  .then(populateForm)
  .catch(function(err) {
    alert(err.message);
    window.location.href = '/backoffice';
  });
