// 添加 loadImage 函数实现
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// 定义模板配置
const templateConfigs = {
    template1: {
        path: './img/CET_result_CET4_202306.jpg',
        textPositions: [{
            x: 1,
            y: 1,
            fontSize: 32,
            color: '#000000',
            bold: true,
            stroke: true,
            strokeColor: '#ffffff',
            texture: true,
            noise: true,
            textureOpacity: 0.3
        }]
    },
    template2: {
        path: './img/CET_result_CET4_202312.jpg',
        textPositions: [{
            x: 1,
            y: 1,
            fontSize: 32,
            color: '#000000',
            bold: true,
            stroke: true,
            strokeColor: '#ffffff',
            texture: true,
            noise: true,
            textureOpacity: 0.3
        }]
    }
    // ... 可以继续添加更多模板
};

// 加载模板预览
function loadTemplatePreviews() {
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = ''; // 清空现有预览
    
    Object.entries(templateConfigs).forEach(([templateId, template]) => {
        const div = document.createElement('div');
        div.className = 'template-preview';
        div.innerHTML = `
            <img src="${template.path}" alt="${templateId}">
            <div class="status">待处理</div>
        `;
        grid.appendChild(div);
    });
}

// 批量处理函数
async function processAllImages() {
    const input = document.getElementById('batchInput').value;
    const texts = input.split('\n').filter(text => text.trim());
    
    if (texts.length === 0) {
        alert('请输入要处理的文字');
        return;
    }

    const results = [];
    for (const [templateId, template] of Object.entries(templateConfigs)) {
        const img = await loadImage(template.path);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        template.textPositions.forEach((pos, index) => {
            const text = texts[index] || texts[0];
            applyTextWithEffects(ctx, text, pos, img.width, img.height);
        });

        results.push({
            templateId,
            dataUrl: canvas.toDataURL('image/jpeg', 0.9)
        });
    }

    return results;
}

// 应用文字效果
function applyTextWithEffects(ctx, text, config, width, height) {
    const x = config.x * width;
    const y = config.y * height;
    
    // 应用所有效果（使用之前的效果代码）
    if (config.stroke) {
        ctx.strokeStyle = config.strokeColor;
        ctx.lineWidth = config.fontSize * 0.05;
        ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = config.color;
    ctx.globalAlpha = 0.85;
    
    const fontWeight = config.bold ? 'bold' : '';
    ctx.font = `${fontWeight} ${config.fontSize}px FangSong, 仿宋, FangSong_GB2312, STFangSong, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(text, x, y);

    // 应用纹理和噪点效果
    if (config.texture) {
        applyTexture(ctx, x, y, text, config);
    }
    if (config.noise) {
        applyNoise(ctx, x, y, text, config);
    }
}

// 添加纹理效果函数
function applyTexture(ctx, x, y, text, config) {
    ctx.save();
    const metrics = ctx.measureText(text);
    const height = config.fontSize;
    
    // 创建纹理
    const textureCanvas = document.createElement('canvas');
    const textureCtx = textureCanvas.getContext('2d');
    textureCanvas.width = metrics.width;
    textureCanvas.height = height;
    
    // 绘制随机纹理
    textureCtx.fillStyle = '#000000';
    for (let i = 0; i < metrics.width * height * 0.1; i++) {
        const tx = Math.random() * metrics.width;
        const ty = Math.random() * height;
        textureCtx.globalAlpha = Math.random() * 0.1;
        textureCtx.fillRect(tx, ty, 1, 1);
    }
    
    // 应用纹理
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = config.textureOpacity;
    ctx.drawImage(textureCanvas, 
        x - metrics.width/2,
        y - height/2,
        metrics.width,
        height
    );
    ctx.restore();
}

// 添加噪点效果函数
function applyNoise(ctx, x, y, text, config) {
    ctx.save();
    const metrics = ctx.measureText(text);
    const height = config.fontSize;
    
    // 创建噪点
    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    noiseCanvas.width = metrics.width;
    noiseCanvas.height = height;
    
    const noiseData = noiseCtx.createImageData(metrics.width, height);
    for (let i = 0; i < noiseData.data.length; i += 4) {
        const value = Math.random() * 255;
        noiseData.data[i] = value;
        noiseData.data[i + 1] = value;
        noiseData.data[i + 2] = value;
        noiseData.data[i + 3] = Math.random() * 30; // 降低噪点强度
    }
    noiseCtx.putImageData(noiseData, 0, 0);
    
    // 应用噪点
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1;
    ctx.drawImage(noiseCanvas,
        x - metrics.width/2,
        y - height/2,
        metrics.width,
        height
    );
    ctx.restore();
}

// 事件监听
document.getElementById('processAll').addEventListener('click', async () => {
    const results = await processAllImages();
    // 更新预览状态
    results.forEach(result => {
        const preview = document.querySelector(`[data-template="${result.templateId}"]`);
        if (preview) {
            preview.querySelector('.status').textContent = '已处理';
            preview.querySelector('img').src = result.dataUrl;
        }
    });
});

document.getElementById('downloadAll').addEventListener('click', async () => {
    const results = await processAllImages();
    results.forEach((result, index) => {
        const link = document.createElement('a');
        link.download = `output_${index + 1}.jpg`;
        link.href = result.dataUrl;
        link.click();
    });
});

// 初始化
loadTemplatePreviews();