// Apps Script Endpoint (index.html에서 주입)
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

const chkOther = document.getElementById("country_other_chk");
const inputOther = document.getElementById("country_other");

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

// 기타 입력 토글
if (chkOther && inputOther) {
  const syncOther = () => {
    if (chkOther.checked) {
      inputOther.classList.remove("hide");
      inputOther.disabled = false;
    } else {
      inputOther.classList.add("hide");
      inputOther.disabled = true;
      inputOther.value = "";
    }
  };
  syncOther();
  chkOther.addEventListener("change", syncOther);
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
    if (!name) { setStatus("err", "이름을 입력해 주세요."); form.name.focus(); return; }
    if (!company) { setStatus("err", "소속을 입력해 주세요."); form.company.focus(); return; }
    if (!email || !isValidEmail(email)) { setStatus("err", "올바른 이메일 주소를 입력해 주세요."); form.email.focus(); return; }

    // 관심국가 수집
    const checked = Array.from(form.querySelectorAll('input[name="countries"]:checked'))
      .map((el) => el.value);
    if (chkOther && chkOther.checked && inputOther && inputOther.value.trim()) {
      checked.push(inputOther.value.trim());
    }
    const countries = checked.join(", ");

    // 완료 페이지에서 보여줄 값(성공 때만 저장/이동)
    const receipt = { name, company, email, countries: checked };

    // 폼-인코딩으로 전송
    const payload = new URLSearchParams({ name, company, email, source: "github-pages", countries });

    try {
      setLoading(true);

      const res = await fetch(ENDPOINT, {
        method: "POST",
        // simple request 유지 (preflight 회피)
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
      });

      // ──────────────────────────────
      // 엄격한 성공 조건 (둘 중 하나라도 아니면 이동 금지)
      // 1) CORS로 응답을 읽을 수 있어야 함 (opaque면 읽을 수 없음)
      if (res.type === "opaque") {
        setStatus("err", "서버 응답을 확인하지 못했습니다(opaque). 잠시 후 다시 시도해 주세요.");
        return;
      }
      // 2) HTTP OK
      if (!res.ok) {
        setStatus("err", `전송 실패(HTTP ${res.status}). 잠시 후 다시 시도해 주세요.`);
        return;
      }
      // 3) JSON 파싱
      let data;
      try {
        data = await res.json();
      } catch (e) {
        setStatus("err", "서버 응답 형식(JSON)을 확인하지 못했습니다.");
        return;
      }
      // 4) 명시적 성공 플래그
      if (!data || data.success !== true) {
        setStatus("err", "구독 저장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      // ──────────────────────────────

      // ✅ 확실히 성공한 경우에만 이동
      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify(receipt));
      location.href = "./success.html";

    } catch (err) {
      console.error(err);
      setStatus("err", "네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  });
}
