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

// localStorage 기반 사용자 관리
let users = JSON.parse(localStorage.getItem('users')) || [
  {username: "user1", password: "password1"},
  {username: "user2", password: "password2"}
];

function syncUsers() {
  localStorage.setItem('users', JSON.stringify(users));
  showUserManagement();
}

// 사용자 인증 처리 (서버 연동 제거)
async function handleUserAuth() {
  const authBtn = document.getElementById("auth-btn");
  if (authBtn.textContent === "로그아웃") {
    document.getElementById("current-user").textContent = "로그인 필요";
    authBtn.textContent = "로그인";
    document.getElementById("stats-btn").classList.add("hidden");
    document.getElementById("user-management-btn").classList.add("hidden");
    localStorage.removeItem('loggedInUser');
    alert("로그아웃 되었습니다.");
  } else {
    const username = prompt("사용자 이름을 입력하세요:");
    const password = prompt("비밀번호를 입력하세요:");

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      alert("로그인 성공!");
      document.getElementById("current-user").textContent = username;
      authBtn.textContent = "로그아웃";
      document.getElementById("stats-btn").classList.remove("hidden");
      document.getElementById("user-management-btn").classList.remove("hidden");
      localStorage.setItem('loggedInUser', username);
    } else {
      alert("로그인 실패: 잘못된 계정 정보");
    }
  }
}

// 사용자 관리 화면 (서버 연동 제거)
function showUserManagement() {
  const userList = document.getElementById("user-list");
  userList.innerHTML = users.map(user => `
    <li>${user.username}<button onclick="deleteUser('${user.username}')">삭제</button></li>
  `).join('');
  showScreen("user-management-screen");
}

function deleteUser(target) {
  users = users.filter(u => u.username !== target);
  syncUsers();
}

function addUser() {
  const username = document.getElementById("new-username").value.trim();
  const password = document.getElementById("new-password").value.trim();
  
  if(!username || !password) return alert("빈 칸을 채워주세요");
  if(users.some(u => u.username === username)) return alert("이미 존재하는 사용자");
  
  users.push({username, password});
  syncUsers();
  document.getElementById("new-username").value = "";
  document.getElementById("new-password").value = "";
}

// 초기화 시 로그인 상태 확인
window.onload = () => {
  const savedUser = localStorage.getItem('loggedInUser');
  if(savedUser) {
    document.getElementById("current-user").textContent = savedUser;
    document.getElementById("auth-btn").textContent = "로그아웃";
    document.getElementById("stats-btn").classList.remove("hidden");
    document.getElementById("user-management-btn").classList.remove("hidden");
  }
  
  loadVocabFile('vocab1.csv').then(() => {
    showScreen("main-menu");
  }).catch(() => alert("단어장 불러오기 실패"));
};

// 난이도 선택 핸들러
function selectDifficulty(level) {
  const filename = `vocab${level === 'easy' ? '1' : level === 'normal' ? '2' : '3'}.csv`;
  loadVocabFile(filename).then(() => {
    alert(`[${level}] 난이도 단어장 로드 완료`);
    showScreen("main-menu");
  });
}

// 단어 관리 함수
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
    alert("유효하지 않은 입력 또는 중복 단어");
  }
}

// 퀴즈 핵심 로직
function startQuiz(category) {
  const filteredWords = wordData[category].filter(wordObj => {
    const stat = wordData.stats[wordObj.word] || {};
    return !stat.lastMastered || 
      (Date.now() - stat.lastMastered) > wordData.settings.cooldownDays * 24 * 60 * 60 * 1000;
  });

  if (filteredWords.length === 0) {
    alert(`선택한 카테고리(${category})에 학습 가능한 단어가 없습니다`);
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

  const options = document.querySelectorAll('.quiz-option');
  
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
    
    // 오답 선택시 다른 오답 선지 숨기기
    options.forEach(opt => {
      if (opt.textContent !== correctAnswer && opt.textContent !== selected) {
        opt.style.opacity = '0';
        opt.style.transform = 'scale(0.9)';
        opt.style.pointerEvents = 'none';
      }
    });
    highlightOption(selected, 'wrong');
  }

  stat.avgTime = stat.totalTime / stat.answerCount;
  wordData.stats[currentWord.word] = stat;
  updateProgress();
  updateWordDisplayBackground(); // 배경색 즉시 업데이트
}

// 화면 업데이트 함수
function updateWordDisplayBackground() {
  const wordDisplay = document.getElementById("word-display");
  const stat = wordData.stats[currentWord.word] || { errorCount: 0 };
  const redValue = Math.min(stat.errorCount * 40, 255);
  wordDisplay.style.backgroundColor = `rgba(${redValue}, ${255 - redValue}, ${255 - redValue}, 0.4)`;
}

function highlightOption(selected, className) {
  document.querySelectorAll('.quiz-option').forEach(opt => {
    if (opt.textContent === selected) {
      opt.classList.add(className);
      opt.style.pointerEvents = 'none';
    }
  });
}

// CSV 파일 로드
async function loadVocabFile(filename) {
  try {
    const response = await fetch(filename);
    if (!response.ok) throw new Error('파일 없음');
    const csvData = await response.text();
    
    // 카테고리 초기화
    wordData = { verb: [], noun: [], adjective: [], adverb: [], phrase: [], mixed: [] };
    
    csvData.split('\n').slice(1).forEach(row => {
      const [word, meaning, category] = row.split(',').map(item => item.trim());
      if(word && meaning && wordData[category]) {
        wordData[category].push({ word, meaning });
        wordData.mixed.push({ word, meaning }); // 혼합 카테고리에도 추가
      }
    });
    
    updateTotalWords();
    return true;
  } catch(e) {
    console.error('단어장 로드 실패:', e);
    alert(`파일 로드 실패: ${filename}`);
    return false;
  }
}

// 공통 유틸리티
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  }
}

function goBack() {
  showScreen("main-menu");
}