# Servidor local que se comporta como a Vercel com "cleanUrls" (vercel.json):
#   /congregacoes        -> serve congregacoes.html
#   /congregacoes.html   -> redireciona para /congregacoes
#   /index.html          -> redireciona para /
#
# Uso, na pasta do repositório:   python tests/servidor.py        (porta 8000)
#                                  python tests/servidor.py 8765   (outra porta)
# Depois abra http://localhost:8000

import http.server
import pathlib
import sys
import urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent


class SiteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def do_GET(self):
        if self._redirecionar():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._redirecionar():
            return
        super().do_HEAD()

    def _redirecionar(self):
        partes = urllib.parse.urlsplit(self.path)
        caminho = partes.path
        if not caminho.endswith(".html"):
            return False
        limpo = caminho[: -len(".html")]
        if limpo.endswith("/index") or limpo == "index":
            limpo = limpo[: -len("index")]
        destino = urllib.parse.urlunsplit(("", "", limpo or "/", partes.query, ""))
        self.send_response(308)
        self.send_header("Location", destino)
        self.end_headers()
        return True

    def translate_path(self, path):
        arquivo = super().translate_path(path)
        p = pathlib.Path(arquivo)
        if not p.exists() and p.with_name(p.name + ".html").is_file():
            return str(p.with_name(p.name + ".html"))
        return arquivo

    def log_message(self, *args):
        if self.server.mostrar_log:
            super().log_message(*args)


def criar(porta=0, mostrar_log=False):
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", porta), SiteHandler)
    servidor.mostrar_log = mostrar_log
    return servidor


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    s = criar(porta, mostrar_log=True)
    print("Site em http://localhost:%d  (Ctrl+C para parar)" % porta)
    try:
        s.serve_forever()
    except KeyboardInterrupt:
        pass
