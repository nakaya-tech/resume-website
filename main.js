// Three.js 全局对象已通过script标签加载
// THREE 和 THREE.GLTFLoader 现在可以直接使用

// ==================== 音乐播放器 ====================
let bgMusic = null;
let isPlaying = false;
let isPlayerExpanded = false;
let currentSongIndex = 0;
let progressInterval = null;

// 歌曲列表
const songs = [
    { name: "Normal No More", artist: "TYSM", file: "music/background.mp3" },
    { name: "卡农", artist: "dylanf", file: "music/song2.mp3" },
    { name: "Lightning Momen", artist: "AIRUI KE", file: "music/song3.mp3" },
    { name: "Levitating Too", artist: "Mobie", file: "music/song4.mp3" }
];

// 初始化播放器
function initMusicPlayer() {
    bgMusic = document.getElementById('bg-music');
    if (!bgMusic) return;
    
    // 设置初始歌曲
    updateSongInfo(songs[0]);
    
    // 音频事件监听
    bgMusic.addEventListener('loadedmetadata', () => {
        updateTimeDisplay();
    });
    
    bgMusic.addEventListener('timeupdate', () => {
        updateProgress();
    });
    
    bgMusic.addEventListener('ended', () => {
        nextSong();
    });
    
    // 添加错误处理
    bgMusic.addEventListener('error', (e) => {
        console.log('音乐加载失败，不影响其他功能');
    });
    
    bgMusic.addEventListener('abort', (e) => {
        console.log('音乐加载被中止，不影响其他功能');
    });
    
    // 进度条点击
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            seekTo(e);
        });
    }
    
    // 恢复播放状态
    const savedPlaying = localStorage.getItem('musicPlaying');
    const savedIndex = localStorage.getItem('currentSongIndex');
    if (savedIndex !== null) {
        currentSongIndex = parseInt(savedIndex);
        updateSongInfo(songs[currentSongIndex]);
        bgMusic.src = songs[currentSongIndex].file;
    }
    
    if (savedPlaying === 'true') {
        // 用户点击页面后自动播放
        document.addEventListener('click', () => {
            if (!isPlaying) {
                bgMusic.play().then(() => {
                    isPlaying = true;
                    updatePlayButton();
                    const vinyl = document.getElementById('vinyl');
                    const needle = document.querySelector('.needle');
                    if (vinyl) vinyl.classList.add('playing');
                    if (needle) needle.classList.add('playing');
                }).catch(e => console.log('等待用户交互'));
            }
        }, { once: true });
    }
    
    checkSongNameLength();
}

// 切换播放器展开/收起
function togglePlayer() {
    const player = document.getElementById('musicPlayer');
    isPlayerExpanded = !isPlayerExpanded;
    
    if (isPlayerExpanded) {
        player.classList.add('expanded');
    } else {
        player.classList.remove('expanded');
    }
    
    localStorage.setItem('playerExpanded', isPlayerExpanded);
}

// 播放/暂停
function togglePlay() {
    if (!bgMusic) return;
    
    const vinyl = document.getElementById('vinyl');
    const needle = document.querySelector('.needle');
    
    // 先切换状态，确保按钮立即响应
    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
        stopProgressUpdate();
        if (vinyl) vinyl.classList.remove('playing');
        if (needle) needle.classList.remove('playing');
    } else {
        isPlaying = true;
        if (vinyl) vinyl.classList.add('playing');
        if (needle) needle.classList.add('playing');
        startProgressUpdate();
        
        bgMusic.play().catch(e => {
            console.log('需要用户交互');
            isPlaying = false;
            if (vinyl) vinyl.classList.remove('playing');
            if (needle) needle.classList.remove('playing');
            stopProgressUpdate();
        });
    }
    
    updatePlayButton();
    localStorage.setItem('musicPlaying', isPlaying);
}

// 上一首
function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
}

// 下一首
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
}

// 加载指定歌曲
function loadSong(index) {
    if (!bgMusic) return;
    
    currentSongIndex = index;
    const song = songs[index];
    bgMusic.src = song.file;
    updateSongInfo(song);
    
    const vinyl = document.getElementById('vinyl');
    const needle = document.querySelector('.needle');
    
    if (isPlaying) {
        bgMusic.play().then(() => {
            startProgressUpdate();
            if (vinyl) vinyl.classList.add('playing');
            if (needle) needle.classList.add('playing');
        }).catch(e => console.log(e));
    } else {
        if (vinyl) vinyl.classList.remove('playing');
        if (needle) needle.classList.remove('playing');
    }
    
    localStorage.setItem('currentSongIndex', index);
    checkSongNameLength();
}

// 更新歌曲信息显示
function updateSongInfo(song) {
    const songNameEl = document.getElementById('songName');
    const songArtistEl = document.getElementById('songArtist');
    
    if (songNameEl) songNameEl.textContent = song.name;
    if (songArtistEl) songArtistEl.textContent = song.artist;
}

// 更新播放按钮状态
function updatePlayButton() {
    const playIcon = document.getElementById('playIcon');
    if (playIcon) {
        playIcon.textContent = isPlaying ? '⏸' : '▶';
    }
}

// 检查歌曲名长度，决定是否滚动
function checkSongNameLength() {
    const songNameEl = document.getElementById('songName');
    const container = document.querySelector('.song-name-container');
    
    if (!songNameEl || !container) return;
    
    const textWidth = songNameEl.scrollWidth;
    const containerWidth = container.clientWidth;
    
    if (textWidth > containerWidth) {
        songNameEl.classList.remove('no-scroll');
    } else {
        songNameEl.classList.add('no-scroll');
    }
}

// 开始进度更新
function startProgressUpdate() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 100);
}

// 停止进度更新
function stopProgressUpdate() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// 更新进度条
function updateProgress() {
    if (!bgMusic || !bgMusic.duration) return;
    
    const progress = (bgMusic.currentTime / bgMusic.duration) * 100;
    const progressFill = document.getElementById('progressFill');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    updateTimeDisplay();
}

// 更新时间显示
function updateTimeDisplay() {
    if (!bgMusic) return;
    
    const currentEl = document.getElementById('currentTime');
    const totalEl = document.getElementById('totalTime');
    
    if (currentEl) {
        currentEl.textContent = formatTime(bgMusic.currentTime);
    }
    
    if (totalEl && bgMusic.duration) {
        totalEl.textContent = formatTime(bgMusic.duration);
    }
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 跳转到指定位置
function seekTo(e) {
    if (!bgMusic || !bgMusic.duration) return;
    
    const progressBar = document.getElementById('progressBar');
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * bgMusic.duration;
    
    bgMusic.currentTime = seekTime;
}

// ==================== 主题切换 ====================
let currentTheme = 'theme-day';

window.toggleTheme = function() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.classList.contains('theme-night')) {
        body.classList.remove('theme-night');
        body.classList.add('theme-day');
        currentTheme = 'theme-day';
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        body.classList.remove('theme-day');
        body.classList.add('theme-night');
        currentTheme = 'theme-night';
        if (themeIcon) themeIcon.textContent = '🌙';
    }
    
    localStorage.setItem('preferred-theme', currentTheme);
}

// 加载保存的主题
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
        const body = document.body;
        body.classList.remove('theme-day', 'theme-night');
        body.classList.add(savedTheme);
        currentTheme = savedTheme;
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = savedTheme === 'theme-night' ? '🌙' : '☀️';
        }
    }
}

// ==================== 首页功能 ====================
const quotes = [
    { cn: "道阻且长，行则将至；行而不辍，未来可期。", en: "The road ahead is long and winding, but we will reach our destination if we keep moving forward." },
    { cn: "生活不是等待暴风雨过去，而是要学会在雨中跳舞。", en: "Life isn't about waiting for the storm to pass, it's about learning to dance in the rain." },
    { cn: "每一个清晨都是新的开始，每一个黄昏都是新的收获。", en: "Every morning is a new beginning, every evening is a new harvest." },
    { cn: "心若向阳，无畏悲伤；梦在远方，路在脚下。", en: "If your heart faces the sun, you fear no sorrow; if your dream is in the distance, the road is beneath your feet." },
    { cn: "不是看到希望才坚持，而是坚持了才看到希望。", en: "It's not that we see hope before we persist, but that we see hope because we persist." },
    { cn: "生命中最美好的事情，往往是那些最不期而遇的惊喜。", en: "The best things in life are often those unexpected surprises." },
    { cn: "你的态度决定你的高度，你的行动决定你的成就。", en: "Your attitude determines your altitude, your actions determine your achievements." },
    { cn: "不要让昨天的遗憾，影响今天的选择；不要让明天的担忧，干扰今天的快乐。", en: "Don't let yesterday's regrets affect today's choices; don't let tomorrow's worries interfere with today's happiness." },
    { cn: "成功不是终点，失败也不是末日，最重要的是继续前进的勇气。", en: "Success is not final, failure is not fatal: it is the courage to continue that counts." },
    { cn: "人生如逆旅，我亦是行人。", en: "Life is like a journey against the current, and I am just a traveler." }
];

let currentQuoteIndex = -1;
let quoteInterval = null;

function initClock() {
    const clockElement = document.getElementById('welcome-clock');
    if (!clockElement) return;

    function updateClock() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    updateClock();
    setInterval(updateClock, 60000);
}

function getRandomQuoteIndex() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * quotes.length);
    } while (randomIndex === currentQuoteIndex);
    return randomIndex;
}

function showNewQuote() {
    const quoteElement = document.getElementById('quote-text');
    const containerElement = document.getElementById('quote-container');
    
    if (!quoteElement || !containerElement) return;

    quoteElement.classList.add('fade-out');

    setTimeout(() => {
        currentQuoteIndex = getRandomQuoteIndex();
        const quote = quotes[currentQuoteIndex];
        
        const isChinese = Math.random() > 0.5;
        quoteElement.textContent = isChinese ? quote.cn : quote.en;
        
        quoteElement.classList.remove('fade-out');
        quoteElement.classList.add('fade-in');
        
        setTimeout(() => {
            quoteElement.classList.remove('fade-in');
        }, 500);
    }, 500);
}

function initQuotes() {
    const containerElement = document.getElementById('quote-container');
    if (!containerElement) return;

    showNewQuote();
    quoteInterval = setInterval(showNewQuote, 10000);
    containerElement.addEventListener('click', showNewQuote);
}

// ==================== 顶部状态栏时间显示 ====================
function initTopBarTime() {
    const timeElement = document.getElementById('top-bar-time');
    if (!timeElement) return;

    function updateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[now.getDay()];
        timeElement.textContent = `${year}.${month}.${day} ${weekday} ${hours}:${minutes}`;
    }

    updateTime();
    setInterval(updateTime, 60000);
}

// ==================== 简历页面导航 ====================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav__item, .top-bar__nav-item');
    const sections = document.querySelectorAll('.content__section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 平滑滚动到目标区域
            const targetId = item.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    e.preventDefault();
                    const topBarHeight = document.querySelector('.top-bar')?.offsetHeight || 60;
                    const targetPosition = targetSection.offsetTop - topBarHeight - 30;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const observerOptions = {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    if (nav.dataset.section === id) {
                        nav.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

// ==================== 联系方式模态窗口 ====================
function initContactModal() {
    const contactBtn = document.getElementById('contactBtn');
    const contactModal = document.getElementById('contactModal');
    const closeModal = document.getElementById('closeModal');
    
    // 如果在 space.html 页面才执行
    if (!contactBtn || !contactModal) return;
    
    // 打开模态窗口
    function openModal() {
        contactModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 禁止页面滚动
    }
    
    // 关闭模态窗口
    function closeModalFunc() {
        contactModal.classList.remove('active');
        document.body.style.overflow = ''; // 恢复页面滚动
    }
    
    // 点击联系方式按钮
    contactBtn.addEventListener('click', openModal);
    
    // 点击关闭按钮
    closeModal.addEventListener('click', closeModalFunc);
    
    // 点击遮罩层关闭
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeModalFunc();
        }
    });
    
    // 按 ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal.classList.contains('active')) {
            closeModalFunc();
        }
    });
}

// ==================== 生活瞬间照片展示 ====================
function initPhotoGallery() {
    const photoModal = document.getElementById('photo-modal');
    const modalImg = document.getElementById('photo-modal-img');
    const modalClose = document.querySelector('.photo-modal-close');
    const photoItems = document.querySelectorAll('.photo-item');
    
    if (!photoModal) return;
    
    // 打开照片模态窗口
    photoItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                modalImg.src = img.src.replace('400', '800'); // 加载更大尺寸
                photoModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // 禁止页面滚动
            }
        });
    });
    
    // 关闭模态窗口
    function closePhotoModal() {
        photoModal.classList.remove('active');
        document.body.style.overflow = ''; // 恢复页面滚动
    }
    
    // 点击关闭按钮
    if (modalClose) {
        modalClose.addEventListener('click', closePhotoModal);
    }
    
    // 点击遮罩层关闭
    photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) {
            closePhotoModal();
        }
    });
    
    // 按 ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && photoModal.classList.contains('active')) {
            closePhotoModal();
        }
    });
}

// ==================== AI智能助手聊天功能 ====================
// 豆包API配置 - 通过后端代理访问，前端不需要密钥
const DOUBAO_CONFIG = {
    USE_DOUBAO_API: true // 设置为true启用豆包API，false使用本地模拟回复
};

// AI预设回复列表（当不使用豆包API时使用）
const aiResponses = {
    greeting: [
        '你好！很高兴为你服务！',
        '嗨！有什么可以帮助你的吗？',
        '你好呀！我是你的AI助手~'
    ],
    about: [
        '我是一个AI智能助手，由武靖皓创建。我可以回答问题、提供帮助。',
        '我是武靖皓的AI助手，随时为你服务！',
        '我是一个智能聊天机器人，能够进行自然语言对话。'
    ],
    resume: [
        '武靖皓毕业于南昌大学工业工程专业，有丰富的实习经历和社团经验。',
        '你可以通过页面导航了解更多关于武靖皓的信息，包括教育背景、实习经历、专业技能等。',
        '武靖皓的个人简历页面包含教育背景、实习经历、竞赛经历、专业技能等详细信息。'
    ],
    hobby: [
        '武靖皓的兴趣爱好包括阅读、游戏、创作、运动、艺术和AI探索。',
        '阅读：诗词、散文、科幻、哲学；运动：健身、足球、旅行、登山；艺术：BBox、吉他、唱歌、Rap。',
        '武靖皓喜欢探索AI技术，包括AI绘画、AI视频和Prompt工程。'
    ],
    project: [
        '武靖皓参与过哈啰出行的光合青年有爱相机项目，负责产品运营工作。',
        '在江西联通担任新媒体运营实习生，负责抖音和小红书账号运营。',
        '参与江西省案例分析大赛，担任组长获得校决赛二等奖。'
    ],
    default: [
        '这是一个有趣的问题！让我想想...',
        '感谢你的提问，我会尽力回答！',
        '这个问题很有意思，让我整理一下思路...',
        '我正在学习更多知识，以便更好地回答你的问题！',
        '你的问题很有深度，让我思考一下...'
    ],
    thanks: [
        '不客气！很高兴能帮到你！',
        '不用谢！有问题随时找我~',
        '能帮到你是我的荣幸！'
    ],
    skill: [
        '武靖皓精通剪映、醒图、Office、CAD和AI工具应用。',
        '核心技能包括创意设计、办公效率、工程设计和智能技术应用。',
        '辅助技能包括3DMAX、SPSS、LINGO和SQL数据库查询。'
    ],
    education: [
        '南昌大学工业工程专业，2023年入学，预计2027年毕业。',
        '主修课程包括基础工业工程、经济学、统计学、可靠性工程、系统工程等。',
        '南昌大学是211院校，工业工程学科评估为B+。'
    ]
};

// 获取本地模拟回复
function getLocalResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('你好') || lowerMessage.includes('嗨') || lowerMessage.includes('hello')) {
        return aiResponses.greeting[Math.floor(Math.random() * aiResponses.greeting.length)];
    }
    if (lowerMessage.includes('关于') || lowerMessage.includes('你是谁') || lowerMessage.includes('自我介绍')) {
        return aiResponses.about[Math.floor(Math.random() * aiResponses.about.length)];
    }
    if (lowerMessage.includes('简历') || lowerMessage.includes('个人简介') || lowerMessage.includes('介绍自己')) {
        return aiResponses.resume[Math.floor(Math.random() * aiResponses.resume.length)];
    }
    if (lowerMessage.includes('爱好') || lowerMessage.includes('兴趣') || lowerMessage.includes('喜欢')) {
        return aiResponses.hobby[Math.floor(Math.random() * aiResponses.hobby.length)];
    }
    if (lowerMessage.includes('项目') || lowerMessage.includes('实习') || lowerMessage.includes('工作')) {
        return aiResponses.project[Math.floor(Math.random() * aiResponses.project.length)];
    }
    if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢') || lowerMessage.includes('thank')) {
        return aiResponses.thanks[Math.floor(Math.random() * aiResponses.thanks.length)];
    }
    if (lowerMessage.includes('技能') || lowerMessage.includes('专业') || lowerMessage.includes('能力')) {
        return aiResponses.skill[Math.floor(Math.random() * aiResponses.skill.length)];
    }
    if (lowerMessage.includes('教育') || lowerMessage.includes('学校') || lowerMessage.includes('学习')) {
        return aiResponses.education[Math.floor(Math.random() * aiResponses.education.length)];
    }
    
    return aiResponses.default[Math.floor(Math.random() * aiResponses.default.length)];
}

// 调用代理服务器获取智能回复
async function getDoubaoResponse(userMessage) {
    const response = await fetch('/api/doubao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { 
                    role: 'system', 
                    content: '你是一个可爱活泼的AI助手，说话简短亲切，语气软萌。用户正在浏览武靖皓的个人简历页面，你可以介绍他的教育背景、实习经历、专业技能等信息。' 
                },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 发送消息
async function sendMessage() {
    console.log('sendMessage called');
    
    const input = document.getElementById('aiInput');
    const chatBox = document.getElementById('aiChatBox');
    
    if (!input || !chatBox) {
        console.error('元素未找到');
        return;
    }
    
    const message = input.value.trim();
    
    if (!message) {
        console.log('消息为空');
        return;
    }
    
    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = '<span class="message-text">' + message + '</span>';
    chatBox.appendChild(userMessage);
    
    // 清空输入框
    input.value = '';
    
    // 滚动到底部
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // 添加打字状态
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message ai-message typing';
    typingIndicator.innerHTML = '<span class="typing-indicator"></span><span class="typing-indicator"></span><span class="typing-indicator"></span>';
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    try {
        let aiReplyText;
        
        if (DOUBAO_CONFIG.USE_DOUBAO_API) {
            // 使用豆包API
            console.log('使用豆包API');
            aiReplyText = await getDoubaoResponse(message);
        } else {
            // 使用本地模拟回复
            console.log('使用本地回复');
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
            aiReplyText = getLocalResponse(message);
        }
        
        // 移除打字状态
        chatBox.removeChild(typingIndicator);
        
        // 添加AI回复
        const aiReply = document.createElement('div');
        aiReply.className = 'chat-message ai-message';
        aiReply.innerHTML = '<span class="message-text">' + aiReplyText + '</span>';
        chatBox.appendChild(aiReply);
        
        // 滚动到底部
        chatBox.scrollTop = chatBox.scrollHeight;
        
    } catch (error) {
        console.error('AI回复失败:', error);
        // 移除打字状态
        chatBox.removeChild(typingIndicator);
        
        // 显示错误信息，回退到本地回复
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message ai-message';
        errorMessage.innerHTML = '<span class="message-text">' + getLocalResponse(message) + '</span>';
        chatBox.appendChild(errorMessage);
        
        // 滚动到底部
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// ==================== 语音识别功能 ====================
let recognition = null;
let isRecording = false;

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';

        recognition.onstart = function() {
            isRecording = true;
            const voiceBtn = document.getElementById('aiVoiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
                voiceBtn.textContent = '🎙️';
            }
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('aiChatInput');
            if (input) {
                input.value = transcript;
            }
        };

        recognition.onerror = function(event) {
            console.error('语音识别错误:', event.error);
            stopVoiceInput();
        };

        recognition.onend = function() {
            stopVoiceInput();
        };
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        initVoiceRecognition();
        if (!recognition) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function stopVoiceInput() {
    isRecording = false;
    const voiceBtn = document.getElementById('aiVoiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.textContent = '🎤';
    }
}

// ==================== AI聊天面板功能 ====================
function openChatPanel() {
    const panel = document.getElementById('aiChatPanel');
    if (panel) {
        panel.classList.add('show');
        setTimeout(() => {
            const input = document.getElementById('aiChatInput');
            if (input) input.focus();
        }, 300);
    }
}

function closeChatPanel() {
    const panel = document.getElementById('aiChatPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

async function sendChatMessage() {
    const input = document.getElementById('aiChatInput');
    const chatMessages = document.getElementById('aiChatMessages');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 显示用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = '<span class="message-text">' + message + '</span>';
    chatMessages.appendChild(userMessage);
    
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 显示加载状态
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-message ai-message loading';
    loadingMessage.innerHTML = '<span class="message-text">思考中...</span>';
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        let aiReplyText;
        
        if (DOUBAO_CONFIG.USE_DOUBAO_API && DOUBAO_CONFIG.API_KEY && DOUBAO_CONFIG.ENDPOINT_ID) {
            // 使用豆包API
            const response = await fetch('/api/doubao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: '你是一个可爱活泼的AI助手，说话简短亲切，语气软萌。用户正在浏览武靖皓的个人简历页面，你可以介绍他的教育背景、实习经历、专业技能等信息。' },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            aiReplyText = data.choices?.[0]?.message?.content || getLocalResponse(message);
        } else {
            // 使用本地模拟回复
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
            aiReplyText = getLocalResponse(message);
        }
        
        chatMessages.removeChild(loadingMessage);
        
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message ai-message';
        aiMessage.innerHTML = '<span class="message-text">' + aiReplyText + '</span>';
        chatMessages.appendChild(aiMessage);
        
    } catch (error) {
        chatMessages.removeChild(loadingMessage);
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message ai-message';
        errorMessage.innerHTML = '<span class="message-text">' + getLocalResponse(message) + '</span>';
        chatMessages.appendChild(errorMessage);
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== Three.js 3D模型加载与渲染 ====================
let scene, camera, renderer, model, mixer, clock;
let isModelLoaded = false;
let animationId = null;

function init3DModel() {
    const container = document.getElementById('ai3DContainer');
    const canvas = document.getElementById('ai3DCanvas');
    
    if (!container || !canvas) {
        console.error('找不到3D容器或Canvas元素');
        return;
    }
    
    console.log('开始初始化3D场景...');
    
    if (typeof THREE === 'undefined') {
        console.error('Three.js 未加载');
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">Three.js 加载失败</div>';
        return;
    }
    
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('GLTFLoader 未加载');
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">GLTFLoader 加载失败</div>';
        return;
    }
    
    try {
        scene = new THREE.Scene();
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        if (width === 0 || height === 0) {
            console.error('容器尺寸为0');
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">容器尺寸无效，请检查CSS样式</div>';
            return;
        }
        
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 4);
        console.log('相机创建完成');
        
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        console.log('渲染器创建完成');
        
        // 灯光 - 解决模型发黑/白膜问题
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(2, 2, 2);
        dirLight.castShadow = true;
        scene.add(dirLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-2, 2, -2);
        scene.add(fillLight);
        
        console.log('灯光设置完成');
        
        // 创建GLTFLoader
        const loader = new THREE.GLTFLoader();
        console.log('开始加载模型...');
        console.log('模型路径:', './3D_MODEL.glb');
        
        loader.load(
            './3D_MODEL.glb',
            (gltf) => {
                console.log('✅ 模型加载成功');
                console.log('场景对象:', gltf.scene);
                console.log('动画数量:', gltf.animations.length);
                
                model = gltf.scene;
                
                // 计算模型边界框，自动调整大小和位置
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                
                console.log('模型尺寸:', size);
                console.log('计算缩放:', scale);
                
                model.scale.set(scale, scale, scale);
                model.position.set(-center.x * scale, -center.y * scale, 0);
                
                scene.add(model);
                
                // 播放动画
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                    console.log('播放动画');
                }
                
                isModelLoaded = true;
                console.log('3D模型加载完成');
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round(progress.loaded / progress.total * 100);
                    console.log('加载进度：', percent + '%');
                }
            },
            (err) => {
                console.error('❌ 模型加载失败：', err);
                const errorMsg = err.message || err.toString();
                container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">🤖 模型加载失败<br><small>' + errorMsg + '</small></div>';
            }
        );
        
        // 点击打开聊天对话框
        container.addEventListener('click', function () {
            openChatDialog();
        });
        
        // 鼠标悬停效果
        container.addEventListener('mouseenter', function () {
            if (model) {
                model.scale.multiplyScalar(1.1);
            }
        });
        
        container.addEventListener('mouseleave', function () {
            if (model) {
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                model.scale.set(scale, scale, scale);
            }
        });
        
        // 渲染循环
        function animate() {
            animationId = requestAnimationFrame(animate);
            
            if (mixer && isModelLoaded) {
                mixer.update(0.016);
            }
            
            // 模型轻微旋转
            if (model && isModelLoaded) {
                model.rotation.y += 0.002;
            }
            
            renderer.render(scene, camera);
        }
        
        animate();
        window.addEventListener('resize', onWindowResize);
        
        console.log('3D场景初始化完成');
    } catch (e) {
        console.error('3D初始化失败:', e);
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">🤖 3D功能加载失败<br><small>' + e.message + '</small></div>';
    }
}

function onWindowResize() {
    const container = document.getElementById('ai3DContainer');
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}




// ==================== 回到顶部功能 ====================
function scrollToTop() {
    const currentScroll = window.scrollY;
    const scrollDuration = 500; // 滚动持续时间（毫秒）
    const startTime = performance.now();
    
    function smoothScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        
        // 使用easeOutCubic缓动函数
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, currentScroll * (1 - easeOutCubic));
        
        if (progress < 1) {
            requestAnimationFrame(smoothScroll);
        }
    }
    
    requestAnimationFrame(smoothScroll);
}

// ==================== 页面加载初始化 ====================
// ==================== AI聊天对话框功能 ====================
function openChatDialog() {
    const overlay = document.getElementById('chatDialogOverlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const input = document.getElementById('aiDialogInput');
            if (input) input.focus();
        }, 300);
    }
}

function closeChatDialog() {
    const overlay = document.getElementById('chatDialogOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function sendDialogMessage() {
    const input = document.getElementById('aiDialogInput');
    const chatContent = document.getElementById('chatDialogContent');
    const message = input.value.trim();
    
    if (!message || !chatContent) return;
    
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = '<span class="message-text">' + message + '</span>';
    chatContent.appendChild(userMessage);
    
    input.value = '';
    chatContent.scrollTop = chatContent.scrollHeight;
    
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-message ai-message loading';
    loadingMessage.innerHTML = '<span class="message-text">思考中...</span>';
    chatContent.appendChild(loadingMessage);
    chatContent.scrollTop = chatContent.scrollHeight;
    
    try {
        let aiReplyText;
        
        if (DOUBAO_CONFIG.USE_DOUBAO_API) {
            const response = await fetch('/api/doubao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: '你是一个可爱活泼的AI助手，说话简短亲切，语气软萌。用户正在浏览武靖皓的个人简历页面，你可以介绍他的教育背景、实习经历、专业技能等信息。' },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            aiReplyText = data.choices?.[0]?.message?.content || getLocalResponse(message);
        } else {
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
            aiReplyText = getLocalResponse(message);
        }
        
        chatContent.removeChild(loadingMessage);
        
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message ai-message';
        aiMessage.innerHTML = '<span class="message-text">' + aiReplyText + '</span>';
        chatContent.appendChild(aiMessage);
        
    } catch (error) {
        chatContent.removeChild(loadingMessage);
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message ai-message';
        errorMessage.innerHTML = '<span class="message-text">' + getLocalResponse(message) + '</span>';
        chatContent.appendChild(errorMessage);
    }
    
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 将所有函数暴露到全局作用域，确保HTML的onclick可以访问
window.togglePlayer = togglePlayer;
window.togglePlay = togglePlay;
window.prevSong = prevSong;
window.nextSong = nextSong;
window.seekTo = seekTo;
window.openChatPanel = openChatPanel;
window.closeChatPanel = closeChatPanel;
window.sendChatMessage = sendChatMessage;
window.toggleVoiceInput = toggleVoiceInput;
window.scrollToTop = scrollToTop;
window.openChatDialog = openChatDialog;
window.closeChatDialog = closeChatDialog;
window.submitGuestbook = submitGuestbook;
window.likeMessage = likeMessage;

async function loadGuestbook() {
    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();
        renderGuestbook(messages);
    } catch (error) {
        console.error('加载留言失败:', error);
    }
}

function renderGuestbook(messages) {
    const list = document.getElementById('guestbookList');
    if (!list) return;
    
    if (messages.length === 0) {
        list.innerHTML = `
            <div class="guestbook-empty">
                <div class="guestbook-empty-icon">💬</div>
                <p>还没有留言，快来留下你的足迹吧！</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = messages.map((msg, index) => `
        <div class="guestbook-item" style="animation-delay: ${index * 0.1}s;">
            <div class="guestbook-item-header">
                <span class="guestbook-name">${escapeHtml(msg.name)}</span>
                <span class="guestbook-time">${msg.time}</span>
            </div>
            <p class="guestbook-content">${escapeHtml(msg.content)}</p>
            <div class="guestbook-item-footer">
                <button class="guestbook-delete-btn" onclick="deleteMessage(${msg.id})">
                    <span>🗑️</span>
                    <span>删除</span>
                </button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function submitGuestbook() {
    const name = document.getElementById('guestbookName').value.trim();
    const email = document.getElementById('guestbookEmail').value.trim();
    const content = document.getElementById('guestbookMessageContent').value.trim();
    
    if (!name) {
        alert('请输入您的昵称');
        return;
    }
    
    if (!content) {
        alert('请输入留言内容');
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, content })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('guestbookName').value = '';
            document.getElementById('guestbookEmail').value = '';
            document.getElementById('guestbookMessageContent').value = '';
            loadGuestbook();
        } else {
            alert(result.message || '留言失败');
        }
    } catch (error) {
        console.error('提交留言失败:', error);
        alert('留言失败，请稍后重试');
    }
}

async function likeMessage(id, button) {
    // 点赞功能已禁用
}

// 验证密码后删除留言
window.deleteMessage = async function(id) {
    const password = prompt('请输入管理员密码：');
    
    if (!password) return;
    
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 密码验证成功，删除留言
            await fetch(`/api/messages/${id}`, {
                method: 'DELETE'
            });
            loadGuestbook();
        } else {
            alert('密码错误');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    initMusicPlayer();
    initClock();
    initTopBarTime();
    initQuotes();
    initNavigation();
    initContactModal();
    initPhotoGallery();
    init3DModel();
    initVoiceRecognition();
    
    const savedExpanded = localStorage.getItem('playerExpanded');
    if (savedExpanded === 'true') {
        togglePlayer();
    }
    
    // 滚动监听：控制"回到顶部"按钮的显示/隐藏
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }

    // ==================== 个人空间功能 ====================
    let currentPage = 1;
    let isLoading = false;
    let hasMoreMoments = true;

    // 生活瞬间数据
    // ==========================================
    // 使用服务器存储，支持多浏览器同步
    // ==========================================
    let momentsData = [];
    
    // 从服务器加载数据
    async function loadMomentsFromServer() {
        try {
            const response = await fetch('/api/moments');
            if (response.ok) {
                momentsData = await response.json();
            }
        } catch (e) {
            console.error('从服务器加载数据失败:', e);
        }
    }
    
    // 保存到服务器
    async function saveMomentToServer(moment) {
        try {
            const response = await fetch('/api/moments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moment)
            });
            return response.ok;
        } catch (e) {
            console.error('保存到服务器失败:', e);
            return false;
        }
    }
    
    // 更新点赞到服务器
    async function updateLikeToServer(id) {
        try {
            const response = await fetch(`/api/moments/${id}/like`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (e) {
            console.error('更新点赞失败:', e);
            return false;
        }
    }
    
    // 从服务器删除
    async function deleteMomentFromServer(id) {
        try {
            const response = await fetch(`/api/moments/${id}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (e) {
            console.error('删除失败:', e);
            return false;
        }
    }

    const ADMIN_PASSWORD = '123456';
    
    // 验证管理员密码
    function verifyAdmin() {
        const password = prompt('请输入管理员密码：');
        return password === ADMIN_PASSWORD;
    }
    
    // 验证密码后打开发布
    window.verifyAdminAndPublish = function() {
        if (verifyAdmin()) {
            window.openPublishModal();
        } else {
            alert('密码错误！');
        }
    };
    
    // 验证密码后删除
    window.deleteMoment = async function(id) {
        if (!verifyAdmin()) {
            alert('密码错误！');
            return;
        }
        
        if (confirm('确定要删除这条生活瞬间吗？')) {
            const index = momentsData.findIndex(m => m.id === id);
            if (index > -1) {
                momentsData.splice(index, 1);
            }

            await deleteMomentFromServer(id);

            const card = document.querySelector(`.moment-card[data-id="${id}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.remove();
                    if (momentsData.length === 0) {
                        checkEmptyState();
                    }
                }, 300);
            }

            updateMomentsCount();
            updateStats();
            closeMomentDetail();
        }
    };
    
    // 切换标签页
    window.switchTab = function(tabName) {
        // 切换标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // 切换内容区域
        document.querySelectorAll('.personal-content').forEach(content => content.classList.remove('active'));
        
        // 访客留言的内容区域 ID 不同，需要特殊处理
        if (tabName === 'guestbook') {
            document.getElementById('guestbookContentArea').classList.add('active');
        } else {
            document.getElementById(`${tabName}Content`).classList.add('active');
        }
        
        // 如果切换到生活瞬间，确保数据已加载
        if (tabName === 'moments' && momentsData.length === 0) {
            loadMomentsFromServer();
        }
        
        // 如果切换到访客留言，加载留言数据
        if (tabName === 'guestbook') {
            loadGuestbook();
        }
    };
    
    // 打开个人空间
    window.openPersonalSpace = async function() {
        const modal = document.getElementById('personalSpaceModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // 默认显示生活瞬间
            switchTab('moments');
            // 从服务器加载最新数据
            await loadMomentsFromServer();
            // 检查是否为空，显示提示
            checkEmptyState();
        }
    };

    // 检查并显示空状态
    function checkEmptyState() {
        const grid = document.getElementById('momentsGrid');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        if (loadingIndicator) {
            loadingIndicator.classList.remove('show');
        }
        
        if (momentsData.length === 0 && grid) {
            grid.innerHTML = `
                <div class="moments-empty">
                    <div class="moments-empty-icon">📷</div>
                    <p class="moments-empty-text">还没有发布任何内容</p>
                    <p class="moments-empty-hint">点击右上角的"发布"按钮，分享你的第一个瞬间</p>
                </div>
            `;
        } else if (momentsData.length > 0 && grid && grid.querySelectorAll('.moment-card').length === 0) {
            // 如果有数据但grid中没有卡片，重新加载所有内容
            grid.innerHTML = '';
            momentsData.forEach((moment, index) => {
                const card = createMomentCard(moment);
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                grid.appendChild(card);
                
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // 更新统计数据
            updateMomentsCount();
            updateStats();
        }
    }

    // 关闭个人空间
    window.closePersonalSpace = function() {
        const modal = document.getElementById('personalSpaceModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    function initHeaderDrag() {
        const headerBgContainer = document.getElementById('headerBgContainer');
        const headerBg = document.getElementById('headerBg');
        
        if (!headerBgContainer || !headerBg) return;

        // 双击查看完整图片
        headerBgContainer.addEventListener('dblclick', function() {
            openImagePreview(headerBg.src);
        });
    }

    // 打开图片预览
    function openImagePreview(imageSrc) {
        let previewModal = document.getElementById('imagePreviewModal');
        
        if (!previewModal) {
            previewModal = document.createElement('div');
            previewModal.id = 'imagePreviewModal';
            previewModal.className = 'image-preview-modal';
            previewModal.innerHTML = `
                <div class="image-preview-content">
                    <button class="image-preview-close" onclick="closeImagePreview()">×</button>
                    <img id="previewImage" src="" alt="预览图片">
                </div>
            `;
            document.body.appendChild(previewModal);
            
            previewModal.addEventListener('click', function(e) {
                if (e.target === previewModal) {
                    closeImagePreview();
                }
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeImagePreview();
                }
            });
        }
        
        document.getElementById('previewImage').src = imageSrc;
        previewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 关闭图片预览
    window.closeImagePreview = function() {
        const previewModal = document.getElementById('imagePreviewModal');
        if (previewModal) {
            previewModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // 加载生活瞬间
    function loadMoments(isRefresh = false) {
        if (isLoading) return;
        
        if (isRefresh) {
            currentPage = 1;
            hasMoreMoments = true;
        }

        if (!hasMoreMoments) return;

        const loadingIndicator = document.getElementById('loadingIndicator');
        const grid = document.getElementById('momentsGrid');
        
        if (!loadingIndicator || !grid) return;

        isLoading = true;
        loadingIndicator.classList.add('show');

        // 模拟加载延迟
        setTimeout(() => {
            const startIndex = (currentPage - 1) * 4;
            const endIndex = startIndex + 4;
            const momentsToShow = momentsData.slice(startIndex, endIndex);

            if (isRefresh) {
                grid.innerHTML = '';
            }

            momentsToShow.forEach((moment, index) => {
                const card = createMomentCard(moment);
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                grid.appendChild(card);

                // 延迟添加动画效果
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });

            // 检查是否还有更多
            if (endIndex >= momentsData.length) {
                hasMoreMoments = false;
            }

            currentPage++;
            isLoading = false;
            loadingIndicator.classList.remove('show');
        }, 800);
    }

    // 创建生活瞬间卡片
    function createMomentCard(moment) {
        const card = document.createElement('div');
        card.className = 'moment-card';
        card.dataset.id = moment.id;

        let mediaHTML = '';
        if (moment.type === 'image') {
            mediaHTML = `
                <div class="moment-media">
                    <img src="${moment.media}" alt="生活瞬间" class="lazy-image" loading="lazy" />
                </div>
            `;
        } else if (moment.type === 'video') {
            mediaHTML = `
                <div class="moment-media">
                    <video controls>
                        <source src="${moment.media}" type="video/mp4">
                    </video>
                    <div class="moment-media-badge">视频</div>
                </div>
            `;
        }

        card.innerHTML = `
            ${mediaHTML}
            <div class="moment-content">
                <p class="moment-text">${moment.text}</p>
                <div class="moment-meta">
                    <span class="moment-time">${moment.time}</span>
                    <div class="moment-actions">
                        <button class="action-btn ${moment.liked ? 'liked' : ''}" onclick="toggleLike(${moment.id}, event)">
                            <span>❤️</span>
                            <span class="like-count">${moment.likes}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 点击卡片查看详情
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn')) {
                showMomentDetail(moment);
            }
        });

        // 长按显示操作菜单
        let longPressTimer;
        card.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.action-btn')) {
                longPressTimer = setTimeout(() => {
                    showMomentMenu(moment, e);
                }, 500);
            }
        });

        card.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        card.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

        return card;
    }

    // 点赞功能
    window.toggleLike = async function(id, event) {
        if (event) event.stopPropagation();
        
        const moment = momentsData.find(m => m.id === id);
        if (moment) {
            moment.liked = !moment.liked;
            moment.likes += moment.liked ? 1 : -1;
            
            const btn = document.querySelector(`.moment-card[data-id="${id}"] .action-btn:first-child`);
            if (btn) {
                btn.classList.toggle('liked', moment.liked);
                const countSpan = btn.querySelector('.like-count');
                if (countSpan) {
                    countSpan.textContent = moment.likes;
                }
            }

            // 同步到服务器
            await updateLikeToServer(id);
            
            // 更新顶部统计数据
            updateStats();
        }
    };

    // 显示生活瞬间详情
    function showMomentDetail(moment) {
        const modal = document.getElementById('momentDetailModal');
        const body = document.getElementById('momentDetailBody');
        
        if (modal && body) {
            let mediaHTML = '';
            if (moment.type === 'image') {
                mediaHTML = `<img src="${moment.media}" alt="生活瞬间" style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;" />`;
            } else if (moment.type === 'video') {
                mediaHTML = `
                    <video controls style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;">
                        <source src="${moment.media}" type="video/mp4">
                    </video>
                `;
            }

            body.innerHTML = `
                ${mediaHTML}
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1.25rem; margin: 0 0 0.5rem 0; color: var(--text-primary);">发布于 ${moment.time}</h3>
                    <p style="font-size: 1rem; line-height: 1.6; color: var(--text-secondary); margin: 0;">${moment.text}</p>
                </div>
                <div style="display: flex; gap: 1.5rem; padding: 1rem 0; border-top: 1px solid var(--border-color);">
                    <button class="action-btn ${moment.liked ? 'liked' : ''}" onclick="toggleLike(${moment.id})">
                        <span>❤️</span>
                        <span>${moment.likes}</span>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMoment(${moment.id})" style="color: #e74c3c;">
                        <span>🗑️</span>
                        <span>删除</span>
                    </button>
                </div>
            `;

            modal.classList.add('active');
        }
    }

    // 关闭详情
    window.closeMomentDetail = function() {
        const modal = document.getElementById('momentDetailModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    // 删除生活瞬间
    window.deleteMoment = async function(id) {
        if (confirm('确定要删除这条生活瞬间吗？')) {
            // 从数组中移除
            const index = momentsData.findIndex(m => m.id === id);
            if (index > -1) {
                momentsData.splice(index, 1);
            }

            // 同步到服务器
            await deleteMomentFromServer(id);

            // 从DOM中移除卡片
            const card = document.querySelector(`.moment-card[data-id="${id}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.remove();
                    // 检查是否为空，显示提示
                    if (momentsData.length === 0) {
                        checkEmptyState();
                    }
                }, 300);
            }

            // 更新统计数据
            updateMomentsCount();
            updateStats();

            // 关闭详情
            closeMomentDetail();
        }
    };

    // 显示操作菜单
    function showMomentMenu(moment, event) {
        alert('收藏功能开发中...');
    }

    // 更新统计数据
    window.updateStats = function() {
        const totalLikes = momentsData.reduce((sum, m) => sum + m.likes, 0);
        const likesCount = document.getElementById('likesCount');
        if (likesCount) likesCount.textContent = totalLikes;
    }

    // 更新瞬间数量
    window.updateMomentsCount = function() {
        const countElement = document.getElementById('momentsCount');
        if (countElement) countElement.textContent = momentsData.length;
    }

    // 下拉刷新和上拉加载（已禁用，页面保持静态）
    function setupScrollLoading() {
        // 功能已禁用，页面保持静态，只有发布和删除时才变化
    }

    // 初始化滚动加载
    setupScrollLoading();

    // 初始化背景图片下拉功能
    initHeaderDrag();

    // 点击模态框外部关闭
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('personal-space-overlay') && !e.target.closest('.personal-space-container')) {
            closePersonalSpace();
        }
        if (e.target.classList.contains('moment-detail-modal') && !e.target.closest('.moment-detail-content')) {
            closeMomentDetail();
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const detailModal = document.getElementById('momentDetailModal');
            if (detailModal && detailModal.classList.contains('active')) {
                closeMomentDetail();
            } else {
                closePersonalSpace();
            }
        }
    });

    // ==================== 发布生活瞬间功能 ====================
    let selectedImageData = null;
    let nextMomentId = 9; // 下一个可用的ID

    // 打开发布模态框
    window.openPublishModal = function() {
        const modal = document.getElementById('publishModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // 重置表单
            resetPublishForm();
        }
    };

    // 关闭发布模态框
    window.closePublishModal = function() {
        const modal = document.getElementById('publishModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // 重置发布表单
    function resetPublishForm() {
        const textArea = document.getElementById('publishText');
        const imageInput = document.getElementById('publishImageInput');
        const preview = document.getElementById('publishImagePreview');
        const placeholder = document.querySelector('.publish-upload-placeholder');
        const deleteBtn = document.querySelector('.publish-image-delete');

        if (textArea) textArea.value = '';
        if (imageInput) imageInput.value = '';
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
        }
        if (placeholder) placeholder.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        selectedImageData = null;
    }

    // 处理图片选择
    window.handleImageSelect = function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('publishImagePreview');
                const placeholder = document.querySelector('.publish-upload-placeholder');
                const deleteBtn = document.querySelector('.publish-image-delete');
                
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                if (deleteBtn) {
                    deleteBtn.style.display = 'flex';
                }
                
                selectedImageData = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // 删除选中的图片
    window.deleteSelectedImage = function() {
        const imageInput = document.getElementById('publishImageInput');
        const preview = document.getElementById('publishImagePreview');
        const placeholder = document.querySelector('.publish-upload-placeholder');
        const deleteBtn = document.querySelector('.publish-image-delete');

        if (imageInput) imageInput.value = '';
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
        }
        if (placeholder) placeholder.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        selectedImageData = null;
    };

    // 提交发布
    window.submitMoment = async function() {
        const text = document.getElementById('publishText')?.value.trim();
        
        // 检查是否有内容
        if (!text && !selectedImageData) {
            alert('请添加文字或图片');
            return;
        }

        // 创建新的生活瞬间
        const newMoment = {
            type: selectedImageData ? 'image' : 'text',
            media: selectedImageData,
            text: text || '分享图片'
        };

        // 保存到服务器
        const success = await saveMomentToServer(newMoment);
        
        if (success) {
            // 重新加载数据以获取服务器返回的完整数据（包括ID和时间）
            await loadMomentsFromServer();

            // 更新统计数据
            updateMomentsCount();
            updateStats();

            // 在界面上显示新内容（重新渲染整个列表）
            const grid = document.getElementById('momentsGrid');
            if (grid) {
                grid.innerHTML = '';
                momentsData.forEach((moment, index) => {
                    const card = createMomentCard(moment);
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    grid.appendChild(card);
                    setTimeout(() => {
                        card.style.transition = 'all 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 50);
                });
            }

            // 关闭模态框
            closePublishModal();
        } else {
            alert('发布失败，请重试');
        }
    };

    // 点击模态框外部关闭
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('publish-modal') && !e.target.closest('.publish-modal-content')) {
            closePublishModal();
        }
    });
});