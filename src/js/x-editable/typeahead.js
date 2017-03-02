/*!
 * typeahead.js 0.9.3
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function ($) {
  const VERSION = '0.9.3';
  const utils = {
    isMsie() {
      const match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
      return match ? parseInt(match[2], 10) : false;
    },
    isBlankString(str) {
      return !str || /^\s*$/.test(str);
    },
    escapeRegExChars(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },
    isString(obj) {
      return typeof obj === 'string';
    },
    isNumber(obj) {
      return typeof obj === 'number';
    },
    isArray: $.isArray,
    isFunction: $.isFunction,
    isObject: $.isPlainObject,
    isUndefined(obj) {
      return typeof obj === 'undefined';
    },
    bind: $.proxy,
    bindAll(obj) {
      let val;
      for (const key in obj) {
        $.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
      }
    },
    indexOf(haystack, needle) {
      for (let i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) {
          return i;
        }
      }
      return -1;
    },
    each: $.each,
    map: $.map,
    filter: $.grep,
    every(obj, test) {
      let result = true;
      if (!obj) {
        return result;
      }
      $.each(obj, (key, val) => {
        if (!(result = test.call(null, val, key, obj))) {
          return false;
        }
      });
      return !!result;
    },
    some(obj, test) {
      let result = false;
      if (!obj) {
        return result;
      }
      $.each(obj, (key, val) => {
        if (result = test.call(null, val, key, obj)) {
          return false;
        }
      });
      return !!result;
    },
    mixin: $.extend,
    getUniqueId: (function () {
      let counter = 0;
      return function () {
        return counter++;
      };
    }()),
    defer(fn) {
      setTimeout(fn, 0);
    },
    debounce(func, wait, immediate) {
      let timeout,
          result;
      return function () {
        let context = this,
            args    = arguments,
            later,
            callNow;
        later = function () {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
          }
        };
        callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
        }
        return result;
      };
    },
    throttle(func, wait) {
      let context,
          args,
          timeout,
          result,
          previous,
          later;
      previous = 0;
      later = function () {
        previous = new Date();
        timeout = null;
        result = func.apply(context, args);
      };
      return function () {
        let now       = new Date(),
            remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
        } else if (!timeout) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },
    tokenizeQuery(str) {
      return $.trim(str).toLowerCase().split(/[\s]+/);
    },
    tokenizeText(str) {
      return $.trim(str).toLowerCase().split(/[\s\-_]+/);
    },
    getProtocol() {
      return location.protocol;
    },
    noop() {
    },
  };
  const EventTarget = (function () {
    const eventSplitter = /\s+/;
    return {
      on(events, callback) {
        let event;
        if (!callback) {
          return this;
        }
        this._callbacks = this._callbacks || {};
        events = events.split(eventSplitter);
        while (event = events.shift()) {
          this._callbacks[event] = this._callbacks[event] || [];
          this._callbacks[event].push(callback);
        }
        return this;
      },
      trigger(events, data) {
        let event,
            callbacks;
        if (!this._callbacks) {
          return this;
        }
        events = events.split(eventSplitter);
        while (event = events.shift()) {
          if (callbacks = this._callbacks[event]) {
            for (let i = 0; i < callbacks.length; i += 1) {
              callbacks[i].call(this, {
                type: event,
                data,
              });
            }
          }
        }
        return this;
      },
    };
  }());
  const EventBus = (function () {
    const namespace = 'typeahead:';

    function EventBus(o) {
      if (!o || !o.el) {
        $.error('EventBus initialized without el');
      }
      this.$el = $(o.el);
    }

    utils.mixin(EventBus.prototype, {
      trigger(type) {
        const args = [].slice.call(arguments, 1);
        this.$el.trigger(namespace + type, args);
      },
    });
    return EventBus;
  }());
  const PersistentStorage = (function () {
    let ls,
        methods;
    try {
      ls = window.localStorage;
      ls.setItem('~~~', '!');
      ls.removeItem('~~~');
    } catch (err) {
      ls = null;
    }
    function PersistentStorage(namespace) {
      this.prefix = ['__', namespace, '__'].join('');
      this.ttlKey = '__ttl__';
      this.keyMatcher = new RegExp(`^${this.prefix}`);
    }

    if (ls && window.JSON) {
      methods = {
        _prefix(key) {
          return this.prefix + key;
        },
        _ttlKey(key) {
          return this._prefix(key) + this.ttlKey;
        },
        get(key) {
          if (this.isExpired(key)) {
            this.remove(key);
          }
          return decode(ls.getItem(this._prefix(key)));
        },
        set(key, val, ttl) {
          if (utils.isNumber(ttl)) {
            ls.setItem(this._ttlKey(key), encode(now() + ttl));
          } else {
            ls.removeItem(this._ttlKey(key));
          }
          return ls.setItem(this._prefix(key), encode(val));
        },
        remove(key) {
          ls.removeItem(this._ttlKey(key));
          ls.removeItem(this._prefix(key));
          return this;
        },
        clear() {
          let i,
              key,
              keys = [],
              len  = ls.length;
          for (i = 0; i < len; i++) {
            if ((key = ls.key(i)).match(this.keyMatcher)) {
              keys.push(key.replace(this.keyMatcher, ''));
            }
          }
          for (i = keys.length; i--;) {
            this.remove(keys[i]);
          }
          return this;
        },
        isExpired(key) {
          const ttl = decode(ls.getItem(this._ttlKey(key)));
          return !!(utils.isNumber(ttl) && now() > ttl);
        },
      };
    } else {
      methods = {
        get: utils.noop,
        set: utils.noop,
        remove: utils.noop,
        clear: utils.noop,
        isExpired: utils.noop,
      };
    }
    utils.mixin(PersistentStorage.prototype, methods);
    return PersistentStorage;
    function now() {
      return new Date().getTime();
    }

    function encode(val) {
      return JSON.stringify(utils.isUndefined(val) ? null : val);
    }

    function decode(val) {
      return JSON.parse(val);
    }
  }());
  const RequestCache = (function () {
    function RequestCache(o) {
      utils.bindAll(this);
      o = o || {};
      this.sizeLimit = o.sizeLimit || 10;
      this.cache = {};
      this.cachedKeysByAge = [];
    }

    utils.mixin(RequestCache.prototype, {
      get(url) {
        return this.cache[url];
      },
      set(url, resp) {
        let requestToEvict;
        if (this.cachedKeysByAge.length === this.sizeLimit) {
          requestToEvict = this.cachedKeysByAge.shift();
          delete this.cache[requestToEvict];
        }
        this.cache[url] = resp;
        this.cachedKeysByAge.push(url);
      },
    });
    return RequestCache;
  }());
  const Transport = (function () {
    let pendingRequestsCount = 0,
        pendingRequests      = {},
        maxPendingRequests,
        requestCache;

    function Transport(o) {
      utils.bindAll(this);
      o = utils.isString(o) ? {
        url: o,
      } : o;
      requestCache = requestCache || new RequestCache();
      maxPendingRequests = utils.isNumber(o.maxParallelRequests) ? o.maxParallelRequests : maxPendingRequests || 6;
      this.url = o.url;
      this.wildcard = o.wildcard || '%QUERY';
      this.filter = o.filter;
      this.replace = o.replace;
      this.ajaxSettings = {
        type: 'get',
        cache: o.cache,
        timeout: o.timeout,
        dataType: o.dataType || 'json',
        beforeSend: o.beforeSend,
      };
      this._get = (/^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce)(this._get, o.rateLimitWait || 300);
    }

    utils.mixin(Transport.prototype, {
      _get(url, cb) {
        const that = this;
        if (belowPendingRequestsThreshold()) {
          this._sendRequest(url).done(done);
        } else {
          this.onDeckRequestArgs = [].slice.call(arguments, 0);
        }
        function done(resp) {
          const data = that.filter ? that.filter(resp) : resp;
          cb && cb(data);
          requestCache.set(url, resp);
        }
      },
      _sendRequest(url) {
        let that  = this,
            jqXhr = pendingRequests[url];
        if (!jqXhr) {
          incrementPendingRequests();
          jqXhr = pendingRequests[url] = $.ajax(url, this.ajaxSettings).always(always);
        }
        return jqXhr;
        function always() {
          decrementPendingRequests();
          pendingRequests[url] = null;
          if (that.onDeckRequestArgs) {
            that._get(...that.onDeckRequestArgs);
            that.onDeckRequestArgs = null;
          }
        }
      },
      get(query, cb) {
        let that         = this,
            encodedQuery = encodeURIComponent(query || ''),
            url,
            resp;
        cb = cb || utils.noop;
        url = this.replace ? this.replace(this.url, encodedQuery) : this.url.replace(this.wildcard, encodedQuery);
        if (resp = requestCache.get(url)) {
          utils.defer(() => {
            cb(that.filter ? that.filter(resp) : resp);
          });
        } else {
          this._get(url, cb);
        }
        return !!resp;
      },
    });
    return Transport;
    function incrementPendingRequests() {
      pendingRequestsCount++;
    }

    function decrementPendingRequests() {
      pendingRequestsCount--;
    }

    function belowPendingRequestsThreshold() {
      return pendingRequestsCount < maxPendingRequests;
    }
  }());
  const Dataset = (function () {
    const keys = {
      thumbprint: 'thumbprint',
      protocol: 'protocol',
      itemHash: 'itemHash',
      adjacencyList: 'adjacencyList',
    };

    function Dataset(o) {
      utils.bindAll(this);
      if (utils.isString(o.template) && !o.engine) {
        $.error('no template engine specified');
      }
      if (!o.local && !o.prefetch && !o.remote) {
        $.error('one of local, prefetch, or remote is required');
      }
      this.name = o.name || utils.getUniqueId();
      this.limit = o.limit || 5;
      this.minLength = o.minLength || 1;
      this.header = o.header;
      this.footer = o.footer;
      this.valueKey = o.valueKey || 'value';
      this.template = compileTemplate(o.template, o.engine, this.valueKey);
      this.local = o.local;
      this.prefetch = o.prefetch;
      this.remote = o.remote;
      this.itemHash = {};
      this.adjacencyList = {};
      this.storage = o.name ? new PersistentStorage(o.name) : null;
    }

    utils.mixin(Dataset.prototype, {
      _processLocalData(data) {
        this._mergeProcessedData(this._processData(data));
      },
      _loadPrefetchData(o) {
        let that       = this,
            thumbprint = VERSION + (o.thumbprint || ''),
            storedThumbprint,
            storedProtocol,
            storedItemHash,
            storedAdjacencyList,
            isExpired,
            deferred;
        if (this.storage) {
          storedThumbprint = this.storage.get(keys.thumbprint);
          storedProtocol = this.storage.get(keys.protocol);
          storedItemHash = this.storage.get(keys.itemHash);
          storedAdjacencyList = this.storage.get(keys.adjacencyList);
        }
        isExpired = storedThumbprint !== thumbprint || storedProtocol !== utils.getProtocol();
        o = utils.isString(o) ? {
          url: o,
        } : o;
        o.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1e3;
        if (storedItemHash && storedAdjacencyList && !isExpired) {
          this._mergeProcessedData({
            itemHash: storedItemHash,
            adjacencyList: storedAdjacencyList,
          });
          deferred = $.Deferred().resolve();
        } else {
          deferred = $.getJSON(o.url).done(processPrefetchData);
        }
        return deferred;
        function processPrefetchData(data) {
          let filteredData  = o.filter ? o.filter(data) : data,
              processedData = that._processData(filteredData),
              itemHash      = processedData.itemHash,
              adjacencyList = processedData.adjacencyList;
          if (that.storage) {
            that.storage.set(keys.itemHash, itemHash, o.ttl);
            that.storage.set(keys.adjacencyList, adjacencyList, o.ttl);
            that.storage.set(keys.thumbprint, thumbprint, o.ttl);
            that.storage.set(keys.protocol, utils.getProtocol(), o.ttl);
          }
          that._mergeProcessedData(processedData);
        }
      },
      _transformDatum(datum) {
        let value  = utils.isString(datum) ? datum : datum[this.valueKey],
            tokens = datum.tokens || utils.tokenizeText(value),
            item   = {
              value,
              tokens,
            };
        if (utils.isString(datum)) {
          item.datum = {};
          item.datum[this.valueKey] = datum;
        } else {
          item.datum = datum;
        }
        item.tokens = utils.filter(item.tokens, token => !utils.isBlankString(token));
        item.tokens = utils.map(item.tokens, token => token.toLowerCase());
        return item;
      },
      _processData(data) {
        let that          = this,
            itemHash      = {},
            adjacencyList = {};
        utils.each(data, (i, datum) => {
          let item = that._transformDatum(datum),
              id   = utils.getUniqueId(item.value);
          itemHash[id] = item;
          utils.each(item.tokens, (i, token) => {
            let character = token.charAt(0),
                adjacency = adjacencyList[character] || (adjacencyList[character] = [id]);
            !~utils.indexOf(adjacency, id) && adjacency.push(id);
          });
        });
        return {
          itemHash,
          adjacencyList,
        };
      },
      _mergeProcessedData(processedData) {
        const that = this;
        utils.mixin(this.itemHash, processedData.itemHash);
        utils.each(processedData.adjacencyList, (character, adjacency) => {
          const masterAdjacency = that.adjacencyList[character];
          that.adjacencyList[character] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency;
        });
      },
      _getLocalSuggestions(terms) {
        let that        = this,
            firstChars  = [],
            lists       = [],
            shortestList,
            suggestions = [];
        utils.each(terms, (i, term) => {
          const firstChar = term.charAt(0);
          !~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar);
        });
        utils.each(firstChars, (i, firstChar) => {
          const list = that.adjacencyList[firstChar];
          if (!list) {
            return false;
          }
          lists.push(list);
          if (!shortestList || list.length < shortestList.length) {
            shortestList = list;
          }
        });
        if (lists.length < firstChars.length) {
          return [];
        }
        utils.each(shortestList, (i, id) => {
          let item = that.itemHash[id],
              isCandidate,
              isMatch;
          isCandidate = utils.every(lists, list => ~utils.indexOf(list, id));
          isMatch = isCandidate && utils.every(terms, term => utils.some(item.tokens, token => token.indexOf(term) === 0));
          isMatch && suggestions.push(item);
        });
        return suggestions;
      },
      initialize() {
        let deferred;
        this.local && this._processLocalData(this.local);
        this.transport = this.remote ? new Transport(this.remote) : null;
        deferred = this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
        this.local = this.prefetch = this.remote = null;
        this.initialize = function () {
          return deferred;
        };
        return deferred;
      },
      getSuggestions(query, cb) {
        let that     = this,
            terms,
            suggestions,
            cacheHit = false;
        if (query.length < this.minLength) {
          return;
        }
        terms = utils.tokenizeQuery(query);
        suggestions = this._getLocalSuggestions(terms).slice(0, this.limit);
        if (suggestions.length < this.limit && this.transport) {
          cacheHit = this.transport.get(query, processRemoteData);
        }
        !cacheHit && cb && cb(suggestions);
        function processRemoteData(data) {
          suggestions = suggestions.slice(0);
          utils.each(data, (i, datum) => {
            let item = that._transformDatum(datum),
                isDuplicate;
            isDuplicate = utils.some(suggestions, suggestion => item.value === suggestion.value);
            !isDuplicate && suggestions.push(item);
            return suggestions.length < that.limit;
          });
          cb && cb(suggestions);
        }
      },
    });
    return Dataset;
    function compileTemplate(template, engine, valueKey) {
      let renderFn,
          compiledTemplate;
      if (utils.isFunction(template)) {
        renderFn = template;
      } else if (utils.isString(template)) {
        compiledTemplate = engine.compile(template);
        renderFn = utils.bind(compiledTemplate.render, compiledTemplate);
      } else {
        renderFn = function (context) {
          return `<p>${context[valueKey]}</p>`;
        };
      }
      return renderFn;
    }
  }());
  const InputView = (function () {
    function InputView(o) {
      const that = this;
      utils.bindAll(this);
      this.specialKeyCodeMap = {
        9: 'tab',
        27: 'esc',
        37: 'left',
        39: 'right',
        13: 'enter',
        38: 'up',
        40: 'down',
      };
      this.$hint = $(o.hint);
      this.$input = $(o.input).on('blur.tt', this._handleBlur).on('focus.tt', this._handleFocus).on('keydown.tt', this._handleSpecialKeyEvent);
      if (!utils.isMsie()) {
        this.$input.on('input.tt', this._compareQueryToInputValue);
      } else {
        this.$input.on('keydown.tt keypress.tt cut.tt paste.tt', ($e) => {
          if (that.specialKeyCodeMap[$e.which || $e.keyCode]) {
            return;
          }
          utils.defer(that._compareQueryToInputValue);
        });
      }
      this.query = this.$input.val();
      this.$overflowHelper = buildOverflowHelper(this.$input);
    }

    utils.mixin(InputView.prototype, EventTarget, {
      _handleFocus() {
        this.trigger('focused');
      },
      _handleBlur() {
        this.trigger('blured');
      },
      _handleSpecialKeyEvent($e) {
        const keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
        keyName && this.trigger(`${keyName}Keyed`, $e);
      },
      _compareQueryToInputValue() {
        let inputValue                  = this.getInputValue(),
            isSameQuery                 = compareQueries(this.query, inputValue),
            isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
        if (isSameQueryExceptWhitespace) {
          this.trigger('whitespaceChanged', {
            value: this.query,
          });
        } else if (!isSameQuery) {
          this.trigger('queryChanged', {
            value: this.query = inputValue,
          });
        }
      },
      destroy() {
        this.$hint.off('.tt');
        this.$input.off('.tt');
        this.$hint = this.$input = this.$overflowHelper = null;
      },
      focus() {
        this.$input.focus();
      },
      blur() {
        this.$input.blur();
      },
      getQuery() {
        return this.query;
      },
      setQuery(query) {
        this.query = query;
      },
      getInputValue() {
        return this.$input.val();
      },
      setInputValue(value, silent) {
        this.$input.val(value);
        !silent && this._compareQueryToInputValue();
      },
      getHintValue() {
        return this.$hint.val();
      },
      setHintValue(value) {
        this.$hint.val(value);
      },
      getLanguageDirection() {
        return (this.$input.css('direction') || 'ltr').toLowerCase();
      },
      isOverflow() {
        this.$overflowHelper.text(this.getInputValue());
        return this.$overflowHelper.width() > this.$input.width();
      },
      isCursorAtEnd() {
        let valueLength    = this.$input.val().length,
            selectionStart = this.$input[0].selectionStart,
            range;
        if (utils.isNumber(selectionStart)) {
          return selectionStart === valueLength;
        } else if (document.selection) {
          range = document.selection.createRange();
          range.moveStart('character', -valueLength);
          return valueLength === range.text.length;
        }
        return true;
      },
    });
    return InputView;
    function buildOverflowHelper($input) {
      return $('<span></span>').css({
        position: 'absolute',
        left: '-9999px',
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        fontFamily: $input.css('font-family'),
        fontSize: $input.css('font-size'),
        fontStyle: $input.css('font-style'),
        fontVariant: $input.css('font-variant'),
        fontWeight: $input.css('font-weight'),
        wordSpacing: $input.css('word-spacing'),
        letterSpacing: $input.css('letter-spacing'),
        textIndent: $input.css('text-indent'),
        textRendering: $input.css('text-rendering'),
        textTransform: $input.css('text-transform'),
      }).insertAfter($input);
    }

    function compareQueries(a, b) {
      a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
      b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
      return a === b;
    }
  }());
  const DropdownView = (function () {
    let html = {
          suggestionsList: '<span class="tt-suggestions"></span>',
        },
        css  = {
          suggestionsList: {
            display: 'block',
          },
          suggestion: {
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          },
          suggestionChild: {
            whiteSpace: 'normal',
          },
        };

    function DropdownView(o) {
      utils.bindAll(this);
      this.isOpen = false;
      this.isEmpty = true;
      this.isMouseOverDropdown = false;
      this.$menu = $(o.menu).on('mouseenter.tt', this._handleMouseenter).on('mouseleave.tt', this._handleMouseleave).on('click.tt', '.tt-suggestion', this._handleSelection).on('mouseover.tt', '.tt-suggestion', this._handleMouseover);
    }

    utils.mixin(DropdownView.prototype, EventTarget, {
      _handleMouseenter() {
        this.isMouseOverDropdown = true;
      },
      _handleMouseleave() {
        this.isMouseOverDropdown = false;
      },
      _handleMouseover($e) {
        const $suggestion = $($e.currentTarget);
        this._getSuggestions().removeClass('tt-is-under-cursor');
        $suggestion.addClass('tt-is-under-cursor');
      },
      _handleSelection($e) {
        const $suggestion = $($e.currentTarget);
        this.trigger('suggestionSelected', extractSuggestion($suggestion));
      },
      _show() {
        this.$menu.css('display', 'block');
      },
      _hide() {
        this.$menu.hide();
      },
      _moveCursor(increment) {
        let $suggestions,
            $cur,
            nextIndex,
            $underCursor;
        if (!this.isVisible()) {
          return;
        }
        $suggestions = this._getSuggestions();
        $cur = $suggestions.filter('.tt-is-under-cursor');
        $cur.removeClass('tt-is-under-cursor');
        nextIndex = $suggestions.index($cur) + increment;
        nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
        if (nextIndex === -1) {
          this.trigger('cursorRemoved');
          return;
        } else if (nextIndex < -1) {
          nextIndex = $suggestions.length - 1;
        }
        $underCursor = $suggestions.eq(nextIndex).addClass('tt-is-under-cursor');
        this._ensureVisibility($underCursor);
        this.trigger('cursorMoved', extractSuggestion($underCursor));
      },
      _getSuggestions() {
        return this.$menu.find('.tt-suggestions > .tt-suggestion');
      },
      _ensureVisibility($el) {
        let menuHeight    = this.$menu.height() + parseInt(this.$menu.css('paddingTop'), 10) + parseInt(this.$menu.css('paddingBottom'), 10),
            menuScrollTop = this.$menu.scrollTop(),
            elTop         = $el.position().top,
            elBottom      = elTop + $el.outerHeight(true);
        if (elTop < 0) {
          this.$menu.scrollTop(menuScrollTop + elTop);
        } else if (menuHeight < elBottom) {
          this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
        }
      },
      destroy() {
        this.$menu.off('.tt');
        this.$menu = null;
      },
      isVisible() {
        return this.isOpen && !this.isEmpty;
      },
      closeUnlessMouseIsOverDropdown() {
        if (!this.isMouseOverDropdown) {
          this.close();
        }
      },
      close() {
        if (this.isOpen) {
          this.isOpen = false;
          this.isMouseOverDropdown = false;
          this._hide();
          this.$menu.find('.tt-suggestions > .tt-suggestion').removeClass('tt-is-under-cursor');
          this.trigger('closed');
        }
      },
      open() {
        if (!this.isOpen) {
          this.isOpen = true;
          !this.isEmpty && this._show();
          this.trigger('opened');
        }
      },
      setLanguageDirection(dir) {
        let ltrCss = {
              left: '0',
              right: 'auto',
            },
            rtlCss = {
              left: 'auto',
              right: ' 0',
            };
        dir === 'ltr' ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss);
      },
      moveCursorUp() {
        this._moveCursor(-1);
      },
      moveCursorDown() {
        this._moveCursor(+1);
      },
      getSuggestionUnderCursor() {
        const $suggestion = this._getSuggestions().filter('.tt-is-under-cursor').first();
        return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
      },
      getFirstSuggestion() {
        const $suggestion = this._getSuggestions().first();
        return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
      },
      renderSuggestions(dataset, suggestions) {
        let datasetClassName = `tt-dataset-${dataset.name}`,
            wrapper          = '<div class="tt-suggestion">%body</div>',
            compiledHtml,
            $suggestionsList,
            $dataset         = this.$menu.find(`.${datasetClassName}`),
            elBuilder,
            fragment,
            $el;
        if ($dataset.length === 0) {
          $suggestionsList = $(html.suggestionsList).css(css.suggestionsList);
          $dataset = $('<div></div>').addClass(datasetClassName).append(dataset.header).append($suggestionsList).append(dataset.footer).appendTo(this.$menu);
        }
        if (suggestions.length > 0) {
          this.isEmpty = false;
          this.isOpen && this._show();
          elBuilder = document.createElement('div');
          fragment = document.createDocumentFragment();
          utils.each(suggestions, (i, suggestion) => {
            suggestion.dataset = dataset.name;
            compiledHtml = dataset.template(suggestion.datum);
            elBuilder.innerHTML = wrapper.replace('%body', compiledHtml);
            $el = $(elBuilder.firstChild).css(css.suggestion).data('suggestion', suggestion);
            $el.children().each(function () {
              $(this).css(css.suggestionChild);
            });
            fragment.appendChild($el[0]);
          });
          $dataset.show().find('.tt-suggestions').html(fragment);
        } else {
          this.clearSuggestions(dataset.name);
        }
        this.trigger('suggestionsRendered');
      },
      clearSuggestions(datasetName) {
        let $datasets    = datasetName ? this.$menu.find(`.tt-dataset-${datasetName}`) : this.$menu.find('[class^="tt-dataset-"]'),
            $suggestions = $datasets.find('.tt-suggestions');
        $datasets.hide();
        $suggestions.empty();
        if (this._getSuggestions().length === 0) {
          this.isEmpty = true;
          this._hide();
        }
      },
    });
    return DropdownView;
    function extractSuggestion($el) {
      return $el.data('suggestion');
    }
  }());
  const TypeaheadView = (function () {
    let html = {
          wrapper: '<span class="twitter-typeahead"></span>',
          hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
          dropdown: '<span class="tt-dropdown-menu"></span>',
        },
        css  = {
          wrapper: {
            position: 'relative',
            display: 'inline-block',
          },
          hint: {
            position: 'absolute',
            top: '0',
            left: '0',
            borderColor: 'transparent',
            boxShadow: 'none',
          },
          query: {
            position: 'relative',
            verticalAlign: 'top',
            backgroundColor: 'transparent',
          },
          dropdown: {
            position: 'absolute',
            top: '100%',
            left: '0',
            zIndex: '100',
            display: 'none',
          },
        };
    if (utils.isMsie()) {
      utils.mixin(css.query, {
        backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)',
      });
    }
    if (utils.isMsie() && utils.isMsie() <= 7) {
      utils.mixin(css.wrapper, {
        display: 'inline',
        zoom: '1',
      });
      utils.mixin(css.query, {
        marginTop: '-1px',
      });
    }
    function TypeaheadView(o) {
      let $menu,
          $input,
          $hint;
      utils.bindAll(this);
      this.$node = buildDomStructure(o.input);
      this.datasets = o.datasets;
      this.dir = null;
      this.eventBus = o.eventBus;
      $menu = this.$node.find('.tt-dropdown-menu');
      $input = this.$node.find('.tt-query');
      $hint = this.$node.find('.tt-hint');
      this.dropdownView = new DropdownView({
        menu: $menu,
      }).on('suggestionSelected', this._handleSelection).on('cursorMoved', this._clearHint).on('cursorMoved', this._setInputValueToSuggestionUnderCursor).on('cursorRemoved', this._setInputValueToQuery).on('cursorRemoved', this._updateHint).on('suggestionsRendered', this._updateHint).on('opened', this._updateHint).on('closed', this._clearHint).on('opened closed', this._propagateEvent);
      this.inputView = new InputView({
        input: $input,
        hint: $hint,
      }).on('focused', this._openDropdown).on('blured', this._closeDropdown).on('blured', this._setInputValueToQuery).on('enterKeyed tabKeyed', this._handleSelection).on('queryChanged', this._clearHint).on('queryChanged', this._clearSuggestions).on('queryChanged', this._getSuggestions).on('whitespaceChanged', this._updateHint).on('queryChanged whitespaceChanged', this._openDropdown).on('queryChanged whitespaceChanged', this._setLanguageDirection).on('escKeyed', this._closeDropdown).on('escKeyed', this._setInputValueToQuery).on('tabKeyed upKeyed downKeyed', this._managePreventDefault).on('upKeyed downKeyed', this._moveDropdownCursor).on('upKeyed downKeyed', this._openDropdown).on('tabKeyed leftKeyed rightKeyed', this._autocomplete);
    }

    utils.mixin(TypeaheadView.prototype, EventTarget, {
      _managePreventDefault(e) {
        let $e             = e.data,
            hint,
            inputValue,
            preventDefault = false;
        switch (e.type) {
          case 'tabKeyed':
            hint = this.inputView.getHintValue();
            inputValue = this.inputView.getInputValue();
            preventDefault = hint && hint !== inputValue;
            break;

          case 'upKeyed':
          case 'downKeyed':
            preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
            break;
        }
        preventDefault && $e.preventDefault();
      },
      _setLanguageDirection() {
        const dir = this.inputView.getLanguageDirection();
        if (dir !== this.dir) {
          this.dir = dir;
          this.$node.css('direction', dir);
          this.dropdownView.setLanguageDirection(dir);
        }
      },
      _updateHint() {
        let suggestion        = this.dropdownView.getFirstSuggestion(),
            hint              = suggestion ? suggestion.value : null,
            dropdownIsVisible = this.dropdownView.isVisible(),
            inputHasOverflow  = this.inputView.isOverflow(),
            inputValue,
            query,
            escapedQuery,
            beginsWithQuery,
            match;
        if (hint && dropdownIsVisible && !inputHasOverflow) {
          inputValue = this.inputView.getInputValue();
          query = inputValue.replace(/\s{2,}/g, ' ').replace(/^\s+/g, '');
          escapedQuery = utils.escapeRegExChars(query);
          beginsWithQuery = new RegExp(`^(?:${escapedQuery})(.*$)`, 'i');
          match = beginsWithQuery.exec(hint);
          this.inputView.setHintValue(inputValue + (match ? match[1] : ''));
        }
      },
      _clearHint() {
        this.inputView.setHintValue('');
      },
      _clearSuggestions() {
        this.dropdownView.clearSuggestions();
      },
      _setInputValueToQuery() {
        this.inputView.setInputValue(this.inputView.getQuery());
      },
      _setInputValueToSuggestionUnderCursor(e) {
        const suggestion = e.data;
        this.inputView.setInputValue(suggestion.value, true);
      },
      _openDropdown() {
        this.dropdownView.open();
      },
      _closeDropdown(e) {
        this.dropdownView[e.type === 'blured' ? 'closeUnlessMouseIsOverDropdown' : 'close']();
      },
      _moveDropdownCursor(e) {
        const $e = e.data;
        if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
          this.dropdownView[e.type === 'upKeyed' ? 'moveCursorUp' : 'moveCursorDown']();
        }
      },
      _handleSelection(e) {
        let byClick    = e.type === 'suggestionSelected',
            suggestion = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
        if (suggestion) {
          this.inputView.setInputValue(suggestion.value);
          byClick ? this.inputView.focus() : e.data.preventDefault();
          byClick && utils.isMsie() ? utils.defer(this.dropdownView.close) : this.dropdownView.close();
          this.eventBus.trigger('selected', suggestion.datum, suggestion.dataset);
        }
      },
      _getSuggestions() {
        let that  = this,
            query = this.inputView.getQuery();
        if (utils.isBlankString(query)) {
          return;
        }
        utils.each(this.datasets, (i, dataset) => {
          dataset.getSuggestions(query, (suggestions) => {
            if (query === that.inputView.getQuery()) {
              that.dropdownView.renderSuggestions(dataset, suggestions);
            }
          });
        });
      },
      _autocomplete(e) {
        let isCursorAtEnd,
            ignoreEvent,
            query,
            hint,
            suggestion;
        if (e.type === 'rightKeyed' || e.type === 'leftKeyed') {
          isCursorAtEnd = this.inputView.isCursorAtEnd();
          ignoreEvent = this.inputView.getLanguageDirection() === 'ltr' ? e.type === 'leftKeyed' : e.type === 'rightKeyed';
          if (!isCursorAtEnd || ignoreEvent) {
            return;
          }
        }
        query = this.inputView.getQuery();
        hint = this.inputView.getHintValue();
        if (hint !== '' && query !== hint) {
          suggestion = this.dropdownView.getFirstSuggestion();
          this.inputView.setInputValue(suggestion.value);
          this.eventBus.trigger('autocompleted', suggestion.datum, suggestion.dataset);
        }
      },
      _propagateEvent(e) {
        this.eventBus.trigger(e.type);
      },
      destroy() {
        this.inputView.destroy();
        this.dropdownView.destroy();
        destroyDomStructure(this.$node);
        this.$node = null;
      },
      setQuery(query) {
        this.inputView.setQuery(query);
        this.inputView.setInputValue(query);
        this._clearHint();
        this._clearSuggestions();
        this._getSuggestions();
      },
    });
    return TypeaheadView;
    function buildDomStructure(input) {
      let $wrapper  = $(html.wrapper),
          $dropdown = $(html.dropdown),
          $input    = $(input),
          $hint     = $(html.hint);
      $wrapper = $wrapper.css(css.wrapper);
      $dropdown = $dropdown.css(css.dropdown);
      $hint.css(css.hint).css({
        backgroundAttachment: $input.css('background-attachment'),
        backgroundClip: $input.css('background-clip'),
        backgroundColor: $input.css('background-color'),
        backgroundImage: $input.css('background-image'),
        backgroundOrigin: $input.css('background-origin'),
        backgroundPosition: $input.css('background-position'),
        backgroundRepeat: $input.css('background-repeat'),
        backgroundSize: $input.css('background-size'),
      });
      $input.data('ttAttrs', {
        dir: $input.attr('dir'),
        autocomplete: $input.attr('autocomplete'),
        spellcheck: $input.attr('spellcheck'),
        style: $input.attr('style'),
      });
      $input.addClass('tt-query').attr({
        autocomplete: 'off',
        spellcheck: false,
      }).css(css.query);
      try {
        !$input.attr('dir') && $input.attr('dir', 'auto');
      } catch (e) {
      }
      return $input.wrap($wrapper).parent().prepend($hint).append($dropdown);
    }

    function destroyDomStructure($node) {
      const $input = $node.find('.tt-query');
      utils.each($input.data('ttAttrs'), (key, val) => {
        utils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
      });
      $input.detach().removeData('ttAttrs').removeClass('tt-query').insertAfter($node);
      $node.remove();
    }
  }());
  (function () {
    let cache   = {},
        viewKey = 'ttView',
        methods;
    methods = {
      initialize(datasetDefs) {
        let datasets;
        datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];
        if (datasetDefs.length === 0) {
          $.error('no datasets provided');
        }
        datasets = utils.map(datasetDefs, (o) => {
          const dataset = cache[o.name] ? cache[o.name] : new Dataset(o);
          if (o.name) {
            cache[o.name] = dataset;
          }
          return dataset;
        });
        return this.each(initialize);
        function initialize() {
          let $input   = $(this),
              deferreds,
              eventBus = new EventBus({
                el: $input,
              });
          deferreds = utils.map(datasets, dataset => dataset.initialize());
          $input.data(viewKey, new TypeaheadView({
            input: $input,
            eventBus: eventBus = new EventBus({
              el: $input,
            }),
            datasets,
          }));
          $.when(...deferreds).always(() => {
            utils.defer(() => {
              eventBus.trigger('initialized');
            });
          });
        }
      },
      destroy() {
        return this.each(destroy);
        function destroy() {
          let $this = $(this),
              view  = $this.data(viewKey);
          if (view) {
            view.destroy();
            $this.removeData(viewKey);
          }
        }
      },
      setQuery(query) {
        return this.each(setQuery);
        function setQuery() {
          const view = $(this).data(viewKey);
          view && view.setQuery(query);
        }
      },
    };
    jQuery.fn.typeahead = function (method) {
      if (methods[method]) {
        return methods[method].apply(this, [].slice.call(arguments, 1));
      }
      return methods.initialize.apply(this, arguments);

    };
  }());
}(window.jQuery));
