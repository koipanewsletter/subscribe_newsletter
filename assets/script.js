// Google Apps Script 웹 앱 URL 넣기
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxxxxxx/exec";

document.getElementById("subscribeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    company: form.company.value.trim(),
    email: form.email.value.trim(),
    consent: form.consent.checked,
    referer: document.referrer,
    userAgent: navigator.userAgent,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.ok) {
      // 완료 페이지로 이동 (파라미터 전달)
      const params = new URLSearchParams(data);
      window.location.href = `complete.html?${params.toString()}`;
    } else {
      alert("전송 중 문제가 발생했습니다. 다시 시도해주세요.");
      console.error(result.error);
    }
  } catch (err) {
    alert("서버 연결에 실패했습니다. 다시 시도해주세요.");
    console.error(err);
  }
});
