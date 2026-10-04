// ==========================================
// AUTHENTICATION SYSTEM (IN-PLACE UPGRADE)
// ==========================================

// Helper: Email format validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// REGISTER HANDLER
function handleRegister(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    // 1. Required Fields Check
    if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields.', 'error');
        return false;
    }

    // 2. Email Format Check
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        return false;
    }

    // 3. Minimum Password Length Check
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return false;
    }

    // 4. Password Confirmation Match
    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return false;
    }

    // Load existing users from state or storage
    const users = appState.users || [];

    // 5. Unique Username Check
    const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (usernameExists) {
        showToast('Username is already taken.', 'error');
        return false;
    }

    // 6. Unique Email Check
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === email);
    if (emailExists) {
        showToast('An account with this email already exists.', 'error');
        return false;
    }

    // Construct New User Object
    const newUser = {
        id: 'user_' + Date.now(),
        username: escapeHTML(username),
        email: escapeHTML(email),
        password: password, // Frontend prototype storage
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
        bio: 'Digital artist & community member.',
        joinedDate: new Date().toISOString(),
        followers: [],
        following: []
    };

    // Update State and LocalStorage
    appState.users.push(newUser);
    appState.currentUser = newUser;

    localStorage.setItem('arts_community_users', JSON.stringify(appState.users));
    localStorage.setItem('arts_community_current_user', JSON.stringify(newUser));

    // Update Navigation Header & UI
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    
    closeModal();
    showToast(`Welcome to Arts-Community, ${newUser.username}!`, 'success');

    // Reset Form Fields
    if (usernameInput) usernameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    return true;
}

// LOGIN HANDLER
function handleLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';

    // 1. Basic Presence Validation
    if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return false;
    }

    const users = appState.users || [];

    // 2. Find User by Email
    const targetUser = users.find(u => u.email && u.email.toLowerCase() === email);

    if (!targetUser) {
        showToast('Invalid email or password.', 'error');
        return false;
    }

    // 3. Password Verification & Legacy Handling
    if (targetUser.password) {
        if (targetUser.password !== password) {
            showToast('Invalid email or password.', 'error');
            return false;
        }
    } else {
        // Fallback for legacy prototype users without stored passwords
        targetUser.password = password;
        localStorage.setItem('arts_community_users', JSON.stringify(appState.users));
    }

    // 4. Session Set
    appState.currentUser = targetUser;
    localStorage.setItem('arts_community_current_user', JSON.stringify(targetUser));

    // Update UI Header & Close Modal
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    closeModal();
    showToast(`Welcome back, ${targetUser.username}!`, 'success');

    // Reset Form Inputs
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    return true;
}

// LOGOUT HANDLER
function handleLogout() {
    appState.currentUser = null;
    localStorage.removeItem('arts_community_current_user');

    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    showToast('You have been logged out.', 'info');
    
    // Redirect to home or refresh current route safely
    if (window.location.hash !== '' && window.location.hash !== '#home') {
        window.location.hash = '#home';
    }
}

// SESSION RESTORATION (Call on initial script execution)
function initAuthSession() {
    try {
        const savedUser = localStorage.getItem('arts_community_current_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Verify user still exists in storage
            const matchedUser = appState.users.find(u => u.id === parsedUser.id || u.email === parsedUser.email);
            if (matchedUser) {
                appState.currentUser = matchedUser;
            } else {
                appState.currentUser = parsedUser;
            }
        }
    } catch (e) {
        console.error('Error restoring user session:', e);
        localStorage.removeItem('arts_community_current_user');
    }

    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
                                   }
