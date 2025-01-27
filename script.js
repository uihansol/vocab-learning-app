let wordData = { 
  verb: [], 
  noun: [], 
  adjective: [], 
  adverb: [], 
  phrase: [], 
  mixed: [],
  stats: {},
  settings: {
    errorWeight: 5,
    freshnessWeight: 2,
    cooldownDays: 7
  }
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

// 사용자 관리 함수 추가
async function showUserManagement() {
  const response = await fetch('users.json');
  const users = await response.json();
  const userList = document.getElementById("user-list");
  userList.innerHTML = users.map(user => `
    <li>
      ${user.username}
      <button onclick="deleteUser('${user.username}')">삭제</button>
    </li>
  `).join('');
  showScreen("user-management-screen");
}

async function addUser() {
  const username = document.getElementById("new-username").value.trim();
  const password = document.getElementById("new-password").value.trim();

  if (!username || !password) {
    alert("사용자 이름과 비밀번호를 입력하세요.");
    return;
  }

  const response = await fetch('users.json');
  const users = await response.json();

  if (users.some(user => user.username === username)) {
    alert("이미 존재하는 사용자 이름입니다.");
    return;
  }

  users.push({ username, password });
  await fetch('users.json', {
    method: 'PUT',
    body: JSON.stringify(users),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  alert("사용자가 추가되었습니다.");
  showUserManagement();
}

async function deleteUser(username) {
  const response = await fetch('users.json');
  const users = await response.json();
  const updatedUsers = users.filter(user => user.username !== username);

  await fetch('users.json', {
    method: 'PUT',
    body: JSON.stringify(updatedUsers),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  alert("사용자가 삭제되었습니다.");
  showUserManagement();
}


// 로그인 및 로그아웃
async function handleUserAuth() {
  const authBtn = document.getElementById("auth-btn");
  if (authBtn.textContent === "로그아웃") {
    document.getElementById("current-user").textContent = "로그인 필요";
    authBtn.textContent = "로그인";
    document.getElementById("stats-btn").classList.add("hidden");
    alert("로그아웃 되었습니다.");
  } else {
    const username = prompt("사용자 이름을 입력하세요:");
    const password = prompt("비밀번호를 입력하세요:");

    try {
      const response = await fetch('users.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const users = await response.json();

      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        alert("로그인 성공!");
        document.getElementById("current-user").textContent = username;
        authBtn.textContent = "로그아웃";
        document.getElementById("stats-btn").classList.remove("hidden");
      } else {
        alert("로그인 실패: 사용자 이름 또는 비밀번호가 잘못되었습니다.");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert("로그인 중 오류가 발생했습니다. 나중에 다시 시도해주세요.");
    }
  }
}

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
    const header = lines[0].split(',').map(s => s.trim());

    lines.slice(1).forEach(line => {
      const values = line.split(",").map(s => s.trim());
      const [word, meaning, category] = values.slice(0, 3);
      const stats = {
        errorCount: parseInt(values[3]) || 0,
        correctStreak: parseInt(values[4]) || 0,
        lastMastered: values[5] ? new Date(values[5]).getTime() : null
      };

      if (word && !isWordDuplicate(word)) {
        wordData[category].push({ word, meaning });
        wordData.stats[word] = stats;
      }
    });
    updateWordList();
    updateTotalWords();
    alert("CSV 파일 업로드 완료!");
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
    if (Array.isArray(wordData[cat])) {
      wordData[cat] = wordData[cat].filter(w => w.word !== targetWord);
    }
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
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  } else {
    console.error(`Screen with id ${screenId} not found`);
  }
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
    return !stat.lastMastered || 
      (Date.now() - stat.lastMastered) > wordData.settings.cooldownDays * 24 * 60 * 60 * 1000;
  });

  if (filteredWords.length === 0) {
    alert(`선택된 카테고리(${category})에 유효한 단어가 없습니다.`);
    return;
  }

  totalQuestions = parseInt(document.getElementById("question-count").value);
  remainingQuestions = totalQuestions;
  masteredCount = 0;
  currentCategory = category;

  wordStats = getWeightedRandomElements(filteredWords, totalQuestions);
  
  showScreen("quiz-screen");
  showNextWord();
}

function getWeightedRandomElements(array, n) {
  const now = Date.now();
  const {errorWeight, freshnessWeight} = wordData.settings;

  const weightedArray = array
    .map(wordObj => {
      const stat = wordData.stats[wordObj.word] || {};
      const timeDecay = stat.lastError ? 
        freshnessWeight * (now - stat.lastError)/1000/60/60 : 1;
      return {
        ...wordObj,
        weight: (stat.errorCount || 0) * errorWeight * timeDecay + 1
      };
    })
    .sort((a, b) => b.weight - a.weight);

  return weightedArray.slice(0, n);
}

function showNextWord() {
  if (wordStats.length === 0 || remainingQuestions <= 0) {
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
  optionsContainer.innerHTML = options.map(opt => 
    `<div class="quiz-option">${opt}</div>`
  ).join('');

  optionsContainer.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => checkAnswer(opt.textContent));
  });

  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
  updateProgress();
}

function updateWordDisplayBackground() {
  const wordDisplay = document.getElementById("word-display");
  const stat = wordData.stats[currentWord.word] || { errorCount: 0 };
  const redValue = Math.min(stat.errorCount * 25, 255);
  wordDisplay.style.backgroundColor = `rgba(${redValue}, ${255 - redValue}, ${255 - redValue}, 0.3)`;
}

function checkAnswer(selected) {
  stopTimer();
  const responseTime = Date.now() - startTime;
  const stat = wordData.stats[currentWord.word] || { 
    correctStreak: 0, 
    errorCount: 0, 
    totalTime: 0, 
    answerCount: 0,
    lastError: null
  };

  if (selected === correctAnswer) {
    stat.correctStreak++;
    stat.totalTime += responseTime;
    stat.answerCount++;

    if (stat.correctStreak >= 3) {
      stat.lastMastered = Date.now();
      masteredCount++;
    }

    if (stat.errorCount > 0) stat.errorCount--;
    highlightOption(selected, 'correct');
    setTimeout(showNextWord, 1000);
  } else {
    stat.correctStreak = 0;
    stat.errorCount++;
    stat.lastError = Date.now();
    highlightOption(selected, 'wrong');
  }

  stat.avgTime = stat.totalTime / stat.answerCount;
  wordData.stats[currentWord.word] = stat;
  updateProgress();
}

function highlightOption(selected, className) {
  document.querySelectorAll('.quiz-option').forEach(opt => {
    if (opt.textContent === selected) {
      opt.classList.add(className);
      opt.style.pointerEvents = 'none';
    }
    if (opt.textContent === correctAnswer) {
      opt.classList.add('correct');
    }
  });
}

function updateProgress() {
  document.getElementById("progress").textContent = 
    `확실하게 외운 단어: ${masteredCount}개 / 남은 단어: ${--remainingQuestions}개 / 전체 문제: ${totalQuestions}개`;
}

async function loadVocabFile(filename) {
  Object.keys(wordData).forEach(k => wordData[k] = []);
  const response = await fetch(filename);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
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
// 통계 및 설정 함수
function showWordStats() {
  const statsList = document.getElementById("stats-list");
  statsList.innerHTML = Object.entries(wordData.stats)
    .sort((a,b) => b[1].errorCount - a[1].errorCount)
    .map(([word, stat]) => `
      <li class="stat-item">
        <span>${word}</span>
        <div class="stat-bar">
          <div class="error-bar" style="width:${Math.min(stat.errorCount*10, 100)}%">
            오답: ${stat.errorCount}
          </div>
          <div class="correct-bar" style="width:${Math.min(stat.correctStreak*30, 100)}%">
            연속정답: ${stat.correctStreak}
          </div>
        </div>
        <button onclick="deleteWord('${word}')">삭제</button>
      </li>
    `).join('');
  showScreen("stats-screen");
}

function updateQuizSettings() {
  wordData.settings.errorWeight = parseInt(document.getElementById("error-weight").value);
  wordData.settings.freshnessWeight = parseFloat(document.getElementById("freshness-weight").value);
  wordData.settings.cooldownDays = parseInt(document.getElementById("cooldown-days").value);
  alert("퀴즈 설정이 업데이트 되었습니다!");
}

function exportCSV() {
  const lines = ['word,meaning,category,errorCount,correctStreak,lastMastered'];
  Object.entries(wordData.stats).forEach(([word, stat]) => {
    const entry = wordData.mixed.find(w => w.word === word);
    if(entry) {
      const date = stat.lastMastered ? new Date(stat.lastMastered).toISOString() : '';
      lines.push(
        [word, entry.meaning, entry.category, stat.errorCount, stat.correctStreak, date].join(',')
      );
    }
  });
  
  const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'wordmaster_export.csv';
  link.click();
}

// 기타 함수
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
  loadVocabFile('vocab2.csv').then(() => {
    showScreen("main-menu");
  }).catch(() => {
    alert("단어 파일을 로드하는 데 실패했습니다.");
    showScreen("main-menu");
  });
};