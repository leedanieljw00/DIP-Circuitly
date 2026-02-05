window.Login = function ({ onLogin, onRegister }) {
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.className = 'card-glass';
    card.style.maxWidth = '400px';
    card.style.width = '100%';
    card.style.padding = '40px';
    card.style.textAlign = 'center';

    // Title
    const title = document.createElement('h1');
    title.className = 'brand-title';
    title.innerHTML = 'Circuitly';
    title.style.fontSize = '2.5rem';
    title.style.marginBottom = '8px';
    card.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'brand-subtitle';
    subtitle.innerHTML = 'Master the Circuit.';
    subtitle.style.fontSize = '0.9rem';
    subtitle.style.marginBottom = '32px';
    card.appendChild(subtitle);

    // Form Container
    const formContainer = document.createElement('div');
    formContainer.style.display = 'flex';
    formContainer.style.flexDirection = 'column';
    formContainer.style.gap = '16px';

    // Existing Users List (Dropdown or Buttons)
    const userSelectLabel = document.createElement('div');
    userSelectLabel.textContent = 'Continue as...';
    userSelectLabel.style.color = 'var(--text-muted)';
    userSelectLabel.style.marginBottom = '8px';
    userSelectLabel.style.fontSize = '0.9rem';
    userSelectLabel.style.textAlign = 'left';

    // Async Fetch Users
    (async () => {
        const users = await window.AuthService.getUsers();
        const userList = Object.keys(users);

        if (userList.length > 0) {
            formContainer.appendChild(userSelectLabel);

            userList.forEach(username => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary';
                btn.style.width = '100%';
                btn.style.justifyContent = 'space-between';
                btn.innerHTML = `<span>${username}</span> <span style="font-size:0.8rem; color:var(--text-muted)">Lvl ${Math.floor(users[username].xp / 100) + 1}</span>`;
                btn.onclick = () => onLogin(username);
                formContainer.appendChild(btn);
            });

            const divider = document.createElement('div');
            divider.style.margin = '20px 0';
            divider.style.borderTop = '1px solid var(--surface-border)';
            formContainer.appendChild(divider);
        }

        // New User Input
        const newLabel = document.createElement('div');
        newLabel.textContent = 'Or create new profile:';
        newLabel.style.color = 'var(--text-muted)';
        newLabel.style.marginBottom = '8px';
        newLabel.style.fontSize = '0.9rem';
        newLabel.style.textAlign = 'left';
        formContainer.appendChild(newLabel);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter Name';
        input.style.width = '100%';
        input.style.padding = '12px';
        input.style.background = 'rgba(0,0,0,0.2)';
        input.style.border = '1px solid var(--surface-border)';
        input.style.borderRadius = 'var(--border-radius)';
        input.style.color = 'white';
        input.style.fontSize = '1rem';
        input.style.outline = 'none';
        input.style.marginBottom = '12px';

        input.onkeypress = (e) => {
            if (e.key === 'Enter') createBtn.click();
        };

        const createBtn = document.createElement('button');
        createBtn.className = 'btn btn-primary';
        createBtn.style.width = '100%';
        createBtn.textContent = 'CREATE PROFILE';
        createBtn.onclick = () => {
            const name = input.value.trim();
            if (name) {
                onRegister(name);
            }
        };

        formContainer.appendChild(input);
        formContainer.appendChild(createBtn);

    })();

    card.appendChild(formContainer);
    container.appendChild(card);

    return container;
};
