(function () {
    function FileDrop(root) {
        var self = this;

        self.root = root || document.createElement('div');

        self.hiddenFileInput = document.createElement('input');
        self.hiddenFileInput.type = 'file';
        self.hiddenFileInput.style.display = 'none';

        self.root.addEventListener('click', function () {
            self.hiddenFileInput.click();
        });

        self.fileReader = new FileReader();
        self.fileReader.onload = function (event) {
            self.__triggerEvent('load', { file: event.target.result });
        };

        self.hiddenFileInput.addEventListener('drop', function () {
            event.stopPropagation();
        });

        self.hiddenFileInput.addEventListener('change', function (event) {
            // TODO: handle multiple file drops
            self.__triggerEvent('select', { file: event.target.files[0] });
            self.fileReader.readAsBinaryString(event.target.files[0]);
        });

        self.root.addEventListener('dragover', function () {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });

        self.root.addEventListener('drop', function (event) {
            event.preventDefault();
            // TODO: handle multiple file drops
            self.__triggerEvent('select', { file: event.dataTransfer.files[0] });
            self.fileReader.readAsBinaryString(event.dataTransfer.files[0]);
        });

        self.root.appendChild(self.hiddenFileInput);
    }

    FileDrop.prototype.__triggerEvent = function (eventType, detail) {
        var self = this;

        if (typeof detail === 'undefined') {
            detail = {};
        }

        self.root.dispatchEvent(new CustomEvent('file-drop:' + eventType, { detail: detail }));
    };

    FileDrop.prototype.addEventListener = function (type, listener, useCapture) {
        var self = this;

        self.root.addEventListener(type, listener, useCapture);
    };

    window.passJS = window.passJS || {};
    window.passJS.FileDrop = FileDrop;
})();
