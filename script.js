// Sample article data (in real app, this would come from a backend)
let articles = [
    {
        id: 1,
        title: "කෘත්‍රිම බුද්ධිය භාවිතයෙන් පාරිසරික වෙනස්කම් හඳුනාගැනීම",
        preview: "AI මගින් වනාන්තර විනාශය සහ දේශගුණික විපර්යාස හඳුනාගැනීමේ නව ක්‍රමවේදයක්...",
        author: "අමිත පෙරේරා",
        votes: 47,
        date: "2025-03-28"
    },
    {
        id: 2,
        title: "ශ්‍රී ලංකාවේ සාගර පරිසර පද්ධතිය තුළ කොරල් පර පුනරුත්ථාපනය",
        preview: "ත්‍රිකුණාමලය සහ බත්තරමුල්ල ප්‍රදේශවල සාර්ථක කොරල් පර ප්‍රතිසංස්කරණ ව්‍යාපෘති...",
        author: "නදීකා රණසිංහ",
        votes: 38,
        date: "2025-03-25"
    },
    {
        id: 3,
        title: "කොස්තාපල් බලශක්තිය: ශ්‍රී ලංකාවේ නව බලශක්ති ප්‍රභවයක්",
        preview: "වෙරළබඩ ප්‍රදේශවල රළ ශක්තියෙන් විදුලිය නිපදවීමේ හැකියාව පිළිබඳ අධ්‍යයනයක්...",
        author: "චාමින්ද විජේසේකර",
        votes: 52,
        date: "2025-03-22"
    },
    {
        id: 4,
        title: "ඖෂධීය ශාක පිළිබඳ ජනවාර්ගික විද්‍යාත්මක අධ්‍යයනය",
        preview: "උඩරට ගම්මානවල ප්‍රචලිත සාම්ප්‍රදායික ඖෂධීය ශාක පිළිබඳ විද්‍යාත්මක විමර්ශනයක්...",
        author: "සුභාෂිනී ජයවර්ධන",
        votes: 29,
        date: "2025-03-20"
    }
];

// Load articles on page load
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
    setupEventListeners();
});

function loadArticles() {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;
    
    // Sort articles by votes (most popular first)
    const sortedArticles = [...articles].sort((a, b) => b.votes - a.votes);
    
    grid.innerHTML = sortedArticles.map(article => `
        <div class="article-card" data-id="${article.id}">
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-preview">${article.preview}</p>
                <div class="article-meta">
                    <span>✍️ ${article.author}</span>
                    <span>📅 ${formatDate(article.date)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>👍 ඡන්ද: <strong id="votes-${article.id}">${article.votes}</strong></span>
                    <button class="vote-btn" onclick="voteArticle(${article.id})">🗳️ ඡන්දය දෙන්න</button>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth()+1}/${date.getDate()}`;
}

// Vote function
window.voteArticle = function(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
        article.votes++;
        document.getElementById(`votes-${articleId}`).innerText = article.votes;
        
        // Show success message
        const messageDiv = document.getElementById('generationMessage');
        if (messageDiv) {
            messageDiv.innerHTML = '<span style="color: #2c9c5c;">✓ ඔබේ ඡන්දය සටහන් විය! ස්තුතියි.</span>';
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 2000);
        }
        
        // Re-sort and reload articles to maintain order
        loadArticles();
    }
};

// Weekly edition generation
function generateWeeklyEdition() {
    const messageDiv = document.getElementById('generationMessage');
    if (!messageDiv) return;
    
    // Get top 5 articles by votes
    const topArticles = [...articles].sort((a, b) => b.votes - a.votes).slice(0, 5);
    
    if (topArticles.length === 0) {
        messageDiv.innerHTML = '<span style="color: #e67e22;">⚠️ සතිපතා කලාපය සැදීමට ප්‍රමාණවත් ලිපි නොමැත.</span>';
        return;
    }
    
    // Create edition content
    let editionHTML = `<div style="background: #ecfdf5; padding: 1rem; border-radius: 12px; margin-top: 1rem;">
        <h4>📖 සතිපතා කලාපය #${Math.floor(Math.random() * 100) + 1}</h4>
        <p>මෙම සතියේ ජනප්‍රියම ලිපි 5:</p>
        <ol style="text-align: left; margin-top: 0.5rem;">`;
    
    topArticles.forEach((article, index) => {
        editionHTML += `<li><strong>${article.title}</strong> - ඡන්ද ${article.votes}</li>`;
    });
    
    editionHTML += `</ol><p style="margin-top: 0.5rem;">✨ කලාපය සාර්ථකව නිර්මාණය විය!</p></div>`;
    
    messageDiv.innerHTML = editionHTML;
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Modal handling
function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const generateBtn = document.getElementById('generateWeeklyBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeBtns = document.querySelectorAll('.close');
    
    if (loginBtn) {
        loginBtn.onclick = () => { loginModal.style.display = 'flex'; };
    }
    
    if (registerBtn) {
        registerBtn.onclick = () => { registerModal.style.display = 'flex'; };
    }
    
    if (generateBtn) {
        generateBtn.onclick = generateWeeklyEdition;
    }
    
    // Close modals
    closeBtns.forEach(btn => {
        btn.onclick = () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        };
    });
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        if (event.target === loginModal) loginModal.style.display = 'none';
        if (event.target === registerModal) registerModal.style.display = 'none';
    };
    
    // Form submissions (demo only)
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            alert('🔐 පිවිසුම සාර්ථකයි! (මෙය ආදර්ශනයක් පමණයි)');
            loginModal.style.display = 'none';
        };
    }
    
    if (registerForm) {
        registerForm.onsubmit = (e) => {
            e.preventDefault();
            alert('📝 ලියාපදිංචිය සාර්ථකයි! දැන් ඔබට ලිපි ඉදිරිපත් කළ හැක. (මෙය ආදර්ශනයක් පමණයි)');
            registerModal.style.display = 'none';
        };
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});