let wordData = { verb: [], noun: [], adjective: [], adverb: [], phrase: [], mixed: [] };
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
  updateWordList();
  updateTotalWords();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

async function selectDifficulty(difficulty) {
  const files = { easy: 'vocab1.csv', normal: 'vocab2.csv', hard: 'vocab3.csv' };
  await loadVocabFile(files[difficulty]);
  alert(`${difficulty} 난이도 로드 완료! (${wordData.mixed.length}개 단어)`);
}

function startQuiz(category) {
  totalQuestions = parseInt(document.getElementById("question-count").value);
  remainingQuestions = totalQuestions;
  masteredCount = 0;
  currentCategory = category;
  
  const pool = [...wordData[category]];
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
  
  currentWord = wordStats.shift();
  correctAnswer = currentWord.meaning;
  
  const options = [correctAnswer];
  while (options.length < 4) {
    const random = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;
    if (!options.includes(random)) options.push(random);
  }
  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = options.map(opt => `
    <div class="quiz-option" onclick="checkAnswer('${opt}')">${opt}</div>
  `).join('');
  
  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
}

function checkAnswer(selected) {
  stopTimer();
  
  if (selected === correctAnswer) {
    masteredCount++;
    remainingQuestions--;
    updateProgress();
    showNextWord();
  } else {
    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('wrong');
        setTimeout(() => opt.remove(), 1000);
      }
    });
    alert("틀렸습니다! 다른 선택지를 고르세요.");
  }
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
}

window.onload = () => {
  loadVocabFile('vocab1.csv');
  showScreen("main-menu");
};