chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.msg == "redirect"){
        chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
            chrome.tabs.update(tab.id, {url: request.redirect}, function(tb){
                console.log("lOL...");
            });
            
        });
    }
})

