const videoUrlInput = document.getElementById('videoUrl');
const parseBtn = document.getElementById('parseBtn');
const platformIcon = document.getElementById('platformIcon');
const resultSection = document.getElementById('resultSection');
const videoPlayer = document.getElementById('videoPlayer');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const platformBtns = document.querySelectorAll('.platform-btn');

const platformPatterns = {
    douyin: {
        regex: /(?:douyin\.com|iesdouyin\.com)\//,
        name: '抖音',
        icon: '🎵'
    },
    kuaishou: {
        regex: /kuaishou\.(?:com|app)\//,
        name: '快手',
        icon: '📸'
    },
    xiaohongshu: {
        regex: /xiaohongshu\.com/,
        name: '小红书',
        icon: '📕'
    },
    channels: {
        regex: /channels\.(?:weixin\.qq\.com|tencent\.com)/,
        name: '视频号',
        icon: '🎬'
    }
};

let currentVideoData = null;

function detectPlatform(url) {
    for (const [platform, data] of Object.entries(platformPatterns)) {
        if (data.regex.test(url)) {
            return { platform, ...data };
        }
    }
    return null;
}

function updatePlatformIcon(url) {
    const platform = detectPlatform(url);
    platformIcon.textContent = platform ? platform.icon : '';
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function setLoading(loading) {
    if (loading) {
        parseBtn.classList.add('loading');
        parseBtn.querySelector('.btn-text').textContent = '解析中...';
    } else {
        parseBtn.classList.remove('loading');
        parseBtn.querySelector('.btn-text').textContent = '解析视频';
    }
}

function getDemoVideoData(url) {
    const platform = detectPlatform(url);
    const platforms = {
        douyin: {
            title: '抖音精彩视频',
            author: '@抖音用户',
            videoUrl: 'https://v.douyin.com/demo.mp4'
        },
        kuaishou: {
            title: '快手精选视频',
            author: '快手用户',
            videoUrl: 'https://v.kuaishou.com/demo.mp4'
        },
        xiaohongshu: {
            title: '小红书推荐视频',
            author: '小红书博主',
            videoUrl: 'https://v.xiaohongshu.com/demo.mp4'
        },
        channels: {
            title: '视频号精彩内容',
            author: '视频号创作者',
            videoUrl: 'https://v.channels.qq.com/demo.mp4'
        }
    };

    if (platform) {
        return platforms[platform.platform];
    }
    return {
        title: '未知来源视频',
        author: '未知作者',
        videoUrl: ''
    };
}

async function parseVideo(url) {
    setLoading(true);
    resultSection.style.display = 'none';

    try {
        const platform = detectPlatform(url);

        if (!platform) {
            showToast('暂不支持该平台，请输入抖音、快手、小红书或视频号链接', 'error');
            setLoading(false);
            return;
        }

        const demoData = getDemoVideoData(url);

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (demoData.videoUrl) {
            videoPlayer.src = demoData.videoUrl;
            videoPlayer.poster = '';
        }

        videoTitle.textContent = demoData.title;
        videoAuthor.textContent = `来源: ${demoData.author} · ${platform.name}`;

        currentVideoData = {
            ...demoData,
            platform: platform.name,
            originalUrl: url
        };

        resultSection.style.display = 'block';
        showToast(`${platform.name}视频解析成功！`, 'success');

    } catch (error) {
        console.error('Parse error:', error);
        showToast('解析失败，请检查链接是否正确', 'error');
    } finally {
        setLoading(false);
    }
}

async function downloadVideo() {
    if (!currentVideoData || !currentVideoData.videoUrl) {
        showToast('暂无视频可下载', 'error');
        return;
    }

    try {
        const response = await fetch(currentVideoData.videoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentVideoData.title}.mp4`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        showToast('视频下载开始！', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('下载失败，请尝试直接播放视频', 'error');
    }
}

function copyLink() {
    if (!currentVideoData) {
        showToast('暂无链接可复制', 'error');
        return;
    }

    const textToCopy = currentVideoData.originalUrl || videoUrlInput.value;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('链接已复制到剪贴板！', 'success');
        }).catch(() => {
            fallbackCopy(textToCopy);
        });
    } else {
        fallbackCopy(textToCopy);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('链接已复制到剪贴板！', 'success');
    } catch (err) {
        showToast('复制失败，请手动复制', 'error');
    }
    document.body.removeChild(textarea);
}

videoUrlInput.addEventListener('input', (e) => {
    updatePlatformIcon(e.target.value);
});

videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = e.target.value.trim();
        if (url) {
            parseVideo(url);
        }
    }
});

parseBtn.addEventListener('click', () => {
    const url = videoUrlInput.value.trim();
    if (url) {
        parseVideo(url);
    } else {
        showToast('请先粘贴视频链接', 'error');
        videoUrlInput.focus();
    }
});

platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        platformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

downloadBtn.addEventListener('click', downloadVideo);
copyBtn.addEventListener('click', copyLink);

document.addEventListener('paste', (e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (pastedText && !videoUrlInput.value) {
        videoUrlInput.value = pastedText;
        updatePlatformIcon(pastedText);
        videoUrlInput.focus();
    }
});