// require the discord.js module
const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
const express = require('express');
var sortJsonArray = require('sort-json-array');
const fileHistoriqueVente = './Data/HistoriqueVente.json';
var fileHisto = require(fileHistoriqueVente);
const fileStockRessources = './Data/stockRessources.json';
var fileStock = require(fileStockRessources);
var bodyParser = require('body-parser');
var fs = require('fs');
const app = express();
app.use(express.json())
app.use(bodyParser.urlencoded({
  extended: true
}));
var cron = require('node-cron');
var zoneFarming = ""
minPriceToCommand = 3000
minQuantityToCommand = 50
levelMule = -1
isFarming = false
command = ""

//Ajoute l'archive des ressources vendues tous les jours
cron.schedule("59 23 * * *", () => {
  showTotalVentes(false, "archive-total-ventes")
  fileHisto = {}
  updatefile(fileHistoriqueVente,fileHisto)
});

//Update la quantité minimale des ressources
cron.schedule('*/10 * * * *', () =>  {
  updatePriceUnity()
  updateMinQuantityStockRessource()
  checkMinQuantity()
});


cron.schedule('*/10 * * * *', () => {
  if(zoneFarming == "" && isFarming) {
    message = "Les bots n'ont pas farmés depuis plus de 10 minutes !"
    const channel = client.channels.cache.find(channel => channel.name === "zone")
    clear(channel)
    channel.send(message)
    isFarming = false
  } else {
    zoneFarming = ""
  }
})

client.once('ready', () => {
  console.log('Ready!')
});
app.listen(8080, () => {
  console.log('Serveur à lécoute')
})

app.post("/venteRessource", (req, res, next) => {
  try{
    res.send(true);
    req.body = JSON.parse(Object.keys(req.body))
    var message = "Banque : + " + numberWithSpaces(req.body.kamas) + " Kamas (vente : " + req.body.quantity + " [" + req.body.item + "])";
    const channel = client.channels.cache.find(channel => channel.name === "ventes")
    channel.send(message)
    req.body.kamas = parseInt(req.body.kamas)
    req.body.quantity = parseInt(req.body.quantity)

    if (fileHisto[req.body.item] == null) {
      fileHisto[req.body.item] = {kamas : req.body.kamas, quantity : req.body.quantity }
    } else {
      fileHisto[req.body.item].kamas = fileHisto[req.body.item].kamas + req.body.kamas ;
      fileHisto[req.body.item].quantity = fileHisto[req.body.item].quantity + req.body.quantity
    }

    updatefile(fileHistoriqueVente, fileHisto)
    showTotalVentes(true, "total-ventes")
  } catch (err) {
    console.log(err);
  }
})

app.post("/stockRessources", (req, res, next) => {
  try{
    res.send(true);
    req.body = JSON.parse(Object.keys(req.body))
    emptyJsonStockRessource()
    for (var [key, val] of iterate_object(req.body)) {
        if (fileStock[key] == null) {
          fileStock[key] = {quantity : val, minQuantity : 0 };
        } else {
          fileStock[key].quantity = val;
        }
    }
    updatefile(fileStockRessources,fileStock);
  } catch (err) {
    console.log(err);
  }
})

app.post("/receivedMp", (req, res, next) => {
  try{
      res.send(true);
      req.body = JSON.parse(Object.keys(req.body))
      var message = "(" + req.body.receiver + ") " + req.body.author + " : " + req.body.content;
      const channel = client.channels.cache.find(channel => channel.name === "mp")
      channel.send(message)
  } catch (err) {
    console.log(err);
  }
});

app.post("/zone", (req, res, next) => {
  try{
      res.send(true);
      req.body = JSON.parse(Object.keys(req.body))
      var message = "Les bots sont actuellement dans la zone : " + req.body.zone;
      if(zoneFarming !=req.body.zone ) {
        zoneFarming = req.body.zone
        const channel = client.channels.cache.find(channel => channel.name === "zone")
        clear(channel)
        channel.send(message)
        isFarming = true
      }
  } catch (err) {
    console.log(err);
  }
});

app.post("/alerte", (req, res, next) => {
  try{
      res.send(true);
      req.body = JSON.parse(Object.keys(req.body))
      var message = "ALERTE UN MODO NOUS REGARDE @everyone"
      const channel = client.channels.cache.find(channel => channel.name === "alerte")
      channel.send(message)
  } catch (err) {
    console.log(err);
  }
});

app.post("/levelingTeam", (req, res, next) => {
  try{
      res.send(true);
      req.body = JSON.parse(Object.keys(req.body))
      if (levelMule < req.body.level) {
        levelMule = req.body.level
        date = new Date()
        time = date.toLocaleString()
        var message = "Les mules ont level up " + req.body.level + " le " + time;
        if (levelMule >= 200) {
          message += ". Ready pour farmer @everyone "
        }
        const channel = client.channels.cache.find(channel => channel.name === "la-releve")
        channel.send(message)
      }
  } catch (err) {
    console.log(err);
  }
});

app.post("/levelingMetier", (req, res, next) => {
  try{
      res.send(true);
      req.body = JSON.parse(Object.keys(req.body))
      date = new Date()
      time = date.toLocaleString()
      var message = "Le bot " + req.body.metier + " a lv up " + req.body.level + " à " + time+".";
      const channel = client.channels.cache.find(channel => channel.name === req.body.metier)
      channel.send(message)
  } catch (err) {
    console.log(err);
  }
});

client.on('messageCreate', message => {
	if (message.content === '!OSM') {
		message.channel.send('OSM FIN.');
	} else if (message.content === '!Crumble') {
    message.channel.send('Crumble a toujours raison.');
  } else if (message.content === '!Esterad') {
    message.channel.send('Je ne connais pas cette commande. Voulez vous dire !Ezterad ?');
  } else if (message.content === '!Ezterad') {
    message.channel.send("Ezterad est fort au jeu vidéal, il est moins ez qu'il en a l'air.");
  } else if (message.content === '!Ushuala') {
    message.channel.send("C'est le meilleur Feca de Jahash, j'le connais bien.");
  } else if (message.content === '!Yly') {
    message.channel.send("Un mec cool, mais faudra lui dire que sur TFT en Double Up il ne faut pas deny son mate, c'est pas gentil.");
  }  else if (message.content === '!Swoune') {
    message.channel.send("C'est qui ? Il nous fait une Suma, il fini le jeu, on l'voit pu....");
  }  else if (message.content === '!Overn') {
    message.channel.send("Overn ? Il avait pas call les 20k succès pour avril ?");
  } else if (message.content === '!Nawfel') {
    message.channel.send("Même si il a une sous classe et un mac, j'l'aime bien.");
  }

});

client.login("OTU2OTI2MTk5MDI2ODQzNjg4.Yj3U-A.iIEy4__Tb8VgtPyc-IcoaKDWlm8");

function* iterate_object(o) {
    var keys = Object.keys(o);
    for (var i=0; i<keys.length; i++) {
        yield [keys[i], o[keys[i]]];
    }
}

function showTotalVentes(clearIt, channelName){
  message = {}
  message[0] = ""
  message[1] = ""
  totalKamas = 0
  for (var [key, val] of iterate_object(fileHisto)) {
    if (message[0].length < 1900) {
      message[0] += key + ' : ' + numberWithSpaces(val.kamas) + ' Kamas (x ' + val.quantity + ')\n'
    } else {
      message[1] += key + ' : ' + numberWithSpaces(val.kamas) + ' Kamas (x ' + val.quantity + ')\n'
    }
      totalKamas = totalKamas + val.kamas
  }
  message[1] += "Total : " + numberWithSpaces(totalKamas);
  const channel = client.channels.cache.find(channel => channel.name === channelName)
  if(clearIt) {
    clear(channel)
  }
  channel.send(message[0])
  channel.send(message[1])
}

function updatefile(pathFile, file){
  fs.writeFile(pathFile, JSON.stringify(file, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
  });
}

function clear(channel) {
   channel.bulkDelete(100);
}

function emptyJsonStockRessource(){
  for (var [key, val] of iterate_object(fileStock)) {
      fileStock[key].quantity = 0
  }
    updatefile(fileStockRessources,fileStock);
}

function checkMinQuantity(){
  message = ''
    for (var [key, val] of iterate_object(fileStock)) {
      if (fileStock[key].quantity < fileStock[key].minQuantity && fileStock[key].price != null && fileStock[key].price >= minPriceToCommand && fileStock[key].minQuantity >= minQuantityToCommand) {
        message += key + ' (banque : ' + fileStock[key].quantity + ', minimum : ' + fileStock[key].minQuantity + ', prix : ' + Math.round(fileStock[key].price) + ' kamas)\n'
      }
    }
    if (message == '') {
      message = "La banque est pleine, on n'a besoin de rien (envie de toi) !"
    } else {
      message = "J'ai besoin de : \n" + message
    }
    if( message != command ){
      command = message
      const channel = client.channels.cache.find(channel => channel.name === "commande")
      clear(channel)
      channel.send(message)
    }
}

//Update du prix de la ressource
function updatePriceUnity(){
  for (var [key, val] of iterate_object(fileHisto)) {
    if (fileHisto[key].kamas != null ){
      fileStock[key].price = (fileHisto[key].kamas/fileHisto[key].quantity)
    }
  }
  updatefile(fileStockRessources,fileStock);
}

//La quantité mini est égal à 2x ce que je vend dans la journée
function updateMinQuantityStockRessource(){
  for (var [key, val] of iterate_object(fileHisto)) {
      if (fileStock[key].quantity == null) {
        fileStock[key] = {quantity : 0, minQuantity : fileHisto[key].quantity };
      } else {
          if (fileStock[key].minQuantity < fileHisto[key].quantity) {
            fileStock[key].minQuantity = (fileHisto[key].quantity*2)
          }
      }
  }
  updatefile(fileStockRessources,fileStock);
}

function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
