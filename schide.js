

var soundListItemClass = ".soundList__item";
var soundListClass = ".lazyLoadingList__list";
var soundActionsClass = ".soundActions__small";
var playButtonClass = ".sc-button-play";
var tracks

$(document).ready(function () {

    document.addEventListener("DOMSubtreeModified", function(a) {

        checkNewContent(a.target)
    }, false);

});
	

function checkNewContent(b) {
    try {
    	var indexof = b.className.indexOf("commentPopover")
        if (indexof !== -1 || !newVersion) {
            addHideButtons()
        }
    } catch (a) {}
}

function addHideButtons()
{
	$(".sc-button-share").each(function(ind, obj){
		var parent = $(obj).parent();
		var lastChildClassName = parent.children().last().attr('class');
		if(lastChildClassName.indexOf('sc-button-hide') == -1)
		{
			var hideButton = document.createElement('button');
			hideButton.setAttribute('class', 'sc-button-hide sc-button sc-button-small sc-button-responsive');
			hideButton.setAttribute('tabindex','0');
			hideButton.setAttribute('aria-haspopup','true');
			hideButton.setAttribute('role','Button');
			hideButton.setAttribute('title','Hide');
			hideButton.insertAdjacentHTML('afterBegin','Hide');
			parent.append(hideButton);
		}
		else
		{
			var name = lastChildClassName;
		}
	});
}

$(document).on('mouseover', '.sc-button-hide', function () {
    var currentId = $(this).attr('id');
    if (currentId == "" || currentId == "empty stack" || currentId == null) {
        var playButtonParent = $(this).closest(".sound.streamContext").children(".sound__header").children(".soundTitle").children("div")[1];
        var playButton = $(playButtonParent).children(".soundTitle__playButton");
        $(playButton).trigger('mouseover');
    }
});

$(document).on('click', '.sc-button-hide', function () {
    var currentId = $(this).attr('id');
    if (currentId == "" || currentId == "empty stack" || currentId == null) {
        var playButtonParent = $(this).closest(".sound.streamContext").children(".sound__header").children(".soundTitle").children("div")[1];
        var playButton = $(playButtonParent).children(".soundTitle__playButton");
        $(playButton).trigger('mouseover');
    }
    hideButton(this);
});

$(document).on('mouseover', '.soundTitle__playButton', function () {
    var streamContext = $(this).closest(".sound.streamContext");
    var hideButton = $(streamContext).children(".sound__footer")
                        .children(".sound__soundActions")
                        .children(".soundActions")
                        .children(".sc-button-group.sc-button-group-small")
                        .children(".sc-button-hide");
    setHideButtonId(hideButton);
});
function getSongNameFromHideButton(button) {
    var streamContext = $(button).closest(".sound.streamContext");
    var titleHeader = $(streamContext).children(".sound__header").children(".soundTitle").children("div")[1];
    var songName = $(titleHeader).children(".sc-media-content").children(".sc-media").children(".sc-media-content").children(".soundTitle__title ").text().trim();
    return songName;
}
function setHideButtonId(hideButton) {
    chrome.runtime.sendMessage({ request: "lastId" }, function(response) {
        $(hideButton).attr("id", response.id);
    });
}

function hideButton(button) {
    var id = $(button).attr('id');
    var songName = getSongNameFromHideButton(button);
    chrome.runtime.sendMessage({ request: "hideButton", id: id, songName: songName }, function (response) {
        console.log("Hiding : " + response.message);
        $(button).closest(soundListItemClass).fadeOut('150', function(){
            skipSong("next");
        });
    });
}
    
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
    if (request.request == "skipSong") {
        var direction = request.skipDirection == "forward" ? "next" : "previous";
        skipSong(direction);
    }
});
function skipSong(direction)
{
    console.log("Skipping song " + direction);
    var button = document.getElementsByClassName("skipControl__" + direction)[0];
    console.log("Clicking " + direction + " button");
    button.click();
}