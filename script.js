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

// 사용자 관리
let users = JSON.parse(localStorage.getItem('users')) || [];
let loggedInUser = localStorage.getItem('loggedInUser') || null;

function syncUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

function addUser() {
  const username = document.getElementById("new-username").value.trim();
  const password = document.getElementById("new-password").value.trim();

  if (!username || !password) {
    alert("사용자 이름과 비밀번호를 입력하세요.");
    return;
  }

  if (users.some(u => u.username === username)) {
    alert("이미 존재하는 사용자입니다.");
    return;
  }

  users.push({ username, password });
  syncUsers();
  alert("사용자가 추가되었습니다.");
  document.getElementById("new-username").value = "";
  document.getElementById("new-password").value = "";
  showUserManagement();
}

function deleteUser(username) {
  users = users.filter(u => u.username !== username);
  syncUsers();
  showUserManagement();
}

function showUserManagement() {
  const userList = document.getElementById("user-list");
  userList.innerHTML = users.map(user => `
    <li>${user.username}<button onclick="deleteUser('${user.username}')">삭제</button></li>
  `).join('');
  showScreen("user-management-screen");
}

function handleUserAuth() {
  if (loggedInUser) {
    loggedInUser = null;
    localStorage.removeItem('loggedInUser');
    alert("로그아웃 되었습니다.");
  } else {
    const username = prompt("사용자 이름을 입력하세요:");
    const password = prompt("비밀번호를 입력하세요:");

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      loggedInUser = username;
      localStorage.setItem('loggedInUser', username);
      alert("로그인 성공!");
    } else {
      alert("로그인 실패: 잘못된 계정 정보");
    }
  }
  updateAuthUI();
}

function updateAuthUI() {
  const authBtn = document.getElementById("auth-btn");
  const currentUserSpan = document.getElementById("current-user");
  if (loggedInUser) {
    currentUserSpan.textContent = loggedInUser;
    authBtn.textContent = "로그아웃";
  } else {
    currentUserSpan.textContent = "로그인 필요";
    authBtn.textContent = "로그인";
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

// 화면 전환 함수 수정 (CSS 충돌 해결)
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none'; // 기존 스타일 제거
  });
  const target = document.getElementById(screenId);
  target.classList.add('active');
  target.style.display = 'flex'; // CSS 클래스 대신 직접 flex 적용
}

// 품사 버튼에 이벤트 리스너 추가
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');
    startQuiz(category);
  });
});

// 퀴즈 로직
async function selectDifficulty(difficulty) {
  const files = { easy: 'vocab1.csv', normal: 'vocab2.csv', hard: 'vocab3.csv' };
  
  // 기존 단어 데이터 초기화
  Object.keys(wordData).forEach(key => {
    if (key !== 'stats') wordData[key] = []; // stats는 유지
  });

  await loadVocabFile(files[difficulty]);
  alert(`${difficulty} 난이도 로드 완료! (${wordData.mixed.length}개 단어)`);
}

function startQuiz(category) {
  console.log(`카테고리 선택됨: ${category}`); // 디버깅용 로그

  if (!wordData[category] || wordData[category].length === 0) {
    alert(`선택된 카테고리(${category})에 유효한 단어가 없습니다.`);
    return;
  }

  const filteredWords = wordData[category].filter(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    const daysDiff = (Date.now() - (stat.lastMastered || 0)) / (1000 * 60 * 60 * 24);
    return daysDiff > 7; // 7일 이상 지난 단어만 포함
  });

  if (filteredWords.length === 0) {
    alert(`선택된 카테고리(${category})에 유효한 단어가 없습니다.`);
    return;
  }

  totalQuestions = parseInt(document.getElementById("question-count").value) || 10;
  remainingQuestions = totalQuestions;
  masteredCount = 0;
  currentCategory = category;

  wordStats = getWeightedRandomElements(filteredWords, totalQuestions);

  console.log("출제할 문제 목록:", wordStats); // 디버깅용

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
  if (wordStats.length === 0 || remainingQuestions <= 0) {
    alert(`학습 완료! (마스터 단어: ${masteredCount}개)`);
    return goBack();
  }

  currentWord = wordStats.shift();
  console.log("출제 단어:", currentWord); // 디버깅용

  correctAnswer = currentWord.meaning;

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
  });

  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
}

function checkAnswer(selectedAnswer) {
  const isCorrect = selectedAnswer === correctAnswer;
  if (isCorrect) masteredCount++;
  remainingQuestions--;
  updateQuestionStatus();
  showNextWord();
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
