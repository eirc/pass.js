(function () {
    // Read a binary gpg encrypted file to an openpgp Message.
    //
    // This should probably be part of the openpgp library. Currently they have a function for reading armored text
    // (readArmored) but we want to be able to use gpg files (too). This is a subset of the readArmored function
    // excluding the dearmor part.
    //
    // TODO: Open an issue or pull request on them to support this
    var readBinaryMessage = function (binaryData) {
        var packetlist = new openpgp.packet.List();
        packetlist.read(binaryData);
        return new openpgp.message.Message(packetlist);
    };

    // Page elements
    var privateKeyDropArea = document.getElementById('private_key_drop_area'),
        keyPasswordArea = document.getElementById('key_password_area'),
        keyPasswordInput = document.getElementById('key_password'),
        privateKeyOkNotification = document.getElementById('private_key_ok_notification'),
        privateKeyFilename = document.getElementById('private_key_filename'),
        privateKeyErrorNotification = document.getElementById('private_key_error_notification'),
        encryptedFileDropArea = document.getElementById('encrypted_file_drop_area'),
        encryptedFileOkNotification = document.getElementById('encrypted_file_ok_notification'),
        encryptedFileFilename = document.getElementById('encrypted_file_filename'),
        encryptedFileErrorNotification = document.getElementById('encrypted_file_error_notification'),
        decryptingInProgress = document.getElementById('decrypting_in_progress'),
        decryptedPasswordArea = document.getElementById('decrypted_password_area'),
        decryptedPasswordInput = document.getElementById('decrypted_password'),
        decryptedDataArea = document.getElementById('decrypted_data_area'),
        decryptedDataTextarea = document.getElementById('decrypted_data');

    // Local shared variables
    var loadedPrivateKey,
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

    privateKeyDropArea.addEventListener('drop', function (event) {
        event.preventDefault();
        loadedPrivateKey = null;
        keyPasswordArea.style.display = 'none';
        privateKeyOkNotification.style.display = 'none';
        privateKeyErrorNotification.style.display = 'none';

        var fileReader = new FileReader();
        fileReader.onload = function (event) {
            // TODO: handle more than one keys in the keyfile
            loadedPrivateKey = openpgp.key.readArmored(event.target.result).keys[0];

            if (loadedPrivateKey && loadedPrivateKey.primaryKey) {
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

        // TODO: handle multiple key file drops
        var file = event.dataTransfer.files[0];
        privateKeyFilename.textContent = file.name;
        fileReader.readAsText(file);
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

    encryptedFileDropArea.addEventListener('drop', function (event) {
        event.preventDefault();
        loadedEncryptedFile = null;
        encryptedFileOkNotification.style.display = 'none';
        encryptedFileErrorNotification.style.display = 'none';

        var fileReader = new FileReader();
        fileReader.onload = function (event) {
            try {
                loadedEncryptedFile = readBinaryMessage(event.target.result);
                encryptedFileOkNotification.style.display = 'block';
            } catch (e) {
                encryptedFileErrorNotification.style.display = 'block';
            }
            decryptIfReady();
        };

        // TODO: handle multiple encrypted file drops
        var file = event.dataTransfer.files[0];
        encryptedFileFilename.textContent = file.name;
        fileReader.readAsBinaryString(file);
    });
}());
