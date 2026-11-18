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
// A ordem da lista é a ordem do menu. Campos:
//   id:        usado no link direto (congregacoes.html#id), sem espaços nem acentos
//   nome:      nome da congregação
//   endereco:  rua, número e bairro (opcional)
//   instagram: usuário do Instagram, sem o @
//   mapa:      link do Google Maps ("Compartilhar" no app do Maps)
//   lat, lng:  coordenadas, para o mapa da página (no Maps: clique com o botão direito no local)
//   cultos:    opcional. d = dia (0 = domingo … 6 = sábado), h = horário, n = nome
//              ex.: cultos: [{ d: 0, h: "19:00", n: "Culto de Celebração" }],
var CONGREGACOES = [
  {
    id: "bairro-brasil",
    nome: "Bairro Brasil",
    instagram: "ad_congregacao_bairrobrasil",
    mapa: "https://maps.app.goo.gl/HGppquKA7rgeLJ2SA",
    lat: -18.9923452, lng: -49.4474326,
  },
  {
    id: "natal",
    nome: "Natal",
    instagram: "congregacao.natal",
    mapa: "https://maps.app.goo.gl/eu6DktSDnmKZe6UA7",
    lat: -18.995488, lng: -49.470633,
  },
  {
    id: "junqueira",
    nome: "Junqueira",
    endereco: "Rua José Silva Ramos, 1045 – Alcides Junqueira",
    instagram: "ad_congregacao_junqueira_",
    mapa: "https://maps.app.goo.gl/dNiByoSzQAm9JAXaA",
    lat: -18.9888505, lng: -49.4514508,
  },
  {
    id: "alvorada",
    nome: "Alvorada",
    instagram: "congregacaoalvoradaituiutaba",
    mapa: "https://maps.app.goo.gl/amw8D5Mt69cWVESS8",
    lat: -18.9677441, lng: -49.4773517,
  },
  {
    id: "pirapitinga",
    nome: "Pirapitinga",
    endereco: "Rua Campina Verde, 513 – Pirapitinga",
    instagram: "congregacao.pirapitinga",
    mapa: "https://maps.app.goo.gl/QjM6Fx8ffwnCw78C9",
    lat: -18.987611, lng: -49.4792332,
  },
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
  // Menu (lista de abas) + painel da congregação escolhida
  box.className = "cg rv";
  box.innerHTML =
    '<div class="cg-list" role="tablist" aria-label="Congregações" aria-orientation="vertical"></div>' +
    '<div class="cg-panel" role="tabpanel" id="cgPanel" tabindex="0"></div>';
  var lista = box.querySelector(".cg-list"),
    painel = $("cgPanel"),
    abas = [];

  CONGREGACOES.forEach(function (c, i) {
    var aba = document.createElement("button");
    aba.type = "button";
    aba.className = "cg-tab";
    aba.id = "cg-" + c.id;
    aba.setAttribute("role", "tab");
    aba.setAttribute("aria-controls", "cgPanel");
    aba.innerHTML = '<span class="cg-no">' + ("0" + (i + 1)).slice(-2) + '</span><span class="cg-name">' + c.nome + "</span>";
    aba.addEventListener("click", function () { mostrar(i, true); });
    lista.appendChild(aba);
    abas.push(aba);
  });

  // Setas, Home e End trocam de congregação (padrão de abas acessíveis)
  lista.addEventListener("keydown", function (e) {
    var atual = abas.indexOf(document.activeElement), novo = -1, n = abas.length;
    if (atual < 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") novo = (atual + 1) % n;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") novo = (atual - 1 + n) % n;
    else if (e.key === "Home") novo = 0;
    else if (e.key === "End") novo = n - 1;
    if (novo < 0) return;
    e.preventDefault();
    mostrar(novo, true);
    abas[novo].focus();
  });

  function mostrar(i, mudarLink) {
    var c = CONGREGACOES[i];
    abas.forEach(function (a, j) {
      a.setAttribute("aria-selected", j === i ? "true" : "false");
      a.tabIndex = j === i ? 0 : -1;
    });
    painel.setAttribute("aria-labelledby", abas[i].id);

    // No celular o menu rola para o lado: deixa a congregação escolhida à vista
    if (lista.scrollWidth > lista.clientWidth) {
      var folga = parseFloat(getComputedStyle(lista).paddingLeft) || 0;
      lista.scrollLeft += abas[i].getBoundingClientRect().left - lista.getBoundingClientRect().left - folga;
    }

    var cultos = (c.cultos || []).slice().sort(function (a, b) { return a.d - b.d || (a.h > b.h ? 1 : -1); });
    var mapa = c.mapa ||
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((c.endereco || c.nome) + ", Ituiutaba - MG");
    var embed = c.lat != null
      ? "https://maps.google.com/maps?q=" + c.lat + "," + c.lng + "&z=17&hl=pt-BR&output=embed"
      : "https://maps.google.com/maps?q=" + encodeURIComponent((c.endereco || c.nome) + ", Ituiutaba - MG") + "&z=16&hl=pt-BR&output=embed";

    painel.innerHTML =
      '<div class="cg-info">' +
        '<span class="cg-tag">Congregação</span>' +
        "<h3>" + c.nome + "</h3>" +
        (c.endereco ? '<p class="cg-addr">' + c.endereco + "<br />Ituiutaba – MG</p>" : "") +
        (cultos.length
          ? '<ul class="cg-times">' + cultos.map(function (x) {
              return "<li><span>" + CURTO[x.d] + "</span><time>" + x.h + "</time>" + (x.n ? "<em>" + x.n + "</em>" : "") + "</li>";
            }).join("") + "</ul>"
          : '<p class="cg-note">Horários e novidades no Instagram da congregação.</p>') +
        '<div class="cg-actions">' +
          (c.instagram
            ? '<a class="pill dark cg-insta" href="https://www.instagram.com/' + c.instagram + '/" target="_blank" rel="noopener">' +
              '<img src="./assets/instagram.png" alt="" /> @' + c.instagram + "</a>"
            : "") +
          '<a class="pill line" href="' + mapa + '" target="_blank" rel="noopener">Como chegar ↗</a>' +
        "</div>" +
      "</div>" +
      '<div class="cg-map"><iframe src="' + embed + '" title="Mapa da congregação ' + c.nome +
        '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';

    if (mudarLink && window.history && history.replaceState) history.replaceState(null, "", "#" + c.id);
  }

  // Abre a congregação do link (congregacoes.html#natal) ou a primeira
  var inicial = 0;
  CONGREGACOES.forEach(function (c, i) { if (location.hash === "#" + c.id) inicial = i; });
  mostrar(inicial, false);
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
