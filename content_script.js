chrome.runtime.onMessage.addListener(function (request_msg, sender, sendResponse) {
    if (request_msg.text === 'telegram_dom_request') {
        sendResponse({text : document.all[0].outerHTML});
    }
});
