keep_scrolling = false;

function scrollUp(){
  $('.nano.im_history_wrap').nanoScroller({scroll:'top'});
  if (keep_scrolling){
    setTimeout(scrollUp, 1000);
  }
}

chrome.runtime.onMessage.addListener(function (request_msg, sender, sendResponse) {
    if (request_msg.text === 'telegram_dom_request') {
        sendResponse({text : document.all[0].outerHTML});
    }
    if (request_msg.text === 'telegram_load_more_history_request'){
      keep_scrolling = true;
      scrollUp();
    }
    if (request_msg.text === 'telegram_stop'){
      keep_scrolling = false;
    }
});
