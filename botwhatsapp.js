// ==UserScript==
// @name         WhatsappWeb Bot
// @namespace    https://botlove282.hopto.org
// @version      0.6
// @description  WhatsappWeb Chat Bot
// @author       BotLove282
// @match        https://web.whatsapp.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

console.log('Whatsapp Bot ready and operational');
(() => {
	//
	// GLOBAL VARS AND CONFIGS
	//
	var lastMessageOnChat = false;
	var ignoreLastMsg = {};
	var elementConfig = {
		"chats": [0, 0, 5, 2, 0, 3, 0, 0, 0],
		"chat_icons": [0, 0, 1, 1, 1, 0],
		"chat_title": [0, 0, 1, 0, 0, 0, 0],
		"chat_lastmsg": [0, 0, 1, 1, 0, 0],
		"chat_active": [0, 0],
		"selected_title": [0, 0, 5, 3, 0, 1, 1, 0, 0, 0, 0]
	};

//Witze
	const jokeList = [
`Kommt ein Kind zu seiner Mutter und sagt: ,,Mama, ich
hab eine 6 in Mathe und bleibe sitzen…
“Darauf die Mutter:,,Macht nix, hast’ eh Krebs…”`,

`Warum hat die Gasleitung immer 11 Löcher?
– Weil jeder Jude nur 10 Finger hat.`,

`Was bekommt ein Kannibale, der zu spät zum Essen kommt?
– Die kalte Schulter!`,

`Wie viele Tote gab es nochmal bei diesem tragischen Flugzeugabsturz neulich?”
– “124 und ein paar Zerquetschte.”`,
`Man kann nicht wirklich sagen, dass Hitler nur böse war. Immerhin hat er Hitler getötet.`
	]


	//
	// FUNCTIONS
	//

	function getElement(id, parent){
		if (!elementConfig[id]){
			return false;
		}
		var elem = !parent ? document.body : parent;
		var elementArr = elementConfig[id];
		elementArr.forEach(function(pos) {
			if (!elem.childNodes[pos]){
				return false;
			}
			elem = elem.childNodes[pos];
		});
		return elem;
	}

	function getLastMsg(){
		var messages = document.querySelectorAll('.msg');
		var pos = messages.length-1;

		while (messages[pos] && (messages[pos].classList.contains('msg-system') || messages[pos].querySelector('.message-in'))){
			pos--;
			if (pos <= -1){
				return false;
			}
		}
		if (messages[pos] && messages[pos].querySelector('.selectable-text')){
			return messages[pos].querySelector('.selectable-text').innerText.trim();
		} else {
			return false;
		}
	}

	function getUnreadChats(){
		var unreadchats = [];
		var chats = getElement("chats");
		if (chats){
			chats = chats.childNodes;
			for (var i in chats){
				if (!(chats[i] instanceof Element)){
					continue;
				}
				var icons = getElement("chat_icons", chats[i]).childNodes;
				if (!icons){
					continue;
				}
				for (var j in icons){
					if (icons[j] instanceof Element){
						if (!(icons[j].childNodes[0].getAttribute('data-icon') == 'muted' || icons[j].childNodes[0].getAttribute('data-icon') == 'pinned')){
							unreadchats.push(chats[i]);
							break;
						}
					}
				}
			}
		}
		return unreadchats;
	}

	function didYouSendLastMsg(){
		var messages = document.querySelectorAll('.msg');
		if (messages.length <= 0){
			return false;
		}
		var pos = messages.length-1;

		while (messages[pos] && messages[pos].classList.contains('msg-system')){
			pos--;
			if (pos <= -1){
				return -1;
			}
		}
		if (messages[pos].querySelector('.message-out')){
			return true;
		}
		return false;
	}

	// Call the main function again
	const goAgain = (fn, sec) => {
		// const chat = document.querySelector('div.chat:not(.unread)')
		// selectChat(chat)
		setTimeout(fn, sec * 1000)
	}

	// Dispath an event (of click, por instance)
	const eventFire = (el, etype) => {
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(etype, true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
		el.dispatchEvent(evt);
	}

	// Select a chat to show the main box
	const selectChat = (chat, cb) => {
		const title = getElement("chat_title",chat).title;
		eventFire(chat.firstChild.firstChild, 'mousedown');
		if (!cb) return;
		const loopFewTimes = () => {
			setTimeout(() => {
				const titleMain = getElement("selected_title").title;
				if (titleMain !== undefined && titleMain != title){
					console.log('not yet');
					return loopFewTimes();
				}
				return cb();
			}, 300);
		}

		loopFewTimes();
	}

	// Send a message
	const sendMessage = (chat, message, cb) => {
		//avoid duplicate sending
		var title;

		if (chat){
			title = getElement("chat_title",chat).title;
		} else {
			title = getElement("selected_title").title;
		}
		ignoreLastMsg[title] = message;

		messageBox = document.querySelectorAll("[contenteditable='true']")[0];

		//add text into input field
		messageBox.innerHTML = message.replace(/  /gm,'');

		//Force refresh
		event = document.createEvent("UIEvents");
		event.initUIEvent("input", true, true, window, 1);
		messageBox.dispatchEvent(event);

		//Click at Send Button
		eventFire(document.querySelector('span[data-icon="send"]'), 'click');

		cb();
	}

	//
	// MAIN LOGIC
	//
	const start = (_chats, cnt = 0) => {
		// get next unread chat
		const chats = _chats || getUnreadChats();
		const chat = chats[cnt];

		var processLastMsgOnChat = false;
		var lastMsg;

		if (!lastMessageOnChat){
			if (false === (lastMessageOnChat = getLastMsg())){
				lastMessageOnChat = true; //to prevent the first "if" to go true everytime
			} else {
				lastMsg = lastMessageOnChat;
			}
		} else if (lastMessageOnChat != getLastMsg() && getLastMsg() !== false && !didYouSendLastMsg()){
			lastMessageOnChat = lastMsg = getLastMsg();
			processLastMsgOnChat = true;
		}

		if (!processLastMsgOnChat && (chats.length == 0 || !chat)) {
			return goAgain(start, 3);
		}

		// get infos
		var title;
		if (!processLastMsgOnChat){
			title = getElement("chat_title",chat).title + '';
			lastMsg = (getElement("chat_lastmsg", chat) || { innerText: '' }).title.replace(/[\u2000-\u206F]/g, ""); //.last-msg returns null when some user is typing a message to me
		} else {
			title = getElement("selected_title").title;
		}
		// avoid sending duplicate messaegs
		if (ignoreLastMsg[title] && (ignoreLastMsg[title]) == lastMsg) {
			return goAgain(() => { start(chats, cnt + 1) }, 0.1);
		}

		// what to answer back?
		let sendText

		if (lastMsg.toUpperCase('@HELP') == '@HELP'){
			sendText = 
				`Hey ${title}! Hier sind alle Befehle

				1. *@ZEIT*
				2. *@WITZ*
				3. (WIP) @WETTER`
		}

		if (lastMsg.toUpperCase('@ZEIT') == '@ZEIT'){
			sendText = `
				Du bist am Handy, guck selbst nach...

				*${new Date()}*`
		}

		if (lastMsg.toUpperCase('@WITZ') == '@WITZ'){
			// Get random value between a range
			function rand(high, low = 0) {
				return Math.floor(Math.random() * 4 + 1);
			}
			sendText = jokeList[rand(jokeList.length)];
		}

		if (lastMsg.toUpperCase('@WETTER') == '@WETTER'){
			sendText =
				`Es tut mir leid ${title}, dieser Befehl ist noch WIP`
		}

		// that's sad, there's not to send back...
		if (!sendText) {
			ignoreLastMsg[title] = lastMsg;
			console.log(new Date(), 'new message ignored -> ', title, lastMsg);
			return goAgain(() => { start(chats, cnt + 1) }, 0.1);
		}

		console.log(new Date(), 'new message to process, uhull -> ', title, lastMsg);

		// select chat and send message
		if (!processLastMsgOnChat){
			selectChat(chat, () => {
				sendMessage(chat, sendText.trim(), () => {
					goAgain(() => { start(chats, cnt + 1) }, 1);
				});
			})
		} else {
			sendMessage(null, sendText.trim(), () => {
				goAgain(() => { start(chats, cnt + 1) }, 1);
			});
		}
	}
	start();
})()
