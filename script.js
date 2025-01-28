let wordData = { 
  verb: [], 
  noun: [], 
  adjective: [], 
  adverb: [], 
  phrase: [], 
  mixed: [],
  stats: {}
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

// 공통 함수
function updateTotalWords() {
  const total = [...new Set([...wordData.verb, ...wordData.noun, ...wordData.adjective, ...wordData.adverb, ...wordData.phrase])].length;
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
  delete wordData.stats[targetWord];
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

// 퀴즈 로직
async function selectDifficulty(difficulty) {
  const files = { easy: 'vocab1.csv', normal: 'vocab2.csv', hard: 'vocab3.csv' };
  await loadVocabFile(files[difficulty]);
  alert(`${difficulty} 난이도 로드 완료! (${wordData.mixed.length}개 단어)`);
}

function startQuiz(category) {
  const filteredWords = wordData[category].filter(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    if (stat.lastMastered) {
      const daysDiff = (Date.now() - stat.lastMastered) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
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

  wordStats = [];
  while (wordStats.length < totalQuestions) {
    const remaining = totalQuestions - wordStats.length;
    const count = Math.min(remaining, filteredWords.length);
    const weightedWords = getWeightedRandomElements(filteredWords, count);
    wordStats.push(...weightedWords);
  }

  document.getElementById("category-title").textContent = `${category.toUpperCase()} 학습`;
  showScreen("quiz-screen");
  showNextWord();
}

function getWeightedRandomElements(array, n) {
  const weightedArray = array.map(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    const errorWeight = stat.errorCount ? stat.errorCount * 5 : 1;
    const correctRateWeight = stat.answerCount ? (1 - (stat.correctStreak / stat.answerCount)) : 1;
    const weight = errorWeight * correctRateWeight;
    return { ...wordObj, weight };
  });

  const totalWeight = weightedArray.reduce((sum, w) => sum + w.weight, 0);
  const selected = [];
  while (selected.length < n) {
    let random = Math.random() * totalWeight;
    for (const w of weightedArray) {
      random -= w.weight;
      if (random < 0) {
        selected.push(w);
        break;
      }
    }
  }
  return selected;
}

function showNextWord() {
  // 문제 출제 전 남은 단어 수 업데이트 ✅
  remainingQuestions = wordStats.length;
  updateProgress(); // 즉시 반영

  if (remainingQuestions <= 0 || wordStats.length === 0) {
    alert(`학습 완료! (마스터 단어: ${masteredCount}개)`);
    return goBack();
  }

  currentWord = wordStats.shift();
  correctAnswer = currentWord.meaning;
  updateWordDisplayBackground();

  const options = [correctAnswer];
  while (options.length < 4) {
    const randomWord = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)];
    if (randomWord && !options.includes(randomWord.meaning)) options.push(randomWord.meaning);
  }
  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = options.map(opt => `<div class="quiz-option">${opt}</div>`).join('');

  optionsContainer.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => checkAnswer(opt.textContent));
    opt.addEventListener('touchstart', () => checkAnswer(opt.textContent), { passive: true });
  });

  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
}

function updateWordDisplayBackground() {
  const wordDisplay = document.getElementById("word-display");
  const stat = wordData.stats[currentWord.word] || { errorCount: 0 };
  const errorCount = stat.errorCount || 0;
  const intensity = Math.min(errorCount / 10, 1);
  const redValue = Math.floor(255 * intensity);
  wordDisplay.style.backgroundColor = `rgba(${redValue}, ${255 - redValue}, ${255 - redValue}, 0.3)`;
}

function checkAnswer(selected) {
  const responseTime = Date.now() - startTime; // 타이머 중지 전 시간 측정
  const stat = wordData.stats[currentWord.word] || { correctStreak: 0, errorCount: 0, totalTime: 0, answerCount: 0 };

  if (selected === correctAnswer) {
    // 정답 처리 로직
    stopTimer(); // ✅ 정답 시에만 타이머 중지
    stat.correctStreak = (stat.correctStreak || 0) + 1;
    stat.totalTime += responseTime;
    stat.answerCount = (stat.answerCount || 0) + 1;

    if (stat.correctStreak >= 3) {
      stat.lastMastered = Date.now();
      masteredCount++;
    }

    if (stat.errorCount > 0) stat.errorCount--;

    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('correct');
        opt.style.pointerEvents = 'none';
      }
    });

    // 1초 후 다음 문제로 이동
    setTimeout(showNextWord, 1000);
  } else {
    // 오답 처리 로직 (타이머 유지)
    stat.correctStreak = 0;
    stat.errorCount = (stat.errorCount || 0) + 1;

    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('wrong');
        opt.style.pointerEvents = 'none';
      }
    });
    // ❌ 오답 시 타이머 중지 및 자동 진행 없음
  }

  stat.avgTime = stat.totalTime / (stat.answerCount || 1);
  wordData.stats[currentWord.word] = stat;
  updateProgress();
  updateWordDisplayBackground();
}

function updateProgress() {
  document.getElementById("progress").textContent = 
    `확실하게 외운 단어: ${masteredCount}개 / 남은 단어: ${remainingQuestions}개 / 전체 문제: ${totalQuestions}개`;
  // ❌ remainingQuestions-- 코드 완전 제거
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

// 타이머
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

// 초기화
window.onload = () => {
  loadVocabFile('vocab2.csv');
  showScreen("main-menu");
};


// 공유 버튼 클릭 시 실행
function shareResult() {
  navigator.share({
    title: '영어 단어 학습 결과',
    text: `마스터한 단어: ${masteredCount}개! 함께 도전해보세요!`,
    url: window.location.href
  });
}


function exportCSV() {
  const csvContent = "단어,의미,카테고리\n" + 
    wordData.mixed.map(w => `${w.word},${w.meaning},${w.category}`).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my_vocab.csv';
  a.click();
}


import jsPDF from 'jspdf';
function exportPDF() {
  const doc = new jsPDF();
  doc.text('나의 단어장', 10, 10);
  wordData.mixed.forEach((word, i) => {
    doc.text(`${word.word}: ${word.meaning}`, 10, 20 + (i * 10));
  });
  doc.save('my_vocab.pdf');
}