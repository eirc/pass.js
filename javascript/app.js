(function () {
    function App() {
        var self = this;

        self.ui = new passJS.ui.Main();
        self.keyring = new openpgp.Keyring();

        self.ui.addEventListener('main:private-key-select', function (event) {
            self.ui.preparePrivateKeyNotification(event.detail.file.name);
        });

        self.ui.addEventListener('main:encrypted-file-select', function (event) {
            self.ui.prepareEncryptedFileNotification(event.detail.file.name);
        });

        self.ui.addEventListener('main:private-key-load', function (event) {
            var keys = openpgp.key.readBinaryOrArmored(event.detail.file).
                keys.
                filter(function (key) {
                    return key.isPrivate();
                });

            if (keys.length > 0) {
                self.ui.displayPrivateKeyOkNotification();
            } else {
                self.ui.displayPrivateKeyErrorNotification();
            }

            keys.forEach(function (key) {
                self.keyring.privateKeys.importKey(key.armor());
                self.keyring.store();
                self.__loadKeyring();
            });
        });

        self.ui.addEventListener('main:encrypted-file-load', function (event) {
            var message = openpgp.message.readBinaryOrArmored(event.detail.file);

            if (message) {
                self.ui.displayEncryptedFileOkNotification();
                self.__decryptFile(message);
            } else {
                self.ui.displayEncryptedFileErrorNotification();
            }
        });

        self.__loadKeyring();
    }

    App.prototype.__loadKeyring = function () {
        var self = this;

        self.ui.clearLoadedKeys();
        self.keyring.privateKeys.keys.forEach(function (key) {
            var keyWidget = new passJS.ui.KeyWidget();

            keyWidget.setLocked(!key.primaryKey.isDecrypted);
            keyWidget.setUserId(key.getUserIds().join(', '));

            keyWidget.addEventListener('key-widget:remove', function () {
                self.keyring.removeKeysForId(key.primaryKey.getKeyId().toHex());
                self.keyring.store();
                self.ui.removeLoadedKeyWidget(keyWidget);
            });

            keyWidget.addEventListener('key-widget:enter-password', function (event) {
                key.decrypt(event.detail.password);
                keyWidget.setLocked(!key.primaryKey.isDecrypted);
            });

            self.ui.addLoadedKeyWidget(keyWidget);
        });
    };

    App.prototype.__decryptFile = function (file) {
        var self = this;

        self.ui.clearDecrypted();
        self.ui.hideDecrypting();
        self.ui.hideDecryptionError();

        var availableDecryptedKeys = self.keyring.privateKeys.keys.
            filter(function (key) {
                return key.primaryKey.isDecrypted;
            });

        if (availableDecryptedKeys.length > 0) {
            self.ui.displayDecrypting();

            // Wrap the slow decryption process in a timeout block so it won't block the browser,
            // also give it a few milliseconds for the renderings above to happen in the browser.
            // The async worker API would be useful here but it cannot work with the file:// protocol due to browser
            // security restrictions and working with file:// is a hard requirement.
            setTimeout(function () {
                var decrypted = availableDecryptedKeys.some(function (key) {
                    var decryptedData = null;
                    try {
                        decryptedData = openpgp.decryptMessage(key, file);
                    } catch (e) {
                    }

                    if (!decryptedData) {
                        return false;
                    }

                    var decryptedPassword = decryptedData.split("\n")[0];

                    self.ui.hideDecrypting();

                    if (decryptedPassword.trim() !== '') {
                        if (decryptedData.trim() !== decryptedPassword) {
                            self.ui.displayDecryptedPassword(decryptedPassword);
                            self.ui.displayDecryptedData(decryptedData);
                        } else {
                            self.ui.displayDecryptedPassword(decryptedData);
                        }
                    } else {
                        self.ui.displayDecryptedData(decryptedData);
                    }

                    return true;
                });

                if (!decrypted) {
                    self.ui.hideDecrypting();
                    self.ui.displayDecryptionError();
                }
            }, 10);
        }
    };

    App.init = function() {
        return new App();
    };

    window.passJS = window.passJS || {};
    window.passJS.App = App;
}());
