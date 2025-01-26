{\rtf1\ansi\ansicpg949\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset129 AppleSDGothicNeo-Regular;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // 
\f1 \'ba\'d0\'be\'df\'ba\'b0
\f0  
\f1 \'b4\'dc\'be\'ee
\f0  
\f1 \'b5\'a5\'c0\'cc\'c5\'cd
\f0 \
let wordData = \{\
  verb: [],\
  noun: [],\
  adjective: [],\
  adverb: [],\
  phrase: [],\
  mixed: [],\
\};\
\
// 
\f1 \'c3\'e2\'c1\'a6
\f0  
\f1 \'ba\'f3\'b5\'b5
\f0  
\f1 \'b9\'d7
\f0  
\f1 \'b1\'e2\'b7\'cf
\f0 \
let wordStats = \{\};\
let currentCategory = null;\
let currentWord = null;\
let correctAnswer = null;\
let startTime = null;\
let timerInterval = null;\
\
// Compromise.js
\f1 \'b8\'a6
\f0  
\f1 \'bb\'e7\'bf\'eb\'c7\'cf\'bf\'a9
\f0  
\f1 \'c7\'b0\'bb\'e7
\f0  
\f1 \'ba\'d0\'b7\'f9
\f0 \
function classifyPartOfSpeech(word) \{\
  const doc = window.nlp(word);\
  const tags = doc.out("tags");\
  if (tags.includes("Verb")) \{\
    return "verb";\
  \} else if (tags.includes("Noun")) \{\
    return "noun";\
  \} else if (tags.includes("Adjective")) \{\
    return "adjective";\
  \} else if (tags.includes("Adverb")) \{\
    return "adverb";\
  \} else \{\
    return "mixed"; // 
\f1 \'b1\'e2\'ba\'bb\'b0\'aa
\f0 \
  \}\
\}\
\
// 
\f1 \'bb\'f5\'b7\'ce\'bf\'ee
\f0  
\f1 \'b4\'dc\'be\'ee
\f0  
\f1 \'c3\'df\'b0\'a1
\f0 \
function addWord() \{\
  const word = document.getElementById("new-word").value;\
  const meaning = document.getElementById("new-meaning").value;\
  if (word && meaning) \{\
    const category = classifyPartOfSpeech(word); // 
\f1 \'c7\'b0\'bb\'e7
\f0  
\f1 \'ba\'d0\'b7\'f9
\f0 \
    wordData[category].push(\{ word, meaning \});\
    document.getElementById("new-word").value = "";\
    document.getElementById("new-meaning").value = "";\
    updateWordList();\
  \} else \{\
    alert("
\f1 \'b4\'dc\'be\'ee\'bf\'cd
\f0  
\f1 \'c0\'c7\'b9\'cc\'b8\'a6
\f0  
\f1 \'b8\'f0\'b5\'ce
\f0  
\f1 \'c0\'d4\'b7\'c2\'c7\'cf\'bc\'bc\'bf\'e4
\f0 .");\
  \}\
\}\
\
// 
\f1 \'c6\'c4\'c0\'cf
\f0  
\f1 \'be\'f7\'b7\'ce\'b5\'e5
\f0 \
function uploadFile() \{\
  const fileInput = document.getElementById("file-input");\
  const file = fileInput.files[0];\
  if (file) \{\
    const reader = new FileReader();\
    reader.onload = function (e) \{\
      const text = e.target.result;\
      const lines = text.split("\\n");\
      lines.forEach(line => \{\
        const [word, meaning] = line.split(",");\
        if (word && meaning) \{\
          const category = classifyPartOfSpeech(word.trim()); // 
\f1 \'c7\'b0\'bb\'e7
\f0  
\f1 \'ba\'d0\'b7\'f9
\f0 \
          wordData[category].push(\{ word: word.trim(), meaning: meaning.trim() \});\
        \}\
      \});\
      updateWordList();\
    \};\
    reader.readAsText(file);\
  \} else \{\
    alert("
\f1 \'c6\'c4\'c0\'cf\'c0\'bb
\f0  
\f1 \'bc\'b1\'c5\'c3\'c7\'cf\'bc\'bc\'bf\'e4
\f0 .");\
  \}\
\}\
\
// 
\f1 \'be\'ee\'c8\'d6
\f0  
\f1 \'b8\'f1\'b7\'cf
\f0  
\f1 \'be\'f7\'b5\'a5\'c0\'cc\'c6\'ae
\f0 \
function updateWordList() \{\
  const wordList = document.getElementById("word-list");\
  wordList.innerHTML = "";\
  for (const category in wordData) \{\
    wordData[category].forEach(word => \{\
      const li = document.createElement("li");\
      li.innerText = `$\{word.word\} ($\{category\}): $\{word.meaning\}`;\
      const deleteButton = document.createElement("button");\
      deleteButton.innerText = "
\f1 \'bb\'e8\'c1\'a6
\f0 ";\
      deleteButton.onclick = () => deleteWord(category, word.word);\
      li.appendChild(deleteButton);\
      wordList.appendChild(li);\
    \});\
  \}\
\}\
\
// 
\f1 \'be\'ee\'c8\'d6
\f0  
\f1 \'bb\'e8\'c1\'a6
\f0 \
function deleteWord(category, word) \{\
  wordData[category] = wordData[category].filter(item => item.word !== word);\
  updateWordList();\
\}\
\
// 
\f1 \'b8\'de\'c0\'ce
\f0  
\f1 \'c8\'ad\'b8\'e9\'c0\'b8\'b7\'ce
\f0  
\f1 \'b5\'b9\'be\'c6\'b0\'a1\'b1\'e2
\f0 \
function goBack() \{\
  document.getElementById("manage-screen").classList.add("hidden");\
  document.getElementById("quiz-screen").classList.add("hidden");\
  document.querySelector(".main-menu").classList.remove("hidden");\
\}\
\
// 
\f1 \'c4\'fb\'c1\'ee
\f0  
\f1 \'bd\'c3\'c0\'db
\f0 \
function startQuiz(category) \{\
  currentCategory = category;\
  wordStats = wordData[category].map(word => (\{\
    ...word,\
    frequency: 1,\
    correctCount: 0,\
    totalTime: 0,\
  \}));\
  document.getElementById("category-title").innerText = `$\{category.toUpperCase()\} 
\f1 \'c7\'d0\'bd\'c0
\f0 `;\
  document.querySelector(".main-menu").classList.add("hidden");\
  document.getElementById("quiz-screen").classList.remove("hidden");\
  showNextWord();\
\}\
\
// 
\f1 \'c5\'b8\'c0\'cc\'b8\'d3
\f0  
\f1 \'bd\'c3\'c0\'db
\f0 \
function startTimer() \{\
  startTime = Date.now();\
  timerInterval = setInterval(() => \{\
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);\
    document.getElementById("timer").innerText = `
\f1 \'bd\'c3\'b0\'a3
\f0 : $\{elapsedTime\}
\f1 \'c3\'ca
\f0 `;\
  \}, 1000);\
\}\
\
// 
\f1 \'c5\'b8\'c0\'cc\'b8\'d3
\f0  
\f1 \'c1\'a4\'c1\'f6
\f0 \
function stopTimer() \{\
  clearInterval(timerInterval);\
  return Math.floor((Date.now() - startTime) / 1000);\
\}\
\
// 
\f1 \'b4\'d9\'c0\'bd
\f0  
\f1 \'b9\'ae\'c1\'a6
\f0  
\f1 \'c7\'a5\'bd\'c3
\f0 \
function showNextWord() \{\
  const totalFrequency = wordStats.reduce((sum, word) => sum + word.frequency, 0);\
  let randomValue = Math.random() * totalFrequency;\
  for (const word of wordStats) \{\
    randomValue -= word.frequency;\
    if (randomValue <= 0) \{\
      currentWord = word;\
      break;\
    \}\
  \}\
\
  correctAnswer = currentWord.meaning;\
\
  const options = [correctAnswer];\
  while (options.length < 3) \{\
    const randomWord = wordData[currentCategory][Math.floor(Math.random() * wordData[currentCategory].length)].meaning;\
    if (!options.includes(randomWord)) \{\
      options.push(randomWord);\
    \}\
  \}\
\
  options.sort(() => Math.random() - 0.5);\
\
  const optionsContainer = document.getElementById("options");\
  optionsContainer.innerHTML = "";\
  options.forEach(option => \{\
    const optionButton = document.createElement("div");\
    optionButton.className = "quiz-option";\
    optionButton.innerText = option;\
    optionButton.onclick = () => checkAnswer(option);\
    optionsContainer.appendChild(optionButton);\
  \});\
\
  document.getElementById("word-display").innerText = currentWord.word;\
  startTimer();\
\}\
\
// 
\f1 \'c1\'a4\'b4\'e4
\f0  
\f1 \'c8\'ae\'c0\'ce
\f0 \
function checkAnswer(selectedAnswer) \{\
  const elapsedTime = stopTimer();\
  currentWord.totalTime += elapsedTime;\
  currentWord.correctCount += selectedAnswer === correctAnswer ? 1 : 0;\
\
  if (selectedAnswer === correctAnswer) \{\
    currentWord.frequency = Math.max(1, currentWord.frequency - 1);\
    alert("
\f1 \'c1\'a4\'b4\'e4\'c0\'d4\'b4\'cf\'b4\'d9
\f0 !");\
  \} else \{\
    currentWord.frequency += 2;\
    alert(`
\f1 \'c6\'b2\'b7\'c8\'bd\'c0\'b4\'cf\'b4\'d9
\f0 . 
\f1 \'c1\'a4\'b4\'e4\'c0\'ba
\f0  "$\{correctAnswer\}"
\f1 \'c0\'d4\'b4\'cf\'b4\'d9
\f0 .`);\
  \}\
\
  showNextWord();\
\}\
\
// 
\f1 \'be\'ee\'c8\'d6
\f0  
\f1 \'b0\'fc\'b8\'ae
\f0  
\f1 \'c8\'ad\'b8\'e9
\f0  
\f1 \'c7\'a5\'bd\'c3
\f0 \
function showManageScreen() \{\
  document.querySelector(".main-menu").classList.add("hidden");\
  document.getElementById("manage-screen").classList.remove("hidden");\
  updateWordList();\
\}}