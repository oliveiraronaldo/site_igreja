# Assembleia de Deus Missão – Ituiutaba, MG

Site oficial da **Assembleia de Deus Missão**, em Ituiutaba (MG). É uma página única, estática e responsiva, feita só com HTML, CSS e JavaScript, sem frameworks nem etapa de build.

## O que o site tem

- **Início:** apresentação da igreja, versículo, botão para a transmissão ao vivo e card com o próximo culto.
- **Cultos:** programação semanal, com o culto do dia em destaque.
- **Ministérios:** Missão Kids, Teens, Jovem, Mulheres, Homens e Melhor Idade.
- **Mídia:** links para o YouTube, o Instagram e o grupo informativo do WhatsApp.
- **Dízimos e ofertas:** chave PIX com botão para copiar.
- **Localização:** mapa do Google Maps incorporado.

## Estrutura do projeto

```
.
├── index.html          # home
├── ministerios.html    # ministérios e música
├── congregacoes.html   # congregações
├── style.css           # estilos de todas as páginas
├── script.js           # script de todas as páginas (CULTOS, CONGREGACOES…)
├── assets/             # imagens
├── vercel.json         # "cleanUrls": endereços sem .html
├── tests/              # testes automatizados e servidor local (não vão para o site)
└── .github/workflows/  # GitHub Actions: roda os testes a cada push
```

### Endereços das páginas

Os arquivos têm `.html`, mas os endereços não (opção `cleanUrls` do `vercel.json`):

| Arquivo | Endereço |
|---|---|
| `index.html` | `/` |
| `ministerios.html` | `/ministerios` |
| `congregacoes.html` | `/congregacoes` (link direto: `/congregacoes#natal`) |

Links antigos com `.html` redirecionam para o endereço novo. Nos links internos, use sempre
o endereço sem `.html`: `ministerios`, `congregacoes`, `./` (home) e `./#cultos` (seção da home).

## Ambientes: desenvolvimento × produção

| Ambiente | Branch | Onde aparece |
|---|---|---|
| **Local** | qualquer | `http://localhost:8000` no seu PC |
| **Desenvolvimento (prévia)** | `dev` | link de prévia da Vercel (`…vercel.app`), visível só para quem tem acesso ao projeto na Vercel |
| **Produção** | `main` | https://www.assembleiadedeusituiutaba.com |

A Vercel publica **toda** branch: a `main` vai para o domínio oficial; as outras viram uma prévia.

Fluxo de trabalho:

1. Trabalhe sempre na branch `dev` (`git switch dev`).
2. Teste no PC: `.\tests\rodar.ps1` e abra o site local.
3. `git push` na `dev` → a Vercel gera a prévia e o GitHub Actions roda os testes.
4. Confira a prévia (inclusive no celular).
5. Quando estiver tudo certo, abra um *pull request* `dev → main` no GitHub. Com os testes
   verdes, faça o merge: só aí o site oficial muda.

**Nunca faça commit direto na `main`.**

## Rodando localmente

Não é preciso instalar nada para ver o site. Na pasta do repositório:

```bash
python tests/servidor.py
```

Depois acesse `http://localhost:8000`. Esse servidor imita a Vercel (abre `/congregacoes` sem
`.html`); o `python -m http.server` comum não faz isso e os links entre páginas dariam erro.

## Testes automatizados

Na pasta do repositório, no PowerShell:

```powershell
.\tests\rodar.ps1
```

Na primeira vez, o script instala o pytest, o Playwright e o Chromium (fica fora do OneDrive,
em `%USERPROFILE%\.venvs\site_igreja`). O que é testado:

- todos os arquivos referenciados existem, com maiúsculas/minúsculas exatas (ex.: `fachada.PNG`);
- âncoras (`#cultos`, `./#ofertas`…) apontam para seções que existem;
- links internos sem `.html` e links antigos com `.html` redirecionando para o endereço novo;
- menu igual nas três páginas e página atual marcada;
- lista `CULTOS` válida (dia de 0 a 6, horário HH:MM);
- cada página no celular, tablet e computador: sem erros de JavaScript, imagens carregando,
  sem rolagem horizontal;
- menu do celular abre e fecha; links entre páginas funcionam;
- quadro da semana e "Próximo culto" em vários dias e horários simulados;
- ministérios, música e congregações renderizados.

Os mesmos testes rodam no GitHub Actions a cada `git push` (aba **Actions** do repositório).

## Publicando na Vercel

O projeto já está ligado à Vercel. Para referência: **Framework Preset → Other**, sem comando de
build nem pasta de saída. O arquivo `.vercelignore` impede que `tests/`, `.github/` e este README
sejam publicados.

## Como editar o conteúdo

Tudo está no `index.html`.

### Horários dos cultos

No final do arquivo, dentro do `<script>`, edite a lista `CULTOS`. O campo `d` é o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado):

```js
var CULTOS = [
  {d:0,h:"09:00",n:"EBD – Escola Bíblica Dominical"},
  {d:1,h:"19:30",n:"Círculo de Oração"},
  // ...
];
```

Se um culto for adicionado em um dia que ainda não aparece no quadro (hoje: domingo, segunda, terça e quinta), inclua o número do dia também na lista `[0,1,2,4].forEach(...)`.

### Ministérios

Cada ministério é um bloco `<div><i></i><h3>…</h3><p>…</p></div>` dentro da seção `#ministerios`.

### Links (YouTube, Instagram, WhatsApp)

Procure a seção `#midia` e troque os endereços nos links `<a href="...">`.

### PIX

A chave PIX (e-mail) e o botão "Copiar chave" estão **retirados temporariamente**; o cartão
mostra só o QR Code. Para voltar, reverta o commit "PIX: retirar temporariamente a chave
(e-mail)" (`git revert <commit>`) ou recoloque na seção `#ofertas`, depois do QR Code:

```html
<p class="pix-label">Chave (e-mail)</p>
<code id="pixKey">CHAVE</code>
<button type="button" id="copyPix"><span class="copy-label">Copiar chave</span></button>
<span class="ok" id="copyOk" role="status"></span>
```

O botão de copiar volta a funcionar sozinho (o código continua no `script.js`).

### Mapa

Na seção `#localizacao`, substitua o endereço do `src` do `<iframe>` pelo novo link de incorporação do Google Maps (**Compartilhar → Incorporar um mapa**).

### Seção "Quem somos"

Ainda não foi criada. O local reservado está marcado com um comentário no HTML (`QUEM SOMOS`). Ao incluí-la, adicione também o link no menu (`<nav>`).

## Tecnologias

- HTML5, CSS3 e JavaScript puro
- Fontes [Fraunces](https://fonts.google.com/specimen/Fraunces) e [Figtree](https://fonts.google.com/specimen/Figtree), via Google Fonts
- Google Maps (incorporação por `iframe`)

## Contato

- YouTube: [@assembleiadedeus.ituiutaba](https://www.youtube.com/@assembleiadedeus.ituiutaba)
- Instagram: [@assembleiadedeus.ituiutaba](https://www.instagram.com/assembleiadedeus.ituiutaba)
