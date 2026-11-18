# Configuração compartilhada pelos testes.
# Sobe um servidor local com o site (a raiz do repositório) só durante os testes.

import functools
import http.server
import pathlib
import threading

import pytest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = ["index.html", "ministerios.html", "congregacoes.html"]


class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@pytest.fixture(scope="session")
def site_url():
    handler = functools.partial(_Silencioso, directory=str(RAIZ))
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=servidor.serve_forever, daemon=True)
    thread.start()
    yield "http://127.0.0.1:%d" % servidor.server_address[1]
    servidor.shutdown()
