// ==UserScript==
// @name         Steam Rep4Rep - Comment to Friends
// @name:pt      Steam Rep4Rep - Comentar em Amigos
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Review visible friends and post comments sequentially, with progress, cancellation and a configurable interval.
// @description:pt Revise os amigos visíveis e envie comentários em sequência, com progresso, interrupção e intervalo configurável.
// @author       bernardopg
// @icon         https://store.steampowered.com/favicon.ico
// @match        https://steamcommunity.com/*/friends
// @match        https://steamcommunity.com/*/friends/
// @run-at       document-idle
// @noframes
// @grant        none
// @license      MIT
// @homepage     https://github.com/bernardopg/steam-rep4rep
// @supportURL   https://github.com/bernardopg/steam-rep4rep/issues
// @updateURL    https://update.greasyfork.org/scripts/540752/Steam%20Rep4Rep%20-%20Comment%20to%20Friends.meta.js
// @downloadURL  https://update.greasyfork.org/scripts/540752/Steam%20Rep4Rep%20-%20Comment%20to%20Friends.user.js
// ==/UserScript==

(() => {
  'use strict';
  const translations = {
    en: {
      title: 'Rep4Rep · Comment to friends',
      comment: 'Your comment',
      placeholder: 'Write the comment to review before sending…',
      select: 'Select visible friends',
      clear: 'Clear selection',
      review: 'Review comments',
      cancel: 'Stop sending',
      interval: 'Interval after each response (seconds)',
      intervalHelp:
        '6–3600 seconds. No interval guarantees protection from Steam restrictions.',
      selected: 'Visible friends selected',
      choose: 'Select at least one visible friend.',
      empty: 'Write a comment first.',
      delayError: 'Use a whole number from 6 to 3600 seconds.',
      session: 'Steam session unavailable. Sign in and reload this page.',
      confirm: 'Review recipients',
      start: 'Confirm and start',
      back: 'Go back',
      warning:
        'This posts the same comment to the listed profiles. Steam restricts automation and spam. Review every recipient before continuing.',
      idle: 'Nothing is sent until you review and confirm.',
      working: 'Sending',
      done: 'Completed',
      stopped: 'Stopped',
      processed: 'Processed',
      success: 'Sent',
      failed: 'Failed',
      pending: 'Not sent',
      unknown: 'Steam returned an unknown error.',
      uncertain:
        'Connection lost, timed out or interrupted. Delivery is unknown; check the profile before trying again.',
      http: 'Steam returned HTTP',
      invalid: 'Unexpected response from Steam; sending stopped.',
      busy: 'Another tab is already sending comments. Stop it before starting here.',
      unsupported:
        'This browser does not support the required tab lock. Update your browser.',
      selectFriend: 'Select friend',
      result: 'Results',
    },
    pt: {
      title: 'Rep4Rep · Comentar em amigos',
      comment: 'Seu comentário',
      placeholder: 'Escreva o comentário para revisar antes de enviar…',
      select: 'Selecionar amigos visíveis',
      clear: 'Limpar seleção',
      review: 'Revisar comentários',
      cancel: 'Interromper envios',
      interval: 'Intervalo após cada resposta (segundos)',
      intervalHelp:
        '6–3600 segundos. Nenhum intervalo garante proteção contra restrições do Steam.',
      selected: 'Amigos visíveis selecionados',
      choose: 'Selecione pelo menos um amigo visível.',
      empty: 'Escreva um comentário primeiro.',
      delayError: 'Use um número inteiro de 6 a 3600 segundos.',
      session:
        'Sessão Steam indisponível. Entre na conta e recarregue a página.',
      confirm: 'Revisar destinatários',
      start: 'Confirmar e iniciar',
      back: 'Voltar',
      warning:
        'O mesmo comentário será publicado nos perfis listados. O Steam restringe automação e spam. Revise cada destinatário antes de continuar.',
      idle: 'Nada é enviado antes da sua revisão e confirmação.',
      working: 'Enviando',
      done: 'Concluído',
      stopped: 'Interrompido',
      processed: 'Processados',
      success: 'Enviados',
      failed: 'Falhas',
      pending: 'Não enviados',
      unknown: 'O Steam retornou um erro desconhecido.',
      uncertain:
        'Conexão perdida, expirada ou interrompida. O resultado é incerto; confira o perfil antes de tentar novamente.',
      http: 'O Steam retornou HTTP',
      invalid: 'Resposta inesperada do Steam; envio interrompido.',
      busy: 'Outra aba já está enviando comentários. Interrompa-a antes de iniciar aqui.',
      unsupported:
        'Este navegador não oferece o bloqueio entre abas necessário. Atualize o navegador.',
      selectFriend: 'Selecionar amigo',
      result: 'Resultados',
    },
  };
  const language =
    new URLSearchParams(location.search).get('l') ||
    document.documentElement.lang;
  const t =
    translations[
      /^(brazilian|portuguese|pt(?:-|$))/i.test(language) ? 'pt' : 'en'
    ];
  const friendSelector = '.friend_block_v2, .selectable_friend';
  let root, panel, pending, run;
  const el = (id) => panel.querySelector(`#rep4rep-${id}`);
  const checkboxes = () => [...root.querySelectorAll('.rep4rep-checkbox')];
  const visible = (box) =>
    box.getClientRects().length > 0 &&
    getComputedStyle(box).visibility !== 'hidden';
  const selected = () =>
    checkboxes().filter((box) => box.checked && visible(box));
  const session = () =>
    typeof window.g_sessionID === 'string' && window.g_sessionID.trim();
  function status(message) {
    el('status').textContent = message;
  }

  function updateSelection() {
    const text = `${t.selected}: ${selected().length}`;
    if (el('selection').textContent !== text)
      el('selection').textContent = text;
  }

  function refreshFriends() {
    for (const friend of root.querySelectorAll(friendSelector)) {
      if (friend.querySelector('.rep4rep-checkbox')) continue;
      const id =
        friend.dataset.steamid ||
        friend.querySelector('[data-steamid]')?.dataset.steamid;
      if (
        !/^\d{17}$/.test(id || '') ||
        document.getElementById(`rep4rep-friend-${id}`)
      )
        continue;
      const content = friend.querySelector('.friend_block_content') || friend;
      const name =
        content.textContent
          .trim()
          .split('\n')
          .map((line) => line.trim())
          .find(Boolean) || id;
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'rep4rep-checkbox';
      box.id = `rep4rep-friend-${id}`;
      box.dataset.steamid = id;
      box.dataset.name = name;
      box.setAttribute('aria-label', `${t.selectFriend}: ${name}`);
      box.disabled = !!run;
      friend.classList.add('rep4rep-friend');
      box.addEventListener('click', (event) => event.stopPropagation());
      box.addEventListener('change', () => {
        friend.classList.toggle('rep4rep-selected', box.checked);
        updateSelection();
      });
      friend.append(box);
    }
    updateSelection();
  }

  function log(name, message, success = false) {
    const item = document.createElement('li');
    item.className = success ? 'rep4rep-success' : 'rep4rep-error';
    item.textContent = `${name}: ${message}`;
    el('log').append(item);
  }

  function setRunning(active) {
    for (const control of panel.querySelectorAll(
      'textarea, input, button[data-idle]',
    ))
      control.disabled = active;
    for (const box of checkboxes()) box.disabled = active;
    el('cancel').hidden = !active;
  }

  function review() {
    if (run || el('confirm').open) return;
    const friends = selected().map((box) => ({
      id: box.dataset.steamid,
      name: box.dataset.name,
    }));
    const comment = el('comment').value.trim();
    const seconds = Number(el('interval').value);
    if (!friends.length) return status(t.choose);
    if (friends.some((friend) => !/^\d{17}$/.test(friend.id)))
      return status(t.invalid);
    if (!comment) {
      status(t.empty);
      el('comment').focus();
      return;
    }
    if (!Number.isInteger(seconds) || seconds < 6 || seconds > 3600)
      return status(t.delayError);
    if (!session()) return status(t.session);
    pending = { friends, comment, seconds };
    el('recipients').replaceChildren(
      ...friends.map((friend) => {
        const item = document.createElement('li');
        item.textContent = friend.name;
        return item;
      }),
    );
    el('preview').textContent = comment;
    el('confirm').showModal();
  }

  async function wait(milliseconds, signal) {
    if (signal.aborted) return;
    await new Promise((resolve) => {
      const abort = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, milliseconds);
      signal.addEventListener('abort', abort, { once: true });
    });
  }

  async function start() {
    if (run || !pending) return;
    el('confirm').close();
    if (!session()) return status(t.session);
    if (!navigator.locks) return status(t.unsupported);
    const batch = pending;
    pending = null;
    const controller = new AbortController();
    run = controller;
    setRunning(true);
    try {
      await navigator.locks.request(
        'steam-rep4rep-posting',
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            status(t.busy);
            return;
          }
          el('log').replaceChildren();
          el('progress').max = batch.friends.length;
          el('progress').value = 0;
          let processed = 0,
            successes = 0,
            failures = 0,
            stopped = false;
          for (const friend of batch.friends) {
            if (controller.signal.aborted) {
              stopped = true;
              break;
            }
            if (!session()) {
              log(friend.name, t.session);
              stopped = true;
              break;
            }
            status(
              `${t.working}: ${friend.name} · ${processed}/${batch.friends.length}`,
            );
            try {
              const response = await fetch(
                `https://steamcommunity.com/comment/Profile/post/${friend.id}/-1/`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    comment: batch.comment,
                    count: '6',
                    sessionid: session(),
                  }),
                  signal: AbortSignal.any([
                    controller.signal,
                    AbortSignal.timeout(30000),
                  ]),
                },
              );
              if (!response.ok) {
                log(friend.name, `${t.http} ${response.status}.`);
                failures++;
                stopped = true;
              } else {
                const data = await response.json();
                if (data?.success === true || data?.success === 1) {
                  successes++;
                  log(friend.name, t.success, true);
                } else if (data?.success === false || data?.success === 0) {
                  failures++;
                  log(
                    friend.name,
                    typeof data.error === 'string' ? data.error : t.unknown,
                  );
                  // Steam also reports restrictions with HTTP 200; require review before another POST.
                  stopped = true;
                } else {
                  failures++;
                  log(friend.name, t.invalid);
                  stopped = true;
                }
              }
            } catch {
              failures++;
              log(friend.name, t.uncertain);
              stopped = true;
            }
            processed++;
            el('progress').value = processed;
            status(
              `${t.processed}: ${processed}/${batch.friends.length} · ${t.success}: ${successes} · ${t.failed}: ${failures}`,
            );
            if (stopped || controller.signal.aborted) {
              stopped = true;
              break;
            }
            if (processed < batch.friends.length)
              await wait(batch.seconds * 1000, controller.signal);
          }
          stopped ||= controller.signal.aborted;
          status(
            `${stopped ? t.stopped : t.done} · ${t.processed}: ${processed}/${batch.friends.length} · ${t.success}: ${successes} · ${t.failed}: ${failures} · ${t.pending}: ${batch.friends.length - processed}`,
          );
        },
      );
    } catch {
      status(t.uncertain);
    } finally {
      run = null;
      setRunning(false);
    }
  }

  function initialize() {
    if (root?.isConnected && panel?.isConnected) return;
    if (run) run.abort();
    root = document.querySelector('.friends_content, #friends_list');
    if (!root || document.querySelector('.rep4rep-container')) return;
    panel = document.createElement('section');
    panel.className = 'rep4rep-container';
    panel.setAttribute('aria-labelledby', 'rep4rep-title');
    panel.innerHTML = `
      <h2 id="rep4rep-title">${t.title}</h2>
      <label for="rep4rep-comment">${t.comment}</label>
      <textarea id="rep4rep-comment" class="rep4rep-textarea" placeholder="${t.placeholder}"></textarea>
      <div class="rep4rep-settings"><label for="rep4rep-interval">${t.interval}</label>
        <input id="rep4rep-interval" type="number" min="6" max="3600" step="1" value="6" aria-describedby="rep4rep-help"></div>
      <p id="rep4rep-help">${t.intervalHelp}</p>
      <div class="rep4rep-controls">
        <button id="rep4rep-select-all" data-idle>${t.select}</button>
        <button id="rep4rep-deselect-all" data-idle>${t.clear}</button>
        <button id="rep4rep-post-comments" class="rep4rep-primary" data-idle>${t.review}</button>
        <button id="rep4rep-cancel" hidden>${t.cancel}</button>
      </div>
      <p id="rep4rep-selection" role="status"></p>
      <p id="rep4rep-status" role="status">${t.idle}</p>
      <progress id="rep4rep-progress" max="1" value="0" aria-label="${t.processed}"></progress>
      <ol id="rep4rep-log" aria-label="${t.result}"></ol>
      <dialog id="rep4rep-confirm" aria-labelledby="rep4rep-confirm-title">
        <h3 id="rep4rep-confirm-title">${t.confirm}</h3><p>${t.warning}</p>
        <ul id="rep4rep-recipients"></ul><pre id="rep4rep-preview"></pre>
        <div class="rep4rep-controls"><button id="rep4rep-back">${t.back}</button>
        <button id="rep4rep-start" class="rep4rep-primary">${t.start}</button></div>
      </dialog>`;
    for (const button of panel.querySelectorAll('button'))
      button.type = 'button';
    root.prepend(panel);
    el('select-all').onclick = () => {
      for (const box of checkboxes()) {
        box.checked = visible(box);
        box
          .closest(friendSelector)
          .classList.toggle('rep4rep-selected', box.checked);
      }
      updateSelection();
    };
    el('deselect-all').onclick = () => {
      for (const box of checkboxes()) {
        box.checked = false;
        box.closest(friendSelector).classList.remove('rep4rep-selected');
      }
      updateSelection();
    };
    el('post-comments').onclick = review;
    el('start').onclick = start;
    el('back').onclick = () => {
      pending = null;
      el('confirm').close();
    };
    el('confirm').addEventListener('cancel', () => {
      pending = null;
    });
    el('cancel').onclick = () => run?.abort();
    refreshFriends();
  }

  if (!document.getElementById('rep4rep-styles')) {
    const style = document.createElement('style');
    style.id = 'rep4rep-styles';
    style.textContent = `
      .rep4rep-container { color:#d7e2ec; background:#182534; border:1px solid #3b5267; border-radius:10px; padding:20px; margin:16px 0; font:14px/1.5 Arial,sans-serif; }
      .rep4rep-container *, .rep4rep-container *::before, .rep4rep-container *::after { box-sizing:border-box; }
      .rep4rep-container h2 { font-size:19px; color:#c5e4fa; margin:0 0 16px; }
      .rep4rep-container label { display:block; margin-bottom:6px; font-weight:bold; }
      .rep4rep-textarea, #rep4rep-interval { color:#edf5fb; background:#0e1721; border:1px solid #557086; border-radius:5px; padding:10px; font:inherit; }
      .rep4rep-textarea { display:block; width:100%; min-height:100px; resize:vertical; }
      .rep4rep-settings { display:flex; align-items:center; flex-wrap:wrap; gap:8px 16px; margin-top:14px; }
      #rep4rep-interval { width:100px; }
      #rep4rep-help { color:#b2c1cf; font-size:12px; }
      .rep4rep-controls { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }
      .rep4rep-container button { color:#e8f3fc; background:#30475c; border:1px solid #60798e; border-radius:5px; padding:10px 14px; cursor:pointer; font:inherit; }
      .rep4rep-container button:hover { background:#3b5871; }
      .rep4rep-container button.rep4rep-primary { background:#326887; border-color:#77b9dc; }
      .rep4rep-container button:disabled { opacity:.55; cursor:not-allowed; }
      .rep4rep-container :focus-visible, .rep4rep-checkbox:focus-visible { outline:3px solid #a2daff; outline-offset:3px; }
      .rep4rep-container [hidden] { display:none!important; }
      .rep4rep-friend { position:relative!important; }
      .rep4rep-checkbox { position:absolute; top:8px; right:8px; z-index:10; width:18px; height:18px; cursor:pointer; }
      .rep4rep-selected { outline:2px solid #79c9fa!important; outline-offset:-2px; background-color:#28465b!important; }
      #rep4rep-status { overflow-wrap:anywhere; }
      #rep4rep-progress { width:100%; height:12px; accent-color:#79c9fa; }
      #rep4rep-log { max-height:220px; overflow:auto; padding-left:24px; overflow-wrap:anywhere; }
      .rep4rep-success { color:#a5df91; } .rep4rep-error { color:#ffb5ac; }
      #rep4rep-confirm { width:min(560px,calc(100% - 32px)); max-height:85vh; overflow:auto; color:#e8f3fc; background:#182534; border:1px solid #77b9dc; border-radius:10px; padding:20px; }
      #rep4rep-confirm::backdrop { background:#000a; }
      #rep4rep-recipients { max-height:180px; overflow:auto; }
      #rep4rep-preview { white-space:pre-wrap; overflow-wrap:anywhere; background:#0e1721; padding:12px; border-radius:5px; }
      @media(max-width:480px) { .rep4rep-container { padding:14px; } .rep4rep-controls button { flex:1 1 auto; } }
    `;
    document.head.append(style);
  }
  const observer = new MutationObserver((records) => {
    if (!root?.isConnected || !panel?.isConnected) {
      initialize();
      return;
    }
    if (records.some((record) => !panel.contains(record.target)))
      refreshFriends();
  });
  const observe = () =>
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class'],
    });
  observe();
  window.addEventListener('pagehide', () => {
    run?.abort();
    observer.disconnect();
  });
  window.addEventListener('pageshow', observe);
  initialize();
})();
