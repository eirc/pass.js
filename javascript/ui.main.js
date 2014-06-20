(function () {
    function Main(root) {
        var self = this;

        self.root = root || document.createElement('div');

        self.privateKeyDropArea = document.getElementById('private_key_drop_area');
        self.privateKeyOkNotification = document.getElementById('private_key_ok_notification');
        self.privateKeyFilename = document.getElementById('private_key_filename');
        self.privateKeyErrorNotification = document.getElementById('private_key_error_notification');
        self.loadedKeys = document.getElementById('loaded_keys');
        self.encryptedFileDropArea = document.getElementById('encrypted_file_drop_area');
        self.encryptedFileOkNotification = document.getElementById('encrypted_file_ok_notification');
        self.encryptedFileFilename = document.getElementById('encrypted_file_filename');
        self.encryptedFileErrorNotification = document.getElementById('encrypted_file_error_notification');
        self.decryptingInProgress = document.getElementById('decrypting_in_progress');
        self.couldNotDecrypt = document.getElementById('could_not_decrypt');
        self.decryptedPasswordArea = document.getElementById('decrypted_password_area');
        self.decryptedPasswordInput = document.getElementById('decrypted_password');
        self.decryptedDataArea = document.getElementById('decrypted_data_area');
        self.decryptedDataTextarea = document.getElementById('decrypted_data');

        self.privateKeyFileDrop = new passJS.FileDrop(self.privateKeyDropArea);
        self.encryptedFileFileDrop = new passJS.FileDrop(self.encryptedFileDropArea);

        self.privateKeyFileDrop.addEventListener('file-drop:select', function(event) {
            self.__triggerEvent('private-key-select', { file: event.detail.file });
        });

        self.privateKeyFileDrop.addEventListener('file-drop:load', function(event) {
            self.__triggerEvent('private-key-load', { file: event.detail.file });
        });

        self.encryptedFileFileDrop.addEventListener('file-drop:select', function(event) {
            self.__triggerEvent('encrypted-file-select', { file: event.detail.file });
        });

        self.encryptedFileFileDrop.addEventListener('file-drop:load', function(event) {
            self.__triggerEvent('encrypted-file-load', { file: event.detail.file });
        });
    }

    Main.prototype.displayDecryptedPassword = function (password) {
        var self = this;

        self.decryptedPasswordArea.style.display = 'block';
        self.decryptedPasswordInput.value = password;
        self.decryptedPasswordInput.focus();

        if ('select' in self.decryptedPasswordInput) {
            self.decryptedPasswordInput.select();
        } else if ('setSelectionRange' in self.decryptedPasswordInput) {
            self.decryptedPasswordInput.setSelectionRange(0, self.decryptedPasswordInput.value.length);
        }
    };

    Main.prototype.preparePrivateKeyNotification = function (filename) {
        var self = this;

        self.privateKeyOkNotification.style.display = 'none';
        self.privateKeyErrorNotification.style.display = 'none';
        self.privateKeyFilename.textContent = filename;
    };

    Main.prototype.displayPrivateKeyOkNotification = function () {
        var self = this;

        self.privateKeyOkNotification.style.display = 'block';
    };

    Main.prototype.displayPrivateKeyErrorNotification = function () {
        var self = this;

        self.privateKeyErrorNotification.style.display = 'block';
    };

    Main.prototype.prepareEncryptedFileNotification = function (filename) {
        var self = this;

        self.encryptedFileOkNotification.style.display = 'none';
        self.encryptedFileErrorNotification.style.display = 'none';
        self.encryptedFileFilename.textContent = filename;
    };

    Main.prototype.displayEncryptedFileOkNotification = function () {
        var self = this;

        self.encryptedFileOkNotification.style.display = 'block';
    };

    Main.prototype.displayEncryptedFileErrorNotification = function () {
        var self = this;

        self.encryptedFileErrorNotification.style.display = 'block';
    };

    Main.prototype.displayDecryptedData = function (data) {
        var self = this;

        self.decryptedDataTextarea.value = data;
        self.decryptedDataArea.style.display = 'block';
    };

    Main.prototype.clearDecrypted = function () {
        var self = this;

        self.decryptedPasswordInput.value = '';
        self.decryptedDataTextarea.value = '';
        self.decryptedPasswordArea.style.display = 'none';
        self.decryptedDataArea.style.display = 'none';
    };

    Main.prototype.displayDecrypting = function () {
        var self = this;

        self.decryptingInProgress.style.display = 'block';
    };

    Main.prototype.hideDecrypting = function () {
        var self = this;

        self.decryptingInProgress.style.display = 'none';
    };

    Main.prototype.displayDecryptionError = function () {
        var self = this;

        self.couldNotDecrypt.style.display = 'block';
    };

    Main.prototype.hideDecryptionError = function () {
        var self = this;

        self.couldNotDecrypt.style.display = 'none';
    };

    Main.prototype.addLoadedKeyWidget = function(keyWidget) {
        var self = this;

        self.loadedKeys.appendChild(keyWidget.root);
    };

    Main.prototype.removeLoadedKeyWidget = function(keyWidget) {
        var self = this;

        self.loadedKeys.removeChild(keyWidget.root);
    };

    Main.prototype.clearLoadedKeys = function() {
        var self = this;

        self.loadedKeys.innerHTML = '';
    };

    Main.prototype.addEventListener = function (type, listener, useCapture) {
        var self = this;

        self.root.addEventListener(type, listener, useCapture);
    };

    Main.prototype.__triggerEvent = function (eventType, detail) {
        var self = this;

        if (typeof detail === 'undefined') {
            detail = {};
        }

        self.root.dispatchEvent(new CustomEvent('main:' + eventType, { detail: detail }));
    };

    window.passJS = window.passJS || {};
    window.passJS.ui.Main = Main;
})();
