const TARGET = new Date('2026-08-17T00:00:00').getTime();

const pad = n => String(n).padStart(2, '0');

function flip(el, val) {
  if (el.textContent !== val) {
    el.classList.add('flip');
    el.textContent = val;
    setTimeout(() => el.classList.remove('flip'), 150);
  }
}

function tick() {
  const now  = Date.now();
  const diff = TARGET - now;

  if (diff <= 0) {
    document.getElementById('days').textContent    = '00';
    document.getElementById('hours').textContent   = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';
    return;
  }

  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5)  / 6e4);
  const s = Math.floor((diff % 6e4)   / 1e3);

  flip(document.getElementById('days'),    pad(d));
  flip(document.getElementById('hours'),   pad(h));
  flip(document.getElementById('minutes'), pad(m));
  flip(document.getElementById('seconds'), pad(s));
}

tick();
setInterval(tick, 1000);

function handleSubmit() {
  const input = document.getElementById('emailInput');
  const msg   = document.getElementById('successMsg');
  const email = input.value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    input.style.borderColor = '#f43f5e';
    setTimeout(() => (input.style.borderColor = ''), 1500);
    return;
  }

  input.style.display = 'none';
  document.querySelector('.notify-btn').style.display = 'none';
  msg.style.display = 'block';
}
