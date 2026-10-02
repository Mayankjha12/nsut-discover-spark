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
    var hasLogout = (document.body ? document.body.innerText : "").toLowerCase().indexOf("logout") >= 0;
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "URL_CHANGED",
        url: url,
        isInner: isInner,
        hasLogout: hasLogout,
      }));
    }
  } catch (e) {}
  true;
})();
`;
