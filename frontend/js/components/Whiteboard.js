window.Whiteboard = function () {
    const container = document.createElement('div');
    container.className = 'whiteboard-container card-glass';
    container.style.marginTop = '20px';
    container.style.padding = '15px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.width = '100%';

    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '10px';
    toolbar.style.alignItems = 'center';

    const canvas = document.createElement('canvas');
    canvas.width = 800; // Will be responsive later
    canvas.height = 400;
    canvas.style.background = '#0f172a';
    canvas.style.borderRadius = '8px';
    canvas.style.cursor = 'crosshair';
    canvas.style.border = '1px solid rgba(255,255,255,0.1)';

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let mode = 'pencil'; // 'pencil' or 'text'
    let lastX = 0;
    let lastY = 0;

    // Responsive sizing
    const resize = () => {
        const parentWidth = container.offsetWidth - 30;
        if (parentWidth < 800) {
            const scale = parentWidth / 800;
            canvas.style.width = `${parentWidth}px`;
            canvas.style.height = `${400 * scale}px`;
        } else {
            canvas.style.width = '800px';
            canvas.style.height = '400px';
        }
    };

    // Drawing Logic
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDraw = (e) => {
        if (mode !== 'pencil') return;
        drawing = true;
        const pos = getPos(e.touches ? e.touches[0] : e);
        [lastX, lastY] = [pos.x, pos.y];
    };

    const draw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e.touches ? e.touches[0] : e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        [lastX, lastY] = [pos.x, pos.y];
    };

    const stopDraw = () => drawing = false;

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDraw);

    // Toolbar Items
    const btnPencil = document.createElement('button');
    btnPencil.className = 'btn btn-secondary active';
    btnPencil.innerHTML = '✏️ Pencil';
    btnPencil.onclick = () => {
        mode = 'pencil';
        btnPencil.classList.add('active');
        btnText.classList.remove('active');
        canvas.style.cursor = 'crosshair';
    };

    const btnText = document.createElement('button');
    btnText.className = 'btn btn-secondary';
    btnText.innerHTML = '⌨️ Type';
    btnText.onclick = () => {
        mode = 'text';
        btnText.classList.add('active');
        btnPencil.classList.remove('active');
        canvas.style.cursor = 'text';
    };

    const btnClear = document.createElement('button');
    btnClear.className = 'btn btn-secondary';
    btnClear.innerHTML = '🗑️ Clear';
    btnClear.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    toolbar.appendChild(btnPencil);
    toolbar.appendChild(btnText);
    toolbar.appendChild(btnClear);

    // Text Input Logic
    canvas.onclick = (e) => {
        if (mode !== 'text') return;
        const pos = getPos(e);
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'absolute';
        input.style.left = `${e.clientX}px`;
        input.style.top = `${e.clientY}px`;
        input.style.background = 'transparent';
        input.style.border = '1px dashed #3b82f6';
        input.style.color = 'white';
        input.style.outline = 'none';
        input.style.zIndex = '1000';

        document.body.appendChild(input);
        input.focus();

        input.onblur = () => {
            if (input.value) {
                ctx.font = '16px Inter, sans-serif';
                ctx.fillStyle = 'white';
                ctx.fillText(input.value, pos.x, pos.y + 16);
            }
            input.remove();
        };

        input.onkeydown = (ev) => {
            if (ev.key === 'Enter') input.blur();
        };
    };

    container.appendChild(toolbar);
    container.appendChild(canvas);

    // Initial resize and listener
    setTimeout(resize, 0);
    window.addEventListener('resize', resize);

    return container;
};
