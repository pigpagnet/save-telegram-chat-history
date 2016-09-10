// User settings variables
currentFormat = null;

// State variables
load_history_active = false;

// Functions
function extract(el_class, attribute, where){
  var text = "";
  $('.'+el_class, where).each(function(){
    if (attribute){
      text = $(this).attr(attribute);       
    }else{    
      text = $(this).text(); 
    }
  });
  return text;
}



function extractHistory(html_str){  
  var timeStart = new Date()
  var parser = new DOMParser();
  var htmlDoc = parser.parseFromString(html_str, "text/html");
  var jdoc = $(htmlDoc);
  var textArea = "Your Telegram History\n";
  var curDate = null;
  var curDateFormatted = null;
  var firstDate = null;
  var msgCnt = 0;
  $('.im_history_messages_peer', jdoc).not('.ng-hide').each(function() {
    $('.im_history_message_wrap', $(this)).each(function() {
      // extract the current date split
      $('.im_message_date_split', $(this)).each(function(){
        $('.im_message_date_split_text', $(this)).each(function(){
          curDate = $(this).text();
          curDate = parseFullDate(curDate);
        });
      });
      // proceed with messages
      var text = extract('im_message_text', null, $(this));
      var author = extract('im_message_author', null, $(this));
      var time = extract('im_message_date', 'data-content', $(this)); //hh:mm:ss
      var curDateTimeFormatted = curDate + " " +  prepareTime(time);
      var msgFormatted = formatMsg(currentFormat,curDateTimeFormatted,author,text);
      textArea += "\n" + msgFormatted;
      if (firstDate == null){
        firstDate = curDate;
      }
      msgCnt += 1;
    });
  });
  if (firstDate == null){
    textArea += "\n" + "It appears that you haven't selected a peer user, or history is empty.";
    document.getElementById("btnFetchHistory").disabled = true;
  }else{
    document.getElementById("btnFetchHistory").disabled = false;
  }
  $('#myTextarea').val(textArea);
  var elapsedTime = new Date()-timeStart;
  var logMsg = 'Working time: '+elapsedTime+' ms.' 
    + ' Size ' + textArea.length
    + '\nNumber of messages ' + msgCnt + '.'
    + ' History from ' + firstDate;
  console.log(logMsg);
  $('#txtAreaStatus').val(logMsg);
}

function updateView(){
  if (load_history_active){
    document.getElementById("btnFetchHistory").innerHTML = 'Loading...(click to stop)';
  }else{
    document.getElementById("btnFetchHistory").innerHTML = 'Load more history';
  }
}

function communicate(commandText){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: commandText}, null);
  });
}

function requestMoreHistory(){ 
  if (!load_history_active){
    communicate('telegram_load_more_history_request');
    load_history_active = true;
  }else{
    communicate('telegram_stop');    
    load_history_active = false;
  }
  fetchAvailableHistory();
  updateView();
}

function fetchAvailableHistory(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: 'telegram_dom_request'}, function(response){
      //console.log('Received ' + response.text.length + ' bytes of response.');
      if (undefined != response){
        extractHistory(response.text);
        if (load_history_active){
          setTimeout(fetchAvailableHistory,2000);
        }
      }else{
        //TODO undefined! do smth useful!
        console.log('no response from the main tab.');
        $('#myTextarea').val("To save telegram chat history, you need to visit https://web.telegram.org first.");
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(defaultMapFormats, function(items) {
    var fmtSelected = items['selected'];
    currentFormat = prepareFormat(items[fmtSelected]);
    $('#btnFetchHistory').click(requestMoreHistory);  
    //document.getElementById("btnFetchHistory").addEventListener("click", requestMoreHistory);
    updateView();
    fetchAvailableHistory();
  });
});
