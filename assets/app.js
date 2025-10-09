// Apps Script Endpoint
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

// Errors
const errName = document.getElementById("err_name");
const errCompany = document.getElementById("err_company");
const errEmail = document.getElementById("err_email");
const clearErrors = () => { errName.textContent=""; errCompany.textContent=""; errEmail.textContent=""; };

// Countries data (LATAM 20)
const COUNTRIES = [
  "멕시코","과테말라","온두라스","엘살바도르","니카라과","코스타리카","파나마",
  "쿠바","도미니카공화국","아이티",
  "콜롬비아","베네수엘라","에콰도르","페루","볼리비아","칠레","아르헨티나","파라과이","우루과이","브라질"
];

// Desktop select
const selectEl = document.getElementById("countries_select");
// Mobile modal
const openBtn  = document.getElementById("countries_open");
const modal    = document.getElementById("countries_modal");
const checksEl = document.getElementById("countries_checks");
const applyBtn = document.getElementById("countries_apply");
const clearBtn = document.getElementById("countries_clear");
const badgeEl  = document.getElementById("countries_badge");
const otherInput = document.getElementById("country_other");

// Render options/checkboxes
function renderCountries(){
  if (selectEl) {
    selectEl.innerHTML = COUNTRIES.map(c => `<option value="${c}">${c}</option>`).join("");
  }
  if (checksEl) {
    checksEl.innerHTML = COUNTRIES.map((c,i)=>(
      `<label><input type="checkbox" value="${c}" /> ${c}</label>`
    )).join("");
  }
}
renderCountries();

function setLoading(on){ submitBtn.disabled=on; submitBtn.textContent=on?"전송 중...":"구독하기"; }
function setStatus(type,msg){ statusEl.className=`status ${type||""}`; statusEl.textContent=msg||""; }
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Mobile modal helpers
function openModal(){ modal.classList.remove("hide"); document.body.style.overflow="hidden"; }
function closeModal(){ modal.classList.add("hide"); document.body.style.overflow=""; }
modal?.addEventListener("click",(e)=>{ if (e.target.hasAttribute("data-close")) closeModal(); });
modal?.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",closeModal));
openBtn?.addEventListener("click",openModal);

applyBtn?.addEventListener("click", ()=>{
  const count = modalSelected().length + (otherInput.value.trim()? 1 : 0);
  badgeEl.textContent = String(count);
  closeModal();
});
clearBtn?.addEventListener("click", ()=>{
  checksEl.querySelectorAll('input[type="checkbox"]').forEach(ch => ch.checked=false);
  otherInput.value="";
  badgeEl.textContent = "0";
});

function modalSelected(){
  return Array.from(checksEl.querySelectorAll('input[type="checkbox"]:checked')).map(ch=>ch.value);
}

// Submission
if (form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearErrors();
    setStatus("", "");

    // Honeypot
    if (form.company_hp?.value?.trim()) return;

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();

    // Validate + focus first invalid
    let firstInvalid = null;
    if (!name){ errName.textContent="이름을 입력해 주세요."; firstInvalid ??= form.name; }
    if (!company){ errCompany.textContent="소속을 입력해 주세요."; firstInvalid ??= form.company; }
    if (!email){ errEmail.textContent="이메일을 입력해 주세요."; firstInvalid ??= form.email; }
    else if (!isValidEmail(email)){ errEmail.textContent="올바른 이메일 주소를 입력해 주세요."; firstInvalid ??= form.email; }
    if (firstInvalid){ firstInvalid.focus({preventScroll:false}); firstInvalid.scrollIntoView({behavior:"smooth",block:"center"}); return; }

    // Collect countries (responsive)
    let selected = [];
    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    if (isMobile) {
      selected = modalSelected();
    } else {
      selected = Array.from(selectEl?.selectedOptions || []).map(o=>o.value);
    }
    const extra = otherInput?.value.trim();
    if (extra) selected.push(extra);

    const countriesStr = selected.join(", ");
    const receipt = { name, company, email, countries: selected };

    // Send
    const payload = new URLSearchParams({ name, company, email, source:"github-pages", countries: countriesStr });

    try{
      setLoading(true);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
      });

      if (res.type==="opaque" || !res.ok){ setStatus("err","서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
      let data; try{ data = await res.json(); }catch{ setStatus("err","응답(JSON) 확인 실패"); return; }
      if (!data || data.success!==true){ setStatus("err","구독 저장에 실패했습니다. 다시 시도해 주세요."); return; }

      sessionStorage.setItem("oppa_newsletter_last", JSON.stringify(receipt));
      sessionStorage.setItem("oppa_newsletter_ok", "1");
      location.href = "./success.html";
    }catch(err){
      console.error(err);
      setStatus("err","네트워크 오류가 발생했습니다.");
    }finally{
      setLoading(false);
    }
  });
}
