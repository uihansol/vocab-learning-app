const userManager = {
  currentUser: null,
  users: JSON.parse(localStorage.getItem('wordMasterUsers')) || {},

  setUser(username) {
    if (!username) return;
    if (!this.users[username]) {
      this.users[username] = {
        stats: { totalAttempts: 0, correctAnswers: 0, masteredWords: new Set() },
        wordHistory: new Map()
      };
    }
    this.currentUser = username;
    this.save();
    updateLoginState();
  },

  save() {
    localStorage.setItem('wordMasterUsers', JSON.stringify(this.users, (key, value) => {
      if (value instanceof Map) return { dataType: 'Map', value: [...value] };
      if (value instanceof Set) return { dataType: 'Set', value: [...value] };
      return value;
    }));
  },

  load() {
    const data = JSON.parse(localStorage.getItem('wordMasterUsers'), (key, value) => {
      if (value?.dataType === 'Map') return new Map(value.value);
      if (value?.dataType === 'Set') return new Set(value.value);
      return value;
    });
    this.users = data || {};
  },

  showUserSelection() {
    const username = prompt(`새 사용자명:\n(기존: ${Object.keys(this.users).join(', ') || '없음'})`);
    if (username) this.setUser(username);
  },

  updateStats(isCorrect, word) {
    const user = this.users[this.currentUser];
    if (!user) return;

    user.stats.totalAttempts++;
    if (isCorrect) user.stats.correctAnswers++;
    if (user.stats.masteredWords.has(word)) return;

    const wordHistory = user.wordHistory.get(word) || { correct: 0, wrong: 0 };
    isCorrect ? wordHistory.correct++ : wordHistory.wrong++;
    user.wordHistory.set(word, wordHistory);
    this.save();
  }
};

const wordData = { verb: [], noun: [], adjective: [], adverb: [], phrase: [], mixed: [] };
let currentSession = { category: null, wordPool: [], mastered: 0, remaining: 0, timer: null };

window.onload = function() {
  userManager.load();
  updateLoginState();
  loadVocabFile('vocab1.csv');
  showScreen('main-menu');
};

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  document.getElementById(screenId).classList.remove('hidden');
}

async function loadVocabFile(filename) {
  const response = await fetch(filename);
  const data = await response.text();
  data.split('\n').slice(1).forEach(line => {
    const [word, meaning, category] = line.split(',');
    if (word && category && wordData[category]) {
      wordData[category].push({ word: word.trim(), meaning: meaning.trim() });
    }
  });
  document.getElementById('total-words').textContent = `전체 단어: ${Object.values(wordData).flat().length}개`;
}

function startQuiz(category, isReview = false) {
  if (!userManager.currentUser) {
    alert('로그인이 필요합니다!');
    return;
  }

  const questionCount = parseInt(document.getElementById('question-count').value);
  let wordPool = isReview ? 
    [...userManager.users[userManager.currentUser].wordHistory.entries()]
      .filter(([_, data]) => data.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .map(([word]) => wordData.mixed.find(w => w.word === word)) :
    shuffleArray([...wordData[category]]).slice(0, questionCount);

  currentSession = {
    category: isReview ? 'review' : category,
    wordPool: wordPool.filter(Boolean).slice(0, questionCount),
    mastered: 0,
    remaining: questionCount,
    timer: null
  };

  showScreen('quiz-screen');
  nextQuestion();
}

function nextQuestion() {
  if (currentSession.remaining <= 0) return endQuiz();
  currentSession.currentWord = currentSession.wordPool.pop();
  currentSession.options = generateOptions(currentSession.currentWord);
  renderQuestion();
  startTimer();
}

function renderQuestion() {
  const wordDisplay = document.getElementById('word-display');
  wordDisplay.textContent = currentSession.currentWord.word;
  const user = userManager.users[userManager.currentUser];
  const wrongCount = user?.wordHistory.get(currentSession.currentWord.word)?.wrong || 0;
  wordDisplay.style.backgroundColor = `rgba(255, ${255 - wrongCount * 50}, ${255 - wrongCount * 50}, 0.2)`;

  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';
  currentSession.options.forEach(option => {
    const button = document.createElement('div');
    button.className = 'quiz-option';
    button.textContent = option;
    button.onclick = () => handleAnswer(option);
    optionsContainer.appendChild(button);
  });
  updateProgress();
}

function handleAnswer(selected) {
  clearInterval(currentSession.timer);
  const isCorrect = selected === currentSession.currentWord.meaning;
  userManager.updateStats(isCorrect, currentSession.currentWord.word);

  if (isCorrect) {
    currentSession.mastered++;
    currentSession.remaining--;
    animateCorrect();
    setTimeout(nextQuestion, 1000);
  } else {
    animateWrong(selected);
  }
}

function updateProgress() {
  const progress = (currentSession.mastered / currentSession.wordPool.length * 100).toFixed(1);
  document.getElementById('progress-bar').style.width = `${progress}%`;
  document.getElementById('progress').textContent = 
    `진행: ${currentSession.mastered}개 / ${currentSession.remaining}개`;
}

function endQuiz() {
  alert(`퀴즈 완료!\n확실히 외운 단어: ${currentSession.mastered}개`);
  if (currentSession.mastered < currentSession.wordPool.length * 0.7) {
    alert('복습 모드를 추천합니다!');
  }
  goBack();
}

function animateCorrect() {
  const wordDisplay = document.getElementById('word-display');
  wordDisplay.style.color = '#2ecc71';
  setTimeout(() => wordDisplay.style.color = '#4a6fa5', 500);
}

function animateWrong(selected) {
  const wrongButton = [...document.querySelectorAll('.quiz-option')]
    .find(btn => btn.textContent === selected);
  wrongButton.classList.add('wrong');
  setTimeout(() => {
    wrongButton.remove();
    currentSession.options = currentSession.options.filter(opt => opt !== selected);
    if (currentSession.options.length === 1) handleAnswer(currentSession.currentWord.meaning);
  }, 1000);
}

function startTimer() {
  let seconds = 0;
  currentSession.timer = setInterval(() => {
    document.getElementById('timer').textContent = `시간: ${++seconds}초`;
  }, 1000);
}

function updateLoginState() {
  const authBtn = document.getElementById('auth-btn');
  const statsBtn = document.getElementById('stats-btn');
  if (userManager.currentUser) {
    document.getElementById('current-user').textContent = `사용자: ${userManager.currentUser}`;
    authBtn.textContent = '로그아웃';
    statsBtn.classList.remove('hidden');
  } else {
    document.getElementById('current-user').textContent = '로그인 필요';
    authBtn.textContent = '로그인';
    statsBtn.classList.add('hidden');
  }
}

function handleUserAuth() {
  userManager.currentUser ? userManager.currentUser = null : userManager.showUserSelection();
  updateLoginState();
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function generateOptions(word) {
  const allMeanings = Object.values(wordData).flat().map(w => w.meaning);
  const options = new Set([word.meaning]);
  while (options.size < 4) {
    options.add(allMeanings[Math.floor(Math.random() * allMeanings.length)]);
  }
  return shuffleArray([...options]);
}

function goBack() {
  clearInterval(currentSession.timer);
  showScreen('main-menu');
}