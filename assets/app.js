// Endpoint
const ENDPOINT = window.OPPA_NEWSLETTER_ENDPOINT;

const form = document.getElementById("subscribe-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

// 인라인 에러
const errName = document.getElementById("err_name");
const errCompany = document.getElementById("err_company");
const errEmail = document.getElementById("err_email");
const clearErrors = () => { errName.textContent=""; errCompany.textContent=""; errEmail.textContent=""; };

// 칩 렌더 타깃
const chipsWrap = document.getElementById("countries_chips");
const otherPill = document.getElementById("chip_other_input");
const otherInput = document.getElementById("country_other");
const otherClear = document.getElementById("chip_other_clear");

// 중남미 전체(32개국) — 한글 표기
const LATAM = [
  "멕시코","과테말라","온두라스","엘살바도르","니카라과","코스타리카","파나마",
  "쿠바","도미니카공화국","아이티","자메이카","바베이도스","바하마","그레나다",
  "세인트루시아","세인트빈센트그레나딘","세인트키츠네비스","앤티가바부다","도미니카연방",
  "벨리즈",
  "콜롬비아","베네수엘라","에콰도르","페루","볼리비아","칠레","아르헨티나","파라과이","우루과이","브라질",
  "가이아나","수리남"
];

// 초기 한 화면 수납 + 점진적 더보기
const CHIP_CHUNK = 10; // 처음/추가 표시 개수
let shownCount = 0;
const selectedSet = new Set(); // 선택 상태 유지

function renderNextChunk(){
  const rest = LATAM.slice(shownCount, shownCount + CHIP_CHUNK);
  rest.forEach(name => chipsWrap.appendChild(makeChip(name, selectedSet.has(name))));
  shownCount += rest.length;

  // 더보기 버튼 업데이트/삽입
  updateMoreChip();
}

function makeChip(name, selected=false){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-opt";
  btn.dataset.value = name;
  btn.setAttribute("aria-pressed", selected ? "true" : "false");
  btn.textContent = name;

  btn.addEventListener("click", ()=>{
    const now = btn.getAttribute("aria-pressed")==="true";
    btn.setAttribute("aria-pressed", (!now).toString());
    if (now){ selectedSet.delete(name); }
    else { selectedSet.add(name); }
  });

  return btn;
}

let moreBtn = null;
function updateMoreChip(){
  const total = LATAM.length;
  // 더보기 칩 생성/갱신
  if (!moreBtn){
    moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "chip-opt chip-more";
    chipsWrap.appendChild(moreBtn);
    moreBtn.addEventListener("click", ()=>{
      // 다음 청크 렌더
      // 더 이상 없으면 버튼 제거
      const before = shownCount;
      renderNextChunk();
      if (shownCount >= total){
        moreBtn.remove();
        moreBtn = null;
        // ‘기타’ 칩 붙이기
        ensureOtherChip();
      }
    });
  }
  moreBtn.textContent = `더보기 (${Math.min(shownCount,total)}/${total})`;

  // 모든 칩을 다 보여줬다면 제거하고 기타 칩 노출
  if (shownCount >= total){
    moreBtn.remove();
    moreBtn = null;
    ensureOtherChip();
  }
}

let otherChip = null;
function ensureOtherChip(){
  if (otherChip) return;
  otherChip = document.createElement("button");
  otherChip.type = "button";
  otherChip.className = "chip-opt chip-other";
  otherChip.textContent = "기타";
  otherChip.addEventListener("click", ()=>{
    otherPill.classList.toggle("hide");
    if (!otherPill.classList.contains("hide")) otherInput.focus();
    else otherInput.value = "";
  });
  chipsWrap.appendChild(otherChip);
}

function bootstrapChips(){
  chipsWrap.innerHTML = "";
  shownCount = 0;
  renderNextChunk(); // 처음 CHUNK개
}
bootstrapChips();

otherClear?.addEventListener("click", ()=>{
  otherInput.value = "";
  otherPill.classList.add("hide");
});

// helpers
function setLoading(on){ submitBtn.disabled=on; submitBtn.textContent=on?"전송 중...":"구독하기"; }
function setStatus(type,msg){ statusEl.className=`status ${type||""}`; statusEl.textContent=msg||""; }
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// submit
if (form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearErrors(); setStatus("", "");

    if (form.company_hp?.value?.trim()) return; // 봇 차단

    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();

    let firstInvalid=null;
    if (!name){ errName.textContent="이름을 입력해 주세요."; firstInvalid ??= form.name; }
    if (!company){ errCompany.textContent="소속을 입력해 주세요."; firstInvalid ??= form.company; }
    if (!email){ errEmail.textContent="이메일을 입력해 주세요."; firstInvalid ??= form.email; }
    else if (!isValidEmail(email)){ errEmail.textContent="올바른 이메일 주소를 입력해 주세요."; firstInvalid ??= form.email; }
    if (firstInvalid){ firstInvalid.focus(); firstInvalid.scrollIntoView({behavior:"smooth",block:"center"}); return; }

    // 국가 선택 수집
    const selected = Array.from(chipsWrap.querySelectorAll('.chip-opt[aria-pressed="true"]'))
      .map(btn => btn.dataset.value);
    if (!otherPill.classList.contains("hide") && otherInput.value.trim()){
      selected.push(otherInput.value.trim());
    }
    const countriesStr = selected.join(", ");
    const receipt = { name, company, email, countries: selected };

    const payload = new URLSearchParams({ name, company, email, source: "github-pages", countries: countriesStr });

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
