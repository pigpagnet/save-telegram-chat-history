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

//TODO textArea += "\n" + "It appears that you haven't selected a peer user, or history is empty.";
/* $('#myTextarea').val(textArea);
var elapsedTime = new Date()-timeStart;
  var logMsg = 'Working time: '+elapsedTime+' ms.' 
    + ' Size ' + textArea.length
    + '\nNumber of messages ' + msgCnt + '.'
    + ' History from ' + firstDate;
  console.log(logMsg);
  $('#txtAreaStatus').val(logMsg);
*/

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
    var msgFormatted = formatMsg(currentFormat,curDateTimeFormatted,author,text);
    textArea += "\n" + msgFormatted;
  }
  $('#myTextarea').html(textArea).text()
  //Update status
  var elapsedTime = new Date()-last_request_time
  var logMsg = ' History from ' + firstDate+"."
         + ' Size ' + textArea.length +' bytes.'
         + '\n '+messages.length+' messages out of '+ countMessages
         + ' ('+Math.floor(100 * messages.length / countMessages)+'%).'
         + ' Time ' + elapsedTime/1000.0 + ' sec.'
  console.log(logMsg);
  $('#txtAreaStatus').val(logMsg);
}

function communicate(commandText, value){
  enableButtons(false)
  last_request_time = new Date()
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

var butIDs = ['btnFetchHistoryAll', 'btnFetchHistory1', 
              'btnFetchHistory2', 'btnFetchHistory3' ]

function enableButtons(enable){
  for(var i=0; i<butIDs.length; i++){
    document.getElementById(butIDs[i]).disabled = !enable
  }
}

function checkConnection(){
  console.log("Checking connection with main page.")
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: 'stch_check_conn'}, function(response){
      if (undefined != response){
        connectionOK = true
        console.log('connection to main page: ok');
        enableButtons(true)
        requestCurrentHistory();
      }else{
        //TODO undefined! do smth useful!
        connectionOK = false
        console.log('no response from the main tab.');
        $('#myTextarea').val("To save your telegram chat history, you need to visit https://web.telegram.org first.");
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

var limit1 = 20
var limit2 = 200
var limit3 = 2000
var limitMAX = 200000000

function prepareButton(butId, limit, limitText){
  $('#'+butId).click(function (){
    requestMoreHistory(limit)
  });
  document.getElementById(butId).innerHTML = 'Load '+limitText;
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(defaultMapFormats, function(items) {
    var fmtSelected = items['selected']
    currentFormat = prepareFormat(items[fmtSelected])
    
    // Prepare page
    prepareButton('btnFetchHistoryAll',limitMAX,'all')
    prepareButton('btnFetchHistory1',limit1,limit1)
    prepareButton('btnFetchHistory2',limit2,limit2)
    prepareButton('btnFetchHistory3',limit3,limit3)
    checkConnection()
  });
});
