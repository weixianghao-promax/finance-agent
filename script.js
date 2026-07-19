let currentMode = 'chat';
let chatHistory = [];
let uploadedFileContent = null;
let uploadedFileName = null;

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const titles = {
        'chat': '智能对话',
        'report': '报表生成',
        'analysis': '数据分析',
        'budget': '预算管理',
        'safety': '安全培训'
    };
    document.getElementById('chat-title').textContent = titles[mode] || '智能对话';
}

function quickAction(action) {
    const actions = {
        'daily_report': '请帮我生成一份今天的财务日报，包含收入、支出和余额情况。',
        'weekly_report': '请帮我生成本周的财务周报，包括各项财务指标分析和趋势。',
        'monthly_report': '请帮我生成本月的财务月报，包含详细的收支分析和预算执行情况。',
        'cost_analysis': '请帮我进行成本分析，找出成本高的项目并提出优化建议。'
    };
    
    const message = actions[action];
    if (message) {
        document.getElementById('user-input').value = message;
        sendMessage();
    }
}

function addMessage(text, role, downloadUrl = null, fileType = null) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    
    let downloadButton = '';
    if (downloadUrl) {
        const typeLabels = {
            '.xlsx': 'Excel表格',
            '.docx': 'Word文档',
            '.pptx': 'PPT演示',
            '.txt': '文本文件'
        };
        const label = typeLabels[fileType] || '整理报告';
        downloadButton = `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <a href="${downloadUrl}" class="download-link" download>
                    📥 下载${label}
                </a>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-content">${text}${downloadButton}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addLoadingMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <span class="loading"></span> 正在分析文件...
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeLoadingMessage() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        addMessage(`📁 正在上传文件: ${file.name}...`, 'user');
        
        const response = await fetch('/api/v1/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.status === 200) {
            uploadedFileContent = data.content;
            uploadedFileName = file.name;
            addMessage(`✅ 文件上传成功: ${file.name}\n文件内容已解析，您可以提问了。`, 'user');
        } else {
            addMessage(`❌ 文件上传失败: ${data.detail || '未知错误'}`, 'user');
        }
    } catch (error) {
        addMessage(`❌ 文件上传失败: ${error.message}`, 'user');
        console.error(error);
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text && !uploadedFileContent) return;
    
    input.value = '';
    input.disabled = true;
    document.querySelector('.send-btn').disabled = true;
    
    let displayText = text;
    if (uploadedFileName) {
        displayText = `📁 ${uploadedFileName}\n${text}`;
    }
    addMessage(displayText, 'user');
    addLoadingMessage();
    
    try {
        console.log('Sending message:', text || '请整理并分析上传的文件内容');
        console.log('Has file content:', uploadedFileContent ? 'Yes' : 'No');
        console.log('Filename:', uploadedFileName);
        
        const response = await fetch('/api/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text || '请整理并分析上传的文件内容',
                chat_history: chatHistory,
                file_content: uploadedFileContent,
                filename: uploadedFileName
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        removeLoadingMessage();
        
        if (response.status === 200) {
            if (data.response) {
                addMessage(data.response, 'assistant', data.download_url, data.file_type);
                chatHistory = data.chat_history;
            } else {
                addMessage('抱歉，没有获取到回复内容。', 'assistant');
            }
        } else {
            addMessage(`错误: ${data.detail || '未知错误'}`, 'assistant');
        }
    } catch (error) {
        removeLoadingMessage();
        addMessage('抱歉，网络连接失败，请检查网络或稍后重试。', 'assistant');
        console.error('Error:', error);
    } finally {
        input.disabled = false;
        document.querySelector('.send-btn').disabled = false;
        input.focus();
    }
}

async function clearHistory() {
    if (!confirm('确定要清除所有聊天记录吗？')) return;
    
    try {
        await fetch('/api/v1/history', {
            method: 'DELETE'
        });
        
        chatHistory = [];
        uploadedFileContent = null;
        uploadedFileName = null;
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="avatar">🤖</div>
                <div class="message-content">
                    <p>您好！我是您的码头港口财务管理智能助手。</p>
                    <p>我可以帮助您：</p>
                    <ul>
                        <li>📊 整理和核对财务报表</li>
                        <li>📈 分析财务数据和指标</li>
                        <li>💰 进行预算编制和成本控制</li>
                        <li>📝 整理会议记录</li>
                        <li>🛡️ 制定安全培训方案</li>
                        <li>📁 上传Excel/Word/PPT/PDF文件进行分析</li>
                    </ul>
                    <p>上传文件后，我会言简意赅地整理核心内容，并生成整理报告供下载。</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
    }
}

document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await uploadFile(file);
        e.target.value = '';
    }
});