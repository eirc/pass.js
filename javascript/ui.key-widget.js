(function () {
    function KeyWidget(root) {
        var self = this;

        self.root = root || document.createElement('div');
        self.root.className = 'key-widget';

        self.lockedIcon = document.createElement('img');
        self.lockedIcon.alt = 'Lock';
        self.lockedIcon.title = 'Key is locked';
        self.lockedIcon.src = 'lock.png';
        self.lockedIcon.style.display = 'none';
        self.root.appendChild(self.lockedIcon);

        self.unlockedIcon = document.createElement('img');
        self.unlockedIcon.alt = 'Unlock';
        self.unlockedIcon.title = 'Key is unlocked';
        self.unlockedIcon.src = 'unlock.png';
        self.unlockedIcon.style.display = 'none';
        self.root.appendChild(self.unlockedIcon);

        self.removeIcon = document.createElement('img');
        self.removeIcon.alt = 'Remove';
        self.removeIcon.title = 'Remove key';
        self.removeIcon.src = 'remove.png';
        self.removeIcon.style.cursor = 'pointer';
        self.root.appendChild(self.removeIcon);

        self.userId = document.createElement('span');
        self.root.appendChild(self.userId);

        self.keyPasswordField = document.createElement('input');
        self.keyPasswordField.type = 'password';
        self.keyPasswordField.className = 'key-widget-password-input';
        self.root.appendChild(self.keyPasswordField);

        self.removeIcon.addEventListener('click', function () {
            self.__triggerEvent('remove');
        });

        self.keyPasswordField.addEventListener('keydown', function (event) {
            if (event.keyCode === 13) {
                self.__triggerEvent('enter-password', { password: self.keyPasswordField.value });
                self.keyPasswordField.value = '';
            }
        });
    }

    KeyWidget.prototype.setLocked = function (locked) {
        var self = this;

        if (locked) {
            self.lockedIcon.style.display = null;
            self.unlockedIcon.style.display = 'none';
            self.keyPasswordField.style.display = null;
        } else {
            self.lockedIcon.style.display = 'none';
            self.unlockedIcon.style.display = null;
            self.keyPasswordField.style.display = 'none';
        }
    };

    KeyWidget.prototype.setUserId = function (userId) {
        var self = this;

        self.userId.innerText = userId;
    };

    KeyWidget.prototype.addEventListener = function (type, listener, useCapture) {
        var self = this;

        self.root.addEventListener(type, listener, useCapture);
    };

    KeyWidget.prototype.__triggerEvent = function (eventType, detail) {
        var self = this;

        if (typeof detail === 'undefined') {
            detail = {};
        }

        self.root.dispatchEvent(new CustomEvent('key-widget:' + eventType, { detail: detail }));
    };

    window.passJS = window.passJS || {};
    window.passJS.ui = window.passJS.ui || {};
    window.passJS.ui.KeyWidget = KeyWidget;
}());
