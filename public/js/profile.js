'use strict';

// ── Shared header dropdown ──────────────────────────────────────────────────

function logout() {
  fetch('/api/logout', { method: 'POST' }).then(function() {
    window.location.href = '/coach';
  });
}

function toggleProfileMenu() {
  var pop = document.getElementById('profile-popover');
  if (pop) pop.hidden = !pop.hidden;
}

document.addEventListener('click', function(e) {
  var menu = document.getElementById('profile-menu');
  if (menu && !menu.contains(e.target)) {
    var pop = document.getElementById('profile-popover');
    if (pop) pop.hidden = true;
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(s) {
  var map = {
    queued:     '<span class="status-badge queued">En attente</span>',
    processing: '<span class="status-badge processing">En cours</span>',
    done:       '<span class="status-badge done">Pr\u00eat</span>',
    error:      '<span class="status-badge error">Erreur</span>'
  };
  return map[s] || '<span class="status-badge new">' + s + '</span>';
}

function toggleSection(header) {
  var body = header.nextElementSibling;
  var collapsed = body.classList.toggle('collapsed');
  header.classList.toggle('collapsed', collapsed);
}

// ── Load header dropdown ───────────────────────────────────────────────────

fetch('/api/coach/me')
  .then(function(r) { return r.json(); })
  .then(function(d) {
    var initial = d.name ? d.name.charAt(0).toUpperCase() : 'C';
    var btn = document.getElementById('profile-avatar-btn');
    if (btn) btn.textContent = initial;

    var nameEl = document.getElementById('popover-name');
    if (nameEl) nameEl.textContent = d.name || '';

    var planEl = document.getElementById('popover-plan');
    if (planEl) {
      if (d.plan_display_name) {
        planEl.textContent = d.plan_display_name;
        planEl.style.display = '';
      } else {
        planEl.style.display = 'none';
      }
    }

    var creditsEl = document.getElementById('popover-credits');
    if (creditsEl) {
      if (d.plan) {
        var total = d.allocations.reduce(function(s, a) { return s + a.amount; }, 0);
        var used  = d.allocations.reduce(function(s, a) { return s + a.used; }, 0);
        var pct   = total > 0 ? Math.round((used / total) * 100) : 0;
        var fill  = document.getElementById('credit-bar-fill');
        if (fill) fill.style.width = pct + '%';
        var lbl = document.getElementById('credit-label');
        if (lbl) lbl.textContent = d.balance + ' cr\u00e9dit' + (d.balance !== 1 ? 's' : '') + ' restant' + (d.balance !== 1 ? 's' : '');
        creditsEl.style.display = '';
      } else {
        creditsEl.style.display = 'none';
      }
    }
  });

// ── Password change ────────────────────────────────────────────────────────

function changePassword() {
  var current = document.getElementById('current-password').value.trim();
  var next    = document.getElementById('new-password').value.trim();
  var fb      = document.getElementById('pw-feedback');

  fb.textContent = '';
  fb.className = 'profile-feedback';

  if (!current || !next) {
    fb.textContent = 'Veuillez remplir les deux champs.';
    fb.classList.add('feedback-error');
    return;
  }
  if (next.length < 8) {
    fb.textContent = 'Le nouveau mot de passe doit contenir au moins 8 caract\u00e8res.';
    fb.classList.add('feedback-error');
    return;
  }

  fetch('/api/coach/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: current, new_password: next })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (!res.ok) {
      fb.textContent = res.data.error || 'Une erreur est survenue.';
      fb.classList.add('feedback-error');
    } else {
      fb.textContent = 'Mot de passe mis \u00e0 jour avec succ\u00e8s.';
      fb.classList.add('feedback-ok');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
    }
  })
  .catch(function() {
    fb.textContent = 'Erreur de connexion.';
    fb.classList.add('feedback-error');
  });
}

// ── Report history ─────────────────────────────────────────────────────────

fetch('/api/coach/reports')
  .then(function(r) { return r.json(); })
  .then(function(reports) {
    var el = document.getElementById('reports-list');
    if (!reports.length) {
      el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Aucun rapport g\u00e9n\u00e9r\u00e9 pour le moment.</p>';
      return;
    }

    var html = '<table class="coachee-table"><thead><tr>'
      + '<th>Coach\u00e9e</th><th>Date</th><th>Statut</th><th></th>'
      + '</tr></thead><tbody>';

    reports.forEach(function(r) {
      var dl = r.status === 'done'
        ? '<a class="btn-report-download" href="/api/coachee/' + r.coachee_id + '/report/download" title="T\u00e9l\u00e9charger">'
          + '<img src="/img/word.svg" width="16" height="16" alt=""> Rapport</a>'
        : (r.status === 'error' && r.error_message
            ? '<span style="font-size:11px;color:var(--pop);" title="' + r.error_message.replace(/"/g, '&quot;') + '">&#9888; d\u00e9tail</span>'
            : '');

      html += '<tr>'
        + '<td><a href="/backoffice/coachee/' + r.coachee_id + '" style="color:var(--text);text-decoration:none;font-weight:500;">'
        + r.prenom + ' ' + r.nom + '</a></td>'
        + '<td>' + formatDate(r.created_at) + '</td>'
        + '<td>' + statusLabel(r.status) + '</td>'
        + '<td>' + dl + '</td>'
        + '</tr>';
    });

    html += '</tbody></table>';
    el.innerHTML = html;
  });

// ── Credits breakdown ──────────────────────────────────────────────────────

fetch('/api/coach/me')
  .then(function(r) { return r.json(); })
  .then(function(d) {
    var el = document.getElementById('credits-list');

    if (!d.plan) {
      el.innerHTML = '<div class="credit-card credit-card-unlimited">'
        + '<div class="credit-card-header">'
        + '<span class="credit-card-source">Acc\u00e8s illimit\u00e9</span>'
        + '</div>'
        + '<p style="font-size:12px;color:var(--muted);margin-top:8px;">Ce compte n\'est pas soumis aux cr\u00e9dits.</p>'
        + '</div>';
      return;
    }

    if (!d.allocations.length) {
      el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Aucune allocation de cr\u00e9dits.</p>';
      return;
    }

    var html = '';
    d.allocations.forEach(function(a) {
      var pct  = a.amount > 0 ? Math.round((a.used / a.amount) * 100) : 0;
      var bal  = a.amount - a.used;
      var srcLabel = {
        subscription: 'Abonnement',
        promo:        'Promotion',
        manual:       'Attribution manuelle',
        purchase:     'Achat'
      }[a.source] || a.source;

      html += '<div class="credit-card">'
        + '<div class="credit-card-header">'
        + '<span class="credit-card-source">' + srcLabel + (a.note ? ' \u2014 ' + a.note : '') + '</span>'
        + (a.valid_until
            ? '<span class="credit-card-expiry">expire le ' + formatDate(a.valid_until) + '</span>'
            : '<span class="credit-card-expiry credit-expiry-never">sans expiration</span>')
        + '</div>'
        + '<div class="credit-card-bar-row">'
        + '<div class="credit-bar-wrap credit-bar-wide">'
        + '<div class="credit-bar-fill" style="width:' + pct + '%"></div>'
        + '</div>'
        + '<span class="credit-bar-count">' + bal + ' / ' + a.amount + ' restant' + (bal !== 1 ? 's' : '') + '</span>'
        + '</div>'
        + '</div>';
    });

    el.innerHTML = html;
  });
