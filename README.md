# pass.js

Simple client for decrypting passwords stored with [pass](http://www.passwordstore.org/).

The purpose of this is to have a dead simple, no install needed client for decrypting passwords. The only thing needed
is a web browser and your key and data.

## Usage

Drop `index.html` in your browser of choice.

![Initial](https://raw.github.com/eirc/pass.js/master/screenshots/01-inital.png)

Drop the ASCII armored decryption private key (see below on how to get your armored) in the designated area.
If the key is password protected enter your password in the input that appears.

![Initial](https://raw.github.com/eirc/pass.js/master/screenshots/02-password.png)

![Initial](https://raw.github.com/eirc/pass.js/master/screenshots/03-private_key_loaded.png)

Drop an encrypted `.gpg` file in the designated area.

![Initial](https://raw.github.com/eirc/pass.js/master/screenshots/04-decrypted_password.png)

Enjoy :)

Dropping encrypted `.gpg` with more than one lines of encrypted data will also render a textarea with the results.

![Initial](https://raw.github.com/eirc/pass.js/master/screenshots/05-decrypted_data.png)


## Exporting ASCII armored private key

Currently this client can only read ASCII armored private keys. By default when you generate your key it is stored in
binary format in `~/.gnupg/secring.gpg`. To export an ASCII armored version:

```
gpg --export-secret-keys -a > private_key.asc
```

This will store your private key in ASCII format in `private_key.asc`. Note that security-wise this is equivalent to the
original binary key, it's not decrypted or anything.

## Why?

The benefit of this client is that you can carry it around along with the key and encrypted data in a USB stick and have
all your passwords available (and protected).

## Libraries

Since the code used for such processes is a delicate matter the only library used is the
[OpenPGP.js](http://openpgpjs.org/) library which handles the decryption process. Minified version v0.6.1 is currently
used downloaded from https://github.com/openpgpjs/openpgpjs/releases.
