const PER_PAGE = 9;

const grid = document.getElementById('grid');
const pagination = document.getElementById('pagination');
const search = document.getElementById('search');
const count = document.getElementById('count');
const empty = document.getElementById('empty');

let filtered = TESTIMONIALS;
let page = 1;

const LINKEDIN_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function avatarHtml(t) {
  const fallback = `<div class="avatar initials">${initials(t.name)}</div>`;
  if (!t.avatar) return fallback;
  // Swap to initials if the LinkedIn image fails to load
  return `<img class="avatar" src="${t.avatar}" alt="${escapeHtml(t.name)}" loading="lazy" referrerpolicy="no-referrer"
    onerror="this.outerHTML='${fallback.replace(/"/g, '&quot;')}'">`;
}

function authorHtml(t) {
  return `
    <div class="author">
      ${avatarHtml(t)}
      <div>
        <a class="author-name" href="${t.profile}" target="_blank" rel="noopener">${escapeHtml(t.name)}</a>
        <div class="author-meta">${formatDate(t.date)}</div>
      </div>
    </div>`;
}

function cardHtml(t, i) {
  return `
    <article class="card" data-index="${i}">
      ${authorHtml(t)}
      <p class="text">${escapeHtml(t.text)}</p>
      <div class="card-footer">
        <button class="toggle" type="button" hidden>Read more</button>
        <a class="source" href="${t.post}" target="_blank" rel="noopener">${LINKEDIN_ICON} View post</a>
      </div>
    </article>`;
}

function render() {
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  page = Math.min(page, pages);
  const items = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  grid.innerHTML = items.map((t, i) => cardHtml(t, i)).join('');
  empty.hidden = filtered.length > 0;
  count.textContent = `${filtered.length} testimonial${filtered.length === 1 ? '' : 's'}`;

  // Only show "Read more" on cards whose text is actually clamped
  grid.querySelectorAll('.card').forEach(card => {
    const text = card.querySelector('.text');
    const toggle = card.querySelector('.toggle');
    if (text.scrollHeight > text.clientHeight + 2) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => openModal(items[card.dataset.index]));
    }
  });

  renderPagination(pages);
}

const modal = document.getElementById('modal');

function openModal(t) {
  document.getElementById('modal-head').innerHTML = authorHtml(t);
  const body = document.getElementById('modal-body');
  body.textContent = t.text;
  body.scrollTop = 0;
  document.getElementById('modal-foot').innerHTML =
    `<a class="source" href="${t.post}" target="_blank" rel="noopener">${LINKEDIN_ICON} View original post on LinkedIn</a>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  document.getElementById('modal-close').focus();
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function renderPagination(pages) {
  pagination.innerHTML = '';
  if (pages <= 1) return;

  const addButton = (label, target, opts = {}) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = label;
    btn.disabled = !!opts.disabled;
    if (opts.active) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }
    btn.addEventListener('click', () => goTo(target));
    pagination.appendChild(btn);
  };

  addButton('&larr; Prev', page - 1, { disabled: page === 1 });
  for (let i = 1; i <= pages; i++) addButton(i, i, { active: i === page });
  addButton('Next &rarr;', page + 1, { disabled: page === pages });
}

function goTo(p) {
  page = p;
  render();
  window.scrollTo({ top: grid.offsetTop - 24, behavior: 'smooth' });
}

search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  filtered = q
    ? TESTIMONIALS.filter(t => t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q))
    : TESTIMONIALS;
  page = 1;
  render();
});

document.getElementById('year').textContent = new Date().getFullYear();
render();
