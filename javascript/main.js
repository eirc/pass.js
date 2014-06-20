(function () {

    // Page elements
    var privateKeyDropArea = document.getElementById('private_key_drop_area'),
        privateKeyFileInput = document.getElementById('private_key_file_input'),
        privateKeyOkNotification = document.getElementById('private_key_ok_notification'),
        privateKeyFilename = document.getElementById('private_key_filename'),
        privateKeyErrorNotification = document.getElementById('private_key_error_notification'),
        loadedKeys = document.getElementById('loaded_keys'),
        encryptedFileDropArea = document.getElementById('encrypted_file_drop_area'),
        encryptedFileFileInput = document.getElementById('encrypted_file_file_input'),
        encryptedFileOkNotification = document.getElementById('encrypted_file_ok_notification'),
        encryptedFileFilename = document.getElementById('encrypted_file_filename'),
        encryptedFileErrorNotification = document.getElementById('encrypted_file_error_notification'),
        decryptingInProgress = document.getElementById('decrypting_in_progress'),
        couldNotDecrypt = document.getElementById('could_not_decrypt'),
        decryptedPasswordArea = document.getElementById('decrypted_password_area'),
        decryptedPasswordInput = document.getElementById('decrypted_password'),
        decryptedDataArea = document.getElementById('decrypted_data_area'),
        decryptedDataTextarea = document.getElementById('decrypted_data');

    // Local shared variables
    var privateKeyFileReader = new FileReader(),
        encryptedFileReader = new FileReader(),
        keyring = new openpgp.Keyring();

    var appendKeyToLoadedKeys = function (key) {
        var keyContainer = document.createElement('div');
        var lockedIcon = document.createElement('img');
        var unlockedIcon = document.createElement('img');
        var removeIcon = document.createElement('img');
        var userId = document.createElement('span');
        var keyPasswordContainer = document.createElement('div');
        var keyPasswordField = document.createElement('input');

        lockedIcon.alt = 'Lock';
        lockedIcon.title = 'Key is locked';
        lockedIcon.src = 'lock.png';
        lockedIcon.style.display = 'none';
        keyContainer.appendChild(lockedIcon);

        unlockedIcon.alt = 'Unlock';
        unlockedIcon.title = 'Key is unlocked';
        unlockedIcon.src = 'unlock.png';
        unlockedIcon.style.display = 'none';
        keyContainer.appendChild(unlockedIcon);

        removeIcon.alt = 'Remove';
        removeIcon.title = 'Remove key';
        removeIcon.src = 'remove.png';
        removeIcon.style.cursor = 'pointer';
        keyContainer.appendChild(removeIcon);

        removeIcon.addEventListener('click', function (event) {
            event.stopPropagation();
            keyring.removeKeysForId(key.primaryKey.getKeyId().toHex());
            keyring.store();
            keyContainer.parentNode.removeChild(keyContainer);
        });

        if (key.primaryKey.isDecrypted) {
            unlockedIcon.style.display = null;
        } else {
            lockedIcon.style.display = null;
        }

        userId.innerText = key.getUserIds();
        keyContainer.appendChild(userId);

        if (!key.primaryKey.isDecrypted) {
            keyPasswordField.type = 'password';
            keyPasswordField.addEventListener('keydown', function (event) {
                if (event.keyCode === 13) {
                    key.decrypt(keyPasswordField.value);

                    if (key.primaryKey.isDecrypted) {
                        keyContainer.removeChild(keyPasswordContainer);
                        if (key.primaryKey.isDecrypted) {
                            lockedIcon.style.display = 'none';
                            unlockedIcon.style.display = null;
                        }
                    }

                    keyPasswordField.value = '';
                }
            });

            keyPasswordContainer.appendChild(keyPasswordField);
            keyContainer.appendChild(keyPasswordContainer);
        }

        loadedKeys.appendChild(keyContainer);
    };
    keyring.getAllKeys().forEach(appendKeyToLoadedKeys);

    var decryptFile = function (file) {
        decryptedPasswordInput.value = '';
        decryptedDataTextarea.value = '';
        decryptedPasswordArea.style.display = 'none';
        decryptedDataArea.style.display = 'none';
        couldNotDecrypt.style.display = 'none';

        var availableDecryptedKeys = keyring.privateKeys.keys.
            filter(function (key) {
                return key.primaryKey.isDecrypted;
            });

        if (availableDecryptedKeys.length > 0) {
            decryptingInProgress.style.display = 'block';

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

                    decryptingInProgress.style.display = 'none';

                    if (String(decryptedPassword).replace(/^\s+|\s+$/g, '') !== '') {
                        decryptedPasswordInput.value = decryptedPassword;
                        decryptedPasswordArea.style.display = 'block';
                        decryptedPasswordInput.focus();
                        if ('select' in decryptedPasswordInput) {
                            decryptedPasswordInput.select();
                        } else if ('setSelectionRange' in decryptedPasswordInput) {
                            decryptedPasswordInput.setSelectionRange(0, decryptedPasswordInput.value.length);
                        }

                        if (String(decryptedData).replace(/^\s+|\s+$/g, '') !== decryptedPassword) {
                            decryptedDataTextarea.value = decryptedData;
                            decryptedDataArea.style.display = 'block';
                        }
                    } else {
                        decryptedDataTextarea.value = decryptedData;
                        decryptedDataArea.style.display = 'block';
                    }

                    return true;
                });

                if (!decrypted) {
                    decryptingInProgress.style.display = 'none';
                    couldNotDecrypt.style.display = 'block';
                }
            }, 10);
        }
    };

    privateKeyDropArea.addEventListener('dragover', function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    encryptedFileDropArea.addEventListener('dragover', function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    privateKeyFileReader.onload = function (event) {
        openpgp.key.readBinaryOrArmored(event.target.result).
            keys.
            filter(function (key) {
                return key.isPrivate();
            }).
            forEach(function (key) {
                keyring.privateKeys.importKey(key.armor());
                keyring.store();
                loadedKeys.innerHTML = '';
                keyring.getAllKeys().forEach(appendKeyToLoadedKeys);
            });
    };

    var handlePrivateKeyFile = function (file) {
        privateKeyOkNotification.style.display = 'none';
        privateKeyErrorNotification.style.display = 'none';
        privateKeyFilename.textContent = file.name;
        privateKeyFileReader.readAsBinaryString(file);
    };

    privateKeyFileInput.addEventListener('drop', function (event) {
        event.stopPropagation();
    });
    privateKeyFileInput.addEventListener('change', function (event) {
        // TODO: handle multiple key file drops
        handlePrivateKeyFile(event.target.files[0]);
        privateKeyFileInput.value = '';
    });
    privateKeyDropArea.addEventListener('drop', function (event) {
        event.preventDefault();
        // TODO: handle multiple key file drops
        handlePrivateKeyFile(event.dataTransfer.files[0]);
    });

    encryptedFileReader.onload = function (event) {
        var file = openpgp.message.readBinaryOrArmored(event.target.result);

        if (file) {
            encryptedFileOkNotification.style.display = 'block';
            decryptFile(file);
        } else {
            encryptedFileErrorNotification.style.display = 'block';
        }
    };

    var handleEncryptedFileFile = function (file) {
        encryptedFileOkNotification.style.display = 'none';
        encryptedFileErrorNotification.style.display = 'none';
        encryptedFileFilename.textContent = file.name;
        encryptedFileReader.readAsBinaryString(file);
    };

    encryptedFileFileInput.addEventListener('drop', function (event) {
        event.stopPropagation();
    });
    encryptedFileFileInput.addEventListener('change', function (event) {
        // TODO: handle multiple encrypted file drops
        handleEncryptedFileFile(event.target.files[0]);
    });
    encryptedFileDropArea.addEventListener('drop', function (event) {
        event.preventDefault();
        // TODO: handle multiple encrypted file drops
        handleEncryptedFileFile(event.dataTransfer.files[0]);
        privateKeyFileInput.value = '';
    });
}());
