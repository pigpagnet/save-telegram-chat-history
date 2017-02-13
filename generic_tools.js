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