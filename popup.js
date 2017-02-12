// Constants
defaultMapFormats = {
  formatCompact:"dt, u: m",
  formatLarge:"u [dt]\\nm\\n",
  formatCustom:"",
  selected:"formatCompact",  
};

function formatMsg(format, datetime, username, text){
  var msg = format;
  var mapObj = {
    dt:datetime,
    u:username,
    m:text,
  };
  var re = new RegExp(Object.keys(mapObj).join("|"),"gi");
  msg = msg.replace(re, function(matched){
    return mapObj[matched];
  });
  return msg;
}

function prepareFormat(format) {
  format = format.replace(/\\n/g, "\n");
  format = format.replace(/\\t/g, "\t");
  return format;
}


// User settings variables
currentFormat = null;

// State variables
connectionOK = false
keep_scrolling = false

min_time_between_requests = 2000
var last_request_time = new Date()

myTextAreaLineNumber = -1

function getLineNumber(textarea) {
  return textarea.value.substr(0, textarea.selectionStart).split("\n").length
}

function getLineNumberFromString(str){
  return str.split("\n").length
}

function displayMessages(msg){
  var textArea = "Your Telegram History\n"
  var messages = msg.detail.historyMessages
  var countMessages = msg.detail.countMessages
  var firstDate = messages[messages.length-1].date
  for(var i=msg.detail.historyMessages.length-1; i>=0; i--){
    var msgWrap = messages[i]
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
    var msgFormatted = formatMsg(currentFormat,curDateTimeFormatted,author, metainfo + text);
    textArea += "\n" + msgFormatted;
  }
  $('#myTextarea').html(textArea).text()
  renderCountPhotos(msg.detail.countPhotos)
  //Update status
  var elapsedTime = new Date()-last_request_time
  var logMsg = ' History from ' + firstDate+"."
         + ' Size: ' + friendlySize(textArea.length) +' characters,'
         + ' ' + friendlySize(getLineNumberFromString($('#myTextarea').val())) + ' lines.'
         + '\n '+friendlySize(messages.length)+' messages out of '+ friendlySize(countMessages)
         + ' ('+Math.floor(100 * messages.length / countMessages)+'%).'
         + ' Time ' + elapsedTime/1000.0 + ' sec.'
  console.log(logMsg)
  $('#txtAreaStatus').val(logMsg)
}

function communicate(commandText, value){
  enableButtons(false)
  last_request_time = new Date()
  startProgress()
  console.log("sending "+commandText);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: commandText, value: value}, null);
  });
}

function scrollSwitch(){
  if (!keep_scrolling){
    communicate('stch_start_scrolling_up');
    keep_scrolling = true;
  }else{
    communicate('stch_stop_scrolling');
    keep_scrolling = false;
  }
}

function requestCurrentHistory(){
  communicate('stch_load_current_history');
}

function requestMoreHistory(limit){
  communicate('stch_load_more_history', limit);
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
  var butId = "btnOpenPhoto"
  document.getElementById(butId).disabled = cntPhotos == 0
  document.getElementById(butId).innerHTML = 'Open photos';
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(defaultMapFormats, function(items) {
    var fmtSelected = items['selected']
    currentFormat = prepareFormat(items[fmtSelected])
    
    // Prepare page
    //$('#progressBar').text('')
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

    $('#btnOpenPhoto').click(function (){
      communicate('stch_open_photos')
      //enableButtons(true)
    })
    //document.getElementById("btnOpenPhoto").innerHTML = 'Open photos';
    $('#myTextarea').keyup(function(){    
      myTextAreaLineNumber = getLineNumber(this.value)
      //console.log(""+myTextAreaLineNumber)
    })
    $('#myTextarea').mouseup(function(){
      //this.keyup()
      myTextAreaLineNumber = getLineNumber(this.value)
      //console.log(""+myTextAreaLineNumber)
    })
  })
})


