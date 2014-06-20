/*
 * TODO: Open an issue or pull request on them to support this
 */
(function () {
    // Read a binary gpg encrypted file to an openpgp Message.
    //
    // This should probably be part of the openpgp library. Currently they have a function for reading armored text
    // (Message#readArmored) but we want to be able to use gpg files (too). This is a subset of the readArmored function
    // excluding the dearmor part.
    openpgp.message.readBinary = function (binaryData) {
        var packetlist = new openpgp.packet.List();
        packetlist.read(binaryData);
        return new openpgp.message.Message(packetlist);
    };

    openpgp.message.readBinaryOrArmored = function (input) {
        var message = null;

        try {
            message = openpgp.message.readBinary(input);
        } catch (e) {
            try {
                message = openpgp.message.readArmored(input);
            } catch (e) {
            }
        }

        return message;
    };

    // Read a binary gpg private keyring file to one or more openpgp Keys.
    //
    // This should probably be part of the openpgp library. Currently they have a function for reading armored text
    // (Key#readArmored) but we want to be able to use gpg files (too). This is a subset of the readArmored function
    // excluding the dearmor part.
    openpgp.key.readBinary = function (binaryData) {
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

    openpgp.key.readBinaryOrArmored = function (input) {
        var binaryResult = openpgp.key.readBinary(input),
            armoredResult = openpgp.key.readArmored(input);

        return {
            keys: (binaryResult.keys || []).concat(armoredResult.keys),
            err: (binaryResult.err || []).concat(armoredResult.err)
        };
    };
}());
