// 초기화 및 데이터 구조
const wordData = {
  verb: [], noun: [], adjective: [], adverb: [], phrase: [], mixed: []
};

let currentSession = {
  category: null,
  wordPool: [],
  mastered: 0,
  remaining: 0,
  timer: null,
  currentWord: null,
  options: []
};

// 파일 로딩 시스템
async function loadVocabFile(difficulty) {
  try {
    const fileMap = { easy: 'vocab1', normal: 'vocab2', hard: 'vocab3' };
    const response = await fetch(`${window.location.origin}/${fileMap[difficulty]}.csv`);
    
    if (!response.ok) throw new Error('파일을 찾을 수 없습니다');
    
    const csvData = await response.text();
    csvData.split('\n').slice(1).forEach(line => {
      const [word, meaning, category] = line.split(',').map(s => s.trim());
      if (word && category in wordData) {
        wordData[category].push({ word, meaning });
        wordData.mixed.push({ word, meaning });
      }
    });
    
    updateTotalCount();
    return true;
  } catch (error) {
    console.error('❗파일 로딩 오류:', error);
    return false;
  }
}

// 퀴즈 엔진
function startQuiz(category) {
  const questionCount = parseInt(document.getElementById('question-count').value);
  currentSession = {
    ...currentSession,
    category,
    wordPool: shuffleArray([...wordData[category]]).slice(0, questionCount),
    remaining: questionCount,
    mastered: 0
  };
  
  showScreen('quiz-screen');
  nextQuestion();
}

function nextQuestion() {
  if (currentSession.remaining <= 0) {
    endQuiz();
    return;
  }

  currentSession.currentWord = currentSession.wordPool.pop();
  currentSession.options = generateOptions(currentSession.currentWord);
  renderQuestion();
  startTimer();
}

function generateOptions(correctWord) {
  const options = [correctWord.meaning];
  while (options.length < 4) {
    const randomWord = wordData[currentSession.category][
      Math.floor(Math.random() * wordData[currentSession.category].length)
    ].meaning;
    if (!options.includes(randomWord)) options.push(randomWord);
  }
  return shuffleArray(options);
}

// 이벤트 핸들러
function handleAnswer(selected) {
  clearInterval(currentSession.timer);
  
  if (selected === currentSession.currentWord.meaning) {
    currentSession.mastered++;
    animateCorrect();
  } else {
    animateWrong(selected);
    return; // 오답 시 추가 동작 없음
  }

  currentSession.remaining--;
  updateProgress();
  setTimeout(nextQuestion, 1000);
}

// 애니메이션 시스템
function animateCorrect() {
  document.getElementById('word-display').style.color = '#2ecc71';
  setTimeout(() => {
    document.getElementById('word-display').style.color = '#333';
  }, 500);
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

// 기타 유틸리티
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function startTimer() {
  let seconds = 0;
  currentSession.timer = setInterval(() => {
    document.getElementById('timer').textContent = `⏱️ ${++seconds}초`;
  }, 1000);
}

function updateProgress() {
  document.getElementById('progress').textContent = 
    `✅ ${currentSession.mastered}개 / 📝 ${currentSession.remaining}개`;
}

// 단어 추가 기능
function addNewWord() {
  const word = document.getElementById('new-word').value.trim();
  const meaning = document.getElementById('new-meaning').value.trim();
  const category = document.getElementById('new-category').value;

  if (!word || !meaning) {
    alert('❗ 단어와 의미를 모두 입력해주세요!');
    return;
  }

  // 중복 검사
  const isDuplicate = wordData[category].some(item => 
    item.word === word && item.meaning === meaning
  );
  
  if (isDuplicate) {
    alert('⚠️ 이미 존재하는 단어입니다!');
    return;
  }

  // 데이터 추가
  wordData[category].push({ word, meaning });
  wordData.mixed.push({ word, meaning });
  updateTotalCount();
  renderWordList();
  
  // 입력 필드 초기화
  document.getElementById('new-word').value = '';
  document.getElementById('new-meaning').value = '';
}

// 단어 삭제 기능
function deleteWord(category, index) {
  if (confirm('정말 삭제하시겠습니까?')) {
    const deleted = wordData[category].splice(index, 1)[0];
    wordData.mixed = wordData.mixed.filter(item => 
      item.word !== deleted.word || item.meaning !== deleted.meaning
    );
    updateTotalCount();
    renderWordList();
  }
}

// 단어 목록 렌더링
function renderWordList() {
  const container = document.getElementById('word-list-items');
  container.innerHTML = '';

  Object.keys(wordData).forEach(category => {
    if (category === 'mixed') return;
    
    wordData[category].forEach((wordObj, index) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span>${wordObj.word}</span>
        <span>${wordObj.meaning}</span>
        <span>${getCategoryLabel(category)}</span>
        <button onclick="deleteWord('${category}', ${index})">❌</button>
      `;
      container.appendChild(item);
    });
  });
}

// 품사 라벨 변환
function getCategoryLabel(category) {
  const labels = {
    verb: '동사 🏃',
    noun: '명사 🏛️',
    adjective: '형용사 🌈',
    adverb: '부사 ⚡',
    phrase: '구문 🔗'
  };
  return labels[category] || category;
}

// 관리 화면 표시
function showManageScreen() {
  renderWordList();
  showScreen('manage-screen');
}