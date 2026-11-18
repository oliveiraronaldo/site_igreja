# Testes num navegador de verdade (Chromium, via Playwright).
# Recursos externos (fontes, mapa, Instagram...) são respondidos vazios,
# para os testes não dependerem da internet.

import datetime

import pytest

from conftest import PAGINAS

TELAS = {
    "celular": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "computador": {"width": 1280, "height": 800},
}
FUSO = datetime.timezone(datetime.timedelta(hours=-3))  # horário de Brasília


@pytest.fixture
def abrir(browser, site_url):
    """abrir(pagina, tela="computador", agora=None) -> (page, problemas)"""
    contextos = []

    def _abrir(pagina, tela="computador", agora=None):
        ctx = browser.new_context(viewport=TELAS[tela], timezone_id="America/Sao_Paulo", locale="pt-BR")
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
        page.goto("%s/%s" % (site_url, pagina))
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
    for texto in ["Cultos", "Visite", "Mídia", "Ofertas", "Ministérios", "Congregações"]:
        assert page.locator("#menu a", has_text=texto).is_visible(), texto


@pytest.mark.parametrize(
    "origem, texto, destino",
    [
        ("ministerios.html", "Cultos", "index.html#cultos"),
        ("congregacoes.html", "Ofertas", "index.html#ofertas"),
        ("index.html", "Ministérios", "ministerios.html"),
        ("index.html", "Congregações", "congregacoes.html"),
        ("ministerios.html", "Congregações", "congregacoes.html"),
    ],
)
def test_links_entre_paginas(abrir, origem, texto, destino):
    page, problemas = abrir(origem, "celular")
    page.locator("#menuBtn").click()
    page.locator("#menu a", has_text=texto).click()
    page.wait_for_url("**/" + destino)
    assert not problemas, "\n".join(problemas)


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

def test_congregacoes_mostra_em_breve_ou_cartoes(abrir):
    page, _ = abrir("congregacoes.html")
    cartoes = page.locator("#congs .cong").count()
    em_breve = page.locator("#congs .congs-empty").count()
    assert (cartoes > 0) != (em_breve > 0), "Deve haver cartões OU o aviso 'Em breve', nunca os dois/nenhum"
    for i in range(cartoes):
        assert page.locator("#congs .cong").nth(i).locator("a", has_text="Como chegar").count() == 1
