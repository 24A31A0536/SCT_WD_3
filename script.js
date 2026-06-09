// ===== API CONFIGURATION =====
// Add your Groq API key here
const API_KEY = import.meta.env.VITE_Quiz_API_KEY; 
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Quiz data will be populated from API
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // Keeps track of answers dynamically: { questionIndex: answers }

// DOM Element Selections
const topicUi = document.getElementById('topic-ui');
const topicInput = document.getElementById('topic-input');
const startBtn = document.getElementById('start-btn');
const loadingText = document.getElementById('loading-text');

const progressText = document.getElementById('progress-text');
const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const quizUi = document.getElementById('quiz-ui');
const resultsUi = document.getElementById('results-ui');
const scoreText = document.getElementById('score-text');
const feedbackText = document.getElementById('feedback-text');
const restartBtn = document.getElementById('restart-btn');

// Setup Event Listeners
startBtn.addEventListener('click', handleStartQuiz);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleStartQuiz();
});
prevBtn.addEventListener('click', () => navigate(-1));
nextBtn.addEventListener('click', () => navigate(1));
submitBtn.addEventListener('click', submitQuiz);
restartBtn.addEventListener('click', restartQuiz);

// Load a question based on global index
function loadQuestion() {
    saveCurrentAnswer(); // Save progress from previous view if any
    
    const currentQuestion = quizData[currentQuestionIndex];
    
    // Update Header/Progress
    progressText.innerText = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    questionText.innerText = currentQuestion.question;
    answerContainer.innerHTML = ''; // Reset current options view

    // Load content based on type
    if (currentQuestion.type === "single" || currentQuestion.type === "multi") {
        const list = document.createElement('ul');
        list.className = 'options-list';
        
        currentQuestion.options.forEach((option, index) => {
            const li = document.createElement('li');
            li.className = 'option-item';
            
            const inputType = currentQuestion.type === "single" ? "radio" : "checkbox";
            const isChecked = isOptionChecked(currentQuestionIndex, index);
            
            // Unique name for each question to prevent cross-question interference
            const inputName = `quiz-option-q${currentQuestionIndex}`;

            const input = document.createElement('input');
            input.type = inputType;
            input.name = inputName;
            input.value = index;
            input.checked = isChecked;
            
            // Save answer immediately when clicked
            input.addEventListener('change', saveCurrentAnswer);

            const label = document.createElement('label');
            label.appendChild(input);
            label.appendChild(document.createTextNode(escapeHTML(option)));

            li.appendChild(label);
            list.appendChild(li);
        });
        answerContainer.appendChild(list);
    } else if (currentQuestion.type === "blank") {
        const previousValue = userAnswers[currentQuestionIndex] || "";
        const input = document.createElement('input');
        input.type = "text";
        input.className = "blank-input";
        input.placeholder = "Type your answer here...";
        input.value = previousValue;
        input.id = "blank-field";
        answerContainer.appendChild(input);
    }

    // Adjust navigation buttons visibility
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.classList.add('hide');
        submitBtn.classList.remove('hide');
    } else {
        nextBtn.classList.remove('hide');
        submitBtn.classList.add('hide');
    }
}

// Helper to evaluate saved checked options
function isOptionChecked(qIdx, optIdx) {
    if (userAnswers[qIdx] === undefined) return false;
    if (Array.isArray(userAnswers[qIdx])) {
        return userAnswers[qIdx].includes(optIdx);
    }
    return userAnswers[qIdx] === optIdx;
}

// Save answers explicitly before rendering next states
function saveCurrentAnswer() {
    const currentQuestion = quizData[currentQuestionIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === "single") {
        const inputName = `quiz-option-q${currentQuestionIndex}`;
        const selected = document.querySelector(`input[name="${inputName}"]:checked`);
        if (selected) {
            userAnswers[currentQuestionIndex] = parseInt(selected.value);
        }
    } else if (currentQuestion.type === "multi") {
        const inputName = `quiz-option-q${currentQuestionIndex}`;
        const checkedBoxes = document.querySelectorAll(`input[name="${inputName}"]:checked`);
        const checkedValues = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        userAnswers[currentQuestionIndex] = checkedValues;
    } else if (currentQuestion.type === "blank") {
        const inputField = document.getElementById('blank-field');
        if (inputField) {
            userAnswers[currentQuestionIndex] = inputField.value.trim();
        }
    }
}

// Handle Forward/Backward Page Buttons
function navigate(direction) {
    saveCurrentAnswer();
    currentQuestionIndex += direction;
    loadQuestion();
}

// Finalize score logic
function submitQuiz() {
    saveCurrentAnswer(); // finalize the last question's input
    
    let score = 0;

    quizData.forEach((q, index) => {
        const userAns = userAnswers[index];

        if (q.type === "single") {
            if (userAns === q.answer) score++;
        } else if (q.type === "multi") {
            if (Array.isArray(userAns)) {
                const isCorrect = userAns.length === q.answer.length && 
                                  userAns.every(val => q.answer.includes(val));
                if (isCorrect) score++;
            }
        } else if (q.type === "blank") {
            if (userAns && userAns.toLowerCase() === q.answer.toLowerCase()) {
                score++;
            }
        }
    });

    // Display results page changes
    quizUi.classList.add('hide');
    resultsUi.classList.remove('hide');
    scoreText.innerText = `${score} / ${quizData.length}`;
    
    // Give tailored feedback message
    const percentage = (score / quizData.length) * 100;
    if(score === quizData.length) {
        feedbackText.innerText = "Perfect! You got all questions correct!";
    } else if (percentage >= 70) {
        feedbackText.innerText = "Great job! You know this topic well.";
    } else if (percentage >= 50) {
        feedbackText.innerText = "Good effort! Keep practicing to improve.";
    } else {
        feedbackText.innerText = "Keep learning! Practice makes perfect.";
    }
}

function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    topicInput.value = '';
    loadingText.innerText = '';
    startBtn.disabled = false;
    topicInput.disabled = false;
    resultsUi.classList.add('hide');
    quizUi.classList.add('hide');
    topicUi.classList.remove('hide');
}

// Utility text encoder to secure HTML string injection
function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ===== NEW FUNCTIONS FOR API INTEGRATION =====

// Generate questions from Groq API
async function generateQuestionsFromAPI(topic) {
    const prompt = `Generate exactly 10 quiz questions about "${topic}" in JSON format:
- 7 single choice questions (type: "single", answer: single index like 0,1,2,3)
- 3 multi-select questions (type: "multi", answer: array of indices like [0,2])

Example format:
[
  {"type":"single","question":"Q1?","options":["A","B","C","D"],"answer":0},
  {"type":"multi","question":"Q2? (Select all that apply)","options":["A","B","C","D"],"answer":[0,2]},
  {"type":"single","question":"Q3?","options":["A","B","C","D"],"answer":1}
]

Return ONLY valid JSON array, nothing else.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a quiz generator. Return ONLY valid JSON with exactly 10 questions (7 single choice, 3 multi-select). No markdown, no explanations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const questionsText = data.choices[0].message.content;
        
        // Parse JSON from response
        const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Invalid JSON format in response');
        }

        // Clean up JSON - fix common quote escaping issues
        let cleanedJSON = jsonMatch[0];
        // Replace problematic double quotes with single quotes where needed
        cleanedJSON = cleanedJSON.replace(/""'/g, "'").replace(/''"/g, "'");
        
        const parsedQuestions = JSON.parse(cleanedJSON);
        
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error('No questions received');
        }
        
        // Validate and normalize questions
        return parsedQuestions.map((q) => ({
            type: q.type || 'single',
            question: q.question || '',
            options: q.options || [],
            answer: q.answer !== undefined ? q.answer : ''
        }));

    } catch (error) {
        loadingText.innerText = `Error: ${error.message}`;
        loadingText.style.color = '#ef4444';
        throw error;
    }
}

// Handle Start Quiz button click
async function handleStartQuiz() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        loadingText.innerText = 'Please enter a topic';
        loadingText.style.color = '#ef4444';
        return;
    }

    // Show loading state
    startBtn.disabled = true;
    topicInput.disabled = true;
    loadingText.innerText = `Generating questions about "${topic}"...`;
    loadingText.style.color = '#4f46e5';

    try {
        // Fetch questions from Groq API
        quizData = await generateQuestionsFromAPI(topic);
        
        if (quizData.length === 0) {
            throw new Error('No questions were generated');
        }

        // Reset state and show quiz
        currentQuestionIndex = 0;
        userAnswers = {};
        
        topicUi.classList.add('hide');
        quizUi.classList.remove('hide');
        
        loadQuestion();
    } catch (error) {
        startBtn.disabled = false;
        topicInput.disabled = false;
        loadingText.innerText = 'Failed to generate questions. Please try again.';
        loadingText.style.color = '#ef4444';
    }
}

// Initialize the test on script load
// Show topic selection screen first
topicUi.classList.remove('hide');
quizUi.classList.add('hide');
resultsUi.classList.add('hide');