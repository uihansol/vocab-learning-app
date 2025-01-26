// 분야별 단어 데이터
let wordData = {
  verb: [],
  noun: [],
  adjective: [],
  adverb: [],
  phrase: [],
  mixed: [],
};

// 문제 진행 관리 변수
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

// 전체 단어 수 업데이트
function updateTotalWords() {
  let total = 0;
  for (const category in wordData) {
    total += wordData[category].length;
  }
  document.getElementById("total-words").innerText = `전체 단어: ${total}개`;
}

// 새로운 단어 추가
function addWord() {
  const word = document.getElementById("new-word").value;
  const meaning = document.getElementById("new-meaning").value;
  const category = document.getElementById("new-category").value;
  if (word && meaning && category) {
    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();
    if (!isWordDuplicate(trimmedWord)) {
      wordData[category].push({ word: trimmedWord, meaning: trimmedMeaning });
      wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
      document.getElementById("new-word").value = "";
      document.getElementById("new-meaning").value = "";
      updateWordList();
      updateTotalWords();
    } else {
      alert("이미 존재하는 단어입니다.");
    }
  } else {
    alert("단어, 의미, 품사를 모두 입력하세요.");
  }
}

// 파일 업로드
function uploadFile() {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (index === 0) return;
        const [word, meaning, category] = line.split(",");
        if (word && meaning && category) {
          const trimmedWord = word.trim();
          const trimmedMeaning = meaning.trim();
          const trimmedCategory = category.trim();
          if (!isWordDuplicate(trimmedWord)) {
            wordData[trimmedCategory].push({ word: trimmedWord, meaning: trimmedMeaning });
            wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
          }
        }
      });
      updateWordList();
      updateTotalWords();
    };
    reader.readAsText(file);
  } else {
    alert("파일을 선택하세요.");
  }
}

// 중복 단어 확인
function isWordDuplicate(word) {
  for (const category in wordData) {
    if (wordData[category].some(item => item.word === word)) {
      return true;
    }
  }
  return false;
}

// 어휘 목록 업데이트
function updateWordList() {
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";
  wordData["mixed"].forEach(word => {
    const li = document.createElement("li");
    li.innerText = `${word.word}: ${word.meaning}`;
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "삭제";
    deleteButton.onclick = () => deleteWord("mixed", word.word);
    li.appendChild(deleteButton);
    wordList.appendChild(li);
  });
}

// 어휘 삭제
function deleteWord(category, word) {
  wordData[category] = wordData[category].filter(item => item.word !== word);
  updateWordList();
  updateTotalWords();
}

// 화면 전환
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  document.getElementById(screenId).classList.remove('hidden');
}

// 난이도 선택
async function selectDifficulty(difficulty) {
  let fileToLoad;
  switch (difficulty) {
    case 'easy': fileToLoad = 'vocab1.csv'; break;
    case 'normal': fileToLoad = 'vocab2.csv'; break;
    case 'hard': fileToLoad = 'vocab3.csv'; break;
    default: fileToLoad = 'vocab1.csv';
  }
  await loadVocabFile(fileToLoad);
  alert(`${difficulty} 난이도 단어장 로드 완료! (${wordData.mixed.length}개 단어)`);
}

// 퀴즈 시작
function startQuiz(category) {
  const questionCount = parseInt(document.getElementById("question-count").value);
  totalQuestions = questionCount;
  remainingQuestions = questionCount;
  masteredCount = 0;
  updateProgress();

  if (wordData[category].length === 0) {
    alert(`선택된 카테고리(${category})에 단어가 없습니다.`);
    return;
  }
  currentCategory = category;
  
  const allWords = [...wordData[category]];
  wordStats = [];
  for(let i=0; i<Math.min(totalQuestions, allWords.length); i++){
    const randomIndex = Math.floor(Math.random() * allWords.length);
    wordStats.push({
      ...allWords[randomIndex],
      frequency: 1,
      correctCount: 0,
      totalTime: 0,
      wrongCount: 0,
    });
    allWords.splice(randomIndex, 1);
  }
  
  document.getElementById("category-title").innerText = `${category.toUpperCase()} 학습`;
  showScreen("quiz-screen");
  showNextWord();
}

// 타이머 시작
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = `시간: ${elapsedTime}초`;
  }, 1000);
}

// 타이머 정지
function stopTimer() {
  clearInterval(timerInterval);
  return Math.floor((Date.now() - startTime) / 1000);
}

// 다음 문제 표시
function showNextWord() {
  if(wordStats.length === 0) {
    alert("더 이상 풀 문제가 없습니다!");
    goBack();
    return;
  }

  const totalFrequency = wordStats.reduce((sum, word) => sum + word.frequency, 0);
  let randomValue = Math.random() * totalFrequency;
  for (const word of wordStats) {
    randomValue -= word.frequency;
    if (randomValue <= 0) {
      currentWord = word;
      break;
    }
  }

  if (masteredWords[currentWord.word] && masteredWords[currentWord.word].masteredUntil > Date.now()) {
    showNextWord();
    return;
  }

  correctAnswer = currentWord.meaning;
  const options = [correctAnswer];
  while (options.length < 3) {
    const randomWord = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;
    if (!options.includes(randomWord)) options.push(randomWord);
  }
  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  options.forEach(option => {
    const optionButton = document.createElement("div");
    optionButton.className = "quiz-option";
    optionButton.innerText = option;
    const wrongCount = currentWord.wrongCount || 0;
    const redIntensity = Math.min(255, wrongCount * 50);
    optionButton.style.backgroundColor = `rgba(255, ${255 - redIntensity}, ${255 - redIntensity}, 0.8)`;
    optionButton.onclick = () => checkAnswer(option);
    optionsContainer.appendChild(optionButton);
  });

  document.getElementById("word-display").innerText = currentWord.word;
  startTimer();
}

// 정답 확인
function checkAnswer(selectedAnswer) {
  const elapsedTime = stopTimer();
  currentWord.totalTime += elapsedTime;

  if (selectedAnswer === correctAnswer) {
    currentWord.correctCount += 1;
    if (currentWord.correctCount >= 3) {
      masteredWords[currentWord.word] = { masteredUntil: Date.now() + 604800000 };
      masteredCount++;
      remainingQuestions--;
    }
    currentWord.frequency = Math.max(1, currentWord.frequency - (elapsedTime < 5 ? 2 : 1));
    currentWord.wrongCount = Math.max(0, currentWord.wrongCount - 1);
  } else {
    currentWord.frequency += 2;
    currentWord.wrongCount += 1;
    currentWord.correctCount = 0;
    if (elapsedTime > 10 && currentWord.wrongCount > 2) currentWord.frequency += 3;
    removeIncorrectOption(selectedAnswer);
  }

  remainingQuestions--;
  updateProgress();
  
  if(remainingQuestions <= 0) {
    alert(`모든 문제 완료! (확실히 외운 단어: ${masteredCount}개)`);
    goBack();
    return;
  }
  
  showNextWord();
}

// 진행 상황 업데이트
function updateProgress() {
  document.getElementById("progress").innerText = 
    `확실하게 외운 단어: ${masteredCount}개 / 남은 단어: ${remainingQuestions}개`;
}

// 오답 선택지 삭제
function removeIncorrectOption(selectedAnswer) {
  const options = document.querySelectorAll(".quiz-option");
  options.forEach(option => {
    if (option.innerText === selectedAnswer) option.remove();
  });
}

// 어휘 관리 화면
function showManageScreen() {
  showScreen("manage-screen");
  updateWordList();
}

// 메인 화면으로
function goBack() {
  showScreen("main-menu");
}

// CSV 파일 로드
async function loadVocabFile(filePath) {
  try {
    for (const category in wordData) wordData[category] = [];
    const response = await fetch(window.location.href.replace('index.html', '') + filePath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index === 0) return;
      const [word, meaning, category] = line.split(",");
      if (word && meaning && category) {
        const trimmedWord = word.trim();
        const trimmedMeaning = meaning.trim();
        const trimmedCategory = category.trim();
        if (!isWordDuplicate(trimmedWord)) {
          wordData[trimmedCategory].push({ word: trimmedWord, meaning: trimmedMeaning });
          wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
        }
      }
    });
    updateWordList();
    updateTotalWords();
  } catch (error) {
    console.error("CSV 로드 오류:", error);
    alert(`파일 로드 실패: ${filePath} 확인 필요!`);
  }
}

// 초기화
window.onload = function () {
  loadVocabFile('vocab1.csv');
  showScreen("main-menu");
};