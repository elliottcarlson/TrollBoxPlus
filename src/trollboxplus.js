// Built the functionality to be injected
var inject = '(' + function() {
    if (!window.channel) return;

    // Unload the existing binding for the trollbox
    window.channel.unbind('msg');

    // Bind custom msg handler
    window.channel.bind('msg', function(data) {
        data = JSON.parse(data);

        window.ignoredUsers = JSON.parse(localStorage.getItem('ignoredUsers'));
        window.starredUsers = JSON.parse(localStorage.getItem('starredUsers'));
        window.disableImages = localStorage.getItem('disableImages');

        // Ignore users
        if (window.ignoredUsers instanceof Array && jQuery.inArray(data.login, window.ignoredUsers) > -1) {
            return;
        }

        // Highlite starred users
        if (window.starredUsers instanceof Array && jQuery.inArray(data.login, window.starredUsers) > -1) {
            if (window.disableImages !== true) {
                starImage = '&nbsp;<img src="https://btc-e.com/images/1px.png" class="chat-s chat-s-7 nSmile">&nbsp;';
            } else {
                starImage = '';
            }

            data.login = starImage + '<font color="red">' + data.login + '</font>' + starImage;
        }

        // Strip images (and links as well)
        if (window.disableImages === true) {
            data.msg = jQuery('<div />', { html: data.msg }).text().trim();
        }

        // Send message back through to the regular chat handler
        nChatPutMsg(data.uid, data.login, data.msg, data.msg_id, data.date, data.usr_clr);
    });

    // Add ignore and star user button to dropdowns
    $('.chatmessage a').bind('click', function(event) {
        if ($('#cMenu span.ignoreUser').length == 0) {
            $('#cMenu').append('<span class="ignoreUser"><a class="profileBtn">Ignore User</a></span>');
            $('#cMenu span.ignoreUser a').on('click', function() {
                var user = $('#cMenuH').text();
                ignoreUser(user);
            });
        }

        if ($('#cMenu span.starUser').length == 0) {
            $('#cMenu').append('<span class="starUser"><a class="profileBtn">Star User</a></span>');
            $('#cMenu span.starUser a').on('click', function() {
                var user = $('#cMenuH').text();
                starUser(user);
            });
        }
    });

    // Take control over the chat box submit functionality
    $('#nChatCon form').removeAttr('onsubmit');
    $('#nChatCon form').on('submit', function(event) {
        event.preventDefault();

        input = $('#nChatInput').val().trim();

        // See if the input was a command
        if (input.indexOf('/') == 0) {
            // Remove the command identifier
            input = input.substring(1);

            // Split any arguments
            args = input.split(/[ ]+/);

            // Determine the command to run
            switch (args[0]) {
                case 'ignore':
                    if (args[1].substring) {
                        ignoreUser(args[1]);
                    } else {
                        logToChat('Usage: /ignore &lt;username&gt;');
                    }
                    break;
                case 'unignore':
                    if (args[1].substring) {
                        unignoreUser(args[1]);
                    } else {
                        logToChat('Usage: /unignore &lt;username&gt;');
                    }
                    break;
                case 'star':
                    if (args[1].substring) {
                        starUser(args[1]);
                    } else {
                        logToChat('Usage: /star &lt;username&gt;');
                    }
                    break;
                case 'unstar':
                    if (args[1].substring) {
                        unstarUser(args[1]);
                    } else {
                        logToChat('Usage: /unstar &lt;username&gt;');
                    }
                    break;
                case 'images':
                    if (args[1].substring && args[1] == 'off') {
                        disableImages();
                    } else if (args[1].substring && args[1] == 'on') {
                        enableImages();
                    } else {
                        logToChat('Usage: /images [on|off]');
                    }
                    break;
                case 'announce':
                    $('#nChatInput').val('I am using TrollBox+ Chat Extension for Chrome. Available at http://git.io/TrollBoxPlus');
                    nChatSendMsg();
                case 'help':
                default:
                    logToChat('Available commands:');
                    logToChat(' /ignore &lt;username&gt;');
                    logToChat(' /unignore &lt;username&gt;');
                    logToChat(' /star &lt;username&gt;');
                    logToChat(' /unstar &lt;username&gt;');
                    logToChat(' /images [on|off]');
                    logToChat(' /announce');
            }
        } else {
            // Not a command, regular chat input, pass on to regular functionality
            nChatSendMsg();
        }

        $('#nChatInput').val('');
        return false;
    });

    // Add user to ignore list
    function ignoreUser(user) {
        if (!(window.ignoredUsers instanceof Array)) {
            window.ignoredUsers = [];
        }

        window.ignoredUsers.push(user);
        localStorage.setItem('ignoredUsers', JSON.stringify(window.ignoredUsers));
        logToChat('Added ' + user + ' to Ignored User list.');
    }

    // Unignore a user
    function unignoreUser(user) {
        if (!(window.ignoredUsers instanceof Array)) {
            window.ignoredUsers = [];
        }

        window.ignoredUsers = jQuery.grep(window.ignoredUsers, function(userEl) {
            return userEl != user;
        });
        localStorage.setItem('ignoredUsers', JSON.stringify(window.ignoredUsers));
        logToChat('Removed ' + user + ' from Ignored User list.');
    }

    // Add user to starred list
    function starUser(user) {
        if (!(window.starredUsers instanceof Array)) {
            window.starredUsers = [];
        }

        window.starredUsers.push(user);
        localStorage.setItem('starredUsers', JSON.stringify(window.starredUsers));
        logToChat('Added ' + user + ' to Starred User list.');
    }

    // Unstar a user
    function unstarUser(user) {
        if (!(window.starredUsers instanceof Array)) {
            window.starredUsers = [];
        }

        window.starredUsers = jQuery.grep(window.starredUsers, function(userEl) {
            return userEl != user;
        });
        localStorage.setItem('starredUsers', JSON.stringify(window.starredUsers));
        logToChat('Removed ' + user + ' from Starred User list.');
    }

    // Disable images
    function disableImages() {
        localStorage.setItem('disableImages', true);
        logToChat('Images are now disabled in chat.');
    }

    // Enable images
    function enableImages() {
        localStorage.setItem('disableImages', false);
        logToChat('Images are now enabled in chat.');
    }

    // Send a notice to chat log (does not transmit to room)
    function logToChat(msg) {
        var ts = new Date();
        $('#nChat').append('<p id="notice' + ts.getTime() + '" class="chatmessage" style="display: none"><strong>TrollBox+: </strong><span>' + msg + '</span></p>');
        $('#notice' + ts.getTime()).fadeIn(100);
        nChatHighlight();
        nChatScroll($('#notice' + ts.getTime()).innerHeight());
    }

    // TrollBox+ Activated!
    logToChat('TrollBox+ is now running.');
    logToChat('Type "/help" for a list of commands.');
} + ')();';

// Inject the functionality in to the page dom
var script = document.createElement('script');
script.textContent = inject;
(document.head||document.documentElement).appendChild(script);
script.parentNode.removeChild(script);
