
//chrome.storage.sync.remove("huntConfig");
//chrome.storage.sync.remove("list_profiles");

var run = false, huntConfig = false,
    btnStart   = document.querySelector("#start"),
    btnStoped  = document.querySelector("#stoped"),
    inpSlug    = document.querySelector("#slug"),
    inpMachine = document.querySelector("#machine");

chrome.storage.sync.get("huntConfig", res => {
    if(res.huntConfig){
        huntConfig = res.huntConfig;
        run = huntConfig.run;
    } execute();
})

function execute() {

    if(huntConfig){
        inpSlug.value = huntConfig.slug;
        inpMachine.value = huntConfig.machine;
    }
    
    if(run) {
        // começa a rodar e insere o botão de parar
        btnStart.style.display = "none";
    } else {
        btnStoped.style.display = "none";
    }

    btnStart.addEventListener("click", e => {
        // se clicou em start e status == false
        if(!run){
            run = true;
            btnStoped.style.display = "block";
            btnStart.style.display  = "none";
            saveConfig(() => {
                chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                    var activeTab = tabs[0];
                    chrome.tabs.sendMessage(activeTab.id, {"message": "start"});
                });
            });
        }
        
    })

    btnStoped.addEventListener("click", e => {
        // se clicou em stoped e status == true
        if(run){
            run = false;
            btnStoped.style.display = "none";
            btnStart.style.display  = "block";
            saveConfig(() => {
                chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                    var activeTab = tabs[0];
                    chrome.tabs.sendMessage(activeTab.id, {"message": "pause"});
                });
            });
            
        }
        
    });
}

function saveConfig(callback){
    chrome.storage.sync.set({huntConfig:{slug:inpSlug.value, machine:inpMachine.value, run:run}}, function() {
        callback();
    });
}
