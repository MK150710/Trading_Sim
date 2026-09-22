const $ = id => document.getElementById(id);
const root = document.documentElement;
try { root.dataset.theme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
const label = () => $('theme').textContent = root.dataset.theme === 'light' ? 'Dark theme' : 'Light theme';
$('theme').onclick = () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    label();
};
label();
let price = 187.42, cash = 100000, shares = 0;
const money = n => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const render = () => {
    $('price').textContent = price.toFixed(2);
    $('cash').textContent = money(cash);
    $('shares').textContent = shares;
};
$('buy').onclick = () => { if (cash >= price) { cash -= price; shares++; render(); } };
$('sell').onclick = () => { if (shares) { cash += price; shares--; render(); } };
setInterval(() => { price = Math.max(1, price + (Math.random() - 0.5) * 0.8); render(); }, 1200);
render();