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

function lead(a){
  var s = '0' + a;
  if (s.length>2)
    s = s.substr(1);
  return s;
}

function extractHistory(html_str){  
  var timeStart = new Date()
  var parser = new DOMParser();
  var htmlDoc = parser.parseFromString(html_str, "text/html");
  var jdoc = $(htmlDoc);
  var textArea = "Your Telegram History\n";
  var curDate = null;
  var curDateFormatted = null;
  $('.im_history_messages_peer', jdoc).not('.ng-hide').each(function() {
    //$('div[class~="im_history_message_wrap"]', $(this)).each(function() {
    $('.im_history_message_wrap', $(this)).each(function() {
      //extract current date split
      $('.im_message_date_split', $(this)).each(function(){
        $('.im_message_date_split_text', $(this)).each(function(){
          curDate = $(this).text();
        });
      });
      //proceed with messages
      var text = extract('im_message_text', null, $(this));
      var author = extract('im_message_author', null, $(this));
      var time = extract('im_message_date', 'data-content', $(this));  
      var fullDateStr = curDate + ", " + time;
      var d = new Date(Date.parse(fullDateStr));
      curDateFormatted = lead(d.getDate())+'.'+lead(d.getMonth()+1)+'.'+d.getFullYear() + ' ' + lead(d.getHours()) + ':' + lead(d.getMinutes()) + ':' + lead(d.getSeconds());    
      textArea += "\n" + curDateFormatted + ", " + author + ": "+ text;
    });
  });  
  $('#myTextarea').val(textArea);
  var elapsedTime = new Date()-timeStart;
  var logMsg = 'Working time: '+elapsedTime+' ms.' + ' Size ' + textArea.length;
  console.log(logMsg);
  $('.classOne').val(logMsg);
  //$('#myTextAreaTest').val(logMsg);
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.executeScript(null,  {file: "content_script.js"});     
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {text: 'telegram_dom_request'}, function(response){
      console.log('Received ' + response.text.length + ' bytes of response.');
      extractHistory(response.text);
    });
  });
});
