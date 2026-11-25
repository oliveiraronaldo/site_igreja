# Testes num navegador de verdade (Chromium, via Playwright).
# Recursos externos (fontes, mapa, Instagram...) são respondidos vazios,
# para os testes não dependerem da internet.

import datetime

import pytest

from conftest import ENDERECO, PAGINAS

TELAS = {
    "celular": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "computador": {"width": 1280, "height": 800},
}
# Android comum e estreito; usado só em testes de layout específicos
TELAS_EXTRAS = {"celular-pequeno": {"width": 360, "height": 740}}
FUSO = datetime.timezone(datetime.timedelta(hours=-3))  # horário de Brasília


@pytest.fixture
def abrir(browser, site_url):
    """abrir(pagina, tela="computador", agora=None) -> (page, problemas)"""
    contextos = []

    def _abrir(pagina, tela="computador", agora=None):
        ctx = browser.new_context(viewport=dict(TELAS, **TELAS_EXTRAS)[tela], timezone_id="America/Sao_Paulo", locale="pt-BR")
        contextos.append(ctx)
        problemas = []

        def rota(route):
            if route.request.url.startswith(site_url):
                route.continue_()
            else:
                route.fulfill(status=200, body="")

        ctx.route("**/*", rota)
        page = ctx.new_page()
        page.on("pageerror", lambda e: problemas.append("Erro de JavaScript: %s" % e))
        page.on("console", lambda m: m.type == "error" and problemas.append("Console: %s" % m.text))
        page.on(
            "response",
            lambda r: r.status >= 400
            and r.url.startswith(site_url)
            and not r.url.endswith("/favicon.ico")
            and problemas.append("HTTP %d: %s" % (r.status, r.url)),
        )
        if agora:
            page.clock.install(time=agora)
        # abre pelo endereço público, sem .html (ex.: /congregacoes#natal)
        arquivo, _, ancora = pagina.partition("#")
        page.goto("%s/%s%s" % (site_url, ENDERECO.get(arquivo, arquivo), "#" + ancora if ancora else ""))
        page.wait_for_load_state("load")
        return page, problemas

    yield _abrir
    for ctx in contextos:
        ctx.close()


# ---------- Todas as páginas, em todos os tamanhos de tela ----------

@pytest.mark.parametrize("tela", TELAS)
@pytest.mark.parametrize("pagina", PAGINAS)
def test_pagina_sem_erros_e_imagens_carregam(abrir, pagina, tela):
    page, problemas = abrir(pagina, tela)
    page.evaluate("document.querySelectorAll('img').forEach(function (i) { i.loading = 'eager'; })")
    page.wait_for_function("[...document.images].every(function (i) { return i.complete; })")
    quebradas = page.evaluate(
        "[...document.images].filter(function (i) { return !i.naturalWidth; }).map(function (i) { return i.getAttribute('src'); })"
    )
    assert not quebradas, "Imagens que não carregaram: %s" % quebradas
    assert not problemas, "\n".join(problemas)


@pytest.mark.parametrize("tela", TELAS)
@pytest.mark.parametrize("pagina", PAGINAS)
def test_sem_rolagem_horizontal(abrir, pagina, tela):
    page, _ = abrir(pagina, tela)
    largura = page.evaluate("document.documentElement.scrollWidth")
    assert largura <= TELAS[tela]["width"], "A página está %dpx mais larga que a tela" % (largura - TELAS[tela]["width"])


# ---------- Menu ----------

@pytest.mark.parametrize("pagina", PAGINAS)
def test_menu_celular_abre_e_fecha(abrir, pagina):
    page, problemas = abrir(pagina, "celular")
    # No celular o menu fechado fica transparente e não recebe cliques (opacity 0 / pointer-events none).
    aberto = "getComputedStyle(document.getElementById('menu')).opacity === '1' && getComputedStyle(document.getElementById('menu')).pointerEvents !== 'none'"
    fechado = "getComputedStyle(document.getElementById('menu')).opacity === '0' && getComputedStyle(document.getElementById('menu')).pointerEvents === 'none'"
    botao = page.locator("#menuBtn")
    assert botao.is_visible()
    assert page.evaluate(fechado), "Menu deveria começar fechado"

    botao.click()
    page.wait_for_function(aberto)
    assert botao.get_attribute("aria-expanded") == "true"

    page.keyboard.press("Escape")
    page.wait_for_function(fechado)
    assert botao.get_attribute("aria-expanded") == "false"

    botao.click()
    page.wait_for_function(aberto)
    page.mouse.click(187, 600)  # clique fora do cabeçalho fecha
    page.wait_for_function(fechado)
    assert not problemas, "\n".join(problemas)


@pytest.mark.parametrize("pagina", PAGINAS)
def test_menu_computador_visivel_sem_hamburguer(abrir, pagina):
    page, _ = abrir(pagina, "computador")
    assert not page.locator("#menuBtn").is_visible()
    for texto in ["Cultos", "Visite", "Mídia", "Ofertas", "Quem somos", "Ministérios", "Congregações"]:
        assert page.locator("#menu a", has_text=texto).is_visible(), texto


@pytest.mark.parametrize(
    "origem, texto, destino",
    [
        ("ministerios.html", "Cultos", "/#cultos"),
        ("congregacoes.html", "Ofertas", "/#ofertas"),
        ("index.html", "Ministérios", "/ministerios"),
        ("index.html", "Congregações", "/congregacoes"),
        ("ministerios.html", "Congregações", "/congregacoes"),
    ],
)
def test_links_entre_paginas(abrir, site_url, origem, texto, destino):
    page, problemas = abrir(origem, "celular")
    page.locator("#menuBtn").click()
    page.locator("#menu a", has_text=texto).click()
    page.wait_for_url(site_url + destino)
    assert page.locator("#menu").count() == 1  # a página de destino carregou de verdade
    assert not problemas, "\n".join(problemas)


@pytest.mark.parametrize(
    "antigo, novo",
    [
        ("/congregacoes.html", "/congregacoes"),
        ("/ministerios.html", "/ministerios"),
        ("/index.html", "/"),
        ("/congregacoes.html#natal", "/congregacoes#natal"),
    ],
)
def test_links_antigos_com_html_continuam_funcionando(abrir, site_url, antigo, novo):
    """Links já compartilhados com .html redirecionam para o endereço limpo (como na Vercel)."""
    page, _ = abrir("index.html")
    page.goto(site_url + antigo)
    assert page.url == site_url + novo


# ---------- Home: semana e "Próximo culto" ----------

def test_quadro_da_semana(abrir):
    terca = datetime.datetime(2026, 11, 17, 18, 0, tzinfo=FUSO)
    page, _ = abrir("index.html", agora=terca)
    colunas = page.locator("#board .wd")
    assert colunas.count() == 7
    assert page.locator("#board .wd.today").count() == 1
    assert colunas.nth(2).get_attribute("class").split().count("today") == 1
    assert page.locator("#board li").count() == 6  # total de cultos na lista CULTOS


@pytest.mark.parametrize(
    "agora, rotulo, nome, quando, falta",
    [
        # terça 18:00 -> culto de hoje à noite
        (datetime.datetime(2026, 11, 17, 18, 0, tzinfo=FUSO), "Hoje", "Culto da Palavra", "Hoje · 19:30", "em 1h 30min"),
        # sábado 20:00 -> EBD de domingo
        (datetime.datetime(2026, 11, 21, 20, 0, tzinfo=FUSO), "Próximo culto", "EBD – Escola Bíblica Dominical", "Amanhã · 09:00", "em 13h 0min"),
        # quarta 10:00 -> quinta é amanhã, mas faltam mais de 24h (sem contagem)
        (datetime.datetime(2026, 11, 18, 10, 0, tzinfo=FUSO), "Próximo culto", "Culto Fé", "Amanhã · 19:30", ""),
        # terça 21:00 -> quinta, dois dias depois (mostra o nome do dia)
        (datetime.datetime(2026, 11, 17, 21, 0, tzinfo=FUSO), "Próximo culto", "Culto Fé", "Quinta-feira · 19:30", ""),
        # domingo 19:30 em ponto
        (datetime.datetime(2026, 11, 22, 19, 30, tzinfo=FUSO), "Hoje", "Culto de Celebração", "Hoje · 19:30", "começando agora"),
    ],
)
def test_proximo_culto(abrir, agora, rotulo, nome, quando, falta):
    page, problemas = abrir("index.html", agora=agora)
    # text_content: o texto como está no HTML (o CSS pode exibir em maiúsculas)
    assert page.locator("#nextLabel").text_content().strip() == rotulo
    assert page.locator("#nextName").text_content().strip() == nome
    assert page.locator("#nextWhen").text_content().strip() == quando
    assert page.locator("#nextIn").text_content().strip() == falta
    assert not problemas, "\n".join(problemas)


def test_ano_no_rodape(abrir):
    page, _ = abrir("index.html", agora=datetime.datetime(2027, 3, 1, 12, 0, tzinfo=FUSO))
    assert page.locator("#year").text_content().strip() == "2027"


# ---------- Ministérios ----------

def test_ministerios_e_musica(abrir):
    page, _ = abrir("ministerios.html")
    assert page.locator("#ministerios .a-card").count() == 6
    assert page.locator("#musica .record").count() == 2


# ---------- Congregações ----------

CONGREGACOES = [
    # (id, nome, instagram, link do mapa)
    ("bairro-brasil", "Bairro Brasil", "ad_congregacao_bairrobrasil", "https://maps.app.goo.gl/HGppquKA7rgeLJ2SA"),
    ("natal", "Natal", "congregacao.natal", "https://maps.app.goo.gl/eu6DktSDnmKZe6UA7"),
    ("junqueira", "Junqueira", "ad_congregacao_junqueira_", "https://maps.app.goo.gl/dNiByoSzQAm9JAXaA"),
    ("alvorada", "Alvorada", "congregacaoalvoradaituiutaba", "https://maps.app.goo.gl/amw8D5Mt69cWVESS8"),
    ("pirapitinga", "Pirapitinga", "congregacao.pirapitinga", "https://maps.app.goo.gl/QjM6Fx8ffwnCw78C9"),
]


def _painel_mostra(page, nome, instagram, mapa):
    painel = page.locator("#cgPanel")
    assert painel.locator("h3").text_content().strip() == nome
    insta = painel.locator("a.cg-insta")
    assert insta.get_attribute("href") == "https://www.instagram.com/%s/" % instagram
    assert "@" + instagram in insta.text_content()
    assert painel.locator("a", has_text="Como chegar").get_attribute("href") == mapa
    assert painel.locator(".cg-map iframe").count() == 1
    selecionada = page.locator('.cg-tab[aria-selected="true"]')
    assert selecionada.count() == 1
    assert nome in selecionada.text_content()


@pytest.mark.parametrize("tela", ["celular", "computador"])
def test_congregacoes_menu_troca_instagram_e_mapa(abrir, tela):
    page, problemas = abrir("congregacoes.html", tela)
    assert page.locator(".cg-tab").count() == len(CONGREGACOES)
    assert page.locator("#congs .congs-empty").count() == 0
    _painel_mostra(page, *CONGREGACOES[0][1:])  # abre na primeira

    for cid, nome, insta, mapa in reversed(CONGREGACOES):
        page.locator(".cg-tab", has_text=nome).click()
        _painel_mostra(page, nome, insta, mapa)
        assert page.evaluate("location.hash") == "#" + cid
    assert not problemas, "\n".join(problemas)


@pytest.mark.parametrize("cid, nome, insta, mapa", CONGREGACOES)
def test_congregacoes_link_direto(abrir, cid, nome, insta, mapa):
    page, _ = abrir("congregacoes.html#" + cid, "celular")
    _painel_mostra(page, nome, insta, mapa)



@pytest.mark.parametrize("tela", ["celular-pequeno"] + list(TELAS))
def test_congregacoes_todas_as_opcoes_a_vista(abrir, tela):
    """Nenhuma congregação pode ficar escondida (ex.: precisando rolar para o lado) nem com o nome cortado."""
    page, _ = abrir("congregacoes.html", tela)
    lista = page.locator(".cg-list")
    assert page.evaluate("document.querySelector('.cg-list').scrollWidth <= document.querySelector('.cg-list').clientWidth")
    largura = dict(TELAS, **TELAS_EXTRAS)[tela]["width"]
    for i in range(page.locator(".cg-tab").count()):
        aba = lista.locator(".cg-tab").nth(i)
        caixa = aba.bounding_box()
        assert caixa["x"] >= 0 and caixa["x"] + caixa["width"] <= largura, aba.text_content()
        # o nome aparece inteiro, sem ser cortado com "…"
        assert page.evaluate("(el) => el.scrollWidth <= el.clientWidth", aba.locator(".cg-name").element_handle()), aba.text_content()


def test_congregacoes_teclado(abrir):
    page, _ = abrir("congregacoes.html")
    page.locator(".cg-tab").first.focus()
    page.keyboard.press("ArrowDown")
    _painel_mostra(page, *CONGREGACOES[1][1:])
    page.keyboard.press("End")
    _painel_mostra(page, *CONGREGACOES[-1][1:])
    page.keyboard.press("ArrowDown")  # volta para a primeira
    _painel_mostra(page, *CONGREGACOES[0][1:])
    assert page.evaluate("document.activeElement.getAttribute('aria-selected')") == "true"
