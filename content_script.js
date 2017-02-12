var s = document.createElement('script');
s.src = chrome.extension.getURL('inject.js');
(document.head||document.documentElement).appendChild(s);
//s.onload = function() {
//    s.parentNode.removeChild(s);
//};
console.log("script injected.")

document.addEventListener('from_injected', function(e) {
    //console.log("sending message with history to extension");
    chrome.runtime.sendMessage({detail: e.detail}, null);
});

//-----------------------------------
/*keep_scrolling = false;

function scrollUp(){
  $('.nano.im_history_wrap').nanoScroller({scroll:'top'});
  if (keep_scrolling){
    setTimeout(scrollUp, 1000);
  }
}*/

chrome.runtime.onMessage.addListener(function (request_msg, sender, sendResponse) {
    console.log('content script received request '+request_msg.text);
    if (request_msg.text === 'stch_check_conn') {
        sendResponse({text : "OK"})
    }
    if (request_msg.text === 'stch_load_current_history') {
        document.dispatchEvent(new CustomEvent('to_injected_current', {}));
    }
    if (request_msg.text === 'stch_load_more_history') {
        document.dispatchEvent(new CustomEvent('to_injected_get_more', 
            {'detail':request_msg.value}));
    }
    if (request_msg.text === 'stch_open_photos') {
        document.dispatchEvent(new CustomEvent('to_injected_open_photos',{}));
    }
    /*if (request_msg.text === 'stch_start_scrolling_up'){
      keep_scrolling = true;
      scrollUp();
    }
    if (request_msg.text === 'stch_stop_scrolling'){
      keep_scrolling = false;
    }*/
});
