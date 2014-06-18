(function () {
    // Read a binary gpg encrypted file to an openpgp Message.
    //
    // This should probably be part of the openpgp library. Currently they have a function for reading armored text
    // (Message#readArmored) but we want to be able to use gpg files (too). This is a subset of the readArmored function
    // excluding the dearmor part.
    //
    // TODO: Open an issue or pull request on them to support this
    var readBinaryMessage = function (binaryData) {
        var packetlist = new openpgp.packet.List();
        packetlist.read(binaryData);
        return new openpgp.message.Message(packetlist);
    };

    // Read a binary gpg private keyring file to one or more openpgp Keys.
    //
    // This should probably be part of the openpgp library. Currently they have a function for reading armored text
    // (Key#readArmored) but we want to be able to use gpg files (too). This is a subset of the readArmored function
    // excluding the dearmor part.
    //
    // TODO: Open an issue or pull request on them to support this
    var readBinaryKey = function (binaryData) {
        var result = {};
        result.keys = [];
        try {
            var packetlist = new openpgp.packet.List();
            packetlist.read(binaryData);
            var keyIndex = packetlist.indexOfTag(openpgp.enums.packet.publicKey, openpgp.enums.packet.secretKey);
            if (keyIndex.length === 0) {
                throw new Error('No key packet found in armored text');
            }
            for (var i = 0; i < keyIndex.length; i++) {
                var oneKeyList = packetlist.slice(keyIndex[i], keyIndex[i + 1]);
                try {
                    var newKey = new openpgp.key.Key(oneKeyList);
                    result.keys.push(newKey);
                } catch (e) {
                    result.err = result.err || [];
                    result.err.push(e);
                }
            }
        } catch (e) {
            result.err = result.err || [];
            result.err.push(e);
        }
        return result;
    };

    // Page elements
    var privateKeyDropArea = document.getElementById('private_key_drop_area'),
        privateKeyFileInput = document.getElementById('private_key_file_input'),
        keyPasswordArea = document.getElementById('key_password_area'),
        keyPasswordInput = document.getElementById('key_password'),
        privateKeyOkNotification = document.getElementById('private_key_ok_notification'),
        privateKeyFilename = document.getElementById('private_key_filename'),
        privateKeyErrorNotification = document.getElementById('private_key_error_notification'),
        encryptedFileDropArea = document.getElementById('encrypted_file_drop_area'),
        encryptedFileFileInput = document.getElementById('encrypted_file_file_input'),
        encryptedFileOkNotification = document.getElementById('encrypted_file_ok_notification'),
        encryptedFileFilename = document.getElementById('encrypted_file_filename'),
        encryptedFileErrorNotification = document.getElementById('encrypted_file_error_notification'),
        decryptingInProgress = document.getElementById('decrypting_in_progress'),
        decryptedPasswordArea = document.getElementById('decrypted_password_area'),
        decryptedPasswordInput = document.getElementById('decrypted_password'),
        decryptedDataArea = document.getElementById('decrypted_data_area'),
        decryptedDataTextarea = document.getElementById('decrypted_data');

    // Local shared variables
    var privateKeyFileReader = new FileReader(),
        encryptedFileReader = new FileReader(),
        loadedPrivateKey,
        loadedEncryptedFile;

    var decryptIfReady = function () {
        decryptedPasswordInput.value = '';
        decryptedDataTextarea.value = '';
        decryptedPasswordArea.style.display = 'none';
        decryptedDataArea.style.display = 'none';

        if (loadedPrivateKey && loadedPrivateKey.primaryKey.isDecrypted && loadedEncryptedFile) {
            decryptingInProgress.style.display = 'block';

            // Wrap the slow decryption process in a timeout block so it won't block the browser,
            // also give it a few milliseconds for the renderings above to happen in the browser.
            // The async worker API would be useful here but it cannot work with the file:// protocol due to browser
            // security restrictions and working with file:// is a hard requirement.
            setTimeout(function () {
                var decryptedData = openpgp.decryptMessage(loadedPrivateKey, loadedEncryptedFile),
                    decryptedPassword = decryptedData.split("\n")[0];

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
        // TODO: handle more than one keys in the keyfile
        loadedPrivateKey = readBinaryKey(event.target.result).keys[0] ||
            openpgp.key.readArmored(event.target.result).keys[0];

        if (loadedPrivateKey && loadedPrivateKey.isPrivate() && loadedPrivateKey.primaryKey) {
            if (loadedPrivateKey.primaryKey.isDecrypted) {
                keyPasswordArea.style.display = 'none';
                privateKeyOkNotification.style.display = 'block';
            } else {
                keyPasswordArea.style.display = 'block';
                privateKeyOkNotification.style.display = 'none';
                keyPasswordInput.focus();
            }
        } else {
            privateKeyErrorNotification.style.display = 'block';
        }

        decryptIfReady();
    };

    var handlePrivateKeyFile = function (file) {
        loadedPrivateKey = null;
        keyPasswordArea.style.display = 'none';
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
    });
    privateKeyDropArea.addEventListener('drop', function (event) {
        event.preventDefault();
        // TODO: handle multiple key file drops
        handlePrivateKeyFile(event.dataTransfer.files[0]);
    });

    keyPasswordInput.addEventListener('keydown', function (event) {
        if (event.keyCode === 13) {
            loadedPrivateKey.decrypt(keyPasswordInput.value);
            keyPasswordInput.value = '';

            if (loadedPrivateKey.primaryKey.isDecrypted) {
                keyPasswordArea.style.display = 'none';
                privateKeyOkNotification.style.display = 'block';
            }

            decryptIfReady();
        }
    });

    encryptedFileReader.onload = function (event) {
        try {
            loadedEncryptedFile = readBinaryMessage(event.target.result);
        } catch (e) {
            try {
                loadedEncryptedFile = openpgp.message.readArmored(event.target.result);
            } catch (e) {
                encryptedFileErrorNotification.style.display = 'block';
            }
        }

        if (loadedEncryptedFile) {
            encryptedFileOkNotification.style.display = 'block';
        }

        decryptIfReady();
    };

    var handleEncryptedFileFile = function (file) {
        loadedEncryptedFile = null;
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
    });
}());
