// Apps Script Endpoint
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");
const chkOther = document.getElementById("country_other_chk");
const inputOther = document.getElementById("country_other");

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

// 기타 항목 토글
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

    const hp = form.company_hp?.value?.trim();
    if (hp) return; // 봇 필터

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();

    if (!name) return setStatus("err", "이름을 입력해 주세요.");
    if (!company) return setStatus("err", "소속을 입력해 주세요.");
    if (!email || !isValidEmail(email)) return setStatus("err", "올바른 이메일 주소를 입력해 주세요.");

    const checked = Array.from(form.querySelectorAll('input[name="countries"]:checked')).map(el => el.value);
    if (chkOther && chkOther.checked && inputOther && inputOther.value.trim()) {
      checked.push(inputOther.value.trim());
    }
    const countries = checked.join(", ");
    const receipt = { name, company, email, countries: checked };

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

      // ✅ 성공일 때만 이동
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
