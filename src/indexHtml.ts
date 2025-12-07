export default `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grimoire - Summon Documentation</title>

    <!-- Bootstrap Icons via JSDelivr -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <style>
        /* Modern CSS Reset & Variables */
        :root {
            /* Colors: Vue/Nuxt inspired palette */
            --c-primary: #10b981;       /* Emerald 500 */
            --c-primary-hover: #059669; /* Emerald 600 */
            --c-primary-light: #d1fae5; /* Emerald 100 */
            --c-primary-glow: rgba(16, 185, 129, 0.15);

            --c-secondary: #0f766e;     /* Teal 700 */

            --c-bg: #f8fafc;            /* Slate 50 */
            --c-surface: #ffffff;       /* White */
            --c-border: #e2e8f0;        /* Slate 200 */

            --c-text-main: #334155;     /* Slate 700 */
            --c-text-muted: #64748b;    /* Slate 500 */
            --c-text-light: #94a3b8;    /* Slate 400 */

            --c-accent-pink: #ec4899;   /* Pink 500 */

            /* Gradients */
            --g-primary: linear-gradient(135deg, #059669 0%, #14b8a6 100%);

            /* Spacing & Layout */
            --radius-md: 0.75rem;
            --radius-lg: 1rem;
            --radius-full: 9999px;

            /* Typography */
            --font-sans: system-ui, -apple-system, sans-serif;
            --font-mono: ui-monospace, SFMono-Regular, monospace;
        }

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--c-bg);
            color: var(--c-text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.6;
        }

        a { text-decoration: none; color: inherit; }
        button, input { font-family: inherit; }

        /* --- Components --- */

        /* Header */
        .app-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--c-border);

            & .container {
                max-width: 80rem;
                margin: 0 auto;
                padding: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 1rem;
            }
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;

            & .icon-wrapper {
                position: relative;
                color: var(--c-primary);
                font-size: 2rem;
                display: flex;

                & .ping {
                    position: absolute;
                    top: 2px; right: 2px;
                    width: 6px; height: 6px;
                    background-color: #4ade80;
                    border-radius: 50%;
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            }

            & .title-group {
                display: flex;
                flex-direction: column;
                line-height: 1;

                & h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: var(--g-primary);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    letter-spacing: -0.025em;
                }
                & span {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 600;
                    color: var(--c-text-muted);
                }
            }

            &:hover .title-group h1 {
                filter: brightness(1.1);
            }
        }

        .sponsor-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--c-surface);
            border: 1px solid var(--c-border);
            border-radius: var(--radius-full);
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--c-text-main);
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);

            & i {
                font-size: 1rem;
                color: var(--c-text-light);
                transition: color 0.2s;
            }

            &:hover {
                border-color: #fbcfe8; /* Pink 200 */
                background-color: #fdf2f8; /* Pink 50 */
                color: var(--c-accent-pink);

                & i {
                    color: var(--c-accent-pink);
                }
            }
        }

        /* Main Layout */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 2rem 1rem;
            overflow: hidden;
        }

        /* Background Effects */
        .bg-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            z-index: -1;
            opacity: 0.4;
            pointer-events: none;

            &.top-right {
                top: -10%; right: -5%;
                width: 600px; height: 600px;
                background: radial-gradient(circle, #d1fae5 0%, transparent 70%);
            }
            &.bottom-left {
                bottom: -10%; left: -5%;
                width: 500px; height: 500px;
                background: radial-gradient(circle, #ccfbf1 0%, transparent 70%);
            }
        }

        /* Hero Section */
        .hero {
            text-center: center;
            max-width: 48rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
            width: 100%;
        }

        .hero-icon {
            position: relative;
            background: var(--c-surface);
            padding: 2rem;
            border-radius: 1.5rem;
            border: 1px solid #f1f5f9;
            box-shadow: 
                0 20px 25px -5px rgba(0, 0, 0, 0.1), 
                0 8px 10px -6px rgba(0, 0, 0, 0.1);
            animation: badge-glow 3s infinite;
            font-size: 5rem;
            color: var(--c-primary);
            line-height: 1;
        }

        .hero-text {
            & h2 {
                font-size: 3rem;
                font-weight: 800;
                line-height: 1.1;
                margin-bottom: 1rem;
                color: #1e293b;

                & .highlight {
                    background: var(--g-primary);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
            }

            & p {
                font-size: 1.125rem;
                color: var(--c-text-muted);
                max-width: 36rem;
                margin: 0 auto;

                & strong {
                    color: var(--c-secondary);
                }
            }
        }

        /* Search Form (Using :has) */
        .search-form {
            width: 100%;
            max-width: 36rem;
            position: relative;
            margin-top: 1rem;
        }

        .search-wrapper {
            position: relative;
            background: var(--c-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--c-border);
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

            &:has(input:focus) {
                border-color: var(--c-primary);
                box-shadow: 0 0 0 4px var(--c-primary-glow);

                & .search-icon {
                    color: var(--c-primary);
                }
            }

            & .search-icon {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.25rem;
                color: var(--c-text-light);
                transition: color 0.2s;
            }

            & input {
                width: 100%;
                padding: 1rem 1rem 1rem 3.5rem;
                border: none;
                background: transparent;
                font-size: 1.125rem;
                font-family: var(--font-mono);
                color: var(--c-text-main);
                outline: none;

                &::placeholder {
                    color: var(--c-text-light);
                }
            }

            & button {
                position: absolute;
                right: 0.5rem;
                top: 0.5rem;
                bottom: 0.5rem;
                background-color: var(--c-primary);
                color: white;
                border: none;
                padding: 0 1.5rem;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background-color: var(--c-primary-hover);
                }
            }
        }

        /* Feature Grid */
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            width: 100%;
            max-width: 48rem;
            margin-top: 3rem;
        }

        .feature-card {
            background: var(--c-surface);
            padding: 1.5rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--c-border);
            text-align: center;
            transition: all 0.2s ease;
            cursor: default;

            &:hover {
                transform: translateY(-2px);
                border-color: var(--c-primary-light);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }

            & .icon-box {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
                margin-bottom: 0.75rem;
                font-size: 1.5rem;

                &.emerald { background: #ecfdf5; color: #059669; }
                &.teal { background: #f0f9ff; color: #0891b2; }
                &.green { background: #f0fdf4; color: #16a34a; }
            }

            & h3 {
                font-size: 1rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }

            & p {
                font-size: 0.75rem;
                color: var(--c-text-muted);
            }
        }

        /* Quick Links */
        .quick-links {
            margin-top: 2rem;
            text-align: center;

            & p {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                font-weight: 700;
                color: var(--c-text-light);
                margin-bottom: 1rem;
                font-family: var(--font-mono);
            }

            & .tags {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.75rem;
            }

            & button {
                background: var(--c-surface);
                border: 1px solid var(--c-border);
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                color: var(--c-text-muted);
                font-family: var(--font-mono);
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    border-color: var(--c-primary-light);
                    color: var(--c-primary-hover);
                    background-color: #f0fdf4;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
            }
        }

        /* Footer */
        .app-footer {
            border-top: 1px solid var(--c-border);
            background: var(--c-surface);
            padding: 2rem 1rem;

            & .container {
                max-width: 80rem;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                color: var(--c-text-muted);
                font-size: 0.875rem;

                @media (min-width: 768px) {
                    flex-direction: row;
                    justify-content: space-between;
                }
            }

            & .links {
                display: flex;
                gap: 1.5rem;
                align-items: center;

                & a {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    transition: color 0.2s;

                    &:hover {
                        color: var(--c-accent-pink);
                    }

                    & i { font-size: 0.875rem; }
                }
            }
        }

        /* Keyframes */
        @keyframes ping {
            75%, 100% {
                transform: scale(2);
                opacity: 0;
            }
        }

        @keyframes badge-glow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* Media Queries for Responsive Typography */
        @media (max-width: 640px) {
            .hero-text h2 { font-size: 2.25rem; }
            .app-header .container { justify-content: center; }
        }

    </style>
</head>
<body>

    <!-- Header -->
    <header class="app-header">
        <div class="container">
            <div class="brand" onclick="window.location.href='/'">
                <div class="icon-wrapper">
                    <i class="bi bi-book"></i>
                    <div class="ping"></div>
                </div>
                <div class="title-group">
                    <h1>Grimoire</h1>
                    <span>API Doc Generator</span>
                </div>
            </div>

            <!-- Sponsor Button -->
            <a href="https://github.com/sponsors/tani" target="_blank" class="sponsor-btn">
                <i class="bi bi-heart-fill"></i>
                <span>Sponsor @tani</span>
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Background Blobs -->
        <div class="bg-blob top-right"></div>
        <div class="bg-blob bottom-left"></div>

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-icon">
                <i class="bi bi-file-earmark-richtext"></i>
            </div>

            <div class="hero-text">
                <h2>
                    <span class="highlight">Summon</span> Documentation
                </h2>
                <p>
                    Transform any NPM package into a readable Grimoire.<br>
                    Automatically fetches READMEs and generates <strong>TypeDoc</strong> API references.
                </p>
            </div>

            <!-- Search Form -->
            <form class="search-form" onsubmit="event.preventDefault(); const pkg = document.querySelector('input[name=package]').value; if(pkg) window.location.href='/' + pkg;">
                <div class="search-wrapper">
                    <i class="bi bi-search search-icon"></i>
                    <input 
                        type="text" 
                        name="package"
                        placeholder="Enter package name (e.g. three, react)..." 
                        autocomplete="off"
                        required
                        autofocus
                    >
                    <button type="submit">Go</button>
                </div>
            </form>

            <!-- Feature Grid -->
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="icon-box emerald">
                        <i class="bi bi-magic"></i>
                    </div>
                    <h3>Instant Summon</h3>
                    <p>Zero configuration needed.</p>
                </div>
                <div class="feature-card">
                    <div class="icon-box teal">
                        <i class="bi bi-file-earmark-code"></i>
                    </div>
                    <h3>Type Definitions</h3>
                    <p>Parses TSDoc comments directly.</p>
                </div>
                <div class="feature-card">
                    <div class="icon-box green">
                        <i class="bi bi-gem"></i>
                    </div>
                    <h3>Source of Truth</h3>
                    <p>Direct from NPM registry.</p>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="quick-links">
                <p>Select a spell to cast</p>
                <div class="tags">
                    <button onclick="window.location.href='/react'">react</button>
                    <button onclick="window.location.href='/markdown-it'">markdown-it</button>
                    <button onclick="window.location.href='/remark'">remark</button>
                    <button onclick="window.location.href='/commonmark'">commonmark</button>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
        <div class="container">
            <p>Grimoire &copy; 2024. Data sourced via Unpkg & NPM Registry.</p>
            <div class="links">
                <a href="https://github.com/sponsors/tani" target="_blank">
                    <i class="bi bi-heart-fill"></i> Sponsor
                </a>
                <a href="#">About</a>
                <a href="https://github.com/tani/grimoire">GitHub</a>
            </div>
        </div>
    </footer>

</body>
</html>
`;
