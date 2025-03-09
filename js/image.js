const CHAR_ASPECT = 1; // 字符宽高比系数

class ImageProcessor {
    constructor() {
        this.currentImage = null;
        this.initControls();
        this.bindButtons(); // 添加按钮绑定方法
        // 在构造函数中添加新参数初始化
        this.defaultGranularity = 8;
        this.defaultColorIntensity = 0.7;
    }

    initControls() {
        // 参数绑定
        this.bindParam('widthRange', 'widthValue', v => v);
        this.bindParam('contrastRange', 'contrastValue', v => `${v}%`);
        this.bindParam('granularityRange', 'granularityValue', v => v);
        this.bindParam('colorIntensityRange', 'colorIntensityValue', v => `${Math.round(v * 100)}%`);
        // 初始化颜色强度范围为0-1
        document.getElementById('colorIntensityRange').value = this.defaultColorIntensity;
        document.getElementById('colorIntensityValue').textContent = `${Math.round(this.defaultColorIntensity * 100)}%`;
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) await this.loadAndProcess(file);
            });
        } else {
            console.error('File input element not found');
        }
        // 文件上传
        document.getElementById('fileInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await this.loadAndProcess(file);
        });
        document.querySelector('.copy').addEventListener('click', () => this.copyToClipboard());
        document.querySelector('.export-txt').addEventListener('click', () => this.exportTXT());
        document.querySelector('.export-png').addEventListener('click', () => this.exportPNG());
    }

    bindParam(inputId, outputId, formatter) {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        
        const update = () => {
            output.textContent = formatter(input.value);
            this.currentImage && this.generate();
        };
        
        input.addEventListener('input', update);
        update();
    }

    async loadAndProcess(file) {
        try {
            this.currentImage = await this.loadImage(file);
            await this.generate();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async generate() {
    /*
        const { canvas, imageData } = this.createScaledCanvas();
        const ascii = this.renderAscii(imageData);
        document.getElementById('preview').textContent = ascii;
    */
        // 修改生成逻辑支持实时更新
        if (!this.currentImage) return;
            
        const { canvas, imageData } = this.createScaledCanvas();
        const ascii = this.renderAscii(imageData);
        document.getElementById('preview').textContent = ascii;
        
        // 性能优化：释放内存
        canvas.width = 0;
        canvas.height = 0;
    }

    createScaledCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = parseInt(document.getElementById('widthRange').value);
        
        // 精确比例计算
        const scale = width / this.currentImage.naturalWidth;
        canvas.width = width;
        canvas.height = Math.round(this.currentImage.naturalHeight * scale / CHAR_ASPECT);
        
        ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height);
        return { canvas, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) };
    }

    renderAscii(imageData) {
    /*
        const contrast = parseInt(document.getElementById('contrastRange').value) / 100;
        let ascii = '';
        const lineBreak = '\n'.repeat(Math.floor(1 / CHAR_ASPECT));

        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const idx = (y * imageData.width + x) * 4;
                const [r, g, b] = imageData.data.slice(idx, idx + 3);
                const brightness = Math.pow((r * 0.3 + g * 0.59 + b * 0.11) / 255, contrast);
                ascii += '@%#*+=-:. '[Math.floor(brightness * 9)];
            }
            ascii += lineBreak;
        }
        return ascii;
    */
        const contrast = parseInt(document.getElementById('contrastRange').value) / 100;
        const granularity = parseInt(document.getElementById('granularityRange').value);
        const colorIntensity = parseFloat(document.getElementById('colorIntensityRange').value);
        
        let ascii = '';
        const lineBreak = '\n'.repeat(Math.floor(1 / CHAR_ASPECT));
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // 新的采样逻辑
        for (let y = 0; y < height; y += granularity) {
            for (let x = 0; x < width; x += granularity) {
                // 计算区块平均亮度
                let totalR = 0, totalG = 0, totalB = 0;
                let count = 0;

                for (let dy = 0; dy < granularity && y + dy < height; dy++) {
                    for (let dx = 0; dx < granularity && x + dx < width; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        totalR += data[idx];
                        totalG += data[idx + 1];
                        totalB += data[idx + 2];
                        count++;
                    }
                }

                // 应用颜色强度
                const avgR = totalR / count * colorIntensity;
                const avgG = totalG / count * colorIntensity;
                const avgB = totalB / count * colorIntensity;

                // 计算对比度增强后的亮度
                const brightness = Math.pow(
                    (avgR * 0.3 + avgG * 0.59 + avgB * 0.11) / 255,
                    contrast
                );

                // 字符映射
                const chars = '@%#*+=-:. ';
                ascii += chars[Math.floor(brightness * (chars.length - 1))];
            }
            ascii += lineBreak;
        }
        return ascii;
    }
    // 保持原有按钮绑定方法
    bindButtons() {
        const bindButton = (selector, handler) => {
            const btn = document.querySelector(selector);
            if (btn) {
                // 移除旧的事件监听器防止重复绑定
                btn.removeEventListener('click', handler);
                btn.addEventListener('click', handler.bind(this));
            }
        };

        bindButton('.copy', this.copyToClipboard);
        bindButton('.export-txt', this.exportTXT);
        bindButton('.export-png', this.exportPNG);
    }
    // 增强复制功能
    async copyToClipboard() {
        try {
            const ascii = document.getElementById('preview').textContent; // 确保ID匹配
            if (!ascii) throw new Error('No ASCII content');
            
            await navigator.clipboard.writeText(ascii);
            this.showToast('📋 Copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('❌ Copy failed - ' + error.message);
        }
    }
    // 增强导出功能
    async exportPNG() {
    /*
        try {
            // 前置条件检查
            if (!this.validateExportPreconditions()) return;

            // 准备导出元素
            const { element, originalStyle } = this.prepareExportElement();
            
            // 执行截图
            const canvas = await this.captureAsCanvas(element);
            
            // 处理截图结果
            this.handleCanvasOutput(canvas);
            
            // 恢复元素状态
            this.restoreElementStyle(element, originalStyle);
            
            this.showToast('🖼️ PNG exported!');
        } catch (error) {
            this.handleExportError(error);
        }
    */
    /*
        try {
            if (!this.validateExportPreconditions()) return;
    
            // 创建临时容器保证渲染质量
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: 0;
                top: 0;
                z-index: 99999;
                visibility: visible;
            `;
            
            // 克隆预览节点保持样式
            const clone = document.getElementById('preview').cloneNode(true);
            clone.style.cssText = `
                font-family: 'Courier New', monospace;
                background: #000;
                color: #fff;
                padding: 20px;
                white-space: pre-wrap;
                font-size: ${12 * devicePixelRatio}px;
            `;
            
            tempContainer.appendChild(clone);
            document.body.appendChild(tempContainer);
    
            // 调整html2canvas配置
            const canvas = await html2canvas(clone, {
                scale: devicePixelRatio,
                logging: true,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#000',
                onclone: null
            });
    
            // 清理临时元素
            tempContainer.remove();
    
            // 转换为PNG并下载
            canvas.toBlob(blob => {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.download = `ASCII_${Date.now()}.png`;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, 'image/png');
    
            this.showToast('🖼️ PNG exported!');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast(`❌ Export failed: ${error.message}`);
        }
    */
        try {
            const pre = document.getElementById('preview');
            if (!pre?.textContent?.trim()) {
              this.showToast('⚠️ Please upload the image file.');
              return;
            }
      
            // 创建离屏Worker优化性能
            const worker = new Worker('js/canvas.worker.js');
            
            worker.postMessage({
              text: pre.textContent,
              options: {
                font: '14px "Courier New"',
                padding: 20,
                bgColor: '#000',
                textColor: '#fff'
              }
            });
      
            worker.onmessage = async (e) => {
              const blob = e.data;
              const link = document.createElement('a');
              link.download = `ASCII_${Date.now()}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              setTimeout(() => URL.revokeObjectURL(link.href), 1000);
              worker.terminate();
            };
      
            this.showToast('🖼️ Generating PNG...');
          } catch (error) {
            console.error('Export error', error);
            this.showToast('❌ Export failed' + error.message);
          }
    }
    // 检验html2canvas是否完成格式转换
    validateExportPreconditions() {
        if (typeof html2canvas !== 'function') {
            this.showToast('❌ html2canvas library not loaded');
            return false;
        }
        
        const pre = document.getElementById('preview');
        if (!pre?.textContent?.trim()) {
            this.showToast('⚠️ Generate ASCII art first');
            return false;
        }
        
        return true;
    }
    
    createTileContainer(source, width, height, left, top) {
        const container = source.cloneNode(true);
        container.style.cssText = `
            position: fixed;
            left: ${-left}px;
            top: ${-top}px;
            width: ${source.scrollWidth}px;
            height: ${source.scrollHeight}px;
            overflow: hidden;
            pointer-events: none;
        `;
        return container;
    }

    prepareExportElement() {
        const element = document.getElementById('preview');
        const originalStyle = {
            visibility: element.style.visibility,
            position: element.style.position,
            left: element.style.left,
            zIndex: element.style.zIndex
        };

        // 临时调整样式用于截图
        Object.assign(element.style, {
            visibility: 'visible',
            position: 'absolute',
            left: '-9999px',
            zIndex: 9999
        });

        return { element, originalStyle };
    }

    async captureAsCanvas(element) {
        return await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: false,
            onclone: (clonedDoc, node) => {
                node.style.cssText = 'visibility:visible;position:static;';
            }
        });
    }

    handleCanvasOutput(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                try {
                    const link = document.createElement('a');
                    const objectURL = URL.createObjectURL(blob);
                    
                    link.download = `ASCII_${Date.now()}.png`;
                    link.href = objectURL;
                    link.click();

                    // 延迟释放内存
                    setTimeout(() => {
                        URL.revokeObjectURL(objectURL);
                        link.remove();
                        resolve();
                    }, 1000);
                } catch (error) {
                    reject(error);
                }
            }, 'image/png');
        });
    }

    restoreElementStyle(element, originalStyle) {
        Object.assign(element.style, originalStyle);
    }

    handleExportError(error) {
        console.error('PNG Export Error:', error);
        const errorMessage = this.mapErrorToMessage(error);
        this.showToast(`❌ Export failed: ${errorMessage}`);
    }

    mapErrorToMessage(error) {
        const messages = {
            'SecurityError': 'Blocked by browser security policy',
            'InvalidStateError': 'Invalid element state',
            'NetworkError': 'Network request failed'
        };
        
        return messages[error.name] || error.message.slice(0, 50);
    }
/*
    // 增强导出功能
    exportPNG() {
        const pre = document.getElementById('preview');
        if (!pre?.textContent?.trim()) {
            this.showToast('⚠️ Generate ASCII first');
            return;
        }
    
        // 确保html2canvas已加载
        if (typeof html2canvas !== 'function') {
            this.showToast('❌ Missing html2canvas library');
            return;
        }
    
        // 临时显示预览元素
        const originalStyle = pre.style.cssText;
        pre.style.visibility = 'visible';
        pre.style.position = 'absolute';
        pre.style.left = '-9999px';
    
        html2canvas(pre, {
            backgroundColor: null,
            scale: 2,
            logging: true,
            allowTaint: true,
            useCORS: true,
            onclone: (clonedDoc, element) => {
                clonedDoc.getElementById('preview').style.cssText = originalStyle;
            }
        }).then(canvas => {
            canvas.toBlob(blob => {
                const link = document.createElement('a');
                link.download = `ascii_${Date.now()}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                setTimeout(() => URL.revokeObjectURL(link.href), 100);
                pre.style.cssText = originalStyle;
                this.showToast('🖼️ PNG exported!');
            }, 'image/png');
        }).catch(error => {
            console.error('PNG export error:', error);
            pre.style.cssText = originalStyle;
            this.showToast('❌ PNG export failed');
        });
    }
*/
    exportTXT() {
        try {
            const pre = document.getElementById('preview');
            if (!pre?.textContent?.trim()) {
                this.showToast('⚠️ No content to export');
                return;
            }
            
            const text = pre.textContent;
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const filename = `ascii_${new Date().toISOString().slice(0,10)}.txt`;
            
            // 兼容旧浏览器的下载方式
            if (window.navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }, 100);
            }
            this.showToast('📄 TXT exported!');
        } catch (error) {
            console.error('TXT export failed:', error);
            this.showToast('❌ TXT export error');
        }
    }
    // 弹窗文字展示
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => toast.remove(), 2000);
        }, 100);
    }
}

// 初始化
new ImageProcessor();

// 增强拖放功能
class UploadManager {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileMeta = document.getElementById('fileMeta');
        this.loadingBar = document.getElementById('loadingBar');
        this.init();
    }

    init() {
        // 点击触发文件选择
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        
        // 拖放事件处理
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFile(file);
        });

        // 文件选择变化
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });
    }

    handleFile(file) {
        // 重置参数到默认值
        document.getElementById('granularityRange').value = 4;
        document.getElementById('colorIntensityRange').value = 0.7;
        document.getElementById('granularityValue').textContent = '4';
        document.getElementById('colorIntensityValue').textContent = '70%';
        
        this.showFileInfo(file);
        this.startLoading();
        
        // 模拟加载进度
        let progress = 0;
        const interval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 20, 100);
            this.loadingBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                this.completeLoading();
                // 实际处理文件...
            }
        }, 50);
    }

    showFileInfo(file) {
        this.fileMeta.querySelector('.file-name').textContent = file.name;
        this.fileMeta.querySelector('.file-size').textContent = 
            `(${(file.size / 1024).toFixed(1)}KB)`;
        this.fileMeta.classList.add('visible');
    }

    startLoading() {
        this.loadingBar.style.width = '0%';
        this.dropZone.style.pointerEvents = 'none';
    }

    completeLoading() {
        this.loadingBar.style.width = '100%';
        setTimeout(() => {
            this.loadingBar.style.width = '0';
            this.dropZone.style.pointerEvents = 'auto';
        }, 500);
    }
}

// 初始化上传管理器
new UploadManager();