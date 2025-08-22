class ThemeEditor {
    constructor() {
        this.theme = {
            name: '',
            author: '',
            version: '1.0',
            description: '',
            colors: {
                background: '#0a0a12',
                text: '#ffffff',
                secondaryText: '#e0e0e0',
                accent: '#00ff9d',
                buttonBackground: 'rgba(255, 255, 255, 0.1)',
                buttonHover: 'rgba(255, 255, 255, 0.2)',
                sidebarBackground: 'rgba(0, 0, 0, 0.5)',
                overlayBackground: 'rgba(0, 0, 0, 0.3)'
            },
            gradients: {
                primary: {
                    type: 'linear',
                    angle: 45,
                    stops: [
                        { color: '#0f0f1a', position: 0 },
                        { color: '#1a1a2e', position: 100 }
                    ]
                },
                secondary: {
                    type: 'linear',
                    angle: 45,
                    stops: [
                        { color: '#1f4287', position: 0 },
                        { color: '#2d6cdf', position: 100 }
                    ]
                }
            }
        };

        this.initializeEventListeners();
        this.loadThemeFromURL();
    }

    initializeEventListeners() {
        // Metadata inputs
        document.getElementById('themeName').addEventListener('input', (e) => {
            this.theme.name = e.target.value;
            this.updatePreview();
        });

        document.getElementById('themeAuthor').addEventListener('input', (e) => {
            this.theme.author = e.target.value;
        });

        document.getElementById('themeVersion').addEventListener('input', (e) => {
            this.theme.version = e.target.value;
        });

        document.getElementById('themeDescription').addEventListener('input', (e) => {
            this.theme.description = e.target.value;
        });

        // Color inputs
        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            this.theme.colors.background = e.target.value;
            this.updatePreview();
        });

        document.getElementById('textColor').addEventListener('input', (e) => {
            this.theme.colors.text = e.target.value;
            this.updatePreview();
        });

        document.getElementById('secondaryText').addEventListener('input', (e) => {
            this.theme.colors.secondaryText = e.target.value;
            this.updatePreview();
        });

        document.getElementById('accentColor').addEventListener('input', (e) => {
            this.theme.colors.accent = e.target.value;
            this.updatePreview();
        });

        // Background settings
        document.getElementById('buttonBackground').addEventListener('input', (e) => {
            this.theme.colors.buttonBackground = e.target.value;
            this.updatePreview();
        });

        document.getElementById('buttonHover').addEventListener('input', (e) => {
            this.theme.colors.buttonHover = e.target.value;
            this.updatePreview();
        });

        document.getElementById('sidebarBackground').addEventListener('input', (e) => {
            this.theme.colors.sidebarBackground = e.target.value;
            this.updatePreview();
        });

        document.getElementById('overlayBackground').addEventListener('input', (e) => {
            this.theme.colors.overlayBackground = e.target.value;
            this.updatePreview();
        });

        // Gradient inputs
        ['primary', 'secondary'].forEach(gradientType => {
            document.getElementById(`${gradientType}GradientStart`).addEventListener('input', (e) => {
                this.theme.gradients[gradientType].stops[0].color = e.target.value;
                this.updatePreview();
            });

            document.getElementById(`${gradientType}GradientEnd`).addEventListener('input', (e) => {
                this.theme.gradients[gradientType].stops[1].color = e.target.value;
                this.updatePreview();
            });

            document.getElementById(`${gradientType}GradientAngle`).addEventListener('input', (e) => {
                this.theme.gradients[gradientType].angle = parseInt(e.target.value);
                this.updatePreview();
            });
        });

        // Export/Import buttons
        document.getElementById('exportTheme').addEventListener('click', () => this.exportTheme());
        document.getElementById('importTheme').addEventListener('click', () => {
            document.getElementById('themeFileInput').click();
        });

        document.getElementById('themeFileInput').addEventListener('change', (e) => {
            this.importTheme(e);
        });
    }

    updatePreview() {
        // Update the preview window with current theme settings
        const previewWindow = document.querySelector('.preview-window');
        const root = document.documentElement;

        Object.entries(this.theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--${this.camelToKebab(key)}`, value);
        });

        const primaryGradient = this.createGradientString(this.theme.gradients.primary);
        const secondaryGradient = this.createGradientString(this.theme.gradients.secondary);

        root.style.setProperty('--primary-gradient', primaryGradient);
        root.style.setProperty('--secondary-gradient', secondaryGradient);
    }

    camelToKebab(string) {
        return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    createGradientString(gradient) {
        const stops = gradient.stops.map(stop => 
            `${stop.color} ${stop.position}%`
        ).join(', ');
        
        return `${gradient.type}-gradient(${gradient.angle}deg, ${stops})`;
    }

    exportTheme() {
        const themeString = JSON.stringify(this.theme, null, 2);
        const blob = new Blob([themeString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.theme.name || 'theme'}.wmtheme`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importTheme(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const theme = JSON.parse(content);
            
            // Validate theme structure
            if (!this.validateTheme(theme)) {
                alert('Invalid theme file format');
                return;
            }

            // Update the theme object
            this.theme = theme;

            // Update all form inputs
            this.updateFormInputs();
            
            // Update the preview
            this.updatePreview();
            
            event.target.value = '';
        } catch (error) {
            console.error('Error loading theme:', error);
            alert('Error loading theme file');
        }
    }

    validateTheme(theme) {
        const required = ['name', 'colors', 'gradients'];
        if (!required.every(prop => theme.hasOwnProperty(prop))) return false;
        
        const requiredColors = [
            'background', 'text', 'secondaryText', 'accent',
            'buttonBackground', 'buttonHover', 'sidebarBackground',
            'overlayBackground'
        ];
        if (!requiredColors.every(color => theme.colors.hasOwnProperty(color))) return false;

        return true;
    }

    updateFormInputs() {
        // Update metadata inputs
        document.getElementById('themeName').value = this.theme.name || '';
        document.getElementById('themeAuthor').value = this.theme.author || '';
        document.getElementById('themeVersion').value = this.theme.version || '1.0';
        document.getElementById('themeDescription').value = this.theme.description || '';

        // Update color inputs
        document.getElementById('backgroundColor').value = this.theme.colors.background;
        document.getElementById('textColor').value = this.theme.colors.text;
        document.getElementById('secondaryText').value = this.theme.colors.secondaryText;
        document.getElementById('accentColor').value = this.theme.colors.accent;

        // Update background settings
        document.getElementById('buttonBackground').value = this.theme.colors.buttonBackground;
        document.getElementById('buttonHover').value = this.theme.colors.buttonHover;
        document.getElementById('sidebarBackground').value = this.theme.colors.sidebarBackground;
        document.getElementById('overlayBackground').value = this.theme.colors.overlayBackground;

        // Update gradient inputs
        ['primary', 'secondary'].forEach(gradientType => {
            document.getElementById(`${gradientType}GradientStart`).value = this.theme.gradients[gradientType].stops[0].color;
            document.getElementById(`${gradientType}GradientEnd`).value = this.theme.gradients[gradientType].stops[1].color;
            document.getElementById(`${gradientType}GradientAngle`).value = this.theme.gradients[gradientType].angle;
        });
    }

    loadThemeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeFile = urlParams.get('theme');
        if (themeFile) {
            fetch(themeFile)
                .then(response => response.json())
                .then(theme => {
                    if (this.validateTheme(theme)) {
                        this.theme = theme;
                        this.updateFormInputs();
                        this.updatePreview();
                    }
                })
                .catch(error => console.error('Error loading theme from URL:', error));
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.themeEditor = new ThemeEditor();
});
