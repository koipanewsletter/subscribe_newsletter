// Apps Script Endpoint (index.html에서 주입)
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

const chkOther = document.getElementById("country_other_chk");
const inputOther = document.getElementById("country_other");

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
    if (!name) { setStatus("err", "이름을 입력해 주세요."); form.name.focus(); return; }
    if (!company) { setStatus("err", "소속을 입력해 주세요."); form.company.focus(); return; }
    if (!email || !isValidEmail(email)) { setStatus("err", "올바른 이메일 주소를 입력해 주세요."); form.email.focus(); return; }

    // 관심국가 수집
    const countriesChecked = Array
      .from(form.querySelectorAll('input[name="countries"]:checked'))
      .map((el) => el.value);

    if (chkOther && chkOther.checked && inputOther && inputOther.value.trim()) {
      countriesChecked.push(inputOther.value.trim());
    }
    const countries = countriesChecked.join(", ");

    // 완료 페이지에서 보여줄 값(미리 저장해두되, 리다이렉트는 성공 확인 후)
    const receipt = { name, company, email, countries: countriesChecked };

    // 서버 전송(폼-인코딩)
    const payload = new URLSearchParams({ name, company, email, source: "github-pages", countries });

    try {
      setLoading(true);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
      });

      // 1) 네트워크 레벨 체크
      if (!res.ok) {
        setStatus("err", "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      // 2) JSON 파싱 및 success 확인 (이 단계가 실패하면 리다이렉트하지 않음)
      let data;
      try {
        data = await res.json();
      } catch {
        setStatus("err", "서버 응답을 확인하지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      if (!data || !data.success) {
        setStatus("err", "구독 저장에 실패했습니다. 입력 내용을 확인 후 다시 시도해 주세요.");
        return;
      }

      // ✅ 여기까지 오면 확실히 저장된 것
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
