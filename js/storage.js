/**
 * StorageManager - Handles all interactions with LocalStorage.
 * Keys: 'printers', 'materials', 'projects', 'settings'
 */
const StorageManager = {
    // defaults
    defaults: {
        settings: {
            kwhCost: 0.80, // R$
            laborCost: 20.00, // R$
            markup: 50, // %
            currency: 'BRL'
        }
    },

    // --- Generic Helpers ---
    _get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            console.error('Error parsing storage for ' + key, e);
            return []; // Fallback to empty to prevent app crash
        }
    },
    _set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),

    // --- Printers ---
    getPrinters: function () {
        return this._get('printers');
    },
    savePrinter: function (printer) {
        let printers = this.getPrinters();
        if (printer.id) {
            const index = printers.findIndex(p => p.id === printer.id);
            if (index !== -1) printers[index] = printer;
        } else {
            printer.id = Date.now().toString();
            printers.push(printer);
        }
        this._set('printers', printers);
        return printer;
    },
    deletePrinter: function (id) {
        let printers = this.getPrinters();
        printers = printers.filter(p => p.id !== id);
        this._set('printers', printers);
    },

    // --- Materials ---
    getMaterials: function () {
        return this._get('materials');
    },
    saveMaterial: function (material) {
        let materials = this.getMaterials();
        if (material.id) {
            const index = materials.findIndex(m => m.id === material.id);
            if (index !== -1) materials[index] = material;
        } else {
            material.id = Date.now().toString();
            materials.push(material);
        }
        this._set('materials', materials);
        return material;
    },
    deleteMaterial: function (id) {
        let materials = this.getMaterials();
        materials = materials.filter(m => m.id !== id);
        this._set('materials', materials);
    },

    // --- Projects ---
    getProjects: function () {
        return this._get('projects');
    },
    saveProject: function (project) {
        let projects = this.getProjects();
        if (!project.id) {
            project.id = Date.now().toString();
        }
        project.updatedAt = new Date().toISOString();

        // Check if exists to update or push new
        const index = projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            projects[index] = project;
        } else {
            projects.unshift(project); // Add to beginning
        }

        // Limit history to 50 items to save space
        if (projects.length > 50) projects.pop();

        this._set('projects', projects);
        return project;
    },
    deleteProject: function (id) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        this._set('projects', projects);
    },

    // --- Settings ---
    getSettings: function () {
        const stored = JSON.parse(localStorage.getItem('settings'));
        return { ...this.defaults.settings, ...stored };
    },
    saveSettings: function (settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    },

    // --- Backup/Restore ---
    exportData: function () {
        const data = {
            printers: this.getPrinters(),
            materials: this.getMaterials(),
            projects: this.getProjects(),
            settings: this.getSettings(),
            timestamp: new Date().toISOString()
        };
        return JSON.stringify(data);
    },
    importData: function (jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.printers) this._set('printers', data.printers);
            if (data.materials) this._set('materials', data.materials);
            if (data.projects) this._set('projects', data.projects);
            if (data.settings) this.saveSettings(data.settings);
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
};
