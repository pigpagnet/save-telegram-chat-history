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

function storeMessage(messageDate, messageSender, messageTxt, messageMetaInfo, hiddenInfo, fwdMessageDate, fwdSender){
	historyMessages.push({
		type: 'msg',
		date: messageDate,
		sender: messageSender,
		text: messageTxt,
		metainfo: messageMetaInfo, // to display
		hiddeninfo: hiddenInfo, // e.g. {mes_id:"", photo_id:""}
		fwd_date: fwdMessageDate,
		fwd_sender: fwdSender,
	})
}

function storeServiceMessage(messageDate, messageSender, messageText, hiddenInfo){
	historyMessages.push({
		type: 'service',
		date: messageDate,
		sender: messageSender,
		text: messageText,
		hiddeninfo: hiddenInfo, // e.g. {mes_id:"", ?photo_id:""}
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
			countPhotos: photosData && photosData.count ? photosData.count : 0,
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

function updateCache_PeerFullName(userID,AppUsrMng){
	if (!(userID in peerIDs)){
		var userObject = AppUsrMng.getUser(userID)
		if (userObject.deleted){
			peerIDs[userID] = 'DELETED'
		}else{
			peerIDs[userID] = userObject.rFullName.toString()
		}
	}
}

function updateCache_PeerGroupTitle(peerID,AppChatsMng){
	if (!(peerID in peerIDs)){
		var groupObject = AppChatsMng.getChat(-peerID)
		peerIDs[peerID] = groupObject.title
	}
}

function processGetHistoryResponse(peerID,res,AppMesMng,AppUsrMng,AppChatsMng,AppPhotMng,time1){
	if (res.$$state.status == 1){
		if (historyForPeerID != peerID){
			clear()
			historyForPeerID = peerID
			if (historyForPeerID >= 0){
				getPhotosData(AppPhotMng, historyForPeerID)
				updateCache_PeerFullName(historyForPeerID,AppUsrMng)
			} else { //it is a group
				updateCache_PeerGroupTitle(historyForPeerID,AppChatsMng)
			}
		}
		if (countMessages == -1){
			countMessages = res.$$state.value.count
			console.log("messages to fetch = "+countMessages)
		}
		var messageIDs = res.$$state.value.history
		var time2 = new Date().getTime()
		for(var i=0; i<messageIDs.length; i++){ //what order? date decreasing?
			var msgWrap = AppMesMng.wrapForHistory(messageIDs[i])
			var msgHiddenInfo = {msg_id: messageIDs[i]}
			var msgDate = formatDate(new Date(msgWrap.date * 1000)) // we format here to avoid multiple formatting at popup.js
			var msgSender = msgWrap.fromID || msgWrap.from_id // ID
			updateCache_PeerFullName(msgSender,AppUsrMng)
			if (msgWrap._ == 'messageService'){
				var msgServiceText = ''
				switch (msgWrap.action._){
					case 'messageActionChatCreate': 
						msgServiceText = 'created the group "' + (msgWrap.action.title || '' ) + '"'
						break
					case 'messageActionChannelCreate':
						msgServiceText = 'created the channel "' + (msgWrap.action.title || '' ) + '"'
						break
					case 'messageActionChannelMigrateFrom':
						msgServiceText = 'upgraded the group to a supergroup'
						break
					case 'messageActionChatAddUser': //invited {users.name....}
						msgServiceText = 'invited '
						for(var iuser=0; iuser<msgWrap.action.users.length; iuser++){
							var invited_uid = msgWrap.action.users[iuser]
							updateCache_PeerFullName(invited_uid,AppUsrMng)
							if (iuser == 0)
								msgServiceText += peerIDs[invited_uid]
							else
								msgServiceText += ', ' + peerIDs[invited_uid]
						}
						break
					case 'messageActionChatLeave':
						//if (msgWrap.action.user_id == msgSender){ //left group
						msgServiceText = 'left group'
						break
					case 'messageActionChatDeleteUser': //removed {users.name....}
						var removed_uid = msgWrap.action.user_id
						updateCache_PeerFullName(removed_uid,AppUsrMng)
						msgServiceText = 'removed ' + peerIDs[removed_uid]
						break
					case 'messageActionChatEditTitle': 
						msgServiceText = 'changed group name to "' + (msgWrap.action.title || '' ) +'"'
						break
					case 'messageActionChatEditPhoto':
						msgServiceText = 'changed group photo'
						break
					case 'messageActionChannelEditPhoto':
						msgServiceText = 'changed channel photo'
						break
					case 'messageActionChatDeletePhoto':
						msgServiceText = 'removed group photo'
						break
					case 'messageActionPhoneCall':
						switch (msgWrap.action.type){
							case 'in_ok':
								msgServiceText = 'incoming call ' + formatCallDuration(msgWrap.action.duration)
								break
							case 'out_ok':
								msgServiceText = 'outgoing call ' + formatCallDuration(msgWrap.action.duration)
								break
							case 'in_missed':
								msgServiceText = 'missed call'
								break
							case 'out_missed':
								msgServiceText = 'cancelled call'
								break
							default:
								msgServiceText = 'unknown phone call action type: ' + msgWrap.action.type
						}
						break
					default:
						msgServiceText = 'unsupported service message type: ' + msgWrap.action._
				}
				storeServiceMessage(msgDate,msgSender,'>>' + msgServiceText + '<<',msgHiddenInfo)
				continue
			}

			var msgTxt = msgWrap.message
			var msgMetaInfo = ''
			var fwdMessageDate = ''
			var fwdSender = ''
			if (msgWrap.fwd_from){
				fwdMessageDate = formatDate(new Date(msgWrap.fwd_from.date * 1000))
				fwdSender = msgWrap.fwd_from.from_id
				updateCache_PeerFullName(fwdSender,AppUsrMng)
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
			storeMessage(msgDate,msgSender,msgTxt,msgMetaInfo,msgHiddenInfo,fwdMessageDate,fwdSender)
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
				AppMesMng,AppUsrMng,AppChatsMng,AppPhotMng,time1)
		},timeOutWaitForHistory);
	}
}

function handleMoreHistoryRequest(limit){
	var injector = angular.element(document).injector()
	var AppMesManager = injector.get('AppMessagesManager')
	var AppUsrManager = injector.get('AppUsersManager')
	var AppChatsManager = injector.get('AppChatsManager')
	var AppPhotManager = injector.get('AppPhotosManager')
	var iRootScope = injector.get('$rootScope')
	var peerID = iRootScope.selectedPeerID

	if (peerID == 0){
		console.log('it seems a peer was not chosen.')
		sendHistory()
		return
	}
	console.log("loading history for peerID = " + peerID)
	var time1 = new Date().getTime()

	if (countMessages==-1 || historyMessages.length < countMessages){
		var res = AppMesManager.getHistory(peerID, maxID, limit)
		processGetHistoryResponse(peerID,res,
			AppMesManager,AppUsrManager,AppChatsManager,AppPhotManager,time1)
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
