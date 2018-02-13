var aceTopScroll = 0
var aceCurRow = 0
var Status  // 'working' or 'ready'
var last_request_time

function bg_notify(status){
  Status = status
  var badge = ''
  if (status && status=='working')
    badge = '!'
  chrome.browserAction.setBadgeText({text: badge})
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.detail.status){
      bg_notify(msg.detail.status)
    }else{
      var popups = chrome.extension.getViews({type: "popup"});
      if (0 < popups.length)
        popups[0].displayMessages(msg)
    }
  })
})
