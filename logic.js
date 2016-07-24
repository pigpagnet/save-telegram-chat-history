// Constants
defaultMapFormats = {
  formatCompact:"dt, u: m",
  formatLarge:"u [dt]\\nm\\n",
  formatCustom:"",
  selected:"formatCompact",  
};

// Argument is of type Date.
function formatDate(d){
  return getDatePart(d) + ' ' + lead(d.getHours()) + ':' + lead(d.getMinutes()) + ':' + lead(d.getSeconds());
}

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

function lead(a){
  var s = '0' + a;
  if (s.length>2)
    s = s.substr(1);
  return s;
}

// Argument is of type Date.
// Some examples:
//   d = new Date();  // current date
//   d.setMonth(d.getMonth() - 3); // set 3 month prior to date
function getDatePart(d){
  return lead(d.getDate())+'.'+lead(d.getMonth()+1)+'.'+d.getFullYear();
}

function prepareFormat(format) {
  format = format.replace(/\\n/g, "\n");
  format = format.replace(/\\t/g, "\t");
  return format;
}
