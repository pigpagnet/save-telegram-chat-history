// Constants
defaultMapFormats = {
  formatCompact:"dt, u: m",
  formatLarge:"u [dt]\\nm\\n",
  formatCustom:"",
  selected:"formatCompact",  
};

// Argument is of type Date.
// Some examples:
//   d = new Date();  // current date
//   d.setMonth(d.getMonth() - 3); // set 3 month prior to date
function getDatePart(d){
  return lead(d.getDate())+'.'+lead(d.getMonth()+1)+'.'+d.getFullYear();
}

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

function prepareFormat(format) {
  format = format.replace(/\\n/g, "\n");
  format = format.replace(/\\t/g, "\t");
  return format;
}

recognizedLocale = null;

// Returns a string value 'MM' if recognized, otherwise null.
function checkLocale(locale, str){
  var j;
  for(j=0; j<12; j++){
    if (locales[locale][j].localeCompare(str)==0){
      return lead((j+1).toString());
    }
  }
  return null;
}

// Returns 'DD.MM.YYYY' from a local fullString dateformat of angular.
function parseFullDate(dateStr){
  var YYYY = null, MM = null, DD = null;
  var a = dateStr.split(/[\s,.]+/);
  var i;
  for (i = 1; i < a.length; i++) { //skip day of week
    if (isNaN(a[i])){
      if (a[i].length>2){
        //find locale
        if (recognizedLocale != null){
          MM = checkLocale(recognizedLocale, a[i]);
          if (MM == null){
            recognizedLocale = null;
          }
        }
        if (recognizedLocale == null){
          var candidateLocale = null;
          var cntCandidates = 0;
          for (var locale in locales) {
            var tmpMM = checkLocale(locale, a[i]);
            if (tmpMM != null){
              if (MM == null){
                MM = tmpMM;
                candidateLocale = locale;
              }
              cntCandidates += 1;
            }
          }
          if (cntCandidates == 1){
            recognizedLocale = candidateLocale;
            console.log('recognized locale = '+recognizedLocale);
          }
        }
      }
    }else{
      var num = parseInt(a[i]);
      if (num < 32){
        DD = lead(a[i]);
      }else if (num>2000){
        YYYY = a[i];
      }else{
        console.log('unexpected integer token while parsing date: '+num);
        return null;
      }
    }
  }
  return DD+"."+MM+"."+YYYY;
}

function prepareTime(timeStr){
  var t = timeStr.toLowerCase();
  var a = t.split(/[\s,.:]+/);
  var HHint = parseInt(a[0]);
  if (t.includes('a') && HHint==12){
    HHint -= 12;
  }
  if (t.includes('p') && HHint != 12){
    HHint += 12;
  }
  return lead(HHint.toString())+":"+lead(a[1])+":"+lead(a[2]);
}
