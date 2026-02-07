window.Login = function ({ onLogin, onRegister }) {
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = '20px';

    const card = document.createElement('div');
    card.className = 'card-glass';
    card.style.maxWidth = '400px';
    card.style.width = '100%';
    card.style.padding = '32px';
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
    subtitle.style.marginBottom = '24px';
    card.appendChild(subtitle);

    // Toggle Buttons
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.justifyContent = 'center';
    toggleContainer.style.marginBottom = '24px';
    toggleContainer.style.background = 'rgba(255,255,255,0.05)';
    toggleContainer.style.borderRadius = '8px';
    toggleContainer.style.padding = '4px';

    const loginToggle = document.createElement('button');
    loginToggle.textContent = 'Log In';
    loginToggle.style.flex = '1';
    loginToggle.style.padding = '8px';
    loginToggle.style.border = 'none';
    loginToggle.style.borderRadius = '6px';
    loginToggle.style.cursor = 'pointer';
    loginToggle.style.color = 'white';

    const signupToggle = document.createElement('button');
    signupToggle.textContent = 'Sign Up';
    signupToggle.style.flex = '1';
    signupToggle.style.padding = '8px';
    signupToggle.style.border = 'none';
    signupToggle.style.borderRadius = '6px';
    signupToggle.style.cursor = 'pointer';
    signupToggle.style.color = 'white';

    toggleContainer.appendChild(loginToggle);
    toggleContainer.appendChild(signupToggle);
    card.appendChild(toggleContainer);

    // Form Container
    const formContainer = document.createElement('div');
    card.appendChild(formContainer);

    // Helper: Create Input
    const createInput = (placeholder, type = 'text') => {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.style.width = '100%';
        input.style.padding = '12px';
        input.style.background = 'rgba(0,0,0,0.2)';
        input.style.border = '1px solid var(--surface-border)';
        input.style.borderRadius = 'var(--border-radius)';
        input.style.color = 'white';
        input.style.fontSize = '1rem';
        input.style.outline = 'none';
        input.style.marginBottom = '12px';
        return input;
    };

    // --- RENDER LOGIN ---
    function renderLogin() {
        formContainer.innerHTML = '';
        loginToggle.style.background = 'var(--primary)';
        loginToggle.style.fontWeight = 'bold';
        signupToggle.style.background = 'transparent';
        signupToggle.style.fontWeight = 'normal';

        const userIn = createInput('Username');
        const passIn = createInput('Password', 'password');
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.style.width = '100%';
        btn.textContent = 'LOG IN';

        btn.onclick = () => {
            if (onLogin) onLogin(userIn.value, passIn.value);
        };

        // Enter key support
        passIn.onkeypress = (e) => { if (e.key === 'Enter') btn.click(); };

        formContainer.appendChild(userIn);
        formContainer.appendChild(passIn);
        formContainer.appendChild(btn);
    }

    // --- RENDER SIGNUP ---
    function renderSignup() {
        formContainer.innerHTML = '';
        signupToggle.style.background = 'var(--primary)';
        signupToggle.style.fontWeight = 'bold';
        loginToggle.style.background = 'transparent';
        loginToggle.style.fontWeight = 'normal';

        const nameIn = createInput('Full Name'); // Name
        const idIn = createInput('Matrix Number'); // Matrix No
        const groupIn = createInput('Tutorial Group'); // Group
        const userIn = createInput('Username'); // Username
        const passIn = createInput('Password', 'password'); // Password

        const btn = document.createElement('button');
        btn.className = 'btn btn-accent';
        btn.style.width = '100%';
        btn.style.background = 'var(--secondary)';
        btn.style.color = 'white';
        btn.textContent = 'SIGN UP';

        btn.onclick = () => {
            if (onRegister) {
                onRegister({
                    name: nameIn.value,
                    studentId: idIn.value,
                    classGroup: groupIn.value,
                    username: userIn.value,
                    password: passIn.value
                });
            }
        };

        formContainer.appendChild(nameIn);
        formContainer.appendChild(idIn);
        formContainer.appendChild(groupIn);
        formContainer.appendChild(userIn);
        formContainer.appendChild(passIn);
        formContainer.appendChild(btn);
    }

    // Bind Toggles
    loginToggle.onclick = renderLogin;
    signupToggle.onclick = renderSignup;

    // Default View
    renderLogin();

    container.appendChild(card);
    return container;
};
