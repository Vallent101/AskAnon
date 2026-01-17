// Storage abstraction - uses Firebase if available, otherwise localStorage
const Storage = {
    async saveQuestion(questionData) {
        if (window.firebaseEnabled && window.firebaseDatabase) {
            const questionsRef = window.firebaseRef(window.firebaseDatabase, 'questions');
            return await window.firebasePush(questionsRef, questionData);
        } else {
            // Use localStorage
            const questions = this.getQuestions();
            const id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            questions[id] = { ...questionData, id };
            localStorage.setItem('askanon_questions', JSON.stringify(questions));
            return { key: id };
        }
    },

    async saveReply(questionId, replyData) {
        if (window.firebaseEnabled && window.firebaseDatabase) {
            const repliesRef = window.firebaseRef(
                window.firebaseDatabase, 
                `questions/${questionId}/replies`
            );
            return await window.firebasePush(repliesRef, replyData);
        } else {
            // Use localStorage
            const questions = this.getQuestions();
            if (questions[questionId]) {
                if (!questions[questionId].replies) {
                    questions[questionId].replies = {};
                }
                const replyId = 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                questions[questionId].replies[replyId] = { ...replyData, id: replyId };
                localStorage.setItem('askanon_questions', JSON.stringify(questions));
                return { key: replyId };
            }
        }
    },

    getQuestions() {
        if (window.firebaseEnabled && window.firebaseDatabase) {
            return null; // Firebase handles this via onValue
        } else {
            const stored = localStorage.getItem('askanon_questions');
            return stored ? JSON.parse(stored) : {};
        }
    },

    subscribe(callback) {
        if (window.firebaseEnabled && window.firebaseDatabase) {
            const questionsRef = window.firebaseRef(window.firebaseDatabase, 'questions');
            return window.firebaseOnValue(questionsRef, (snapshot) => {
                callback(snapshot.val());
            });
        } else {
            // Simulate real-time with polling and storage events
            const updateQuestions = () => {
                callback(this.getQuestions());
            };
            
            // Initial load
            updateQuestions();
            
            // Listen for storage changes (from other tabs)
            window.addEventListener('storage', updateQuestions);
            
            // Poll for changes (for same-tab updates)
            const interval = setInterval(updateQuestions, 1000);
            
            return () => {
                clearInterval(interval);
                window.removeEventListener('storage', updateQuestions);
            };
        }
    },

    getServerTimestamp() {
        if (window.firebaseEnabled && window.firebaseServerTimestamp) {
            return window.firebaseServerTimestamp();
        } else {
            return Date.now();
        }
    }
};

// Initialize app
function initApp() {
    const questionInput = document.getElementById('questionInput');
    const postBtn = document.getElementById('postBtn');
    const questionsContainer = document.getElementById('questionsContainer');

    if (!questionInput || !postBtn || !questionsContainer) {
        console.error('Required elements not found');
        return;
    }

    // Post a new question
    postBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();
        
        if (!questionText) {
            showError('Please enter a question or confession.');
            return;
        }

        if (questionText.length > 1000) {
            showError('Question is too long. Maximum 1000 characters.');
            return;
        }

        try {
            postBtn.disabled = true;
            postBtn.textContent = 'Posting...';

            await Storage.saveQuestion({
                text: questionText,
                timestamp: Storage.getServerTimestamp(),
                replies: {}
            });

            questionInput.value = '';
            showSuccess('Question posted successfully!');
        } catch (error) {
            console.error('Error posting question:', error);
            showError('Failed to post question. Please try again.');
        } finally {
            postBtn.disabled = false;
            postBtn.textContent = 'Post Anonymously';
        }
    });

    // Allow Enter key to submit (Ctrl+Enter or Cmd+Enter)
    questionInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            postBtn.click();
        }
    });

    // Listen for questions in real-time
    Storage.subscribe((questions) => {
        if (!questions || Object.keys(questions).length === 0) {
            questionsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No questions yet</h3>
                    <p>Be the first to share something!</p>
                </div>
            `;
            return;
        }

        // Convert to array and sort by timestamp (newest first)
        const questionsArray = Object.entries(questions)
            .map(([id, question]) => ({
                id,
                ...question,
                timestamp: question.timestamp || 0
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

        displayQuestions(questionsArray);
    });

    function displayQuestions(questions) {
        questionsContainer.innerHTML = questions.map(question => {
            const date = question.timestamp 
                ? new Date(question.timestamp).toLocaleString()
                : 'Just now';
            
            const replies = question.replies || {};
            const repliesArray = Object.entries(replies)
                .map(([id, reply]) => ({
                    id,
                    ...reply,
                    timestamp: reply.timestamp || 0
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            return `
                <div class="question-card" data-question-id="${question.id}">
                    <div class="question-text">${escapeHtml(question.text)}</div>
                    <div class="question-meta">
                        <span>Posted ${date}</span>
                        <span>${repliesArray.length} ${repliesArray.length === 1 ? 'reply' : 'replies'}</span>
                    </div>
                    <div class="reply-section">
                        <div class="reply-form">
                            <textarea 
                                class="reply-input" 
                                placeholder="Write your advice or reply..."
                                rows="2"
                            ></textarea>
                            <button class="btn-reply" onclick="postReply('${question.id}', this)">Reply</button>
                        </div>
                        ${repliesArray.length > 0 ? `
                            <div class="replies-list">
                                ${repliesArray.map(reply => {
                                    const replyDate = reply.timestamp 
                                        ? new Date(reply.timestamp).toLocaleString()
                                        : 'Just now';
                                    return `
                                        <div class="reply-card">
                                            <div>${escapeHtml(reply.text)}</div>
                                            <div class="reply-meta">Replied ${replyDate}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Post a reply to a question
    window.postReply = async function(questionId, button) {
        const questionCard = button.closest('.question-card');
        const replyInput = questionCard.querySelector('.reply-input');
        const replyText = replyInput.value.trim();

        if (!replyText) {
            showError('Please enter a reply.');
            return;
        }

        if (replyText.length > 500) {
            showError('Reply is too long. Maximum 500 characters.');
            return;
        }

        try {
            button.disabled = true;
            button.textContent = 'Posting...';

            await Storage.saveReply(questionId, {
                text: replyText,
                timestamp: Storage.getServerTimestamp()
            });

            replyInput.value = '';
            showSuccess('Reply posted successfully!');
        } catch (error) {
            console.error('Error posting reply:', error);
            showError('Failed to post reply. Please try again.');
        } finally {
            button.disabled = false;
            button.textContent = 'Reply';
        }
    };

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const postSection = document.querySelector('.post-section');
        const existingError = postSection.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        postSection.insertBefore(errorDiv, postSection.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Show success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const postSection = document.querySelector('.post-section');
        const existingSuccess = postSection.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        postSection.insertBefore(successDiv, postSection.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Wait for DOM and Firebase to be ready
function startApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.firebaseReady) {
                initApp();
            } else {
                window.addEventListener('firebaseReady', initApp);
            }
        });
    } else {
        if (window.firebaseReady) {
            initApp();
        } else {
            window.addEventListener('firebaseReady', initApp);
        }
    }
}

startApp();
