# Steam Rep4Rep — Comment to Friends

[![CI](https://github.com/bernardopg/steam-rep4rep/actions/workflows/ci.yml/badge.svg)](https://github.com/bernardopg/steam-rep4rep/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bernardopg/steam-rep4rep/actions/workflows/codeql.yml/badge.svg)](https://github.com/bernardopg/steam-rep4rep/actions/workflows/codeql.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/bernardopg/steam-rep4rep/blob/main/LICENSE)

[Português](#português) · [English](#english)

## Português

Userscript sem dependências de execução para revisar destinatários e comentar nos perfis de amigos do Steam. A interface aparece na página `/id/seu-perfil/friends` ou `/profiles/seu-steamid/friends`.

![Interface com dados sintéticos de demonstração](https://raw.githubusercontent.com/bernardopg/steam-rep4rep/main/docs/images/interface.png)

### Instalar

1. Instale [Tampermonkey](https://www.tampermonkey.net/) ou [Violentmonkey](https://violentmonkey.github.io/get-it/). Greasemonkey é uma opção para Firefox, mas não foi validado nesta versão.
2. No Chrome atual, abra os detalhes do gerenciador em `chrome://extensions`, habilite **Permitir scripts de usuário** e permita acesso a `steamcommunity.com`. Veja a [orientação do Tampermonkey](https://www.tampermonkey.net/faq.php#Q209).
3. [Instale pelo Greasy Fork](https://greasyfork.org/pt-BR/scripts/540752-steam-rep4rep-comment-to-friends) e confirme no gerenciador.
4. Entre no Steam e recarregue sua lista de amigos.

Use uma única instalação. O nome e o namespace foram preservados para atualizar a versão 1.1 existente. O arquivo-fonte passou de `rep4rep.js` para `rep4rep.user.js`.

### Usar

1. Escreva o comentário e ajuste o intervalo, de **6 a 3600 segundos**, em números inteiros. O padrão é seis segundos, contados **após a resposta anterior**. A preferência dura apenas nessa página.
2. Filtre a lista pela busca nativa do Steam. Selecione checkboxes individuais ou **Selecionar amigos visíveis**. Amigos ocultos não entram na revisão.
3. Clique em **Revisar comentários**. Confira cada nome e o texto. Nada foi publicado nessa etapa.
4. Clique em **Confirmar e iniciar**. Os controles ficam bloqueados durante a execução. Outra aba da mesma origem/perfil de navegador não pode iniciar um lote simultâneo.
5. Acompanhe enviados, falhas e não enviados. **Interromper envios** cancela a espera e tenta interromper a requisição atual; não apaga comentários já publicados.

O primeiro erro interrompe os próximos destinatários, inclusive respostas de erro com HTTP 200. Erros de autenticação, HTTP 429, falhas de rede, respostas inesperadas e timeout de 30 segundos exigem revisão humana. **Não existe repetição automática de POSTs.** Após falha ou interrupção de uma requisição, confira o perfil: o servidor pode ter recebido o comentário mesmo sem retornar a resposta.

Não há promessa de evitar bloqueios. O Steam restringe [automação](https://store.steampowered.com/subscriber_agreement/#4) e [spam](https://store.steampowered.com/online_conduct/); nenhum intervalo elimina esse risco.

### Compatibilidade, dados e suporte

- Português e inglês; `?l=english`, `?l=brazilian` e `?l=portuguese` têm prioridade sobre o idioma HTML.
- A suíte automatizada executa o DOM em Chromium, Firefox e viewport estreito de Chromium. Isso não substitui testes de cada gerenciador ou valida postagem real. Safari e Edge não têm uma matriz própria de validação.
- São necessários navegador atualizado, sessão Steam e Web Locks. O bloqueio entre abas vale para a mesma origem/perfil; não coordena navegadores, perfis ou dispositivos diferentes.
- Não há backend, telemetria, chave de API nem armazenamento de comentários ou tokens. O envio usa o endpoint web interno da Steam Community e a sessão da página; não é uma Web API pública com estabilidade garantida.
- Atualizações passam por **GitHub Releases → Greasy Fork → gerenciador de userscripts**. Commits em `main` não são distribuídos antes de uma release.
- Se o painel não aparecer, confira a autorização da extensão, a URL e o login. Se a sessão estiver indisponível, recarregue após entrar. Para defeitos, use [Issues](https://github.com/bernardopg/steam-rep4rep/issues), sem cookies, tokens ou dados de amigos.

### Desenvolvimento

Node.js **24+** e npm. Dependências npm são somente ferramentas de desenvolvimento.

```sh
npm ci --ignore-scripts
npx playwright install chromium firefox
npm run check
npm test
```

No Linux, `npx playwright install --with-deps chromium firefox` instala as dependências de sistema quando necessário. `npm run format` formata os arquivos; `npm run build` gera os artefatos e checksums em `dist/`. Consulte [contribuição](https://github.com/bernardopg/steam-rep4rep/blob/main/CONTRIBUTING.md), [releases](https://github.com/bernardopg/steam-rep4rep/blob/main/docs/RELEASING.md), [segurança](https://github.com/bernardopg/steam-rep4rep/blob/main/SECURITY.md) e [changelog](https://github.com/bernardopg/steam-rep4rep/blob/main/CHANGELOG.md).

## English

A userscript with no runtime dependencies for reviewing recipients and commenting on Steam friends' profiles. Open your `/id/your-profile/friends` or `/profiles/your-steamid/friends` page.

### Install and use

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/get-it/). Greasemonkey is a Firefox option, but has not been validated for this release.
2. In current Chrome versions, open the manager's extension details, enable **Allow User Scripts**, and allow access to `steamcommunity.com`.
3. [Install from Greasy Fork](https://greasyfork.org/en/scripts/540752-steam-rep4rep-comment-to-friends), sign in to Steam and reload your friends page. Keep only one installation. Version 1.1 installations retain their script identity.
4. Write your comment. Set an integer interval from **6 to 3600 seconds**, default six, measured **after each response**. This setting is kept only for the current page.
5. Use Steam's search, then individual checkboxes or **Select visible friends**. Hidden friends are excluded from the review.
6. Click **Review comments**, check every recipient and the text, then **Confirm and start**. Controls are locked while sending. A second tab on the same origin/browser profile cannot run another batch.
7. Watch sent, failed and unsent counts. **Stop sending** cancels the wait and attempts to abort the active request. It does not remove comments already delivered.

Sending is sequential and stops at the first error, including Steam errors returned with HTTP 200. Each request has a 30-second timeout. **POST requests are never retried automatically.** After a network error or cancellation, delivery can be uncertain; check the target profile before trying again.

Steam restricts [automation](https://store.steampowered.com/subscriber_agreement/#4) and [spam](https://store.steampowered.com/online_conduct/). No interval guarantees protection from account restrictions.

### Compatibility and privacy

The automated DOM suite runs Chromium, Firefox and a narrow Chromium viewport. This does not prove compatibility with every userscript manager or real posting. Edge and Safari have no separate validation matrix. An up-to-date browser, Steam session and Web Locks are required. Separate browser profiles, browsers and devices do not share the tab lock.

There is no backend, telemetry, API key or persistent comment/session storage. Requests go directly to Steam Community using the page session and its internal web endpoint, without a public API stability guarantee. English and Portuguese are supported; URL language takes precedence over HTML language.

Updates follow **GitHub Releases → Greasy Fork → userscript manager**, not each `main` commit. The source file is now `rep4rep.user.js`. For setup issues, check extension permissions, page URL and login, then reload. Report defects through [Issues](https://github.com/bernardopg/steam-rep4rep/issues), without session tokens, cookies or friends' data.

### Contribute and license

Use Node.js 24+, run `npm ci --ignore-scripts`, install Playwright browsers, then run `npm run check` and `npm test`. Runtime JavaScript has no npm dependencies. See [CONTRIBUTING](https://github.com/bernardopg/steam-rep4rep/blob/main/CONTRIBUTING.md), [release instructions](https://github.com/bernardopg/steam-rep4rep/blob/main/docs/RELEASING.md), [SECURITY](https://github.com/bernardopg/steam-rep4rep/blob/main/SECURITY.md) and [CHANGELOG](https://github.com/bernardopg/steam-rep4rep/blob/main/CHANGELOG.md).

Licensed under [MIT](https://github.com/bernardopg/steam-rep4rep/blob/main/LICENSE).
