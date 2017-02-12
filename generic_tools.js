function friendlySize(size){
	var s = '' + size
	var res = s
	for(var i=s.length-3; i>0; i-=3){
		res = res.slice(0,i) + "'" + res.slice(i)
	}
	return res
}