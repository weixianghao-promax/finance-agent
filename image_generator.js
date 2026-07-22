class ImageGenerator {
    constructor(options = {}) {
        this.apiKey = options.apiKey || '';
        this.baseUrl = options.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
        this.defaultParams = {
            prompt: '',
            negative_prompt: '',
            steps: 20,
            seed: -1,
            aspect_ratio: '1:1',
            model: 'doubao-image'
        };
        this.isGenerating = false;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    async generate(params) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请等待完成');
        }

        const finalParams = { ...this.defaultParams, ...params };
        
        if (!finalParams.prompt || !finalParams.prompt.trim()) {
            throw new Error('请输入提示词');
        }

        this.isGenerating = true;

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(finalParams)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: '未知错误' }));
                throw new Error(error.message || `HTTP错误: ${response.status}`);
            }

            const result = await response.json();

            if (result.data && result.data.length > 0) {
                return {
                    success: true,
                    url: result.data[0].url,
                    seed: result.data[0].seed || finalParams.seed,
                    params: finalParams
                };
            } else {
                throw new Error('未返回图片数据');
            }

        } catch (error) {
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    getRatioDimensions(ratio) {
        const ratios = {
            '1:1': { width: 1024, height: 1024 },
            '3:4': { width: 768, height: 1024 },
            '4:3': { width: 1024, height: 768 },
            '16:9': { width: 1920, height: 1080 },
            '9:16': { width: 1080, height: 1920 },
            '21:9': { width: 2048, height: 878 }
        };
        return ratios[ratio] || ratios['1:1'];
    }

    generateCode(params) {
        const finalParams = { ...this.defaultParams, ...params };
        return `// AI图片生成API调用示例
const response = await fetch('${this.baseUrl}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
        prompt: "${finalParams.prompt.replace(/"/g, '\\"')}",
        negative_prompt: "${finalParams.negative_prompt.replace(/"/g, '\\"')}",
        steps: ${finalParams.steps},
        seed: ${finalParams.seed},
        aspect_ratio: "${finalParams.aspect_ratio}",
        model: "${finalParams.model}"
    })
});

const result = await response.json();
console.log('图片链接:', result.data[0].url);`;
    }
}

const imageGenerator = new ImageGenerator();

if (typeof window !== 'undefined') {
    window.ImageGenerator = ImageGenerator;
    window.imageGenerator = imageGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageGenerator, imageGenerator };
}