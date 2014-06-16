# pass.js

Simple web page client for decrypting passwords stored with [pass](http://www.passwordstore.org/).

The purpose of this is to have a dead simple, no install needed client for decrypting passwords. The only thing needed
is a web browser and your key and data. This way you can carry the client around in a USB stick and be able to
decrypt your passwords anywhere.

## Usage

See [USAGE.md](https://github.com/eirc/pass.js/blob/master/USAGE.md).

## Libraries

Since the code used for such processes is a delicate matter the only library used is the
[OpenPGP.js](http://openpgpjs.org/) library which handles the decryption process. Minified version v0.6.1 is currently
used downloaded from https://github.com/openpgpjs/openpgpjs/releases.
