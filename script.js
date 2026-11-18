// =========================================================
// Assembleia de Deus Missão – Ituiutaba
// Um único script para todas as páginas. Cada parte só roda
// se a página tiver o elemento correspondente.
// =========================================================

// ---------- Programação semanal (0 = domingo) ----------
// Para alterar horários, edite apenas a lista CULTOS abaixo.
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

// ---------- Congregações (página congregacoes.html) ----------
// Copie o modelo abaixo para cada congregação, tire o "//" do começo
// das linhas e preencha. A ordem da lista é a ordem dos cartões.
//   nome:     nome da congregação
//   bairro:   aparece como etiqueta no cartão
//   endereco: rua e número
//   cultos:   d = dia (0 = domingo … 6 = sábado), h = horário, n = nome (opcional)
//   mapa:     link do Google Maps (opcional; sem ele, o botão busca pelo endereço)
var CONGREGACOES = [
  // {
  //   nome: "Congregação Exemplo",
  //   bairro: "Bairro Exemplo",
  //   endereco: "Rua Exemplo, 123",
  //   cultos: [
  //     { d: 0, h: "19:00", n: "Culto de Celebração" },
  //     { d: 3, h: "19:30", n: "Culto de Oração" },
  //   ],
  //   mapa: "",
  // },
];

var hoje = new Date();
function $(id) { return document.getElementById(id); }

// ---------- Semana completa (home) ----------
(function () {
  var board = $("board");
  if (!board) return;
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

// ---------- Próximo culto (home) ----------
function atualizarProximo() {
  if (!$("nextName")) return;
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

  $("nextLabel").textContent = hojeMesmo ? "Hoje" : "Próximo culto";
  $("nextNo").textContent = ("0" + (idx + 1)).slice(-2);
  $("nextName").textContent = melhor.n;
  $("nextWhen").textContent = (hojeMesmo ? "Hoje" : amanha ? "Amanhã" : DIAS[melhor.d]) + " · " + melhor.h;

  var falta = "";
  if (menor === 0) falta = "começando agora";
  else if (menor < 1440) {
    var h = Math.floor(menor / 60), m = menor % 60;
    falta = "em " + (h ? h + "h " : "") + m + "min";
  }
  $("nextIn").textContent = falta;
}
if ($("nextName")) {
  atualizarProximo();
  setInterval(atualizarProximo, 30000);
}

// ---------- Congregações ----------
(function () {
  var box = $("congs");
  if (!box) return;
  if (!CONGREGACOES.length) {
    box.innerHTML =
      '<div class="congs-empty rv"><b>Em breve</b>' +
      "<p>Estamos preparando os endereços e horários das nossas congregações. Enquanto isso, fale com a gente pelo " +
      '<a href="https://www.instagram.com/assembleiadedeus.ituiutaba" target="_blank" rel="noopener">Instagram</a>.</p></div>';
    return;
  }
  CONGREGACOES.forEach(function (c, i) {
    var mapa = c.mapa ||
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((c.endereco || c.nome) + ", Ituiutaba - MG");
    var cultos = (c.cultos || []).slice().sort(function (a, b) { return a.d - b.d || (a.h > b.h ? 1 : -1); });
    var card = document.createElement("article");
    card.className = "cong rv";
    card.style.setProperty("--d", (i % 3) * 0.08 + "s");
    card.innerHTML =
      (c.bairro ? '<span class="cong-tag">' + c.bairro + "</span>" : "") +
      "<h3>" + c.nome + "</h3>" +
      (c.endereco ? '<p class="cong-addr">' + c.endereco + "</p>" : "") +
      (cultos.length
        ? '<ul class="cong-times">' + cultos.map(function (x) {
            return "<li><span>" + CURTO[x.d] + "</span><time>" + x.h + "</time>" + (x.n ? "<em>" + x.n + "</em>" : "") + "</li>";
          }).join("") + "</ul>"
        : "") +
      '<a class="pill line" href="' + mapa + '" target="_blank" rel="noopener">Como chegar ↗</a>';
    box.appendChild(card);
  });
})();

// ---------- Menu ----------
var header = $("topo"),
  btn = $("menuBtn"),
  menu = $("menu");
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
document.querySelectorAll(".sec-head, .a-card, .record, .index li, .pixcard, .give-copy, .map, .visit-card, .teaser, .cta-band").forEach(function (el) {
  el.classList.add("rv");
});
document.querySelectorAll(".arches .a-card, .records .record, .index li").forEach(function (el) {
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

  // Só na home: destaca no menu a seção visível (links "#secao")
  var links = {};
  menu.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if (Object.keys(links).length) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { secObs.observe(s); });
  }
} else {
  document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
}

// ---------- Copiar PIX (home) ----------
(function () {
  var copyBtn = $("copyPix");
  if (!copyBtn) return;
  var copyLabel = copyBtn.querySelector(".copy-label"),
    copyOk = $("copyOk");
  copyBtn.addEventListener("click", function () {
    var chave = $("pixKey").textContent.trim();
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
      r.selectNodeContents($("pixKey"));
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { document.execCommand("copy") ? feito() : falhou(); } catch (e) { falhou(); }
    }
  });
})();

var ano = $("year");
if (ano) ano.textContent = hoje.getFullYear();
