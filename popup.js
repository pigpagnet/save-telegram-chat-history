




// User settings variables
currentFormat = null;

// State variables
first_request = true //for restoring textarea scroll 
connectionOK = false
keep_scrolling = false

min_time_between_requests = 2000
var last_request_time = new Date()

myTextAreaLineNumber = -1

function getLineNumber(textarea) {
  //word wrap is not counted as new line.
  return textarea.value.substr(0, textarea.selectionStart).split("\n").length
}

function getLineNumberFromString(str){
  return str.split("\n").length
}

var ReceivedMsg
var LinesAfterMessages

function displayMessages(msg){
  var textArea = "Your Telegram History\n"
  var messages = msg.detail.historyMessages
  var countMessages = msg.detail.countMessages
  var firstDate = messages[messages.length-1].date
  var linesAfterMessages = []
  var receivedMsg = []
  linesAfterMessages.push(getLineNumberFromString(textArea))
  for(var i=msg.detail.historyMessages.length-1; i>=0; i--){
    var msgWrap = messages[i]
    //var msgId = msgWrap.msgHiddenInfo.msg_id
    //var photoId = msgWrap.msgHiddenInfo.photo_id // if exists
    //console.log(messages[i].hiddeninfo)
    var curDateTimeFormatted = msgWrap.date
    var senderID = msgWrap.sender
    var author = msg.detail.peerIDs[senderID]
    if (senderID == msg.detail.myID){
      author += "(you)";
    }
    var text = msgWrap.text
    var metainfo = msgWrap.metainfo
    if (metainfo.length > 0)
      metainfo = '[[' + metainfo + ']]'
    var msgFormatted = formatMsg(currentFormat,curDateTimeFormatted,author, metainfo + text)
    textArea += "\n" + msgFormatted
    linesAfterMessages.push(linesAfterMessages[linesAfterMessages.length-1] + getLineNumberFromString(msgFormatted))
    //receivedMsg.push($.extend(messages[i].hiddeninfo))
    receivedMsg.push({msg_id:messages[i].hiddeninfo.msg_id, photo_id: messages[i].hiddeninfo.photo_id})
  }
  linesAfterMessages.reverse()
  receivedMsg.reverse()
  $('#myTextarea').html(textArea).text()
  if (first_request){
    first_request = false
    restoreTextareaScroll('#myTextarea')
  }
  renderCountPhotos(msg.detail.countPhotos)
  //Update status
  var elapsedTime = new Date()-last_request_time
  var logMsg = ' History from ' + firstDate+"."
         + '\n Size: ' + friendlySize(textArea.length) +' characters,'
         + ' ' + friendlySize(getLineNumberFromString($('#myTextarea').val())) + ' lines.'
         + '\n '+friendlySize(messages.length)+' messages out of '+ friendlySize(countMessages)
         + ' ('+Math.floor(100 * messages.length / countMessages)+'%).'
         + ' Time ' + elapsedTime/1000.0 + ' sec.'
  console.log(logMsg)
  $('#txtAreaStatus').val(logMsg)
  ReceivedMsg = receivedMsg
  LinesAfterMessages = linesAfterMessages
}

function communicate(commandText, value){
  enableButtons(false)
  last_request_time = new Date()
  console.log("sending "+commandText +" with value="+value)
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: commandText, value: value}, null)
  })
}

/*
function scrollSwitch(){
  if (!keep_scrolling){
    communicate('stch_start_scrolling_up');
    keep_scrolling = true;
  }else{
    communicate('stch_stop_scrolling');
    keep_scrolling = false;
  }
}*/

function requestCurrentHistory(){
  communicate('stch_load_current_history');
  startProgress()
}

function requestMoreHistory(limit){
  communicate('stch_load_more_history', limit);
  startProgress()
}

function enableButtons(enable){
  $('button').attr('disabled', !enable)
  if (enable){
    isShowProgress = false
  }
}

//--------------ProgressBar part

var isShowProgress = false

function showProgress(){
  // last_request_time
  var t = new Date().getTime()
  var elapsed_sec = Math.floor((t - last_request_time) / 100) / 10
  var elapsed_min = Math.floor(elapsed_sec / 60)
  var str = "" + elapsed_sec 
  if (str.length<2 || str.charAt(str.length-2)!='.'){
    str += '.0'
  }
  str += "s"
  if (elapsed_min > 0){
    str = elapsed_min + 'm ' + str
  }
  if (elapsed_sec > 0.99){
    $('#progressBar').text(str)
  }
  if (isShowProgress){
    setTimeout(showProgress, 200);
  }else{
    $('#progressBar').text('')
  }
}

function startProgress(){
  isShowProgress = true
  showProgress()
}

function stopProgress(){
  isShowProgress = false
  $('#progressBar').text('')
}

//--------------- end of ProgressBar part

function checkConnection(){
  console.log("Checking connection with main page.")
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: 'stch_check_conn'}, function(response){
      if (undefined != response){
        connectionOK = true
        console.log('connection to main page: ok');
        enableButtons(true)
        requestCurrentHistory()
      }else{
        //TODO undefined! do smth useful!
        connectionOK = false
        console.log('no response from the main tab.');
        $('#myTextarea').val("To save your telegram chat history, you first need to visit https://web.telegram.org, login, and select one of your contacts.");
      }
    });
  });
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.runtime.onMessage.addListener(function(msg) {
    displayMessages(msg)
    enableButtons(true)
  })
})

var limitMAX = 200000000

function prepareButton(butId, limit){
  $('#'+butId).click(function (){
    requestMoreHistory(limit)
  });
}

function renderCountPhotos(cntPhotos){
  var but = document.getElementById("btnOpenPhotos")
  but.disabled = cntPhotos == 0
  but.innerHTML = 'Open photos'
  var but2 = document.getElementById('btnOpenPrevPhoto')
  but2.disabled = cntPhotos == 0
  but2.innerHTML = 'Cursor prev photo'
  var but3 = document.getElementById('btnOpenNextPhoto')
  but3.disabled = cntPhotos == 0
  but3.innerHTML = 'Cursor next photo'
}

function restoreTextareaScroll(textarea){
  var value = chrome.extension.getBackgroundPage().textAreaScroll
  $(textarea).scrollTop(value)
}

function textareaCursorChanged(textarea){
  myTextAreaLineNumber = getLineNumber(textarea)
  console.log(""+myTextAreaLineNumber)
}


function openPhoto(sign){
  myTextAreaLineNumber = getLineNumber($('#myTextarea')[0])
  var idx = binSearch(LinesAfterMessages, myTextAreaLineNumber, function(a,b){return b-a})
  if (idx < 0){
    idx = -idx
  }
  //not so effifient!
  for(var delta=0; delta < LinesAfterMessages.length; delta++){
    var check_idx = idx + sign * delta
    if (check_idx>=0 && check_idx < ReceivedMsg.length){
      if (ReceivedMsg[check_idx].photo_id != null){
        var req_value = ReceivedMsg[check_idx].photo_id// + ',' + ReceivedMsg[check_idx].msg_id
        communicate('stch_open_photos', req_value)
        return
      }
    }
  }
  console.log('no open photo requests has been sent')
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(defaultMapFormats, function(items) {
    var fmtSelected = items['selected']
    currentFormat = prepareFormat(items[fmtSelected])
    
    // Prepare page
    $('#loadHistory .btnLoadGrid').click(function(){
      var s = this.innerText
      if (s == 'all'){
        requestMoreHistory(limitMAX)
      }else{
        s = s.replace('k','000')
        s = s.replace(' ','')
        var limit = parseInt(s)
        requestMoreHistory(limit)
      }
    })
    checkConnection()

    $('#btnOpenPhotos').click(function (){
      communicate('stch_open_photos')
    })

    $('#btnOpenPrevPhoto').click(function (){
      openPhoto(1) //inversed order
    })
    $('#btnOpenNextPhoto').click(function(){
      openPhoto(-1) // inversed order
    })

    $('#myTextarea').keyup(function(){
      textareaCursorChanged(this)
    })
    $('#myTextarea').mouseup(function(){
      textareaCursorChanged(this)
    })
    $('#myTextarea').scroll(function(){
      chrome.extension.getBackgroundPage().textAreaScroll = this.scrollTop
    })
  })
})
