var timeOutWaitForHistory = 200

var limit1 = 20

var myID = 0

var historyForPeerID
var peerIDs // {id: name}
var historyMessages
var maxID
var countMessages

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

function clear(){
	historyForPeerID = 0
	peerIDs = {}
	historyMessages = []
	maxID = 0
	countMessages = -1
}

function storeMessage(messageDate, messageSender, messageTxt){
	historyMessages.push({
		date: messageDate,
		sender: messageSender,
		text: messageTxt
	})
}

function sendHistory(){
	document.dispatchEvent(new CustomEvent('from_injected', {
		detail:{
			myID: myID,
			peerID: historyForPeerID,
			historyMessages: historyMessages,
			peerIDs: peerIDs,
			countMessages: countMessages
		}
	}));
}

function processGetHistoryResponse(peerID,res,AppMesMng,AppUsrMng,time1){
	if (res.$$state.status == 1){
		if (historyForPeerID != peerID){
			clear()
			historyForPeerID = peerID
		}
		if (countMessages == -1){
			countMessages = res.$$state.value.count
			console.log("messages to fetch = "+countMessages)
		}
		var messageIDs = res.$$state.value.history
		var time2 = new Date().getTime()
		for(var i=0; i<messageIDs.length; i++){
			var msgWrap = AppMesMng.wrapForHistory(messageIDs[i])
			var msgTxt = msgWrap.message
			var msgDate = formatDate(new Date(msgWrap.date * 1000))
			var msgSender = msgWrap.fromID // ID
			if (!(msgSender in peerIDs)){
				//peerIDs[msgSender] = AppUsrMng.getUserString(msgSender)
				var userObject = AppUsrMng.getUser(msgSender)
				var fFirstName = userObject.rFirstName.toString()
				peerIDs[msgSender] = fFirstName
			}
			storeMessage(msgDate,msgSender,msgTxt)
		}
		maxID = messageIDs[messageIDs.length-1]
		console.log("fetched "+messageIDs.length+" messages in "
			+(time2-time1)/1000.0+" sec.")
		console.log("Total progress: "
			+Math.floor(100*historyMessages.length/countMessages) 
			+" %")
		sendHistory()
	}else{
		setTimeout(function(){
			processGetHistoryResponse(peerID,res,AppMesMng,AppUsrMng,time1)
		},timeOutWaitForHistory);
	}
}

function handleMoreHistoryRequest(limit){
	var injector = angular.element(document).injector()
	var AppMesManager = injector.get('AppMessagesManager')
	var AppUsrManager = injector.get('AppUsersManager')
	var iRootScope = injector.get('$rootScope')
	var peerID = iRootScope.selectedPeerID
	console.log("loading history for peerID = " + peerID)
	var time1 = new Date().getTime()

	if (countMessages==-1 || historyMessages.length < countMessages){
		var res = AppMesManager.getHistory(peerID, maxID, limit)
		processGetHistoryResponse(peerID,res,AppMesManager,AppUsrManager,time1)
	}else{
		sendHistory()
	}
}

function handleCurrentHistoryRequest(){
	var injector = angular.element(document).injector()
	var iRootScope = injector.get('$rootScope')
	var peerID = iRootScope.selectedPeerID
	if (peerID == historyForPeerID){
		sendHistory()
	}else{
		clear()
		handleMoreHistoryRequest(limit1)
	}
}

function prepare(){
	var injector = angular.element(document).injector()
	var MtpApiManager = injector.get('MtpApiManager')
	//myID = MtpApiManager.getUserID()
	MtpApiManager.getUserID().then(function (id) {
		myID = id
	})
	clear()
}

prepare()

document.addEventListener ("to_injected_get_more", function(e){	
	handleMoreHistoryRequest(e.detail)
}, false);

document.addEventListener ("to_injected_current", function(){
	if (countMessages>=0)
		handleCurrentHistoryRequest()
	else
		handleMoreHistoryRequest(limit1)
}, false);
