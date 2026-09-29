const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STOCKS = [
    "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AMD","AVGO","TSM",
    "QCOM","MU","INTC","ARM","ASML","AMAT","LRCX","KLAC","ADI","TXN",
    "PLTR","CRM","ORCL","ADBE","NOW","SNOW","CRWD","PANW","NET","DDOG",
    "MDB","SHOP","UBER","JPM","BAC","WFC","GS","MS","BLK","V","MA",
    "LLY","JNJ","UNH","ABBV","MRK","PFE","COST","WMT","HD","MCD",
    "NKE","SBUX","DIS","NFLX","KO","PEP","CAT","GE","RTX","LMT",
    "HON","BA","XOM","CVX","COP","TMUS","VZ","T","F","GM","GME",
    "AMC","COIN","HOOD","MSTR","SMCI","SPY","QQQ","DIA","VOO","VTI",
    "IWM","ARKK","XLK","XLF","XLE","GOOG","SNAP","PINS","SPOT","DKNG",
    "RBLX","CRSP","IONQ","RKLB","SOFI","CAVA","HIMS","TTD","TEAM","TWLO",
    "LULU","MELI","HPE","DELL","OKLO","SMR","KHC"
];

const root = document.documentElement;
const themeButton = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

root.dataset.theme = localStorage.getItem("tradesims-theme") || "dark";

themeButton.onclick = () => {
    const light = root.dataset.theme === "light";
    root.dataset.theme = light ? "dark" : "light";
    localStorage.setItem("tradesims-theme", root.dataset.theme);
    themeIcon.textContent = light ? "☀" : "☾";
};

themeIcon.textContent = root.dataset.theme === "light" ? "☾" : "☀";

const get = async url => {
    const r = await fetch(url);
    if (!r.ok) throw Error(r.status);
    return r.json();
};

const money = n => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD"
}).format(n);

const pct = n => `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
const date = d => new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric"
});

const cls = n => n >= 0 ? "up" : "down";

function logo(symbol) {
    return `<div class="stock-logo">${symbol.slice(0,2)}</div>`;
}

function change(n) {
    return `<span class="${cls(n)}">${pct(n)}</span>`;
}

async function hero() {
    const p = await get("/api/portfolio");
    $("#heroTotal").textContent = money(p.totalValue);
    $("#heroChange").textContent = `${p.todayChange >= 0 ? "+" : ""}${money(p.todayChange)}`;
    $("#heroCash").textContent = money(p.buyingPower);
    $("#heroPercent").innerHTML = change(p.todayChangePercent);
    $("#heroChange").className = cls(p.todayChange);
}

async function markets() {
    const data = await get("/api/market");
    $("#marketOverview").innerHTML = data.map(x => `
        <div class="card overview-card">
            <div class="card-top">
                ${logo(x.symbol)}
                <div>
                    <div class="card-name">${x.name}</div>
                    <div class="card-symbol">${x.symbol}</div>
                </div>
            </div>
            <div class="price">${money(x.price)}</div>
            ${change(x.changePercent)}
        </div>
    `).join("");
}

let watched = new Set();

function stockCard(s) {
    return `<div class="card stock-card">
        <div class="stock-top">
            ${logo(s.symbol)}
            <div>
                <div class="card-name">${s.symbol}</div>
                <div class="stock-name">${s.name}</div>
            </div>
            <button class="star ${watched.has(s.symbol) ? "active" : ""}"
                    data-symbol="${s.symbol}">★</button>
        </div>
        <div class="price">${money(s.price)}</div>
        ${change(s.changePercent)}
    </div>`;
}

async function trending() {
    const data = await get("/api/trending");
    $("#trending").innerHTML = data.map(stockCard).join("");
    $$(".star").forEach(b => b.onclick = async () => {
        const symbol = b.dataset.symbol;
        const add = !watched.has(symbol);
        await fetch("/stock/data/watchlist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": window.csrfToken
            },
            body: JSON.stringify({ symbol, action: add ? "add" : "remove" })
        });
        add ? watched.add(symbol) : watched.delete(symbol);
        b.classList.toggle("active", add);
    });
}

async function movers() {
    const d = await get("/api/movers");
    const row = x => `<tr>
        <td>${logo(x.symbol)} ${x.symbol}</td>
        <td>${money(x.price)}</td>
        <td>${change(x.changePercent)}</td>
    </tr>`;
    $("#gainers").innerHTML = d.gainers.map(row).join("");
    $("#losers").innerHTML = d.losers.map(row).join("");
}

async function watchlist() {
    const d = await get("/api/watchlist");
    d.forEach(x => watched.add(x.symbol));
    $("#watchlist").innerHTML = d.length
        ? d.map(stockCard).join("")
        : `<div class="empty">Your watchlist is empty</div>`;
}

let chart, series, expanded = false;

async function portfolioChart(range = "1M") {
    if (!chart) {
        chart = LightweightCharts.createChart($("#portfolioChart"), {
            layout: { background: { color: "transparent" }, textColor: "#999" },
            grid: { vertLines: { color: "#222" }, horzLines: { color: "#222" } },
            rightPriceScale: { borderColor: "#333" },
            timeScale: { borderColor: "#333" },
            autoSize: true
        });
        series = chart.addAreaSeries({
            lineColor: "#2ecc71",
            topColor: "#2ecc7150",
            bottomColor: "#2ecc7105",
            lineWidth: 2
        });
    }

    const data = await get(`/api/portfolio/history?range=${range}`);
    if (!data.length) return;

    series.setData(data.map(x => ({ time: x.date, value: x.net_worth })));
    chart.timeScale().fitContent();

    const first = data[0].net_worth;
    const last = data.at(-1).net_worth;
    $("#chartValue").textContent = money(last);
    $("#chartChange").innerHTML = change((last - first) / first * 100);
}

async function transactions() {
    const data = await get("/api/transactions");

    $("#transactions").innerHTML = data.map((x, i) => `
        <tr class="${i >= 5 ? "extra-row" : ""}" ${i >= 5 ? 'style="display:none"' : ""}>
            <td>${x.symbol}</td>
            <td><span class="type ${x.type}">${x.type}</span></td>
            <td>${x.shares}</td>
            <td>${money(x.price)}</td>
            <td>${money(x.total)}</td>
            <td>${date(x.date)}</td>
        </tr>
    `).join("");

    $("#transactionToggle").style.display = data.length > 5 ? "block" : "none";
}

function search() {
    const input = $("#searchInput"), panel = $("#searchDropdown");
    let active = -1;

    function render(list) {
        panel.innerHTML = list.length
            ? `<div class="search-group">Results</div>` +
              list.map(s => `<div class="search-result" data-symbol="${s}">
                  ${logo(s)}
                  <div><div class="search-name">${s}</div>
                  <div class="search-sub">Stock</div></div>
              </div>`).join("")
            : `<div class="empty">Stock not currently supported</div>`;

        $$(".search-result").forEach(x => x.onclick = () => go(x.dataset.symbol));
        active = -1;
    }

    function go(symbol) {
        const recent = JSON.parse(localStorage.getItem("tradesims:recentSearches") || "[]")
            .filter(x => x !== symbol);
        localStorage.setItem("tradesims:recentSearches",
            JSON.stringify([symbol, ...recent].slice(0, 5)));
        location.href = `/stock/${symbol}`;
    }

    input.onfocus = () => {
        const recent = JSON.parse(localStorage.getItem("tradesims:recentSearches") || "[]");
        render(recent.length ? recent : STOCKS.slice(0, 5));
        panel.classList.add("open");
    };

    input.oninput = () => {
        const q = input.value.toUpperCase().trim();
        render(STOCKS.filter(s => s.includes(q)).slice(0, 6));
        panel.classList.add("open");
    };

    input.onkeydown = e => {
        const rows = [...panel.querySelectorAll(".search-result")];
        if (e.key === "ArrowDown") active = Math.min(active + 1, rows.length - 1);
        if (e.key === "ArrowUp") active = Math.max(active - 1, 0);
        if (e.key === "Enter" && rows[active]) go(rows[active].dataset.symbol);
        if (e.key === "Escape") panel.classList.remove("open");
        rows.forEach((r, i) => r.classList.toggle("active", i === active));
    };

    document.onclick = e => {
        if (!panel.contains(e.target) && e.target !== input)
            panel.classList.remove("open");
    };

    document.onkeydown = e => {
        if (e.key === "/" && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    };
}

function clock() {
    const now = new Date();
    $("#navClock").textContent = now.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", second: "2-digit"
    });
    const open = now.getHours() >= 9 && now.getHours() < 23;
    $("#marketStatus").textContent = open ? "● Market Open" : "● Market Closed";
    $("#marketStatus").classList.toggle("open", open);
}

document.addEventListener("DOMContentLoaded", () => {
    const h = new Date().getHours();
    $("#greeting").textContent =
        h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

    $("#profileButton").onclick = e => {
        e.stopPropagation();
        $("#profileMenu").classList.toggle("open");
    };

    $$("#ranges button").forEach(b => b.onclick = () => {
        $$("#ranges button").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        portfolioChart(b.dataset.range);
    });

    $("#transactionToggle").onclick = () => {
        expanded = !expanded;
        $$(".extra-row").forEach(x => x.style.display = expanded ? "" : "none");
        $("#transactionToggle").textContent = expanded ? "Show less" : "Show all";
    };

    search();
    clock();
    setInterval(clock, 1000);

    hero();
    markets();
    trending();
    watchlist();
    movers();
    transactions();
    portfolioChart();
});