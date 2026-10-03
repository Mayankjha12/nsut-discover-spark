// Injected inside the IMS NSUT webview after login to scrape attendance data.
// Looks for the standard attendance table (tabular rows with subject/code/attendance).
// Posts result to React Native via window.ReactNativeWebView.postMessage.

export const ATTENDANCE_SCRAPE_JS = `
(function () {
  try {
    function send(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function textOf(el) {
      return (el && el.textContent ? el.textContent : "").replace(/\\s+/g, " ").trim();
    }

    var tables = document.querySelectorAll("table");
    var subjects = [];
    var overall = null;

    tables.forEach(function (t) {
      var rows = t.querySelectorAll("tr");
      if (rows.length < 2) return;
      var headerText = textOf(rows[0]).toLowerCase();
      var looksLikeAttendance = (
        headerText.indexOf("subject") >= 0 || headerText.indexOf("course") >= 0
      ) && (
        headerText.indexOf("attend") >= 0 || headerText.indexOf("%") >= 0
      );
      if (!looksLikeAttendance) return;
      for (var i = 1; i < rows.length; i++) {
        var cells = rows[i].querySelectorAll("td");
        if (!cells || cells.length < 2) continue;
        var cellTexts = [];
        for (var c = 0; c < cells.length; c++) cellTexts.push(textOf(cells[c]));
        // Try to extract: subject name, code, percent
        var pct = null;
        for (var c = cellTexts.length - 1; c >= 0; c--) {
          var m = cellTexts[c].match(/([0-9]{1,3}(?:\\.[0-9]+)?)\\s*%?/);
          if (m) {
            var v = parseFloat(m[1]);
            if (v >= 0 && v <= 100) { pct = v; break; }
          }
        }
        if (pct == null) continue;
        var name = cellTexts[0] || "";
        var code = cellTexts.length > 1 ? cellTexts[1] : "";
        subjects.push({ name: name, code: code, percent: pct, cells: cellTexts });
      }
    });

    // Overall from "overall" / "cumulative"
    var all = document.body ? document.body.innerText : "";
    var mo = all.match(/(?:overall|cumulative|total)[^0-9]{0,20}([0-9]{1,3}(?:\\.[0-9]+)?)/i);
    if (mo) overall = parseFloat(mo[1]);
    if (overall == null && subjects.length) {
      var sum = 0; subjects.forEach(function (s) { sum += s.percent; });
      overall = Math.round((sum / subjects.length) * 10) / 10;
    }

    send({
      type: "ATTENDANCE_RESULT",
      url: location.href,
      subjects: subjects,
      overall_percent: overall,
      scraped_at: new Date().toISOString(),
    });
  } catch (e) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ERROR", message: String(e) }));
    }
  }
  true;
})();
`;

export const PROFILE_SCRAPE_JS = `
(function () {
  try {
    function send(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    var text = document.body ? document.body.innerText : "";
    function pick(re) {
      var m = text.match(re);
      return m ? m[1].trim() : "";
    }
    var roll = pick(/Roll\\s*(?:No\\.?|Number)?[\\s:]*([A-Z0-9\\/]+)/i);
    var name = pick(/Name[\\s:]*([A-Z][A-Za-z \\.]+)/);
    var branch = pick(/Branch[\\s:]*([A-Za-z &\\.]+)/);
    var year = pick(/Year[\\s:]*([A-Za-z0-9]+)/);
    var section = pick(/Section[\\s:]*([A-Za-z0-9]+)/);
    send({
      type: "PROFILE_RESULT",
      roll_number: roll,
      name: name,
      branch: branch,
      year: year,
      section: section,
    });
  } catch (e) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ERROR", message: String(e) }));
    }
  }
  true;
})();
`;

// Try to detect a successful login (after redirect to inner frameset)
export const DETECT_LOGIN_JS = `
(function () {
  try {
    var url = location.href;
    var isInner = url.indexOf("student_login.php") < 0 && url.indexOf("imsnsit.org") >= 0;
    var body = (document.body ? document.body.innerText : "").toLowerCase();
    var hasLogout = body.indexOf("logout") >= 0;
    var hasActivities = body.indexOf("my activities") >= 0 || body.indexOf("my profile") >= 0;
    var err = "";
    if (body.indexOf("invalid security number") >= 0) err = "Wrong captcha — try again.";
    else if (body.indexOf("invalid password") >= 0 || body.indexOf("does not match") >= 0) err = "Wrong roll number or password.";
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "URL_CHANGED",
        url: url,
        isInner: isInner,
        hasLogout: hasLogout,
        hasActivities: hasActivities,
        loginError: err,
      }));
    }
  } catch (e) {}
  true;
})();
`;

// Full sync pipeline — runs INSIDE the logged-in IMS WebView so every fetch
// carries the session cookies. Mirrors the flow of the imsnsit_app reference:
// My Activities -> (Current Sem Courses Registered) -> My Attendance form -> POST -> table.
export const FULL_SYNC_JS = `
(function () {
  var post = function (p) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(p)); };
  var progress = function (m) { post({ type: "SYNC_PROGRESS", message: m }); };
  var txt = function (el) { return (el && el.textContent ? el.textContent : "").replace(/\\s+/g, " ").trim(); };
  var parseHTML = function (html) { return new DOMParser().parseFromString(html, "text/html"); };
  var abs = function (href) { try { return new URL(href, location.href).href; } catch (e) { return href; } };
  function allDocs() {
    var docs = [document];
    var fr = document.querySelectorAll("frame,iframe");
    for (var i = 0; i < fr.length; i++) { try { if (fr[i].contentDocument) docs.push(fr[i].contentDocument); } catch (e) {} }
    return docs;
  }
  function findLink(re) {
    var docs = allDocs();
    for (var d = 0; d < docs.length; d++) {
      var as = docs[d].querySelectorAll("a");
      for (var i = 0; i < as.length; i++) {
        var h = as[i].getAttribute("href");
        if (h && h !== "#" && re.test(txt(as[i]))) return abs(h);
      }
    }
    return null;
  }
  function fy() {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
    var pad = function (n) { return ("0" + (n % 100)).slice(-2); };
    return m <= 5 ? (y - 1) + "-" + pad(y) : y + "-" + pad(y + 1);
  }
  function get(url) { return fetch(url, { credentials: "include" }).then(function (r) { return r.text(); }); }
  function postForm(url, data) {
    var body = Object.keys(data).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]); }).join("&");
    return fetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (r) { return r.text(); });
  }
  function num(v) { var n = parseFloat(String(v || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; }

  async function run() {
    var profileUrl = findLink(/^\\s*my profile\\s*$/i);
    var actUrl = findLink(/^\\s*my activities\\s*$/i);
    if (!actUrl) { post({ type: "SYNC_ERROR", message: "Login not detected yet." }); return; }

    progress("Reading your profile…");
    if (profileUrl) {
      try {
        var pd = parseHTML(await get(profileUrl));
        var kv = {};
        var rows = pd.querySelectorAll("tr");
        for (var i = 0; i < rows.length; i++) {
          var cells = rows[i].querySelectorAll("th,td");
          if (cells.length === 2) kv[txt(cells[0]).toLowerCase()] = txt(cells[1]);
        }
        var pick = function (re) { var k = Object.keys(kv).find(function (x) { return re.test(x); }); return k ? kv[k] : ""; };
        var img = pd.querySelector(".plum_fieldbig img, img[src*='photo'], img[src*='image']");
        post({
          type: "PROFILE_RESULT",
          roll_number: pick(/roll|student\\s*id|enrol/),
          name: pick(/^(student\\s*)?name/),
          branch: pick(/branch|department|programme|program|course/),
          year: pick(/year|semester|sem\\b/),
          section: pick(/section/),
          photo: img ? abs(img.getAttribute("src")) : "",
          raw: kv,
        });
      } catch (e) {}
    }

    progress("Finding attendance page…");
    var ad = parseHTML(await get(actUrl));
    var links = {};
    var anchors = ad.querySelectorAll("a");
    for (var j = 0; j < anchors.length; j++) {
      var href = anchors[j].getAttribute("href");
      if (href && href !== "#") links[txt(anchors[j]).toLowerCase()] = abs(href);
    }
    var keys = Object.keys(links);
    var attKey = keys.find(function (k) { return /attendance/.test(k); });
    var coursesKey = keys.find(function (k) { return /course.*regist/.test(k); });

    var courses = {}, sem = null;
    if (coursesKey) {
      try {
        var cd = parseHTML(await get(links[coursesKey]));
        var head = txt(cd.querySelector("#div2") || cd.body);
        var m = head.match(/Semester\\s*(\\d+)/i);
        if (m) sem = m[1];
        var crows = cd.querySelectorAll("table tr");
        for (var r = 0; r < crows.length; r++) {
          var c = [].map.call(crows[r].querySelectorAll("td"), txt);
          if (c.length >= 7 && /^[A-Z]{2,}[A-Z0-9]*\\d/.test(c[1])) courses[c[1]] = { name: c[2], credits: c[6] };
        }
      } catch (e) {}
    }
    if (!attKey) { post({ type: "SYNC_ERROR", message: "Attendance link not found in My Activities.", links: keys }); return; }

    progress("Fetching attendance report…");
    var fd = parseHTML(await get(links[attKey]));
    var val = function (sel) { var e = fd.querySelector(sel); return e ? (e.value || e.getAttribute("value") || "") : ""; };
    if (!sem) { var so = fd.querySelector("[name=sem]"); if (so) { sem = so.value || ""; if (!sem && so.options && so.options.length) sem = so.options[so.options.length - 1].value; } }
    var form = {
      year: fy(), enc_year: val("#enc_year"), sem: sem || "", enc_sem: val("#enc_sem"), submit: "Submit",
      recentitycode: val("[name=recentitycode]"), dept: val("[name=dept]"), degree: val("[name=degree]"), ename: "", ecode: ""
    };
    var rd = parseHTML(await postForm(links[attKey], form));
    var heads = [].slice.call(rd.querySelectorAll("#myreport table.plum_fieldbig tr.plum_head"));
    if (heads.length < 3) heads = [].slice.call(rd.querySelectorAll("tr.plum_head"));
    if (heads.length < 3) { post({ type: "SYNC_ERROR", message: "Attendance table not found.", preview: txt(rd.body).slice(0, 300) }); return; }

    var codes = [].map.call(heads[2].querySelectorAll("td,th"), txt).slice(1);
    var stats = {};
    heads.slice(-4).forEach(function (row) {
      var c = [].map.call(row.querySelectorAll("td,th"), txt);
      stats[(c[0] || "").toLowerCase()] = c.slice(1);
    });
    var sk = Object.keys(stats);
    var keyFor = function (re) { return sk.find(function (k) { return re.test(k); }); };
    var kP = keyFor(/present/), kA = keyFor(/absent/), kT = keyFor(/class|total|held|deliver/), kPct = keyFor(/%|percent/);
    var subjects = codes.map(function (code, i) {
      var present = num((stats[kP] || [])[i]);
      var absent = num((stats[kA] || [])[i]);
      var total = num((stats[kT] || [])[i]);
      if (total == null && present != null && absent != null) total = present + absent;
      var pct = num((stats[kPct] || [])[i]);
      if (pct == null && total) pct = Math.round((present / total) * 1000) / 10;
      return { code: code, name: (courses[code] && courses[code].name) || code, credits: courses[code] ? courses[code].credits : null,
               present: present, total: total, percent: pct == null ? 0 : pct };
    }).filter(function (s) { return s.code; });
    var tp = 0, tt = 0;
    subjects.forEach(function (s) { if (s.present != null && s.total) { tp += s.present; tt += s.total; } });
    var overall = tt ? Math.round((tp / tt) * 1000) / 10 : (subjects.length ? Math.round(subjects.reduce(function (a, s) { return a + s.percent; }, 0) / subjects.length * 10) / 10 : null);
    post({ type: "ATTENDANCE_RESULT", subjects: subjects, overall_percent: overall, semester: sem, total_present: tp, total_classes: tt,
           scraped_at: new Date().toISOString(), stat_keys: sk });
  }
  run().catch(function (e) { post({ type: "SYNC_ERROR", message: String(e && e.message || e) }); });
  true;
})();
`;
