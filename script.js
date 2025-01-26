// 화면 전환 함수
function showScreen(screenId) {
  // 모든 화면 숨기기
  document.querySelector(".main-menu").classList.add("hidden");
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("manage-screen").classList.add("hidden");

  // 선택한 화면 표시
  if (screenId === "main-menu") {
    document.querySelector(".main-menu").classList.remove("hidden");
  } else {
    document.getElementById(screenId).classList.remove("hidden");
  }
}

// 퀴즈 시작
function startQuiz(category) {
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
  document.getElementById("category-title").innerText = `${category.toUpperCase()} 학습`;
  showScreen("quiz-screen"); // 퀴즈 화면 표시
  showNextWord();
}

// 어휘 관리 화면 표시
function showManageScreen() {
  showScreen("manage-screen"); // 어휘 관리 화면 표시
  updateWordList();
}

// 메인 화면으로 돌아가기
function goBack() {
  showScreen("main-menu"); // 메인 메뉴 화면 표시
}

// 페이지 로드 시 초기화
window.onload = function () {
  loadVocabFile(); // 기본 단어 데이터 로드
  showScreen("main-menu"); // 메인 메뉴 화면 표시
};