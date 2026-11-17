// =========================================================
// Programação semanal (0 = domingo)
// Para alterar horários, edite apenas a lista CULTOS abaixo.
// =========================================================
var DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
var CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
var CULTOS = [
  { d: 0, h: "09:00", n: "EBD – Escola Bíblica Dominical" },
  { d: 0, h: "17:30", n: "Culto de Celebração" },
  { d: 0, h: "19:30", n: "Culto de Celebração" },
  { d: 1, h: "19:30", n: "Círculo de Oração" },
  { d: 2, h: "19:30", n: "Culto da Palavra" },
  { d: 4, h: "19:30", n: "Culto Fé" },
];

var hoje = new Date();

// ---------- Semana completa ----------
(function () {
  var board = document.getElementById("board");
  for (var d = 0; d < 7; d++) {
    var itens = CULTOS.filter(function (c) { return c.d === d; });
    var col = document.createElement("article");
    col.className = "wd rv" + (itens.length ? "" : " empty") + (d === hoje.getDay() ? " today" : "");
    col.style.setProperty("--d", d * 0.06 + "s");
    col.setAttribute("aria-label", DIAS[d] + (itens.length ? "" : ": sem culto"));
    col.innerHTML =
      '<span class="wd-name">' + DIAS[d].replace("-feira", "") + '<span class="today-tag">Hoje</span></span>' +
      '<span class="wd-big" aria-hidden="true">' + CURTO[d] + "</span>" +
      (itens.length
        ? "<ul>" + itens.map(function (c) {
            return '<li><time datetime="' + c.h + '">' + c.h + "</time><span>" + c.n + "</span></li>";
          }).join("") + "</ul>"
        : "");
    board.appendChild(col);
  }
})();

// ---------- Próximo culto ----------
function atualizarProximo() {
  var agora = new Date();
  var minAgora = agora.getHours() * 60 + agora.getMinutes();
  var melhor = null, menor = Infinity, idx = 0;
  CULTOS.forEach(function (c, i) {
    var p = c.h.split(":"), min = +p[0] * 60 + +p[1];
    var dif = ((c.d - agora.getDay() + 7) % 7) * 1440 + min - minAgora;
    if (dif < 0) dif += 7 * 1440;
    if (dif < menor) { menor = dif; melhor = c; idx = i; }
  });
  if (!melhor) return;
  var hojeMesmo = melhor.d === agora.getDay() && menor < 1440;
  var amanha = !hojeMesmo && melhor.d === (agora.getDay() + 1) % 7 && menor < 2880;

  document.getElementById("nextLabel").textContent = hojeMesmo ? "Hoje" : "Próximo culto";
  document.getElementById("nextNo").textContent = ("0" + (idx + 1)).slice(-2);
  document.getElementById("nextName").textContent = melhor.n;
  document.getElementById("nextWhen").textContent =
    (hojeMesmo ? "Hoje" : amanha ? "Amanhã" : DIAS[melhor.d]) + " · " + melhor.h;

  var falta = "";
  if (menor === 0) falta = "começando agora";
  else if (menor < 1440) {
    var h = Math.floor(menor / 60), m = menor % 60;
    falta = "em " + (h ? h + "h " : "") + m + "min";
  }
  document.getElementById("nextIn").textContent = falta;
}
atualizarProximo();
setInterval(atualizarProximo, 30000);

// ---------- Menu ----------
var header = document.getElementById("topo"),
  btn = document.getElementById("menuBtn"),
  menu = document.getElementById("menu");
function fecharMenu() {
  menu.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "Abrir menu");
}
btn.addEventListener("click", function () {
  var aberto = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", aberto);
  btn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
});
menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecharMenu(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });
document.addEventListener("click", function (e) { if (!header.contains(e.target)) fecharMenu(); });

window.addEventListener("scroll", function () {
  header.classList.toggle("scrolled", window.scrollY > 30);
}, { passive: true });

window.addEventListener("load", function () { document.body.classList.add("loaded"); });

// ---------- Animação de entrada + link ativo ----------
document.querySelectorAll(".sec-head, .a-card, .index li, .pixcard, .give-copy, .map, .visit-card").forEach(function (el) {
  el.classList.add("rv");
});
document.querySelectorAll(".arches .a-card, .index li").forEach(function (el, i, all) {
  var grupo = el.parentElement.children;
  el.style.setProperty("--d", Array.prototype.indexOf.call(grupo, el) * 0.08 + "s");
});

if ("IntersectionObserver" in window) {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".rv").forEach(function (el) { obs.observe(el); });

  var links = {};
  menu.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && links[en.target.id]) {
        Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
        links[en.target.id].classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(function (s) { secObs.observe(s); });
} else {
  document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
}

// ---------- Copiar PIX ----------
var copyBtn = document.getElementById("copyPix"),
  copyLabel = copyBtn.querySelector(".copy-label"),
  copyOk = document.getElementById("copyOk");
copyBtn.addEventListener("click", function () {
  var chave = document.getElementById("pixKey").textContent.trim();
  function feito() {
    copyBtn.classList.add("copied");
    copyLabel.textContent = "✓ Copiada!";
    copyOk.textContent = "";
    setTimeout(function () { copyBtn.classList.remove("copied"); copyLabel.textContent = "Copiar chave"; }, 2500);
  }
  function falhou() { copyOk.textContent = "Selecione e copie a chave acima."; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(chave).then(feito, falhou);
  } else {
    var r = document.createRange();
    r.selectNodeContents(document.getElementById("pixKey"));
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    try { document.execCommand("copy") ? feito() : falhou(); } catch (e) { falhou(); }
  }
});

document.getElementById("year").textContent = hoje.getFullYear();
