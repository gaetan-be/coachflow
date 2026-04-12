// State
let currentStep = 1;
const totalSteps = 3;

// Navigation
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;

  document.getElementById('step-' + currentStep).classList.remove('active');
  document.getElementById('step-' + n).classList.add('active');
  currentStep = n;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  for (let i = 1; i <= totalSteps; i++) {
    const el = document.getElementById('prog-' + i);
    el.classList.remove('active', 'done');
    if (i < currentStep) el.classList.add('done');
    else if (i === currentStep) el.classList.add('active');
  }
}

// Validation
function validateStep(step) {
  let valid = true;
  const container = document.getElementById('step-' + step);
  const required = container.querySelectorAll('[required]');

  required.forEach(function (input) {
    const group = input.closest('.field-group');
    if (!input.value.trim()) {
      group.classList.add('field-error');
      valid = false;
    } else {
      group.classList.remove('field-error');
    }
  });

  return valid;
}

// Remove error on input
document.querySelectorAll('input, textarea').forEach(function (el) {
  el.addEventListener('input', function () {
    el.closest('.field-group').classList.remove('field-error');
  });
});

// Collect data
function collectData() {
  var bday = document.getElementById('q_anniversaire').value;
  var age = '';
  if (bday) {
    var bd = new Date(bday);
    var today = new Date();
    age = today.getFullYear() - bd.getFullYear();
    var m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  }

  return {
    prenom: document.getElementById('q_prenom').value.trim(),
    nom: document.getElementById('q_nom').value.trim(),
    date_naissance: bday,
    ecole_nom: document.getElementById('q_ecole').value.trim(),
    annee_scolaire: document.getElementById('q_annee').value.trim(),
    orientation_actuelle: document.getElementById('q_orientation').value.trim(),
    loisirs: document.getElementById('q_loisirs').value.trim(),
    choix: document.getElementById('q_choix').value.trim(),
  };
}

// Submit
function submitForm() {
  if (!validateStep(3)) return;

  var btn = document.querySelector('.btn-submit');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  var data = collectData();

  fetch('/api/questionnaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (j) { throw new Error(j.error || 'Erreur'); });
      return res.json();
    })
    .then(function () {
      document.getElementById('success-name').textContent = data.prenom;
      document.getElementById('step-' + currentStep).style.display = 'none';
      document.querySelector('.progress-bar').style.display = 'none';
      document.getElementById('success').style.display = 'block';
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Envoyer mes réponses';
      alert(err.message);
    });
}

// Auto-save draft
function saveDraft() {
  try {
    var draft = {};
    document.querySelectorAll('input, textarea').forEach(function (el) {
      if (el.id) draft[el.id] = el.value;
    });
    draft._step = currentStep;
    localStorage.setItem('brenso_questionnaire_draft', JSON.stringify(draft));
  } catch (e) {}
}

function restoreDraft() {
  try {
    var raw = localStorage.getItem('brenso_questionnaire_draft');
    if (!raw) return;
    var draft = JSON.parse(raw);
    var hasData = false;
    document.querySelectorAll('input, textarea').forEach(function (el) {
      if (el.id && draft[el.id]) {
        el.value = draft[el.id];
        hasData = true;
      }
    });
    if (hasData && draft._step) goStep(draft._step);
  } catch (e) {}
}

document.querySelectorAll('input, textarea').forEach(function (el) {
  el.addEventListener('input', saveDraft);
});

restoreDraft();
