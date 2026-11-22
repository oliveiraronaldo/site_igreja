# Verificações que não precisam de navegador: arquivos, links e dados.

import html.parser
import json
import os
import re
import urllib.parse

import pytest

from conftest import ENDERECO, PAGINAS, RAIZ


def _arquivo_da_pagina(caminho):
    """Endereço público -> arquivo: './' -> index.html, 'ministerios' -> ministerios.html."""
    if caminho.startswith("./"):
        caminho = caminho[2:]
    if caminho in ("", "/"):
        return "index.html"
    if not caminho.endswith(".html") and (RAIZ / (caminho + ".html")).is_file():
        return caminho + ".html"
    return caminho


class _Coletor(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []  # (tag, attrs dict, dentro_do_menu)
        self.ids = set()
        self._no_menu = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "nav" and a.get("id") == "menu":
            self._no_menu = 1
        self.tags.append((tag, a, bool(self._no_menu)))

    def handle_endtag(self, tag):
        if tag == "nav":
            self._no_menu = 0


def _ler(pagina):
    p = _Coletor()
    p.feed((RAIZ / pagina).read_text(encoding="utf-8"))
    return p


def _existe_com_maiusculas_exatas(caminho_relativo):
    """O Windows ignora maiúsculas/minúsculas; o servidor de produção não."""
    atual = RAIZ
    for parte in caminho_relativo.split("/"):
        if parte in ("", "."):
            continue
        if not atual.is_dir() or parte not in os.listdir(atual):
            return False
        atual = atual / parte
    return True


def _locais(pagina):
    """Todos os src/href que apontam para arquivos do próprio site."""
    for tag, a, _ in _ler(pagina).tags:
        for attr in ("src", "href"):
            url = a.get(attr)
            if not url or re.match(r"^(https?:|mailto:|tel:|#|data:|//)", url):
                continue
            yield tag, attr, url


@pytest.mark.parametrize("pagina", PAGINAS)
def test_arquivos_referenciados_existem(pagina):
    faltando = []
    for tag, attr, url in _locais(pagina):
        caminho = urllib.parse.unquote(url.split("#")[0].split("?")[0])
        if caminho and not _existe_com_maiusculas_exatas(_arquivo_da_pagina(caminho)):
            faltando.append("<%s %s=%s>" % (tag, attr, url))
    assert not faltando, "Arquivos não encontrados (confira maiúsculas): %s" % faltando


@pytest.mark.parametrize("pagina", PAGINAS)
def test_imagens_usam_caminho_relativo_correto(pagina):
    texto = (RAIZ / pagina).read_text(encoding="utf-8")
    assert "../assets/" not in texto, "Use ./assets/ (../ quebra ao abrir o arquivo localmente)"


@pytest.mark.parametrize("pagina", PAGINAS)
def test_ancoras_apontam_para_secoes_que_existem(pagina):
    erros = []
    for tag, a, _ in _ler(pagina).tags:
        href = a.get("href", "")
        if tag != "a" or "#" not in href or re.match(r"^https?:", href):
            continue
        arquivo, ancora = href.split("#", 1)
        destino = _arquivo_da_pagina(arquivo) if arquivo else pagina
        if ancora and ancora not in _ler(destino).ids:
            erros.append(href)
    assert not erros, "Âncoras sem seção correspondente: %s" % erros


def _menu(pagina):
    return [
        (a.get("href", ""), a.get("aria-current"))
        for tag, a, no_menu in _ler(pagina).tags
        if tag == "a" and no_menu
    ]


def test_menu_igual_nas_tres_paginas():
    def normalizar(href):
        return href.replace("./#", "#")

    menus = {p: [normalizar(h) for h, _ in _menu(p)] for p in PAGINAS}
    referencia = menus["index.html"]
    for pagina, itens in menus.items():
        assert itens == referencia, "Menu de %s difere da home: %s" % (pagina, itens)


@pytest.mark.parametrize("pagina", ["ministerios.html", "congregacoes.html"])
def test_pagina_atual_marcada_no_menu(pagina):
    atuais = [h for h, atual in _menu(pagina) if atual == "page"]
    assert atuais == [ENDERECO[pagina]]


@pytest.mark.parametrize("pagina", PAGINAS)
def test_links_internos_sem_html(pagina):
    """Endereços limpos (assembleiadedeusituiutaba.com/congregacoes), sem '.html' nos links."""
    com_html = [url for tag, attr, url in _locais(pagina) if tag == "a" and ".html" in url]
    assert not com_html, "Use o endereço sem .html (ex.: 'congregacoes', './#cultos'): %s" % com_html


def test_vercel_serve_enderecos_sem_html():
    config = json.loads((RAIZ / "vercel.json").read_text(encoding="utf-8"))
    assert config.get("cleanUrls") is True


@pytest.mark.parametrize("pagina", PAGINAS)
def test_links_externos_em_nova_aba_tem_noopener(pagina):
    erros = [
        a.get("href")
        for tag, a, _ in _ler(pagina).tags
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in a.get("rel", "")
    ]
    assert not erros, "Faltando rel=\"noopener\": %s" % erros


@pytest.mark.parametrize("pagina", PAGINAS)
def test_imagens_tem_alt(pagina):
    sem_alt = [a.get("src") for tag, a, _ in _ler(pagina).tags if tag == "img" and "alt" not in a]
    assert not sem_alt, "Imagens sem atributo alt: %s" % sem_alt


@pytest.mark.parametrize("pagina", PAGINAS)
def test_pagina_carrega_css_e_script(pagina):
    tags = _ler(pagina).tags
    assert any(t == "link" and a.get("href") == "style.css" for t, a, _ in tags)
    assert any(t == "script" and a.get("src") == "script.js" for t, a, _ in tags)


def test_home_tem_chamadas_para_ministerios_e_congregacoes():
    destinos = [a.get("href") for tag, a, _ in _ler("index.html").tags if tag == "a" and "teaser" in a.get("class", "")]
    assert destinos == ["ministerios", "congregacoes"]


def test_chamada_da_home_cita_todas_as_congregacoes():
    """Ao incluir uma congregação no script.js, lembre de citá-la na chamada da home."""
    js = (RAIZ / "script.js").read_text(encoding="utf-8")
    bloco = re.search(r"var CONGREGACOES = \[(.*?)\n\];", js, re.S).group(1)
    nomes = re.findall(r'^\s*nome:\s*"([^"]+)"', bloco, re.M)
    assert nomes, "Nenhuma congregação encontrada no script.js"
    home = (RAIZ / "index.html").read_text(encoding="utf-8")
    trecho = home.split('<a class="teaser" href="congregacoes">', 1)[1].split("</a>", 1)[0]
    faltando = [n for n in nomes if n not in trecho]
    assert not faltando, "Congregações não citadas na chamada da home: %s" % faltando


EMAIL_CONTATO = "admissao10ituiutaba@gmail.com"


def _rodape(pagina):
    texto = (RAIZ / pagina).read_text(encoding="utf-8")
    return texto.split("<footer>", 1)[1].split("</footer>", 1)[0]


def test_rodape_igual_nas_tres_paginas():
    referencia = _rodape("index.html")
    for pagina in PAGINAS:
        assert _rodape(pagina) == referencia, "Rodapé de %s difere da home" % pagina


@pytest.mark.parametrize("pagina", PAGINAS)
def test_rodape_tem_email_de_contato(pagina):
    rodape = _rodape(pagina)
    assert 'href="mailto:%s"' % EMAIL_CONTATO in rodape
    assert ">%s</a>" % EMAIL_CONTATO in rodape, "O e-mail deve aparecer escrito, não só no link"


def test_lista_de_cultos_valida():
    js = (RAIZ / "script.js").read_text(encoding="utf-8")
    bloco = re.search(r"var CULTOS = \[(.*?)\];", js, re.S).group(1)
    cultos = re.findall(r'\{\s*d:\s*(\d+),\s*h:\s*"([^"]*)",\s*n:\s*"([^"]*)"\s*\}', bloco)
    assert cultos, "Lista CULTOS vazia ou em formato inesperado"
    for d, h, n in cultos:
        assert 0 <= int(d) <= 6, "Dia inválido em %s" % n
        assert re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", h), "Horário inválido: %s (%s)" % (h, n)
        assert n.strip(), "Culto sem nome"
