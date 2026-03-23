const regions = {
  kanto: [1, 151],
  johto: [152, 251],
  hoenn: [252, 386],
  sinnoh: [387, 493],
  unova: [494, 649],
  kalos: [650, 721],
  alola: [722, 809],
  galar: [810, 905],
  paldea: [906, 1025]
};

let quizData = {};
let currentQuiz = [];
let originalQuiz = [];
let currentIndex = 0;
let answers = [];
let currentRegion = "";
let isFinished = false;

/* 初期化 */
async function init() {
  const cached = localStorage.getItem("pokemonData");

  if (cached) {
    quizData = JSON.parse(cached);
    document.getElementById("loading").style.display = "none";
    return;
  }

  for (const r in regions) {
    const [s, e] = regions[r];
    quizData[r] = await loadPokemonRange(s, e);
  }

  localStorage.setItem("pokemonData", JSON.stringify(quizData));
  document.getElementById("loading").style.display = "none";
}

/* データ取得 */
async function loadPokemonRange(start, end) {
  const list = [];
  for (let i = start; i <= end; i++) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
    const data = await res.json();

    const res2 = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
    const data2 = await res2.json();
    const ja = data2.names.find(n => n.language.name === "ja");

    list.push({
      name: ja.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i}.png`
    });
  }
  return list;
}

/* 開始 */
function startQuiz(region) {
  currentRegion = region;
  originalQuiz = [...quizData[region]];
  currentQuiz = [...originalQuiz].sort(() => Math.random() - 0.5);

  answers = new Array(currentQuiz.length).fill(null);
  currentIndex = 0;
  isFinished = false;

  document.getElementById("quiz-area").style.display = "block";
  hideButtons();

  renderQuestion();
  renderNav();
}

/* 表示 */
function renderQuestion() {
  const data = currentQuiz[currentIndex];
  const input = document.getElementById("answer");

  document.getElementById("pokemon-image").src = data.image;
  input.value = "";
  input.focus();
}

/* 回答 */
function submitAnswer() {
  if (isFinished) return;

  const input = document.getElementById("answer").value.trim();
  const correct = currentQuiz[currentIndex].name;

  answers[currentIndex] = input === "" ? null : input === correct;

  renderNav();
  nextQuestion();
}

/* 次 */
function nextQuestion() {
  if (currentIndex < currentQuiz.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

/* 終了 */
function finishQuiz() {
  if (!confirm("終了して採点する？")) return;

  isFinished = true;
  showResult();
  renderNav();

  document.getElementById("retry-wrong-btn").style.display = "block";
  document.getElementById("restart-btn").style.display = "block";
}

/* ナビ */
function renderNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";

  answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.innerText = i + 1;

    if (isFinished) {
      btn.className = ans === true ? "correct" : "wrong";
    } else {
      btn.className = ans === null ? "unanswered" : "correct";
    }

    btn.onclick = () => {
      currentIndex = i;
      renderQuestion();
    };

    nav.appendChild(btn);
  });
}

/* 結果 */
function showResult() {
  const correct = answers.filter(a => a === true).length;
  const rate = Math.round((correct / answers.length) * 100);

  document.getElementById("result").innerText =
    `正答率: ${rate}% (${correct}/${answers.length})`;
}

/* リトライ */
function retryWrong() {
  const wrong = currentQuiz.filter((_, i) => answers[i] !== true);

  if (wrong.length === 0) {
    alert("全問正解してるよ～！");
    return;
  }

  currentQuiz = [...wrong].sort(() => Math.random() - 0.5);
  answers = new Array(currentQuiz.length).fill(null);
  currentIndex = 0;
  isFinished = false;

  hideButtons();
  renderQuestion();
  renderNav();
}

/* リスタート */
function restartQuiz() {
  startQuiz(currentRegion);
}

/* ボタン制御 */
function hideButtons() {
  document.getElementById("retry-wrong-btn").style.display = "none";
  document.getElementById("restart-btn").style.display = "none";
}

/* 起動 */
window.addEventListener("DOMContentLoaded", () => {
  init();

  document.getElementById("answer").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  });
});
