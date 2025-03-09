// 基于OffscreenCanvas的Web Worker方案
self.onmessage = function(e) {
    const { text, options } = e.data;
    const lines = text.split('\n');
    
    // 使用OffscreenCanvas避免DOM操作
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    
    // 精确测量文本尺寸
    ctx.font = options.font;
    const metrics = ctx.measureText('W');
    const lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const charWidth = metrics.width;
  
    // 计算画布尺寸
    const maxWidth = Math.max(...lines.map(l => l.length * charWidth));
    canvas.width = maxWidth + options.padding*2;
    canvas.height = lines.length * lineHeight + options.padding*2;
  
    // 绘制内容
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = options.textColor;
    ctx.font = options.font;
    ctx.textBaseline = 'top';
  
    lines.forEach((line, i) => {
      ctx.fillText(
        line, 
        options.padding, 
        options.padding + i*lineHeight
      );
    });
  
    // 转换为PNG
    canvas.convertToBlob({ type: 'image/png' })
      .then(blob => self.postMessage(blob));
  };
  