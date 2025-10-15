const ENDPOINT = window.NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

const errName = document.getElementById("err_name");
const errCompany = document.getElementById("err_company");
const errEmail = document.getElementById("err_email");
const errConsent = document.getElementById("err_consent");
const clearErrors = () => {
  errName.textContent = "";
  errCompany.textContent = "";
  errEmail.textContent = "";
  if (errConsent) errConsent.textContent = "";
};

const chipsWrap = document.getElementById("countries_chips");

const LATAM = [
  "멕시코","과테말라","온두라스","엘살바도르","니카라과","코스타리카","파나마",
  "쿠바","도미니카공화국","아이티","자메이카","바베이도스","바하마","그레나다",
  "세인트루시아","세인트빈센트그레나딘","세인트키츠네비스","앤티가바부다","도미니카연방",
  "벨리즈",
  "콜롬비아","베네수엘라","에콰도르","페루","볼리비아","칠레","아르헨티나","파라과이","우루과이","브라질",
  "가이아나","수리남",
  "기타"
];

const CHIP_CHUNK = 10;
let shownCount = 0;
const selectedSet = new Set();
let moreBtn = null;

function makeChip(name, selected=false){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-opt" + (name==="기타" ? " chip-other" : "");
  btn.dataset.value = name;
  btn.setAttribute("aria-pressed", selected ? "true" : "false");
  btn.textContent = name;

  btn.addEventListener("click", ()=>{
    if (name === "기타") return transformOther(btn);
    const now = btn.getAttribute("aria-pressed")==="true";
    btn.setAttribute("aria-pressed", (!now).toString());
    if (now){ selectedSet.delete(name); } else { selectedSet.add(name); }
  });
  return btn;
}

function transformOther(otherBtn){
  if (otherBtn.__replaced) return;

  const wrap = document.createElement("span");
  wrap.className = "chip-inline-wrap";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "국가명을 입력해 주세요.";
  input.setAttribute("aria-label","기타 국가 입력");
  input.inputMode = "text";

  const x = document.createElement("button");
  x.type = "button";
  x.className = "chip-clear";
  x.textContent = "×";

  wrap.appendChild(input);
  wrap.appendChild(x);

  const parent = otherBtn.parentNode;
  parent.insertBefore(wrap, otherBtn);
  parent.removeChild(otherBtn);
  otherBtn.__replaced = true;
  wrap.__origChip = otherBtn;

  input.focus();

  x.addEventListener("click", ()=>{
    parent.insertBefore(otherBtn, wrap);
    parent.removeChild(wrap);
    otherBtn.__replaced = false;
  });
}

function ensureMoreAtEnd(){
  if (!moreBtn){
    moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "chip-opt chip-more";
    moreBtn.addEventListener("click", renderNextChunk);
  }
  moreBtn.textContent = `더보기 (${Math.min(shownCount, LATAM.length)}/${LATAM.length})`;
  chipsWrap.appendChild(moreBtn);
}

function renderNextChunk(){
  const end = Math.min(shownCount + CHIP_CHUNK, LATAM.length);
  for (let i = shownCount; i < end; i++){
    const chip = makeChip(LATAM[i], selectedSet.has(LATAM[i]));
    chipsWrap.insertBefore(chip, moreBtn || null);
  }
  shownCount = end;

  if (shownCount >= LATAM.length){
    moreBtn?.remove();
    moreBtn = null;
  } else {
    ensureMoreAtEnd();
  }
}

function bootstrapChips(){
  chipsWrap.innerHTML = "";
  shownCount = 0;
  ensureMoreAtEnd();
  renderNextChunk();
}
bootstrapChips();

function setLoading(on){ submitBtn.disabled=on; submitBtn.textContent=on?"전송 중...":"구독하기"; }
function setStatus(type,msg){ statusEl.className=`status ${type||""}`; statusEl.textContent=msg||""; }
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

if (form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearErrors(); setStatus("", "");

    if (form.company_hp?.value?.trim()) return;

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();
    const consent = form.consent?.checked === true;

    let firstInvalid=null;
    if (!name){ errName.textContent="이름을 입력해 주세요."; firstInvalid ??= form.name; }
    if (!company){ errCompany.textContent="소속을 입력해 주세요."; firstInvalid ??= form.company; }
    if (!email){ errEmail.textContent="이메일을 입력해 주세요."; firstInvalid ??= form.email; }
    else if (!isValidEmail(email)){ errEmail.textContent="올바른 이메일 주소를 입력해 주세요."; firstInvalid ??= form.email; }
    if (!consent){
      if (errConsent) errConsent.textContent = "뉴스레터 안내를 위해 개인정보 수집·이용에 동의해 주세요.";
      firstInvalid ??= form.consent;
    }
    if (firstInvalid){ firstInvalid.focus(); firstInvalid.scrollIntoView({behavior:"smooth",block:"center"}); return; }

    const selected = Array.from(chipsWrap.querySelectorAll('.chip-opt[aria-pressed="true"]'))
      .map(btn => btn.dataset.value);

    const inline = chipsWrap.querySelector('.chip-inline-wrap input');
    if (inline && inline.value.trim()) selected.push(inline.value.trim());

    const countriesStr = selected.join(", ");
    const receipt = { name, company, email, countries: selected };

    const payload = new URLSearchParams({ name, company, email, source:"github-pages", countries: countriesStr });

    try{
      setLoading(true);
      const res = await fetch(ENDPOINT, {
        method:"POST",
        headers:{ "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" },
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
    }finally{ setLoading(false); }
  });
}
