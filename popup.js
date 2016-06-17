function extract(element, el_class, attribute, where){
  var text = "";
  $(element+'[class~="'+el_class+'"]', where).each(function(){
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
  var parser = new DOMParser();
  var htmlDoc = parser.parseFromString(html_str, "text/html");
  var jdoc = $(htmlDoc);
  var textArea = "Your Telegram History\n";
  var curDate = null;
  var curDateFormatted = null;
  $('div[class~="im_history_messages_peer"]', jdoc).not('[class~="ng-hide"]').each(function() {
    $('div[class~="im_history_message_wrap"]', $(this)).each(function() {
      //extract current date split
      $('div[class~="im_message_date_split"]', $(this)).each(function(){
        $('span[class~="im_message_date_split_text"]', $(this)).each(function(){
          curDate = $(this).text();
        });
      });
      //proceed with messages
      var text = extract('div','im_message_text', null, $(this));
      var author = extract('a','im_message_author', null, $(this));
      var time = extract('span','im_message_date', 'data-content', $(this));  
      var fullDateStr = curDate + ", " + time;
      var d = new Date(Date.parse(fullDateStr));
      curDateFormatted = lead(d.getDate())+'.'+lead(d.getMonth()+1)+'.'+d.getFullYear() + ' ' + lead(d.getHours()) + ':' + lead(d.getMinutes()) + ':' + lead(d.getSeconds());    
      textArea += "\n" + curDateFormatted + ", " + author + ": "+ text;
    });
  });  
  $('#myTextarea').val(textArea);
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
