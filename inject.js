var timeOutWaitForHistory = 200

var limit1 = 20

var myID = 0

var historyForPeerID
var peerIDs // {id: name}
var historyMessages
var maxID
var countMessages
var photo_ids // {'msg_id', 'photo_id'}
var photosData

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
	photo_ids = []
	photosData = []
	console.log('cleared')
}

function storeMessage(messageDate, messageSender, messageTxt, messageMetaInfo, hiddenInfo){
	historyMessages.push({
		date: messageDate,
		sender: messageSender,
		text: messageTxt,
		metainfo: messageMetaInfo, // to display
		hiddeninfo: hiddenInfo, // e.g. {mes_id:"", photo_id:""}
	})
}

function sendHistory(){
	document.dispatchEvent(new CustomEvent('from_injected', {
		detail:{
			myID: myID,
			peerID: historyForPeerID,
			historyMessages: historyMessages,
			peerIDs: peerIDs,
			countMessages: countMessages,
			countPhotos: photosData && photosData.count ? photosData.count : 0
		}
	}))
}

function getPhotosData(AppPhotMng, userID){
	AppPhotMng.getUserPhotos (userID, 0, 0).then(function (photos){
		photosData = photos
		console.log('found '+ photos.count+' photos with peer_id='+userID)
	})
	// {count, photos: photoIDs}
}


function processGetHistoryResponse(peerID,res,AppMesMng,AppUsrMng,AppPhotMng,time1){
	if (res.$$state.status == 1){
		if (historyForPeerID != peerID){
			clear()
			historyForPeerID = peerID
			getPhotosData(AppPhotMng, historyForPeerID)
		}
		if (countMessages == -1){
			countMessages = res.$$state.value.count
			console.log("messages to fetch = "+countMessages)
		}
		var messageIDs = res.$$state.value.history
		var time2 = new Date().getTime()
		for(var i=0; i<messageIDs.length; i++){ //what order? date decreasing?
			var msgWrap = AppMesMng.wrapForHistory(messageIDs[i])
			var msgTxt = msgWrap.message
			var msgDate = formatDate(new Date(msgWrap.date * 1000))
			var msgSender = msgWrap.fromID // ID
			var msgMetaInfo = ''
			var msgHiddenInfo = {msg_id: messageIDs[i]}
			if (!(msgSender in peerIDs)){
				var userObject = AppUsrMng.getUser(msgSender)
				//var fFirstName = userObject.rFirstName.toString()
				var fFirstName = userObject.rFullName.toString()
				peerIDs[msgSender] = fFirstName
			}
			if (msgWrap.media){
				console.log('found media type of the message, date = '+msgDate)
				switch (msgWrap.media._) {
					case 'messageMediaPhoto':
						var photoId = msgWrap.media.photo.id
						//AppPhotMng.downloadPhoto(photoId)
						photo_ids.push({photo_id: photoId, message_id: messageIDs[i]})
						msgHiddenInfo.photo_id = photoId
						msgMetaInfo = 'Photo'
						msgTxt = msgWrap.media.caption
						break
					case 'messageMediaDocument':
						//msgWrap.media.document
						//console.log('found a document')
						switch (msgWrap.media.document.mime_type){
							case 'audio/ogg':
								if (msgWrap.media.document.type == 'voice'){
									msgMetaInfo = 'Voice Message'
								}else{
									msgMetaInfo = 'Audio'
								}
								var secs = msgWrap.media.document.duration
								if (secs){
									msgMetaInfo += ','
									var mins = Math.floor(secs / 60)
									var rem_secs = secs % 60
									if (mins > 0)
										msgMetaInfo += " " + mins + "min"
									msgMetaInfo += " " + rem_secs + "sec"
								}
								break
							case 'video/mp4':
								if (msgWrap.media.document.type == "gif"){
									msgMetaInfo = 'GIF'
								}else{
									msgMetaInfo = 'Video'
								}
								break
							case 'application/octet-stream':
								msgMetaInfo = 'File "' + msgWrap.media.document.file_name + '"'
								break
							default:
								msgMetaInfo = 'Document'
						}
						if (msgWrap.media.document.type == "sticker"){
							msgMetaInfo = msgWrap.media.document.stickerEmojiRaw + ' Sticker'
						}
						if (msgWrap.media.document.size){
							msgMetaInfo += ', size ' + friendlySize(msgWrap.media.document.size) + ' bytes'
						}
						break
					case 'messageMediaGeo':
						msgMetaInfo = 'Geo Lat/Long = ' + msgWrap.media.geo.lat + ', ' + msgWrap.media.geo.long
						//msgMetaInfo = 'Geo'
						break

					case 'messageMediaVenue':
						msgMetaInfo = 'Venue'
						break

					case 'messageMediaContact':
						msgMetaInfo = 'Contact: ' + msgWrap.media.first_name 
							+ ' ' + msgWrap.media.last_name 
							+ ' ' + msgWrap.media.phone_number
						break

					case 'messageMediaWebPage':
						msgMetaInfo = 'Webpage'
						break

					default:
						msgMetaInfo = '?' + msgWrap.media._
						console.log('found unknown type of media: '+msgWrap.media._)
				}
			}
			storeMessage(msgDate,msgSender,msgTxt,msgMetaInfo,msgHiddenInfo)
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
			processGetHistoryResponse(peerID,res,
				AppMesMng,AppUsrMng,AppPhotMng,time1)
		},timeOutWaitForHistory);
	}
}

function handleMoreHistoryRequest(limit){
	var injector = angular.element(document).injector()
	var AppMesManager = injector.get('AppMessagesManager')
	var AppUsrManager = injector.get('AppUsersManager')
	var AppPhotManager = injector.get('AppPhotosManager')
	var iRootScope = injector.get('$rootScope')
	var peerID = iRootScope.selectedPeerID
	console.log("loading history for peerID = " + peerID)
	var time1 = new Date().getTime()

	if (countMessages==-1 || historyMessages.length < countMessages){
		var res = AppMesManager.getHistory(peerID, maxID, limit)
		processGetHistoryResponse(peerID,res,
			AppMesManager,AppUsrManager,AppPhotManager,time1)
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

document.addEventListener ("to_injected_open_photos", function(e){	
	var injector = angular.element(document).injector()
	var AppPhotManager = injector.get('AppPhotosManager')
	if (photo_ids.length > 0){
		if (e.detail){
			var str = e.detail.split(",")
			var photoId = str[0]
			var mesId = str[1]
			AppPhotManager.openPhoto(photoId, {m: mesId})
		}else{
			var pos = 0
			AppPhotManager.openPhoto(photo_ids[pos]['photo_id'], {m: photo_ids[pos]['message_id']})
		}
	}else{
		console.log('No photos found for current history.')
	}
}, false);
