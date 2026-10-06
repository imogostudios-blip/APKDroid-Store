/* APKDroid — قسم أنت */
(function () {
  const e = React.createElement;
  const { useState, useEffect, useRef, useMemo } = React;

  const PATHS = {
    paid: {
      apps: "res/apps/list2.json",
      appsIcon: "res/apps/apps_icons2/",
      games: "res/games/list2.json",
      gamesIcon: "res/games/games_icons2/"
    },
    free: {
      apps: "res/apps/list.json",
      appsIcon: "res/apps/apps_icons/",
      games: "res/games/list.json",
      gamesIcon: "res/games/games_icons/"
    }
  };

  const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  const storeKey = "apk_you_chats_v1";

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(storeKey) || '{"contacts":[],"messages":{}}'); }
    catch (err) { return { contacts: [], messages: {} }; }
  }
  function saveStore(data) {
    try { localStorage.setItem(storeKey, JSON.stringify(data)); } catch (err) {}
  }

  const bus = {
    contacts: loadStore().contacts,
    messages: loadStore().messages,
    status: {},
    pcs: {},
    channels: {},
    localStreams: {},
    remoteStreams: {},
    listeners: new Set(),
    emit() { this.listeners.forEach((fn) => { try { fn(); } catch (err) {} }); },
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    persist() { saveStore({ contacts: this.contacts, messages: this.messages }); this.emit(); }
  };

  function b64(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  }
  function unb64(code) {
    const raw = String(code || "").trim().replace(/^APKDROID-P2P\s*/i, "").replace(/\s+/g, "");
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  }
  function waitIce(pc) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { pc.removeEventListener("icegatheringstatechange", on); clearTimeout(t); resolve(); };
      const on = () => { if (pc.iceGatheringState === "complete") done(); };
      pc.addEventListener("icegatheringstatechange", on);
      const t = setTimeout(done, 2500);
    });
  }
  function stamp() {
    return new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }

  function pushMsg(contactId, msg) {
    const list = bus.messages[contactId] || (bus.messages[contactId] = []);
    list.push(msg);
    const c = bus.contacts.find((x) => x.id === contactId);
    if (c) {
      c.last = msg.kind === "text" ? msg.text : msg.kind === "image" ? "صورة" : msg.kind === "audio" ? "رسالة صوتية" : msg.kind === "call" ? msg.text : "";
      c.time = msg.time;
      if (msg.from === "them" && bus.activeId !== contactId) c.unread = (c.unread || 0) + 1;
      bus.contacts = [c].concat(bus.contacts.filter((x) => x.id !== contactId));
    }
    bus.persist();
  }

  function sendRaw(contactId, obj) {
    const ch = bus.channels[contactId];
    if (!ch || ch.readyState !== "open") return false;
    const raw = JSON.stringify(obj);
    const size = 12000;
    const id = uid();
    const n = Math.ceil(raw.length / size) || 1;
    for (let i = 0; i < n; i++) ch.send(JSON.stringify({ _p: 1, id, i, n, d: raw.slice(i * size, (i + 1) * size) }));
    return true;
  }

  const parts = {};
  function takePacket(contactId, packet, onMsg) {
    if (!packet || !packet._p) { onMsg(packet); return; }
    const key = contactId + ":" + packet.id;
    const box = parts[key] || (parts[key] = { n: packet.n, d: [] });
    box.d[packet.i] = packet.d;
    if (box.d.filter(Boolean).length < box.n) return;
    delete parts[key];
    try { onMsg(JSON.parse(box.d.join(""))); } catch (err) {}
  }

  async function ensurePc(contactId, creating) {
    if (bus.pcs[contactId]) return bus.pcs[contactId];
    const pc = new RTCPeerConnection(ICE);
    bus.pcs[contactId] = pc;
    pc.ondatachannel = (ev) => bindChannel(contactId, ev.channel);
    pc.ontrack = (ev) => {
      bus.remoteStreams[contactId] = ev.streams[0];
      bus.emit();
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      bus.status[contactId] = st === "connected" ? "connected" : st;
      if (st === "connected") {
        const c = bus.contacts.find((x) => x.id === contactId);
        if (c) c.online = true;
        bus.persist();
      }
      bus.emit();
    };
    if (creating) bindChannel(contactId, pc.createDataChannel("apkchat"));
    return pc;
  }

  function bindChannel(contactId, ch) {
    bus.channels[contactId] = ch;
    ch.onopen = () => {
      bus.status[contactId] = "connected";
      const c = bus.contacts.find((x) => x.id === contactId);
      if (c) c.online = true;
      bus.persist();
    };
    ch.onclose = () => { bus.status[contactId] = "closed"; bus.emit(); };
    ch.onmessage = (ev) => {
      let packet = null;
      try { packet = JSON.parse(ev.data); } catch (err) { return; }
      takePacket(contactId, packet, (msg) => handleIncoming(contactId, msg));
    };
  }

  async function handleIncoming(contactId, msg) {
    if (!msg) return;
    if (msg.type === "signal" && msg.sdp) {
      const pc = await ensurePc(contactId, false);
      const desc = msg.sdp;
      if (desc.type === "offer") {
        await pc.setRemoteDescription(desc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitIce(pc);
        sendRaw(contactId, { type: "signal", sdp: pc.localDescription });
      } else if (desc.type === "answer") {
        await pc.setRemoteDescription(desc);
      }
      bus.emit();
      return;
    }
    if (msg.type === "hangup") {
      stopCall(contactId, true);
      pushMsg(contactId, { id: uid(), from: "them", kind: "call", text: "انتهت المكالمة", time: stamp() });
      return;
    }
    if (msg.type === "chat") {
      pushMsg(contactId, { id: uid(), from: "them", kind: msg.kind || "text", text: msg.text || "", src: msg.src || "", time: stamp() });
    }
  }

  async function makeOffer(contactId) {
    const pc = await ensurePc(contactId, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitIce(pc);
    return b64({ v: 1, role: "offer", sdp: pc.localDescription });
  }
  async function acceptCode(contactId, code) {
    const data = unb64(code);
    const pc = await ensurePc(contactId, false);
    await pc.setRemoteDescription(data.sdp);
    if (data.role === "offer" || data.sdp.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitIce(pc);
      bus.status[contactId] = "connecting";
      bus.emit();
      return b64({ v: 1, role: "answer", sdp: pc.localDescription });
    }
    bus.status[contactId] = "connecting";
    bus.emit();
    return "";
  }

  async function startCall(contactId, video) {
    const pc = bus.pcs[contactId];
    const ch = bus.channels[contactId];
    if (!pc || !ch || ch.readyState !== "open") throw new Error("offline");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !!video });
    bus.localStreams[contactId] = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitIce(pc);
    sendRaw(contactId, { type: "signal", sdp: pc.localDescription });
    bus.status[contactId] = video ? "video" : "audio";
    bus.emit();
  }
  function stopCall(contactId, silent) {
    const stream = bus.localStreams[contactId];
    if (stream) stream.getTracks().forEach((t) => t.stop());
    delete bus.localStreams[contactId];
    delete bus.remoteStreams[contactId];
    if (!silent) sendRaw(contactId, { type: "hangup" });
    if (bus.status[contactId] === "audio" || bus.status[contactId] === "video") bus.status[contactId] = "connected";
    bus.emit();
  }

  function IconFree() {
    return e("svg", { viewBox: "0 0 60 60", width: "22", height: "22", "aria-hidden": "true" },
      e("path", { fill: "#17D064", d: "M27.367,29.304C27.367,30.243 26.651,30.845 25.443,30.845L24.49,30.845L24.49,27.888C24.666,27.856 25,27.809 25.586,27.809C26.698,27.826 27.367,28.319 27.367,29.304ZM56.299,30.449C56.304,32.471 55.5,34.412 54.067,35.838L50.842,39.063L50.842,43.622C50.842,47.824 47.423,51.243 43.223,51.243L38.662,51.243L35.437,54.468C34.001,55.906 32.087,56.7 30.05,56.7C28.013,56.7 26.099,55.906 24.659,54.464L21.438,51.245L16.877,51.245C14.855,51.251 12.914,50.447 11.488,49.013C10.055,47.586 9.252,45.646 9.258,43.624L9.258,39.061L6.033,35.838C4.593,34.399 3.801,32.485 3.801,30.449C3.801,28.413 4.595,26.498 6.033,25.06L9.258,21.837L9.258,17.28C9.258,13.078 12.677,9.658 16.877,9.658L21.436,9.658L24.663,6.432C26.099,4.994 28.013,4.2 30.05,4.2C32.087,4.2 34.001,4.994 35.441,6.436L38.662,9.655L43.223,9.655C45.257,9.655 47.171,10.448 48.61,11.886C50.044,13.312 50.848,15.253 50.842,17.276L50.842,21.835L54.067,25.06C55.5,26.487 56.304,28.427 56.299,30.449ZM20.266,26.093L13.719,26.093L13.719,36.805L16.151,36.805L16.151,32.498L19.997,32.498L19.997,30.527L16.151,30.527L16.151,28.08L20.268,28.08L20.268,26.093ZM30.179,36.805C29.972,36.392 29.64,34.993 29.305,33.786C29.035,32.8 28.622,32.085 27.874,31.784L27.874,31.736C28.795,31.403 29.765,30.466 29.765,29.098C29.765,28.112 29.415,27.365 28.78,26.857C28.018,26.254 26.905,26.014 25.315,26.014C24.028,26.014 22.867,26.11 22.088,26.237L22.088,36.805L24.488,36.805L24.488,32.593L25.22,32.593C26.205,32.609 26.666,32.974 26.952,34.311C27.271,35.63 27.525,36.504 27.698,36.805L30.179,36.805ZM38.342,34.819L33.938,34.819L33.938,32.277L37.881,32.277L37.881,30.305L33.938,30.305L33.938,28.08L38.12,28.08L38.12,26.093L31.508,26.093L31.508,36.805L38.342,36.805L38.342,34.819ZM46.825,34.819L42.422,34.819L42.422,32.277L46.364,32.277L46.364,30.305L42.422,30.305L42.422,28.08L46.603,28.08L46.603,26.093L39.991,26.093L39.991,36.805L46.825,36.805L46.825,34.819Z" })
    );
  }
  function IconChat() {
    return e("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true" },
      e("path", { fill: "#fff", d: "M16,2L4,2a3,3 0,0 0,-3 3v8a3,3 0,0 0,3 3h1v2.14a0.8,0.8 0,0 0,1.188 0.7L11.3,16L16,16a3,3 0,0 0,3 -3L19,5a3,3 0,0 0,-3 -3ZM4,4h12a1,1 0,0 1,1 1v8a1,1 0,0 1,-1 1h-5.218l-0.452,0.252L7,16.1L7,14L4,14a1,1 0,0 1,-1 -1L3,5a1,1 0,0 1,1 -1ZM21,6.174A3,3 0,0 1,23 9v8a3,3 0,0 1,-2.846 2.996L20,20v2.14a0.8,0.8 0,0 1,-1.189 0.7L13.701,20L8.216,20l3.6,-2h2.402l0.453,0.252L18,20.101L18,18.05l1.95,-0.05 0.113,-0.003A1,1 0,0 0,21 17L21,6.174Z" })
    );
  }
  function IconSupport() {
    return e("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true" },
      e("path", { fill: "#fff", d: "M12,3a9,9 0,0 0,-9 9v7a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-4a2,2 0,0 0,-2 -2H5v-1a7,7 0,1 1,14 0v1h-2a2,2 0,0 0,-2 2v4a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-7a9,9 0,0 0,-9 -9Z" })
    );
  }
  function IconShop() {
    return e("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true" },
      e("path", { fill: "#fff", d: "M19,6h-2c0,-2.76 -2.24,-5 -5,-5S7,3.24 7,6L5,6c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2L21,8c0,-1.1 -0.9,-2 -2,-2zM12,3c1.66,0 3,1.34 3,3L9,6c0,-1.66 1.34,-3 3,-3zM19,20L5,20L5,8h14v12zM12,12c-1.66,0 -3,-1.34 -3,-3L7,9c0,2.76 2.24,5 5,5s5,-2.24 5,-5h-2c0,1.66 -1.34,3 -3,3z" })
    );
  }
  function IconPhone() {
    return e("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" },
      e("path", { fill: "currentColor", d: "M15.659,14.026L14.42,14.496C13.855,14.709 13.217,14.667 12.733,14.306C11.321,13.253 10.26,11.796 9.686,10.123C9.49,9.548 9.64,8.921 10.011,8.442L10.826,7.388C11.336,6.729 11.394,5.828 10.972,5.121L9.683,2.959C9.2,2.148 8.212,1.797 7.317,2.118L5.702,2.696C3.803,3.376 2.681,5.358 3.08,7.328L3.286,8.343C4.375,13.726 7.736,18.341 12.502,21L13.4,21.501C15.144,22.474 17.355,21.987 18.566,20.362L19.595,18.981C20.166,18.215 20.13,17.159 19.507,16.451L17.848,14.563C17.305,13.946 16.435,13.733 15.659,14.026Z" })
    );
  }
  function IconVideo() {
    return e("svg", { viewBox: "0 0 960 960", width: "24", height: "24", "aria-hidden": "true" },
      e("path", { fill: "currentColor", d: "M160,800Q127,800 103.5,776.5Q80,753 80,720L80,240Q80,207 103.5,183.5Q127,160 160,160L640,160Q673,160 696.5,183.5Q720,207 720,240L720,420L846,294Q856,284 868,289Q880,294 880,308L880,652Q880,666 868,671Q856,676 846,666L720,540L720,720Q720,753 696.5,776.5Q673,800 640,800L160,800Z" })
    );
  }
  function IconImage() {
    return e("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" },
      e("path", { fill: "currentColor", d: "M19,1H5C2.794,1 1,2.794 1,5v14c0,2.206 1.794,4 4,4h14c2.206,0 4,-1.794 4,-4V5c0,-2.206 -1.794,-4 -4,-4ZM6.501,5c0.828,0 1.5,0.672 1.5,1.5s-0.672,1.5 -1.5,1.5 -1.5,-0.672 -1.5,-1.5 0.672,-1.5 1.5,-1.5ZM19.996,18.437c0,0.86 -0.699,1.56 -1.559,1.56H5.564c-0.86,0 -1.56,-0.7 -1.56,-1.56v-3.253l1.128,-1.128c0.765,-0.762 1.996,-0.771 2.777,-0.037l2.725,2.716 5.405,-5.404c0.377,-0.378 0.884,-0.586 1.414,-0.586 0.517,0 0.984,0.193 1.355,0.537l1.188,1.189v5.965Z" })
    );
  }
  function IconMic() {
    return e("svg", { viewBox: "0 -960 960 960", width: "24", height: "24", "aria-hidden": "true" },
      e("path", { fill: "currentColor", d: "M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z" })
    );
  }
  function IconSend() {
    return e("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true" },
      e("path", { fill: "currentColor", d: "M7.234,22.485L20.706,15.073C21.762,14.492 22.525,13.44 22.609,12.238C22.705,10.856 22.024,9.613 20.831,8.957L7.375,1.555C6.002,0.799 4.283,0.816 3.017,1.739C1.962,2.509 1.382,3.67 1.382,4.902C1.382,5.259 1.43,5.621 1.53,5.981L2.713,10.271C2.831,10.698 3.22,10.995 3.663,10.995H15.715C16.26,10.995 16.702,11.436 16.702,11.981C16.702,12.525 16.26,12.967 15.715,12.967H3.663C3.22,12.967 2.831,13.263 2.713,13.691L1.576,17.811C1.153,19.348 1.584,21.047 2.812,22.063C4.087,23.118 5.79,23.278 7.234,22.485Z" })
    );
  }

  function shareWhatsApp(text) {
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    try { window.open(url, "_blank", "noopener"); }
    catch (err) { window.location.href = url; }
  }

  function YouPage() {
    const [tick, setTick] = useState(0);
    const [view, setView] = useState("home");
    const [free, setFree] = useState(false);
    const [q, setQ] = useState("");
    const [apps, setApps] = useState([]);
    const [games, setGames] = useState([]);
    const [iconBase, setIconBase] = useState(PATHS.paid);
    const [item, setItem] = useState(null);
    const [buyOpen, setBuyOpen] = useState(false);
    const [contactId, setContactId] = useState("");
    const [draftName, setDraftName] = useState("");
    const [myCode, setMyCode] = useState("");
    const [theirCode, setTheirCode] = useState("");
    const [linkMsg, setLinkMsg] = useState("");
    const [text, setText] = useState("");
    const [recording, setRecording] = useState(false);
    const recRef = useRef(null);
    const chunksRef = useRef([]);
    const fileRef = useRef(null);
    const endRef = useRef(null);
    const remoteRef = useRef(null);
    const localRef = useRef(null);

    useEffect(() => bus.on(() => setTick((n) => n + 1)), []);

    useEffect(() => {
      const paths = free ? PATHS.free : PATHS.paid;
      setIconBase(paths);
      let cancel = false;
      Promise.all([
        fetch(paths.apps).then((r) => r.json()).catch(() => []),
        fetch(paths.games).then((r) => r.json()).catch(() => [])
      ]).then(([a, g]) => {
        if (cancel) return;
        setApps(Array.isArray(a) ? a : []);
        setGames(Array.isArray(g) ? g : []);
      });
      return () => { cancel = true; };
    }, [free]);

    useEffect(() => {
      if (view === "thread" && endRef.current) endRef.current.scrollIntoView({ block: "end" });
    }, [view, tick, contactId]);

    useEffect(() => {
      const id = contactId;
      if (remoteRef.current) remoteRef.current.srcObject = bus.remoteStreams[id] || null;
      if (localRef.current) localRef.current.srcObject = bus.localStreams[id] || null;
    }, [tick, contactId, view]);

    const query = q.trim();
    const shownApps = useMemo(() => apps.filter((a) => !query || String(a.name || "").indexOf(query) !== -1), [apps, query]);
    const shownGames = useMemo(() => games.filter((a) => !query || String(a.name || "").indexOf(query) !== -1), [games, query]);
    const contact = bus.contacts.find((c) => c.id === contactId) || null;
    const messages = (contact && bus.messages[contact.id]) || [];
    const connected = contact && bus.status[contact.id] === "connected" || contact && bus.status[contact.id] === "audio" || contact && bus.status[contact.id] === "video";
    const inCall = contact && (bus.status[contact.id] === "audio" || bus.status[contact.id] === "video" || bus.localStreams[contact.id]);

    function openItem(entry, kind) {
      setItem(Object.assign({ kind }, entry));
      setBuyOpen(false);
      setView("detail");
    }
    function buy() {
      if (!item || !item.https) return;
      try { window.open(item.https, "_blank", "noopener"); }
      catch (err) { window.location.href = item.https; }
      setBuyOpen(false);
    }

    async function createContact() {
      const name = draftName.trim() || "جهة اتصال";
      const id = uid();
      const c = { id, name, last: "بانتظار الاتصال", time: stamp(), unread: 0, online: false };
      bus.contacts = [c].concat(bus.contacts);
      bus.messages[id] = [];
      bus.persist();
      setContactId(id);
      setTheirCode("");
      setLinkMsg("جاري إنشاء كود الاتصال…");
      setView("pair");
      try {
        const code = await makeOffer(id);
        setMyCode(code);
        setLinkMsg("شارك الكود، ثم الصق كود الطرف الآخر.");
      } catch (err) {
        setLinkMsg("تعذر إنشاء الاتصال على هذا الجهاز.");
      }
    }
    async function pasteAndConnect() {
      if (!contactId || !theirCode.trim()) { setLinkMsg("الصق كود الطرف الآخر أولاً."); return; }
      try {
        const answer = await acceptCode(contactId, theirCode);
        if (answer) {
          setMyCode(answer);
          setLinkMsg("تم إنشاء الرد. شاركه عبر واتساب ثم انتظر الاتصال.");
        } else {
          setLinkMsg("تم لصق الكود. يتم إنشاء الاتصال…");
        }
      } catch (err) {
        setLinkMsg("الكود غير صالح.");
      }
    }
    useEffect(() => {
      if (view === "pair" && contactId && bus.status[contactId] === "connected") setView("thread");
    }, [tick, view, contactId]);

    function openThread(c) {
      c.unread = 0;
      bus.activeId = c.id;
      bus.persist();
      setContactId(c.id);
      setView("thread");
    }
    function sendText() {
      const value = text.trim();
      if (!value || !contact) return;
      const msg = { id: uid(), from: "me", kind: "text", text: value, time: stamp() };
      pushMsg(contact.id, msg);
      sendRaw(contact.id, { type: "chat", kind: "text", text: value });
      setText("");
    }
    function onImage(ev) {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      if (!file || !contact) return;
      if (file.size > 900000) { setLinkMsg("الصورة أكبر من الحد."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        pushMsg(contact.id, { id: uid(), from: "me", kind: "image", src, time: stamp() });
        sendRaw(contact.id, { type: "chat", kind: "image", src });
      };
      reader.readAsDataURL(file);
    }
    async function toggleRecord() {
      if (!contact) return;
      if (recording && recRef.current) {
        recRef.current.stop();
        setRecording(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream);
        chunksRef.current = [];
        rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunksRef.current.push(ev.data); };
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
          const reader = new FileReader();
          reader.onload = () => {
            const src = String(reader.result || "");
            pushMsg(contact.id, { id: uid(), from: "me", kind: "audio", src, time: stamp() });
            sendRaw(contact.id, { type: "chat", kind: "audio", src });
          };
          reader.readAsDataURL(blob);
        };
        recRef.current = rec;
        rec.start();
        setRecording(true);
      } catch (err) {
        setLinkMsg("الميكروفون غير متاح.");
      }
    }
    async function call(video) {
      if (!contact) return;
      try {
        await startCall(contact.id, video);
        pushMsg(contact.id, { id: uid(), from: "me", kind: "call", text: video ? "مكالمة فيديو" : "مكالمة صوتية", time: stamp() });
      } catch (err) {
        setLinkMsg(err && err.message === "offline" ? "لازم الاتصال يكتمل أولاً." : "تعذر تشغيل المكالمة.");
        setView("pair");
      }
    }

    function bar() {
      return e("div", { className: "you2-bar" },
        e("label", { className: "you2-search" },
          e("input", { value: q, onChange: (ev) => setQ(ev.target.value), placeholder: "بحث…", "aria-label": "بحث داخل القسم" }),
          e("span", { "aria-hidden": "true" }, "⌕")
        ),
        e("div", { className: "you2-actions" },
          e("button", { type: "button", className: "you2-chip" + (free ? " on" : ""), onClick: () => setFree((v) => !v) }, IconFree(), e("span", null, "مجاني")),
          e("button", { type: "button", className: "you2-chip", onClick: () => setView("chats") }, IconChat(), e("span", null, "دردشة")),
          e("button", { type: "button", className: "you2-chip", onClick: () => setView("support") }, IconSupport(), e("span", null, "فريق الدعم")),
          e("button", { type: "button", className: "you2-chip", onClick: () => setView("store") }, IconShop(), e("span", null, "متجري"))
        )
      );
    }

    function grid(list, base, kind) {
      if (!list.length) return e("p", { className: "you2-empty" }, query ? "لا توجد نتائج" : "لا يوجد محتوى في هذا المسار بعد");
      return e("div", { className: "you2-grid" }, list.map((a) => e("button", {
        type: "button", key: kind + a.id, className: "you2-card", onClick: () => openItem(a, kind)
      },
        e("img", { src: base + a.file, alt: "" }),
        e("span", null, a.name)
      )));
    }

    function home() {
      return e("div", { className: "you2-home" },
        bar(),
        e("section", { className: "you2-sec" },
          e("h2", null, "تطبيقات"),
          grid(shownApps, iconBase.appsIcon, "app")
        ),
        e("section", { className: "you2-sec" },
          e("h2", null, "ألعاب"),
          grid(shownGames, iconBase.gamesIcon, "game")
        )
      );
    }

    function detail() {
      if (!item) return home();
      const shots = Array.isArray(item.screenshots) ? item.screenshots : [];
      const base = item.kind === "game" ? iconBase.gamesIcon : iconBase.appsIcon;
      return e("div", { className: "you2-detail pb-24" },
        e("button", { type: "button", className: "you2-back", onClick: () => setView("home") }, "رجوع"),
        e("div", { className: "you2-detail-head" },
          e("img", { src: base + item.file, alt: "" }),
          e("div", null,
            e("h1", null, item.name || "—"),
            e("p", null, item.developer || "—"),
            item.price ? e("p", { className: "you2-price" }, item.price) : null
          )
        ),
        e("button", { type: "button", className: "bg-btn-install", onClick: () => setBuyOpen(true) }, "شراء"),
        shots.length ? e("div", { className: "you2-shots" }, shots.map((s, i) => e("img", { key: i, src: s, alt: "" }))) : null,
        item.desc ? e("p", { className: "you2-desc" }, item.desc) : null,
        e("div", { className: "bg-detail-section" },
          e("h3", null, "معلومات"),
          e("div", { className: "bg-info-list" },
            e("span", null, e("b", null, "الإصدار: "), item.version || "—"),
            e("span", null, e("b", null, "الحجم: "), item.size || "—"),
            e("span", null, e("b", null, "العمر: "), item.age || "—"),
            e("span", null, e("b", null, "المطور: "), item.developer || "—"),
            e("span", null, e("b", null, "التصنيف: "), item.category || "—")
          )
        ),
        buyOpen && e("div", { className: "bg-req-overlay show", onClick: (ev) => { if (ev.target === ev.currentTarget) setBuyOpen(false); } },
          e("div", { className: "bg-req-sheet", onClick: (ev) => ev.stopPropagation() },
            e("div", { className: "bg-plat-handle" }),
            e("div", { className: "bg-plat-title" }, "شراء"),
            e("div", { className: "bg-req-body" }, e("p", { className: "bg-req-note" }, "هذا الزر خاص بهذا القسم. المتابعة تفتح صفحة العنصر.")),
            e("div", { className: "bg-req-footer" }, e("button", { type: "button", className: "bg-btn-confirm", onClick: buy }, "متابعة الشراء"))
          )
        )
      );
    }

    function storePage() {
      const href = "mailto:apkdroidstore30@gmail.com?subject=" + encodeURIComponent("I want to upload my app to the APKDroid store.");
      return e("div", { className: "you2-sub" },
        e("button", { type: "button", className: "you2-back", onClick: () => setView("home") }, "رجوع"),
        e("h1", null, "متجري"),
        e("p", null, "ارفع تطبيقك إلى متجر APKDroid."),
        e("a", { className: "bg-btn-install", href }, "رفع تطبيق على APKDroid")
      );
    }
    function supportPage() {
      return e("div", { className: "you2-sub" },
        e("button", { type: "button", className: "you2-back", onClick: () => setView("home") }, "رجوع"),
        e("h1", null, "فريق الدعم"),
        e("p", null, "تواصل مع فريق الدعم عبر تيليغرام."),
        e("a", { className: "bg-btn-install", href: "https://t.me/apkdroidstore", target: "_blank", rel: "noopener noreferrer" }, "فتح فريق الدعم")
      );
    }

    function chatList() {
      return e("div", { className: "you2-wa" },
        e("div", { className: "you2-wa-top" },
          e("button", { type: "button", onClick: () => setView("home") }, "رجوع"),
          e("h1", null, "دردشة"),
          e("button", { type: "button", onClick: () => { setDraftName(""); setView("add"); } }, "إضافة")
        ),
        bus.contacts.length === 0 ? e("div", { className: "you2-wa-empty" },
          e("p", null, "ضيف جهة اتصال جديدة"),
          e("button", { type: "button", className: "bg-btn-install", onClick: () => setView("add") }, "إضافة")
        ) : e("div", { className: "you2-wa-list" }, bus.contacts.map((c) => e("button", {
          type: "button", key: c.id, className: "you2-wa-row", onClick: () => openThread(c)
        },
          e("span", { className: "you2-ava" }, (c.name || "?").slice(0, 1)),
          e("span", { className: "you2-wa-mid" },
            e("b", null, c.name),
            e("small", null, c.last || "")
          ),
          e("span", { className: "you2-wa-meta" },
            e("small", null, c.time || ""),
            c.unread ? e("i", null, String(c.unread)) : null
          )
        )))
      );
    }
    function addPage() {
      return e("div", { className: "you2-sub" },
        e("button", { type: "button", className: "you2-back", onClick: () => setView("chats") }, "رجوع"),
        e("h1", null, "ضيف جهة اتصال جديدة"),
        e("input", { className: "you2-field", value: draftName, placeholder: "اسم جهة الاتصال", onChange: (ev) => setDraftName(ev.target.value) }),
        e("button", { type: "button", className: "bg-btn-install", onClick: createContact }, "إضافة")
      );
    }
    function pairPage() {
      return e("div", { className: "you2-sub" },
        e("button", { type: "button", className: "you2-back", onClick: () => setView("chats") }, "رجوع"),
        e("h1", null, "اتصال P2P"),
        e("p", null, linkMsg || "شارك الكود مع الطرف الآخر."),
        e("label", null, "كودك"),
        e("textarea", { className: "you2-code", readOnly: true, value: myCode }),
        e("button", { type: "button", className: "you2-share", onClick: () => shareWhatsApp("APKDROID-P2P " + myCode) }, "مشاركة الكود مع"),
        e("label", null, "كود الطرف الآخر"),
        e("textarea", { className: "you2-code", value: theirCode, onChange: (ev) => setTheirCode(ev.target.value) }),
        e("button", { type: "button", className: "bg-btn-install", onClick: pasteAndConnect }, "ربط"),
        connected ? e("button", { type: "button", className: "you2-share", onClick: () => setView("thread") }, "دخول الدردشة") : null
      );
    }
    function thread() {
      if (!contact) return chatList();
      return e("div", { className: "you2-thread" },
        e("div", { className: "you2-thread-top" },
          e("span", { className: "you2-thread-calls" },
            e("button", { type: "button", "aria-label": "مكالمة صوتية", onClick: () => call(false) }, IconPhone()),
            e("button", { type: "button", "aria-label": "مكالمة فيديو", onClick: () => call(true) }, IconVideo())
          ),
          e("div", { className: "you2-thread-title" },
            e("b", null, contact.name),
            e("small", null, connected ? "متصل" : "غير متصل")
          ),
          e("button", { type: "button", onClick: () => setView("chats") }, "رجوع")
        ),
        inCall && e("div", { className: "you2-call" },
          e("video", { ref: remoteRef, autoPlay: true, playsInline: true }),
          e("video", { ref: localRef, autoPlay: true, muted: true, playsInline: true, className: "you2-call-me" }),
          e("button", { type: "button", onClick: () => stopCall(contact.id, false) }, "إنهاء")
        ),
        e("div", { className: "you2-msgs" },
          messages.map((m) => e("div", { key: m.id, className: "you2-msg " + (m.from === "me" ? "me" : "them") },
            m.kind === "image" ? e("img", { src: m.src, alt: "" }) : null,
            m.kind === "audio" ? e("audio", { src: m.src, controls: true }) : null,
            m.kind !== "image" && m.kind !== "audio" ? e("p", null, m.text) : null,
            e("small", null, m.time)
          )),
          e("div", { ref: endRef })
        ),
        e("div", { className: "you2-composer" },
          e("button", { type: "button", "aria-label": "مشاركة صورة", onClick: () => fileRef.current && fileRef.current.click() }, IconImage()),
          e("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: onImage }),
          e("button", { type: "button", className: recording ? "rec" : "", "aria-label": "رسالة صوتية", onClick: toggleRecord }, IconMic()),
          e("input", { value: text, placeholder: "مراسلة", onChange: (ev) => setText(ev.target.value), onKeyDown: (ev) => { if (ev.key === "Enter") sendText(); } }),
          e("button", { type: "button", "aria-label": "إرسال", onClick: sendText }, IconSend())
        )
      );
    }

    let body = home();
    if (view === "detail") body = detail();
    else if (view === "store") body = storePage();
    else if (view === "support") body = supportPage();
    else if (view === "chats") body = chatList();
    else if (view === "add") body = addPage();
    else if (view === "pair") body = pairPage();
    else if (view === "thread") body = thread();
    return e("div", { className: "you2-page", dir: "rtl" }, body);
  }

  window.APKYouPage = YouPage;
})();
