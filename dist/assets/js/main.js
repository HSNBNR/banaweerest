/* Banaweer — site behaviour. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ } }

  /* ---- Remember language choice ---- */
  safeSet('banaweer-lang', doc.lang);
  document.querySelectorAll('[data-set-lang]').forEach(function (a) {
    a.addEventListener('click', function () { safeSet('banaweer-lang', a.getAttribute('data-set-lang')); });
  });

  /* ---- Sticky header shrink ---- */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!document.body.classList.contains('nav-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Blog: filter, search, pagination ---- */
  var blog = document.querySelector('[data-blog]');
  if (blog) {
    var cards = Array.prototype.slice.call(blog.querySelectorAll('.post-card'));
    var chips = Array.prototype.slice.call(blog.querySelectorAll('.chip'));
    var search = blog.querySelector('#blog-search');
    var pager = blog.querySelector('.pagination');
    var empty = blog.querySelector('.no-results');
    var perPage = parseInt(blog.dataset.perPage, 10) || 6;
    var state = { cat: 'all', q: '', page: 1 };

    var params = new URLSearchParams(location.search);
    if (params.get('category')) state.cat = params.get('category');

    function norm(s) { return (s || '').toLowerCase().replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه'); }

    function render() {
      var matches = cards.filter(function (c) {
        var okCat = state.cat === 'all' || c.dataset.category === state.cat;
        var okQ = !state.q || norm(c.dataset.search).indexOf(norm(state.q)) !== -1;
        return okCat && okQ;
      });
      var pages = Math.max(1, Math.ceil(matches.length / perPage));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * perPage;
      cards.forEach(function (c) { c.hidden = true; });
      matches.slice(start, start + perPage).forEach(function (c) { c.hidden = false; });
      empty.hidden = matches.length > 0;
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.dataset.cat === state.cat)); });

      pager.innerHTML = '';
      pager.hidden = pages <= 1;
      if (pages > 1) {
        var mk = function (label, page, opts) {
          var b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = label;
          if (opts && opts.current) b.setAttribute('aria-current', 'page');
          if (opts && opts.disabled) b.disabled = true;
          if (opts && opts.aria) b.setAttribute('aria-label', opts.aria);
          b.addEventListener('click', function () { state.page = page; render(); blog.scrollIntoView({ behavior: 'smooth' }); });
          pager.appendChild(b);
        };
        mk(blog.dataset.prev, state.page - 1, { disabled: state.page === 1 });
        for (var i = 1; i <= pages; i++) mk(String(i), i, { current: i === state.page });
        mk(blog.dataset.next, state.page + 1, { disabled: state.page === pages });
      }
    }

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.cat = ch.dataset.cat; state.page = 1; render();
        var url = new URL(location.href);
        if (state.cat === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', state.cat);
        history.replaceState(null, '', url);
      });
    });
    if (search) search.addEventListener('input', function () { state.q = search.value.trim(); state.page = 1; render(); });
    render();
  }

  /* ---- Reviews row: previous / next buttons (direction-aware for Arabic) ---- */
  document.querySelectorAll('[data-reviews]').forEach(function (wrap) {
    var track = wrap.querySelector('.reviews-track');
    var nav = wrap.querySelector('.reviews-nav');
    var btns = wrap.querySelectorAll('.reviews-btn');
    var rtl = getComputedStyle(track).direction === 'rtl';
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      nav.hidden = max < 8;
      var pos = Math.abs(track.scrollLeft); // RTL browsers report negative scrollLeft
      btns[0].disabled = pos < 8;
      btns[1].disabled = pos > max - 8;
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var card = track.querySelector('.testimonial');
        var step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
        track.scrollBy({ left: Number(b.dataset.dir) * step * (rtl ? -1 : 1) });
      });
    });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---- Share: copy link ---- */
  document.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var status = btn.parentElement.querySelector('.copy-status');
      var done = function () { if (status) { status.textContent = btn.dataset.copied; setTimeout(function () { status.textContent = ''; }, 2500); } };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () {});
      else { var t = document.createElement('textarea'); t.value = location.href; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
    });
  });

  /* ---- Contact form ---- */
  var form = document.getElementById('contact-form');
  if (form) {
    var startedAt = Date.now();
    var msgs = JSON.parse(form.dataset.messages);
    var endpoint = form.dataset.endpoint;
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('[type="submit"]');

    function toLatinDigits(s) {
      return s.replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
              .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); });
    }
    /* Phone: a country code picker (default +966) plus the national number.
       - Accepts a leading 0 (05...) and strips it.
       - If a full international number is pasted (+971..., 00971..., or 966... for Saudi),
         the matching country is selected and the code is removed from the box. */
    var phoneInput = form.elements.phone;
    var codeSelect = form.elements.country_code;
    var codeLabel = form.querySelector('.phone-code-label');
    var codes = Array.prototype.map.call(codeSelect.options, function (o) { return o.value; })
      .sort(function (a, b) { return b.length - a.length; }); // longest first, so 966 wins over 9x

    function setCode(code) {
      codeSelect.value = code;
      codeLabel.textContent = '+' + code;
      phoneInput.placeholder = code === '966' ? '5X XXX XXXX' : '';
    }
    codeSelect.addEventListener('change', function () {
      setCode(codeSelect.value);
      if (phoneInput.value) validateField('phone');
      phoneInput.focus();
    });

    function splitNumber(raw) {
      var s = toLatinDigits(raw).trim();
      var d = s.replace(/\D/g, '');
      var international = /^\+/.test(s) || d.indexOf('00') === 0;
      if (d.indexOf('00') === 0) d = d.slice(2);
      var code = codeSelect.value;
      if (international) {
        for (var i = 0; i < codes.length; i++) {
          if (d.indexOf(codes[i]) === 0) { code = codes[i]; d = d.slice(codes[i].length); break; }
        }
      } else if (code === '966' && d.indexOf('966') === 0 && d.length > 10) {
        d = d.slice(3); // "966 5x xxx xxxx" typed without +
      }
      if (d.charAt(0) === '0') d = d.slice(1); // national trunk prefix
      return { code: code, number: d };
    }
    function isValidPhone(p) {
      return p.code === '966' ? /^\d{9}$/.test(p.number) : /^\d{6,12}$/.test(p.number);
    }

    phoneInput.addEventListener('input', function () {
      var cleaned = toLatinDigits(phoneInput.value).replace(/[^\d\s+]/g, '');
      if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
    });
    // On leaving the field: pick the country from a pasted code, then tidy the number.
    phoneInput.addEventListener('blur', function () {
      if (!phoneInput.value) return;
      var p = splitNumber(phoneInput.value);
      if (p.code !== codeSelect.value) setCode(p.code);
      if (p.code === '966' && /^\d{9}$/.test(p.number)) {
        phoneInput.value = p.number.slice(0, 2) + ' ' + p.number.slice(2, 5) + ' ' + p.number.slice(5);
      } else if (isValidPhone(p)) {
        phoneInput.value = p.number;
      }
    });
    var rules = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return isValidPhone(splitNumber(v)); },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      type: function (v) { return v !== ''; },
      message: function (v) { return v.trim().length >= 10; }
    };

    function validateField(name) {
      var input = form.elements[name];
      var ok = rules[name](input.value);
      var field = input.closest('.field');
      var err = field.querySelector('.field-error');
      field.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      var msg = msgs[name];
      if (name === 'phone' && codeSelect.value !== '966' && msgs.phoneIntl) msg = msgs.phoneIntl;
      err.textContent = ok ? '' : msg;
      return ok;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener('blur', function () { if (input.value) validateField(name); });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) validateField(name); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = ''; status.classList.remove('is-error');
      var firstBad = null;
      Object.keys(rules).forEach(function (name) { if (!validateField(name) && !firstBad) firstBad = form.elements[name]; });
      if (firstBad) { firstBad.focus(); return; }

      // Spam protection: honeypot field must stay empty, and humans take more than 3 seconds.
      if (form.elements.company.value || Date.now() - startedAt < 3000) {
        status.textContent = msgs.spam; status.classList.add('is-error'); return;
      }

      var data = new FormData(form);
      var phone = splitNumber(String(data.get('phone')));
      data.set('phone', '+' + phone.code + phone.number);
      data.delete('country_code');
      data.delete('company');
      data.append('language', doc.lang);
      data.append('page', location.href);

      submitBtn.disabled = true;
      var label = submitBtn.querySelector('.label');
      var original = label.textContent;
      label.textContent = msgs.sending;

      var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      var request;
      if (endpoint) {
        request = fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            // Some services (e.g. FormSubmit) reply 200 with { success: "false" } on failure.
            return r.json().catch(function () { return {}; }).then(function (json) {
              if (json && (json.success === false || json.success === 'false')) throw new Error(json.message || 'Form service error');
            });
          });
      } else if (isLocal) {
        console.warn('[Banaweer] formEndpoint is empty in config.json. Simulating a successful submission for local testing.');
        request = new Promise(function (res) { setTimeout(res, 700); });
      } else {
        request = Promise.reject(new Error('Form endpoint not configured'));
      }

      request.then(function () {
        form.hidden = true;
        var ok = document.getElementById('form-success');
        ok.hidden = false;
        ok.focus();
      }).catch(function () {
        status.textContent = msgs.send; status.classList.add('is-error');
      }).finally(function () {
        submitBtn.disabled = false; label.textContent = original;
      });
    });
  }
})();
