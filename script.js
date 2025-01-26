// 분야별 단어 데이터
let wordData = {
  verb: [],
  noun: [],
  adjective: [],
  adverb: [],
  phrase: [],
  mixed: [],
};

// 출제 빈도 및 기록
let wordStats = {};
// 문제 진행 관리 변수
let wordStats = [];
let currentCategory = null;
let currentWord = null;
let correctAnswer = null;
let startTime = null;
let timerInterval = null;
// 이해한 단어 목록 (3번 연속 정답)
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
  const category = document.getElementById("new-category").value; // 품사 선택
  const category = document.getElementById("new-category").value;
  if (word && meaning && category) {
    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();
    // 중복 단어인지 확인
    if (!isWordDuplicate(trimmedWord)) {
      wordData[category].push({ word: trimmedWord, meaning: trimmedMeaning });
      wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning }); // "혼합" 항목에도 추가
      wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
      document.getElementById("new-word").value = "";
      document.getElementById("new-meaning").value = "";
      updateWordList();
      updateTotalWords(); // 전체 단어 수 업데이트
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
        if (index === 0) return; // 첫 번째 줄(헤더)은 건너뜀
        if (index === 0) return;
        const [word, meaning, category] = line.split(",");
        if (word && meaning && category) {
          const trimmedWord = word.trim();
          const trimmedMeaning = meaning.trim();
          const trimmedCategory = category.trim();
          // 중복 단어인지 확인
          if (!isWordDuplicate(trimmedWord)) {
            wordData[trimmedCategory].push({ word: trimmedWord, meaning: trimmedMeaning });
            wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning }); // "혼합" 항목에도 추가
            wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
          }
        }
      });
      updateWordList();
      updateTotalWords(); // 전체 단어 수 업데이트
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
      return true; // 중복 단어가 존재함
      return true;
    }
  }
  return false; // 중복 단어가 없음
  return false;
}

// 어휘 목록 업데이트
function updateWordList() {
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";
  // 모든 단어를 "mixed" 항목에서만 표시
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
  updateTotalWords(); // 전체 단어 수 업데이트
  updateTotalWords();
}

// 화면 전환 함수
// 화면 전환
function showScreen(screenId) {
  // 모든 화면 숨기기
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  // 선택한 화면 표시
  document.getElementById(screenId).classList.remove('hidden');
}

// 난이도 선택
function selectDifficulty(difficulty) {
  console.log(`난이도 선택: ${difficulty}`); // 디버깅용 로그
  // 기존에 업로드된 어휘 데이터 초기화
  for (const category in wordData) {
    wordData[category] = [];
  }
async function selectDifficulty(difficulty) {
  let fileToLoad;
  switch (difficulty) {
    case 'easy':
      fileToLoad = 'vocab1.csv';
      break;
    case 'normal':
      fileToLoad = 'vocab2.csv';
      break;
    case 'hard':
      fileToLoad = 'vocab3.csv';
      break;
    default:
      fileToLoad = 'vocab1.csv'; // 기본값
    case 'easy': fileToLoad = 'vocab1.csv'; break;
    case 'normal': fileToLoad = 'vocab2.csv'; break;
    case 'hard': fileToLoad = 'vocab3.csv'; break;
    default: fileToLoad = 'vocab1.csv';
  }
  console.log(`로드할 파일: ${fileToLoad}`); // 디버깅용 로그
  loadVocabFile(fileToLoad);
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
  wordStats = wordData[category].map(word => ({
    ...word,
    frequency: 1,
    correctCount: 0,
    totalTime: 0,
    wrongCount: 0,
  }));
  
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
  showScreen("quiz-screen"); // 퀴즈 화면 표시
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

  // 이해한 단어인지 확인 (1주일이 지났는지 확인)
  if (masteredWords[currentWord.word] && masteredWords[currentWord.word].masteredUntil > Date.now()) {
    showNextWord(); // 이해한 단어이면 다음 문제로 넘어감
    showNextWord();
    return;
  }

  correctAnswer = currentWord.meaning;
  const options = [correctAnswer];
  while (options.length < 3) {
    const randomWord = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
    if (!options.includes(randomWord)) options.push(randomWord);
  }
  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  options.forEach(option => {
    const optionButton = document.createElement("div");
    optionButton.className = "quiz-option";
    optionButton.innerText = option;
    // 틀린 횟수에 따라 배경 색상 조정
    const wrongCount = currentWord.wrongCount || 0;
    const redIntensity = Math.min(255, wrongCount * 50); // 틀린 횟수에 따라 붉은색 강도 조정
    const redIntensity = Math.min(255, wrongCount * 50);
    optionButton.style.backgroundColor = `rgba(255, ${255 - redIntensity}, ${255 - redIntensity}, 0.8)`;
    optionButton.onclick = () => checkAnswer(option);
    optionsContainer.appendChild(optionButton);
  });

  document.getElementById("word-display").innerText = currentWord.word;
  startTimer();
}

// 정답 확인 및 오답 처리
// 정답 확인
function checkAnswer(selectedAnswer) {
  const elapsedTime = stopTimer();
  currentWord.totalTime += elapsedTime;

  if (selectedAnswer === correctAnswer) {
    currentWord.correctCount += 1;
    // 3번 연속 정답인 경우
    if (currentWord.correctCount >= 3) {
      masteredWords[currentWord.word] = {
        masteredUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1주일 후 다시 출제
      };
      alert("이 단어를 3번 연속으로 맞췄습니다! 이 단어는 1주일 동안 출제되지 않습니다.");
    }
    // 시간이 짧게 걸린 경우 출제 빈도를 낮춤
    if (elapsedTime < 5) { // 예: 5초 이내로 맞춘 경우
      currentWord.frequency = Math.max(1, currentWord.frequency - 2); // 빈도 감소
    } else {
      currentWord.frequency = Math.max(1, currentWord.frequency - 1); // 기본 감소
      masteredWords[currentWord.word] = { masteredUntil: Date.now() + 604800000 };
      masteredCount++;
      remainingQuestions--;
    }
    currentWord.wrongCount = Math.max(0, currentWord.wrongCount - 1); // 맞추면 틀린 횟수 감소
    alert("정답입니다!");
    showNextWord(); // 다음 문제로 넘어가기
    currentWord.frequency = Math.max(1, currentWord.frequency - (elapsedTime < 5 ? 2 : 1));
    currentWord.wrongCount = Math.max(0, currentWord.wrongCount - 1);
  } else {
    currentWord.frequency += 2; // 틀리면 빈도 증가
    currentWord.wrongCount += 1; // 틀린 횟수 증가
    currentWord.correctCount = 0; // 연속 정답 횟수 초기화
    // 시간이 오래 걸리고 오답률이 높은 경우 출제 빈도를 더 높임
    if (elapsedTime > 10 && currentWord.wrongCount > 2) { // 예: 10초 이상 걸리고 틀린 횟수가 2회 이상
      currentWord.frequency += 3; // 빈도 더 증가
    }
    currentWord.frequency += 2;
    currentWord.wrongCount += 1;
    currentWord.correctCount = 0;
    if (elapsedTime > 10 && currentWord.wrongCount > 2) currentWord.frequency += 3;
    removeIncorrectOption(selectedAnswer);
  }

    alert("틀렸습니다. 다시 시도해보세요."); // 정답을 알려주지 않음
    removeIncorrectOption(selectedAnswer); // 오답인 선지 삭제
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

// 오답인 선지 삭제
// 오답 선택지 삭제
function removeIncorrectOption(selectedAnswer) {
  const optionsContainer = document.getElementById("options");
  const options = optionsContainer.querySelectorAll(".quiz-option");
  const options = document.querySelectorAll(".quiz-option");
  options.forEach(option => {
    if (option.innerText === selectedAnswer) {
      option.remove(); // 오답인 선지 삭제
    }
    if (option.innerText === selectedAnswer) option.remove();
  });
}

// 어휘 관리 화면 표시
// 어휘 관리 화면
function showManageScreen() {
  showScreen("manage-screen"); // 어휘 관리 화면 표시
  showScreen("manage-screen");
  updateWordList();
}

// 메인 화면으로 돌아가기
// 메인 화면으로
function goBack() {
  showScreen("main-menu"); // 메인 메뉴 화면 표시
  showScreen("main-menu");
}

// vocab.csv 파일을 읽어와 데이터 초기화
async function loadVocabFile(filePath = 'vocab1.csv') {
// CSV 파일 로드
async function loadVocabFile(filePath) {
  try {
    // 기존 단어 데이터 초기화
    for (const category in wordData) {
      wordData[category] = []; // 모든 카테고리의 단어 목록을 빈 배열로 초기화
    }
    const response = await fetch(filePath); // 파일 경로 확인
    if (!response.ok) {
      throw new Error(`파일을 불러오는 데 실패했습니다. 상태 코드: ${response.status}`);
    }
    for (const category in wordData) wordData[category] = [];
    const response = await fetch(window.location.href.replace('index.html', '') + filePath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    console.log("파일 내용:", text); // 파일 내용을 콘솔에 출력하여 확인
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index === 0) return; // 첫 번째 줄(헤더)은 건너뜀
      if (index === 0) return;
      const [word, meaning, category] = line.split(",");
      if (word && meaning && category) {
        const trimmedWord = word.trim();
        const trimmedMeaning = meaning.trim();
        const trimmedCategory = category.trim();
        // 중복 단어인지 확인
        if (!isWordDuplicate(trimmedWord)) {
          wordData[trimmedCategory].push({ word: trimmedWord, meaning: trimmedMeaning });
          wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning }); // "혼합" 항목에도 추가
          wordData["mixed"].push({ word: trimmedWord, meaning: trimmedMeaning });
        }
      }
    });
    console.log("로드된 단어 데이터:", wordData); // 로드된 데이터를 콘솔에 출력하여 확인
    updateWordList();
    updateTotalWords();
    console.log("단어 데이터가 성공적으로 로드되었습니다.");
  } catch (error) {
    console.error("CSV 파일을 읽는 중 오류가 발생했습니다:", error);
    alert(`파일을 불러오는 데 실패했습니다: ${error.message}`);
    console.error("CSV 로드 오류:", error);
    alert(`파일 로드 실패: ${filePath} 확인 필요!`);
  }
}

// 페이지 로드 시 초기화
// 초기화
window.onload = function () {
  loadVocabFile(); // 기본 단어 데이터 로드 (vocab1.csv)
  showScreen("main-menu"); // 메인 메뉴 화면 표시
  loadVocabFile('vocab1.csv');
  showScreen("main-menu");
};