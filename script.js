const userManager = {
  currentUser: null,
  users: JSON.parse(localStorage.getItem('wordMasterUsers')) || {},
  difficultyLevels: { easy: 'vocab1.csv', normal: 'vocab2.csv', hard: 'vocab3.csv' },

  // 사용자 관리 시스템
  setUser(username) {
    if (!username) return;
    if (!this.users[username]) {
      this.users[username] = {
        stats: { 
          totalAttempts: 0, 
          correctAnswers: 0, 
          masteredWords: new Set(),
          wordHistory: new Map() 
        },
        learningData: {
          errorCount: {},
          correctStreak: {}
        }
      };
    }
    this.currentUser = username;
    this.saveUsers();
    updateLoginState();
  },

  saveUsers() {
    localStorage.setItem('wordMasterUsers', JSON.stringify(this.users, (key, value) => {
      if (value instanceof Map || value instanceof Set) {
        return { dataType: key === 'wordHistory' ? 'Map' : 'Set', value: [...value] };
      }
      return value;
    }));
  },

  loadUsers() {
    const data = JSON.parse(localStorage.getItem('wordMasterUsers'), (key, value) => {
      if (value?.dataType === 'Map') return new Map(value.value);
      if (value?.dataType === 'Set') return new Set(value.value);
      return value;
    });
    this.users = data || {};
  },

  // 단어 데이터 관리 시스템
  wordData: JSON.parse(localStorage.getItem('wordMasterVocab')) || { 
    verb: [], noun: [], adjective: [], adverb: [], phrase: [], mixed: [] 
  },

  async loadVocabFile(difficulty) {
    const response = await fetch(this.difficultyLevels[difficulty]);
    const data = await response.text();
    this.resetWordData();
    
    data.split('\n').slice(1).forEach(line => {
      const [word, meaning, category] = line.split(',').map(s => s.trim());
      if (word && category && this.wordData[category]) {
        this.wordData[category].push({ word, meaning });
        if (category !== 'mixed') this.wordData.mixed.push({ word, meaning });
      }
    });
    this.saveVocabData();
    updateTotalWords();
  },

  addWord(newWord, meaning, category) {
    if (this.isWordDuplicate(newWord)) return false;
    
    this.wordData[category].push({ word: newWord, meaning });
    if (category !== 'mixed') this.wordData.mixed.push({ word: newWord, meaning });
    this.saveVocabData();
    return true;
  },

  deleteWord(targetWord) {
    Object.keys(this.wordData).forEach(cat => {
      this.wordData[cat] = this.wordData[cat].filter(w => w.word !== targetWord);
    });
    this.users[this.currentUser]?.stats.masteredWords.delete(targetWord);
    this.saveVocabData();
  },

  isWordDuplicate(word) {
    return Object.values(this.wordData).flat().some(w => w.word === word);
  },

  resetWordData() {
    Object.keys(this.wordData).forEach(k => this.wordData[k] = []);
  },

  saveVocabData() {
    localStorage.setItem('wordMasterVocab', JSON.stringify(this.wordData));
    updateWordList();
  },

  // 퀴즈 엔진
  getWeightedQuestions(category, count) {
    const user = this.users[this.currentUser];
    return this.wordData[category]
      .map(wordObj => {
        const history = user.stats.wordHistory.get(wordObj.word) || { correct: 0, wrong: 0 };
        const weight = history.wrong * 3 + (history.correct === 0 ? 5 : 0);
        return { ...wordObj, weight };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, count);
  }
};

let currentSession = {
  category: null,
  questions: [],
  progress: { mastered: 0, remaining: 0, total: 0 },
  timer: null
};

// UI 관리 함수
function updateLoginState() {
  const authBtn = document.getElementById('auth-btn');
  document.getElementById('current-user').textContent = 
    userManager.currentUser ? `사용자: ${userManager.currentUser}` : '로그인 필요';
  authBtn.textContent = userManager.currentUser ? '로그아웃' : '로그인';
}

function startQuiz(category, difficulty = 'normal') {
  if (!userManager.currentUser) return alert('로그인 필요!');
  
  userManager.loadVocabFile(difficulty).then(() => {
    currentSession = {
      category,
      questions: userManager.getWeightedQuestions(category, 
        parseInt(document.getElementById('question-count').value)),
      progress: {
        mastered: 0,
        remaining: parseInt(document.getElementById('question-count').value),
        total: parseInt(document.getElementById('question-count').value)
      },
      timer: null
    };
    showScreen('quiz-screen');
    nextQuestion();
  });
}

function nextQuestion() {
  if (currentSession.progress.remaining <= 0) return endQuiz();
  
  const currentWord = currentSession.questions.shift();
  document.getElementById('word-display').textContent = currentWord.word;
  
  const options = generateOptions(currentWord);
  renderOptions(options, currentWord.meaning);
  startTimer();
  updateProgress();
}

function generateOptions(wordObj) {
  const options = new Set([wordObj.meaning]);
  while (options.size < 4) {
    const random = userManager.wordData.mixed[
      Math.floor(Math.random() * userManager.wordData.mixed.length)
    ].meaning;
    if (random !== wordObj.meaning) options.add(random);
  }
  return shuffleArray([...options]);
}

function renderOptions(options, correctAnswer) {
  const container = document.getElementById('options');
  container.innerHTML = options.map(opt => `
    <div class="quiz-option" onclick="handleAnswer('${opt}', '${correctAnswer}')">
      ${opt}
    </div>
  `).join('');
}

function handleAnswer(selected, correct) {
  clearInterval(currentSession.timer);
  const isCorrect = selected === correct;
  updateUserStats(isCorrect, currentWord);

  if (isCorrect) {
    currentSession.progress.mastered++;
    currentSession.progress.remaining--;
    animateCorrect();
    setTimeout(nextQuestion, 1000);
  } else {
    animateWrong(selected);
  }
}

function updateUserStats(isCorrect, wordObj) {
  const user = userManager.users[userManager.currentUser];
  const wordHistory = user.stats.wordHistory.get(wordObj.word) || { correct: 0, wrong: 0 };
  
  isCorrect ? wordHistory.correct++ : wordHistory.wrong++;
  user.stats.totalAttempts++;
  if (isCorrect) user.stats.correctAnswers++;
  
  if (wordHistory.correct >= 3) {
    user.stats.masteredWords.add(wordObj.word);
  }
  
  user.stats.wordHistory.set(wordObj.word, wordHistory);
  userManager.saveUsers();
}

// 기타 유틸리티 함수
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

window.onload = () => {
  userManager.loadUsers();
  updateLoginState();
  showScreen('main-menu');
};