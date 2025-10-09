// Apps Script Endpoint
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

// 에러 표시 헬퍼
const errName = document.getElementById("err_name");
const errCompany = document.getElementById("err_company");
const errEmail = document.getElementById("err_email");
function clearErrors(){ errName.textContent=""; errCompany.textContent=""; errEmail.textContent=""; }
function setFieldError(el, msg){ el.textContent = msg; }

// 관심국가 Chip 토글
const chipsWrap = document.getElementById("countries_chips");
const chipOther = document.getElementById("chip_other");
const otherWrap = document.getElementById("other_wrap");
const otherInput = document.getElementById("country_other");

if (chipsWrap) {
  chipsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip-opt");
    if (!btn) return;
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", (!pressed).toString());
    btn.classList.toggle("selected", !pressed);

    if (btn === chipOther) {
      if (!pressed) { // 선택됨
        otherWrap.classList.remove("hide");
        otherInput.focus();
      } else {
        otherWrap.classList.add("hide");
        otherInput.value = "";
      }
    }
  });
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "전송 중..." : "구독하기";
}
function setStatus(type, msg) {
  statusEl.className = `status ${type || ""}`;
  statusEl.textContent = msg || "";
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setStatus("", "");

    // 허니팟(봇 차단)
    const hp = form.company_hp?.value?.trim();
    if (hp) return;

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();

    // ✅ 필드 검증 + 첫 번째 에러 필드에 포커스(클릭 상태 유지)
    let invalid = false;
    let firstInvalidEl = null;

    if (!name) {
      setFieldError(errName, "이름을 입력해 주세요.");
      invalid = true;
      if (!firstInvalidEl) firstInvalidEl = form.name;
    }
    if (!company) {
      setFieldError(errCompany, "소속을 입력해 주세요.");
      invalid = true;
      if (!firstInvalidEl) firstInvalidEl = form.company;
    }
    if (!email) {
      setFieldError(errEmail, "이메일을 입력해 주세요.");
      invalid = true;
      if (!firstInvalidEl) firstInvalidEl = form.email;
    } else if (!isValidEmail(email)) {
      setFieldError(errEmail, "올바른 이메일 주소를 입력해 주세요.");
      invalid = true;
      if (!firstInvalidEl) firstInvalidEl = form.email;
    }

    if (invalid) {
      // 포커스 + 살짝 스크롤
      if (firstInvalidEl) {
        firstInvalidEl.focus({ preventScroll: false });
        firstInvalidEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // 선택된 chip 추출
    const selected = Array.from(chipsWrap.querySelectorAll('.chip-opt[aria-pressed="true"]'))
      .map(btn => btn.dataset.value);
    // 기타 내용 포함
    if (selected.includes("기타") && otherInput.value.trim()) {
      selected.push(otherInput.value.trim());
    }
    const countries = selected.filter(v => v !== "기타").join(", ");

    // 완료 페이지 표시용 데이터
    const receipt = { name, company, email, countries: selected.filter(v => v) };

    // 서버 전송
    const payload = new URLSearchParams({ name, company, email, source: "github-pages", countries });

    try {
      setLoading(true);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
      });

      if (res.type === "opaque" || !res.ok) {
        setStatus("err", "서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      let data;
      try { data = await res.json(); } catch { setStatus("err", "응답(JSON) 확인 실패"); return; }
      if (!data || data.success !== true) {
        setStatus("err", "구독 저장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      // 성공 시에만 완료 페이지로
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify(receipt));
      sessionStorage.setItem("oppa_newsletter_ok", "1");
      location.href = "./success.html";

    } catch (err) {
      console.error(err);
      setStatus("err", "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  });
}
