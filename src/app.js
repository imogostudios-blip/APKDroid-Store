(() => {
  const { useState, useEffect, useRef, useCallback } = React;
  const _mem = {};
  let _idb = null;
  const IDB_NAME = "apkdroid_store";
  const IDB_STORE = "kv";
  const _openIdb = () => new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE);
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const _idbPut = (k, v) => {
    if (!_idb) return;
    try {
      _idb.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(v, k);
    } catch (e) {
    }
  };
  const _idbDel = (k) => {
    if (!_idb) return;
    try {
      _idb.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).delete(k);
    } catch (e) {
    }
  };
  const getS = (k, d) => {
    if (!Object.prototype.hasOwnProperty.call(_mem, k)) return d;
    const v = _mem[k];
    return v == null ? d : v;
  };
  const setS = (k, v) => {
    _mem[k] = v;
    _idbPut(k, v);
    return true;
  };
  const delS = (k) => {
    delete _mem[k];
    _idbDel(k);
  };
  const listS = (prefix) => {
    const out = [];
    for (const k in _mem) {
      if (k.indexOf(prefix) === 0) out.push(k);
    }
    return out;
  };
  const wipeStore = () => {
    try {
      Object.keys(_mem).forEach((k) => delete _mem[k]);
    } catch (e) {
    }
    try {
      if (_idb) _idb.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).clear();
    } catch (e) {
    }
    try {
      localStorage.clear();
    } catch (e) {
    }
    try {
      sessionStorage.clear();
    } catch (e) {
    }
    try {
      location.hash = "#/";
    } catch (e) {
    }
    location.reload();
  };
  const _bootStore = async () => {
    try {
      _idb = await _openIdb();
      await new Promise((res) => {
        const tx = _idb.transaction(IDB_STORE, "readonly");
        const st = tx.objectStore(IDB_STORE);
        const req = st.getAllKeys();
        req.onsuccess = () => {
          const keys = req.result || [];
          if (!keys.length) {
            res();
            return;
          }
          let left = keys.length;
          keys.forEach((k) => {
            const g = st.get(k);
            g.onsuccess = () => {
              _mem[k] = g.result;
              if (--left <= 0) res();
            };
            g.onerror = () => {
              if (--left <= 0) res();
            };
          });
        };
        req.onerror = () => res();
      });
    } catch (e) {
    }
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("apk_") === 0) keys.push(k);
      }
      keys.forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(_mem, k)) {
          try {
            const raw = localStorage.getItem(k);
            if (raw != null && raw !== "") _mem[k] = JSON.parse(raw);
            _idbPut(k, _mem[k]);
          } catch (e) {
          }
        }
        try {
          localStorage.removeItem(k);
        } catch (e) {
        }
      });
    } catch (e) {
    }
    try {
      _lang = getS("apk_lang", _lang || "ar");
    } catch (e) {
    }
  };
  const STORE_LOGO_SRC = "res/icons/icon-source.png";
  const slimApp = (a) => !a ? null : { trackId: a.trackId, trackName: a.trackName || "", artistName: a.artistName || "", artworkUrl100: a.artworkUrl100 || a.artworkUrl60 || "", artworkUrl512: a.artworkUrl512 || a.artworkUrl100 || "", averageUserRating: a.averageUserRating, formattedPrice: a.formattedPrice, primaryGenreName: a.primaryGenreName || "", fileSizeBytes: a.fileSizeBytes, screenshotUrls: (a.screenshotUrls || []).slice(0, 1) };
  const slimSong = (s) => !s ? null : { trackId: s.trackId, trackName: s.trackName || "", artistName: s.artistName || "", artworkUrl100: s.artworkUrl100 || s.artworkUrl60 || "", previewUrl: s.previewUrl || "", duration: s.duration || 0 };
  const loadFavs = () => {
    const v = getS("apk_favorites", []);
    return Array.isArray(v) ? v.filter(Boolean) : [];
  };
  const loadSongFavs = () => {
    const v = getS("apk_song_favs", []);
    return Array.isArray(v) ? v.filter(Boolean) : [];
  };
  const saveFavs = (list) => {
    const n = (list || []).map(slimApp).filter(Boolean);
    setS("apk_favorites", n);
    return n;
  };
  const saveSongFavs = (list) => {
    const n = (list || []).map(slimSong).filter(Boolean);
    setS("apk_song_favs", n);
    return n;
  };
  const STRINGS = {
    ar: {
      menu: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
      top_rated: "\u0627\u0644\u0623\u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645\u0627\u064B",
      favorites: "\u0627\u0644\u0645\u0641\u0636\u0644\u0629",
      games: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628",
      music: "\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649",
      settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      terms: "\u0628\u0646\u0648\u062F \u0627\u0644\u062E\u062F\u0645\u0629",
      privacy: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629",
      search_placeholder: "\u0627\u0628\u062D\u062B \u0639\u0646 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0623\u0644\u0639\u0627\u0628",
      search_apps: "Search apps & games",
      nav_games: "\u0623\u0644\u0639\u0627\u0628",
      nav_apps: "\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      nav_search: "\u0628\u062D\u062B",
      nav_library: "\u0645\u0643\u062A\u0628\u0629",
      nav_you: "\u0627\u0646\u062A",
      featured: "\u0645\u0645\u064A\u0632",
      top_free_apps: "\u0623\u0641\u0636\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629",
      productivity: "\u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629",
      education: "\u0627\u0644\u062A\u0639\u0644\u064A\u0645",
      entertainment: "\u0627\u0644\u062A\u0631\u0641\u064A\u0647",
      top_paid_apps: "\u0623\u0641\u0636\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0645\u062F\u0641\u0648\u0639\u0629",
      see_all: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
      top_game: "\u0623\u0641\u0636\u0644 \u0644\u0639\u0628\u0629",
      top_free_games: "\u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629",
      action_games: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0623\u0643\u0634\u0646",
      recent_searches: "\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0623\u062E\u064A\u0631\u0629",
      back: "\u0631\u062C\u0648\u0639",
      install: "\u062A\u062B\u0628\u064A\u062A",
      description: "\u0627\u0644\u0648\u0635\u0641",
      more: "\u0627\u0644\u0645\u0632\u064A\u062F",
      less: "\u0623\u0642\u0644",
      ratings_reviews: "\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0627\u062A",
      ratings_count: "\u062A\u0642\u064A\u064A\u0645",
      comments: "\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A",
      loading_reviews: "\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A...",
      no_reviews: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0645\u062A\u0627\u062D\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642.",
      show_more: "\u0627\u0644\u0645\u0632\u064A\u062F",
      hide_reviews: "\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A",
      loading: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
      info: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A",
      version: "\u0627\u0644\u0625\u0635\u062F\u0627\u0631",
      last_update: "\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B",
      size: "\u0627\u0644\u062D\u062C\u0645",
      age_rating: "\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628",
      developer: "\u0627\u0644\u0645\u0637\u0648\u0631",
      category: "\u0627\u0644\u062A\u0635\u0646\u064A\u0641",
      you_might_like: "\u0642\u062F \u064A\u0639\u062C\u0628\u0643 \u0623\u064A\u0636\u0627\u064B",
      share_via: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0639\u0628\u0631",
      share_bt: "\u0639\u0628\u0631 \u0628\u0644\u0648\u062A\u0648\u062B",
      share_qs: "Quick Share",
      share_copy: "\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637",
      share_wa: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628",
      share_tg: "\u062A\u0644\u064A\u062C\u0631\u0627\u0645",
      share_ig: "\u0627\u0646\u0633\u062A\u062C\u0631\u0627\u0645",
      share_fb: "\u0641\u064A\u0633\u0628\u0648\u0643",
      share_gh: "GitHub",
      toast_copied: "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637",
      toast_ig: "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637\u060C \u0627\u0644\u0635\u0642\u0647 \u0641\u064A \u0627\u0646\u0633\u062A\u062C\u0631\u0627\u0645",
      toast_bt: "\u0645\u064A\u0632\u0629 \u0627\u0644\u0628\u0644\u0648\u062A\u0648\u062B \u062A\u062A\u0637\u0644\u0628 \u062C\u0647\u0627\u0632\u0627\u064B \u062F\u0627\u0639\u0645\u0627\u064B",
      toast_qs: "Quick Share \u0645\u062A\u0627\u062D \u0639\u0644\u0649 \u0623\u062C\u0647\u0632\u0629 \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629",
      library: "\u0627\u0644\u0645\u0643\u062A\u0628\u0629",
      reset_data: "\u062D\u0630\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646",
      reset_data_desc: "\u062D\u0630\u0641 \u0643\u0644 \u0634\u064A\u0621 \u0648\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0623\u0648\u0644",
      reset_confirm: "\u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0645\u062A\u0627\u0628\u0639\u0629\u061F",
      lock_protect: "\u0627\u0644\u0642\u0641\u0644 \u0648\u0627\u0644\u062D\u0645\u0627\u064A\u0629",
      lock_protect_desc: "\u0642\u0641\u0644 \u0627\u0644\u0645\u062A\u062C\u0631 \u0623\u0648 \u0642\u0641\u0644 \u0635\u0641\u062D\u0629 \u062A\u062B\u0628\u064A\u062A \u062A\u0637\u0628\u064A\u0642",
      lock_general: "\u0627\u0644\u0642\u0641\u0644 \u0627\u0644\u0639\u0627\u0645 \u0644\u0644\u062A\u0637\u0628\u064A\u0642",
      lock_named: "\u0645\u0646\u0639 \u062F\u062E\u0648\u0644 \u0635\u0641\u062D\u0629 \u062A\u062B\u0628\u064A\u062A \u062A\u0637\u0628\u064A\u0642",
      lock_named_hint: "\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0623\u0648 \u0627\u0644\u0635\u0642\u0647",
      lock_choose: "\u0646\u0648\u0639 \u0627\u0644\u0642\u0641\u0644",
      lock_pin: "\u0642\u0641\u0644 PIN",
      lock_pattern: "\u0642\u0641\u0644 \u0646\u0642\u0634",
      lock_pass: "\u0642\u0641\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      lock_enter: "\u0623\u062F\u062E\u0644 \u0627\u0644\u0642\u0641\u0644",
      lock_again: "\u0623\u0639\u062F \u0627\u0644\u0625\u062F\u062E\u0627\u0644 \u0644\u0644\u062A\u0623\u0643\u064A\u062F",
      lock_mismatch: "\u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u060C \u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629",
      lock_wrong: "\u0627\u0644\u0642\u0641\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D",
      lock_set: "\u062A\u0645 \u0636\u0628\u0637 \u0627\u0644\u0642\u0641\u0644",
      lock_off: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0642\u0641\u0644",
      lock_forgot: "\u0646\u0633\u064A\u062A \u0627\u0644\u0642\u0641\u0644\u061F \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u062A\u062C\u0631",
      lock_name_ph: "\u0627\u0633\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642",
      archive: "\u0623\u0631\u0634\u0641\u0629",
      archives: "\u0627\u0644\u0623\u0631\u0634\u064A\u0641",
      archive_pin: "\u062A\u062B\u0628\u064A\u062A \u0641\u064A \u0627\u0644\u0623\u0639\u0644\u0649",
      archive_unpin: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062B\u0628\u064A\u062A",
      archive_empty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0623\u0631\u0634\u064A\u0641",
      archive_one: "\u0623\u0631\u0634\u064A\u0641",
      no_favs: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0641\u0636\u0644\u0627\u062A \u0628\u0639\u062F",
      no_favs_hint: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0642\u0644\u0628 \u0641\u064A \u0623\u064A \u062A\u0637\u0628\u064A\u0642 \u0644\u062D\u0641\u0638\u0647",
      top_songs: "\u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u063A\u0627\u0646\u064A",
      results: "\u0627\u0644\u0646\u062A\u0627\u0626\u062C",
      search_songs: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0623\u063A\u0627\u0646\u064A",
      settings_title: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      store_country: "\u062F\u0648\u0644\u0629 \u0645\u062A\u062C\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      appearance: "\u0627\u0644\u0645\u0638\u0647\u0631",
      light: "\u0641\u0627\u062A\u062D",
      dark: "\u062F\u0627\u0643\u0646",
      language: "\u0627\u0644\u0644\u063A\u0629",
      lang_ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      lang_en: "English",
      footer_line1: "APKDroid Store \u2014 \u0646\u0633\u062E\u0629 HTML \u0648\u0627\u062D\u062F\u0629",
      footer_line2: "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u0646 iTunes \xB7 \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0645\u0646 Audius. \u0628\u062F\u0648\u0646 \u0625\u0639\u0644\u0627\u0646\u0627\u062A.",
      sec_best: "\u0627\u0644\u0623\u0641\u0636\u0644",
      sec_for_you: "\u0645\u0646 \u0623\u062C\u0644\u0643",
      sec_social: "\u0627\u0644\u062A\u0648\u0627\u0635\u0644",
      sec_most_dl: "\u0627\u0644\u0623\u0643\u062B\u0631 \u062A\u062D\u0645\u064A\u0644\u0627\u064B",
      g_most_dl: "\u0627\u0644\u0623\u0643\u062B\u0631 \u062A\u062D\u0645\u064A\u0644\u0627\u064B",
      g_br: "\u0623\u0644\u0639\u0627\u0628 \u0628\u0627\u062A\u0644 \u0631\u0648\u064A\u0627\u0644",
      g_sandbox: "\u0623\u0644\u0639\u0627\u0628 \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0631\u0645\u0644",
      g_tanks: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062F\u0628\u0627\u0628\u0627\u062A",
      g_adventure: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0645\u063A\u0627\u0645\u0631\u0627\u062A",
      g_popular: "\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u064A\u0648\u0639\u0627\u064B",
      g_horror: "\u0623\u0644\u0639\u0627\u0628 \u0631\u0639\u0628",
      g_kids: "\u0623\u0644\u0639\u0627\u0628 \u0623\u0637\u0641\u0627\u0644",
      g_rpg: "\u0623\u0644\u0639\u0627\u0628 \u062A\u0642\u0645\u0635 \u0627\u0644\u0623\u062F\u0648\u0627\u0631",
      g_strategy: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629",
      g_sim: "\u0623\u0644\u0639\u0627\u0628 \u0645\u062D\u0627\u0643\u0627\u0629 \u0648\u0634\u0627\u062D\u0646\u0627\u062A",
      g_puzzle: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0630\u0643\u0627\u0621",
      exp_mode: "\u0648\u0636\u0639 \u0627\u0644\u062A\u062C\u0631\u0628\u0629",
      exp_mode_desc: "\u0635\u0648\u0631\u0629 \u062F\u0639\u0627\u0626\u064A\u0629 \u0645\u0646 \u0644\u0642\u0637\u0629 \u0627\u0644\u0634\u0627\u0634\u0629 \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u062B\u0628\u064A\u062A",
      style2: "\u0633\u062A\u0627\u064A\u0644 \u0623\u0632\u0631\u0642 \u0628\u062F\u0648\u0646 \u062F\u0639\u0627\u0626\u064A\u0629",
      style2_desc: "\u0645\u0637\u0641\u0623: \u0633\u062A\u0627\u064A\u0644 \u0623\u062E\u0636\u0631 \u0645\u0639 \u062F\u0639\u0627\u0626\u064A\u0629 \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \xB7 \u0645\u0641\u0639\u0651\u0644: \u0633\u062A\u0627\u064A\u0644 \u0623\u0632\u0631\u0642 \u0628\u062F\u0648\u0646 \u062F\u0639\u0627\u0626\u064A\u0629",
      style_classic: "\u0627\u0644\u0633\u062A\u0627\u064A\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A",
      style_blue: "\u0633\u062A\u0627\u064A\u0644 2",
      style_look: "\u0633\u062A\u0627\u064A\u0644 \u0627\u0644\u0645\u062A\u062C\u0631",
      style_look_off: "\u0633\u062A\u0627\u064A\u0644 \u0623\u062E\u0636\u0631 \u0645\u0639 \u062F\u0639\u0627\u0626\u064A\u0629",
      style_look_on: "\u0633\u062A\u0627\u064A\u0644 \u0623\u0632\u0631\u0642 \u062F\u0648\u0646 \u062F\u0639\u0627\u0626\u064A\u0629",
      req_title: "\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642",
      req_confirm: "\u062A\u0623\u0643\u064A\u062F",
      req_cancel: "\u0625\u0644\u063A\u0627\u0621",
      req_open_store: "\u0641\u062A\u062D \u0641\u064A \u0645\u062A\u062C\u0631 \u0645\u062D\u0644\u064A",
      req_open_play: "\u0641\u062A\u062D \u0641\u064A Google Play",
      req_open_files: "\u0641\u062A\u062D \u0627\u0644\u0645\u0644\u0641\u0627\u062A",
      reinstall: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062B\u0628\u064A\u062A",
      req_money: "\u0642\u062F \u064A\u0643\u0644\u0641\u0643 \u0647\u0630\u0627 \u0645\u0627\u0644\u0627\u064B",
      req_wifi: "\u0642\u062F \u064A\u062A\u0645\u0643\u0646 \u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u0646 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0634\u0628\u0643\u0629 Wi\u2011Fi",
      req_storage: "\u0642\u062F \u064A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0642\u0631\u0635 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u062D\u0644\u064A",
      req_notify: "\u0642\u062F \u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0625\u0630\u0646 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
      req_vibrate: "\u0642\u062F \u064A\u062A\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0631\u062A\u062C\u0627\u062C \u0627\u0644\u062C\u0647\u0627\u0632",
      req_system: "\u0642\u062F \u064A\u062A\u0645\u0643\u0646 \u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0646\u0638\u0627\u0645",
      req_note: "\u0645\u0644\u0627\u062D\u0638\u0629: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0645\u0639\u0631\u0641\u0629 \u0645\u0627 \u0627\u0644\u0630\u064A \u0642\u062F \u064A\u0637\u0644\u0628 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u0646 \u0623\u0630\u0648\u0646\u0627\u062A. \u0647\u0630\u0647 \u0627\u0644\u0627\u062D\u062A\u0645\u0627\u0644\u0627\u062A \u0644\u064A\u0633\u062A \u0645\u0624\u0643\u062F\u0629!",
      dl_manager: "\u0625\u062F\u0627\u0631\u0629 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u062A\u0646\u0632\u064A\u0644",
      dl_active: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0646\u0632\u064A\u0644",
      dl_done: "\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u0646\u0627\u062C\u062D\u0629",
      dl_empty_active: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0645\u0644\u064A\u0627\u062A \u062A\u0646\u0632\u064A\u0644 \u062C\u0627\u0631\u064A\u0629",
      dl_empty_done: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0646\u0632\u064A\u0644\u0627\u062A \u0645\u0643\u062A\u0645\u0644\u0629",
      dl_progress: "\u0627\u0644\u062A\u0642\u062F\u0645",
      dl_spinning: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0636\u064A\u0631\u2026",
      dl_complete: "\u0645\u0643\u062A\u0645\u0644",
      search_log: "\u0633\u062C\u0644 \u0627\u0644\u0628\u062D\u062B",
      search_log_empty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0633\u062C\u0644 \u0628\u062D\u062B",
      select_all: "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0643\u0644",
      delete_sel: "\u062D\u0630\u0641",
      delete_confirm: "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u062D\u062F\u062F\u0629\u061F",
      delete_one_confirm: "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0635\u0631 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629\u061F",
      fav_apps: "\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      fav_songs: "\u0645\u0648\u0633\u064A\u0642\u0649",
      type_apps: "\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      type_music: "\u0645\u0648\u0633\u064A\u0642\u0649",
      type_games: "\u0623\u0644\u0639\u0627\u0628",
      app_not_found: "\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F",
      years_old: "\u0633\u0646\u0629",
      load_timeout: "\u0627\u0633\u062A\u063A\u0631\u0642 \u062C\u0644\u0628 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0642\u062A \u0623\u0637\u0648\u0644 \u0645\u0645\u0627 \u064A\u062C\u0628 \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u062A\u0635\u0627\u0644\u0643 \u0628\u0627\u0644\u062E\u0627\u062F\u0645",
      retry_load: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629",
      choose_country: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0628\u0644\u062F",
      country_blocked: "\u0628\u0644\u062F\u0643 \u0645\u062D\u0638\u0648\u0631 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0628\u0644\u062F\u0643 \u0645\u0646 \u0647\u0646\u0627",
      choose_platform: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629",
      choose_store: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u062A\u062C\u0631",
      platform_android: "Android",
      platform_ios: "iOS",
      platform_windows: "Windows",
      back_platforms: "\u0631\u062C\u0648\u0639 \u0644\u0644\u0645\u0646\u0635\u0627\u062A",
      categories: "\u0627\u0644\u0641\u0626\u0627\u062A",
      cat_games: "\u0623\u0644\u0639\u0627\u0628",
      cat_productivity: "\u0625\u0646\u062A\u0627\u062C\u064A\u0629",
      cat_education: "\u062A\u0639\u0644\u064A\u0645",
      cat_entertainment: "\u062A\u0631\u0641\u064A\u0647",
      cat_social: "\u0627\u062C\u062A\u0645\u0627\u0639\u064A",
      cat_photo: "\u0635\u0648\u0631 \u0648\u0641\u064A\u062F\u064A\u0648",
      cat_music: "\u0645\u0648\u0633\u064A\u0642\u0649",
      cat_shopping: "\u062A\u0633\u0648\u0642",
      cat_finance: "\u0645\u0627\u0644\u064A\u0629",
      cat_health: "\u0635\u062D\u0629",
      cat_news: "\u0623\u062E\u0628\u0627\u0631",
      cat_travel: "\u0633\u0641\u0631",
      cat_food: "\u0637\u0639\u0627\u0645",
      cat_sports: "\u0631\u064A\u0627\u0636\u0629",
      cat_weather: "\u0637\u0642\u0633",
      cat_utilities: "\u0623\u062F\u0648\u0627\u062A",
      cat_business: "\u0623\u0639\u0645\u0627\u0644",
      cat_lifestyle: "\u0646\u0645\u0637 \u062D\u064A\u0627\u0629",
      cat_books: "\u0643\u062A\u0628",
      cat_kids: "\u0623\u0637\u0641\u0627\u0644",
      now_playing: "\u0627\u0644\u0622\u0646 \u064A\u0639\u0645\u0644",
      download_song: "\u062A\u062D\u0645\u064A\u0644",
      equalizer: "\u0627\u0644\u0645\u0639\u0627\u062F\u0644",
      eq_on: "\u0645\u0641\u0639\u0651\u0644",
      eq_off: "\u0645\u0639\u0637\u0651\u0644",
      master_volume: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A",
      eq_title: "\u0627\u0644\u0645\u0639\u0627\u062F\u0644 \u0648\u0627\u0644\u062A\u0623\u062B\u064A\u0631\u0627\u062A",
      store_direct: "\u0645\u0628\u0627\u0634\u0631",
      store_direct_hint: "\u062A\u062D\u0645\u064A\u0644 APK \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u062F\u0648\u0646 \u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u062E\u0627\u0631\u062C\u064A\u0629",
      api_search_app: "API Search Application",
      api_search_app_desc: "\u0627\u062E\u062A\u0631 \u0645\u0635\u062F\u0631 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0644\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      store_play: "Google Play Store",
      store_happymod: "HappyMod",
      store_uptodown: "Uptodown",
      dl_resolving: "\u062C\u0627\u0631\u064A \u062C\u0644\u0628 \u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u2026",
      dl_fetch_badge: "\u062C\u0627\u0631\u064A \u062C\u0644\u0628 \u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u062D\u0645\u064A\u0644",
      dl_run_badge: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644",
      dl_direct_ok: "\u0628\u062F\u0623 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
      dl_direct_fail: "\u062A\u0639\u0630\u0631 \u0625\u064A\u062C\u0627\u062F \u0631\u0627\u0628\u0637 \u0645\u0628\u0627\u0634\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642",
      more_options: "\u062E\u064A\u0627\u0631\u0627\u062A",
      toggle_theme: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062B\u064A\u0645",
      ads_suggested: "\u0625\u0639\u0644\u0627\u0646 \u2022 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0643",
      suggested_for_you: "\u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0643",
      ad_label: "\u0625\u0639\u0644\u0627\u0646",
      account: "\u0627\u0644\u062D\u0633\u0627\u0628",
      manage_account: "\u0625\u062F\u0627\u0631\u0629 \u062D\u0633\u0627\u0628\u0643 \u0639\u0644\u0649 APKDroid Store",
      edit_profile: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
      profile_name: "\u0627\u0644\u0627\u0633\u0645",
      profile_photo: "\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
      save_profile: "\u062D\u0641\u0638",
      theme_black: "\u0623\u0633\u0648\u062F",
      night_mode: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A",
      theme_dim: "\u0645\u0639\u062A\u0645",
      chip_all: "\u0627\u0644\u0643\u0644",
      night_mode_desc: "\u0623\u0648\u0644\u0648\u064A\u0629 \u0639\u0644\u0649 \u0643\u0644 \u0627\u0644\u0633\u062A\u0627\u064A\u0644\u0627\u062A \u2014 \u0623\u0633\u0648\u062F \u0648\u0623\u0628\u064A\u0636 \u0648\u0631\u0645\u0627\u062F\u064A",
      choose_theme: "\u0627\u0644\u0645\u0638\u0647\u0631",
      pages_menu: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      guest_name: "\u062D\u0633\u0627\u0628\u0643",
      change_photo: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0635\u0648\u0631\u0629",
      dt_share: "\u0645\u0634\u0627\u0631\u0643\u0629",
      dt_open_in: "\u0627\u0644\u0641\u062A\u062D \u0641\u064A...",
      dt_theme: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062B\u064A\u0645",
      dt_info: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0639\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642",
      dt_save: "\u062D\u0641\u0638 \u0641\u064A \u0627\u0644\u0645\u0643\u062A\u0628\u0629",
      dt_unsave: "\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0643\u062A\u0628\u0629",
      dt_close: "\u0625\u063A\u0644\u0627\u0642",
      dt_yes: "\u0646\u0639\u0645",
      dt_no: "\u0644\u0627"
    },
    en: {
      menu: "Menu",
      home: "Home",
      top_rated: "Top Rated",
      favorites: "Favorites",
      games: "Games",
      music: "Music",
      settings: "Settings",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      search_placeholder: "Search apps & games",
      search_apps: "Search apps & games",
      nav_games: "Games",
      nav_apps: "Apps",
      nav_search: "Search",
      nav_library: "Library",
      nav_you: "You",
      featured: "Featured",
      top_free_apps: "Top Free Apps",
      productivity: "Productivity",
      education: "Education",
      entertainment: "Entertainment",
      top_paid_apps: "Top Paid Apps",
      see_all: "See All",
      top_game: "Top Game",
      top_free_games: "Top Free Games",
      action_games: "Action Games",
      recent_searches: "RECENT SEARCHES",
      back: "Back",
      install: "Install",
      description: "Description",
      more: "More",
      less: "Less",
      ratings_reviews: "Ratings & Reviews",
      ratings_count: "ratings",
      comments: "Reviews",
      loading_reviews: "Loading reviews...",
      no_reviews: "No reviews available for this app.",
      show_more: "More",
      hide_reviews: "Hide reviews",
      loading: "Loading...",
      info: "Information",
      version: "Version",
      last_update: "Last Updated",
      size: "Size",
      age_rating: "Age Rating",
      developer: "Developer",
      category: "Category",
      you_might_like: "You Might Also Like",
      share_via: "Share via",
      share_bt: "Bluetooth",
      share_qs: "Quick Share",
      share_copy: "Copy link",
      share_wa: "WhatsApp",
      share_tg: "Telegram",
      share_ig: "Instagram",
      share_fb: "Facebook",
      share_gh: "GitHub",
      toast_copied: "Link copied",
      toast_ig: "Link copied \u2014 paste it in Instagram",
      toast_bt: "Bluetooth requires a supported device",
      toast_qs: "Quick Share is available on supported Android devices",
      library: "Library",
      reset_data: "Delete data and reset",
      reset_data_desc: "Erase everything and return to first-time setup",
      reset_confirm: "All data will be deleted. Continue?",
      lock_protect: "Lock and protection",
      lock_protect_desc: "Lock the store or an app install page",
      lock_general: "App lock",
      lock_named: "Lock an app install page",
      lock_named_hint: "Type or paste the app name",
      lock_choose: "Lock type",
      lock_pin: "PIN lock",
      lock_pattern: "Pattern lock",
      lock_pass: "Password lock",
      lock_enter: "Enter lock",
      lock_again: "Enter again to confirm",
      lock_mismatch: "Did not match, try again",
      lock_wrong: "Wrong lock",
      lock_set: "Lock saved",
      lock_off: "Remove lock",
      lock_forgot: "Forgot lock? Reset store",
      lock_name_ph: "App name",
      archive: "Archive",
      archives: "Archives",
      archive_pin: "Pin to top",
      archive_unpin: "Unpin",
      archive_empty: "No archives",
      archive_one: "Archive",
      no_favs: "No favorites yet",
      no_favs_hint: "Tap the heart on any app to save it",
      top_songs: "Top Songs",
      results: "Results",
      search_songs: "Search songs",
      settings_title: "Settings",
      store_country: "App Store Country",
      appearance: "Appearance",
      light: "Light",
      dark: "Dark",
      language: "Language",
      lang_ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      lang_en: "English",
      footer_line1: "APKDroid Store \u2014 Single HTML edition",
      footer_line2: "Apps from iTunes \xB7 Music from Audius. No ads.",
      sec_best: "Best",
      sec_for_you: "For You",
      sec_social: "Communication",
      sec_most_dl: "Most Downloaded",
      g_most_dl: "Most Downloaded",
      g_br: "Battle Royale",
      g_sandbox: "Sandbox Games",
      g_tanks: "Tank Games",
      g_adventure: "Adventure Games",
      g_popular: "Most Popular",
      g_horror: "Horror Games",
      g_kids: "Kids Games",
      g_rpg: "Role-Playing Games",
      g_strategy: "Strategy Games",
      g_sim: "Simulation & Trucks",
      g_puzzle: "Puzzle Games",
      exp_mode: "Experimental Mode",
      exp_mode_desc: "Promo banner from screenshot on install page",
      style2: "Blue style without promo",
      style2_desc: "Off: green style with promo banner on the install page \xB7 On: blue style without promo",
      style_classic: "Classic style",
      style_blue: "Style 2",
      style_look: "Store style",
      style_look_off: "Green style with promo",
      style_look_on: "Blue style without promo",
      req_title: "App requirements",
      req_confirm: "Confirm",
      req_cancel: "Cancel",
      req_open_store: "Open in local store",
      req_open_play: "Open in Google Play",
      req_open_files: "Open files",
      reinstall: "Reinstall",
      req_money: "This may cost you money",
      req_wifi: "This app may access the Wi\u2011Fi network",
      req_storage: "This app may request access to local storage",
      req_notify: "This app may require notification permission",
      req_vibrate: "This app may access device vibration",
      req_system: "This app may modify system settings",
      req_note: "Note: It is not possible to know which permissions the app may request. These possibilities are not confirmed!",
      dl_manager: "Download Manager",
      dl_active: "Downloading",
      dl_done: "Completed downloads",
      dl_empty_active: "No active downloads",
      dl_empty_done: "No completed downloads",
      dl_progress: "Progress",
      dl_spinning: "Preparing\u2026",
      dl_complete: "Complete",
      search_log: "Search history",
      search_log_empty: "No search history",
      select_all: "Select all",
      delete_sel: "Delete",
      delete_confirm: "Delete selected items?",
      delete_one_confirm: "Remove this item from favorites?",
      fav_apps: "Apps",
      fav_songs: "Music",
      type_apps: "Apps",
      type_music: "Music",
      type_games: "Games",
      app_not_found: "App not found",
      years_old: "Years Old",
      load_timeout: "Fetching content took longer than expected. Check your connection to the server",
      retry_load: "Retry",
      choose_country: "Choose country",
      country_blocked: "Your country is blocked. You cannot continue. You can change your country from here",
      choose_platform: "Choose platform",
      choose_store: "Choose store",
      platform_android: "Android",
      platform_ios: "iOS",
      platform_windows: "Windows",
      back_platforms: "Back to platforms",
      categories: "Categories",
      cat_games: "Games",
      cat_productivity: "Productivity",
      cat_education: "Education",
      cat_entertainment: "Entertainment",
      cat_social: "Social",
      cat_photo: "Photo & Video",
      cat_music: "Music",
      cat_shopping: "Shopping",
      cat_finance: "Finance",
      cat_health: "Health",
      cat_news: "News",
      cat_travel: "Travel",
      cat_food: "Food",
      cat_sports: "Sports",
      cat_weather: "Weather",
      cat_utilities: "Utilities",
      cat_business: "Business",
      cat_lifestyle: "Lifestyle",
      cat_books: "Books",
      cat_kids: "Kids",
      now_playing: "Now Playing",
      download_song: "Download",
      equalizer: "Equalizer",
      eq_on: "On",
      eq_off: "Off",
      master_volume: "Master Volume",
      eq_title: "Equalizer & Effects",
      store_direct: "Direct",
      store_direct_hint: "Download the APK directly without opening another page",
      api_search_app: "API Search Application",
      api_search_app_desc: "Choose the default install source for apps",
      store_play: "Google Play Store",
      store_happymod: "HappyMod",
      store_uptodown: "Uptodown",
      dl_resolving: "Fetching a direct download link\u2026",
      dl_fetch_badge: "Fetching download link",
      dl_run_badge: "Downloading",
      dl_direct_ok: "Direct download started",
      dl_direct_fail: "Could not find a direct link for this app",
      more_options: "Options",
      toggle_theme: "Toggle theme",
      ads_suggested: "Ad \u2022 Suggested ads for you",
      suggested_for_you: "Suggested for you",
      ad_label: "Ad",
      account: "Account",
      manage_account: "Manage your APKDroid Store account",
      edit_profile: "Edit profile",
      profile_name: "Name",
      profile_photo: "Profile photo",
      save_profile: "Save",
      theme_black: "Black",
      night_mode: "Night mode",
      theme_dim: "Dim",
      chip_all: "All",
      night_mode_desc: "Overrides every style with black, white and gray",
      choose_theme: "Appearance",
      pages_menu: "Menu",
      guest_name: "Your account",
      change_photo: "Change photo",
      dt_share: "Share",
      dt_open_in: "Open in...",
      dt_theme: "Change theme",
      dt_info: "App info",
      dt_save: "Save to library",
      dt_unsave: "Remove from library",
      dt_close: "Close",
      dt_yes: "Yes",
      dt_no: "No"
    }
  };
  let _lang = "ar";
  const t = (k) => STRINGS[_lang] && STRINGS[_lang][k] || STRINGS.en[k] || k;
  const setLangGlobal = (l) => {
    _lang = l;
    setS("apk_lang", l);
  };
  const TTL = 30 * 60 * 1e3;
  async function fetchC(url) {
    const key = "apk_" + btoa(unescape(encodeURIComponent(url))).replace(/=+$/, "").slice(-70);
    const c = getS(key, null);
    if (c && Date.now() - c.ts < TTL) return c.data;
    const r = await fetch(url);
    if (!r.ok) throw new Error("fail");
    const d = await r.json();
    setS(key, { ts: Date.now(), data: d });
    return d;
  }
  const country = () => getS("apk_country", "us");
  const pushSearchHist = (term, type = "apps") => {
    const t2 = String(term || "").trim();
    if (!t2) return;
    const prev = getS("apk_search_log", []);
    const id = type + "|" + t2.toLowerCase();
    const next = [{ id, term: t2, type, ts: Date.now() }, ...prev.filter((x) => x && x.id !== id)].slice(0, 100);
    setS("apk_search_log", next);
    const terms = [t2, ...getS("apk_search_history", []).filter((x) => x !== t2)].slice(0, 20);
    setS("apk_search_history", terms);
  };
  const getSearchLog = () => getS("apk_search_log", []);
  const DL_SPIN_MS = 8e3;
  const DL_CIRC = 2 * Math.PI * 45;
  const dlDurationMs = (bytes) => {
    const b = Number(bytes) || 0;
    const MB = 1024 * 1024;
    if (b > 1024 * MB) return 28 * 60 * 1e3;
    if (b > 700 * MB) return 20 * 60 * 1e3;
    if (b > 500 * MB) return 16 * 60 * 1e3;
    if (b > 300 * MB) return 12 * 60 * 1e3;
    return 9 * 60 * 1e3;
  };
  const dlKey = (id) => "apk_dl_" + id;
  const getDlRec = (id) => getS(dlKey(id), null);
  const startDlRec = (id, sizeBytes, meta = {}, force = false) => {
    const cur = getDlRec(id);
    if (!force && cur && cur.startMs) {
      const p = computeDlProgress(cur);
      if (p.phase !== "done" && p.phase !== "idle") return { rec: cur, fresh: false };
    }
    const rec = {
      startMs: Date.now(),
      spinMs: DL_SPIN_MS,
      dlMs: dlDurationMs(sizeBytes),
      postSpinMs: DL_SPIN_MS,
      sizeBytes: Number(sizeBytes) || 0,
      trackId: id,
      trackName: meta.trackName || "",
      artworkUrl100: meta.artworkUrl100 || "",
      installHref: meta.installHref || ""
    };
    setS(dlKey(id), rec);
    return { rec, fresh: true };
  };
  const clearDlRec = (id) => {
    delS(dlKey(id));
  };
  const listAllDownloads = () => {
    const out = [];
    try {
      listS("apk_dl_").forEach((k) => {
        const rec = getS(k, null);
        if (rec && rec.startMs) out.push({ ...rec, trackId: rec.trackId || k.slice(7) });
      });
    } catch (e) {
    }
    return out.sort((a, b) => (b.startMs || 0) - (a.startMs || 0));
  };
  const isPaidApp = (app) => {
    if (!app) return false;
    const price = Number(app.price);
    if (!isNaN(price) && price > 0) return true;
    const f = String(app.formattedPrice || "").trim().toLowerCase();
    if (!f) return false;
    if (["free", "get", "\u0645\u062C\u0627\u0646\u064A", "gratis", "0", "$0", "$0.00", "0.00"].includes(f)) return false;
    if (f.indexOf("free") >= 0 || f.indexOf("\u0645\u062C\u0627\u0646\u064A") >= 0) return false;
    if (/[0-9]/.test(f)) return true;
    return false;
  };
  const openNativePlayStore = (name) => {
    const q = encodeURIComponent(name || "");
    const market = `market://search?q=${q}&c=apps`;
    const intent = `intent://search?q=${q}&c=apps#Intent;scheme=market;package=com.android.vending;end`;
    try {
      window.location.href = market;
    } catch (e) {
      try {
        window.location.href = intent;
      } catch (e2) {
        window.location.href = `https://play.google.com/store/search?q=${q}&c=apps`;
      }
    }
  };
  const computeDlProgress = (rec, now) => {
    if (!rec || !rec.startMs) return { active: false, phase: "idle", pct: 0, overall: 0, ring: false };
    const t2 = typeof now === "number" ? now : Date.now();
    const dlMs = rec.dlMs || 9 * 60 * 1e3;
    const postMs = rec.postSpinMs || DL_SPIN_MS;
    if (!rec.runMs) return { active: true, phase: "spin", pct: 0, overall: 0, ring: true };
    const dlElapsed = Math.max(0, t2 - rec.runMs);
    const total = Math.max(1, dlMs + postMs);
    const overall = Math.min(1, dlElapsed / total);
    if (dlElapsed < dlMs) return { active: true, phase: "download", pct: Math.min(1, dlElapsed / dlMs), overall, ring: true };
    const postElapsed = dlElapsed - dlMs;
    if (postElapsed < postMs) return { active: true, phase: "postspin", pct: 1, overall, ring: true };
    return { active: true, phase: "done", pct: 1, overall: 1, ring: false };
  };
  const api = {
    search: (t2, l = 25) => fetchC(`https://itunes.apple.com/search?term=${encodeURIComponent(t2)}&entity=software&limit=${l}&country=${country()}`).then((d) => d.results || []),
    lookup: (id) => fetchC(`https://itunes.apple.com/lookup?id=${id}&country=${country()}`).then((d) => {
      var _a;
      return ((_a = d.results) == null ? void 0 : _a[0]) || null;
    }),
    top: () => fetchC(`https://itunes.apple.com/search?term=app&entity=software&limit=30&country=${country()}`).then((d) => d.results || []),
    cat: (t2, g, l = 20) => fetchC(`https://itunes.apple.com/search?term=${encodeURIComponent(t2)}&entity=software&genreId=${g}&limit=${l}&country=${country()}`).then((d) => d.results || []),
    // Full tracks via Audius (not 30s iTunes previews)
    songs: async (t2, l = 25) => {
      const appName = "APKDroidStore";
      const base = "https://api.audius.co/v1";
      const url = t2 && String(t2).trim() ? `${base}/tracks/search?query=${encodeURIComponent(t2)}&app_name=${appName}&limit=${l}` : `${base}/tracks/trending?app_name=${appName}&limit=${l}`;
      const d = await fetchC(url);
      const list = Array.isArray(d == null ? void 0 : d.data) ? d.data : [];
      return list.filter((x) => x && x.id && x.is_streamable !== false).map((x) => ({
        trackId: x.id,
        trackName: x.title || "Untitled",
        artistName: x.user && x.user.name || "Unknown Artist",
        artworkUrl100: x.artwork && (x.artwork["480x480"] || x.artwork["1000x1000"] || x.artwork["150x150"]) || "",
        artworkUrl60: x.artwork && x.artwork["150x150"] || "",
        previewUrl: `${base}/tracks/${x.id}/stream?app_name=${appName}`,
        duration: x.duration || 0
      }));
    }
  };
  const GENRES = { games: { id: 6014, term: "game" }, productivity: { id: 6007, term: "productivity" }, education: { id: 6017, term: "education" }, entertainment: { id: 6016, term: "entertainment" } };
  const SEARCH_CATEGORIES = [
    { k: "cat_games", term: "game", gid: 6014, color: "#EA4335", icon: "gamepad" },
    { k: "cat_productivity", term: "productivity", gid: 6007, color: "#4285F4", icon: "briefcase" },
    { k: "cat_education", term: "education", gid: 6017, color: "#34A853", icon: "book" },
    { k: "cat_entertainment", term: "entertainment", gid: 6016, color: "#FBBC04", icon: "clapper" },
    { k: "cat_social", term: "social", gid: 6005, color: "#E4405F", icon: "users" },
    { k: "cat_photo", term: "photo video", gid: 6008, color: "#9C27B0", icon: "camera" },
    { k: "cat_music", term: "music", gid: 6011, color: "#FF5722", icon: "music" },
    { k: "cat_shopping", term: "shopping", gid: 6024, color: "#00BCD4", icon: "bag" },
    { k: "cat_finance", term: "finance", gid: 6015, color: "#00897B", icon: "dollar" },
    { k: "cat_health", term: "health fitness", gid: 6013, color: "#E91E63", icon: "heart" },
    { k: "cat_news", term: "news", gid: 6009, color: "#607D8B", icon: "news" },
    { k: "cat_travel", term: "travel", gid: 6003, color: "#3F51B5", icon: "plane" },
    { k: "cat_food", term: "food drink", gid: 6023, color: "#FF9800", icon: "food" },
    { k: "cat_sports", term: "sports", gid: 6004, color: "#4CAF50", icon: "ball" },
    { k: "cat_weather", term: "weather", gid: 6001, color: "#03A9F4", icon: "cloud" },
    { k: "cat_utilities", term: "utilities", gid: 6002, color: "#795548", icon: "wrench" },
    { k: "cat_business", term: "business", gid: 6e3, color: "#455A64", icon: "chart" },
    { k: "cat_lifestyle", term: "lifestyle", gid: 6012, color: "#8BC34A", icon: "leaf" },
    { k: "cat_books", term: "books", gid: 6018, color: "#673AB7", icon: "bookopen" },
    { k: "cat_kids", term: "kids", gid: 6061, color: "#FF4081", icon: "smile" }
  ];
  const Icon = ({ name, className = "w-5 h-5" }) => {
    const p = {
      home: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })),
      search: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })),
      mic: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", stroke: "none", d: "M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z" })),
      heart: /* @__PURE__ */ React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" }),
      person: /* @__PURE__ */ React.createElement("path", { fill: "currentColor", stroke: "none", d: "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z" }),
      bookmark: /* @__PURE__ */ React.createElement("path", { fill: "currentColor", stroke: "none", d: "M11.539 17.112C11.876 16.937 12.288 16.967 12.6 17.2L17.4 20.8C18.06 21.294 19 20.824 19 20V5C19 3.895 18.105 3 17 3H7C5.895 3 5 3.895 5 5V20C5 20.824 5.94 21.294 6.6 20.8L11.4 17.2L11.539 17.112ZM21 20C21 22.472 18.178 23.883 16.2 22.4L12 19.249L7.8 22.4C5.822 23.883 3 22.472 3 20V5C3 2.791 4.791 1 7 1H17C19.209 1 21 2.791 21 5V20Z" }),
      bookmarkFill: /* @__PURE__ */ React.createElement("path", { fill: "currentColor", stroke: "none", d: "M3 5C3 2.791 4.791 1 7 1H17C19.209 1 21 2.791 21 5V20C21 22.472 18.178 23.883 16.2 22.4L12 19.25L7.8 22.4C5.822 23.883 3 22.472 3 20V5Z" }),
      game: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "12", x2: "10", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "10", x2: "8", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "15", y1: "13", x2: "15.01", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "11", x2: "18.01", y2: "11" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" })),
      head: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 18v-6a9 9 0 0118 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" })),
      moon: /* @__PURE__ */ React.createElement("path", { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" }),
      sun: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "5" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })),
      star: /* @__PURE__ */ React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }),
      x: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
      left: /* @__PURE__ */ React.createElement("polyline", { points: "15 18 9 12 15 6" }),
      play: /* @__PURE__ */ React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" }),
      pause: /* @__PURE__ */ React.createElement("g", { fill: "currentColor", stroke: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M23,7H9C7.9,7,7,7.9,7,9v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9C25,7.9,24.1,7,23,7z M23,23H9V9h14V23z" }), /* @__PURE__ */ React.createElement("path", { d: "M23,7H9C7.9,7,7,7.9,7,9v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9C25,7.9,24.1,7,23,7z" })),
      dl: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })),
      gear: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" })),
      hist: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 3v5h5" }), /* @__PURE__ */ React.createElement("path", { d: "M3.05 13A9 9 0 106 5.3L3 8" }), /* @__PURE__ */ React.createElement("path", { d: "M12 7v5l4 2" })),
      phone: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "2", width: "14", height: "20", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "18", x2: "12.01", y2: "18" })),
      prev: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("polygon", { points: "19 20 9 12 19 4 19 20" }), /* @__PURE__ */ React.createElement("line", { x1: "5", y1: "19", x2: "5", y2: "5" })),
      next: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("polygon", { points: "5 4 15 12 5 20 5 4" }), /* @__PURE__ */ React.createElement("line", { x1: "19", y1: "5", x2: "19", y2: "19" })),
      download: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })),
      eq: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "21", x2: "4", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "10", x2: "4", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "21", x2: "20", y2: "16" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "12", x2: "20", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "14", x2: "7", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "9", y1: "8", x2: "15", y2: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "17", y1: "16", x2: "23", y2: "16" })),
      dots: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "5", r: "1.8", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.8", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "19", r: "1.8", fill: "currentColor", stroke: "none" })),
      folder: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" })),
      arrowRight: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 5 19 12 12 19" })),
      info: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })),
      external: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ React.createElement("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    };
    if (name === "pause") return /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 32 32", fill: "currentColor" }, p.pause);
    return /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, p[name] || null);
  };
  const Stars = ({ r = 0, s = "w-3 h-3" }) => /* @__PURE__ */ React.createElement("div", { className: "flex gap-0.5 text-amber-400" }, [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement(Icon, { key: i, name: "star", className: `${s} ${i <= Math.round(r) ? "fill-current" : "opacity-30"}` })));
  const SmartImg = ({ src, alt = "", className = "", eager, onClick }) => /* @__PURE__ */ React.createElement("img", { src: src || "", alt, className: className || "", loading: eager ? "eager" : "lazy", onClick });
  const AppCard = ({ app, onClick, small }) => {
    if (!app) return null;
    const img = app.artworkUrl100 || app.artworkUrl60;
    if (small) {
      return /* @__PURE__ */ React.createElement("button", { onClick: () => onClick(app), className: "flex flex-col w-[120px] shrink-0 text-left group" }, /* @__PURE__ */ React.createElement(SmartImg, { src: img, kind: "icon", className: "w-[120px] h-[120px] rounded-[24px] object-cover shadow-sm border border-[hsl(var(--border))] bg-muted group-hover:shadow-md transition-all" }), /* @__PURE__ */ React.createElement("div", { className: "mt-2 flex flex-col" }, /* @__PURE__ */ React.createElement("h3", { className: "font-medium text-[13px] leading-tight line-clamp-2" }, app.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-muted-foreground truncate mt-0.5" }, app.primaryGenreName || app.artistName)));
    }
    return /* @__PURE__ */ React.createElement("button", { onClick: () => onClick(app), className: "flex items-center gap-3 w-full p-3 hover:bg-[hsl(var(--muted))]/50 rounded-xl text-left transition" }, /* @__PURE__ */ React.createElement(SmartImg, { src: img, kind: "icon", className: "w-14 h-14 rounded-2xl bg-muted shadow-sm object-cover border border-[hsl(var(--border))]" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-medium truncate text-sm" }, app.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-muted-foreground truncate text-xs" }, app.artistName), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-1" }, /* @__PURE__ */ React.createElement(Stars, { r: app.averageUserRating }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-muted-foreground" }, app.formattedPrice || "Free"))));
  };
  const HScroll = ({ title, children, onSeeAll, ltr, rtl, pad, free }) => /* @__PURE__ */ React.createElement("section", { className: "mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-4 mb-3" }, /* @__PURE__ */ React.createElement("h2", { className: "font-semibold text-lg" }, title), onSeeAll && /* @__PURE__ */ React.createElement("button", { onClick: onSeeAll, className: "text-sm text-primary font-medium" }, t("see_all"))), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${free ? "" : "snap-x snap-mandatory"} ${pad || "px-4"}`,
      style: rtl ? { direction: "rtl" } : ltr ? { direction: "ltr" } : void 0
    },
    children
  ));
  const Skel = ({ c }) => /* @__PURE__ */ React.createElement("div", { className: `animate-pulse bg-muted rounded-2xl ${c}` });
  let _navMoved = false;
  window.addEventListener("hashchange", () => {
    _navMoved = true;
  });
  const useHash = () => {
    const [r, setR] = useState(() => location.hash.slice(1) || "/");
    useEffect(() => {
      const f = () => setR(location.hash.slice(1) || "/");
      window.addEventListener("hashchange", f);
      return () => window.removeEventListener("hashchange", f);
    }, []);
    return [r, (p) => {
      location.hash = p;
    }];
  };
  const PersonMark = ({ className = "w-6 h-6" }) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, height: "24", viewBox: "0 -960 960 960", width: "24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z" }));
  const TopNav = ({ nav, isDetail, onOpenAccount, route, photo }) => {
    const showChips = !isDetail && (route === "/" || route === "" || route === "/games" || (route || "").startsWith("/category/"));
    const chips = route === "/games" || (route || "").startsWith("/category/") && GAME_SECTIONS.some((g) => route.indexOf(encodeURIComponent(g.term)) >= 0 || route.indexOf(g.term) >= 0) ? [{ k: "chip_all", path: "/games", term: "" }].concat(GAME_SECTIONS.map((g) => ({ k: g.k, path: "/category/" + encodeURIComponent(g.term), term: g.term }))) : [{ k: "chip_all", path: "/", term: "" }].concat(SEARCH_CATEGORIES.map((c) => ({ k: c.k, path: "/category/" + encodeURIComponent(c.term), term: c.term })));
    const activePath = route || "/";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: `hdr-top-row flex items-center px-4 max-w-screen-2xl mx-auto w-full ${isDetail ? "sticky top-0 z-40 bg-[hsl(var(--bg))]" : ""}`, style: { direction: "ltr" } }, isDetail ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip shrink-0", onClick: () => window.history.back(), "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip shrink-0", onClick: onOpenAccount, "aria-label": t("account") }, photo ? /* @__PURE__ */ React.createElement("img", { src: photo, alt: "", className: "nav-avatar" }) : /* @__PURE__ */ React.createElement(PersonMark, { className: "w-6 h-6" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => nav("/"), className: "shrink-0 group", "aria-label": "APKDroid Store" }, /* @__PURE__ */ React.createElement("div", { className: "group-hover:scale-105 transition-transform" }, /* @__PURE__ */ React.createElement(StoreLogo, { size: 48 })))), showChips && /* @__PURE__ */ React.createElement("div", { className: "hdr-chips" }, chips.map((ch) => {
      const on = ch.path === "/" || ch.path === "/games" ? activePath === ch.path : activePath === ch.path || ch.term && activePath.indexOf(encodeURIComponent(ch.term)) >= 0;
      return /* @__PURE__ */ React.createElement("button", { key: ch.k + ch.path, type: "button", className: `hdr-chip ${on ? "on" : ""}`, onClick: () => nav(ch.path) }, t(ch.k));
    })));
  };
  const AccPick = ({ open, title, onClose, children }) => {
    if (!open && open !== false) return null;
    return /* @__PURE__ */ React.createElement("div", { className: `acc-pick-overlay ${open ? "show" : ""}`, onClick: (e) => {
      if (e.target === e.currentTarget) onClose && onClose();
    } }, /* @__PURE__ */ React.createElement("div", { className: "acc-pick", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "acc-pick-title" }, title), children));
  };
  const AccountHub = ({ open, onClose, nav, theme, setTheme, profile, setProfile, lang, night, setNight }) => {
    const [view, setView] = useState("main");
    const [themeOpen, setThemeOpen] = useState(false);
    const [pagesOpen, setPagesOpen] = useState(false);
    const [name, setName] = useState(profile && profile.name || "");
    const fileRef = useRef(null);
    useEffect(() => {
      if (open) {
        setView("main");
        setThemeOpen(false);
        setPagesOpen(false);
        setName(profile && profile.name || "");
      }
    }, [open]);
    const photo = profile && profile.photo;
    const displayName = profile && profile.name || t("guest_name");
    const saveProfile = () => {
      const n = { name: String(name || "").trim(), photo: photo || "" };
      setProfile(n);
      setS("apk_profile", n);
      setView("main");
    };
    const onPhoto = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const n = { name: profile && profile.name || "", photo: String(r.result || "") };
        setProfile(n);
        setS("apk_profile", n);
      };
      r.readAsDataURL(f);
    };
    const go = (p) => {
      onClose && onClose();
      nav(p);
    };
    const ar = lang === "ar";
    return /* @__PURE__ */ React.createElement("div", { className: `acc-overlay ${open ? "open" : ""}`, dir: ar ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("div", { className: "acc-top" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-x", onClick: () => {
      if (view === "edit") setView("main");
      else onClose && onClose();
    }, "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "x", className: "w-5 h-5" }))), view === "edit" ? /* @__PURE__ */ React.createElement("div", { className: "acc-edit" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-center mb-2" }, t("edit_profile")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => fileRef.current && fileRef.current.click(), style: { background: "none", border: "none", display: "block", margin: "0 auto", cursor: "pointer", color: "#eee" } }, photo ? /* @__PURE__ */ React.createElement("img", { src: photo, alt: "", className: "acc-edit-avatar" }) : /* @__PURE__ */ React.createElement("div", { className: "acc-edit-ph" }, /* @__PURE__ */ React.createElement(PersonMark, { className: "w-10 h-10" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".82rem", color: "#9aa", marginTop: 4 } }, t("change_photo"))), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: onPhoto }), /* @__PURE__ */ React.createElement("label", { className: "text-sm text-muted-foreground", style: { display: "block", margin: "14px 0 6px" } }, t("profile_name")), /* @__PURE__ */ React.createElement("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: t("profile_name") }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-save", onClick: saveProfile }, t("save_profile"))) : /* @__PURE__ */ React.createElement("div", { className: "acc-body" }, /* @__PURE__ */ React.createElement("div", { className: "acc-card" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-profile-row", onClick: () => setView("edit") }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { opacity: 0.7 } }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })), /* @__PURE__ */ React.createElement("div", { className: "acc-profile-meta" }, /* @__PURE__ */ React.createElement("div", { className: "acc-name" }, displayName), /* @__PURE__ */ React.createElement("div", { className: "acc-sub" }, "APKDroid Store")), photo ? /* @__PURE__ */ React.createElement("img", { src: photo, alt: "", className: "acc-avatar" }) : /* @__PURE__ */ React.createElement("div", { className: "acc-avatar-ph" }, /* @__PURE__ */ React.createElement(PersonMark, { className: "w-7 h-7" })))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-manage", onClick: () => window.open("https://apkdroidstore3.blogspot.com/", "_blank", "noopener") }, /* @__PURE__ */ React.createElement("span", { className: "acc-manage-title" }, t("manage_account")), /* @__PURE__ */ React.createElement(StoreLogo, { size: 28 })), /* @__PURE__ */ React.createElement("div", { className: "acc-list" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-row", onClick: () => go("/search-log") }, /* @__PURE__ */ React.createElement("span", { className: "acc-row-label" }, t("search_log")), /* @__PURE__ */ React.createElement(Icon, { name: "hist", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-row", onClick: () => go("/downloads") }, /* @__PURE__ */ React.createElement("span", { className: "acc-row-label" }, t("dl_manager")), /* @__PURE__ */ React.createElement(Icon, { name: "download", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-row", onClick: () => setThemeOpen(true) }, /* @__PURE__ */ React.createElement("span", { className: "acc-row-label" }, t("appearance")), /* @__PURE__ */ React.createElement(Icon, { name: night ? "moon" : theme === "light" ? "sun" : "moon", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-row", onClick: () => setPagesOpen(true) }, /* @__PURE__ */ React.createElement("span", { className: "acc-row-label" }, t("pages_menu")), /* @__PURE__ */ React.createElement(Icon, { name: "folder", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "acc-row", onClick: () => go("/settings") }, /* @__PURE__ */ React.createElement("span", { className: "acc-row-label" }, t("settings")), /* @__PURE__ */ React.createElement(Icon, { name: "gear", className: "w-5 h-5" })))), /* @__PURE__ */ React.createElement(AccPick, { open: themeOpen, title: t("choose_theme"), onClose: () => setThemeOpen(false) }, [
      { id: "light", label: t("light") },
      { id: "dark", label: t("dark") },
      { id: "dim", label: t("theme_dim") }
    ].map((it) => {
      const cur = night ? "dim" : theme === "dark" ? "dark" : "light";
      return /* @__PURE__ */ React.createElement("button", { key: it.id, type: "button", className: `acc-pick-item ${cur === it.id ? "on" : ""}`, onClick: () => {
        if (it.id === "dim") {
          setNight(true);
          setTheme("dark");
        } else {
          setNight(false);
          setTheme(it.id);
        }
        setThemeOpen(false);
      } }, /* @__PURE__ */ React.createElement("span", null, it.label), cur === it.id && /* @__PURE__ */ React.createElement("span", { style: { marginInlineStart: "auto" } }, "\u2713"));
    })), /* @__PURE__ */ React.createElement(AccPick, { open: pagesOpen, title: t("pages_menu"), onClose: () => setPagesOpen(false) }, [
      { p: "/", k: "nav_apps" },
      { p: "/games", k: "nav_games" },
      { p: "/favorites", k: "nav_library" },
      { p: "/you", k: "nav_you" },
      { p: "/search", k: "nav_search" }
    ].map((it) => /* @__PURE__ */ React.createElement("button", { key: it.p, type: "button", className: "acc-pick-item", onClick: () => {
      setPagesOpen(false);
      go(it.p);
    } }, t(it.k)))));
  };
  const NavIcon = ({ kind, on, className = "w-6 h-6" }) => {
    const common = { fill: "currentColor" };
    if (kind === "search") return /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M20.5 19l-5.7-5.7a6.5 6.5 0 10-1.5 1.5l5.7 5.7 1.5-1.5zM5 9.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" }));
    if (kind === "game") {
      return on ? /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 960 960" }, /* @__PURE__ */ React.createElement("path", { d: "M182,760q-51,0 -79,-35.5T82,638l42,-300q9,-60 53.5,-99T282,200h396q60,0 104.5,39t53.5,99l42,300q7,51 -21,86.5T778,760q-21,0 -39,-7.5T706,730l-90,-90L344,640l-90,90q-15,15 -33,22.5t-39,7.5ZM680,520q17,0 28.5,-11.5T720,480q0,-17 -11.5,-28.5T680,440q-17,0 -28.5,11.5T640,480q0,17 11.5,28.5T680,520ZM600,400q17,0 28.5,-11.5T640,360q0,-17 -11.5,-28.5T600,320q-17,0 -28.5,11.5T560,360q0,17 11.5,28.5T600,400ZM310,520h60v-70h70v-60h-70v-70h-60v70h-70v60h70v70Z", fill: "currentColor" })) : /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 -960 960 960" }, /* @__PURE__ */ React.createElement("path", { d: "M182-200q-51 0-79-35.5T82-322l42-300q9-60 53.5-99T282-760h396q60 0 104.5 39t53.5 99l42 300q7 51-21 86.5T778-200q-21 0-39-7.5T706-230l-90-90H344l-90 90q-15 15-33 22.5t-39 7.5Zm16-86 114-114h336l114 114q2 2 16 6 11 0 17.5-6.5T800-304l-44-308q-4-29-26-48.5T678-680H282q-30 0-52 19.5T204-612l-44 308q-2 11 4.5 17.5T182-280q2 0 16-6Zm510.5-165.5Q720-463 720-480t-11.5-28.5Q697-520 680-520t-28.5 11.5Q640-497 640-480t11.5 28.5Q663-440 680-440t28.5-11.5Zm-80-120Q640-583 640-600t-11.5-28.5Q617-640 600-640t-28.5 11.5Q560-617 560-600t11.5 28.5Q583-560 600-560t28.5-11.5ZM310-440h60v-70h70v-60h-70v-70h-60v70h-70v60h70v70Zm170-40Z", fill: "currentColor" }));
    }
    if (kind === "home") {
      return on ? /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M6 13h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm9 0h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0-9h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zM6 4h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2z", fill: "currentColor" })) : /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M6 13h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0 2v3h3v-3H6zm9-2h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0 2v3h3v-3h-3zm0-11h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zm0 2v3h3V6h-3zM6 4h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zm0 2v3h3V6H6z", fill: "currentColor" }));
    }
    if (kind === "heart") {
      return on ? /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M3,5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20C21,22.472 18.178,23.883 16.2,22.4L12,19.25L7.8,22.4C5.822,23.883 3,22.472 3,20V5Z", fill: "currentColor" })) : /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M11.539,17.112C11.876,16.937 12.288,16.967 12.6,17.2L17.4,20.8C18.06,21.294 19,20.824 19,20V5C19,3.895 18.105,3 17,3H7C5.895,3 5,3.895 5,5V20C5,20.824 5.94,21.294 6.6,20.8L11.4,17.2L11.539,17.112ZM21,20C21,22.472 18.178,23.883 16.2,22.4L12,19.249L7.8,22.4C5.822,23.883 3,22.472 3,20V5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20Z", fill: "currentColor" }));
    }
    if (kind === "you") {
      return on ? /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z" })) : /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 -960 960 960" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z" }));
    }
    return null;
  };
  const BottomNav = ({ route, nav }) => {
    const items = [
      { k: "nav_you", p: "/you", i: "you" },
      { k: "nav_library", p: "/favorites", i: "heart" },
      { k: "nav_search", p: "/search", i: "search" },
      { k: "nav_apps", p: "/", i: "home", root: true },
      { k: "nav_games", p: "/games", i: "game" }
    ];
    return /* @__PURE__ */ React.createElement("nav", { className: "app-footer bot-nav w-full bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] pb-safe sm:hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-around items-center h-16 px-2" }, items.map((it) => {
      const a = it.root ? route === "/" : route.startsWith(it.p);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: it.k,
          onClick: () => nav(it.p),
          className: `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${a ? "text-primary nav-ico-on" : "text-muted-foreground hover:text-foreground"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: `flex items-center justify-center rounded-full transition-all duration-200 ${a ? "nav-pill-on bg-primary/10 w-14 h-8" : "w-8 h-8"}` }, /* @__PURE__ */ React.createElement(NavIcon, { kind: it.i, on: !!a, className: "w-6 h-6" })),
        /* @__PURE__ */ React.createElement("span", { className: "bot-nav-label" }, t(it.k))
      );
    })));
  };
  const bumpReloadSeed = () => {
    const c = (getS("apk_reload_count", 0) | 0) + 1;
    setS("apk_reload_count", c);
    return Math.floor((c - 1) / 5);
  };
  const getContentSeed = () => {
    const c = getS("apk_reload_count", 0) | 0;
    return c || 1;
  };
  const FRESH_WORDS = ["new", "latest", "best", "top", "free", "popular", "trending", "hd", "pro", "lite", "plus", "mini", "offline", "2024", "2025", "2026", "daily", "hot", "editor", "choice", "fun", "fast", "smart", "social", "tools"];
  const freshTerm = (base, seed, i = 0) => String(base || "") + " " + FRESH_WORDS[(Math.abs(seed) + i) % FRESH_WORDS.length];
  const dropSeen = (key, list) => {
    const seen = new Set((getS(key, []) || []).map(String));
    const fresh = (list || []).filter((a) => a && !seen.has(String(a.trackId)));
    return fresh.length >= 6 ? fresh : list;
  };
  const rememberIds = (key, list) => setS(key, (list || []).map((a) => a && a.trackId).filter(Boolean).slice(0, 140));
  const pickSlice = (arr, n, seed) => {
    if (!arr || !arr.length) return [];
    const start = seed * 3 % Math.max(1, arr.length);
    const out = [];
    for (let i = 0; i < n && i < arr.length; i++) out.push(arr[(start + i) % arr.length]);
    return out;
  };
  const GameShotCard = ({ app, onClick }) => {
    if (!app) return null;
    const shot = app.screenshotUrls && app.screenshotUrls[0] || app.artworkUrl512 || app.artworkUrl100;
    const icon = app.artworkUrl100 || app.artworkUrl60;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "g-shot-card", onClick: () => onClick(app) }, /* @__PURE__ */ React.createElement("div", { className: "g-shot-wrap" }, /* @__PURE__ */ React.createElement(SmartImg, { className: "shot", kind: "banner", src: shot }), /* @__PURE__ */ React.createElement("div", { className: "g-shot-grad" })), /* @__PURE__ */ React.createElement("div", { className: "g-shot-meta" }, /* @__PURE__ */ React.createElement(SmartImg, { className: "g-shot-icon", kind: "icon", src: icon }), /* @__PURE__ */ React.createElement("span", { className: "g-shot-name" }, app.trackName)));
  };
  const uniqApps = (arr) => {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    (arr || []).forEach((a) => {
      if (!a || a.trackId == null) return;
      const k = String(a.trackId);
      if (seen.has(k)) return;
      seen.add(k);
      out.push(a);
    });
    return out;
  };
  const takeLoop = (arr, n, off) => {
    if (!arr || !arr.length || !n) return [];
    const out = [];
    for (let i = 0; i < n; i++) out.push(arr[(off + i) % arr.length]);
    return out;
  };
  const framesOf3 = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 3) {
      const g = arr.slice(i, i + 3);
      if (g.length) out.push(g);
    }
    return out;
  };
  const homeSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)) + " MB";
  };
  const promoShot = (app) => app && (app.screenshotUrls && app.screenshotUrls[0] || app.artworkUrl512 || app.artworkUrl100) || "";
  const PromoCarousel = ({ apps, open, openInstall, auto }) => {
    const ref = useRef(null);
    const [idx, setIdx] = useState(0);
    const hold = useRef(false);
    const scrollSlide = (el, next, smooth) => {
      const slide = el.children[next];
      if (!slide) return;
      const page = document.getElementById("app-scroll");
      const y = page ? page.scrollTop : 0;
      const delta = slide.getBoundingClientRect().left - el.getBoundingClientRect().left;
      el.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
      if (page) page.scrollTop = y;
    };
    const goTo = (n, smooth = true) => {
      const el = ref.current;
      if (!el || !apps || !apps.length) return;
      const max = apps.length;
      const next = (n % max + max) % max;
      scrollSlide(el, next, smooth);
      setIdx(next);
    };
    useEffect(() => {
      if (!auto || !apps || apps.length < 2) return;
      const t2 = setInterval(() => {
        if (hold.current) return;
        setIdx((cur) => {
          const next = (cur + 1) % apps.length;
          const el = ref.current;
          if (el) {
            const slide = el.children[next];
            if (slide) {
              const page = document.getElementById("app-scroll");
              const y = page ? page.scrollTop : 0;
              const delta = slide.getBoundingClientRect().left - el.getBoundingClientRect().left;
              el.scrollBy({ left: delta, behavior: "smooth" });
              if (page) requestAnimationFrame(() => {
                page.scrollTop = y;
              });
            }
          }
          return next;
        });
      }, 4800);
      return () => clearInterval(t2);
    }, [auto, apps]);
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const slides = Array.from(el.children);
      let best = 0, bestD = 1e9;
      slides.forEach((sl, i) => {
        const d = Math.abs(sl.getBoundingClientRect().left - el.getBoundingClientRect().left);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setIdx(best);
    };
    if (!apps || !apps.length) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "mb-4 pt-3" }, /* @__PURE__ */ React.createElement("div", { className: "promo-wrap" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "promo-scroller",
        ref,
        onScroll,
        onPointerDown: () => {
          hold.current = true;
        },
        onPointerUp: () => {
          hold.current = false;
        },
        onPointerCancel: () => {
          hold.current = false;
        }
      },
      apps.map((app, i) => {
        const shot = promoShot(app);
        const icon = app.artworkUrl100 || app.artworkUrl60 || shot;
        return /* @__PURE__ */ React.createElement("div", { className: "promo-slide", key: "promo-" + app.trackId + "-" + i }, /* @__PURE__ */ React.createElement("div", { className: "promo-ghost" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "promo-banner-wrap", onClick: () => open(app) }, /* @__PURE__ */ React.createElement("span", { className: "promo-banner-clip" }, /* @__PURE__ */ React.createElement(SmartImg, { className: "promo-shot", kind: "ad", src: shot, eager: i === 0 }), /* @__PURE__ */ React.createElement("span", { className: "promo-caption" }, (app.description || app.artistName || "").replace(/\s+/g, " ").slice(0, 72)))), /* @__PURE__ */ React.createElement("div", { className: "promo-foot", dir: _lang === "ar" ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement(SmartImg, { className: "promo-icon", kind: "icon", src: icon, onClick: () => open(app) }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "promo-meta", onClick: () => open(app), style: { border: 0, background: "transparent", color: "inherit", fontFamily: "inherit", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { className: "promo-name" }, app.trackName), /* @__PURE__ */ React.createElement("div", { className: "promo-sub" }, app.artistName || ""), /* @__PURE__ */ React.createElement("div", { className: "promo-rate" }, "\u2605 ", fmtRating(app.averageUserRating))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "promo-install", onClick: (e) => {
          e.stopPropagation();
          openInstall ? openInstall(app) : open(app);
        } }, t("install")))));
      })
    )), apps.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "promo-dots" }, apps.map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: `promo-dot ${i === idx ? "on" : ""}`, onClick: () => goTo(i) }))));
  };
  const StackedAppsPager = ({ frames, open, title }) => {
    if (!frames || !frames.length) return null;
    return /* @__PURE__ */ React.createElement("section", { className: "mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "stack-head" }, /* @__PURE__ */ React.createElement("span", { className: "stack-head-title" }, title || t("ads_suggested"))), /* @__PURE__ */ React.createElement("div", { className: "stack-scroller" }, frames.map((group, fi) => /* @__PURE__ */ React.createElement("div", { className: "stack-slide", key: "frame-" + fi + "-" + (group[0] && group[0].trackId) }, /* @__PURE__ */ React.createElement("div", { className: "stack-card" }, group.map((app) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "stack-row", key: app.trackId, onClick: () => open(app), dir: _lang === "ar" ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement(SmartImg, { className: "stack-row-icon", kind: "icon", src: app.artworkUrl100 || app.artworkUrl60 }), /* @__PURE__ */ React.createElement("div", { className: "stack-row-body" }, /* @__PURE__ */ React.createElement("div", { className: "stack-row-name" }, app.trackName), /* @__PURE__ */ React.createElement("div", { className: "stack-row-sub" }, [app.primaryGenreName, app.artistName].filter(Boolean).slice(0, 2).join(" \u2022 ")), /* @__PURE__ */ React.createElement("div", { className: "stack-row-stats" }, app.averageUserRating ? /* @__PURE__ */ React.createElement("span", null, "\u2605 ", Number(app.averageUserRating).toFixed(1)) : null, app.fileSizeBytes ? /* @__PURE__ */ React.createElement("span", null, homeSize(app.fileSizeBytes)) : null)))))))));
  };
  const isGameApp = (a) => {
    if (!a) return true;
    const gid = Number(a.primaryGenreId);
    if (gid === 6014) return true;
    const ids = a.genreIds;
    if (Array.isArray(ids) && ids.some((x) => Number(x) === 6014 || String(x) === "6014")) return true;
    const names = [a.primaryGenreName, ...Array.isArray(a.genres) ? a.genres : []].map((x) => String(x || "").toLowerCase());
    return names.some((g) => g === "games" || g === "game" || g === "\u0623\u0644\u0639\u0627\u0628" || g.indexOf("games") >= 0 || g.indexOf("game") === 0);
  };
  const onlyApps = (list) => (list || []).filter((a) => a && !isGameApp(a));
  const SVG_NET_SPIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="loadingGradient" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4285F4"/><stop offset="0.34" stop-color="#34A853"/><stop offset="0.67" stop-color="#FBBC05"/><stop offset="1" stop-color="#EA4335"/></linearGradient></defs><circle cx="60" cy="60" r="46" fill="none" stroke="url(#loadingGradient)" stroke-width="14" stroke-linecap="round" stroke-dasharray="1 289"><animateTransform attributeName="transform" type="rotate" values="0 60 60;90 60 60;300 60 60;360 60 60" keyTimes="0;0.45;0.75;1" keySplines="0.65 0 0.85 0.25;0.12 0.85 0.35 1;0.25 0.05 0.55 1" calcMode="spline" dur="2.4s" repeatCount="indefinite"/><animate attributeName="stroke-dasharray" values="1 289;25 265;90 200;160 130;220 70;250 40;250 40;1 289" keyTimes="0;0.12;0.25;0.38;0.50;0.56;0.60;1" keySplines="0.4 0 0.6 1;0.35 0 0.55 1;0.3 0 0.5 1;0.25 0 0.45 1;0.15 0 0.3 1;0.7 0 1 0.15;0.05 0.8 0.2 1" calcMode="spline" dur="2.4s" repeatCount="indefinite"/></circle></svg>`;
  const SVG_ANDROID_PH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="48" height="48"><path fill="#e3e3e3" d="M40-239q8-106 65-196.5T256-579l-75-129q-3-9-.5-18t10.5-14q9-5 19.5-2t15.5 12l74 127q86-37 180-37t180 37l75-127q5-9 15.5-12t19.5 2q8 5 11.5 14.5T780-708l-76 129q94 53 151 143.5T920-239H40Zm275-125q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Zm400 0q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Z"/></svg>`;
  const SVG_SHOT_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="175" height="175"><g><path d="M512,843.9a62.6,62.6 0,1 0,0 -125.1,62.6 62.6,0 0,0 0,125.1zM366.5,671.8a44.4,44.4 0,0 1,-34.4 -15.7,46.8 46.8,0 0,1 3.2,-65.7A262.2,262.2 0,0 1,512 523.2c9.4,0 18.8,0 28.2,1.5 25,3.2 43.8,26.6 42.2,51.6 -3.1,25 -26.6,43.8 -51.6,42.2a175.9,175.9 0,0 0,-131.4 42.2,55.1 55.1,0 0,1 -32.9,11zM235.1,540.4c-12.5,0 -25,-4.7 -34.4,-14.1a48.7,48.7 0,0 1,1.6 -67.3c45.4,-42.2 97,-75.1 154.9,-95.4 25,-9.4 51.6,3.1 59.4,28.2 9.4,25 -3.1,51.6 -28.2,59.4 -45.4,17.2 -87.6,42.2 -123.6,76.7 -6.3,9.4 -18.8,12.5 -29.7,12.5zM788.9,540.4c-11,0 -23.5,-4.7 -32.9,-12.5a351.2,351.2 0,0 0,-209.6 -95.4c-25,-3.1 -45.4,-25 -42.2,-51.6 3.1,-26.6 25,-43.8 51.6,-42.2 98.6,9.4 192.4,53.2 264.4,120.4 18.8,17.2 20.4,46.9 1.6,65.7 -7.8,11 -20.4,15.7 -32.9,15.7zM89.6,394.9c-12.5,0 -25,-4.7 -34.4,-14.1 -17.2,-18.8 -17.2,-48.5 1.6,-65.7 46.9,-45.4 98.6,-82.9 156.5,-111.1a45,45 0,0 1,62.5 20.3c12.5,23.5 3.2,51.6 -20.3,62.6a618.3,618.3 0,0 0,-134.6 95.4c-7.8,9.4 -20.3,12.5 -31.3,12.5zM934.4,394.9c-11,0 -23.5,-4.7 -32.9,-12.5 -104.8,-101.7 -244.1,-156.5 -389.5,-156.5 -45.4,0 -90.8,4.7 -134.5,15.7a46.6,46.6 0,1 1,-21.9 -90.8c51.6,-12.5 103.3,-18.8 156.5,-18.8 170.5,0 331.6,65.7 455.3,183 18.8,17.2 18.8,46.9 1.6,65.7 -9.4,9.4 -21.9,14.1 -34.4,14.1z" fill="#BEC2C6"/><path d="M932.8,978.4c-12.5,0 -23.5,-4.7 -32.9,-14.1L56.7,121.1c-18.8,-18.8 -18.8,-48.5 0,-65.7 18.8,-18.8 48.5,-18.8 65.7,0l843.2,843.3c18.8,18.8 18.8,48.5 0,65.7 -9.4,9.4 -20.3,14.1 -32.9,14.1z" fill="#BEC2C6"/></g></svg>`;
  const SVG_WIFI_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="72" height="72"><path fill="#e3e3e3" d="M73-536 2-607q97-94 220.5-143.5T480-800q134 0 257.5 49.5T958-607l-71 71q-82-79-187-121.5T480-700q-115 0-220 42.5T73-536Zm350.5 352.5Q400-207 400-240t23.5-56.5Q447-320 480-320t56.5 23.5Q560-273 560-240t-23.5 56.5Q513-160 480-160t-56.5-23.5ZM298-309l-70-71q51-48 116-74t136-26q41 0 80.5 8.5T636-446q-17 17-33 38.5T574-363q-23-8-46.5-12.5T480-380q-51 0-97.5 18T298-309ZM186-422l-70-71q74-71 168-109t197-38q103 0 196.5 37.5T845-494l-15 16q-20-3-36.5-7.5T760-490q-14 0-28.5 3.5T701-478q-50-30-106-46t-115-16q-83 0-158.5 30.5T186-422Zm545.5 250.5Q720-183 720-200t11.5-28.5Q743-240 760-240t28.5 11.5Q800-217 800-200t-11.5 28.5Q777-160 760-160t-28.5-11.5ZM720-280v-140h80v140h-80Z"/></svg>`;
  const svgDataUri = (svg) => "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  const NetSpin = ({ full, center }) => /* @__PURE__ */ React.createElement("div", { className: center ? "net-spin net-center" : full ? "net-spin net-full" : "net-spin net-in", role: "status", "aria-label": "loading" }, /* @__PURE__ */ React.createElement("div", { className: "net-spin-mark", dangerouslySetInnerHTML: { __html: SVG_NET_SPIN } }));
  const sendNetNotice = () => {
    const body = "\u062A\u0645 \u0642\u0637\u0639 \u0627\u0644\u0625\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645";
    const done = () => {
      try {
        if (window.__apkToast) window.__apkToast("\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631");
      } catch (e) {
      }
    };
    try {
      if (typeof Notification !== "undefined") {
        const fire = () => {
          try {
            new Notification("APKDroid", { body });
            done();
          } catch (e) {
            done();
          }
        };
        if (Notification.permission === "granted") {
          fire();
          return;
        }
        if (Notification.permission !== "denied") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") fire();
            else done();
          }).catch(done);
          return;
        }
      }
    } catch (e) {
    }
    done();
  };
  const probeOnline = () => new Promise((resolve) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      resolve(!!v);
    };
    const timer = setTimeout(() => finish(false), 2800);
    try {
      fetch("https://www.gstatic.com/generate_204", { method: "GET", mode: "no-cors", cache: "no-store" }).then(() => {
        clearTimeout(timer);
        finish(true);
      }).catch(() => {
        clearTimeout(timer);
        finish(false);
      });
    } catch (e) {
      clearTimeout(timer);
      finish(false);
    }
  });
  const OfflineSheet = ({ onRetry, onCancel }) => /* @__PURE__ */ React.createElement("div", { className: "off-sheet-mask", role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ React.createElement("div", { className: "off-sheet" }, /* @__PURE__ */ React.createElement("div", { className: "off-sheet-ico", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "off-wifi" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "28", height: "28" }, /* @__PURE__ */ React.createElement("path", { fill: "#fff", d: "M1 9l2 2c2.88-2.88 6.79-4.08 10.53-3.62l1.19-1.19C9.89 5.15 4.86 6.16 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c1.42-1.42 3.28-2.08 5.12-1.96l1.47-1.47C10.54 11.18 7.36 11.72 5 13z" }))), /* @__PURE__ */ React.createElement("span", { className: "off-face" }, "\u{1F914}")), /* @__PURE__ */ React.createElement("h3", null, _lang === "ar" ? "\u0623\u0646\u062A \u063A\u064A\u0631 \u0645\u062A\u0635\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A" : "You are offline"), /* @__PURE__ */ React.createElement("p", null, _lang === "ar" ? "\u0628\u0639\u0636 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629." : "Some features are unavailable."), /* @__PURE__ */ React.createElement("div", { className: "off-sheet-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "off-btn off-btn-go", onClick: onRetry }, _lang === "ar" ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" : "Retry"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "off-btn off-btn-no", onClick: onCancel }, _lang === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel"))));
  const NetOffline = ({ onRetry }) => /* @__PURE__ */ React.createElement("div", { className: "net-off net-in", role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "net-off-block" }, /* @__PURE__ */ React.createElement("div", { className: "net-off-ico", dangerouslySetInnerHTML: { __html: SVG_WIFI_OFF } }), /* @__PURE__ */ React.createElement("p", null, "\u062A\u0645 \u0642\u0637\u0639 \u0627\u0644\u0625\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645"), /* @__PURE__ */ React.createElement("div", { className: "net-off-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "net-off-btn", onClick: onRetry }, "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "net-off-btn net-off-btn-alt", onClick: sendNetNotice }, "\u0625\u0631\u0633\u0627\u0644 \u0625\u0634\u0639\u0627\u0631"))));
  const BLANK_PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const installImgFallback = () => {
    if (window.__apkImgFb) return;
    window.__apkImgFb = true;
    const iconUri = svgDataUri(SVG_ANDROID_PH);
    const shotUri = svgDataUri(SVG_SHOT_OFF);
    document.addEventListener("error", (ev) => {
      const el = ev.target;
      if (!el || el.tagName !== "IMG" || el.dataset.fb) return;
      const cls = typeof el.className === "string" ? el.className : "";
      if (/(acc-avatar|acc-edit-avatar|store-logo|nav-avatar)/.test(cls)) return;
      if (el.closest && el.closest(".acc-overlay")) return;
      const shot = /(bg-screenshot|bg-lightbox-img)/.test(cls) || !!(el.closest && el.closest(".dt-thumbs,.bg-screenshots,.bg-lightbox"));
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w) {
        el.style.width = w + "px";
        el.style.minWidth = w + "px";
        el.style.maxWidth = w + "px";
      }
      if (h) {
        el.style.height = h + "px";
        el.style.minHeight = h + "px";
        el.style.maxHeight = h + "px";
      }
      el.dataset.fb = shot ? "shot" : "icon";
      el.style.objectFit = "none";
      el.style.padding = "0";
      el.style.backgroundColor = "hsl(var(--muted))";
      el.style.backgroundImage = 'url("' + (shot ? shotUri : iconUri) + '")';
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
      el.style.backgroundSize = "58%";
      el.src = BLANK_PX;
    }, true);
  };
  installImgFallback();
  const SVG_TIMEOUT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225"><g><path d="M183.755 92.384l23.355-9.985 3.734 8.735-23.355 9.985z" fill="#78909C"></path><path d="M300.016 105.501l-75.215 32.156-41.472-97.007 75.215-32.156z" fill="#B0BEC5"></path><path d="M237.06 70.417l-28.504 12.186L192.36 44.72l28.504-12.186zm34.422-14.723L242.978 67.88l-16.196-37.883 28.504-12.186zm-15.38 59.184l-28.504 12.186-16.196-37.883 28.504-12.186zm34.37-14.591l-28.504 12.186-16.196-37.883 28.504-12.186z" fill="#00616E"></path><path d="M81.281 63.336l81.192-34.711 52.754 123.397-81.192 34.711z" fill="#B0BEC5"></path><path d="M157.1 187.2l-3.7-8.7 43.8-18.8 3.7 8.7" fill="#90A4AE"></path><path d="M103.432 20.379l2.53-2.271 15.364 17.114-2.53 2.271z" fill="#78909C"></path><path d="M91.9 41.4c9.3 5.6 21.6 4.7 30.1-2.9s10.7-19.7 6.1-29.6L91.9 41.4z" fill="#B0BEC5"></path><path d="M84.237 134.88l23.355-9.985 3.734 8.735-23.355 9.985zm3.333-56.887l81.192-34.711 1.612 3.77-81.192 34.711zm39.776 93.116l81.192-34.711 1.612 3.77-81.192 34.711z" fill="#78909C"></path><path d="M131 105.5c-1.2 0-2.5-0.2-3.6-0.7-2.4-1-4.3-2.8-5.3-5.2l3.5-1.5c0.6 1.5 1.8 2.6 3.2 3.2 1.5 0.6 3.1 0.6 4.5-0.1 1.5-0.6 2.6-1.8 3.2-3.2 0.6-1.5 0.6-3.1-0.1-4.5l3.5-1.5c1 2.4 1.1 5 0.1 7.5-1 2.4-2.8 4.3-5.2 5.3-1.2 0.4-2.5 0.7-3.8 0.7zm22.8-8.9c-1.2 0-2.5-0.2-3.6-0.7-2.4-1-4.3-2.8-5.3-5.2l3.5-1.5c0.6 1.5 1.8 2.6 3.2 3.2s3.1 0.6 4.5-0.1c1.5-0.6 2.6-1.8 3.2-3.2 0.6-1.5 0.6-3.1-0.1-4.5l3.5-1.5c1 2.4 1.1 5 0.1 7.5-1 2.4-2.8 4.3-5.2 5.3-1.2 0.4-2.5 0.7-3.8 0.7zM139.5 119c-1.9-4.4 2.2-10.3 9.1-13.3 6.9-2.9 14-1.8 15.9 2.6l-25 10.7z" fill="#455A64"></path><path d="M146.8 130c-1.2 0.5-2.6 0-3.1-1.2l-4.2-9.8 4.3-1.9 4.2 9.8c0.5 1.2 0 2.6-1.2 3.1z" fill="#ECEFF1"></path><path d="M148.5 122c-1.2 0.5-2.6 0-3.1-1.2l-1.6-3.6 4.3-1.9 1.6 3.6c0.5 1.2 0 2.6-1.2 3.1z" fill="#ECEFF1"></path><path d="M116.665 184.37L41.45 216.526l-41.472-97.007 75.215-32.156z" fill="#B0BEC5"></path><path d="M53.709 149.286l-28.504 12.186-16.196-37.883 28.504-12.186zm34.422-14.723l-28.504 12.186-16.196-37.883L71.935 96.68zm-15.432 59.316l-28.504 12.186-16.196-37.883 28.504-12.186zm34.422-14.723l-28.504 12.186-16.196-37.883 28.504-12.186z" fill="#00616E"></path></g></svg>';
  const LoadTimeout = ({ show, onRetry }) => {
    if (!show) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "load-timeout" }, /* @__PURE__ */ React.createElement("div", { className: "load-timeout-logo", dangerouslySetInnerHTML: { __html: SVG_TIMEOUT } }), /* @__PURE__ */ React.createElement("p", null, t("load_timeout")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "load-timeout-btn", onClick: onRetry }, t("retry_load")));
  };
  const homeSources = (seed) => [
    () => api.search(freshTerm("best apps", seed, 0), 24).catch(() => api.top()),
    () => api.cat(freshTerm("for you apps", seed, 1), GENRES.entertainment.id, 24).catch(() => []),
    () => api.cat(freshTerm("messaging social chat", seed, 2), 6005, 24).catch(() => api.search(freshTerm("whatsapp messenger social", seed, 3), 20)),
    () => api.cat(freshTerm("productivity tools", seed, 4), GENRES.productivity.id, 24).catch(() => api.search(freshTerm("productivity", seed, 5), 20)),
    () => api.cat(freshTerm("education learn", seed, 6), GENRES.education.id, 24).catch(() => api.search(freshTerm("education", seed, 7), 20)),
    () => api.search(freshTerm("photo video editor", seed, 8), 20).catch(() => [])
  ];
  let homePoolCache = [];
  const Home = ({ nav, open, openInstall }) => {
    const [pool, setPool] = useState(() => homePoolCache.slice());
    const [shown, setShown] = useState(() => homePoolCache.length ? 10 : 0);
    const [done, setDone] = useState(() => homePoolCache.length > 0);
    const [reload, setReload] = useState(0);
    const [timedOut, setTimedOut] = useState(false);
    const [intro, setIntro] = useState(true);
    useEffect(() => {
      const t2 = setTimeout(() => setIntro(false), 500);
      return () => clearTimeout(t2);
    }, []);
    useEffect(() => {
      let cancel = false;
      if (reload > 0) homePoolCache = [];
      let got = homePoolCache.length > 0;
      if (!got) {
        setPool([]);
        setShown(0);
        setDone(false);
        setTimedOut(false);
      } else {
        setPool(homePoolCache.slice());
        setShown(10);
        setDone(true);
        setTimedOut(false);
      }
      const timer = setTimeout(() => {
        if (!cancel && !got) setTimedOut(true);
      }, 1e4);
      (async () => {
        const seed = getContentSeed() + reload * 17;
        const sources = homeSources(seed);
        let acc = [];
        for (let i = 0; i < sources.length; i += 2) {
          const lists = await Promise.all(sources.slice(i, i + 2).map((fn) => fn().catch(() => [])));
          if (cancel) return;
          acc = dropSeen("apk_seen_apps", uniqApps(onlyApps(acc.concat(lists.flat()))));
          const rotated = pickSlice(acc, acc.length, seed);
          const next = rotated.length ? rotated : acc;
          setPool(next);
          if (next.length) {
            got = true;
            homePoolCache = next.slice();
            setTimedOut(false);
            clearTimeout(timer);
            rememberIds("apk_seen_apps", next);
          }
          setShown((s) => Math.min(10, s + 2));
        }
        if (!cancel) {
          setShown(10);
          setDone(true);
          if (!got && !acc.length) setTimedOut(true);
        }
      })();
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    }, [reload]);
    const adsPool = pool.filter((a) => a && (a.screenshotUrls && a.screenshotUrls[0] || a.artworkUrl512 || a.artworkUrl100));
    const adsSrc = adsPool.length ? adsPool : pool;
    const topAds = takeLoop(adsSrc, 6, 0);
    const midAds = takeLoop(adsSrc, 6, 7);
    const endAds = takeLoop(adsSrc, 6, 13);
    const stackTitles = [t("ads_suggested"), t("suggested_for_you"), t("sec_best"), t("sec_for_you"), t("sec_social")];
    const rowTitles = [t("suggested_for_you"), t("sec_best"), t("sec_for_you"), t("sec_social"), t("sec_most_dl")];
    const units = [];
    for (let i = 0; i < 5; i++) {
      units.push({ kind: "stack", title: stackTitles[i], frames: framesOf3(takeLoop(pool, 9, 6 + i * 17)) });
      units.push({ kind: "row", title: rowTitles[i], apps: takeLoop(pool, 10, 12 + i * 11) });
    }
    const visible = units.slice(0, shown);
    const showMid = shown >= 4;
    const showEnd = done || shown >= 10;
    const renderUnit = (u, i) => u.kind === "stack" ? /* @__PURE__ */ React.createElement(StackedAppsPager, { key: "u-" + i, frames: u.frames, open, title: u.title }) : /* @__PURE__ */ React.createElement(HScroll, { key: "u-" + i, title: u.title, onSeeAll: () => nav("/search"), rtl: true }, u.apps.map((a) => /* @__PURE__ */ React.createElement(AppCard, { key: "row-" + i + "-" + a.trackId, app: a, small: true, onClick: open })));
    const booting = !pool.length && !timedOut;
    const showIntro = intro || booting;
    return /* @__PURE__ */ React.createElement("div", { className: "page-stage pb-24 sm:pb-8" }, intro && /* @__PURE__ */ React.createElement(NetSpin, { center: true }), !intro && booting && /* @__PURE__ */ React.createElement(NetSpin, { full: true }), /* @__PURE__ */ React.createElement(LoadTimeout, { show: timedOut && !pool.length && !intro, onRetry: () => setReload((n) => n + 1) }), !showIntro && pool.length > 0 && /* @__PURE__ */ React.createElement(PromoCarousel, { apps: topAds, open, openInstall, auto: true }), !showIntro && visible.slice(0, 4).map((u, i) => renderUnit(u, i)), !showIntro && showMid && /* @__PURE__ */ React.createElement(PromoCarousel, { apps: midAds, open, openInstall, auto: true }), !showIntro && visible.slice(4).map((u, i) => renderUnit(u, i + 4)), !showIntro && showEnd && /* @__PURE__ */ React.createElement(PromoCarousel, { apps: endAds, open, openInstall, auto: true }), !done && /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 space-y-3" }, /* @__PURE__ */ React.createElement(Skel, { c: "h-16 w-full" }), /* @__PURE__ */ React.createElement(Skel, { c: "h-16 w-full" })));
  };
  const GAME_SECTIONS = [
    { k: "g_most_dl", term: "top free games popular", gid: 6014 },
    { k: "g_br", term: "battle royale games", gid: 6014 },
    { k: "g_sandbox", term: "sandbox games minecraft", gid: 6014 },
    { k: "g_tanks", term: "tank games war", gid: 6014 },
    { k: "g_adventure", term: "adventure games", gid: 6014 },
    { k: "g_popular", term: "popular mobile games", gid: 6014 },
    { k: "g_horror", term: "horror games", gid: 6014 },
    { k: "g_kids", term: "kids games children", gid: 6014 },
    { k: "g_rpg", term: "RPG role playing games", gid: 6014 },
    { k: "g_strategy", term: "strategy games", gid: 6014 },
    { k: "g_sim", term: "simulation truck games", gid: 6014 },
    { k: "g_puzzle", term: "puzzle brain games", gid: 6014 }
  ];
  let gamesRowsCache = null;
  const Games = ({ open }) => {
    const [rows, setRows] = useState(() => gamesRowsCache ? gamesRowsCache.map((r) => (r || []).slice()) : GAME_SECTIONS.map(() => []));
    const [ready, setReady] = useState(() => gamesRowsCache && gamesRowsCache.some((r) => r && r.length) ? GAME_SECTIONS.length : 0);
    const [reload, setReload] = useState(0);
    const [timedOut, setTimedOut] = useState(false);
    const [intro, setIntro] = useState(true);
    useEffect(() => {
      const t2 = setTimeout(() => setIntro(false), 500);
      return () => clearTimeout(t2);
    }, []);
    useEffect(() => {
      let cancel = false;
      if (reload > 0) gamesRowsCache = null;
      const cached = gamesRowsCache && gamesRowsCache.some((r) => r && r.length);
      let got = !!cached;
      if (!cached) {
        setRows(GAME_SECTIONS.map(() => []));
        setReady(0);
        setTimedOut(false);
      } else {
        setRows(gamesRowsCache.map((r) => (r || []).slice()));
        setReady(GAME_SECTIONS.length);
        setTimedOut(false);
      }
      const timer = setTimeout(() => {
        if (!cancel && !got) setTimedOut(true);
      }, 1e4);
      (async () => {
        const seed = getContentSeed() + reload * 17;
        for (let i = 0; i < GAME_SECTIONS.length; i += 2) {
          const batch = [i, i + 1].filter((x) => x < GAME_SECTIONS.length);
          const results = await Promise.all(batch.map((idx) => {
            const sec = GAME_SECTIONS[idx];
            const term = freshTerm(sec.term, seed, idx);
            return api.cat(term, sec.gid, 25).catch(() => api.search(term, 25).catch(() => []));
          }));
          if (cancel) return;
          const has = results.some((r) => r && r.length);
          if (has) {
            got = true;
            setTimedOut(false);
            clearTimeout(timer);
          }
          setRows((prev) => {
            const n = prev.slice();
            batch.forEach((idx, j) => {
              n[idx] = dropSeen("apk_seen_games", pickSlice((results[j] || []).filter(isGameApp), 12, seed + idx));
            });
            rememberIds("apk_seen_games", n.flat());
            if (n.some((r) => r && r.length)) gamesRowsCache = n.map((r) => (r || []).slice());
            return n;
          });
          setReady((x) => x + batch.length);
        }
        if (!cancel && !got) setTimedOut(true);
      })();
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    }, [reload]);
    const hasGames = rows.some((r) => r && r.length);
    const booting = !hasGames && !timedOut;
    const showIntro = intro || booting;
    return /* @__PURE__ */ React.createElement("div", { className: "page-stage pb-20 sm:pb-8 pt-2" }, intro && /* @__PURE__ */ React.createElement(NetSpin, { center: true }), !intro && booting && /* @__PURE__ */ React.createElement(NetSpin, { full: true }), /* @__PURE__ */ React.createElement(LoadTimeout, { show: timedOut && !hasGames && !intro, onRetry: () => setReload((n) => n + 1) }), !showIntro && GAME_SECTIONS.map((sec, i) => {
      if (i >= ready && i >= ready + 2) return null;
      const list = rows[i] || [];
      const waiting = i >= ready;
      return /* @__PURE__ */ React.createElement(HScroll, { key: sec.k, title: t(sec.k), rtl: true, pad: "px-5 g-shot-row" }, waiting || !list.length ? Array(3).fill(0).map((_, j) => /* @__PURE__ */ React.createElement("div", { key: j, className: "shrink-0 bg-muted animate-pulse", style: { width: "min(88vw,420px)", aspectRatio: "16/9", borderRadius: 16 } })) : list.filter(isGameApp).map((a) => /* @__PURE__ */ React.createElement(GameShotCard, { key: a.trackId + "-" + sec.k, app: a, onClick: open })));
    }));
  };
  const PLAY_GAME_CATS = [
    { ar: "\u0627\u0644\u062D\u0631\u0643\u0629", en: "Action", term: "action games", icon: "heli", color: "#E53935" },
    { ar: "\u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629", en: "Simulation", term: "simulation games", icon: "sim", color: "#26A69A" },
    { ar: "\u0623\u0644\u063A\u0627\u0632", en: "Puzzle", term: "puzzle games", icon: "puzzle", color: "#1E88E5" },
    { ar: "\u0627\u0644\u0645\u063A\u0627\u0645\u0631\u0627\u062A", en: "Adventure", term: "adventure games", icon: "compass", color: "#F6BF26" },
    { ar: "\u0633\u0628\u0627\u0642", en: "Racing", term: "racing games", icon: "flag", color: "#7E57C2" },
    { ar: "\u062A\u0642\u0645\u0635 \u0627\u0644\u0623\u062F\u0648\u0627\u0631", en: "Role playing", term: "role playing games", icon: "swords", color: "#5C6BC0" },
    { ar: "\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629", en: "Strategy", term: "strategy games", icon: "sflag", color: "#43A047" },
    { ar: "\u0631\u064A\u0627\u0636\u0629", en: "Sports", term: "sports games", icon: "tennis", color: "#EC407A" },
    { ar: "\u0627\u0644\u0648\u0631\u0642", en: "Cards", term: "card games", icon: "cards", color: "#F06292" },
    { ar: "\u0644\u0648\u062D\u064A\u0629", en: "Board", term: "board games", icon: "rook", color: "#43A047" }
  ];
  const PLAY_APP_CATS = [
    { ar: "\u062A\u0631\u0641\u064A\u0647", en: "Entertainment", term: "entertainment", icon: "clapper", color: "#7E57C2" },
    { ar: "\u0627\u062C\u062A\u0645\u0627\u0639\u064A", en: "Social", term: "social", icon: "people", color: "#EF5350" },
    { ar: "\u0623\u062F\u0648\u0627\u062A", en: "Tools", term: "tools utilities", icon: "tools", color: "#26A69A" },
    { ar: "\u062A\u0635\u0648\u064A\u0631", en: "Photography", term: "photo video", icon: "camera", color: "#42A5F5" },
    { ar: "\u0645\u0648\u0633\u064A\u0642\u0649", en: "Music", term: "music", icon: "note", color: "#FF7043" },
    { ar: "\u062A\u0633\u0648\u0642", en: "Shopping", term: "shopping", icon: "bag", color: "#26C6DA" }
  ];
  const playCatLabel = (c) => _lang === "ar" ? c.ar : c.en;
  const PlayGlyph = ({ icon, color }) => {
    const f = color || "currentColor";
    const I = (d) => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "28", height: "28", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: f, d }));
    const paths = {
      heli: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z",
      sim: "M18.25 7.6l-5.5-3.18c-.46-.27-1.04-.27-1.5 0L5.75 7.6c-.46.27-.75.76-.75 1.3v6.35c0 .54.29 1.03.75 1.3l5.5 3.18c.46.27 1.04.27 1.5 0l5.5-3.18c.46-.27.75-.76.75-1.3V8.9c0-.54-.29-1.03-.75-1.3zM7 14.96v-4.62l4 2.32v4.61l-4-2.31zm5-4.03L8 8.61l4-2.31 4 2.31-4 2.32zm1 6.34v-4.61l4-2.32v4.62l-4 2.31z",
      puzzle: "M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z",
      compass: "M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z",
      flag: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
      swords: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
      sflag: "M17 10.43V2H7v8.43c0 .35.18.68.49.86l4.18 2.51-.99 2.34-3.41-.29 2.59 2.24L9.07 22 12 20.23 14.93 22l-.78-3.91 2.59-2.24-3.41.29-.99-2.34 4.18-2.51c.3-.18.48-.5.48-.86zM13 12.23l-1 .6-1-.6V3h2v9.23z",
      tennis: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.3l1.35-.95c1.82.56 3.37 1.76 4.38 3.34l-.39 1.34-1.35.46L13 6.7V5.3zm-3.35.95L11 5.3v1.4L7.01 9.49l-1.35-.46-.39-1.34c1.01-1.57 2.56-2.77 4.38-3.34zM7.08 17.11l-1.14.1A7.94 7.94 0 014 12c0-.12.01-.23.01-.35l1-.73 1.38.48 1.46 4.34-.77 1.37zm7.42 2.48c-.79.26-1.63.41-2.5.41s-1.71-.15-2.5-.41l-.69-1.49.64-1.1h5.11l.64 1.11-.7 1.48zM14.27 15H9.73l-1.35-4.02L12 8.44l3.63 2.54L14.27 15zm3.79 2.21l-.77-1.37 1.46-4.34 1.38-.48 1 .73c.01.11.01.23.01.35 0 1.99-.73 3.81-1.94 5.21l-1.14-.1z",
      cards: "M2.53 19.65l1.34.56v-9.03l-2.43 5.86c-.41 1.02.08 2.19 1.09 2.61zm19.5-3.7L17.07 3.98c-.31-.75-1.04-1.21-1.81-1.23-.26 0-.53.04-.79.15L7.1 5.95c-.75.31-1.21 1.03-1.23 1.8-.01.27.04.54.15.8l4.96 11.97c.31.76 1.05 1.22 1.83 1.23.26 0 .52-.05.77-.15l7.36-3.05c1.02-.42 1.51-1.59 1.09-2.6zM7.88 8.75c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-2 11c0 1.1.9 2 2 2h1.45l-3.45-8.34v6.34z",
      rook: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
      clapper: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z",
      people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
      tools: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
      camera: "M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
      note: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
      bag: "M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"
    };
    return paths[icon] ? I(paths[icon]) : null;
  };
  const fmtCount = (n) => {
    n = Number(n) || 0;
    const ar = _lang === "ar";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + (ar ? " \u0645\u0644\u064A\u0627\u0631+" : "B+");
    if (n >= 1e6) return Math.max(1, Math.round(n / 1e6)) + (ar ? " \u0645\u0644\u064A\u0648\u0646+" : "M+");
    if (n >= 1e3) return Math.max(1, Math.round(n / 1e3)) + (ar ? " \u0623\u0644\u0641+" : "K+");
    return n ? String(n) : "";
  };
  const SearchAdRow = ({ app, onOpen }) => {
    if (!app) return null;
    const rating = fmtRating(app.averageUserRating);
    const count = fmtCount(app.userRatingCount);
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "ps-ad-row", onClick: () => onOpen(app) }, /* @__PURE__ */ React.createElement(SmartImg, { src: app.artworkUrl100 || app.artworkUrl60 || "", kind: "icon", className: "ps-ad-icon" }), /* @__PURE__ */ React.createElement("span", { className: "ps-ad-mid" }, /* @__PURE__ */ React.createElement("span", { className: "ps-ad-name" }, app.trackName), /* @__PURE__ */ React.createElement("span", { className: "ps-ad-dev" }, app.artistName || ""), /* @__PURE__ */ React.createElement("span", { className: "ps-ad-pills" }, rating !== "\u2014" && /* @__PURE__ */ React.createElement("span", { className: "ps-pill" }, "\u2605 ", rating), count && /* @__PURE__ */ React.createElement("span", { className: "ps-pill" }, "\u2193 ", count))));
  };
  const MicGlyph = ({ cancel }) => cancel ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 -960 960 960", width: "22", height: "22", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z" }));
  const Search = ({ nav, open, initQ, photo, onOpenAccount }) => {
    const [q, setQ] = useState(initQ || "");
    const [res, setRes] = useState([]);
    const [ld, setLd] = useState(false);
    const [hist, setHist] = useState(() => getS("apk_search_history", []));
    const [panel, setPanel] = useState(!!(initQ && String(initQ).trim()));
    const [submitted, setSubmitted] = useState(!!(initQ && String(initQ).trim()));
    const [suggest, setSuggest] = useState([]);
    const [ads, setAds] = useState([]);
    const [hearing, setHearing] = useState(false);
    const ref = useRef(null);
    const recRef = useRef(null);
    useEffect(() => {
      let cancel = false;
      api.search("best apps", 12).then((list) => {
        if (!cancel) setAds((list || []).slice(0, 8));
      }).catch(() => {
      });
      return () => {
        cancel = true;
      };
    }, []);
    useEffect(() => {
      if (!panel || submitted) {
        setSuggest([]);
        return;
      }
      const term = q.trim();
      if (!term) {
        setSuggest([]);
        return;
      }
      let cancel = false;
      const timer = setTimeout(async () => {
        try {
          const list = await api.search(term, 8);
          if (!cancel) setSuggest((list || []).slice(0, 6));
        } catch (e) {
          if (!cancel) setSuggest([]);
        }
      }, 220);
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    }, [q, panel, submitted]);
    useEffect(() => {
      if (!submitted) return;
      const term = q.trim();
      if (!term) {
        setRes([]);
        setLd(false);
        return;
      }
      let cancel = false;
      setLd(true);
      api.search(term, 30).then((list) => {
        if (!cancel) setRes(list || []);
      }).catch(() => {
        if (!cancel) setRes([]);
      }).finally(() => {
        if (!cancel) setLd(false);
      });
      return () => {
        cancel = true;
      };
    }, [submitted, q]);
    const openPanel = () => {
      setPanel(true);
      setSubmitted(false);
      setRes([]);
      setTimeout(() => {
        try {
          ref.current && ref.current.focus();
        } catch (e) {
        }
      }, 40);
    };
    const closePanel = () => {
      setPanel(false);
      setSubmitted(false);
      setQ("");
      setSuggest([]);
      setRes([]);
      try {
        ref.current && ref.current.blur();
      } catch (e) {
      }
    };
    const doS = (term) => {
      const v = String(term == null ? q : term).trim();
      if (!v) return;
      pushSearchHist(v, "apps");
      setHist(getS("apk_search_history", []));
      setQ(v);
      setPanel(true);
      setSubmitted(true);
      setSuggest([]);
      try {
        ref.current && ref.current.blur();
      } catch (e) {
      }
    };
    const startVoice = (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (hearing && recRef.current) {
        try {
          recRef.current.abort();
        } catch (err) {
        }
        setHearing(false);
        return;
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setPanel(true);
      setSubmitted(false);
      if (!SR) {
        try {
          if (window.__apkToast) window.__apkToast(_lang === "ar" ? "\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0635\u0648\u062A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u062D" : "Voice search is not available in this browser");
        } catch (err) {
        }
        setTimeout(() => {
          try {
            ref.current && ref.current.focus();
          } catch (err) {
          }
        }, 40);
        return;
      }
      try {
        if (recRef.current) recRef.current.abort();
      } catch (err) {
      }
      const rec = new SR();
      recRef.current = rec;
      rec.lang = _lang === "ar" ? "ar-SA" : "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => setHearing(true);
      rec.onend = () => setHearing(false);
      rec.onerror = () => setHearing(false);
      rec.onresult = (ev) => {
        let said = "";
        for (let i = 0; i < ev.results.length; i++) said += ev.results[i][0].transcript;
        said = said.trim();
        if (!said) return;
        setQ(said);
        if (ev.results[ev.results.length - 1].isFinal) doS(said);
      };
      try {
        rec.start();
      } catch (err) {
        setHearing(false);
      }
    };
    const openCat = (c) => nav(`/category/${encodeURIComponent(c.term)}`);
    const ar = _lang === "ar";
    const catGrid = (list, title) => /* @__PURE__ */ React.createElement("section", { className: "ps-sec" }, /* @__PURE__ */ React.createElement("h2", { className: "ps-sec-title" }, title), /* @__PURE__ */ React.createElement("div", { className: "ps-cat-grid" }, list.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.term, type: "button", className: "ps-cat", onClick: () => openCat(c) }, /* @__PURE__ */ React.createElement("span", { className: "ps-cat-ico" }, /* @__PURE__ */ React.createElement(PlayGlyph, { icon: c.icon, color: c.color })), /* @__PURE__ */ React.createElement("span", { className: "ps-cat-name" }, playCatLabel(c))))));
    return /* @__PURE__ */ React.createElement("div", { className: "ps-search", dir: ar ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("div", { className: "ps-top" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "ps-avatar", onClick: onOpenAccount, "aria-label": t("account") }, photo ? /* @__PURE__ */ React.createElement("img", { src: photo, alt: "" }) : /* @__PURE__ */ React.createElement("span", null, "GO")), /* @__PURE__ */ React.createElement("div", { className: "ps-bar", onClick: openPanel, role: "button", tabIndex: 0 }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `ps-mic-in ${hearing ? "on" : ""}`, "aria-label": "mic", onClick: startVoice }, /* @__PURE__ */ React.createElement(MicGlyph, { cancel: hearing })), /* @__PURE__ */ React.createElement("span", null, t("search_placeholder")), /* @__PURE__ */ React.createElement(Icon, { name: "search", className: "w-5 h-5" }))), catGrid(PLAY_GAME_CATS, ar ? "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0623\u0644\u0639\u0627\u0628" : "Explore games"), /* @__PURE__ */ React.createElement("section", { className: "ps-sec" }, /* @__PURE__ */ React.createElement("div", { className: "ps-ad-head" }, /* @__PURE__ */ React.createElement("span", null, ar ? "\u0625\u0639\u0644\u0627\u0646 \u2022 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0643" : "Ad \u2022 Suggested for you"), /* @__PURE__ */ React.createElement("span", { className: "ps-dots" }, "\u22EE")), /* @__PURE__ */ React.createElement("div", { className: "ps-ad-scroller" }, ads.slice(0, 6).map((a) => /* @__PURE__ */ React.createElement("button", { key: a.trackId, type: "button", className: "ps-ad-card", onClick: () => open(a) }, /* @__PURE__ */ React.createElement("img", { src: a.artworkUrl100 || a.artworkUrl60 || "", alt: "" }), /* @__PURE__ */ React.createElement("span", null, a.trackName), /* @__PURE__ */ React.createElement("em", null, "\u2605 ", fmtRating(a.averageUserRating)))))), catGrid(PLAY_APP_CATS, ar ? "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A" : "Explore apps"), panel && /* @__PURE__ */ React.createElement("div", { className: "search-page ps-panel", dir: ar ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("div", { className: "ps-panel-bar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "ps-back", onClick: closePanel, "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("input", { ref, value: q, onChange: (e) => {
      setQ(e.target.value);
      setSubmitted(false);
    }, onKeyDown: (e) => {
      if (e.key === "Enter") doS(q);
    }, placeholder: ar ? "\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0627\u0644\u0623\u0644\u0639\u0627\u0628" : t("search_placeholder"), className: "ps-panel-input" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: `ps-mic ${hearing ? "on" : ""}`, "aria-label": "mic", onClick: startVoice }, /* @__PURE__ */ React.createElement(MicGlyph, { cancel: hearing }))), /* @__PURE__ */ React.createElement("div", { className: "search-page-body" }, submitted ? /* @__PURE__ */ React.createElement(React.Fragment, null, ld && /* @__PURE__ */ React.createElement("div", { className: "px-4 mt-4 space-y-3" }, Array(5).fill(0).map((_, i) => /* @__PURE__ */ React.createElement(Skel, { key: i, c: "h-16 w-full" }))), !ld && res.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ps-result-list" }, res.map((a) => /* @__PURE__ */ React.createElement(SearchAdRow, { key: a.trackId, app: a, onOpen: open }))), !ld && res.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "px-4 mt-8 text-center text-muted-foreground text-sm" }, t("app_not_found"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ps-ad-head px" }, /* @__PURE__ */ React.createElement("span", null, ar ? "\u0625\u0639\u0644\u0627\u0646 \u2022 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0643" : "Ad \u2022 Suggested for you"), /* @__PURE__ */ React.createElement("span", { className: "ps-dots" }, "\u22EE")), /* @__PURE__ */ React.createElement("div", { className: "ps-result-list" }, (q.trim() && suggest.length ? suggest : ads).slice(0, 4).map((a) => /* @__PURE__ */ React.createElement(SearchAdRow, { key: a.trackId, app: a, onOpen: open }))), /* @__PURE__ */ React.createElement("h3", { className: "ps-block-title" }, ar ? "\u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u062C\u0627\u0631\u064A\u0629 \u0627\u0644\u0622\u0646" : "Happening now"), /* @__PURE__ */ React.createElement("h3", { className: "ps-block-title" }, ar ? "\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u062A\u064A \u062A\u0645\u062A \u0645\u0624\u062E\u0631\u064B\u0627" : "Recent searches"), hist.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "px-4 text-sm text-muted-foreground" }, _lang === "ar" ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0645\u0644\u064A\u0627\u062A \u0628\u062D\u062B \u062D\u062F\u064A\u062B\u0629" : "No recent searches") : hist.slice(0, 8).map((h) => /* @__PURE__ */ React.createElement("button", { key: h, type: "button", className: "ps-hist", onClick: () => doS(h) }, /* @__PURE__ */ React.createElement("span", { className: "ps-hist-go" }, "\u2197"), /* @__PURE__ */ React.createElement("span", { className: "ps-hist-txt" }, h), /* @__PURE__ */ React.createElement("span", { className: "ps-hist-ico" }, "\u21BB")))))));
  };
  const fmtSize = (bytes) => {
    if (!bytes) return "\u2014";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(0) + " KB";
    return mb.toFixed(1) + " MB";
  };
  const fmtDate = (iso) => {
    if (!iso) return "\u2014";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return iso.slice(0, 10);
    }
  };
  const fmtRating = (r) => {
    if (r == null || isNaN(r)) return "\u2014";
    return Number(r).toFixed(1);
  };
  const ratingDistribution = (avgRating) => {
    const avg = Math.min(5, Math.max(1, Number(avgRating) || 4.3));
    const stars = [5, 4, 3, 2, 1];
    const raw = stars.map((s) => {
      const diff = s - avg;
      let w = Math.exp(-(diff * diff) / 2.4);
      if (s === 5) w *= 1.45;
      if (s === 1) w *= 1.15;
      return w;
    });
    const sum = raw.reduce((a, b) => a + b, 0);
    const percents = raw.map((w) => Math.round(w / sum * 100));
    const diffSum = 100 - percents.reduce((a, b) => a + b, 0);
    percents[0] += diffSum;
    const result = {};
    stars.forEach((s, i) => result[s] = Math.max(0, percents[i]));
    return result;
  };
  const fetchReviews = (id, page = 1) => fetchC(`https://itunes.apple.com/${country()}/rss/customerreviews/id=${encodeURIComponent(id)}/sortBy=mostRecent/page=${page}/json`).then((d) => {
    var _a;
    const entries = Array.isArray((_a = d == null ? void 0 : d.feed) == null ? void 0 : _a.entry) ? d.feed.entry : [];
    return entries.filter((e) => e && e["im:rating"]).map((e) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      return {
        id: ((_a2 = e.id) == null ? void 0 : _a2.label) || "",
        author: ((_c = (_b = e.author) == null ? void 0 : _b.name) == null ? void 0 : _c.label) || "App Store User",
        rating: Number(((_d = e["im:rating"]) == null ? void 0 : _d.label) || 0),
        title: ((_e = e.title) == null ? void 0 : _e.label) || "",
        content: ((_f = e.content) == null ? void 0 : _f.label) || "",
        updated: ((_g = e.updated) == null ? void 0 : _g.label) || ""
      };
    });
  });
  const STORE_CONFIGS = {
    direct: { id: "direct", labelKey: "store_direct", label: "\u0645\u0628\u0627\u0634\u0631", icon: "direct", platform: "android", kind: "direct", buildUrl: (name) => "" },
    google: { id: "google", labelKey: "store_play", label: "Google Play Store", icon: "playstore", platform: "android", buildUrl: (name) => `https://play.google.com/store/search?q=${encodeURIComponent(name)}&c=apps` },
    apkcombo: { id: "apkcombo", label: "APKCombo", icon: "apkcombo", platform: "android", buildUrl: (name) => `https://apkcombo.com/search/${encodeURIComponent(name)}` },
    apkpure: { id: "apkpure", label: "APKPure", icon: "apkpure", platform: "android", buildUrl: (name) => `https://apkpure.com/search?q=${encodeURIComponent(name)}` },
    apkmirror: { id: "apkmirror", label: "APKMirror", icon: "apkpure", platform: "android", buildUrl: (name) => `https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(name)}` },
    happymod: { id: "happymod", labelKey: "store_happymod", label: "HappyMod", icon: "happymod", platform: "android", buildUrl: (name) => `https://happymod.com/search.html?q=${encodeURIComponent(name)}` },
    uptodown: { id: "uptodown", labelKey: "store_uptodown", label: "Uptodown", icon: "uptodown", platform: "android", buildUrl: (name) => `https://en.uptodown.com/android/search/${encodeURIComponent(name)}` },
    apple: { id: "apple", label: "App Store", icon: "applestore", platform: "ios", buildUrl: (name, app) => app && app.trackViewUrl ? app.trackViewUrl : `https://apps.apple.com/search?term=${encodeURIComponent(name)}` },
    microsoft: { id: "microsoft", label: "Microsoft Store", icon: "microsoft", platform: "windows", buildUrl: (name) => `https://apps.microsoft.com/search?query=${encodeURIComponent(name)}` }
  };
  const INSTALL_SOURCE_IDS = ["direct", "google", "apkpure", "apkcombo", "apkmirror", "happymod", "uptodown"];
  const storeLabel = (cfg) => cfg ? cfg.labelKey ? t(cfg.labelKey) : cfg.label || cfg.id : "";
  const normalizeStore = (id) => INSTALL_SOURCE_IDS.includes(id) ? id : "direct";
  const corsWraps = (u) => [
    u,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`
  ];
  const parseMaybeJson = async (res) => {
    const txt = await res.text();
    if (!txt) return null;
    try {
      const j = JSON.parse(txt);
      if (j && typeof j.contents === "string") {
        try {
          return JSON.parse(j.contents);
        } catch (e) {
          return j;
        }
      }
      return j;
    } catch (e) {
      return null;
    }
  };
  const normName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
  const pickAptoideApp = (list, name, bundle) => {
    if (!Array.isArray(list) || !list.length) return null;
    const n = normName(name);
    const b = String(bundle || "").toLowerCase();
    let best = null, bestScore = -1;
    for (const it of list) {
      if (!it) continue;
      const path = it.file && (it.file.path || it.file.path_alt) || it.path || it.path_alt || "";
      if (!path) continue;
      let score = 0;
      const pkg = String(it.package || "").toLowerCase();
      const nm = normName(it.name);
      if (b && pkg === b) score += 120;
      else if (b && pkg.indexOf(b) >= 0) score += 70;
      if (n && nm === n) score += 100;
      else if (n && (nm.indexOf(n) >= 0 || n.indexOf(nm) >= 0)) score += 60;
      if (/\.apk(\?|$)/i.test(path)) score += 15;
      if (Number(it.stats && it.stats.pdownloads || it.stats && it.stats.downloads || 0) > 0) score += Math.min(20, Math.log10(Number(it.stats.pdownloads || it.stats.downloads) + 1));
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
    return best || list.find((x) => x && (x.file && x.file.path || x.path)) || null;
  };
  const extractApkPath = (it) => {
    if (!it) return "";
    return it.file && (it.file.path || it.file.path_alt) || it.path || it.path_alt || "";
  };
  async function resolveDirectApk(app) {
    const name = String(app && app.trackName || "").trim();
    const bundle = String(app && app.bundleId || "").trim();
    const queries = [name, name.replace(/[:\-–].*$/, "").trim(), bundle].filter((v, i, a) => v && a.indexOf(v) === i);
    for (const q of queries) {
      const apiUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=10`;
      for (const u of corsWraps(apiUrl)) {
        try {
          const r = await fetch(u, { headers: { "Accept": "application/json" } });
          if (!r.ok) continue;
          const d = await parseMaybeJson(r);
          const list = d && d.datalist && d.datalist.list || d && d.list || [];
          const pick = pickAptoideApp(list, name, bundle);
          const path = extractApkPath(pick);
          if (path) return { url: path, pkg: pick.package || bundle, title: pick.name || name };
        } catch (e) {
        }
      }
    }
    if (bundle) {
      return {
        url: `https://d.apkpure.com/b/APK/${encodeURIComponent(bundle)}?version=latest`,
        pkg: bundle,
        title: name,
        guessed: true
      };
    }
    return null;
  }
  const triggerApkDownload = (url, filename) => {
    if (!url) return false;
    try {
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename || "app.apk");
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          a.remove();
        } catch (e) {
        }
      }, 1500);
      return true;
    } catch (e) {
      try {
        window.location.href = url;
        return true;
      } catch (e2) {
        return false;
      }
    }
  };
  const BrandIcon = ({ name }) => {
    const svgs = {
      globe: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 2a10 10 0 100 20 10 10 0 000-20zm7 6h-3c-.3-1.3-.8-2.5-1.4-3.6A8 8 0 0118.9 8zm-7-4a14 14 0 012 4h-4a14 14 0 012-4zM4.3 14a8.2 8.2 0 010-4h3.3a16.5 16.5 0 000 4H4.3zm.8 2h3a14 14 0 001.3 3.6A8 8 0 015.1 16zm3-8H5a8 8 0 014.3-3.6L8 8zM12 20a14 14 0 01-2-4h4a14 14 0 01-2 4zm2.3-6H9.7a14.7 14.7 0 010-4h4.6a14.6 14.6 0 010 4zm.3 5.6c.6-1.2 1-2.4 1.4-3.6h3a8 8 0 01-4.4 3.6zm1.8-5.6a16.5 16.5 0 000-4h3.3a8.2 8.2 0 010 4h-3.3z" })),
      google: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })),
      youtube: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" })),
      facebook: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" })),
      instagram: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" })),
      playstore: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 960 960", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M313,902q-40,23-84.5,18T155,881L473,564q12-12 28-12t28,12L666,700L313,902ZM419,510L121,808q-1-3-1-7.5t0-7.5V168q0-3 0.5-6.5T121,155L419,454q11,11 11,28t-11,28ZM735,660L584,510q-12-12-12-28.5T584,453L736,301l118,67q30,17 48,47t18,65t-18.5,65T852,593L735,660ZM530,399q-12,12-28.5,12T473,399L153,80q28-37 74-41.5T315,58L667,260L530,399Z" })),
      applestore: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" })),
      microsoft: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "9", height: "9", rx: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "2", width: "9", height: "9", rx: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "13", width: "9", height: "9", rx: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "13", width: "9", height: "9", rx: "0.5", fill: "currentColor" })),
      apkpure: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 3.2L3.8 20.5h3.4l1.7-4.2h6.2l1.7 4.2h3.4L12 3.2zm0 4.6l2.3 5.7H9.7L12 7.8z" })),
      apkcombo: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.2.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" })),
      whatsapp: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5C10 9.9 9.4 8.4 9.1 7.8c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4C6.7 8 6 8.7 6 10.1c0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.3z" }), /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M20.5 3.5A11.8 11.8 0 0012 0 11.9 11.9 0 001 17.8L0 24l6.3-1.6A11.9 11.9 0 0012 24a11.9 11.9 0 008.4-20.5zM12 21.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1121.8 12 9.9 9.9 0 0112 21.8z" })),
      telegram: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M22 3.5L2.6 11c-1 .4-1 1 .1 1.3l4.8 1.5 1.9 5.8c.2.6.5.7.9.4l2.6-2.2 4.6 3.4c.7.5 1.2.3 1.4-.6l3-14C22.2 3.7 22.6 3.3 22 3.5zM7.9 13.5l9.2-5.8c.4-.3.8-.1.5.2l-7.5 6.8-.3 3.2-1.9-4.4z" })),
      github: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 011.2-3.2 4.3 4.3 0 010-3.2s1-.3 3.3 1.2a11.4 11.4 0 016 0c2.3-1.6 3.3-1.2 3.3-1.2a4.3 4.3 0 010 3.2 4.6 4.6 0 011.2 3.2c0 4.7-2.9 5.7-5.6 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3z" })),
      bluetooth: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("polygon", { points: "6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" })),
      quickshare: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "8.6", y1: "10.5", x2: "15.4", y2: "6.5" }), /* @__PURE__ */ React.createElement("line", { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5" })),
      copy: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" })),
      share: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "8.6", y1: "10.5", x2: "15.4", y2: "6.5" }), /* @__PURE__ */ React.createElement("line", { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5" })),
      direct: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M8 21h8" })),
      happymod: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", fill: "currentColor", opacity: ".18" }), /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M7.2 15.2V8.8h2.1l2.7 4.3 2.7-4.3h2.1v6.4h-1.7V11.4l-2.4 3.8h-1.4L8.9 11.4v3.8H7.2z" })),
      uptodown: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M6 4h12v3.2H6V4zm2.2 5.2h7.6L12 20 8.2 9.2z" }))
    };
    return svgs[name] || null;
  };
  const DetailTopBar = ({ app, isFav, onToggleFav, onShare, onOpenIn, onToggleTheme, isDark, onInfo, onBack }) => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
      if (!open) return;
      const k = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [open]);
    const run = (fn) => () => {
      setOpen(false);
      if (fn) fn();
    };
    const ar = _lang === "ar";
    return /* @__PURE__ */ React.createElement("div", { className: "hdr-top-row dt-bar flex items-center px-4 max-w-screen-2xl mx-auto w-full sticky top-0 z-40 bg-[hsl(var(--bg))]", style: { direction: "ltr" } }, /* @__PURE__ */ React.createElement("div", { className: "dt-left" }, app && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dt-menu-wrap" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip shrink-0", onClick: () => setOpen((o) => !o), "aria-label": t("more_options"), "aria-haspopup": "menu", "aria-expanded": open }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", className: "w-5 h-5" })), open && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dt-scrim", onClick: () => setOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "dt-menu", role: "menu", dir: ar ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "dt-item", onClick: run(onShare) }, /* @__PURE__ */ React.createElement(BrandIcon, { name: "share" }), /* @__PURE__ */ React.createElement("span", null, t("dt_share"))), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "dt-item", onClick: run(onOpenIn) }, /* @__PURE__ */ React.createElement(Icon, { name: "external", className: "w-5 h-5" }), /* @__PURE__ */ React.createElement("span", null, t("dt_open_in"))), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "dt-item", onClick: run(onToggleTheme) }, /* @__PURE__ */ React.createElement(Icon, { name: isDark ? "sun" : "moon", className: "w-5 h-5" }), /* @__PURE__ */ React.createElement("span", null, t("dt_theme"))), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "dt-item", onClick: run(onInfo) }, /* @__PURE__ */ React.createElement(Icon, { name: "info", className: "w-5 h-5" }), /* @__PURE__ */ React.createElement("span", null, t("dt_info")))))), /* @__PURE__ */ React.createElement("button", { type: "button", className: `nav-chip dt-fav shrink-0 ${isFav ? "on" : ""}`, onClick: onToggleFav, "aria-label": isFav ? t("dt_unsave") : t("dt_save"), "aria-pressed": !!isFav }, /* @__PURE__ */ React.createElement(Icon, { name: isFav ? "bookmarkFill" : "bookmark", className: "w-5 h-5" })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip shrink-0", onClick: onBack, "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowRight", className: "w-5 h-5" })));
  };
  const IT_LABELS = {
    trackName: ["\u0627\u0633\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "App name"],
    trackCensoredName: ["\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0631\u0648\u0636", "Censored name"],
    artistName: ["\u0627\u0644\u0645\u0637\u0648\u0651\u0631", "Developer"],
    sellerName: ["\u0627\u0644\u0628\u0627\u0626\u0639", "Seller"],
    bundleId: ["\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062D\u0632\u0645\u0629", "Bundle ID"],
    trackId: ["\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "Track ID"],
    artistId: ["\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0637\u0648\u0651\u0631", "Artist ID"],
    sellerUrl: ["\u0645\u0648\u0642\u0639 \u0627\u0644\u0645\u0637\u0648\u0651\u0631", "Developer website"],
    artistViewUrl: ["\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0637\u0648\u0651\u0631", "Developer page"],
    trackViewUrl: ["\u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "App page"],
    version: ["\u0627\u0644\u0625\u0635\u062F\u0627\u0631", "Version"],
    releaseDate: ["\u062A\u0627\u0631\u064A\u062E \u0623\u0648\u0644 \u0625\u0635\u062F\u0627\u0631", "First release"],
    currentVersionReleaseDate: ["\u062A\u0627\u0631\u064A\u062E \u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B", "Last update"],
    releaseNotes: ["\u0645\u0627 \u0627\u0644\u062C\u062F\u064A\u062F", "Release notes"],
    description: ["\u0627\u0644\u0648\u0635\u0641", "Description"],
    price: ["\u0627\u0644\u0633\u0639\u0631", "Price"],
    formattedPrice: ["\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0639\u0631\u0648\u0636", "Formatted price"],
    currency: ["\u0627\u0644\u0639\u0645\u0644\u0629", "Currency"],
    fileSizeBytes: ["\u0627\u0644\u062D\u062C\u0645", "File size"],
    minimumOsVersion: ["\u0623\u062F\u0646\u0649 \u0625\u0635\u062F\u0627\u0631 \u0644\u0644\u0646\u0638\u0627\u0645", "Minimum OS version"],
    supportedDevices: ["\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629", "Supported devices"],
    features: ["\u0627\u0644\u0645\u064A\u0632\u0627\u062A", "Features"],
    advisories: ["\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A", "Advisories"],
    languageCodesISO2A: ["\u0627\u0644\u0644\u063A\u0627\u062A", "Languages"],
    primaryGenreName: ["\u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", "Primary genre"],
    primaryGenreId: ["\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", "Primary genre ID"],
    genres: ["\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A", "Genres"],
    genreIds: ["\u0645\u0639\u0631\u0651\u0641\u0627\u062A \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A", "Genre IDs"],
    contentAdvisoryRating: ["\u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0639\u0645\u0631\u064A", "Age rating"],
    trackContentRating: ["\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u062D\u062A\u0648\u0649", "Content rating"],
    averageUserRating: ["\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u062A\u0642\u064A\u064A\u0645", "Average rating"],
    userRatingCount: ["\u0639\u062F\u062F \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A", "Rating count"],
    averageUserRatingForCurrentVersion: ["\u0645\u062A\u0648\u0633\u0637 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u062D\u0627\u0644\u064A", "Average rating (current version)"],
    userRatingCountForCurrentVersion: ["\u0639\u062F\u062F \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u062D\u0627\u0644\u064A", "Rating count (current version)"],
    isGameCenterEnabled: ["\u0645\u0631\u0643\u0632 \u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Game Center"],
    isVppDeviceBasedLicensingEnabled: ["\u062A\u0631\u062E\u064A\u0635 VPP \u0644\u0644\u0623\u062C\u0647\u0632\u0629", "VPP device licensing"],
    kind: ["\u0627\u0644\u0646\u0648\u0639", "Kind"],
    wrapperType: ["\u0646\u0648\u0639 \u0627\u0644\u0639\u0646\u0635\u0631", "Wrapper type"],
    artworkUrl60: ["\u0627\u0644\u0623\u064A\u0642\u0648\u0646\u0629 60", "Icon 60"],
    artworkUrl100: ["\u0627\u0644\u0623\u064A\u0642\u0648\u0646\u0629 100", "Icon 100"],
    artworkUrl512: ["\u0627\u0644\u0623\u064A\u0642\u0648\u0646\u0629 512", "Icon 512"],
    screenshotUrls: ["\u0644\u0642\u0637\u0627\u062A \u0627\u0644\u0634\u0627\u0634\u0629 (iPhone)", "Screenshots (iPhone)"],
    ipadScreenshotUrls: ["\u0644\u0642\u0637\u0627\u062A \u0627\u0644\u0634\u0627\u0634\u0629 (iPad)", "Screenshots (iPad)"],
    appletvScreenshotUrls: ["\u0644\u0642\u0637\u0627\u062A \u0627\u0644\u0634\u0627\u0634\u0629 (Apple TV)", "Screenshots (Apple TV)"]
  };
  const IT_ORDER = Object.keys(IT_LABELS);
  const IT_DATE_KEYS = ["releaseDate", "currentVersionReleaseDate"];
  const IT_COUNT_KEYS = ["userRatingCount", "userRatingCountForCurrentVersion"];
  const IT_LONG_KEYS = ["description", "releaseNotes"];
  const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
  const InfoVal = ({ k, v }) => {
    const dash = /* @__PURE__ */ React.createElement("span", { className: "dt-muted" }, "\u2014");
    if (v === null || v === void 0 || v === "") return dash;
    if (typeof v === "boolean") return /* @__PURE__ */ React.createElement("span", null, v ? t("dt_yes") : t("dt_no"));
    if (Array.isArray(v)) {
      if (!v.length) return dash;
      if (v.every(isHttpUrl)) return /* @__PURE__ */ React.createElement("div", { className: "dt-thumbs" }, v.map((u, i) => /* @__PURE__ */ React.createElement("a", { key: i, href: u, target: "_blank", rel: "noopener noreferrer" }, /* @__PURE__ */ React.createElement("img", { className: "shot", src: u, alt: "", loading: "lazy" }))));
      return /* @__PURE__ */ React.createElement("div", { className: "dt-chips" }, v.map((x, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "dt-chip" }, typeof x === "object" ? JSON.stringify(x) : String(x))));
    }
    if (typeof v === "object") return /* @__PURE__ */ React.createElement("div", { className: "dt-long", dir: "ltr", style: { fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: ".8rem" } }, JSON.stringify(v, null, 2));
    if (k === "fileSizeBytes" && !isNaN(Number(v))) return /* @__PURE__ */ React.createElement("span", null, fmtSize(Number(v)), " ", /* @__PURE__ */ React.createElement("span", { className: "dt-muted" }, "(", Number(v).toLocaleString(), " B)"));
    if (IT_DATE_KEYS.includes(k)) return /* @__PURE__ */ React.createElement("span", null, fmtDate(v), " ", /* @__PURE__ */ React.createElement("span", { className: "dt-muted", dir: "ltr" }, "(", String(v), ")"));
    if (IT_COUNT_KEYS.includes(k) && !isNaN(Number(v))) return /* @__PURE__ */ React.createElement("span", null, Number(v).toLocaleString());
    if (isHttpUrl(v)) {
      const link = /* @__PURE__ */ React.createElement("a", { href: v, target: "_blank", rel: "noopener noreferrer", dir: "ltr" }, v);
      if (/^artworkUrl/.test(k)) return /* @__PURE__ */ React.createElement("div", { className: "dt-art" }, /* @__PURE__ */ React.createElement("img", { className: "app-icon-img", src: v, alt: "", loading: "lazy" }), link);
      return link;
    }
    if (IT_LONG_KEYS.includes(k)) return /* @__PURE__ */ React.createElement("div", { className: "dt-long", dir: "auto" }, String(v));
    return /* @__PURE__ */ React.createElement("span", null, String(v));
  };
  const AppInfoSheet = ({ app, onClose }) => {
    useEffect(() => {
      const k = (e) => {
        if (e.key === "Escape") onClose && onClose();
      };
      window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [onClose]);
    const ar = _lang === "ar";
    const keys = Object.keys(app || {});
    const ordered = IT_ORDER.filter((k) => keys.includes(k)).concat(keys.filter((k) => !IT_ORDER.includes(k)).sort());
    const label = (k) => {
      const l = IT_LABELS[k];
      return l ? ar ? l[0] : l[1] : k;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "dt-info-overlay", onClick: (e) => {
      if (e.target === e.currentTarget) onClose && onClose();
    } }, /* @__PURE__ */ React.createElement("div", { className: "dt-info-sheet", dir: ar ? "rtl" : "ltr", role: "dialog", "aria-modal": "true", "aria-label": t("dt_info") }, /* @__PURE__ */ React.createElement("div", { className: "dt-info-head" }, /* @__PURE__ */ React.createElement("div", { className: "dt-info-title" }, t("dt_info")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "dt-x", onClick: onClose, "aria-label": t("dt_close") }, /* @__PURE__ */ React.createElement(Icon, { name: "x", className: "w-5 h-5" }))), /* @__PURE__ */ React.createElement("div", { className: "dt-info-body" }, /* @__PURE__ */ React.createElement("div", { className: "dt-info-app" }, /* @__PURE__ */ React.createElement("img", { src: app.artworkUrl512 || app.artworkUrl100 || "", alt: "" }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "dt-info-name" }, app.trackName), /* @__PURE__ */ React.createElement("div", { className: "dt-muted", style: { fontSize: ".85rem" } }, app.artistName))), ordered.map((k) => /* @__PURE__ */ React.createElement("div", { className: "dt-row", key: k }, /* @__PURE__ */ React.createElement("div", { className: "dt-row-k" }, /* @__PURE__ */ React.createElement("span", null, label(k)), IT_LABELS[k] && /* @__PURE__ */ React.createElement("span", { className: "dt-key" }, k)), /* @__PURE__ */ React.createElement("div", { className: "dt-row-v" }, /* @__PURE__ */ React.createElement(InfoVal, { k, v: app[k] })))))));
  };
  const Detail = ({ id, nav, favs, toggle, selStore, expMode, setDetailApp, autoInstall, onToggleTheme, isDark }) => {
    var _a;
    const [app, setApp] = useState(null);
    const [sim, setSim] = useState([]);
    const [ld, setLd] = useState(true);
    const [exp, setExp] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [revLd, setRevLd] = useState(true);
    const [revAll, setRevAll] = useState(false);
    const [revAllLd, setRevAllLd] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [lbIdx, setLbIdx] = useState(null);
    const [peek, setPeek] = useState(false);
    const [peekBare, setPeekBare] = useState(false);
    const [peekSrc, setPeekSrc] = useState("");
    const [peekFrom, setPeekFrom] = useState(null);
    const [peekGo, setPeekGo] = useState(false);
    const [peekOut, setPeekOut] = useState(false);
    const [dlView, setDlView] = useState(() => computeDlProgress(getDlRec(id)));
    const [reqOpen, setReqOpen] = useState(false);
    const toastT = useRef(null);
    const touchX = useRef(null);
    const fileInputRef = useRef(null);
    const dlCancelRef = useRef(false);
    const dlTimerRef = useRef(null);
    const shouldLaunchRef = useRef(false);
    const linkFiredRef = useRef(false);
    const cancelInstall = () => {
      dlCancelRef.current = true;
      shouldLaunchRef.current = false;
      linkFiredRef.current = false;
      if (dlTimerRef.current) {
        clearTimeout(dlTimerRef.current);
        dlTimerRef.current = null;
      }
      clearDlRec(id);
      setDlView({ active: false, phase: "idle", pct: 0 });
    };
    const openFilesPicker = () => {
      const name = String(app && app.trackName || "").trim();
      try {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          fileInputRef.current.click();
          return;
        }
      } catch (e) {
      }
      const q = encodeURIComponent(name);
      const tries = [
        `intent:#Intent;action=android.intent.action.GET_CONTENT;type=*/*;S.android.intent.extra.TITLE=${q};end`,
        `intent:#Intent;action=android.intent.action.OPEN_DOCUMENT;type=*/*;end`,
        `intent:#Intent;action=android.intent.action.SEARCH;S.query=${q};end`
      ];
      const go = (i) => {
        if (i >= tries.length) return;
        try {
          window.location.href = tries[i];
        } catch (e) {
          go(i + 1);
        }
      };
      go(0);
    };
    const [netTry, setNetTry] = useState(0);
    const [waited, setWaited] = useState(false);
    const [failKind, setFailKind] = useState("");
    useEffect(() => {
      window.__apkToast = showToast;
    }, [toastMsg]);
    useEffect(() => {
      let cancel = false;
      setLd(true);
      setFailKind("");
      setWaited(false);
      setApp(null);
      const timer = setTimeout(() => {
        if (!cancel) setWaited(true);
      }, 1e4);
      (async () => {
        try {
          const a = await api.lookup(id);
          if (cancel) return;
          if (!a) {
            setApp(null);
            const offline = typeof navigator !== "undefined" && navigator.onLine === false;
            setFailKind(offline ? "net" : "missing");
            if (setDetailApp) setDetailApp(null);
          } else {
            setApp(a);
            setFailKind("");
            if (setDetailApp) setDetailApp(a);
            if (a.primaryGenreName) {
              const similar = await api.cat(a.primaryGenreName, a.primaryGenreId || 6e3, 10);
              if (!cancel) setSim(similar.filter((x) => x.trackId !== a.trackId).slice(0, 8));
            }
          }
        } catch (e) {
          if (!cancel) {
            setApp(null);
            setFailKind("net");
            if (setDetailApp) setDetailApp(null);
          }
        } finally {
          if (!cancel) setLd(false);
        }
      })();
      return () => {
        cancel = true;
        clearTimeout(timer);
        if (setDetailApp) setDetailApp(null);
      };
    }, [id, netTry]);
    useEffect(() => {
      if (autoInstall && !ld && app) setReqOpen(true);
    }, [autoInstall, ld, app, id]);
    useEffect(() => {
      if (!dlView.active || dlView.phase === "done") return;
      if (!shouldLaunchRef.current || linkFiredRef.current || dlCancelRef.current) return;
      if (!app) return;
      linkFiredRef.current = true;
      shouldLaunchRef.current = false;
      const cfg = STORE_CONFIGS[selStore] || STORE_CONFIGS.google;
      const useDirect = cfg.kind === "direct" || selStore === "direct";
      let href = "#";
      try {
        href = cfg.buildUrl(app.trackName || "", app);
      } catch (e) {
        href = app.trackViewUrl || "#";
      }
      if (useDirect) {
        showToast(t("dl_resolving"));
        resolveDirectApk(app).then((found) => {
          if (dlCancelRef.current) return;
          if (found && found.url) {
            const fn = ((found.title || app.trackName || "app").replace(/[\\/:*?"<>|]+/g, " ").trim() || "app") + ".apk";
            triggerApkDownload(found.url, fn);
            try {
              const cur = getDlRec(app.trackId);
              if (cur) {
                cur.installHref = found.url;
                setS(dlKey(app.trackId), cur);
              }
            } catch (e) {
            }
            try {
              const cur = getDlRec(app.trackId);
              if (cur && !cur.runMs) {
                cur.runMs = Date.now();
                setS(dlKey(app.trackId), cur);
              }
            } catch (e) {
            }
            showToast(t("dl_direct_ok"));
          } else {
            showToast(t("dl_direct_fail"));
          }
        }).catch(() => {
          if (!dlCancelRef.current) showToast(t("dl_direct_fail"));
        });
        return;
      }
      if (isPaidApp(app)) {
        openNativePlayStore(app.trackName || "");
      } else {
        try {
          window.open(href, "_blank", "noopener");
        } catch (e) {
          window.location.href = href;
        }
      }
      try {
        const cur = getDlRec(app.trackId);
        if (cur && !cur.runMs) {
          cur.runMs = Date.now();
          setS(dlKey(app.trackId), cur);
        }
      } catch (e) {
      }
      showToast(t("dl_direct_ok"));
    }, [dlView.active, dlView.phase, app, selStore]);
    useEffect(() => {
      setReviews([]);
      setRevAll(false);
      setRevLd(true);
      setLbIdx(null);
      (async () => {
        try {
          const r = await fetchReviews(id, 1);
          setReviews(r);
        } catch (e) {
          setReviews([]);
        } finally {
          setRevLd(false);
        }
      })();
    }, [id]);
    useEffect(() => {
      const tick = () => {
        const rec = getDlRec(id);
        setDlView(computeDlProgress(rec));
      };
      tick();
      const t2 = setInterval(tick, 250);
      return () => clearInterval(t2);
    }, [id]);
    const shots = (app == null ? void 0 : app.screenshotUrls) || [];
    const promoShot2 = expMode && shots[0] ? shots[0] : null;
    useEffect(() => {
      document.documentElement.classList.toggle("exp-banner", !!promoShot2);
      return () => document.documentElement.classList.remove("exp-banner");
    }, [promoShot2]);
    const showToast = (msg) => {
      setToastMsg(msg);
      if (toastT.current) clearTimeout(toastT.current);
      toastT.current = setTimeout(() => setToastMsg(""), 2500);
    };
    const openLb = (i) => setLbIdx(i);
    const closeLb = () => setLbIdx(null);
    const lbPrev = () => setLbIdx((i) => i == null ? null : i <= 0 ? shots.length - 1 : i - 1);
    const lbNext = () => setLbIdx((i) => i == null ? null : i >= shots.length - 1 ? 0 : i + 1);
    const onLbTouchStart = (e) => {
      touchX.current = e.touches[0].clientX;
    };
    const onLbTouchEnd = (e) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) lbNext();
      else lbPrev();
    };
    const loadAllReviews = async () => {
      setRevAllLd(true);
      try {
        let all = [];
        for (let p = 1; p <= 10; p++) {
          const pr = await fetchReviews(id, p).catch(() => []);
          if (!pr.length) break;
          all = all.concat(pr);
          if (pr.length < 10) break;
        }
        const seen = /* @__PURE__ */ new Set();
        const uniq = [];
        for (const r of all) {
          const k = r.id || `${r.author}|${r.updated}|${r.title}`;
          if (!seen.has(k)) {
            seen.add(k);
            uniq.push(r);
          }
        }
        setReviews(uniq);
        setRevAll(true);
      } catch (e) {
      } finally {
        setRevAllLd(false);
      }
    };
    const isF = !!app && (favs || []).some((f) => f && String(f.trackId) === String(app.trackId));
    const goBack = () => {
      if (_navMoved) window.history.back();
      else nav("/");
    };
    const openInOtherStore = () => {
      if (!app) return;
      const q = encodeURIComponent(app.trackName || "");
      try {
        window.location.href = `market://search?q=${q}&c=apps`;
      } catch (e) {
      }
    };
    const topBar = /* @__PURE__ */ React.createElement(
      DetailTopBar,
      {
        app,
        isFav: isF,
        onToggleFav: () => {
          if (app) toggle(app);
        },
        onShare: () => setShareOpen(true),
        onOpenIn: openInOtherStore,
        onToggleTheme,
        isDark: !!isDark,
        onInfo: () => setInfoOpen(true),
        onBack: goBack
      }
    );
    if (!app) {
      if (failKind === "missing" && !ld) return /* @__PURE__ */ React.createElement(React.Fragment, null, topBar, /* @__PURE__ */ React.createElement("div", { className: "p-8 text-center text-muted-foreground" }, t("app_not_found")));
      if (waited) return /* @__PURE__ */ React.createElement(React.Fragment, null, topBar, /* @__PURE__ */ React.createElement("div", { className: "page-stage page-stage-detail" }, /* @__PURE__ */ React.createElement(NetOffline, { onRetry: () => setNetTry((n) => n + 1) })));
      return /* @__PURE__ */ React.createElement(React.Fragment, null, topBar, /* @__PURE__ */ React.createElement("div", { className: "page-stage page-stage-detail" }, /* @__PURE__ */ React.createElement(NetSpin, null)));
    }
    const rating = fmtRating(app.averageUserRating);
    const ratingCount = app.userRatingCount ? `(${Number(app.userRatingCount).toLocaleString()})` : "";
    const dist = ratingDistribution(app.averageUserRating);
    const filledStars = Math.round(Number(app.averageUserRating) || 4.3);
    const starsStr = Array.from({ length: 5 }, (_, i) => i < filledStars ? "\u2605" : "\u2606").join("");
    const storeCfg = STORE_CONFIGS[selStore] || STORE_CONFIGS.google;
    let installHref = "#";
    try {
      installHref = storeCfg.buildUrl(app.trackName || "", app);
    } catch (e) {
      installHref = app.trackViewUrl || "#";
    }
    const shareUrl = app.trackViewUrl || (typeof location !== "undefined" ? location.href : "");
    const beginInstall = (force) => {
      if (!app) return;
      dlCancelRef.current = false;
      if (dlTimerRef.current) {
        clearTimeout(dlTimerRef.current);
        dlTimerRef.current = null;
      }
      const useDirect = storeCfg.kind === "direct" || selStore === "direct";
      const { rec, fresh } = startDlRec(app.trackId, app.fileSizeBytes, {
        trackName: app.trackName || "",
        artworkUrl100: app.artworkUrl512 || app.artworkUrl100 || "",
        installHref: useDirect ? "" : installHref
      }, !!force);
      setDlView(computeDlProgress(rec));
      if (!fresh) return;
      linkFiredRef.current = false;
      shouldLaunchRef.current = true;
    };
    const doShareAction = (type) => {
      if (type === "copy") {
        (navigator.clipboard ? navigator.clipboard.writeText(shareUrl) : Promise.reject()).then(() => showToast(t("toast_copied"))).catch(() => showToast(t("toast_copied")));
      } else if (type === "whatsapp") {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((app.trackName || "") + "\n" + shareUrl)}`, "_blank");
      } else if (type === "telegram") {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(app.trackName || "")}`, "_blank");
      } else if (type === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (type === "instagram") {
        if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(() => {
        });
        window.open("https://www.instagram.com/", "_blank");
        showToast(t("toast_ig"));
      } else if (type === "github") {
        window.open("https://github.com/", "_blank");
      } else if (type === "bluetooth") {
        showToast(t("toast_bt"));
      } else if (type === "quickshare") {
        showToast(t("toast_qs"));
      }
      setShareOpen(false);
    };
    const openPeek = (e, src) => {
      const el = e && e.currentTarget;
      if (el && el.getBoundingClientRect) {
        const r = el.getBoundingClientRect();
        setPeekFrom({ l: r.left, t: r.top, w: r.width, h: r.height });
      } else setPeekFrom(null);
      setPeekSrc(src || app.artworkUrl512 || app.artworkUrl100 || "");
      setPeekBare(false);
      setPeekOut(false);
      setPeekGo(false);
      setPeek(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setPeekGo(true)));
    };
    const closePeek = () => {
      setPeekOut(true);
      setPeekGo(false);
      setTimeout(() => setPeek(false), 180);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "pb-24 sm:pb-8" }, peek && /* @__PURE__ */ React.createElement("div", { className: `peek-root ${peekBare ? "bare" : ""} ${peekGo ? "go" : ""} ${peekOut ? "out" : ""}`, onClick: closePeek }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `peek-eye ${peekBare ? "on" : ""}`, "aria-label": "hide info", onClick: (e) => {
      e.stopPropagation();
      setPeekBare((v) => !v);
    } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" }))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "peek-x", "aria-label": "close", onClick: (e) => {
      e.stopPropagation();
      closePeek();
    } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }))), /* @__PURE__ */ React.createElement("img", { className: `peek-img ${peekGo ? "go" : ""}`, style: peekFrom ? { "--l": peekFrom.l + "px", "--t": peekFrom.t + "px", "--w": peekFrom.w + "px", "--h": peekFrom.h + "px" } : void 0, src: peekSrc || app.artworkUrl512 || app.artworkUrl100, alt: "", onClick: (e) => e.stopPropagation() }), /* @__PURE__ */ React.createElement("div", { className: `peek-meta ${peekBare ? "hide" : ""}`, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("h2", null, app.trackName), /* @__PURE__ */ React.createElement("p", null, app.artistName), /* @__PURE__ */ React.createElement("p", { className: "peek-sub" }, "\u2605 ", rating, " \xB7 ", fmtSize(app.fileSizeBytes), " \xB7 ", app.primaryGenreName || ""), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bg-btn-install", onClick: () => setReqOpen(true) }, t("install")))), topBar, /* @__PURE__ */ React.createElement("div", { className: "bg-detail" }, promoShot2 && /* @__PURE__ */ React.createElement("div", { className: "bg-exp-hero" }, /* @__PURE__ */ React.createElement("img", { className: "bg-exp-img", src: promoShot2, alt: "", loading: "eager", onClick: (e) => openPeek(e, promoShot2), style: { cursor: "pointer" } }), /* @__PURE__ */ React.createElement("div", { className: "bg-exp-grad" })), /* @__PURE__ */ React.createElement("div", { className: promoShot2 ? "bg-exp-content" : "" }, /* @__PURE__ */ React.createElement("div", { className: "bg-detail-header" }, /* @__PURE__ */ React.createElement("div", { className: "bg-detail-info" }, /* @__PURE__ */ React.createElement("div", { className: "bg-detail-title-row" }, /* @__PURE__ */ React.createElement("h1", { className: "bg-detail-name" }, app.trackName)), dlView.ring && /* @__PURE__ */ React.createElement("div", { className: `dl-status-badge ${dlView.phase === "spin" ? "wait" : ""}` }, dlView.phase === "spin" ? t("dl_fetch_badge") : t("dl_run_badge")), (dlView.phase === "download" || dlView.phase === "postspin") && /* @__PURE__ */ React.createElement("div", { className: "dl-name-pct", "aria-live": "polite" }, Math.round((dlView.pct || 0) * 100), "%"), /* @__PURE__ */ React.createElement("button", { className: "bg-detail-dev", onClick: () => nav(`/search?q=${encodeURIComponent(app.artistName || "")}`) }, app.artistName), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-meta" }, /* @__PURE__ */ React.createElement("span", null, "\u2605 ", rating, " ", ratingCount), /* @__PURE__ */ React.createElement("span", null, app.contentAdvisoryRating || "\u2014"), /* @__PURE__ */ React.createElement("span", null, fmtSize(app.fileSizeBytes)), /* @__PURE__ */ React.createElement("span", null, app.primaryGenreName || ""))), /* @__PURE__ */ React.createElement("div", { className: `dl-icon-wrap ${dlView.ring ? "active" : ""}` }, dlView.ring && /* @__PURE__ */ React.createElement("svg", { className: "dl-ring", viewBox: "0 0 100 100", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { className: "dl-ring-track", cx: "50", cy: "50", r: "45" }), dlView.phase === "spin" ? /* @__PURE__ */ React.createElement("g", { className: "dl-spin-g" }, /* @__PURE__ */ React.createElement("circle", { className: "dl-ring-spin", cx: "50", cy: "50", r: "45" })) : /* @__PURE__ */ React.createElement(
      "circle",
      {
        className: "dl-ring-prog",
        cx: "50",
        cy: "50",
        r: "45",
        transform: "rotate(-90 50 50)",
        style: { strokeDasharray: String(DL_CIRC), strokeDashoffset: String(DL_CIRC * (1 - (dlView.pct || 0))) }
      }
    )), /* @__PURE__ */ React.createElement(
      SmartImg,
      {
        src: app.artworkUrl512 || app.artworkUrl100,
        kind: "icon",
        className: `bg-detail-icon ${dlView.ring ? "dl-shrunk" : ""}`,
        onClick: (e) => openPeek(e, app.artworkUrl512 || app.artworkUrl100)
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-actions" }, dlView.active ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 w-full" }, /* @__PURE__ */ React.createElement("input", { type: "file", ref: fileInputRef, style: { display: "none" }, accept: "*/*", onChange: () => {
    } }), dlView.phase === "done" ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "bg-btn-cancel", onClick: openFilesPicker }, t("req_open_files")) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "bg-btn-cancel", onClick: cancelInstall }, t("req_cancel")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bg-btn-store", onClick: () => beginInstall(true) }, t("reinstall"))) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "bg-btn-install", onClick: () => setReqOpen(true) }, t("install")))), /* @__PURE__ */ React.createElement("div", { className: `bg-req-overlay ${reqOpen ? "show" : ""}`, onClick: (e) => {
      if (e.target === e.currentTarget) setReqOpen(false);
    } }, /* @__PURE__ */ React.createElement("div", { className: "bg-req-sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "bg-plat-handle" }), /* @__PURE__ */ React.createElement("div", { className: "bg-plat-title" }, t("req_title")), /* @__PURE__ */ React.createElement("div", { className: "bg-req-body" }, [
      { k: "req_money", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v12M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" })) },
      { k: "req_wifi", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12.55a11 11 0 0114.08 0" }), /* @__PURE__ */ React.createElement("path", { d: "M1.42 9a16 16 0 0121.16 0" }), /* @__PURE__ */ React.createElement("path", { d: "M8.53 16.11a6 6 0 016.95 0" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "20", r: "1.2", fill: "currentColor", stroke: "none" })) },
      { k: "req_storage", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" }), /* @__PURE__ */ React.createElement("path", { d: "M3 12c0 1.7 4 3 9 3s9-1.3 9-3" })) },
      { k: "req_notify", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ React.createElement("path", { d: "M13.73 21a2 2 0 01-3.46 0" })) },
      { k: "req_vibrate", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "7", y: "2", width: "10", height: "20", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M1 9l2 2-2 2M23 9l-2 2 2 2" })) },
      { k: "req_system", icon: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" })) }
    ].map((it) => /* @__PURE__ */ React.createElement("div", { className: "bg-req-item", key: it.k }, /* @__PURE__ */ React.createElement("div", { className: "bg-req-icon" }, it.icon), /* @__PURE__ */ React.createElement("div", { className: "bg-req-text" }, t(it.k)))), /* @__PURE__ */ React.createElement("p", { className: "bg-req-note" }, t("req_note"))), /* @__PURE__ */ React.createElement("div", { className: "bg-req-footer" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "bg-btn-confirm",
        onClick: () => {
          setReqOpen(false);
          beginInstall(false);
        }
      },
      t("req_confirm")
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center overflow-x-auto px-4 py-3 border-y border-[hsl(var(--border))] gap-8 mt-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground uppercase font-semibold mb-1" }, app.userRatingCount > 0 ? `${(app.userRatingCount / 1e3).toFixed(1)}K RATINGS` : "RATINGS"), /* @__PURE__ */ React.createElement("span", { className: "text-[22px] font-bold text-muted-foreground" }, ((_a = app.averageUserRating) == null ? void 0 : _a.toFixed(1)) || "N/A"), /* @__PURE__ */ React.createElement(Stars, { r: app.averageUserRating || 0, s: "w-3 h-3" })), /* @__PURE__ */ React.createElement("div", { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground uppercase font-semibold mb-1" }, "AGE"), /* @__PURE__ */ React.createElement("span", { className: "text-[22px] font-bold text-muted-foreground" }, app.contentAdvisoryRating || "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground mt-1" }, t("years_old"))), /* @__PURE__ */ React.createElement("div", { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground uppercase font-semibold mb-1" }, "CHART"), /* @__PURE__ */ React.createElement("span", { className: "text-[22px] font-bold text-muted-foreground" }, "#1"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground mt-1" }, app.primaryGenreName)), /* @__PURE__ */ React.createElement("div", { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground uppercase font-semibold mb-1" }, "DEVELOPER"), /* @__PURE__ */ React.createElement("span", { className: "text-[22px] font-bold text-muted-foreground w-12 h-7 bg-[hsl(var(--muted))] rounded flex items-center justify-center" }, (app.artistName || "?").charAt(0)), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-muted-foreground mt-1 truncate max-w-[80px]" }, app.artistName))), shots.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-screenshots" }, shots.slice(0, 12).map((s, i) => /* @__PURE__ */ React.createElement("img", { key: i, src: s, className: "bg-screenshot", alt: "", loading: "lazy", onClick: () => openLb(i) }))), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-section" }, /* @__PURE__ */ React.createElement("h3", null, t("description")), /* @__PURE__ */ React.createElement("p", { className: `bg-description ${exp ? "" : "collapsed"}` }, app.description), app.description && app.description.length > 180 && /* @__PURE__ */ React.createElement("button", { className: "bg-read-more", onClick: () => setExp(!exp) }, exp ? t("less") : t("more"))), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-section" }, /* @__PURE__ */ React.createElement("h3", null, t("ratings_reviews")), /* @__PURE__ */ React.createElement("div", { className: "bg-rating-overview" }, /* @__PURE__ */ React.createElement("div", { className: "bg-rating-bars" }, [5, 4, 3, 2, 1].map((s) => /* @__PURE__ */ React.createElement("div", { key: s, className: "bg-rating-bar-row" }, /* @__PURE__ */ React.createElement("span", { className: "bg-rating-bar-star" }, s), /* @__PURE__ */ React.createElement("div", { className: "bg-rating-bar-track" }, /* @__PURE__ */ React.createElement("div", { className: "bg-rating-bar-fill", style: { width: `${dist[s]}%` } })), /* @__PURE__ */ React.createElement("span", { className: "bg-rating-bar-percent" }, dist[s], "%")))), /* @__PURE__ */ React.createElement("div", { className: "bg-rating-score-big" }, /* @__PURE__ */ React.createElement("div", { className: "bg-rating-score-num" }, rating), /* @__PURE__ */ React.createElement("div", { className: "bg-rating-score-stars" }, starsStr), app.userRatingCount ? /* @__PURE__ */ React.createElement("div", { className: "bg-rating-score-count" }, app.userRatingCount.toLocaleString(), " ", t("ratings_count")) : null))), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-section" }, /* @__PURE__ */ React.createElement("h3", null, t("comments")), revLd ? /* @__PURE__ */ React.createElement("div", { className: "bg-reviews-loading" }, t("loading_reviews")) : !reviews || reviews.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-reviews-empty" }, t("no_reviews")) : /* @__PURE__ */ React.createElement("div", null, reviews.slice(0, revAll ? reviews.length : 5).map((r, i) => {
      const rr = Math.max(0, Math.min(5, Number(r.rating) || 0));
      const st = Array.from({ length: 5 }, (_, i2) => i2 < rr ? "\u2605" : "\u2606").join("");
      const initial = (r.author || "A").trim().charAt(0).toUpperCase();
      return /* @__PURE__ */ React.createElement("div", { className: "bg-review-card", key: r.id || i }, /* @__PURE__ */ React.createElement("div", { className: "bg-review-head" }, /* @__PURE__ */ React.createElement("div", { className: "bg-review-avatar" }, initial), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "bg-review-user-name" }, r.author), r.updated && /* @__PURE__ */ React.createElement("div", { className: "bg-review-date" }, fmtDate(r.updated))), /* @__PURE__ */ React.createElement("div", { className: "bg-review-stars" }, st)), r.title && /* @__PURE__ */ React.createElement("div", { className: "bg-review-title" }, r.title), /* @__PURE__ */ React.createElement("div", { className: "bg-review-content" }, r.content));
    })), reviews && reviews.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-reviews-more-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "rounded-full px-6 py-2 text-sm font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]", disabled: revAllLd, onClick: () => revAll ? setRevAll(false) : loadAllReviews() }, revAllLd ? t("loading") : revAll ? t("hide_reviews") : t("show_more")))), /* @__PURE__ */ React.createElement("div", { className: "bg-detail-section" }, /* @__PURE__ */ React.createElement("h3", null, t("info")), /* @__PURE__ */ React.createElement("div", { className: "bg-info-list" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("version"), ":"), " ", app.version || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("last_update"), ":"), " ", fmtDate(app.currentVersionReleaseDate)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("size"), ":"), " ", fmtSize(app.fileSizeBytes)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("age_rating"), ":"), " ", app.contentAdvisoryRating || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("developer"), ":"), " ", app.sellerName || app.artistName), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, t("category"), ":"), " ", app.primaryGenreName || (app.genres || []).join(", "))))), sim.length > 0 && /* @__PURE__ */ React.createElement(HScroll, { title: t("you_might_like") }, sim.map((a) => /* @__PURE__ */ React.createElement(AppCard, { key: a.trackId, app: a, small: true, onClick: (x) => nav(`/app/${x.trackId}`) }))), /* @__PURE__ */ React.createElement("div", { className: `bg-share-overlay ${shareOpen ? "show" : ""}`, onClick: (e) => {
      if (e.target === e.currentTarget) setShareOpen(false);
    } }, /* @__PURE__ */ React.createElement("div", { className: "bg-share-sheet" }, /* @__PURE__ */ React.createElement("div", { className: "bg-share-handle" }), /* @__PURE__ */ React.createElement("div", { className: "bg-share-title" }, t("share_via")), [
      { id: "copy", k: "share_copy", cls: "copy", icon: "copy" },
      { id: "whatsapp", k: "share_wa", cls: "whatsapp", icon: "whatsapp" },
      { id: "telegram", k: "share_tg", cls: "telegram", icon: "telegram" },
      { id: "instagram", k: "share_ig", cls: "instagram", icon: "instagram" },
      { id: "facebook", k: "share_fb", cls: "facebook", icon: "facebook" },
      { id: "github", k: "share_gh", cls: "github", icon: "github" }
    ].map((opt) => /* @__PURE__ */ React.createElement("div", { className: "bg-share-option", key: opt.id, onClick: () => doShareAction(opt.id) }, /* @__PURE__ */ React.createElement("div", { className: `bg-share-option-icon ${opt.cls}` }, /* @__PURE__ */ React.createElement(BrandIcon, { name: opt.icon })), /* @__PURE__ */ React.createElement("div", { className: "bg-share-option-label" }, t(opt.k)))))), infoOpen && /* @__PURE__ */ React.createElement(AppInfoSheet, { app, onClose: () => setInfoOpen(false) }), lbIdx != null && shots[lbIdx] && /* @__PURE__ */ React.createElement("div", { className: "bg-lightbox", onClick: closeLb, onTouchStart: onLbTouchStart, onTouchEnd: onLbTouchEnd }, /* @__PURE__ */ React.createElement("button", { className: "bg-lightbox-close", onClick: (e) => {
      e.stopPropagation();
      closeLb();
    }, "aria-label": "Close" }, "\xD7"), shots.length > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "bg-lightbox-nav prev", onClick: (e) => {
      e.stopPropagation();
      lbPrev();
    }, "aria-label": "Previous" }, "\u2039"), /* @__PURE__ */ React.createElement("button", { className: "bg-lightbox-nav next", onClick: (e) => {
      e.stopPropagation();
      lbNext();
    }, "aria-label": "Next" }, "\u203A")), /* @__PURE__ */ React.createElement("img", { className: "bg-lightbox-img", src: shots[lbIdx], alt: "", onClick: (e) => e.stopPropagation(), draggable: false }), /* @__PURE__ */ React.createElement("div", { className: "bg-lightbox-counter" }, lbIdx + 1, " / ", shots.length)), toastMsg && /* @__PURE__ */ React.createElement("div", { className: "bg-toast show" }, toastMsg));
  };
  const DownloadsManager = ({ open }) => {
    const [tab, setTab] = useState("active");
    const [tick, setTick] = useState(0);
    useEffect(() => {
      const t2 = setInterval(() => setTick((x) => x + 1), 500);
      return () => clearInterval(t2);
    }, []);
    const all = listAllDownloads();
    const rows = all.map((rec) => {
      const p = computeDlProgress(rec);
      return { rec, p };
    });
    const active = rows.filter((x) => x.p.active && x.p.phase !== "done");
    const done = rows.filter((x) => x.p.phase === "done");
    const list = tab === "active" ? active : done;
    return /* @__PURE__ */ React.createElement("div", { className: "page-cover play-wrap flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 z-30", style: { background: "transparent" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 pt-3 pb-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip", onClick: () => window.history.back(), "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("h1", { className: "font-bold text-base flex-1 truncate" }, t("dl_manager"))), /* @__PURE__ */ React.createElement("div", { className: "play-seg-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setTab("active"), className: `play-seg ${tab === "active" ? "on" : ""}` }, t("dl_active"), " (", active.length, ")"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setTab("done"), className: `play-seg ${tab === "done" ? "on" : ""}` }, t("dl_done"), " (", done.length, ")"))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 py-2 pb-24" }, list.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "play-list" }, /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-muted-foreground text-sm" }, tab === "active" ? t("dl_empty_active") : t("dl_empty_done"))) : /* @__PURE__ */ React.createElement("div", { className: "play-list" }, list.map(({ rec, p }) => {
      const pct = Math.round((p.pct || 0) * 100);
      return /* @__PURE__ */ React.createElement("div", { key: String(rec.trackId) + "-" + rec.startMs, className: "flex items-center gap-3 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]" }, /* @__PURE__ */ React.createElement("img", { src: rec.artworkUrl100 || "", alt: "", className: "w-14 h-14 rounded-xl object-cover bg-muted shrink-0", onError: (e) => {
        e.target.style.opacity = "0.3";
      } }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-sm truncate" }, rec.trackName || rec.trackId), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-muted-foreground mt-0.5" }, p.phase === "spin" || p.phase === "postspin" ? t("dl_spinning") : p.phase === "done" ? t("dl_complete") : `${t("dl_progress")}: ${pct}%`), p.phase === "download" && /* @__PURE__ */ React.createElement("div", { className: "mt-2 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full bg-primary", style: { width: pct + "%" } })), (p.phase === "spin" || p.phase === "postspin") && /* @__PURE__ */ React.createElement("div", { className: "mt-2 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full w-1/3 rounded-full bg-[#3b82f6] animate-pulse" }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 shrink-0" }, p.phase === "done" && rec.installHref && /* @__PURE__ */ React.createElement("a", { href: rec.installHref, target: "_blank", rel: "noopener", className: "text-xs font-semibold text-primary px-2 py-1" }, t("install")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "text-xs text-muted-foreground px-2 py-1", onClick: () => {
        clearDlRec(rec.trackId);
        setTick((x) => x + 1);
      } }, t("req_cancel"))));
    }))));
  };
  const Favs = ({ favs, songFavs, open, toggle, toggleSongFav, play }) => {
    const [sel, setSel] = useState({});
    const [mode, setMode] = useState(false);
    const [archives, setArchives] = useState(() => getS("apk_archives", []) || []);
    const [openArch, setOpenArch] = useState(null);
    const holdRef = useRef(null);
    const heldRef = useRef(false);
    const apps = Array.isArray(favs) ? favs : [];
    const songs = Array.isArray(songFavs) ? songFavs : [];
    const saveArch = (list) => {
      setArchives(list);
      setS("apk_archives", list);
    };
    const allKeys = [...archives.map((ar) => "r:" + String(ar.id)), ...apps.map((a) => "a:" + String(a.trackId)), ...songs.map((s) => "s:" + String(s.trackId))];
    const selectedKeys = allKeys.filter((k) => sel[k]);
    const allSelected = allKeys.length > 0 && selectedKeys.length === allKeys.length;
    const toggleSel = (k) => setSel((p) => ({ ...p, [k]: !p[k] }));
    const enterSel = (k) => {
      heldRef.current = true;
      setMode(true);
      setSel((p) => ({ ...p, [k]: true }));
    };
    const startHold = (k) => (e) => {
      if (mode) return;
      const ev = e.touches ? e.touches[0] : e;
      holdRef.current = setTimeout(() => enterSel(k), 420);
    };
    const endHold = () => {
      if (holdRef.current) {
        clearTimeout(holdRef.current);
        holdRef.current = null;
      }
    };
    const selectAll = () => {
      if (allSelected) {
        setSel({});
        setMode(false);
        return;
      }
      const n = {};
      allKeys.forEach((k) => n[k] = true);
      setSel(n);
      setMode(true);
    };
    const removeSelected = () => {
      if (!selectedKeys.length) return;
      if (!window.confirm(t("delete_confirm"))) return;
      const dropArch = new Set(selectedKeys.filter((k) => k[0] === "r").map((k) => k.slice(2)));
      if (dropArch.size) saveArch(archives.filter((a) => !dropArch.has(String(a.id))));
      selectedKeys.forEach((k) => {
        const id = k.slice(2);
        if (k[0] === "a") {
          const app = apps.find((x) => String(x.trackId) === id);
          if (app) toggle(app);
        } else if (k[0] === "s") {
          const song = songs.find((x) => String(x.trackId) === id);
          if (song) toggleSongFav(song);
        }
      });
      setSel({});
      setMode(false);
    };
    const archiveSelected = () => {
      if (!selectedKeys.length) return;
      const items = [];
      selectedKeys.forEach((k) => {
        const id = k.slice(2);
        if (k[0] === "a") {
          const app = apps.find((x) => String(x.trackId) === id);
          if (app) items.push({ kind: "app", data: app });
        } else if (k[0] === "s") {
          const song = songs.find((x) => String(x.trackId) === id);
          if (song) items.push({ kind: "song", data: song });
        }
      });
      if (!items.length) return;
      const rec = { id: "ar" + Date.now(), name: t("archive_one") + " " + (archives.length + 1), pinned: false, created: Date.now(), items };
      saveArch([rec].concat(archives));
      selectedKeys.forEach((k) => {
        const id = k.slice(2);
        if (k[0] === "a") {
          const app = apps.find((x) => String(x.trackId) === id);
          if (app) toggle(app);
        } else if (k[0] === "s") {
          const song = songs.find((x) => String(x.trackId) === id);
          if (song) toggleSongFav(song);
        }
      });
      setSel({});
      setMode(false);
    };
    const pinArch = (id) => {
      saveArch(archives.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    };
    const delArch = (id) => {
      if (!window.confirm(t("delete_confirm"))) return;
      saveArch(archives.filter((a) => a.id !== id));
      if (openArch && openArch.id === id) setOpenArch(null);
    };
    const empty = apps.length === 0 && songs.length === 0 && archives.length === 0;
    const Box = ({ selected, onOpen, onHoldKey, children }) => {
      const tap = () => {
        if (heldRef.current) {
          heldRef.current = false;
          return;
        }
        if (mode) toggleSel(onHoldKey);
        else onOpen && onOpen();
      };
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "settings-box",
          style: { marginBottom: 10, display: "flex", alignItems: "center", gap: 12, position: "relative", outline: selected ? "2px solid hsl(var(--primary))" : "none" },
          onMouseDown: startHold(onHoldKey),
          onMouseUp: endHold,
          onMouseLeave: endHold,
          onTouchStart: startHold(onHoldKey),
          onTouchEnd: endHold,
          onTouchMove: endHold,
          onClick: tap
        },
        children,
        selected && /* @__PURE__ */ React.createElement("span", { style: { width: 22, height: 22, borderRadius: "50%", background: "hsl(var(--primary))", color: "hsl(var(--primary-fg))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 } }, "\u2713")
      );
    };
    if (openArch) {
      const rec = archives.find((a) => a.id === openArch.id) || openArch;
      return /* @__PURE__ */ React.createElement("div", { className: "lib-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 pt-3 pb-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip", onClick: () => setOpenArch(null), "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold flex-1 truncate" }, rec.name || t("archives")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "text-xs font-semibold px-3 py-1.5 rounded-full", style: { background: "hsl(var(--card))", color: "hsl(var(--fg))", border: "1px solid hsl(var(--border))" }, onClick: () => pinArch(rec.id) }, rec.pinned ? t("archive_unpin") : t("archive_pin"))), (rec.items || []).length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-muted-foreground text-sm" }, t("archive_empty")) : (rec.items || []).map((it, idx) => {
        if (it.kind === "song") {
          const s = it.data || {};
          return /* @__PURE__ */ React.createElement("div", { key: "s" + idx, className: "settings-box", style: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }, onClick: () => play && play(s, [s]) }, /* @__PURE__ */ React.createElement("img", { src: s.artworkUrl100 || s.artworkUrl60 || "", alt: "", style: { width: 48, height: 48, borderRadius: 12, objectFit: "cover" } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, s.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-xs truncate", style: { opacity: 0.7 } }, s.artistName)));
        }
        const a = it.data || {};
        return /* @__PURE__ */ React.createElement("div", { key: "a" + idx, className: "settings-box", style: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }, onClick: () => open && open(a) }, /* @__PURE__ */ React.createElement("img", { src: a.artworkUrl100 || a.artworkUrl60 || "", alt: "", style: { width: 48, height: 48, borderRadius: 12, objectFit: "cover" } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, a.trackName || a.trackCensoredName), /* @__PURE__ */ React.createElement("p", { className: "text-xs truncate", style: { opacity: 0.7 } }, a.artistName)));
      }));
    }
    const orderedArch = [...archives].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.created || 0) - (a.created || 0));
    return /* @__PURE__ */ React.createElement("div", { className: "lib-wrap pb-20" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 pt-4 pb-2 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold flex-1" }, t("library"))), mode && /* @__PURE__ */ React.createElement("div", { className: "play-seg-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: selectAll, className: `play-seg ${allSelected ? "on" : ""}` }, allSelected ? t("req_cancel") : t("select_all")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: removeSelected, disabled: !selectedKeys.length, className: `play-seg ${selectedKeys.length ? "on" : ""}` }, t("delete_sel")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: archiveSelected, disabled: !selectedKeys.length, className: `play-seg ${selectedKeys.length ? "on" : ""}` }, t("archive"))), empty ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "heart", className: "w-12 h-12 mx-auto mb-3 opacity-30" }), /* @__PURE__ */ React.createElement("p", null, t("no_favs")), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-1" }, t("no_favs_hint"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, orderedArch.map((ar) => {
      const k = "r:" + String(ar.id);
      return /* @__PURE__ */ React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: () => setOpenArch(ar) }, /* @__PURE__ */ React.createElement(Icon, { name: "folder", className: "w-6 h-6" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, ar.name, ar.pinned ? " \u2022" : ""), /* @__PURE__ */ React.createElement("p", { className: "text-xs", style: { opacity: 0.7 } }, (ar.items || []).length, " \u2022 ", t("archives"))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: (e) => {
        e.stopPropagation();
        pinArch(ar.id);
      }, style: { background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 18 }, "aria-label": t("archive_pin") }, ar.pinned ? "\u{1F4CC}" : "\u{1F4CD}"));
    }), apps.map((a) => {
      const k = "a:" + String(a.trackId);
      return /* @__PURE__ */ React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: () => open && open(a) }, /* @__PURE__ */ React.createElement("img", { src: a.artworkUrl100 || a.artworkUrl60 || "", alt: "", style: { width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, a.trackName || a.trackCensoredName), /* @__PURE__ */ React.createElement("p", { className: "text-xs truncate", style: { opacity: 0.7 } }, a.artistName)));
    }), songs.map((s) => {
      const k = "s:" + String(s.trackId);
      return /* @__PURE__ */ React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: () => play && play(s, songs) }, /* @__PURE__ */ React.createElement("img", { src: s.artworkUrl100 || s.artworkUrl60 || "", alt: "", style: { width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, s.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-xs truncate", style: { opacity: 0.7 } }, s.artistName)));
    })));
  };
  const SearchLogPage = ({ nav }) => {
    const [items, setItems] = useState(() => getSearchLog());
    const [sel, setSel] = useState({});
    useEffect(() => {
      setItems(getSearchLog());
    }, []);
    const keys = items.map((x) => x.id);
    const selected = keys.filter((k) => sel[k]);
    const allSelected = keys.length > 0 && selected.length === keys.length;
    const selectAll = () => {
      if (allSelected) {
        setSel({});
        return;
      }
      const n = {};
      keys.forEach((k) => n[k] = true);
      setSel(n);
    };
    const delSelected = () => {
      if (!selected.length) return;
      if (!window.confirm(t("delete_confirm"))) return;
      const next = items.filter((x) => !sel[x.id]);
      setItems(next);
      setS("apk_search_log", next);
      setS("apk_search_history", next.map((x) => x.term).filter((v, i, a) => a.indexOf(v) === i).slice(0, 20));
      setSel({});
    };
    const delOne = (id) => {
      if (!window.confirm(t("delete_one_confirm"))) return;
      const next = items.filter((x) => x.id !== id);
      setItems(next);
      setS("apk_search_log", next);
      setS("apk_search_history", next.map((x) => x.term).filter((v, i, a) => a.indexOf(v) === i).slice(0, 20));
      setSel((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
    };
    const openItem = (it) => {
      if (it.type === "music") nav("/music?q=" + encodeURIComponent(it.term));
      else if (it.type === "games") nav("/search?q=" + encodeURIComponent(it.term));
      else nav("/search?q=" + encodeURIComponent(it.term));
    };
    const typeLabel = (ty) => ty === "music" ? t("type_music") : ty === "games" ? t("type_games") : t("type_apps");
    const typeColor = (ty) => ty === "music" ? "#a855f7" : ty === "games" ? "#ea4335" : "#4285f4";
    return /* @__PURE__ */ React.createElement("div", { className: "page-cover play-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 z-30 px-0 pt-3 pb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3 px-3" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip", onClick: () => window.history.back(), "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("h1", { className: "font-bold text-base flex-1" }, t("search_log")), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground" }, items.length)), /* @__PURE__ */ React.createElement("div", { className: "play-seg-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: selectAll, className: `play-seg ${allSelected ? "on" : ""}` }, allSelected ? t("req_cancel") : t("select_all")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: delSelected, disabled: !selected.length, className: `play-seg ${selected.length ? "on" : ""}` }, t("delete_sel"), selected.length ? ` (${selected.length})` : ""))), /* @__PURE__ */ React.createElement("div", { className: "py-2" }, items.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "play-list" }, /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-muted-foreground text-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "hist", className: "w-12 h-12 mx-auto mb-3 opacity-30" }), /* @__PURE__ */ React.createElement("p", null, t("search_log_empty")))) : /* @__PURE__ */ React.createElement("div", { className: "play-list" }, items.map((it) => /* @__PURE__ */ React.createElement("div", { key: it.id, className: "play-item" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setSel((p) => ({ ...p, [it.id]: !p[it.id] })), className: `w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${sel[it.id] ? "bg-primary border-primary text-white" : "border-[hsl(var(--border))]"}` }, sel[it.id] ? "\u2713" : ""), /* @__PURE__ */ React.createElement("button", { type: "button", className: "flex-1 min-w-0 text-left flex items-center gap-2", onClick: () => openItem(it) }, /* @__PURE__ */ React.createElement(Icon, { name: "hist", className: "w-4 h-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium truncate flex-1" }, it.term), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full text-white", style: { background: typeColor(it.type) } }, typeLabel(it.type))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => delOne(it.id), className: "p-2 text-muted-foreground hover:text-red-500", "aria-label": "delete" }, /* @__PURE__ */ React.createElement(Icon, { name: "x", className: "w-4 h-4" })))))));
  };
  /* APKDroid You section: catalog, store, and P2P chat */
  const youBus = { ls: {}, on(ev, fn) { (this.ls[ev] = this.ls[ev] || []).push(fn); return () => { this.ls[ev] = (this.ls[ev] || []).filter((f) => f !== fn); }; }, emit(ev, p) { (this.ls[ev] || []).forEach((f) => { try { f(p); } catch (e) {} }); } };
  const YOU_CHAT_KEY = "apk_you_chats";
  const youLoadChats = () => { try { const v = JSON.parse(localStorage.getItem(YOU_CHAT_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const youSaveChats = (list) => { try { localStorage.setItem(YOU_CHAT_KEY, JSON.stringify(list)); } catch (e) {} youBus.emit("chats", list); };
  const youUpsertChat = (chat) => { const list = youLoadChats(); const i = list.findIndex((c) => c.id === chat.id); if (i >= 0) list[i] = chat; else list.unshift(chat); youSaveChats(list); return chat; };
  const youPatchChat = (id, fn) => { const list = youLoadChats(); const i = list.findIndex((c) => c.id === id); if (i < 0) return null; const next = fn(Object.assign({}, list[i], { messages: (list[i].messages || []).slice() })); list.splice(i, 1); list.unshift(next); youSaveChats(list); return next; };
  const youFmtTime = (ts) => { try { return new Date(ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const youB64 = (bytes) => { let s = ""; const chunk = 0x8000; for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk)); return btoa(s); };
  const youFromB64 = (s) => { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
  const youEncodeCode = (obj) => { const json = JSON.stringify(obj); const bytes = new TextEncoder().encode(json); return youB64(bytes).replace(/=+$/g, ""); };
  const youDecodeCode = (code) => { const clean = String(code || "").replace(/\s+/g, ""); const pad = clean + "===".slice((clean.length + 3) % 4); const json = new TextDecoder().decode(youFromB64(pad)); return JSON.parse(json); };
  const youP2P = {
    pc: null, dc: null, chatId: "", gathering: null, remoteStream: null, localStream: null, parts: {},
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    reset() {
      try { if (this.dc) this.dc.close(); } catch (e) {}
      try { if (this.pc) this.pc.close(); } catch (e) {}
      this.pc = null; this.dc = null; this.parts = {};
      youBus.emit("link", "idle");
    },
    waitIce(pc) {
      return new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); resolve(); } };
        pc.addEventListener("icegatheringstatechange", done);
        setTimeout(resolve, 3500);
      });
    },
    bindPc(pc) {
      this.pc = pc;
      pc.ontrack = (ev) => {
        const stream = ev.streams && ev.streams[0] ? ev.streams[0] : new MediaStream([ev.track]);
        this.remoteStream = stream;
        youBus.emit("remote", stream);
      };
      pc.onconnectionstatechange = () => youBus.emit("link", pc.connectionState);
      pc.onicecandidate = () => {};
    },
    bindDc(dc, chatId) {
      this.dc = dc;
      this.chatId = chatId || this.chatId;
      dc.onopen = () => { youBus.emit("link", "open"); if (this.chatId) youBus.emit("open", this.chatId); };
      dc.onclose = () => youBus.emit("link", "closed");
      dc.onmessage = (ev) => this.onData(ev.data);
    },
    sendRaw(obj) {
      if (!this.dc || this.dc.readyState !== "open") return false;
      try { this.dc.send(JSON.stringify(obj)); return true; } catch (e) { return false; }
    },
    sendChunks(head, data) {
      const size = 9000;
      const n = Math.max(1, Math.ceil(data.length / size));
      const id = "m" + Date.now() + Math.floor(Math.random() * 999);
      for (let i = 0; i < n; i++) this.sendRaw(Object.assign({}, head, { id, i, n, d: data.slice(i * size, (i + 1) * size) }));
      return id;
    },
    onData(raw) {
      let msg = null;
      try { msg = JSON.parse(raw); } catch (e) { return; }
      if (!msg) return;
      if (msg.t === "sig" && msg.sdp) { this.takeSignal(msg.sdp); return; }
      if (msg.t === "call") { youBus.emit("call", msg); return; }
      if (msg.t === "txt") { this.pushIncoming({ id: msg.id, mine: false, kind: "text", text: msg.text || "", time: msg.time || Date.now() }); return; }
      if (msg.t === "img" || msg.t === "aud") {
        const bag = this.parts[msg.id] || { n: msg.n, got: [], kind: msg.t, time: msg.time };
        bag.got[msg.i] = msg.d || "";
        this.parts[msg.id] = bag;
        if (bag.got.filter(Boolean).length >= bag.n) {
          const data = bag.got.join("");
          delete this.parts[msg.id];
          const url = msg.t === "img" ? data : URL.createObjectURL(new Blob([youFromB64(data)], { type: "audio/webm" }));
          this.pushIncoming({ id: msg.id, mine: false, kind: msg.t === "img" ? "image" : "audio", url, time: msg.time || Date.now() });
        }
      }
    },
    pushIncoming(message) {
      if (!this.chatId) return;
      youPatchChat(this.chatId, (c) => {
        c.messages = (c.messages || []).concat([message]);
        c.preview = message.kind === "text" ? message.text : message.kind === "image" ? "صورة" : "رسالة صوتية";
        c.time = message.time;
        if (location.hash.indexOf("/you-chat/" + this.chatId) < 0) c.unread = (c.unread || 0) + 1;
        return c;
      });
    },
    async takeSignal(sdp) {
      if (!this.pc) return;
      await this.pc.setRemoteDescription(sdp);
      if (sdp.type === "offer") {
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        await this.waitIce(this.pc);
        this.sendRaw({ t: "sig", sdp: this.pc.localDescription });
      }
    },
    async makeOffer(chatId) {
      this.reset();
      this.chatId = chatId;
      const pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.bindPc(pc);
      const dc = pc.createDataChannel("apkchat");
      this.bindDc(dc, chatId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await this.waitIce(pc);
      return youEncodeCode({ role: "offer", sdp: pc.localDescription });
    },
    async takeOffer(code, chatId) {
      const data = youDecodeCode(code);
      if (!data || data.role !== "offer" || !data.sdp) throw new Error("bad-offer");
      this.reset();
      this.chatId = chatId;
      const pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.bindPc(pc);
      pc.ondatachannel = (ev) => this.bindDc(ev.channel, chatId);
      await pc.setRemoteDescription(data.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this.waitIce(pc);
      return youEncodeCode({ role: "answer", sdp: pc.localDescription });
    },
    async takeAnswer(code) {
      const data = youDecodeCode(code);
      if (!data || data.role !== "answer" || !data.sdp) throw new Error("bad-answer");
      if (!this.pc) throw new Error("no-pc");
      await this.pc.setRemoteDescription(data.sdp);
    },
    async ensureSenders(kind) {
      const md = await navigator.mediaDevices.getUserMedia(kind === "video" ? { audio: true, video: { facingMode: "user" } } : { audio: true });
      this.localStream = md;
      youBus.emit("local", md);
      if (!this.pc) return md;
      md.getTracks().forEach((track) => {
        const has = this.pc.getSenders().some((s) => s.track && s.track.kind === track.kind);
        if (!has) this.pc.addTrack(track, md);
      });
      if (this.dc && this.dc.readyState === "open") {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendRaw({ t: "sig", sdp: this.pc.localDescription });
      }
      return md;
    },
    hangup() {
      if (this.localStream) this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
      youBus.emit("local", null);
      this.sendRaw({ t: "call", act: "end" });
      youBus.emit("call", { act: "end" });
    }
  };
  const youShareCode = async (code) => {
    const text = "رمز اتصال APKDroid P2P:\n" + code;
    try { if (navigator.clipboard) await navigator.clipboard.writeText(text); } catch (e) {}
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
  };
  const YouSvg = ({ d, size, box }) => React.createElement("svg", { width: size || 22, height: size || 22, viewBox: box || "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }, React.createElement("path", { d }));
  const ICO = {
    logo: "M27.367,29.304C27.367,30.243 26.651,30.845 25.443,30.845L24.49,30.845L24.49,27.888C24.666,27.856 25,27.809 25.586,27.809C26.698,27.826 27.367,28.319 27.367,29.304ZM56.299,30.449C56.304,32.471 55.5,34.412 54.067,35.838L50.842,39.063L50.842,43.622C50.842,47.824 47.423,51.243 43.223,51.243L38.662,51.243L35.437,54.468C34.001,55.906 32.087,56.7 30.05,56.7C28.013,56.7 26.099,55.906 24.659,54.464L21.438,51.245L16.877,51.245C14.855,51.251 12.914,50.447 11.488,49.013C10.055,47.586 9.252,45.646 9.258,43.624L9.258,39.061L6.033,35.838C4.593,34.399 3.801,32.485 3.801,30.449C3.801,28.413 4.595,26.498 6.033,25.06L9.258,21.837L9.258,17.28C9.258,13.078 12.677,9.658 16.877,9.658L21.436,9.658L24.663,6.432C26.099,4.994 28.013,4.2 30.05,4.2C32.087,4.2 34.001,4.994 35.441,6.436L38.662,9.655L43.223,9.655C45.257,9.655 47.171,10.448 48.61,11.886C50.044,13.312 50.848,15.253 50.842,17.276L50.842,21.835L54.067,25.06C55.5,26.487 56.304,28.427 56.299,30.449ZM20.266,26.093L13.719,26.093L13.719,36.805L16.151,36.805L16.151,32.498L19.997,32.498L19.997,30.527L16.151,30.527L16.151,28.08L20.268,28.08L20.268,26.093ZM30.179,36.805C29.972,36.392 29.64,34.993 29.305,33.786C29.035,32.8 28.622,32.085 27.874,31.784L27.874,31.736C28.795,31.403 29.765,30.466 29.765,29.098C29.765,28.112 29.415,27.365 28.78,26.857C28.018,26.254 26.905,26.014 25.315,26.014C24.028,26.014 22.867,26.11 22.088,26.237L22.088,36.805L24.488,36.805L24.488,32.593L25.22,32.593C26.205,32.609 26.666,32.974 26.952,34.311C27.271,35.63 27.525,36.504 27.698,36.805L30.179,36.805ZM38.342,34.819L33.938,34.819L33.938,32.277L37.881,32.277L37.881,30.305L33.938,30.305L33.938,28.08L38.12,28.08L38.12,26.093L31.508,26.093L31.508,36.805L38.342,36.805L38.342,34.819ZM46.825,34.819L42.422,34.819L42.422,32.277L46.364,32.277L46.364,30.305L42.422,30.305L42.422,28.08L46.603,28.08L46.603,26.093L39.991,26.093L39.991,36.805L46.825,36.805L46.825,34.819Z",
    chat: "M16,2L4,2a3,3 0,0 0,-3 3v8a3,3 0,0 0,3 3h1v2.14a0.8,0.8 0,0 0,1.188 0.7L11.3,16L16,16a3,3 0,0 0,3 -3L19,5a3,3 0,0 0,-3 -3ZM4,4h12a1,1 0,0 1,1 1v8a1,1 0,0 1,-1 1h-5.218l-0.452,0.252L7,16.1L7,14L4,14a1,1 0,0 1,-1 -1L3,5a1,1 0,0 1,1 -1ZM21,6.174A3,3 0,0 1,23 9v8a3,3 0,0 1,-2.846 2.996L20,20v2.14a0.8,0.8 0,0 1,-1.189 0.7L13.701,20L8.216,20l3.6,-2h2.402l0.453,0.252L18,20.101L18,18.05l1.95,-0.05 0.113,-0.003A1,1 0,0 0,21 17L21,6.174Z",
    head: "M12,3a9,9 0,0 0,-9 9v7a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-4a2,2 0,0 0,-2 -2H5v-1a7,7 0,1 1,14 0v1h-2a2,2 0,0 0,-2 2v4a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-7a9,9 0,0 0,-9 -9Z",
    bag: "M19,6h-2c0,-2.76 -2.24,-5 -5,-5S7,3.24 7,6L5,6c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2L21,8c0,-1.1 -0.9,-2 -2,-2zM12,3c1.66,0 3,1.34 3,3L9,6c0,-1.66 1.34,-3 3,-3zM19,20L5,20L5,8h14v12zM12,12c-1.66,0 -3,-1.34 -3,-3L7,9c0,2.76 2.24,5 5,5s5,-2.24 5,-5h-2c0,1.66 -1.34,3 -3,3z",
    phone: "M15.659,14.026L14.42,14.496C13.855,14.709 13.217,14.667 12.733,14.306C11.321,13.253 10.26,11.796 9.686,10.123C9.49,9.548 9.64,8.921 10.011,8.442L10.826,7.388C11.336,6.729 11.394,5.828 10.972,5.121L9.683,2.959C9.2,2.148 8.212,1.797 7.317,2.118L5.702,2.696C3.803,3.376 2.681,5.358 3.08,7.328L3.286,8.343C4.375,13.726 7.736,18.341 12.502,21L13.4,21.501C15.144,22.474 17.355,21.987 18.566,20.362L19.595,18.981C20.166,18.215 20.13,17.159 19.507,16.451L17.848,14.563C17.305,13.946 16.435,13.733 15.659,14.026Z",
    video: "M160,800Q127,800 103.5,776.5Q80,753 80,720L80,240Q80,207 103.5,183.5Q127,160 160,160L640,160Q673,160 696.5,183.5Q720,207 720,240L720,420L846,294Q856,284 868,289Q880,294 880,308L880,652Q880,666 868,671Q856,676 846,666L720,540L720,720Q720,753 696.5,776.5Q673,800 640,800L160,800Z",
    image: "M19,1H5C2.794,1 1,2.794 1,5v14c0,2.206 1.794,4 4,4h14c2.206,0 4,-1.794 4,-4V5c0,-2.206 -1.794,-4 -4,-4ZM6.501,5c0.828,0 1.5,0.672 1.5,1.5s-0.672,1.5 -1.5,1.5 -1.5,-0.672 -1.5,-1.5 0.672,-1.5 1.5,-1.5ZM19.996,18.437c0,0.86 -0.699,1.56 -1.559,1.56H5.564c-0.86,0 -1.56,-0.7 -1.56,-1.56v-3.253l1.128,-1.128c0.765,-0.762 1.996,-0.771 2.777,-0.037l2.725,2.716 5.405,-5.404c0.377,-0.378 0.884,-0.586 1.414,-0.586 0.517,0 0.984,0.193 1.355,0.537l1.188,1.189v5.965Z",
    send: "M7.234,22.485L20.706,15.073C21.762,14.492 22.525,13.44 22.609,12.238C22.705,10.856 22.024,9.613 20.831,8.957L7.375,1.555C6.002,0.799 4.283,0.816 3.017,1.739C1.962,2.509 1.382,3.67 1.382,4.902C1.382,5.259 1.43,5.621 1.53,5.981L2.713,10.271C2.831,10.698 3.22,10.995 3.663,10.995H15.715C16.26,10.995 16.702,11.436 16.702,11.981C16.702,12.525 16.26,12.967 15.715,12.967H3.663C3.22,12.967 2.831,13.263 2.713,13.691L1.576,17.811C1.153,19.348 1.584,21.047 2.812,22.063C4.087,23.118 5.79,23.278 7.234,22.485Z",
    mic: "M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z"
  };
  const YouCodeBoxes = ({ code }) => React.createElement("div", { className: "you-codes" }, (code || "").match(/.{1,4}/g) ? (code.match(/.{1,4}/g) || []).map((part, i) => React.createElement("span", { key: i, className: "you-code-box" }, part)) : React.createElement("span", { className: "you-code-box" }, "····"));
  const YouPage = ({ nav }) => {
    const [free, setFree] = useState(false);
    const [q, setQ] = useState("");
    const [items, setItems] = useState([]);
    const [ld, setLd] = useState(true);
    useEffect(() => {
      let stop = false;
      setLd(true);
      const file = free ? "res/apps/list.json" : "res/apps/list2.json";
      fetch(file).then((r) => r.json()).then((d) => { if (!stop) setItems(Array.isArray(d) ? d : []); }).catch(() => { if (!stop) setItems([]); }).finally(() => { if (!stop) setLd(false); });
      return () => { stop = true; };
    }, [free]);
    const query = q.trim();
    const shown = items.filter((it) => !query || String(it.name || "").indexOf(query) >= 0 || String(it.name || "").toLowerCase().indexOf(query.toLowerCase()) >= 0);
    const apps = shown.filter((it) => it.kind !== "game");
    const games = shown.filter((it) => it.kind === "game");
    const iconBase = free ? "res/apps/apps_icons/" : "res/apps/apps_icons2/";
    const openItem = (it) => nav("/you-app/" + (free ? "free" : "paid") + "/" + encodeURIComponent(it.id));
    const card = (it) => React.createElement("button", { key: it.id, type: "button", className: "you-card", onClick: () => openItem(it) }, React.createElement("img", { src: iconBase + it.file, alt: "" }), React.createElement("span", null, it.name));
    return React.createElement("div", { className: "you-page" },
      React.createElement("div", { className: "you-top-scroll" },
        React.createElement("input", { className: "you-search", value: q, onChange: (e) => setQ(e.target.value), placeholder: "بحث في هذا القسم", "aria-label": "بحث في هذا القسم" }),
        React.createElement("button", { type: "button", className: "you-tool" + (free ? " on" : ""), onClick: () => setFree((v) => !v) }, React.createElement(YouSvg, { d: ICO.logo, size: 22, box: "0 0 60 60" }), React.createElement("span", null, "مجاني")),
        React.createElement("button", { type: "button", className: "you-tool", onClick: () => nav("/you-chat") }, React.createElement(YouSvg, { d: ICO.chat, size: 20 }), React.createElement("span", null, "دردشة")),
        React.createElement("button", { type: "button", className: "you-tool", onClick: () => window.open("https://t.me/apkdroidstore", "_blank", "noopener") }, React.createElement(YouSvg, { d: ICO.head, size: 20 }), React.createElement("span", null, "فريق الدعم")),
        React.createElement("button", { type: "button", className: "you-tool", onClick: () => nav("/you-store") }, React.createElement(YouSvg, { d: ICO.bag, size: 20 }), React.createElement("span", null, "متجري"))
      ),
      ld ? React.createElement("p", { className: "you-empty" }, "جارٍ تحميل المحتوى") : React.createElement(React.Fragment, null,
        React.createElement("section", { className: "you-sec" }, React.createElement("h2", null, "تطبيقات"), apps.length ? React.createElement("div", { className: "you-grid" }, apps.map(card)) : React.createElement("p", { className: "you-empty" }, "لا توجد تطبيقات")),
        React.createElement("section", { className: "you-sec" }, React.createElement("h2", null, "ألعاب"), games.length ? React.createElement("div", { className: "you-grid" }, games.map(card)) : React.createElement("p", { className: "you-empty" }, "لا توجد ألعاب"))
      )
    );
  };
  const YouLocalDetail = ({ route, nav }) => {
    const parts = String(route || "").split("/");
    const src = parts[2] === "free" ? "free" : "paid";
    const id = decodeURIComponent(parts[3] || "");
    const [item, setItem] = useState(null);
    const [miss, setMiss] = useState(false);
    useEffect(() => {
      let stop = false;
      const file = src === "free" ? "res/apps/list.json" : "res/apps/list2.json";
      fetch(file).then((r) => r.json()).then((d) => {
        if (stop) return;
        const found = (Array.isArray(d) ? d : []).find((x) => String(x.id) === String(id));
        setItem(found || null); setMiss(!found);
      }).catch(() => { if (!stop) setMiss(true); });
      return () => { stop = true; };
    }, [src, id]);
    const buy = src !== "free";
    const go = () => { if (item && item.https) window.open(item.https, "_blank", "noopener"); };
    const icon = item ? ((src === "free" ? "res/apps/apps_icons/" : "res/apps/apps_icons2/") + item.file) : "";
    return React.createElement("div", { className: "pb-24 you-detail" },
      React.createElement("button", { type: "button", className: "bg-detail-back-btn", onClick: () => nav("/you") }, "رجوع"),
      !item ? React.createElement("p", { className: "you-empty" }, miss ? "العنصر غير موجود" : "جارٍ فتح الصفحة") : React.createElement("div", { className: "bg-detail" },
        React.createElement("div", { className: "bg-detail-header" },
          React.createElement("img", { className: "bg-detail-icon", src: icon, alt: "" }),
          React.createElement("div", { className: "bg-detail-info" },
            React.createElement("div", { className: "bg-detail-title-row" }, React.createElement("h1", { className: "bg-detail-name" }, item.name)),
            React.createElement("div", { className: "bg-detail-dev" }, "APKDroid"),
            React.createElement("div", { className: "bg-detail-meta" }, React.createElement("span", null, item.kind === "game" ? "لعبة" : "تطبيق"))
          )
        ),
        React.createElement("div", { className: "bg-detail-actions" }, React.createElement("button", { type: "button", className: "bg-btn-install", onClick: go }, buy ? "شراء" : "تثبيت")),
        React.createElement("section", { className: "bg-detail-section" }, React.createElement("h3", null, "حول"), React.createElement("p", { className: "you-about" }, "لقطات الشاشة والوصف غير مضافين لهذا العنصر، لذلك تبقى الحقول الناقصة فارغة مثل صفحة التثبيت الأصلية."))
      )
    );
  };
  const YouStorePage = ({ nav }) => React.createElement("div", { className: "you-store" },
    React.createElement("button", { type: "button", className: "bg-detail-back-btn", onClick: () => nav("/you") }, "رجوع"),
    React.createElement("h1", null, "متجري"),
    React.createElement("p", null, "ارفع تطبيقك إلى متجر APKDroid عبر البريد."),
    React.createElement("a", { className: "you-upload", href: "mailto:apkdroidstore30@gmail.com?subject=I want to upload my app to the APKDroid store." }, "رفع تطبيق على APKDroid")
  );
  const YouChatPage = ({ route, nav }) => {
    const chatId = (String(route || "").split("/")[2] || "");
    const [chats, setChats] = useState(youLoadChats);
    const [mode, setMode] = useState("list");
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [peer, setPeer] = useState("");
    const [note, setNote] = useState("");
    const [text, setText] = useState("");
    const [rec, setRec] = useState(false);
    const [call, setCall] = useState(null);
    const [localUrl, setLocalUrl] = useState("");
    const [remoteUrl, setRemoteUrl] = useState("");
    const recRef = useRef(null);
    const chunksRef = useRef([]);
    const fileRef = useRef(null);
    const scRef = useRef(null);
    useEffect(() => youBus.on("chats", setChats), []);
    useEffect(() => { if (scRef.current) scRef.current.scrollTop = scRef.current.scrollHeight; }, [chats, chatId]);
    useEffect(() => youBus.on("open", (id) => { if (id) nav("/you-chat/" + id); }), [nav]);
    useEffect(() => youBus.on("call", (msg) => {
      if (!msg) return;
      if (msg.act === "invite") setCall({ kind: msg.kind || "audio", incoming: true });
      if (msg.act === "end") { setCall(null); setLocalUrl(""); setRemoteUrl(""); }
    }), []);
    useEffect(() => youBus.on("local", (stream) => setLocalUrl(stream ? URL.createObjectURL(stream) : "")), []);
    useEffect(() => youBus.on("remote", (stream) => setRemoteUrl(stream ? URL.createObjectURL(stream) : "")), []);
    const active = chats.find((c) => c.id === chatId) || null;
    useEffect(() => { if (active && active.unread) youPatchChat(active.id, (c) => { c.unread = 0; return c; }); }, [chatId]);
    const startAdd = () => { setMode("add"); setCode(""); setPeer(""); setNote(""); setName(""); };
    const createCode = async () => {
      const label = name.trim() || "جهة اتصال";
      const id = "c" + Date.now();
      youUpsertChat({ id, name: label, preview: "بانتظار الاتصال", time: Date.now(), unread: 0, messages: [] });
      youP2P.chatId = id;
      setNote("يتم جمع الرمز");
      try {
        const made = await youP2P.makeOffer(id);
        setCode(made); setNote("انسخ الرمز وشاركه، ثم الصق رمز الطرف الآخر.");
      } catch (e) { setNote("تعذر إنشاء الاتصال على هذا الجهاز"); }
    };
    const shareMine = () => { if (code) youShareCode(code); };
    const joinPeer = async () => {
      const label = name.trim() || "جهة اتصال";
      const id = youP2P.chatId || ("c" + Date.now());
      if (!youLoadChats().some((c) => c.id === id)) youUpsertChat({ id, name: label, preview: "بانتظار الاتصال", time: Date.now(), unread: 0, messages: [] });
      youP2P.chatId = id;
      setNote("جارٍ الربط");
      try {
        const decoded = youDecodeCode(peer);
        if (decoded.role === "offer") {
          const answer = await youP2P.takeOffer(peer, id);
          setCode(answer); setNote("أرسل رمز الرد هذا للطرف الآخر.");
        } else {
          await youP2P.takeAnswer(peer);
          setNote("تم إدخال رمز الرد. ستفتح الدردشة عند اكتمال الاتصال.");
        }
      } catch (e) { setNote("الرمز غير صالح"); }
    };
    const current = () => youLoadChats().find((c) => c.id === chatId);
    const pushMine = (message, preview) => {
      youPatchChat(chatId, (c) => { c.messages = (c.messages || []).concat([message]); c.preview = preview; c.time = message.time; c.unread = 0; return c; });
    };
    const sendText = () => {
      const value = text.trim();
      if (!value || !chatId) return;
      const message = { id: "t" + Date.now(), mine: true, kind: "text", text: value, time: Date.now() };
      pushMine(message, value);
      youP2P.chatId = chatId;
      youP2P.sendRaw({ t: "txt", id: message.id, text: value, time: message.time });
      setText("");
    };
    const onFile = (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file || !chatId) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || "");
        const message = { id: "i" + Date.now(), mine: true, kind: "image", url, time: Date.now() };
        pushMine(message, "صورة");
        youP2P.chatId = chatId;
        youP2P.sendChunks({ t: "img", time: message.time }, url);
      };
      reader.readAsDataURL(file);
    };
    const toggleMic = async () => {
      if (recRef.current) {
        recRef.current.stop();
        setRec(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
        const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        chunksRef.current = [];
        mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunksRef.current.push(ev.data); };
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          const message = { id: "a" + Date.now(), mine: true, kind: "audio", url, time: Date.now() };
          pushMine(message, "رسالة صوتية");
          const fr = new FileReader();
          fr.onload = () => { const raw = String(fr.result || "").split(",")[1] || ""; youP2P.chatId = chatId; youP2P.sendChunks({ t: "aud", time: message.time }, raw); };
          fr.readAsDataURL(blob);
          recRef.current = null;
        };
        recRef.current = mr;
        mr.start();
        setRec(true);
      } catch (e) { setNote("تعذر استخدام الميكروفون"); }
    };
    const startCall = async (kind) => {
      try {
        youP2P.chatId = chatId;
        await youP2P.ensureSenders(kind);
        youP2P.sendRaw({ t: "call", act: "invite", kind });
        setCall({ kind, incoming: false });
      } catch (e) { setNote("تعذر بدء المكالمة"); }
    };
    const acceptCall = async () => {
      if (!call) return;
      try { await youP2P.ensureSenders(call.kind); youP2P.sendRaw({ t: "call", act: "accept", kind: call.kind }); setCall(Object.assign({}, call, { incoming: false })); } catch (e) { setNote("تعذر قبول المكالمة"); }
    };
    if (!chatId) {
      return React.createElement("div", { className: "wa-page" },
        React.createElement("header", { className: "wa-head" }, React.createElement("button", { type: "button", className: "wa-icon-btn", onClick: () => nav("/you"), "aria-label": "رجوع" }, "›"), React.createElement("h1", null, "دردشة"), React.createElement("span", null)),
        mode === "add" ? React.createElement("div", { className: "wa-add" },
          React.createElement("h2", null, "الاتصال بشبكة P2P"),
          React.createElement("input", { className: "wa-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "اسم جهة الاتصال" }),
          React.createElement("button", { type: "button", className: "wa-green", onClick: createCode }, "إنشاء رمز الاتصال"),
          React.createElement(YouCodeBoxes, { code }),
          React.createElement("button", { type: "button", className: "wa-share", onClick: shareMine, disabled: !code }, "مشاركة الكود مع"),
          React.createElement("textarea", { className: "wa-input wa-area", value: peer, onChange: (e) => setPeer(e.target.value), placeholder: "الصق رمز الطرف الآخر هنا" }),
          React.createElement("button", { type: "button", className: "wa-green", onClick: joinPeer }, "ربط"),
          note ? React.createElement("p", { className: "wa-note" }, note) : null,
          React.createElement("button", { type: "button", className: "wa-text", onClick: () => setMode("list") }, "رجوع للقائمة")
        ) : React.createElement("div", { className: "wa-list" },
          !chats.length ? React.createElement("button", { type: "button", className: "wa-empty", onClick: startAdd }, "أضف جهة اتصال جديدة") : null,
          chats.map((c) => React.createElement("button", { key: c.id, type: "button", className: "wa-row", onClick: () => nav("/you-chat/" + c.id) },
            React.createElement("span", { className: "wa-av" }, (c.name || "؟").slice(0, 1)),
            React.createElement("span", { className: "wa-mid" }, React.createElement("strong", null, c.name), React.createElement("em", null, c.preview || "ابدأ المحادثة"), c.unread ? React.createElement("b", null, c.unread) : null),
            React.createElement("span", { className: "wa-time" }, youFmtTime(c.time)),
          )),
          React.createElement("button", { type: "button", className: "wa-fab", onClick: startAdd }, "+")
        )
      );
    }
    const messages = (current() || active || { messages: [] }).messages || [];
    return React.createElement("div", { className: "wa-page wa-thread" },
      React.createElement("header", { className: "wa-head" },
        React.createElement("button", { type: "button", className: "wa-icon-btn", onClick: () => nav("/you-chat"), "aria-label": "رجوع" }, "›"),
        React.createElement("h1", null, (active && active.name) || "دردشة"),
        React.createElement("span", { className: "wa-calls" },
          React.createElement("button", { type: "button", className: "wa-icon-btn", onClick: () => startCall("audio"), "aria-label": "مكالمة صوتية" }, React.createElement(YouSvg, { d: ICO.phone, size: 22 })),
          React.createElement("button", { type: "button", className: "wa-icon-btn", onClick: () => startCall("video"), "aria-label": "مكالمة فيديو" }, React.createElement(YouSvg, { d: ICO.video, size: 24, box: "0 0 960 960" }))
        )
      ),
      React.createElement("div", { className: "wa-stream", ref: scRef }, messages.map((m) => React.createElement("div", { key: m.id, className: "wa-bubble " + (m.mine ? "mine" : "theirs") },
        m.kind === "image" ? React.createElement("img", { src: m.url, alt: "" }) : m.kind === "audio" ? React.createElement("audio", { controls: true, src: m.url }) : React.createElement("p", null, m.text),
        React.createElement("small", null, youFmtTime(m.time))
      ))),
      call ? React.createElement("div", { className: "wa-call" },
        React.createElement("strong", null, call.kind === "video" ? "مكالمة فيديو" : "مكالمة صوتية"),
        React.createElement("video", { className: "wa-remote", autoPlay: true, playsInline: true, ref: (el) => { if (el && youP2P.remoteStream) el.srcObject = youP2P.remoteStream; } }),
        React.createElement("video", { className: "wa-local", autoPlay: true, muted: true, playsInline: true, ref: (el) => { if (el && youP2P.localStream) el.srcObject = youP2P.localStream; } }),
        call.incoming ? React.createElement("button", { type: "button", className: "wa-green", onClick: acceptCall }, "قبول") : null,
        React.createElement("button", { type: "button", className: "wa-end", onClick: () => { youP2P.hangup(); setCall(null); } }, "إنهاء")
      ) : null,
      React.createElement("form", { className: "wa-compose", onSubmit: (e) => { e.preventDefault(); sendText(); } },
        React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: onFile }),
        React.createElement("button", { type: "button", className: "wa-icon-btn", onClick: () => fileRef.current && fileRef.current.click(), "aria-label": "مشاركة صورة" }, React.createElement(YouSvg, { d: ICO.image, size: 22 })),
        React.createElement("button", { type: "button", className: "wa-icon-btn" + (rec ? " rec" : ""), onClick: toggleMic, "aria-label": "رسالة صوتية" }, React.createElement(YouSvg, { d: ICO.mic, size: 24, box: "0 -960 960 960" })),
        React.createElement("input", { className: "wa-box", value: text, onChange: (e) => setText(e.target.value), placeholder: "مراسلة" }),
        React.createElement("button", { type: "submit", className: "wa-send", "aria-label": "إرسال" }, React.createElement(YouSvg, { d: ICO.send, size: 22 }))
      )
    );
  };
  const SettingsSpinner = () => /* @__PURE__ */ React.createElement("div", { className: "set-spin-screen", role: "status", "aria-label": "loading" }, /* @__PURE__ */ React.createElement("svg", { className: "set-spin", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 50 50", width: "36", height: "36", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { className: "set-spin-rotor" }, /* @__PURE__ */ React.createElement("circle", { className: "set-spin-arc", cx: "25", cy: "25", r: "20", fill: "none", stroke: "#0B57D0", strokeWidth: "4", strokeMiterlimit: "10", strokeLinecap: "round" }))));
  const Settings = ({ selStore, setSelStore, style2, setStyle2, setExpMode, lang, setLang, night, setNight, nav }) => {
    const [apiOpen, setApiOpen] = useState(false);
    const [boot, setBoot] = useState(true);
    useEffect(() => {
      const t2 = setTimeout(() => setBoot(false), 1500);
      return () => clearTimeout(t2);
    }, []);
    const pickSrc = (id) => {
      const n = normalizeStore(id);
      setSelStore(n);
      setS("apk_store", n);
      setApiOpen(false);
    };
    if (boot) return /* @__PURE__ */ React.createElement(SettingsSpinner, null);
    return /* @__PURE__ */ React.createElement("div", { className: "page-cover play-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 pt-3 pb-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-chip", onClick: () => window.history.back(), "aria-label": t("back") }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold flex-1" }, t("settings_title"))), /* @__PURE__ */ React.createElement("div", { className: "play-seg-row", style: { paddingTop: 8 } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setLang("ar"), className: `play-seg ${lang === "ar" ? "on" : ""}` }, t("lang_ar")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setLang("en"), className: `play-seg ${lang === "en" ? "on" : ""}` }, t("lang_en"))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setApiOpen(true), className: "settings-box", style: { width: "calc(100% - 28px)", border: "none", display: "flex", alignItems: "center", gap: 12, textAlign: "inherit", fontFamily: "inherit", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold" }, "API Search Apps"), /* @__PURE__ */ React.createElement("span", { className: "block text-xs mt-0.5", style: { opacity: 0.7 } }, t("api_search_app_desc"))), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold" }, storeLabel(STORE_CONFIGS[selStore]))), /* @__PURE__ */ React.createElement("div", { className: "settings-box", style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0", style: { flex: 1 } }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium" }, t("style2")), /* @__PURE__ */ React.createElement("p", { className: "text-xs mt-0.5", style: { opacity: 0.7 } }, t("style2_desc"))), /* @__PURE__ */ React.createElement("button", { type: "button", className: `eq-switch ${style2 ? "on" : ""}`, onClick: () => {
      const n = !style2;
      setStyle2(n);
      setExpMode(!n);
    }, "aria-label": t("style2") })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "settings-box", style: { width: "calc(100% - 28px)", border: "none", textAlign: "inherit", fontFamily: "inherit", cursor: "pointer", color: "#eee" }, onClick: () => {
      if (window.confirm(t("reset_confirm"))) wipeStore();
    } }, /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold" }, t("reset_data")), /* @__PURE__ */ React.createElement("span", { className: "block text-xs mt-0.5", style: { opacity: 0.7 } }, t("reset_data_desc"))), /* @__PURE__ */ React.createElement(AccPick, { open: apiOpen, title: "API Search Apps", onClose: () => setApiOpen(false) }, INSTALL_SOURCE_IDS.map((id) => {
      const cfg = STORE_CONFIGS[id];
      const on = selStore === id;
      return /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: `acc-pick-item ${on ? "on" : ""}`, onClick: () => pickSrc(id) }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(BrandIcon, { name: cfg.icon })), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, textAlign: "inherit" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "block" } }, storeLabel(cfg)), cfg.kind === "direct" && /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: ".72rem", opacity: 0.65, fontWeight: 400 } }, t("store_direct_hint"))), on && /* @__PURE__ */ React.createElement("span", null, "\u2713"));
    })));
  };
  const Category = ({ genre, open }) => {
    const decoded = decodeURIComponent(genre || "");
    const fromSearch = SEARCH_CATEGORIES.find((c) => c.term === decoded || c.k === decoded);
    const fromGames = GAME_SECTIONS.find((c) => c.term === decoded || c.k === decoded);
    const fromGenres = GENRES[decoded];
    const g = fromSearch ? { id: fromSearch.gid, term: fromSearch.term, title: t(fromSearch.k) } : fromGames ? { id: fromGames.gid, term: fromGames.term, title: t(fromGames.k) } : fromGenres ? { id: fromGenres.id, term: fromGenres.term, title: decoded } : { id: 6e3, term: decoded, title: decoded };
    const [apps, setApps] = useState([]);
    const [ld, setLd] = useState(true);
    useEffect(() => {
      setLd(true);
      api.cat(g.term, g.id, 40).then((list) => setApps(fromGames ? (list || []).filter(isGameApp) : list || [])).catch(() => setApps([])).finally(() => setLd(false));
    }, [genre]);
    return /* @__PURE__ */ React.createElement("div", { className: "pb-20 sm:pb-8 px-2 pt-4" }, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold px-2 mb-4 capitalize" }, g.title || decoded), ld ? Array(8).fill(0).map((_, i) => /* @__PURE__ */ React.createElement(Skel, { key: i, c: "h-16 m-2" })) : apps.map((a) => /* @__PURE__ */ React.createElement(AppCard, { key: a.trackId, app: a, onClick: open })));
  };
  const EQ_FREQS = [31, 63, 125, 250, 500, 1e3, 2e3, 4e3, 8e3, 16e3];
  const EQ_LABELS = ["31", "63", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];
  const fmtTime = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  };
  const MiniPlayer = ({ track, playing, progress, duration, onToggle, onClose, onPrev, onNext, onSeek, onOpen, isFav, onFav }) => {
    if (!track) return null;
    const pct = duration > 0 ? progress / duration * 100 : 0;
    return /* @__PURE__ */ React.createElement("div", { className: "app-mini bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "mp-progress", onClick: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      onSeek && onSeek(ratio * duration);
    } }, /* @__PURE__ */ React.createElement("div", { className: "mp-progress-fill", style: { width: pct + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2 flex items-center gap-2", onClick: onOpen, style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("img", { src: track.artworkUrl60 || track.artworkUrl100, className: "w-10 h-10 rounded-full object-cover", alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium truncate" }, track.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-muted-foreground truncate" }, track.artistName)), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onFav && onFav(track);
    }, className: `p-1.5 ${isFav ? "text-red-500" : "text-muted-foreground"}` }, /* @__PURE__ */ React.createElement(Icon, { name: "heart", className: `w-5 h-5 ${isFav ? "fill-current" : ""}` })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onPrev && onPrev();
    }, className: "p-1.5 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "prev", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onToggle();
    }, className: "p-1.5 text-primary" }, /* @__PURE__ */ React.createElement(Icon, { name: playing ? "pause" : "play", className: "w-6 h-6" })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onNext && onNext();
    }, className: "p-1.5 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "next", className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onClose();
    }, className: "p-1.5 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "x", className: "w-5 h-5" }))));
  };
  const NowPlaying = ({ track, playing, progress, duration, onToggle, onPrev, onNext, onSeek, onFav, isFav, nav }) => {
    if (!track) return /* @__PURE__ */ React.createElement("div", { className: "p-8 text-center text-muted-foreground" }, t("app_not_found"));
    const pct = duration > 0 ? progress / duration * 100 : 0;
    const dl = () => {
      if (!track.previewUrl) return;
      const a = document.createElement("a");
      a.href = track.previewUrl;
      a.download = (track.trackName || "song") + ".m4a";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "pb-28 sm:pb-12 px-4 pt-4 max-w-md mx-auto flex flex-col items-center" }, /* @__PURE__ */ React.createElement("button", { className: "bg-detail-back-btn self-start", onClick: () => window.history.back() }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-4 h-4" }), " ", t("back")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-muted-foreground uppercase tracking-wider mb-6" }, t("now_playing")), /* @__PURE__ */ React.createElement("div", { className: "relative mb-8" }, /* @__PURE__ */ React.createElement("img", { src: track.artworkUrl100 || track.artworkUrl60, className: `mp-disc spin ${playing ? "" : "paused"}`, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "mp-disc-center" })), /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold text-center truncate w-full px-2" }, track.trackName), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-muted-foreground text-center mt-1 mb-6" }, track.artistName), /* @__PURE__ */ React.createElement("div", { className: "w-full px-2" }, /* @__PURE__ */ React.createElement("div", { className: "mp-progress", style: { height: 4 }, onClick: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      onSeek && onSeek(ratio * duration);
    } }, /* @__PURE__ */ React.createElement("div", { className: "mp-progress-fill", style: { width: pct + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs text-muted-foreground mt-1.5" }, /* @__PURE__ */ React.createElement("span", null, fmtTime(progress)), /* @__PURE__ */ React.createElement("span", null, fmtTime(duration)))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-5 mt-6" }, /* @__PURE__ */ React.createElement("button", { onClick: onPrev, className: "p-2 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "prev", className: "w-7 h-7" })), /* @__PURE__ */ React.createElement("button", { onClick: onToggle, className: "w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: playing ? "pause" : "play", className: "w-7 h-7" })), /* @__PURE__ */ React.createElement("button", { onClick: onNext, className: "p-2 text-muted-foreground" }, /* @__PURE__ */ React.createElement(Icon, { name: "next", className: "w-7 h-7" }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-4 mt-8 w-full" }, /* @__PURE__ */ React.createElement("button", { onClick: dl, className: "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]" }, /* @__PURE__ */ React.createElement(Icon, { name: "download", className: "w-5 h-5" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-medium" }, t("download_song"))), /* @__PURE__ */ React.createElement("button", { onClick: () => nav("/equalizer"), className: "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]" }, /* @__PURE__ */ React.createElement(Icon, { name: "eq", className: "w-5 h-5" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-medium" }, t("equalizer"))), /* @__PURE__ */ React.createElement("button", { onClick: () => onFav && onFav(track), className: `flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${isFav ? "text-red-500" : ""}` }, /* @__PURE__ */ React.createElement(Icon, { name: "heart", className: `w-5 h-5 ${isFav ? "fill-current" : ""}` }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-medium" }, t("favorites")))));
  };
  const EqualizerPage = ({ eqOn, setEqOn, bands, setBand, volume, setVolume, nav }) => {
    return /* @__PURE__ */ React.createElement("div", { className: "pb-28 sm:pb-12 px-4 pt-4 max-w-lg mx-auto" }, /* @__PURE__ */ React.createElement("button", { className: "bg-detail-back-btn", onClick: () => window.history.back() }, /* @__PURE__ */ React.createElement(Icon, { name: "left", className: "w-4 h-4" }), " ", t("back")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-2 mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold" }, t("eq_title")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-muted-foreground" }, eqOn ? t("eq_on") : t("eq_off")), /* @__PURE__ */ React.createElement("button", { type: "button", className: `eq-switch ${eqOn ? "on" : ""}`, onClick: () => setEqOn(!eqOn), "aria-label": "Toggle EQ" }))), /* @__PURE__ */ React.createElement("div", { className: `eq-bands ${eqOn ? "" : "opacity-40 pointer-events-none"}` }, EQ_LABELS.map((lab, i) => /* @__PURE__ */ React.createElement("div", { className: "eq-band", key: lab }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "-12",
        max: "12",
        step: "1",
        value: bands[i],
        disabled: !eqOn,
        onChange: (e) => setBand(i, Number(e.target.value))
      }
    ), /* @__PURE__ */ React.createElement("span", null, lab)))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 px-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-medium text-muted-foreground" }, t("master_volume")), /* @__PURE__ */ React.createElement("input", { className: "eq-vol mt-3 w-full", type: "range", min: "0", max: "1", step: "0.01", value: volume, onChange: (e) => setVolume(Number(e.target.value)) }), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-muted-foreground text-right mt-1" }, Math.round(volume * 100), "%")));
  };
  const StoreLogo = ({ size = 32 }) => /* @__PURE__ */ React.createElement("img", { className: "store-logo", src: STORE_LOGO_SRC, alt: "", style: { height: size, width: "auto", aspectRatio: "915/1039", objectFit: "contain", flexShrink: 0, display: "block" } });
  const InstallMock = ({ promo, blue }) => {
    const accent = blue ? "#0B57D0" : "#02C57A";
    return /* @__PURE__ */ React.createElement("div", { style: { background: promo ? "#0b0b0c" : "#f3f4f6", height: "100%", minHeight: "100%", display: "flex", flexDirection: "column" } }, promo ? /* @__PURE__ */ React.createElement("div", { style: { height: 92, background: blue ? "linear-gradient(180deg,#1a4fa0, #111 90%)" : "linear-gradient(180deg,#2a6, #111 90%)", position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent,rgba(0,0,0,.75))" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", alignItems: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: 8, background: accent } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,.7)" } }))) : /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 12px 6px", display: "flex", alignItems: "center", gap: 8, background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: accent } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { height: 8, width: "70%", borderRadius: 4, background: "#222", marginBottom: 6 } }), /* @__PURE__ */ React.createElement("div", { style: { height: 6, width: "40%", borderRadius: 4, background: "#bbb" } }))), promo && /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 10px 4px", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: 8, background: accent } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 7, borderRadius: 4, background: "#ddd" } })), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 10px 12px", background: promo ? "#111" : "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { height: 22, borderRadius: 999, background: accent } }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, height: 6, borderRadius: 3, background: promo ? "#333" : "#e5e5e5" } }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, height: 6, width: "80%", borderRadius: 3, background: promo ? "#2a2a2a" : "#ececec" } })));
  };
  const ObSvg = ({ html, className }) => /* @__PURE__ */ React.createElement("div", { className: className || "ob-logo", dangerouslySetInnerHTML: { __html: html } });
  const SVG_SETUP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" overflow="visible"><style>.obsetup-shadow{transform-box:fill-box;transform-origin:center;animation:obsetupShadow 3.6s ease-in-out infinite}.obsetup-star{transform-box:fill-box;transform-origin:center;animation:obsetupFloatA 3.4s ease-in-out infinite}.obsetup-sparkle{transform-box:fill-box;transform-origin:center;animation:obsetupTwinkle 2.9s ease-in-out infinite;animation-delay:.3s}.obsetup-gallery{transform-box:fill-box;transform-origin:center;animation:obsetupFloatB 3.9s ease-in-out infinite;animation-delay:.45s}.obsetup-ruler{transform-box:fill-box;transform-origin:center;animation:obsetupFloatC 4.3s ease-in-out infinite;animation-delay:.7s}.obsetup-pink{transform-box:fill-box;transform-origin:center;animation:obsetupFloatA 3.7s ease-in-out infinite;animation-delay:.2s}.obsetup-blue{transform-box:fill-box;transform-origin:center;animation:obsetupFloatB 3.1s ease-in-out infinite;animation-delay:.55s}.obsetup-search{transform-box:fill-box;transform-origin:center;animation:obsetupFloatC 3.6s ease-in-out infinite;animation-delay:.4s}@keyframes obsetupFloatA{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-32px) rotate(-14deg) scale(1.12)}}@keyframes obsetupFloatB{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-38px) rotate(14deg) scale(1.15)}}@keyframes obsetupFloatC{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-25px) rotate(-12deg) scale(1.1)}}@keyframes obsetupTwinkle{0%,100%{transform:scale(1) rotate(0deg);opacity:1}50%{transform:scale(1.8) rotate(35deg);opacity:.4}}@keyframes obsetupShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.55);opacity:.08}}</style><g><path class="obsetup-shadow" d="M295.707 295.01H4.293a2.869 2.869 0 1 1 0-5.738h291.414a2.869 2.869 0 1 1 0 5.738z" fill="#78909C" fill-opacity="0.3"></path><g class="obsetup-star"><path d="M145.45 120.59l29.525 50.281a5.975 5.975 0 0 0 10.326-0.036l28.781-49.805a5.975 5.975 0 0 0-5.124-8.964l-58.307-0.476a5.975 5.975 0 0 0-5.201 9z" fill="#FFC107"></path><path d="M180.52 148.844a15.343 15.343 0 0 1-14.717-11.184 14.708 14.708 0 0 1 1.432-11.374 15.194 15.194 0 0 1 27.657 3.78 14.762 14.762 0 0 1-10.572 18.294 15.206 15.206 0 0 1-3.8 0.484zm-0.352-25.07a10 10 0 0 0-8.704 4.955 9.861 9.861 0 0 0-0.954 7.626 10.426 10.426 0 0 0 12.592 7.275 9.878 9.878 0 0 0 7.085-12.26 10.308 10.308 0 0 0-4.817-6.195 10.37 10.37 0 0 0-5.203-1.402z" fill="#000"></path></g><g class="obsetup-gallery"><path d="M31.227 70.156h91.547a21.316 21.316 0 0 1 21.316 21.316v91.547a21.316 21.316 0 0 1-21.316 21.316H31.227a21.316 21.316 0 0 1-21.316-21.316V91.472a21.316 21.316 0 0 1 21.316-21.316z" fill="#CFD8DC"></path><path d="M77 177.94a40.694 40.694 0 1 1 40.694-40.694A40.74 40.74 0 0 1 77 177.94zm0-75.027a34.333 34.333 0 1 0 34.333 34.333A34.371 34.371 0 0 0 77 102.912z" fill="#000"></path></g><path class="obsetup-ruler" d="M265.634 289.273a17.731 17.731 0 0 1-17.31-14.019l-35.275-165.808a17.701 17.701 0 1 1 34.627-7.366l35.274 165.807a17.709 17.709 0 0 1-17.316 21.387zm-10.774-15.41a11.019 11.019 0 1 0 21.556-4.586l-35.275-165.806a11.019 11.019 0 0 0-21.557 4.585z" fill="#90A4AE" fill-opacity="0.75"></path><path class="obsetup-sparkle" d="M161.303 44.224l-11.42-4.327 11.187-4.159a28.349 28.349 0 0 0 16.747-16.837l4.037-11.041 4.268 11.259a28.35 28.35 0 0 0 16.603 16.514l11.449 4.27-11.25 4.24a28.35 28.35 0 0 0-16.566 16.627l-4.245 11.388-4.343-11.465a28.35 28.35 0 0 0-16.467-16.469z" fill="#78909C" fill-opacity="0.15"></path><g class="obsetup-pink"><path d="M228.656 282.708a35.214 35.214 0 0 0-22.056-63.275 35.217 35.217 0 0 0-65.864-24.588l-25.957 94.015 97.653 0.634a35.052 35.052 0 0 0 16.224-6.786z" fill="#FF80AB"></path><path d="M214.968 276.754a3.102 3.102 0 0 1-1.875-5.573 21.659 21.659 0 0 0 4.187-30.345 3.101 3.101 0 1 1 4.943-3.746 27.861 27.861 0 0 1-5.385 39.034 3.089 3.089 0 0 1-1.87 0.63z" fill="#000"></path></g><g class="obsetup-blue"><path d="M99.487 80.176a28.349 28.349 0 1 1 56.698 0 28.349 28.349 0 1 1-56.698 0" fill="#42A5F5"></path><path d="M120.641 96.956l-12.478-14.139 5.569-4.915 7.256 8.224 20.14-20.065 5.242 5.261-25.729 25.634z" fill="#000"></path></g><g class="obsetup-search"><path d="M77.368 288.862q-1.843 0-3.701-0.16a41.763 41.763 0 0 1-14.203-3.819l-25.813 3.948 7.829-20.075a41.534 41.534 0 0 1-6.002-25.501 42.028 42.028 0 0 1 45.447-38.188 41.977 41.977 0 0 1-3.557 83.796zm-17.234-8.419l0.602 0.296a37.688 37.688 0 1 0 19.818-71.401 37.733 37.733 0 0 0-40.805 34.288 37.308 37.308 0 0 0 5.919 23.735l0.598 0.921-5.924 15.189z" fill="#546E7A"></path><path d="M77.339 272.26q-1.113 0-2.237-0.097a25.322 25.322 0 1 1 2.237 0.097zm-0.08-46.463a21.087 21.087 0 1 0 21.044 22.91 21.084 21.084 0 0 0-19.185-22.829c-0.621-0.055-1.242-0.081-1.859-0.081z" fill="#546E7A"></path></g></g></svg>';
  const SVG_LANG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960"><path d="M325,848.5q-73-31.5-127.5-86T111.5,635T80,479.5t31.5-155t86-127t127.5-86T480.5,80t155,31.5t127,86t86,127t31.5,155T848.5,635t-86,127.5t-127,86T480.5,880T325,848.5ZM480,798q26-36 45-75t31-83H404q12,44 31,83t45,75ZM376,782q-18-33-31.5-68.5T322,640H204q29,50 72.5,87T376,782Zm208,0q56-18 99.5-55T756,640H638q-9,38-22.5,73.5T584,782ZM170,560H306q-3-20-4.5-39.5T300,480t1.5-40.5T306,400H170q-5,20-7.5,39.5T160,480t2.5,40.5T170,560Zm216,0H574q3-20 4.5-39.5T580,480t-1.5-40.5T574,400H386q-3,20-4.5,39.5T380,480t1.5,40.5T386,560Zm268,0H790q5-20 7.5-39.5T800,480t-2.5-40.5T790,400H654q3,20 4.5,39.5T660,480t-1.5,40.5T654,560ZM638,320H756q-29-50-72.5-87T584,178q18,33 31.5,68.5T638,320Zm-234,0H556q-12-44-31-83t-45-75q-26,36-45,75t-31,83Zm-200,0H322q9-38 22.5-73.5T376,178q-56,18-99.5,55T204,320Z" fill="#FFFFFF"></path></svg>';
  const SVG_THEME = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><style>.cls-2{fill:#a2887e}.cls-3{fill:#006165}.cls-6{fill:#8e6e62}.cls-8{fill:#55c7db}.cls-9{fill:#b5e2eb}</style></defs><path d="M452.7 491a11.7 11.7 0 00-20.4-10.7l19.4 14.1z" fill="#f36e44"></path><path class="cls-2" d="M429.8 484.9l-3 10.8c-1.8 6-1.6 11.2 7 14.3l-.6 4.8h15.6l.2-7.3a35.5 35.5 0 011.4-8.5l.6-2.3-20-14.5a12.2 12.2 0 00-1.2 2.7z"></path><path class="cls-3" d="M424.7 474.8a1.1 1.1 0 10-1.4 1.8l7.7 5.6a12.2 12.2 0 011.3-2z"></path><path class="cls-3" d="M432.3 480.3a12.2 12.2 0 00-1.3 1.9l20 14.5.6-2.3zm29.4 253h-4.3a1.5 1.5 0 010-3h4.6v1.1h-4.6a.3.3 0 100 .7h4.3z"></path><rect x="125.7" y="745.5" width="530.4" height="9" rx="4.5" ry="4.5" fill="#edeff0"></rect><path d="M666.3 136.7H487.6l-29-81.5-17-9.4-71.1 8.7-58.1 82.2H133.7a34 34 0 00-20 61.6l144.6 105-55.3 170a34 34 0 0052.4 38l144.6-105 144.5 105a34 34 0 0052.5-38l-55.3-170 144.6-105a34 34 0 00-20-61.6z" fill="#78909c"></path><path class="cls-6" d="M441.5 446l-3.9 4.3a1.8 1.8 0 000 2.4 1.8 1.8 0 002.5 0l2.8-2.6z"></path><path class="cls-2" d="M456.7 453.2l-17-12.3 5.8 17.3 6 1.8 5.2-6.8z"></path><path d="M458.2 497L352.3 175.4a.8.8 0 01.7-1.1l3.6-.5a.9.9 0 011 .6l105.6 320.8a2.6 2.6 0 01-.7 2.7 2.6 2.6 0 01-4.3-1z"></path><path class="cls-6" d="M439.7 457.4l4.5-2.6 7 5.6 2.6 2.3a2.4 2.4 0 01.4 3l-.5.8-.3-1a1.5 1.5 0 00-1.7-1l-9.5 1.6z"></path><path class="cls-2" d="M454.2 456.5l-12-8.6a2.1 2.1 0 00-3 .6 2.1 2.1 0 00.5 2.8l11.5 9z"></path><path d="M369.8 164l-33.1 4a4.7 4.7 0 01-5.2-3.5 4.7 4.7 0 014-5.7l33.2-4.1a4.7 4.7 0 015.1 3.6 4.7 4.7 0 01-4 5.7z" fill="#fff"></path><path d="M353.6 174.7l-1.2-3.4-22.6 2.7a1.1 1.1 0 01-1.3-1l-1.4-7.9a1.1 1.1 0 01.2-.8 1.1 1.1 0 01.8-.5l7-.8a1.1 1.1 0 011.2.9 1.1 1.1 0 01-1 1.3l-5.8.7 1 5.7 22.6-2.8a1.2 1.2 0 011.2.8l1.4 4.3z"></path><path class="cls-8" d="M459.6 730.4l1.8 8.6-.7 1a3.5 3.5 0 002.8 5.5H489a3.9 3.9 0 003.7-4.7 3.9 3.9 0 00-3-3l-4.5-1.6a64 64 0 01-7.6-3.3l-5-2.6z"></path><path class="cls-3" d="M469.6 595.4l2.8 127.4 1.3 2.1a6.4 6.4 0 011 4l-.2 2.5a9 9 0 00-4-1h-11l-28-134.9zM492 743.7h-8.5a8 8 0 01-3.7-1l-5.4-2.8a8 8 0 00-3.7-.9h-9.3l-.7 1a3.5 3.5 0 002.8 5.5H489a3.8 3.8 0 003.2-1.8z"></path><path class="cls-9" d="M489.6 737.9l-4.5-1.7a64 64 0 01-7.6-3.3l-4.4-2.2a2.9 2.9 0 00-1.3-.3h-12.2l.7 3.3a2.1 2.1 0 012-1.7h2.5a18 18 0 016.8 1.3l9.8 4a7.5 7.5 0 002.9.6h5.5z"></path><path class="cls-3" d="M455.8 595.5h-38.9l-23.5 119-3 5.2a10.6 10.6 0 00-.7 8.6l.6 2h13l1.5-.7a4.5 4.5 0 002.2-2.4 4.4 4.4 0 00.2-2.6l-.6-2.8zm-70.2 143.9a3.8 3.8 0 00-.6 1.5 3.8 3.8 0 003.7 4.6h9.4a3.9 3.9 0 002-7.2h-13.7z"></path><path class="cls-8" d="M403.3 730.4h-13l-.5 2.2a7.1 7.1 0 01-1.2 2.8l-2.2 3H400z"></path><path class="cls-9" d="M390 732.2h12.5l.8-1.9h-13l-.4 2z"></path><path class="cls-3" d="M398 730.4v2.5a1.5 1.5 0 01-3 0v-2.6h1.2v2.6a.3.3 0 10.7 0v-2.6z"></path><path d="M499.1 483.8l-42.4-30.6-5.5 7.2 29 26.8-32.5 24.7a14.2 14.2 0 01-8.6 2.9h-4.6a14.2 14.2 0 01-12-6.7l-17-27.4 36.6-14.6-2.4-8.7-50.7 13.3a6.8 6.8 0 00-4.7 8.7l26 79 3.7 20.8-1.3 2.5a10.3 10.3 0 003 12.8l1.2 1 52.7-.1-.2-59.7a11.4 11.4 0 012.6-7.3l28.4-34.8a6.8 6.8 0 00-1.3-9.8zM467 124.4a34 34 0 01-58.8 27l-43-45.6a21 21 0 00-32.4 2.2l-20.4 28.7 6.2-40.7a47.6 47.6 0 0141.3-40.1L443 45.7a14.5 14.5 0 0116.2 12.7z" fill="#b0bec5"></path><path d="M435.8 485.7l-1 5.2a8.3 8.3 0 001.5 6.3l1.8 2.6 1.6-5.4a2 2 0 013.2-1.2 2 2 0 01.8 2.1l-.8 3.4a4 4 0 01-2.6 3l4 7a3.3 3.3 0 002.2 1.7 3.4 3.4 0 003.7-1.6 14 14 0 001.2-11l-.4-1z"></path><circle cx="431" cy="489" r="1"></circle><path class="cls-2" d="M430 487.1l-5.2 3.6a.8.8 0 000 1.2l3.2 2.5z"></path><path d="M450.3 583.4a1.7 1.7 0 002.4.2l17-13.6v-4.4l-19 15.3a1.7 1.7 0 00-.4 2.5zm-39.6-22.8l.7 3.7c28.3 5.7 43-13 43-13.3a1.7 1.7 0 10-2.7-2c-.6.8-14 18-41 11.6z" fill="#90a4ae"></path><path d="M345.6 85c-8.3-8.8-23.3-5-26.2 6.8-.4 1.4-.6 2.7-.8 4.1l-6.2 40.8 20.4-28.7a21 21 0 0132.4-2.2z" fill="#546f7a"></path></svg>';
  const SVG_TERMS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141 120"><g><path d="M84.098,3.172C83.348,2.421 82.33,2 81.27,2L59.73,2C58.67,2 57.652,2.421 56.902,3.172L41.672,18.402C40.921,19.152 40.5,20.17 40.5,21.23V42.77C40.5,43.83 40.921,44.848 41.672,45.598L56.902,60.828C57.652,61.579 58.67,62 59.73,62H81.27C82.33,62 83.348,61.579 84.098,60.828L99.328,45.598C100.079,44.848 100.5,43.83 100.5,42.77V21.23C100.5,20.17 100.079,19.152 99.328,18.402L84.098,3.172Z" fill="#EE675C"></path><path d="M70.5,62V118" stroke="#9AA0A6" stroke-width="1"></path><path d="M67.5,15h6v24h-6z" fill="#3C4043"></path><path d="M67,46.5C67,48.409 68.591,50 70.5,50C72.409,50 74,48.409 74,46.5C74,44.591 72.409,43 70.5,43C68.485,43.106 67,44.591 67,46.5Z" fill="#3C4043"></path><path d="M40.5,118H100.5" stroke="#9AA0A6" stroke-width="1"></path></g></svg>';
  const WORLD_COUNTRIES = [
    { c: "af", ar: "\u0623\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646", en: "Afghanistan" },
    { c: "al", ar: "\u0623\u0644\u0628\u0627\u0646\u064A\u0627", en: "Albania" },
    { c: "dz", ar: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631", en: "Algeria" },
    { c: "ad", ar: "\u0623\u0646\u062F\u0648\u0631\u0627", en: "Andorra" },
    { c: "ao", ar: "\u0623\u0646\u063A\u0648\u0644\u0627", en: "Angola" },
    { c: "ar", ar: "\u0627\u0644\u0623\u0631\u062C\u0646\u062A\u064A\u0646", en: "Argentina" },
    { c: "am", ar: "\u0623\u0631\u0645\u064A\u0646\u064A\u0627", en: "Armenia" },
    { c: "au", ar: "\u0623\u0633\u062A\u0631\u0627\u0644\u064A\u0627", en: "Australia" },
    { c: "at", ar: "\u0627\u0644\u0646\u0645\u0633\u0627", en: "Austria" },
    { c: "az", ar: "\u0623\u0630\u0631\u0628\u064A\u062C\u0627\u0646", en: "Azerbaijan" },
    { c: "bh", ar: "\u0627\u0644\u0628\u062D\u0631\u064A\u0646", en: "Bahrain" },
    { c: "bd", ar: "\u0628\u0646\u063A\u0644\u0627\u062F\u064A\u0634", en: "Bangladesh" },
    { c: "by", ar: "\u0628\u064A\u0644\u0627\u0631\u0648\u0633\u064A\u0627", en: "Belarus" },
    { c: "be", ar: "\u0628\u0644\u062C\u064A\u0643\u0627", en: "Belgium" },
    { c: "bz", ar: "\u0628\u0644\u064A\u0632", en: "Belize" },
    { c: "bj", ar: "\u0628\u0646\u064A\u0646", en: "Benin" },
    { c: "bt", ar: "\u0628\u0648\u062A\u0627\u0646", en: "Bhutan" },
    { c: "bo", ar: "\u0628\u0648\u0644\u064A\u0641\u064A\u0627", en: "Bolivia" },
    { c: "ba", ar: "\u0627\u0644\u0628\u0648\u0633\u0646\u0629 \u0648\u0627\u0644\u0647\u0631\u0633\u0643", en: "Bosnia and Herzegovina" },
    { c: "bw", ar: "\u0628\u0648\u062A\u0633\u0648\u0627\u0646\u0627", en: "Botswana" },
    { c: "br", ar: "\u0627\u0644\u0628\u0631\u0627\u0632\u064A\u0644", en: "Brazil" },
    { c: "bn", ar: "\u0628\u0631\u0648\u0646\u0627\u064A", en: "Brunei" },
    { c: "bg", ar: "\u0628\u0644\u063A\u0627\u0631\u064A\u0627", en: "Bulgaria" },
    { c: "bf", ar: "\u0628\u0648\u0631\u0643\u064A\u0646\u0627 \u0641\u0627\u0633\u0648", en: "Burkina Faso" },
    { c: "bi", ar: "\u0628\u0648\u0631\u0648\u0646\u062F\u064A", en: "Burundi" },
    { c: "kh", ar: "\u0643\u0645\u0628\u0648\u062F\u064A\u0627", en: "Cambodia" },
    { c: "cm", ar: "\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0648\u0646", en: "Cameroon" },
    { c: "ca", ar: "\u0643\u0646\u062F\u0627", en: "Canada" },
    { c: "cv", ar: "\u0627\u0644\u0631\u0623\u0633 \u0627\u0644\u0623\u062E\u0636\u0631", en: "Cape Verde" },
    { c: "td", ar: "\u062A\u0634\u0627\u062F", en: "Chad" },
    { c: "cl", ar: "\u062A\u0634\u064A\u0644\u064A", en: "Chile" },
    { c: "cn", ar: "\u0627\u0644\u0635\u064A\u0646", en: "China" },
    { c: "co", ar: "\u0643\u0648\u0644\u0648\u0645\u0628\u064A\u0627", en: "Colombia" },
    { c: "km", ar: "\u062C\u0632\u0631 \u0627\u0644\u0642\u0645\u0631", en: "Comoros" },
    { c: "cg", ar: "\u0627\u0644\u0643\u0648\u0646\u063A\u0648", en: "Congo" },
    { c: "cr", ar: "\u0643\u0648\u0633\u062A\u0627\u0631\u064A\u0643\u0627", en: "Costa Rica" },
    { c: "hr", ar: "\u0643\u0631\u0648\u0627\u062A\u064A\u0627", en: "Croatia" },
    { c: "cu", ar: "\u0643\u0648\u0628\u0627", en: "Cuba" },
    { c: "cy", ar: "\u0642\u0628\u0631\u0635", en: "Cyprus" },
    { c: "cz", ar: "\u0627\u0644\u062A\u0634\u064A\u0643", en: "Czechia" },
    { c: "dk", ar: "\u0627\u0644\u062F\u0646\u0645\u0627\u0631\u0643", en: "Denmark" },
    { c: "dj", ar: "\u062C\u064A\u0628\u0648\u062A\u064A", en: "Djibouti" },
    { c: "do", ar: "\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0627\u0644\u062F\u0648\u0645\u064A\u0646\u064A\u0643\u0627\u0646", en: "Dominican Republic" },
    { c: "ec", ar: "\u0627\u0644\u0625\u0643\u0648\u0627\u062F\u0648\u0631", en: "Ecuador" },
    { c: "eg", ar: "\u0645\u0635\u0631", en: "Egypt" },
    { c: "sv", ar: "\u0627\u0644\u0633\u0644\u0641\u0627\u062F\u0648\u0631", en: "El Salvador" },
    { c: "ee", ar: "\u0625\u0633\u062A\u0648\u0646\u064A\u0627", en: "Estonia" },
    { c: "et", ar: "\u0625\u062B\u064A\u0648\u0628\u064A\u0627", en: "Ethiopia" },
    { c: "fj", ar: "\u0641\u064A\u062C\u064A", en: "Fiji" },
    { c: "fi", ar: "\u0641\u0646\u0644\u0646\u062F\u0627", en: "Finland" },
    { c: "fr", ar: "\u0641\u0631\u0646\u0633\u0627", en: "France" },
    { c: "ga", ar: "\u0627\u0644\u063A\u0627\u0628\u0648\u0646", en: "Gabon" },
    { c: "gm", ar: "\u063A\u0627\u0645\u0628\u064A\u0627", en: "Gambia" },
    { c: "ge", ar: "\u062C\u0648\u0631\u062C\u064A\u0627", en: "Georgia" },
    { c: "de", ar: "\u0623\u0644\u0645\u0627\u0646\u064A\u0627", en: "Germany" },
    { c: "gh", ar: "\u063A\u0627\u0646\u0627", en: "Ghana" },
    { c: "gr", ar: "\u0627\u0644\u064A\u0648\u0646\u0627\u0646", en: "Greece" },
    { c: "gt", ar: "\u063A\u0648\u0627\u062A\u064A\u0645\u0627\u0644\u0627", en: "Guatemala" },
    { c: "gn", ar: "\u063A\u064A\u0646\u064A\u0627", en: "Guinea" },
    { c: "gy", ar: "\u063A\u064A\u0627\u0646\u0627", en: "Guyana" },
    { c: "ht", ar: "\u0647\u0627\u064A\u062A\u064A", en: "Haiti" },
    { c: "hn", ar: "\u0647\u0646\u062F\u0648\u0631\u0627\u0633", en: "Honduras" },
    { c: "hk", ar: "\u0647\u0648\u0646\u063A \u0643\u0648\u0646\u063A", en: "Hong Kong" },
    { c: "hu", ar: "\u0627\u0644\u0645\u062C\u0631", en: "Hungary" },
    { c: "is", ar: "\u0622\u064A\u0633\u0644\u0646\u062F\u0627", en: "Iceland" },
    { c: "in", ar: "\u0627\u0644\u0647\u0646\u062F", en: "India" },
    { c: "id", ar: "\u0625\u0646\u062F\u0648\u0646\u064A\u0633\u064A\u0627", en: "Indonesia" },
    { c: "ir", ar: "\u0625\u064A\u0631\u0627\u0646", en: "Iran" },
    { c: "iq", ar: "\u0627\u0644\u0639\u0631\u0627\u0642", en: "Iraq" },
    { c: "ie", ar: "\u0623\u064A\u0631\u0644\u0646\u062F\u0627", en: "Ireland" },
    { c: "il", ar: "\u0625\u0633\u0631\u0627\u0626\u064A\u0644", en: "Israel" },
    { c: "it", ar: "\u0625\u064A\u0637\u0627\u0644\u064A\u0627", en: "Italy" },
    { c: "ci", ar: "\u0633\u0627\u062D\u0644 \u0627\u0644\u0639\u0627\u062C", en: "Ivory Coast" },
    { c: "jm", ar: "\u062C\u0627\u0645\u0627\u064A\u0643\u0627", en: "Jamaica" },
    { c: "jp", ar: "\u0627\u0644\u064A\u0627\u0628\u0627\u0646", en: "Japan" },
    { c: "jo", ar: "\u0627\u0644\u0623\u0631\u062F\u0646", en: "Jordan" },
    { c: "kz", ar: "\u0643\u0627\u0632\u0627\u062E\u0633\u062A\u0627\u0646", en: "Kazakhstan" },
    { c: "ke", ar: "\u0643\u064A\u0646\u064A\u0627", en: "Kenya" },
    { c: "kw", ar: "\u0627\u0644\u0643\u0648\u064A\u062A", en: "Kuwait" },
    { c: "kg", ar: "\u0642\u064A\u0631\u063A\u064A\u0632\u0633\u062A\u0627\u0646", en: "Kyrgyzstan" },
    { c: "la", ar: "\u0644\u0627\u0648\u0633", en: "Laos" },
    { c: "lv", ar: "\u0644\u0627\u062A\u0641\u064A\u0627", en: "Latvia" },
    { c: "lb", ar: "\u0644\u0628\u0646\u0627\u0646", en: "Lebanon" },
    { c: "ly", ar: "\u0644\u064A\u0628\u064A\u0627", en: "Libya" },
    { c: "lt", ar: "\u0644\u064A\u062A\u0648\u0627\u0646\u064A\u0627", en: "Lithuania" },
    { c: "lu", ar: "\u0644\u0648\u0643\u0633\u0645\u0628\u0648\u0631\u063A", en: "Luxembourg" },
    { c: "mo", ar: "\u0645\u0627\u0643\u0627\u0648", en: "Macao" },
    { c: "mg", ar: "\u0645\u062F\u063A\u0634\u0642\u0631", en: "Madagascar" },
    { c: "my", ar: "\u0645\u0627\u0644\u064A\u0632\u064A\u0627", en: "Malaysia" },
    { c: "mv", ar: "\u0627\u0644\u0645\u0627\u0644\u062F\u064A\u0641", en: "Maldives" },
    { c: "ml", ar: "\u0645\u0627\u0644\u064A", en: "Mali" },
    { c: "mt", ar: "\u0645\u0627\u0644\u0637\u0627", en: "Malta" },
    { c: "mr", ar: "\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627", en: "Mauritania" },
    { c: "mu", ar: "\u0645\u0648\u0631\u064A\u0634\u064A\u0648\u0633", en: "Mauritius" },
    { c: "mx", ar: "\u0627\u0644\u0645\u0643\u0633\u064A\u0643", en: "Mexico" },
    { c: "md", ar: "\u0645\u0648\u0644\u062F\u0648\u0641\u0627", en: "Moldova" },
    { c: "mn", ar: "\u0645\u0646\u063A\u0648\u0644\u064A\u0627", en: "Mongolia" },
    { c: "me", ar: "\u0627\u0644\u062C\u0628\u0644 \u0627\u0644\u0623\u0633\u0648\u062F", en: "Montenegro" },
    { c: "ma", ar: "\u0627\u0644\u0645\u063A\u0631\u0628", en: "Morocco" },
    { c: "mz", ar: "\u0645\u0648\u0632\u0645\u0628\u064A\u0642", en: "Mozambique" },
    { c: "mm", ar: "\u0645\u064A\u0627\u0646\u0645\u0627\u0631", en: "Myanmar" },
    { c: "na", ar: "\u0646\u0627\u0645\u064A\u0628\u064A\u0627", en: "Namibia" },
    { c: "np", ar: "\u0646\u064A\u0628\u0627\u0644", en: "Nepal" },
    { c: "nl", ar: "\u0647\u0648\u0644\u0646\u062F\u0627", en: "Netherlands" },
    { c: "nz", ar: "\u0646\u064A\u0648\u0632\u064A\u0644\u0646\u062F\u0627", en: "New Zealand" },
    { c: "ni", ar: "\u0646\u064A\u0643\u0627\u0631\u0627\u063A\u0648\u0627", en: "Nicaragua" },
    { c: "ne", ar: "\u0627\u0644\u0646\u064A\u062C\u0631", en: "Niger" },
    { c: "ng", ar: "\u0646\u064A\u062C\u064A\u0631\u064A\u0627", en: "Nigeria" },
    { c: "kp", ar: "\u0643\u0648\u0631\u064A\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", en: "North Korea" },
    { c: "mk", ar: "\u0645\u0642\u062F\u0648\u0646\u064A\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", en: "North Macedonia" },
    { c: "no", ar: "\u0627\u0644\u0646\u0631\u0648\u064A\u062C", en: "Norway" },
    { c: "om", ar: "\u0639\u064F\u0645\u0627\u0646", en: "Oman" },
    { c: "pk", ar: "\u0628\u0627\u0643\u0633\u062A\u0627\u0646", en: "Pakistan" },
    { c: "ps", ar: "\u0641\u0644\u0633\u0637\u064A\u0646", en: "Palestine" },
    { c: "pa", ar: "\u0628\u0646\u0645\u0627", en: "Panama" },
    { c: "py", ar: "\u0628\u0627\u0631\u0627\u063A\u0648\u0627\u064A", en: "Paraguay" },
    { c: "pe", ar: "\u0628\u064A\u0631\u0648", en: "Peru" },
    { c: "ph", ar: "\u0627\u0644\u0641\u0644\u0628\u064A\u0646", en: "Philippines" },
    { c: "pl", ar: "\u0628\u0648\u0644\u0646\u062F\u0627", en: "Poland" },
    { c: "pt", ar: "\u0627\u0644\u0628\u0631\u062A\u063A\u0627\u0644", en: "Portugal" },
    { c: "qa", ar: "\u0642\u0637\u0631", en: "Qatar" },
    { c: "ro", ar: "\u0631\u0648\u0645\u0627\u0646\u064A\u0627", en: "Romania" },
    { c: "ru", ar: "\u0631\u0648\u0633\u064A\u0627", en: "Russia" },
    { c: "rw", ar: "\u0631\u0648\u0627\u0646\u062F\u0627", en: "Rwanda" },
    { c: "sa", ar: "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629", en: "Saudi Arabia" },
    { c: "sn", ar: "\u0627\u0644\u0633\u0646\u063A\u0627\u0644", en: "Senegal" },
    { c: "rs", ar: "\u0635\u0631\u0628\u064A\u0627", en: "Serbia" },
    { c: "sg", ar: "\u0633\u0646\u063A\u0627\u0641\u0648\u0631\u0629", en: "Singapore" },
    { c: "sk", ar: "\u0633\u0644\u0648\u0641\u0627\u0643\u064A\u0627", en: "Slovakia" },
    { c: "si", ar: "\u0633\u0644\u0648\u0641\u064A\u0646\u064A\u0627", en: "Slovenia" },
    { c: "so", ar: "\u0627\u0644\u0635\u0648\u0645\u0627\u0644", en: "Somalia" },
    { c: "za", ar: "\u062C\u0646\u0648\u0628 \u0623\u0641\u0631\u064A\u0642\u064A\u0627", en: "South Africa" },
    { c: "kr", ar: "\u0643\u0648\u0631\u064A\u0627 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", en: "South Korea" },
    { c: "ss", ar: "\u062C\u0646\u0648\u0628 \u0627\u0644\u0633\u0648\u062F\u0627\u0646", en: "South Sudan" },
    { c: "es", ar: "\u0625\u0633\u0628\u0627\u0646\u064A\u0627", en: "Spain" },
    { c: "lk", ar: "\u0633\u0631\u064A\u0644\u0627\u0646\u0643\u0627", en: "Sri Lanka" },
    { c: "sd", ar: "\u0627\u0644\u0633\u0648\u062F\u0627\u0646", en: "Sudan" },
    { c: "se", ar: "\u0627\u0644\u0633\u0648\u064A\u062F", en: "Sweden" },
    { c: "ch", ar: "\u0633\u0648\u064A\u0633\u0631\u0627", en: "Switzerland" },
    { c: "sy", ar: "\u0633\u0648\u0631\u064A\u0627", en: "Syria" },
    { c: "tw", ar: "\u062A\u0627\u064A\u0648\u0627\u0646", en: "Taiwan" },
    { c: "tj", ar: "\u0637\u0627\u062C\u064A\u0643\u0633\u062A\u0627\u0646", en: "Tajikistan" },
    { c: "tz", ar: "\u062A\u0646\u0632\u0627\u0646\u064A\u0627", en: "Tanzania" },
    { c: "th", ar: "\u062A\u0627\u064A\u0644\u0627\u0646\u062F", en: "Thailand" },
    { c: "tl", ar: "\u062A\u064A\u0645\u0648\u0631 \u0627\u0644\u0634\u0631\u0642\u064A\u0629", en: "Timor-Leste" },
    { c: "tg", ar: "\u062A\u0648\u063A\u0648", en: "Togo" },
    { c: "tn", ar: "\u062A\u0648\u0646\u0633", en: "Tunisia" },
    { c: "tr", ar: "\u062A\u0631\u0643\u064A\u0627", en: "Turkey" },
    { c: "tm", ar: "\u062A\u0631\u0643\u0645\u0627\u0646\u0633\u062A\u0627\u0646", en: "Turkmenistan" },
    { c: "ug", ar: "\u0623\u0648\u063A\u0646\u062F\u0627", en: "Uganda" },
    { c: "ua", ar: "\u0623\u0648\u0643\u0631\u0627\u0646\u064A\u0627", en: "Ukraine" },
    { c: "ae", ar: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A", en: "United Arab Emirates" },
    { c: "gb", ar: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629", en: "United Kingdom" },
    { c: "us", ar: "\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u0629", en: "United States" },
    { c: "uy", ar: "\u0627\u0644\u0623\u0648\u0631\u0648\u063A\u0648\u0627\u064A", en: "Uruguay" },
    { c: "uz", ar: "\u0623\u0648\u0632\u0628\u0643\u0633\u062A\u0627\u0646", en: "Uzbekistan" },
    { c: "ve", ar: "\u0641\u0646\u0632\u0648\u064A\u0644\u0627", en: "Venezuela" },
    { c: "vn", ar: "\u0641\u064A\u062A\u0646\u0627\u0645", en: "Vietnam" },
    { c: "ye", ar: "\u0627\u0644\u064A\u0645\u0646", en: "Yemen" },
    { c: "zm", ar: "\u0632\u0627\u0645\u0628\u064A\u0627", en: "Zambia" },
    { c: "zw", ar: "\u0632\u064A\u0645\u0628\u0627\u0628\u0648\u064A", en: "Zimbabwe" }
  ];
  const BLOCKED_COUNTRIES = ["sy", "ps", "il", "kr"];
  const isBlockedCountry = (c) => BLOCKED_COUNTRIES.includes(String(c || "").toLowerCase());
  const countryLabel = (code, ar) => {
    const it = WORLD_COUNTRIES.find((x) => x.c === code);
    if (!it) return code || "";
    return ar ? it.ar : it.en;
  };
  const OnboardFlow = ({ onFinish, setLang, setTheme, setExpMode, setStyle2 }) => {
    const [step, setStep] = useState(0);
    const [langPick, setLangPick] = useState(null);
    const [themePick, setThemePick] = useState(null);
    const [lookPick, setLookPick] = useState(null);
    const [countryPick, setCountryPick] = useState(null);
    const [sheet, setSheet] = useState(null);
    const [sheetQ, setSheetQ] = useState("");
    const [pct, setPct] = useState(0);
    const ar = langPick === "ar";
    useEffect(() => {
      if (sheet) setSheetQ("");
    }, [sheet]);
    useEffect(() => {
      if (step !== 6) return;
      const start = Date.now();
      const t2 = setInterval(() => {
        const p = Math.min(100, (Date.now() - start) / 8e3 * 100);
        setPct(p);
        if (p >= 100) {
          clearInterval(t2);
          onFinish({ lang: langPick || "ar", theme: themePick || "light", exp: !lookPick, style2: !!lookPick, country: countryPick || "us" });
        }
      }, 50);
      return () => clearInterval(t2);
    }, [step]);
    const goNext = () => {
      if (step === 0) {
        setStep(1);
        return;
      }
      if (step === 1) {
        if (!langPick) {
          setSheet("lang");
          return;
        }
        setLang(langPick);
        setStep(2);
        return;
      }
      if (step === 2) {
        if (!themePick) {
          setSheet("theme");
          return;
        }
        setTheme(themePick);
        setStep(3);
        return;
      }
      if (step === 3) {
        if (lookPick === null) return;
        setStyle2(!!lookPick);
        setExpMode(!lookPick);
        setStep(4);
        return;
      }
      if (step === 4) {
        setStep(5);
        return;
      }
      if (step === 5) {
        if (!countryPick) {
          setSheet("country");
          return;
        }
        setStep(6);
      }
    };
    const langLabel = langPick === "ar" ? "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" : langPick === "en" ? "English" : ar ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0644\u063A\u0629" : "Choose language";
    const themeLabel = themePick === "dark" ? ar ? "\u062F\u0627\u0643\u0646" : "Dark" : themePick === "light" ? ar ? "\u0641\u0627\u062A\u062D" : "Light" : ar ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062B\u064A\u0645" : "Choose theme";
    const countryName = countryPick ? countryLabel(countryPick, ar) : ar ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0628\u0644\u062F" : "Choose country";
    const filteredCountries = WORLD_COUNTRIES.filter((x) => {
      const q = sheetQ.trim().toLowerCase();
      if (!q) return true;
      return x.ar.includes(sheetQ.trim()) || x.en.toLowerCase().includes(q) || x.c.includes(q);
    });
    return /* @__PURE__ */ React.createElement("div", { className: "ob-screen", dir: ar ? "rtl" : "ltr" }, step === 0 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo", html: SVG_SETUP }), /* @__PURE__ */ React.createElement("div", { className: "ob-title" }, "Store Setup")), step === 1 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo", html: SVG_LANG }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-select", onClick: () => setSheet("lang") }, /* @__PURE__ */ React.createElement("span", null, langLabel), /* @__PURE__ */ React.createElement("span", null, "\u25BE"))), step === 2 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo", html: SVG_THEME }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-select", onClick: () => setSheet("theme") }, /* @__PURE__ */ React.createElement("span", null, themeLabel), /* @__PURE__ */ React.createElement("span", null, "\u25BE"))), step === 3 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement("div", { className: "ob-title", style: { marginBottom: 18 } }, ar ? "\u062A\u062E\u0635\u064A\u0635 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0648\u0627\u0644\u0633\u062A\u0627\u064A\u0644" : "Install page and style"), /* @__PURE__ */ React.createElement("div", { className: "ob-previews" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-preview-wrap ${lookPick === false ? "on" : ""}`, onClick: () => setLookPick(false) }, /* @__PURE__ */ React.createElement("div", { className: "ob-preview" }, /* @__PURE__ */ React.createElement(InstallMock, { promo: true })), /* @__PURE__ */ React.createElement("span", { className: "ob-preview-cap" }, ar ? "\u0633\u062A\u0627\u064A\u0644 \u0623\u062E\u0636\u0631 \u0645\u0639 \u062F\u0639\u0627\u0626\u064A\u0629" : "Green style with promo")), /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-preview-wrap ${lookPick === true ? "on" : ""}`, onClick: () => setLookPick(true) }, /* @__PURE__ */ React.createElement("div", { className: "ob-preview" }, /* @__PURE__ */ React.createElement(InstallMock, { promo: false, blue: true })), /* @__PURE__ */ React.createElement("span", { className: "ob-preview-cap" }, ar ? "\u0633\u062A\u0627\u064A\u0644 \u0623\u0632\u0631\u0642 \u062F\u0648\u0646 \u062F\u0639\u0627\u0626\u064A\u0629" : "Blue style without promo")))), step === 4 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo sm", html: SVG_TERMS }), /* @__PURE__ */ React.createElement("p", { className: "ob-legal" }, "\u0628\u0645\u062A\u0627\u0628\u0639\u062A\u0643 \u0623\u0646\u062A \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0628\u0646\u0648\u062F \u0627\u0644\u062E\u062F\u0645\u0629 \u0648\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0646\u0627. \u0643\u0645\u0627 \u0623\u0646\u0647 \u0633\u064A\u062A\u0645 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0627\u0626\u0644\u0629 \u0639\u0628\u0631 \u062E\u062F\u0645\u0627\u062A \u062E\u0627\u0631\u062C\u064A\u0629 \u0645\u062B\u0644 iTunes \u0648\u0642\u062F \u062A\u062E\u0636\u0639 \u0647\u0630\u0647 \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0625\u0644\u0649 \u0628\u0646\u0648\u062F \u062E\u062F\u0645\u0629 \u0648\u0633\u064A\u0627\u0633\u0629 \u062E\u0635\u0648\u0635\u064A\u0629 \u062E\u0627\u0635\u0629 \u0628\u0647\u0627. \u0646\u062D\u0646 \u0644\u0627 \u0646\u062A\u062D\u0645\u0644 \u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u0623\u064A \u0645\u062D\u062A\u0648\u0649 \u0635\u0627\u062F\u0631 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u062E\u062F\u0645\u0627\u062A.")), step === 5 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo sm", html: SVG_TERMS }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-select", onClick: () => setSheet("country") }, /* @__PURE__ */ React.createElement("span", null, countryName), /* @__PURE__ */ React.createElement("span", null, "\u25BE"))), step === 6 && /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 800, lineHeight: 1.3, textAlign: "center" } }, ar ? "\u0645\u0631\u062D\u0628\u0627 \u0628\u0643 \u0641\u064A APKDroid Store" : "Welcome to APKDroid Store"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, fontSize: 16, opacity: 0.8 } }, ar ? "\u0627\u0644\u0625\u0639\u062F\u0627\u062F" : "Setup"), /* @__PURE__ */ React.createElement("div", { className: "ob-bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: pct + "%" } }))), step !== 6 && /* @__PURE__ */ React.createElement("div", { className: "ob-foot" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-next", onClick: goNext }, step === 4 ? "Next And Save" : "Next")), sheet && /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-bg", onClick: () => setSheet(null) }, /* @__PURE__ */ React.createElement("div", { className: "ob-sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-handle" }), sheet === "lang" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-sheet-item ${langPick === "ar" ? "on" : ""}`, onClick: () => {
      setLangPick("ar");
      setSheet(null);
    } }, "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-sheet-item ${langPick === "en" ? "on" : ""}`, onClick: () => {
      setLangPick("en");
      setSheet(null);
    } }, "English")), sheet === "theme" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-sheet-item ${themePick === "light" ? "on" : ""}`, onClick: () => {
      setThemePick("light");
      setSheet(null);
    } }, /* @__PURE__ */ React.createElement("span", { className: "ob-dot", style: { background: "#f2f2f7" } }), ar ? "\u0641\u0627\u062A\u062D" : "Light"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `ob-sheet-item ${themePick === "dark" ? "on" : ""}`, onClick: () => {
      setThemePick("dark");
      setSheet(null);
    } }, /* @__PURE__ */ React.createElement("span", { className: "ob-dot", style: { background: "#182C26" } }), ar ? "\u062F\u0627\u0643\u0646" : "Dark")), sheet === "country" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { className: "ob-sheet-search", value: sheetQ, onChange: (e) => setSheetQ(e.target.value), placeholder: ar ? "\u0628\u062D\u062B \u0639\u0646 \u0628\u0644\u062F" : "Search country" }), /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-list" }, filteredCountries.map((x) => /* @__PURE__ */ React.createElement("button", { key: x.c, type: "button", className: `ob-sheet-item ${countryPick === x.c ? "on" : ""}`, onClick: () => {
      setCountryPick(x.c);
      setSheet(null);
    } }, ar ? x.ar : x.en)))))));
  };
  const SVG_BLOCKED = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><g><path d="M36,36m-36,0a36,36 0,1 1,72 0a36,36 0,1 1,-72 0" fill="#F28B82" fill-opacity="0.08"></path><path d="M20.417,48.75L36,21.833L51.583,48.75H20.417ZM46.667,45.917L36,27.486L25.333,45.917H46.667ZM34.583,41.667V44.5H37.417V41.667H34.583ZM34.583,33.167H37.417V38.833H34.583V33.167Z" fill="#F28B82"></path></g></svg>';
  const CountryBlock = ({ country: country2, setCountry, lang }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ar = lang === "ar";
    const list = WORLD_COUNTRIES.filter((x) => {
      const s = q.trim().toLowerCase();
      if (!s) return true;
      return x.ar.includes(q.trim()) || x.en.toLowerCase().includes(s) || x.c.includes(s);
    });
    const pick = (c) => {
      setCountry(c);
      setS("apk_country", c);
      setOpen(false);
      if (!isBlockedCountry(c)) location.reload();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "ob-screen", dir: ar ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement(ObSvg, { className: "ob-logo sm", html: SVG_BLOCKED }), /* @__PURE__ */ React.createElement("p", { className: "ob-legal", style: { opacity: 1, fontSize: "1rem", fontWeight: 700 } }, t("country_blocked")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-select", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement("span", null, countryLabel(country2, ar) || t("choose_country")), /* @__PURE__ */ React.createElement("span", null, "\u25BE"))), open && /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-bg", onClick: () => setOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "ob-sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-handle" }), /* @__PURE__ */ React.createElement("input", { className: "ob-sheet-search", value: q, onChange: (e) => setQ(e.target.value), placeholder: ar ? "\u0628\u062D\u062B \u0639\u0646 \u0628\u0644\u062F" : "Search country" }), /* @__PURE__ */ React.createElement("div", { className: "ob-sheet-list" }, list.map((x) => /* @__PURE__ */ React.createElement("button", { key: x.c, type: "button", className: `ob-sheet-item ${country2 === x.c ? "on" : ""}`, onClick: () => pick(x.c) }, ar ? x.ar : x.en))))));
  };
  function App() {
    const [route, nav] = useHash();
    const [theme, setThemeS] = useState(() => getS("apk_theme", "light"));
    const [country2, setCountry] = useState(() => getS("apk_country", "us"));
    const [lang, setLangS] = useState(() => getS("apk_lang", "ar"));
    const [favs, setFavs] = useState(() => loadFavs());
    const [songFavs, setSongFavs] = useState(() => loadSongFavs());
    const [style2, setStyle2S] = useState(() => !!getS("apk_style2", false));
    const setStyle2 = (v) => {
      setStyle2S(!!v);
      setS("apk_style2", !!v);
    };
    const [selStore, setSelStore] = useState(() => {
      if (!getS("apk_store_v2", false)) {
        setS("apk_store_v2", true);
        setS("apk_store", "direct");
        return "direct";
      }
      return normalizeStore(getS("apk_store", "direct"));
    });
    const [expMode, setExpModeS] = useState(() => {
      const s2 = !!getS("apk_style2", false);
      const exp = !s2;
      setS("apk_exp_mode", exp);
      return exp;
    });
    const setExpMode = (v) => {
      setExpModeS(!!v);
      setS("apk_exp_mode", !!v);
    };
    const [detailApp, setDetailApp] = useState(null);
    const [track, setTrack] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [platOpen, setPlatOpen] = useState(false);
    const [accOpen, setAccOpen] = useState(false);
    const [offSheet, setOffSheet] = useState(false);
    const offHold = useRef(false);
    const [profile, setProfile] = useState(() => getS("apk_profile", { name: "", photo: "" }));
    const [night, setNightS] = useState(() => {
      const saved = getS("apk_night", null);
      if (saved == null) return getS("apk_theme", "light") === "black";
      return !!saved;
    });
    const setNight = (v) => {
      setNightS(!!v);
      setS("apk_night", !!v);
    };
    const [queue, setQueue] = useState([]);
    const [qIdx, setQIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [eqOn, setEqOnS] = useState(() => getS("apk_eq_on", false));
    const [bands, setBands] = useState(() => getS("apk_eq_bands", EQ_FREQS.map(() => 0)));
    const [volume, setVolumeS] = useState(() => getS("apk_volume", 1));
    const audio = useRef(null);
    const ctxRef = useRef(null);
    const filtersRef = useRef(null);
    const gainRef = useRef(null);
    const sourceRef = useRef(null);
    const wiredRef = useRef(false);
    const queueRef = useRef([]);
    const qIdxRef = useRef(0);
    useEffect(() => {
      queueRef.current = queue;
      qIdxRef.current = qIdx;
    }, [queue, qIdx]);
    useEffect(() => {
      let stop = false;
      const run = () => {
        probeOnline().then((ok) => {
          if (!stop && !ok && !offHold.current) setOffSheet(true);
          if (!stop && ok) setOffSheet(false);
        });
      };
      run();
      const onOff = () => {
        offHold.current = false;
        setOffSheet(true);
      };
      const onOn = () => {
        offHold.current = false;
        setOffSheet(false);
      };
      window.addEventListener("offline", onOff);
      window.addEventListener("online", onOn);
      return () => {
        stop = true;
        window.removeEventListener("offline", onOff);
        window.removeEventListener("online", onOn);
      };
    }, []);
    useEffect(() => {
      const n = !!night;
      const th = theme === "black" ? "dark" : theme;
      if (th !== theme) setThemeS(th);
      document.documentElement.classList.toggle("black", n);
      document.documentElement.classList.toggle("dark", th === "dark");
      setS("apk_theme", th);
      setS("apk_night", n);
      const special = !!accOpen || route === "/settings" || route === "/downloads" || route === "/search-log";
      const color = special ? "#1F1F1F" : n ? "#000000" : th === "dark" ? "#141415" : "#FFFFFF";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
      try {
        fetch("./manifest.json").then((r) => r.json()).then((man) => {
          man.background_color = color;
          man.theme_color = color;
          const url = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: "application/manifest+json" }));
          let link = document.querySelector('link[rel="manifest"]');
          if (!link) {
            link = document.createElement("link");
            link.rel = "manifest";
            document.head.appendChild(link);
          }
          const prev = link.dataset.blob;
          link.href = url;
          link.dataset.blob = url;
          if (prev) URL.revokeObjectURL(prev);
        }).catch(() => {
        });
      } catch (e) {
      }
    }, [theme, night, route, accOpen]);
    useEffect(() => {
      installImgFallback();
    }, []);
    useEffect(() => {
      document.documentElement.classList.toggle("style2", !!style2);
      setS("apk_style2", !!style2);
    }, [style2]);
    useEffect(() => {
      setLangGlobal(lang);
      document.documentElement.lang = lang;
    }, [lang]);
    useEffect(() => {
      bumpReloadSeed();
    }, []);
    const setTheme = (v) => setThemeS(v);
    const isDarkNow = !!night || theme === "dark";
    const [themePick, setThemePick] = useState(false);
    const themeCur = night ? "dim" : theme === "dark" ? "dark" : "light";
    const applyThemeMode = (mode) => {
      if (mode === "dim") {
        setNight(true);
        setTheme("dark");
      } else if (mode === "dark") {
        setNight(false);
        setTheme("dark");
      } else {
        setNight(false);
        setTheme("light");
      }
      setThemePick(false);
    };
    const toggleTheme = () => setThemePick(true);
    const setLang = (v) => {
      setLangGlobal(v);
      setLangS(v);
    };
    const [onboardDone, setOnboardDone] = useState(() => !!getS("apk_onboard_done", false));
    const finishOnboard = ({ lang: l, theme: th, exp, style2: s2, country: co }) => {
      setLang(l);
      setTheme(th);
      setStyle2(!!s2);
      setExpMode(!s2);
      if (co) {
        setCountry(co);
        setS("apk_country", co);
      }
      setS("apk_onboard_done", true);
      setOnboardDone(true);
    };
    const ensureAudioGraph = (el) => {
      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return false;
          ctxRef.current = new AC();
          const filters = EQ_FREQS.map((f) => {
            const b = ctxRef.current.createBiquadFilter();
            b.type = "peaking";
            b.frequency.value = f;
            b.Q.value = 1.4;
            b.gain.value = 0;
            return b;
          });
          filtersRef.current = filters;
          const gain = ctxRef.current.createGain();
          gain.gain.value = volume;
          gainRef.current = gain;
          for (let i = 1; i < filters.length; i++) filters[i - 1].connect(filters[i]);
          filters[filters.length - 1].connect(gain);
          gain.connect(ctxRef.current.destination);
        }
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        try {
          sourceRef.current && sourceRef.current.disconnect();
        } catch (e) {
        }
        const src = ctxRef.current.createMediaElementSource(el);
        sourceRef.current = src;
        src.connect(filtersRef.current[0]);
        wiredRef.current = true;
        if (filtersRef.current) filtersRef.current.forEach((f, i) => {
          f.gain.value = eqOn ? bands[i] : 0;
        });
        if (gainRef.current) gainRef.current.gain.value = volume;
        return true;
      } catch (err) {
        console.warn("Audio graph", err);
        return false;
      }
    };
    useEffect(() => {
      if (!filtersRef.current) return;
      filtersRef.current.forEach((f, i) => {
        f.gain.value = eqOn ? bands[i] : 0;
      });
    }, [eqOn, bands]);
    useEffect(() => {
      if (gainRef.current) gainRef.current.gain.value = volume;
    }, [volume]);
    useEffect(() => {
      const a = audio.current;
      if (!a) return;
      const onTime = () => {
        setProgress(a.currentTime || 0);
        setDuration(a.duration || 0);
      };
      const onEnd = () => {
        setPlaying(false);
        const list = queueRef.current;
        const idx = qIdxRef.current;
        if (list.length) {
          const ni = (idx + 1) % list.length;
          setTimeout(() => playAt(list, ni), 50);
        }
      };
      a.addEventListener("timeupdate", onTime);
      a.addEventListener("ended", onEnd);
      a.addEventListener("loadedmetadata", onTime);
      return () => {
        a.removeEventListener("timeupdate", onTime);
        a.removeEventListener("ended", onEnd);
        a.removeEventListener("loadedmetadata", onTime);
      };
    }, [track]);
    const setEqOn = (v) => {
      setEqOnS(v);
      setS("apk_eq_on", v);
    };
    const setBand = (i, val) => {
      setBands((prev) => {
        const n = [...prev];
        n[i] = val;
        setS("apk_eq_bands", n);
        return n;
      });
    };
    const setVolume = (v) => {
      setVolumeS(v);
      setS("apk_volume", v);
      if (audio.current && !gainRef.current) audio.current.volume = v;
    };
    const toggle = (app) => {
      if (!app || app.trackId == null) return;
      const id = String(app.trackId);
      setFavs((prev) => {
        const base = Array.isArray(prev) ? prev : loadFavs();
        const exists = base.some((f) => String(f.trackId) === id);
        const n = exists ? base.filter((f) => String(f.trackId) !== id) : [...base, slimApp(app)];
        saveFavs(n);
        return n;
      });
    };
    const toggleSongFav = (song) => {
      if (!song || song.trackId == null) return;
      setSongFavs((prev) => {
        const base = Array.isArray(prev) ? prev : loadSongFavs();
        const e = base.some((f) => String(f.trackId) === String(song.trackId));
        const n = e ? base.filter((f) => String(f.trackId) !== String(song.trackId)) : [...base, slimSong(song)];
        saveSongFavs(n);
        return n;
      });
    };
    const isSongFav = track && songFavs.some((f) => String(f.trackId) === String(track.trackId));
    const open = (app) => nav(`/app/${app.trackId}`);
    const openInstall = (app) => nav(`/app/${app.trackId}?install=1`);
    const playAt = (list, idx) => {
      const song = list[idx];
      if (!song || !song.previewUrl) return;
      if (audio.current) {
        try {
          audio.current.pause();
        } catch (e) {
        }
        audio.current = null;
      }
      const a = new Audio(song.previewUrl);
      a.preload = "auto";
      a.volume = typeof volume === "number" ? volume : 1;
      a.crossOrigin = "anonymous";
      audio.current = a;
      wiredRef.current = false;
      sourceRef.current = null;
      const start = () => {
        setTrack(song);
        setQueue(list);
        setQIdx(idx);
        setPlaying(true);
        setProgress(0);
        setDuration(song.duration || 0);
        if (eqOn) {
          try {
            ensureAudioGraph(a);
          } catch (e) {
          }
        }
      };
      const tryPlay = () => a.play().then(start).catch(() => {
        try {
          a.crossOrigin = null;
        } catch (e) {
        }
        a.play().then(start).catch(() => {
          setTrack(song);
          setQueue(list);
          setQIdx(idx);
          setPlaying(false);
        });
      });
      tryPlay();
    };
    const play = (song) => {
      playAt([song], 0);
    };
    const playFromList = (song, list) => {
      const idx = list.findIndex((s) => s.trackId === song.trackId);
      playAt(list, idx >= 0 ? idx : 0);
    };
    const togglePlay = () => {
      if (!audio.current) return;
      if (playing) {
        audio.current.pause();
        setPlaying(false);
      } else {
        audio.current.play().then(() => {
          var _a;
          if (((_a = ctxRef.current) == null ? void 0 : _a.state) === "suspended") ctxRef.current.resume();
          setPlaying(true);
        }).catch(() => {
        });
      }
    };
    const playNext = () => {
      if (!queue.length) return;
      const ni = (qIdx + 1) % queue.length;
      playAt(queue, ni);
    };
    const playPrev = () => {
      if (!queue.length) return;
      if (progress > 3) {
        if (audio.current) audio.current.currentTime = 0;
        return;
      }
      const pi = (qIdx - 1 + queue.length) % queue.length;
      playAt(queue, pi);
    };
    const seekTo = (t2) => {
      if (audio.current && isFinite(t2)) {
        audio.current.currentTime = t2;
        setProgress(t2);
      }
    };
    const closeP = () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
      setTrack(null);
      setPlaying(false);
      setProgress(0);
      setDuration(0);
    };
    const isDetail = route.startsWith("/app/");
    const isDownloads = route === "/downloads";
    const hideMini = route === "/now-playing" || route === "/equalizer" || isDownloads || route === "/settings" || route === "/search-log";
    let page = null;
    if (route === "/" || route === "") page = /* @__PURE__ */ React.createElement(Home, { nav, open, openInstall });
    else if (route === "/games") page = /* @__PURE__ */ React.createElement(Games, { open });
    else if (route === "/search-log") page = /* @__PURE__ */ React.createElement(SearchLogPage, { nav });
    else if (route === "/search" || route.startsWith("/search?")) {
      const q = new URLSearchParams(route.split("?")[1] || "").get("q") || "";
      page = /* @__PURE__ */ React.createElement(Search, { nav, open, initQ: q, photo: profile && profile.photo, onOpenAccount: () => setAccOpen(true) });
    } else if (isDetail) {
      const _p = route.split("?");
      const _id = _p[0].split("/")[2] || "";
      const _qi = new URLSearchParams(_p[1] || "").get("install") === "1";
      page = /* @__PURE__ */ React.createElement(Detail, { id: _id, nav, favs, toggle, selStore, expMode, setDetailApp, autoInstall: _qi, onToggleTheme: toggleTheme, isDark: isDarkNow });
    } else if (route === "/favorites") page = /* @__PURE__ */ React.createElement(Favs, { favs, songFavs, open, toggle, toggleSongFav, play: playFromList });
    else if (route === "/downloads") page = /* @__PURE__ */ React.createElement(DownloadsManager, { open });
    else if (route === "/you" || route === "/music") page = /* @__PURE__ */ React.createElement(YouPage, { nav });
    else if (route === "/you-store") page = /* @__PURE__ */ React.createElement(YouStorePage, { nav });
    else if (route.startsWith("/you-app/")) page = /* @__PURE__ */ React.createElement(YouLocalDetail, { route, nav });
    else if (route === "/you-chat" || route.startsWith("/you-chat/")) page = /* @__PURE__ */ React.createElement(YouChatPage, { route, nav });
    else if (route === "/now-playing") page = /* @__PURE__ */ React.createElement(NowPlaying, { track, playing, progress, duration, onToggle: togglePlay, onPrev: playPrev, onNext: playNext, onSeek: seekTo, onFav: toggleSongFav, isFav: isSongFav, nav });
    else if (route === "/equalizer") page = /* @__PURE__ */ React.createElement(EqualizerPage, { eqOn, setEqOn, bands, setBand, volume, setVolume, nav });
    else if (route === "/settings") page = /* @__PURE__ */ React.createElement(Settings, { selStore, setSelStore, style2, setStyle2, setExpMode, lang, setLang, night, setNight, nav });
    else if (route.startsWith("/category/")) page = /* @__PURE__ */ React.createElement(Category, { genre: route.split("/")[2], open });
    else page = /* @__PURE__ */ React.createElement(Home, { nav, open, openInstall });
    const showS = !route.startsWith("/search") && !isDetail && route !== "/now-playing" && route !== "/equalizer" && !isDownloads;
    useEffect(() => {
      const el = document.getElementById("app-scroll");
      if (el) el.scrollTop = 0;
    }, [route]);
    if (!onboardDone) return /* @__PURE__ */ React.createElement(OnboardFlow, { onFinish: finishOnboard, setLang, setTheme, setExpMode, setStyle2 });
    if (isBlockedCountry(country2)) return /* @__PURE__ */ React.createElement(CountryBlock, { country: country2, setCountry, lang });
    return /* @__PURE__ */ React.createElement("div", { className: "app-shell", key: lang }, /* @__PURE__ */ React.createElement(AccountHub, { open: accOpen, onClose: () => setAccOpen(false), nav, theme, setTheme, profile, setProfile, lang, night, setNight }), /* @__PURE__ */ React.createElement(AccPick, { open: themePick, title: t("choose_theme"), onClose: () => setThemePick(false) }, [{ id: "light", label: t("light") }, { id: "dark", label: t("dark") }, { id: "dim", label: t("theme_dim") }].map((it) => /* @__PURE__ */ React.createElement("button", { key: it.id, type: "button", className: `acc-pick-item ${themeCur === it.id ? "on" : ""}`, onClick: () => applyThemeMode(it.id) }, /* @__PURE__ */ React.createElement("span", null, it.label), themeCur === it.id && /* @__PURE__ */ React.createElement("span", { style: { marginInlineStart: "auto" } }, "\u2713")))), /* @__PURE__ */ React.createElement("main", { id: "app-scroll", className: "app-main max-w-screen-2xl mx-auto w-full" }, !(isDownloads || route === "/settings" || route === "/search-log" || accOpen || isDetail || route.startsWith("/search") || route === "/you" || route === "/music" || route.startsWith("/you-")) && /* @__PURE__ */ React.createElement(TopNav, { nav, isDetail, onOpenAccount: () => setAccOpen(true), route, photo: profile && profile.photo }), /* @__PURE__ */ React.createElement("div", { className: "app-scroll-fill" }, page)), !hideMini && /* @__PURE__ */ React.createElement(MiniPlayer, { track, playing, progress, duration, onToggle: togglePlay, onClose: closeP, onPrev: playPrev, onNext: playNext, onSeek: seekTo, onOpen: () => nav("/now-playing"), isFav: isSongFav, onFav: toggleSongFav }), !(isDownloads || route === "/settings" || route === "/search-log" || accOpen || route.startsWith("/you-chat") || route.startsWith("/you-app") || route === "/you-store") && /* @__PURE__ */ React.createElement(BottomNav, { route, nav }), offSheet && /* @__PURE__ */ React.createElement(OfflineSheet, { onRetry: () => {
      probeOnline().then((ok) => setOffSheet(!ok));
    }, onCancel: () => {
      offHold.current = true;
      setOffSheet(false);
    } }));
  }
  class ErrorBoundary extends React.Component {
    constructor(p) {
      super(p);
      this.state = { err: null };
    }
    static getDerivedStateFromError(e) {
      return { err: e };
    }
    componentDidCatch(e, i) {
      console.error("UI error", e, i);
    }
    render() {
      if (this.state.err) return /* @__PURE__ */ React.createElement("div", { style: { padding: 24, fontFamily: "sans-serif" } }, /* @__PURE__ */ React.createElement("h2", { style: { margin: "0 0 8px" } }, "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0639\u0631\u0636"), /* @__PURE__ */ React.createElement("p", { style: { color: "#666", fontSize: 14 } }, String(this.state.err && this.state.err.message || this.state.err)), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        this.setState({ err: null });
        location.hash = "#/";
      }, style: { marginTop: 12, padding: "10px 16px", borderRadius: 10, border: "none", background: "#02C57A", color: "#fff" } }, "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0631\u0626\u064A\u0633\u064A\u0629"));
      return this.props.children;
    }
  }
  _bootStore().then(() => {
    ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(App, null)));
  }).catch(() => {
    ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(App, null)));
  });
})();
