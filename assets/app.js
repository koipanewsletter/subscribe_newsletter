// Apps Script 도메인 (index.html에서 주입)
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

const chkOther = document.getElementById("country_other_chk");
const inputOther = document.getElementById("country_other");

// 기타 체크박스 토글 시 입력창 활성화/비활성
if (chkOther && inputOther) {
  const syncOther = () => {
    inputOther.disabled = !chkOther.checked;
    inputOther.classList.toggle("hide", !chkOther.checked);
    if (!chkOther.checked) inputOther.value = "";
  };
  syncOther();
  chkOther.addEventListener("change", syncOther);
}

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

    // 필수값 검증
    if (!name) {
      setStatus("err", "이름을 입력해 주세요.");
      form.name.focus();
      return;
    }
    if (!company) {
      setStatus("err", "소속을 입력해 주세요.");
      form.company.focus();
      return;
    }
    if (!email || !isValidEmail(email)) {
      setStatus("err", "올바른 이메일 주소를 입력해 주세요.");
      form.email.focus();
      return;
    }

    // 관심국가 수집
    const countriesChecked = Array
      .from(form.querySelectorAll('input[name="countries"]:checked'))
      .map((el) => el.value);

    // 기타 입력 포함
    if (chkOther && chkOther.checked && inputOther && inputOther.value.trim()) {
      countriesChecked.push(inputOther.value.trim());
    }

    const countries = countriesChecked.join(", ");

    // 서버 전송(폼-인코딩: CORS 프리플라이트 회피)
    const payload = new URLSearchParams({
      name,
      company,
      email,
      source: "github-pages",
      countries
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

      let ok = res.ok;
      try {
        const data = await res.json();
        ok = !!data?.success;
      } catch (_) { /* ignore */ }

      // 완료페이지에서 보여줄 값 저장
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify({
        name, company, email, countries: countriesChecked
      }));

      // 응답 상태와 무관하게 UX 유지
      location.href = "./success.html";
    } catch (err) {
      console.error(err);
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify({
        name, company, email, countries: countriesChecked
      }));
      location.href = "./success.html";
    } finally {
      setLoading(false);
    }
  });
}
