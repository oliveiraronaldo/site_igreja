# Configuração compartilhada pelos testes.
# Sobe o servidor local (tests/servidor.py, que imita a Vercel) só durante os testes.

import pathlib
import threading

import pytest

import servidor

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = ["index.html", "quem-somos.html", "ministerios.html", "congregacoes.html"]
# Endereço público de cada página (vercel.json: "cleanUrls": true)
ENDERECO = {"index.html": "", "quem-somos.html": "quem-somos", "ministerios.html": "ministerios", "congregacoes.html": "congregacoes"}


@pytest.fixture(scope="session")
def site_url():
    s = servidor.criar()
    thread = threading.Thread(target=s.serve_forever, daemon=True)
    thread.start()
    yield "http://127.0.0.1:%d" % s.server_address[1]
    s.shutdown()
