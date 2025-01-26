let wordData = { 
  verb: [], 
  noun: [], 
  adjective: [], 
  adverb: [], 
  phrase: [], 
  mixed: [],
  stats: {} // 단어별 통계 저장 객체 추가
};

let wordStats = [];
let currentCategory = null;
let currentWord = null;
let correctAnswer = null;
let startTime = null;
let timerInterval = null;
let totalQuestions = 10;
let remainingQuestions = 0;
let masteredCount = 0;
let masteredWords = {};

function updateTotalWords() {
  let total = [...new Set([...wordData.verb, ...wordData.noun, ...wordData.adjective, ...wordData.adverb, ...wordData.phrase])].length;
  document.getElementById("total-words").innerText = `전체 단어: ${total}개`;
}

function addWord() {
  const word = document.getElementById("new-word").value.trim();
  const meaning = document.getElementById("new-meaning").value.trim();
  const category = document.getElementById("new-category").value;
  
  if (word && meaning && category && !isWordDuplicate(word)) {
    wordData[category].push({ word, meaning });
    if (category !== 'mixed') wordData.mixed.push({ word, meaning });
    document.getElementById("new-word").value = "";
    document.getElementById("new-meaning").value = "";
    updateWordList();
    updateTotalWords();
  } else {
    alert("입력 오류 또는 중복 단어");
  }
}

async function uploadFile() {
  const file = document.getElementById("file-input").files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split("\n");
    lines.slice(1).forEach(line => {
      const [word, meaning, category] = line.split(",").map(s => s.trim());
      if (word && meaning && category && !isWordDuplicate(word)) {
        wordData[category].push({ word, meaning });
        if (category !== 'mixed') wordData.mixed.push({ word, meaning });
      }
    });
    updateWordList();
    updateTotalWords();
  };
  reader.readAsText(file);
}

function isWordDuplicate(word) {
  return Object.values(wordData).flat().some(item => item.word === word);
}

function updateWordList() {
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";
  const uniqueWords = [...new Set(wordData.mixed.map(w => w.word))];
  uniqueWords.forEach(word => {
    const li = document.createElement("li");
    li.textContent = `${word}: ${wordData.mixed.find(w => w.word === word).meaning}`;
    const btn = document.createElement("button");
    btn.textContent = "삭제";
    btn.onclick = () => deleteWord(word);
    li.appendChild(btn);
    wordList.appendChild(li);
  });
}

function deleteWord(targetWord) {
  Object.keys(wordData).forEach(cat => {
    wordData[cat] = wordData[cat].filter(w => w.word !== targetWord);
  });
  delete wordData.stats[targetWord]; // 통계 데이터도 삭제
  updateWordList();
  updateTotalWords();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(screenId);
  target.classList.add('active');
  target.style.display = 'block';
}

async function selectDifficulty(difficulty) {
  const files = { easy: 'vocab1.csv', normal: 'vocab2.csv', hard: 'vocab3.csv' };
  await loadVocabFile(files[difficulty]);
  alert(`${difficulty} 난이도 로드 완료! (${wordData.mixed.length}개 단어)`);
}

function startQuiz(category) {
  // 마스터 단어 필터링 (1주일 이내)
  const filteredWords = wordData[category].filter(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    if(stat.lastMastered) {
      const daysDiff = (Date.now() - stat.lastMastered) / (1000*60*60*24);
      return daysDiff > 7; // 1주일 지난 경우만 포함
    }
    return true;
  });

  if (filteredWords.length === 0) {
    alert(`선택된 카테고리(${category})에 유효한 단어가 없습니다.`);
    return;
  }

  totalQuestions = parseInt(document.getElementById("question-count").value);
  remainingQuestions = totalQuestions;
  masteredCount = 0;
  currentCategory = category;
  
  const pool = [...filteredWords];
  wordStats = Array.from({length: Math.min(totalQuestions, pool.length)}, () => {
    const idx = Math.floor(Math.random() * pool.length);
    return pool.splice(idx, 1)[0];
  });
  
  document.getElementById("category-title").textContent = `${category.toUpperCase()} 학습`;
  showScreen("quiz-screen");
  showNextWord();
}

function showNextWord() {
  if (wordStats.length === 0 || remainingQuestions <= 0) {
    alert(`학습 완료! (마스터 단어: ${masteredCount}개)`);
    return goBack();
  }

  // 응답 시간과 오답률 가중치 적용 선택 알고리즘
  const weightedPool = wordStats.map(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    const timeWeight = stat.avgTime ? Math.log(stat.avgTime / 1000 + 1) : 1;
    const errorWeight = stat.errorCount ? stat.errorCount * 3 : 1; // 오답률 가중치 증가 (3배)
    return { ...wordObj, weight: timeWeight * errorWeight };
  });

  // 가중치 기반 랜덤 선택
  const totalWeight = weightedPool.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedWord;
  for (const w of weightedPool) {
    random -= w.weight;
    if (random < 0) {
      selectedWord = w;
      break;
    }
  }

  currentWord = selectedWord;
  wordStats = wordStats.filter(w => w.word !== selectedWord.word); // 선택된 단어 제거

  correctAnswer = currentWord.meaning;

  const options = [correctAnswer];
  while (options.length < 4) {
    const random = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;
    if (!options.includes(random)) options.push(random);
  }
  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = options
    .map(opt => `<div class="quiz-option">${opt}</div>`)
    .join('');

  // 터치 이벤트 리스너 추가 (모바일 대응)
  optionsContainer.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => checkAnswer(opt.textContent));
    opt.addEventListener('touchstart', () => checkAnswer(opt.textContent), { passive: true });
  });

  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
}

function checkAnswer(selected) {
  stopTimer();
  const responseTime = Date.now() - startTime;
  const stat = wordData.stats[currentWord.word] || {
    correctStreak: 0,
    errorCount: 0,
    totalTime: 0,
    answerCount: 0
  };

  if (selected === correctAnswer) {
    stat.correctStreak++;
    stat.totalTime += responseTime;
    stat.answerCount++;

    if (stat.correctStreak >= 3) { // 3회 연속 정답시 마스터 처리
      stat.lastMastered = Date.now();
      masteredCount++;
    }

    // 정답자 옵션만 색상 변경
    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('correct');
        opt.style.pointerEvents = 'none'; // 비활성화
      }
    });

    setTimeout(() => {
      showNextWord();
    }, 1000);
  } else {
    stat.correctStreak = 0;
    stat.errorCount++;

    // 오답 옵션만 비활성화
    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('wrong');
        opt.style.pointerEvents = 'none';
      }
    });
  }

  // 통계 업데이트
  stat.avgTime = stat.totalTime / stat.answerCount;
  wordData.stats[currentWord.word] = stat;
  updateProgress();
}

function updateProgress() {
  document.getElementById("progress").textContent = 
    `확실하게 외운 단어: ${masteredCount}개 / 남은 단어: ${remainingQuestions}개 / 전체 문제: ${totalQuestions}개`;
}

async function loadVocabFile(filename) {
  Object.keys(wordData).forEach(k => wordData[k] = []);
  const response = await fetch(filename);
  const text = await response.text();
  text.split("\n").slice(1).forEach(line => {
    const [word, meaning, category] = line.split(",").map(s => s.trim());
    if (word && meaning && category) {
      wordData[category].push({ word, meaning });
      if (category !== 'mixed') wordData.mixed.push({ word, meaning });
    }
  });
  updateTotalWords();
  updateWordList();
}

function showManageScreen() {
  showScreen("manage-screen");
  updateWordList();
}

function goBack() {
  showScreen("main-menu");
}

// 타이머 관련 함수
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").textContent = `시간: ${elapsed}초`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

window.onload = () => {
  loadVocabFile('vocab2.csv');
  showScreen("main-menu");
};