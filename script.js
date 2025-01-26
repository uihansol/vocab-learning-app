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
let currentCategory = null;
let currentWord = null;
let correctAnswer = null;
let startTime = null;
let timerInterval = null;

// Compromise.js를 사용하여 품사 분류
function classifyPartOfSpeech(word) {
  const doc = window.nlp(word);
  const tags = doc.out("tags");
  if (tags.includes("Verb")) {
    return "verb";
  } else if (tags.includes("Noun")) {
    return "noun";
  } else if (tags.includes("Adjective")) {
    return "adjective";
  } else if (tags.includes("Adverb")) {
    return "adverb";
  } else {
    return "mixed"; // 기본값
  }
}

// 새로운 단어 추가
function addWord() {
  const word = document.getElementById("new-word").value;
  const meaning = document.getElementById("new-meaning").value;
  if (word && meaning) {
    const category = classifyPartOfSpeech(word); // 품사 분류
    wordData[category].push({ word, meaning });
    document.getElementById("new-word").value = "";
    document.getElementById("new-meaning").value = "";
    updateWordList();
  } else {
    alert("단어와 의미를 모두 입력하세요.");
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
      lines.forEach(line => {
        const [word, meaning] = line.split(",");
        if (word && meaning) {
          const category = classifyPartOfSpeech(word.trim()); // 품사 분류
          wordData[category].push({ word: word.trim(), meaning: meaning.trim() });
        }
      });
      updateWordList();
    };
    reader.readAsText(file);
  } else {
    alert("파일을 선택하세요.");
  }
}

// 어휘 목록 업데이트
function updateWordList() {
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";
  for (const category in wordData) {
    wordData[category].forEach(word => {
      const li = document.createElement("li");
      li.innerText = `${word.word} (${category}): ${word.meaning}`;
      const deleteButton = document.createElement("button");
      deleteButton.innerText = "삭제";
      deleteButton.onclick = () => deleteWord(category, word.word);
      li.appendChild(deleteButton);
      wordList.appendChild(li);
    });
  }
}

// 어휘 삭제
function deleteWord(category, word) {
  wordData[category] = wordData[category].filter(item => item.word !== word);
  updateWordList();
}

// 메인 화면으로 돌아가기
function goBack() {
  document.getElementById("manage-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.add("hidden");
  document.querySelector(".main-menu").classList.remove("hidden");
}

// 퀴즈 시작
function startQuiz(category) {
  currentCategory = category;
  wordStats = wordData[category].map(word => ({
    ...word,
    frequency: 1,
    correctCount: 0,
    totalTime: 0,
  }));
  document.getElementById("category-title").innerText = `${category.toUpperCase()} 학습`;
  document.querySelector(".main-menu").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");
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
  const totalFrequency = wordStats.reduce((sum, word) => sum + word.frequency, 0);
  let randomValue = Math.random() * totalFrequency;
  for (const word of wordStats) {
    randomValue -= word.frequency;
    if (randomValue <= 0) {
      currentWord = word;
      break;
    }
  }

  correctAnswer = currentWord.meaning;

  const options = [correctAnswer];
  while (options.length < 3) {
    const randomWord = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
  }

  options.sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  options.forEach(option => {
    const optionButton = document.createElement("div");
    optionButton.className = "quiz-option";
    optionButton.innerText = option;
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
  currentWord.correctCount += selectedAnswer === correctAnswer ? 1 : 0;

  if (selectedAnswer === correctAnswer) {
    currentWord.frequency = Math.max(1, currentWord.frequency - 1);
    alert("정답입니다!");
  } else {
    currentWord.frequency += 2;
    alert(`틀렸습니다. 정답은 "${correctAnswer}"입니다.`);
  }

  showNextWord();
}

// 어휘 관리 화면 표시
function showManageScreen() {
  document.querySelector(".main-menu").classList.add("hidden");
  document.getElementById("manage-screen").classList.remove("hidden");
  updateWordList();
}
