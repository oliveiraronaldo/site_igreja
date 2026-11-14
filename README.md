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
├── index.html   # o site inteiro (HTML, CSS e JS)
└── README.md
```

## Rodando localmente

Não é preciso instalar nada. Abra o `index.html` no navegador.

Se preferir um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicando na Vercel

1. Envie este repositório para o GitHub.
2. Na [Vercel](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Framework Preset**, deixe como **Other**. Não há comando de build nem pasta de saída.
4. Clique em **Deploy**.

A cada `git push` na branch principal, a Vercel publica a nova versão automaticamente. Para usar um domínio próprio, vá em **Settings → Domains** no projeto.

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

Troque a chave na seção `#ofertas`, no elemento com `id="pixKey"`.

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
