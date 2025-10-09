// Apps Script 도메인 (index.html에서 주입)
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

function setLoading(on) {
  if (!submitBtn) return;
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "전송 중..." : "구독하기";
}
function setStatus(type, msg) {
  if (!statusEl) return;
  statusEl.className = `status ${type || ""}`;
  statusEl.textContent = msg || "";
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    // 허니팟(봇 필터)
    const hp = form.company_hp?.value?.trim();
    if (hp) {
      setStatus("ok", "구독이 접수되었어요. 감사합니다!");
      form.reset();
      return;
    }

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();

    if (!email || !isValidEmail(email)) {
      setStatus("err", "올바른 이메일 주소를 입력해 주세요.");
      form.email.focus();
      return;
    }

    // 관심국가 수집(선택)
    const countries = Array.from(form.querySelectorAll('input[name="countries"]:checked'))
      .map((el) => el.value);

    // 서버 전송(폼-인코딩: CORS 프리플라이트 회피)
    const payload = new URLSearchParams({
      name,
      company,
      email,
      source: "github-pages",
      countries: countries.join(", ")
    });

    try {
      setLoading(true);

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: payload.toString(),
      });

      // 응답 JSON 시도 → 실패해도 시트에 저장됐을 수 있으니 성공 처리
      let ok = res.ok;
      try {
        const data = await res.json();
        ok = !!data?.success;
      } catch (_) { /* ignore */ }

      // 완료페이지에서 보여줄 값 저장
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify({
        name, company, email, countries
      }));

      if (ok) {
        location.href = "./success.html";
      } else {
        // CORS 등으로 파싱 실패 시에도 완료 화면으로 유도(사용자 체감 품질)
        location.href = "./success.html";
      }
    } catch (err) {
      console.error(err);
      // 네트워크/브라우저 제약 시에도 사용자 플로우 유지
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify({
        name, company, email, countries
      }));
      location.href = "./success.html";
    } finally {
      setLoading(false);
    }
  });
}
