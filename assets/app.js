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

// LATAM(‘기타’ 포함, 원하는 위치에 배치)
const LATAM = [
  "멕시코","과테말라","온두라스","엘살바도르","니카라과","코스타리카","파나마",
  "쿠바","도미니카공화국","아이티","자메이카","바베이도스","바하마","그레나다",
  "세인트루시아","세인트빈센트그레나딘","세인트키츠네비스","앤티가바부다","도미니카연방",
  "벨리즈",
  "콜롬비아","베네수엘라","에콰도르","페루","볼리비아","칠레","아르헨티나","파라과이","우루과이","브라질",
  "가이아나","수리남",
  "기타" // ← 이 칩이 클릭되면 그 자리에서 input으로 변신
];

// 초기 한 화면 수납 + 점진적 더보기
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
    if (name === "기타") return transformOther(btn); // 변신

    const now = btn.getAttribute("aria-pressed")==="true";
    btn.setAttribute("aria-pressed", (!now).toString());
    if (now){ selectedSet.delete(name); }
    else { selectedSet.add(name); }
  });

  return btn;
}

function transformOther(otherBtn){
  // 이미 변신 상태면 무시
  if (otherBtn.__replaced) return;

  const wrap = document.createElement("span");
  wrap.className = "chip-inline-wrap";
  // 입력
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "국가명을 입력해 주세요.";
  input.setAttribute("aria-label","기타 국가 입력");
  // X 버튼
  const x = document.createElement("button");
  x.type = "button";
  x.className = "chip-clear";
  x.textContent = "×";

  wrap.appendChild(input);
  wrap.appendChild(x);

  // DOM 교체 (같은 위치 유지)
  const parent = otherBtn.parentNode;
  parent.insertBefore(wrap, otherBtn);
  parent.removeChild(otherBtn);
  otherBtn.__replaced = true; // 플래그
  wrap.__origChip = otherBtn; // 복원용
  input.focus();

  // 복원 로직
  x.addEventListener("click", ()=>{
    // 값이 있어도 전송 요구 없음 → 단순 복구
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
  // 항상 맨 끝에 배치
  moreBtn.textContent = `더보기 (${Math.min(shownCount, LATAM.length)}/${LATAM.length})`;
  chipsWrap.appendChild(moreBtn);
}

function renderNextChunk(){
  const end = Math.min(shownCount + CHIP_CHUNK, LATAM.length);
  for (let i = shownCount; i < end; i++){
    // 더보기 버튼 앞에 칩을 삽입하여 항상 more가 끝으로
    const chip = makeChip(LATAM[i], selectedSet.has(LATAM[i]));
    chipsWrap.insertBefore(chip, moreBtn || null);
  }
  shownCount = end;

  if (shownCount >= LATAM.length){
    // 모두 노출되면 more 제거
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
  renderNextChunk(); // 첫 청크
}
bootstrapChips();

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

    // 선택된 칩 수집
    const selected = Array.from(chipsWrap.querySelectorAll('.chip-opt[aria-pressed="true"]'))
      .map(btn => btn.dataset.value);

    // ‘기타’ 인라인 입력 값이 있다면 추가
    const inline = chipsWrap.querySelector('.chip-inline-wrap input');
    if (inline && inline.value.trim()){
      selected.push(inline.value.trim());
    }

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
