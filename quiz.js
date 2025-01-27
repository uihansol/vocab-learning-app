// 메인 창에서 전달된 데이터 사용
let wordData = window.wordData;
let wordStats = window.wordStats;
let currentCategory = window.currentCategory;
let totalQuestions = window.totalQuestions;
let remainingQuestions = window.remainingQuestions;
let masteredCount = window.masteredCount;

let currentWord = null;
let correctAnswer = null;
let startTime = null;
let timerInterval = null;

function showNextWord() {
  if (!wordStats || wordStats.length === 0 || remainingQuestions <= 0) {
    alert(`학습 완료! (마스터 단어: ${masteredCount}개)`);
    return window.close();
  }

  currentWord = wordStats.shift();
  if (!currentWord) {
    alert("출제할 단어가 없습니다.");
    return window.close();
  }

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
  });

  document.getElementById("word-display").textContent = currentWord.word;
  startTimer();
}

function checkAnswer(selected) {
  stopTimer();
  const responseTime = Date.now() - startTime;
  const stat = wordData.stats[currentWord.word] || { correctStreak: 0, errorCount: 0, totalTime: 0, answerCount: 0 };

  if (selected === correctAnswer) {
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

    setTimeout(() => {
      updateProgress();
      showNextWord();
    }, 1000);
  } else {
    stat.correctStreak = 0;
    stat.errorCount = (stat.errorCount || 0) + 1;

    document.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.textContent === selected) {
        opt.classList.add('wrong');
        opt.style.pointerEvents = 'none';
      }
    });
  }

  stat.avgTime = stat.totalTime / (stat.answerCount || 1);
  wordData.stats[currentWord.word] = stat;
  updateWordDisplayBackground();
}

function updateProgress() {
  if (remainingQuestions > 0) {
    remainingQuestions--;
  }
  document.getElementById("progress").textContent = 
    `확실하게 외운 단어: ${masteredCount}개 / 남은 단어: ${remainingQuestions}개 / 전체 문제: ${totalQuestions}개`;
}

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
  showNextWord();
};