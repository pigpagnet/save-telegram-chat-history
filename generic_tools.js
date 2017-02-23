// Message format
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




// Argument is of type Date.
// Some examples:
//   d = new Date();  // current date
//   d.setMonth(d.getMonth() - 3); // set 3 month prior to date
function formatDate(d){
  return lead(d.getDate())+'.'+lead(d.getMonth()+1)+'.'+d.getFullYear() + ' ' 
    + lead(d.getHours()) + ':' + lead(d.getMinutes()) + ':' + lead(d.getSeconds());
}

function lead(a){
  var s = '0' + a;
  if (s.length>2)
    s = s.substr(1);
  return s;
}

function friendlySize(size){
  var s = '' + size
  var res = s
    for(var i=s.length-3; i>0; i-=3){
    res = res.slice(0,i) + "'" + res.slice(i)
  }
  return res
}


function comparatorArithmetic(a,b){
  return a-b
}

// var arr = [3,4,6]
// binSearch(arr, 5, comparator)
function binSearch(arr, val, comparator) {
  if (comparator == null){
    comparator = comparatorArithmetic
  }
  var left = -1
  var right = arr.length + 1
  while (right - left > 1){    
    var mid = Math.floor((right + left) / 2)    
    var cmp = comparator(arr[mid], val)        
    if (cmp == 0){
      return mid
    }    
    if (cmp < 0){
      left = mid
    }else{
      right = mid
    }
  } 
  return -right
}
