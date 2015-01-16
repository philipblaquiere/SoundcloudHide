var idStack = [];
var skipStack = [];
var hiddenSongs = [];

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        var result = details.url.match(/tracks\/\d+\/streams/);
        var id = result[0].match(/\d+/)[0]
        idStack.push(id);
    },
    {urls: ["*://api.soundcloud.com/i1/*/streams*"]}
);

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        var result = details.url.match(/tracks\/\d+\/plays/);
        var id = result[0].match(/\d+/)[0]
        var isHidden;
        chrome.storage.sync.get(id, function (hiddenSong) {
            console.info(hiddenSong);
            isHidden = hiddenSong != null;
        });
        if (isHidden) {
            notifySkip();
        }
        return { cancel: isHidden } //Stops from sending request a skip.
    },
    { urls: ["*://api.soundcloud.com/tracks/*/plays*"] },
     ["blocking"]
);

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        var idMatchresult = details.url.match(/A\d+&source/);
        var id = idMatchresult[0].match(/\d+/)[0]
        var isHidden = hiddenSongs.indexOf(id) != -1;
        if (!isHidden) {
            //Song isn't hidden, proceed as normal
            console.log("Song with ID : " + id + " is not hidden, proceed.")
            clearSkipStack();
            return;
        }

        var triggerMatch = details.url.match(/&trigger=auto&/);
        var trigger = triggerMatch == null ? "manual" : "auto";

        var skipDirection;
        if (trigger == "manual" && skipStack.length > 0) {
            //user pressed skip, check if song is hidden
            skipDirection = skipStack.pop();
        }
        clearSkipStack();
        if (!skipDirection) {
            skipDirection = "forward";
        }
        //signal schide.js to skip forward
        console.log("Skipping song from background ID: " +id + " Direction : " +skipDirection)
        chrome.tabs.query({ url: "https://soundcloud.com/*" }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { request: "skipSong", skipDirection: skipDirection }, function () {
            });
        });
    },
    { urls: ["*://eventlogger.soundcloud.com/audio?anonymous_id=*action=play*"] }
);

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        clearSkipStack();
        var result = details.url.match(/skip.*context/);
        var skipMatch = result[0].match(/back/);
        var skip = skipMatch == null ? "forward" : "back"
        console.log("Received skip : " + skip);
        skipStack.push(skip)
    },
    { urls: ["*://eventlogger.soundcloud.com/click?*=*3Askip_*"] }
);


function clearSkipStack()
{
    while(skipStack.length > 0) {
        skipStack.pop();
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    
    if (request.request == "lastId") {
        if (idStack.length == 0) {
            sendResponse({ id: "" });
        }
        var lastId = idStack[idStack.length - 1];
        sendResponse({ id: lastId });
        return;
    }
    else if (request.request == "hideButton") {
        if (request.id == "" || request.id == null) {
            return
        }
        hiddenSongs.push(request.id);
        var song = {};
        song[request.id] = request.songName;
        chrome.storage.sync.set(song, function () {
        });
        sendResponse({ "message": 'Song ID:' + request.id + " - " + request.songName + " saved as hidden." });
    }
    else if (request.request == "isHidden") {
        if (request.id == "" || request.id == null) {
            sendResponse({isHidden : "empty"})
        }
        var response = isHidden(request.id) ? "true" : "false";

    }
});