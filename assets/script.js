// !! 여기에 배포된 Apps Script 웹앱 URL을 넣으세요 (반드시 /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/PASTE_YOUR_EXEC_URL/exec";

const form = document.getElementById("subscribeForm");
const msg = document.getElementById("formMsg");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  btn.disabled = true;

  // 폼 데이터 수집
  const fd = new FormData(form);
  const data = {
    name: fd.get("name")?.trim(),
    company: fd.get("company")?.trim(),
    email: fd.get("email")?.trim(),
    consent: form.consent.checked,
    interests: fd.getAll("interests"),
    referer: document.referrer,
    userAgent: navigator.userAgent,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // Apps Script가 CORS/JSON으로 응답해야 여기서 읽힘
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (json.ok) {
      const params = new URLSearchParams();
      params.set("name", data.name);
      params.set("company", data.company);
      params.set("email", data.email);
      data.interests.forEach(v => params.append("interests", v));
      location.href = `complete.html?${params.toString()}`;
    } else {
      throw new Error(json.error || "unknown_error");
    }
  } catch (err) {
    // 여기서 뜨던 "서버 연결에 실패했습니다" 메시지
    msg.textContent = "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});
