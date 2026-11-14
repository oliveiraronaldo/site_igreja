// Programação semanal (0 = domingo)
var DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
var CULTOS = [
  { d: 0, h: "09:00", n: "EBD – Escola Bíblica Dominical" },
  { d: 0, h: "17:30", n: "Culto de Celebração" },
  { d: 0, h: "19:30", n: "Culto de Celebração" },
  { d: 1, h: "19:30", n: "Círculo de Oração" },
  { d: 2, h: "19:30", n: "Culto da Palavra" },
  { d: 4, h: "19:30", n: "Culto Fé" },
];

var hoje = new Date();
var board = document.getElementById("board");
[0, 1, 2, 4].forEach(function (d) {
  var itens = CULTOS.filter(function (c) {
    return c.d === d;
  });
  var row = document.createElement("div");
  row.className = "day" + (d === hoje.getDay() ? " today" : "");
  row.innerHTML =
    "<h3>" +
    DIAS[d] +
    '<span class="today-tag">Hoje</span></h3><ul>' +
    itens
      .map(function (c) {
        return "<li><time>" + c.h + "</time><span>" + c.n + "</span></li>";
      })
      .join("") +
    "</ul>";
  board.appendChild(row);
});

// Próximo culto (usa o horário do visitante)
(function () {
  var agora = hoje.getHours() * 60 + hoje.getMinutes();
  var melhor = null,
    menor = Infinity;
  CULTOS.forEach(function (c) {
    var p = c.h.split(":"),
      min = +p[0] * 60 + +p[1];
    var dif = ((c.d - hoje.getDay() + 7) % 7) * 1440 + min - agora;
    if (dif < 0) dif += 7 * 1440;
    if (dif < menor) {
      menor = dif;
      melhor = c;
    }
  });
  if (!melhor) return;
  var hojeMesmo = melhor.d === hoje.getDay() && menor < 1440;
  document.getElementById("nextLabel").textContent = hojeMesmo
    ? "Hoje"
    : "Próximo culto";
  document.getElementById("nextName").textContent = melhor.n;
  document.getElementById("nextWhen").textContent =
    (hojeMesmo ? "" : DIAS[melhor.d] + ", ") + "às " + melhor.h;
})();

// Menu mobile
var btn = document.getElementById("menuBtn"),
  menu = document.getElementById("menu");
btn.addEventListener("click", function () {
  var aberto = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", aberto);
});
menu.addEventListener("click", function (e) {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
});

var copyBtn = document.getElementById("copyPix"),
  copyOk = document.getElementById("copyOk");

copyBtn.addEventListener("click", function () {
  var chave = document.getElementById("pixKey").textContent.trim();
  function feito() {
    copyBtn.style.backgroundColor = "#d0fcda"; // Muda o fundo do botão para verde
    copyBtn.style.color = "#ffffff";
    setTimeout(function () {
      copyBtn.style.backgroundColor = "#101a33"; // Muda o fundo do botão para verde
      copyBtn.style.color = "#ffffff";
    }, 2500);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(chave).then(feito, function () {
      copyOk.textContent = "Selecione e copie a chave acima.";
    });
  } else {
    var r = document.createRange();
    r.selectNodeContents(document.getElementById("pixKey"));
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    try {
      document.execCommand("copy");
      feito();
    } catch (e) {
      copyOk.textContent = "Selecione e copie a chave acima.";
    }
  }
});
document.getElementById("year").textContent = hoje.getFullYear();
