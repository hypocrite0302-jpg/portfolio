document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Custom Reactive Cursor ---
    const cursorMain = document.getElementById('cursor-main');
    const cursorFollower = document.getElementById('cursor-follower');
    
    document.addEventListener('mousemove', (e) => {
        cursorMain.style.left = e.clientX + 'px';
        cursorMain.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = (e.clientX - 15) + 'px';
            cursorFollower.style.top = (e.clientY - 15) + 'px';
        }, 40);
    });

    const interactiveElements = document.querySelectorAll('a, .btn-primary, #terminal-toggle, .project-card, .nav-links a');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorFollower.style.transform = 'scale(1.5)';
            cursorFollower.style.background = 'rgba(0, 243, 255, 0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursorFollower.style.transform = 'scale(1)';
            cursorFollower.style.background = 'transparent';
        });
    });

    // --- 2. Background Canvas (Particles) ---
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0 || this.y > canvas.height || this.y < 0) {
                this.reset();
            }
        }
        draw() {
            ctx.fillStyle = `rgba(0, 243, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function setupParticles() {
        particles = [];
        for (let i = 0; i < 80; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    initCanvas();
    setupParticles();
    animate();
    window.addEventListener('resize', () => {
        initCanvas();
        setupParticles();
    });

    // --- 3. Scroll Handling & Nav ---
    const scrollContainer = document.getElementById('scroll-container');
    const sections = document.querySelectorAll('.snap-section');
    const navLinks = document.querySelectorAll('.nav-links a');

    scrollContainer.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollContainer.scrollTop >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // --- 4. Global Terminal Interaction ---
    const terminal = document.getElementById('global-terminal');
    const terminalToggle = document.getElementById('terminal-toggle');
    const closeTerminal = document.getElementById('close-terminal');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    terminalToggle.addEventListener('click', () => {
        terminal.classList.toggle('hidden');
        if (!terminal.classList.contains('hidden')) {
            terminalInput.focus();
        }
    });

    closeTerminal.addEventListener('click', () => {
        terminal.classList.add('hidden');
    });

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.value.toLowerCase().trim();
            if (cmd) {
                handleCommand(cmd);
                terminalInput.value = '';
            }
        }
    });

    const commands = {
        help: () => `
            Available Commands:<br>
            - <span class="highlight">whois</span>: Profile summary<br>
            - <span class="highlight">ls</span>: List site sections<br>
            - <span class="highlight">cd [section]</span>: Navigate to section (home, projects, experience, blog)<br>
            - <span class="highlight">projects</span>: View detailed project list<br>
            - <span class="highlight">experience</span>: View career timeline<br>
            - <span class="highlight">blog</span>: Show latest intel feed<br>
            - <span class="highlight">clear</span>: Clear terminal buffer<br>
        `,
        whois: () => `
            User: <span class="highlight">Mayank Attri</span><br>
            Role: Detection Engineer & AI SME<br>
            Impact: 80% Alert Reduction at ReliaQuest<br>
            Status: Active | HackTheBox Researcher<br>
        `,
        ls: () => `
            drwxr-xr-x  home/<br>
            drwxr-xr-x  projects/<br>
            drwxr-xr-x  experience/<br>
            drwxr-xr-x  blog/
        `,
        projects: () => `
            1. <span class="highlight">Cyber_Intel_Pipeline</span>: Selenium + LLM based threat intel.<br>
            2. <span class="highlight">Plug-n-Play_Lab</span>: IaC for Elastic Stack.<br>
            3. <span class="highlight">AI_Automation_Bots</span>: SecEng efficiency tools.<br>
        `,
        experience: () => `
            - <span class="highlight">ReliaQuest</span> (2025-Pres): GreyMatter Specialist.<br>
            - <span class="highlight">HackTheBox</span> (2024-Pres): CTF Researcher.<br>
            - <span class="highlight">Insecsys</span> (2023): Cybersecurity Consultant.<br>
        `,
        blog: () => `
            Latest Intel:<br>
            - LLM-Powered Threat Analysis (2026-03-17)<br>
            - Bypassing JS Protections (2026-03-15)<br>
        `,
        clear: () => {
            terminalOutput.innerHTML = '';
            return null;
        }
    };

    function handleCommand(input) {
        const [cmd, arg] = input.split(' ');
        
        // Echo input
        const echo = document.createElement('div');
        echo.className = 'terminal-line';
        echo.innerHTML = `<span class="prompt">></span> ${input}`;
        terminalOutput.appendChild(echo);

        let result = '';

        if (cmd === 'cd' && arg) {
            const target = document.getElementById(arg);
            if (target) {
                // Determine which container to scroll
                const container = window.innerWidth <= 768 ? window : scrollContainer;
                const scrollTarget = window.innerWidth <= 768 ? target.offsetTop : target.offsetTop;
                
                if (window.innerWidth <= 768) {
                    window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
                } else {
                    scrollContainer.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
                }
                result = `<span class="success">Navigating to ${arg}...</span>`;
            } else {
                result = `<span class="error">Directory not found: ${arg}</span>`;
            }
        } else if (commands[cmd]) {
            const output = commands[cmd]();
            if (output !== null) result = output;
        } else {
            result = `<span class="error">Command not found: ${cmd}</span>. Type 'help' for list.`;
        }

        if (result) {
            const response = document.createElement('div');
            response.className = 'terminal-line';
            response.innerHTML = result;
            terminalOutput.appendChild(response);
        }

        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
});
