// pegue a lista dos usuários que serão enviadas as mensagens
var huntConfig;
var codes = {" ":"32","!":"33","\"":"34","#":"35","$":"36","%":"37","&":"38","'":"39","(":"40",")":"41","*":"42","+":"43",",":"44","-":"45","|":"124","\/":"47","0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56","9":"57",":":"58",";":"59","<":"60","=":"61",">":"62","?":"63","@":"64","A":"65","B":"66","C":"67","D":"68","E":"69","F":"70","G":"71","H":"72","I":"73","J":"74","K":"75","L":"76","M":"77","N":"78","O":"79","P":"80","Q":"81","R":"82","S":"83","T":"84","U":"85","V":"86","W":"87","X":"88","Y":"89","Z":"90","[":"91","\\":"92","]":"93","^":"94","_":"95","`":"96","a":"97","b":"98","c":"99","d":"100","e":"101","f":"102","g":"103","h":"104","i":"105","j":"106","k":"107","l":"108","m":"109","n":"110","o":"111","p":"112","q":"113","r":"114","s":"115","t":"116","u":"117","v":"118","w":"119","x":"120","y":"121","z":"122","{":"123","}":"125","~":"126","DEL":"127","ô":"147","ö":"148","ò":"242","û":"150","ù":"151","À":"192","Ã":"195","ð":"208","Ñ":"209","Ò":"210","Ó":"211","È":"212","Ú":"218","à":"224","á":"225","â":"226","ã":"227","õ":"228","Õ":"229","ç":"231","è":"232","é":"233","ê":"234","Ù":"235","ì":"236","í":"237","ñ":"241","ó":"243", "ú":"250"};

const run = (status = true) => {
    chrome.storage.sync.get("huntConfig", res => {
        if(res.huntConfig){
            huntConfig = res.huntConfig;
            if(status && huntConfig.run){
                console.log("startou");
                generateList(window.location.href);
            } else if(!status && !huntConfig.run) {
                // salva a lista e pausa a execução
                // deleta todos os perfis salvos na API
                // envia informação para o popup
                console.log("pediu pause");
                
            } else {
                // silence...
                console.log("aguardando o start...")
            }
        } else {
            // silence...
            console.log("aguardando o configurações e o start...")
        } 
    });
}

run();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "start" ) {
            run();
        } else if (request.message === "pause") {
            run(false);
        }
    }
);

function generateList(link){
    // gera uma lista
    chrome.storage.sync.get("list_profiles", res => {
        if(res.list_profiles){
            getProfileOrDIe(res.list_profiles, link)
        } else {
            createListAndExecute(link);
        }
    })
    
}

function createListAndExecute(link){
    var xmlhttp = new XMLHttpRequest();
    var url = "http://localhost/api_hunt/"+huntConfig.machine+"/test/get_list/"+huntConfig.slug+"/300";
    
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var newList = JSON.parse(this.responseText);
            
            newList.length > 0 ?
                chrome.storage.sync.set({list_profiles:newList}, () =>{
                    getProfileOrDIe(newList, link);
                })
           : sendMessagePopup("Não há novos usuários para enviar mensagem");
            
        }
    };
    
    xmlhttp.open("GET", url, true);
    xmlhttp.send()
}

function getProfileOrDIe(list, link){

    // analisa a lista e pegue o primeiro perfil que o send for false
    // se não houver perfil, salve todos na API e delete tudo no storage
    // envie uma mensagem para o popup que a execução foi finalizada

    // se existir um perfil com a url atual analisa o perfil
    // se esse perfil já foi analizado vá para o próximo que ainda não foi analisado
    // ou então envia uma mensagem e altera o status send para true
    // salve tudo no localstorage
    
    var regex = /((https?:\/\/)?(www\.)?facebook.com\/)(profile\.php\?id=([0-9]+)|([a-z0-9\.]+))/gi;
    var match = regex.exec(link);
    var id_fb = match[6] != null ? match[6] : match[5]; // id_fb da pagina
    var profl = isset(id_fb, list);

    if(profl){
        sendMessageProfile(profl.el, status => {
            if(status){
                // list[profl.key].send = true; // DESCOMENTAR ISSO
                chrome.storage.sync.set({list_profiles:list}, () => {
                    goToNextProfile(list);
                });
            }
        });
    } else {
        goToNextProfile(list);
    }

}

function isset(id_fb, list){
    for (let i = 0; i < list.length; i++) {
        var el = list[i];
        if(el.id_fb == id_fb && !el.send){
            return {el:el, key:i};
        }
    }
    return false;
}

function sendMessageProfile(profl, callback) {
    setTimeout(() => {
        let btnMess = document.querySelector("#u_0_1e");
        click(btnMess);
        sender(profl.message, callback);
    }, 3000);
}

function sender(message, callback){
    setTimeout(() => {
        
        var div = document.querySelector("._1d4_");
        click(div);

        for(let i = 0; i < message.length; i++){
            setTimeout(() => {
                press(parseInt(codes[message[i]]));
                console.log("pressionou "+message[i]);
            }, 1000);
        }
    
    }, 2000);
    

}

function press (keyCode) {
	var keyboardEvent = new KeyboardEvent('keydown', {'keyCode': keyCode, 'which': keyCode});
    document.querySelector("._1d4_").dispatchEvent(keyboardEvent);
}

function goToNextProfile(list){
    var sendAPI = true;
    for (let i = 0; i < list.length; i++) {
        var el = list[i];
        if(!el.send){
            // chama o background para redirecionar para a página
            sendAPI = false;
            chrome.runtime.sendMessage({msg:"redirect", redirect:getLink(el.id_fb)}, function(response) {
                console.log(`message from background: ${JSON.stringify(response)}`);
            });
            break;
        }
    }
    if(sendAPI){
        console.log("salvando dados na API");
        console.log("Deletando tudo no storage depois de salvar");
        sendMessagePopup("OI POPUP , estou Salvando dados na API");
    }
    
}

function getLink(id_fb) {
    let baseUrl = "https://www.facebook.com/"
    return /^\d[0-9]+/i.test(id_fb) ? baseUrl+"profile.php?id="+id_fb : baseUrl+id_fb;
}

function sendMessagePopup(message){
    console.log(message);
}

const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
function click(element){
  mouseClickEvents.forEach(mouseEventType =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
      })
    )
  );
}