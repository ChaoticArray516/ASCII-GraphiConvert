class FileManager {
    static initDropZone(selector, callback) {
        const dropZone = document.querySelector(selector);
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            file && callback(file);
        });
    }
}

class Debugger {
    static logCanvas(canvas) {
        const preview = document.createElement('div');
        preview.style.position = 'fixed';
        preview.style.top = '0';
        preview.style.right = '0';
        preview.style.background = 'white';
        document.body.appendChild(preview);
        preview.appendChild(canvas);
    }
}

// 在image.js中添加点击事件
document.querySelectorAll('.faq-question').forEach(item => {
    item.addEventListener('click', () => {
        item.parentElement.classList.toggle('active');
    });
});

