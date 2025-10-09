// 배포한 Google Apps Script 웹앱 URL (/exec 필수)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyi6TzYTGX6Dz945gnLXyUIxAdSQU_jBe5Z66vhmjQQ7PZ7YjlIHNVsC13Vl8INbcyB/exec";

const form = document.getElementById("subscribeForm");
const msg = document.getElementById("formMsg");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  btn.disabled = true;

  const fd = new FormData(form);
  const data = {
    name: fd.get("name")?.trim(),
    company: fd.get("company")?.trim(),
    email: fd.get("email")?.trim(),
    consent: form.consent.checked,
    interests: fd.getAll("interests"), // 여러 개 체크 가능
    referer: document.referrer,
    userAgent: navigator.userAgent,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (json.ok) {
      // 완료 페이지로 값 전달
      const params = new URLSearchParams();
      params.set("name", data.name);
      params.set("company", data.company);
      params.set("email", data.email);
      data.interests.forEach((v) => params.append("interests", v));
      location.href = `complete.html?${params.toString()}`;
    } else {
      throw new Error(json.error || "unknown_error");
    }
  } catch (err) {
    msg.textContent = "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});
