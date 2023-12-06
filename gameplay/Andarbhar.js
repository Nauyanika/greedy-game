"use strict"
const debug = require("debug")("test");
const DB_debug = require("debug")("db");
const service = require("../services/AndarbharGameService");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const state = require("../Constants").state;
const spot = require("../Constants").AandarBaharSpot;
const CardsSet = require("../Constants").setOfCards;
const timerVar = require("../Constants").timerVar;
const SelectRange = require("../Constants").selectRange;
const winningRate = require("../Constants").andarBaharWinningRate;
const gameId   = 3;
const gameRoom = require("../Constants").selectGame[gameId];


const botManager = require('../utils/BotManager');
const playerManager = require('../utils/PlayerDataManager');

//json
const chipDataJson = require("../jsonfiles/AndarBharChipsData.json");
const RandomWinAmounts = require('../jsonfiles/wins.json')


const LEFT_RIGHT_WIN_RATE = 2;
const MIDDLE_WIN_RATE = 8;

let Joker_Card_No;
let Joker_Card_Type


let Sockets;
let gameState;

let currentRoundData = {}//this will users bets, playerId and spot
let BetHolder = new Object();  //user bet on each spot sum
let LeftBets = [];
let MiddleBets = [];
let RightBets = [];
let spotBetsCounter = [0,0,0,0,0,0,0,0,0,0];
let fakeLeftBets;     //bot fake bet     
let fakeMiddleBets;      
let fakeRightBets;

let timeStamp;         //as room id(change after 30 sec)
let ROUND_COUNT = 0;   //reset to 0 after 5 round


let previousWins = [];
let historyCards = [];
let historyPercent = [];
let pridictionPercent = [];
let BotsBetsDetails = [];   //Array of 6 bots with amount of bet on each spot (array filled by RegisterBots ↓)
RegisterBots();
SetInitialData();



function GetSocket(SOCKET) {
    Sockets = SOCKET;
    ResetTimers(); 
}

async function SetInitialData() {//THIS WILL RUN ONLY ONCE
    previousWins =  await service.lastWinningNo();  //db
    historyCards =  await service.historyCard();  //db
    historyPercent = gethistoryPercent(previousWins);
    pridictionPercent = [50,50];
}



function StartAndarbharGame(data){
	SendCurrentRoundInfo(data);
	OnChipMove(data);
	OnBetsPlaced(data);
	OnleaveRoom(data)
	OnTest(data);
	//OnDissConnected(data);
}

function OnleaveRoom(data){
	let socket = data[commonVar.socket];
	socket.on(events.onleaveRoom,function(data){  
	    try{
		    socket.leave(gameRoom);
		    socket.removeAllListeners(events.OnChipMove);
            socket.removeAllListeners(commonVar.test);
            socket.removeAllListeners(events.onleaveRoom);
            playerManager.RemovePlayer(socket.id);
            socket.emit(events.onleaveRoom,{success:`successfully leave ${gameRoom} game.`});
	    }catch(err){
	        debug(err);
	    }
	})
}

//Game events
function OnBetsPlaced(data) {
    let socket = data[commonVar.socket];
    socket.on(events.OnBetsPlaced, (data) => {
        socket.to(gameRoom).emit(events.OnChipMove, data);
    });
}



async function addPlayerToRoom(data){
	let socket = data[commonVar.socket];
    let balance = await service.getUserBalance(data.playerId);   //db 
    let obj = {
        socketId: socket.id,
        balance,//this value will come from database
        avatarNumber: 0,//this value wil come from frontend
        playerId: data.playerId,//this value will come from database
    }
    playerManager.AddPlayer(obj);
    return obj;
}


function OnDissConnected(data) {
    let socket = data[commonVar.socket];
    socket.on("disconnect", (data) => {
        debug("player got dissconnected " + socket.id);
        playerManager.RemovePlayer(socket.id);
    });
}


async function SendCurrentRoundInfo(data) {
    let socket = data[commonVar.socket];
    let timer = 0;
    
    switch (gameState) {
        case state.canBet: timer = i; break;
        case state.cannotBet: timer = j; break;
        case state.wait: timer = k; break;
    }

    let player = await addPlayerToRoom(data);

    let obj = {
    	// timer,
    	// gameState,
        // socketId : player.socketId,
        previousWins,
        historyCards,
        historyPercent,
        pridictionPercent,
        botsBetsDetails: BotsBetsDetails,
        balance : player.balance,
    }
    
    socket.emit(events.OnCurrentTimer, obj)
}



//Game History & Array Push Function=====================================================================
	function PushWinNo(winspot){
		if(previousWins!=undefined){
			if(previousWins.length === 100){
				previousWins =  [];
				previousWins.push(winspot)
			} else {
                previousWins.push(winspot)
			}
		    return previousWins;
		}    
	}

	function PushHistoryCard(Joker_Card_No,winSpot){
		if(historyCards!=undefined){
			historyCards.shift();
			historyCards.push({joker_card_no :Joker_Card_No,winSpot : winSpot})
			return historyCards
		}
	}

	function gethistoryPercent(lastWins){
		let result = [50,50];
		let totalAandarBahar = lastWins.length;
		if (lastWins.length === 0 ) return result;
		let countAandar = lastWins.filter((v) => (v === 0)).length;
		result[0] =  Math.floor( (countAandar/totalAandarBahar) * 100 )
        result[1] = 100 - result[0];
        return result;
	}

	function getPredictionPercent(){
		let result = [];
		result[0] = generateRandomNo(45,55)
		result[1] = 100 - result[0];
		return result;
	}
//====================================END=================================================


//On Chip Move =>Save all user Bet==================================================

	function OnChipMove(D) {
	    let socket = D[commonVar.socket];
	    socket.on(events.OnChipMove, (data) => {
	    	AddBalanceToDatabase(data);
	    	let spot = data[commonVar.spot]
	    	spotBetsCounter[spot] += data[commonVar.chip]

	        if (BetHolder[socket.id] === undefined) { //this will help add bets
	            let Obj = {
	                0: 0, 1: 0, 2: 0,
	                3: 0, 4: 0, 5: 0,
	                6: 0, 7: 0, 8: 0, 9: 0,
	                win: 0,
	                playerId: data[commonVar.playerId],
	                socket,
	            }
	            BetHolder[socket.id] = Obj;
	            BetHolder[socket.id][data[commonVar.spot]] = data[commonVar.chip];
	        } else {
	            BetHolder[socket.id][data[commonVar.spot]] += data[commonVar.chip];
	        }

	        socket.to(gameRoom).emit(events.OnChipMove, data);

	    });
	}

	async function AddBalanceToDatabase(data) {
	   data[commonVar.gameId] = gameId	
	   const saveBet = await service.JoinGame(data, timeStamp);   //db 
	}

//End On Chip Move =>Save all user Bet ==============================================





//On OnSendWinNo =>Calcuate game Winning No when j==8 ======================================

	async function OnSendWinNo() {
		let result = WinNosCalculator();
		let winningSpot = result.winSpot;
		let displayCard = result.cardsArr;
		let data = { room_id:timeStamp,game_id:gameId,Spot1:winningSpot[0],Spot2:winningSpot[1]}
		const saveWinningNo = await service.updateWinningNo(data); //db

	    //ADD WIN NO TO ARRAY
	    previousWins = PushWinNo(winningSpot[0]);
	    historyCards = PushHistoryCard(Joker_Card_No,winningSpot[0]);
	    historyPercent = gethistoryPercent(previousWins);
	    pridictionPercent = getPredictionPercent();
	    // debug(`L :${fakeLeftBets}, M : ${fakeMiddleBets}, R :${fakeRightBets}`);
    
       CalculateBotsWinAmount(winningSpot);
       await PlayersWinAmountCalculator(winningSpot);
       let RandomWinAmount = RandomWinAmounts[Math.floor(GetRandomNo(0, RandomWinAmounts.length))];
       Sockets.to(gameRoom).emit(events.OnWinNo, { winningSpot,displayCard,previousWins,historyCards,historyPercent,pridictionPercent,botsBetsDetails: BotsBetsDetails,RandomWinAmount});
       SuffleBots();

       //debug(displayCard.length)
       let waitTIme = displayCardWaitTime(displayCard.length);
       return waitTIme
	}

//OnSendWinNo=================================END============================================


//Calculate Display Card Waiting Time===============================================================
    function displayCardWaitTime(cardsLen){
    	let delayTime = 40000
    	let PerCardTime = timerVar.percardDisplayTime;
    	let Extra = 6000;
    	if(cardsLen !== undefined){
            delayTime = cardsLen*PerCardTime + Extra;
    	}
    	return delayTime
    }
//===================================================END============================================




//On WinNosCalculator =>Calcuate game Winning No when j==8 ======================================

		function WinNosCalculator() {
			let totalLeftBets   = SumOfARRAY(LeftBets) * 2;
		    let totalMiddleBets = SumOfARRAY(MiddleBets) * 8;
		    let totalRightBets  = SumOfARRAY(RightBets) * 2;

	        let winSpot = [];
	        let range;
	        let cardsArr = []

		    let totalBet = SumOfARRAY(spotBetsCounter);

		    if (totalBet === 0) {
		    	winSpot[0] = generateRandomNo(spot.Andar,spot.Bahar);
		    	winSpot[1] = generateRandomNo(spot.oneToFive,spot.fortyOneAndMore);
		    } else {
		    	winSpot[0] = generateRandomNo(spot.Andar,spot.Bahar);
		    	winSpot[1] = generateRandomNo(spot.oneToFive,spot.fortyOneAndMore);
		    }

		    let CardRange   = SelectRange[winSpot[1]];  
	        let CardsLength = (winSpot[0] === spot.Andar) ? getRandomEvenNo(CardRange) : getRandomOddNo(CardRange);

	        for (let i = 0; i < CardsLength; i++) { // create Aandar bhar cards
	        	let showCardNo = generateUniqueCard(Joker_Card_No)
	        	let showCardType = generateRandomNo(CardsSet.Zero,CardsSet.Three)

	            if (i === CardsLength-1 ) {
	            	let card = {card:Joker_Card_No,type:showCardType}
	            	cardsArr.push(card);
	            } else {
	            	let card = {card:showCardNo,type:showCardType}
	                cardsArr.push(card);
	            }  
	        }

	        spotBetsCounter = [0,0,0,0,0,0,0,0,0,0]; //rest all spot bet counter
		    return {winSpot,cardsArr};
		}
	   
	    function getRandomEvenNo(range){
	    	let randomNo = generateRandomNo(range[0],range[1]);
	    	while(randomNo % 2 === 0 ){
	            randomNo = generateRandomNo(range[0],range[1]);
	    	}
	    	return randomNo;
	    }

	    function getRandomOddNo(range){
	    	let randomNo = generateRandomNo(range[0],range[1]);
	    	while(randomNo % 2 !== 0 ){
	            randomNo = generateRandomNo(range[0],range[1]);
	    	}
	    	return randomNo;
	    }

	    function generateUniqueCard(JokerCard){
	    	let randomNo = generateRandomNo(1,13);
	    	while(randomNo === JokerCard ){
	            randomNo = generateRandomNo(1,13);
	    	}
	    	return randomNo;
	    }

		function SumOfARRAY(array) {
		    return array.reduce(function (a, b) { return a + b; }, 0);
		}
		function GetRandomNo(min, max) {
		    return Math.random() * (max - min) + min;
		}

// End WinNosCalculator==========================================================================





//OnwinningAmount =>Calcuate winning Amount  =================================================

	function CalculateBotsWinAmount(winningSpot) {
		// winningSpot = [1,2]
		// let BotsBetsDetails =  [ //teting parameter
		//     { 
		// 		name: 'Guest8642', Andar:0,Bahar: 10,oneToFive: 10,sixToTen: 60,elevenToFifteen: 0, sixteenToTwentyFive: 0,
		// 		twentySixToThirty: 10,thirtyOneToThirtyFive: 0,thirtySixToFouty: 60,fortyOneAndMore: 0,balance:100, win:0,avatarNumber: 3
		//     }
        //]
	    for (let i = 0; i < BotsBetsDetails.length; i++) {
	        let win = 0;
	        winningSpot.forEach((winSpot) => {
	        	let selectSpot = ['Andar','Bahar','oneToFive','sixToTen','elevenToFifteen','sixteenToTwentyFive','twentySixToThirty','thirtyOneToThirtyFive','thirtySixToFouty','fortyOneAndMore'];
                let spot = selectSpot[winSpot];
                BotsBetsDetails[i].win += BotsBetsDetails[i][spot] * winningRate[winSpot];
                BotsBetsDetails[i].balance += BotsBetsDetails[i][spot] * winningRate[winSpot];
                win += BotsBetsDetails[i][spot] * winningRate[winSpot];
	        })

	        if (win === 0) {
	            BotsBetsDetails[i].win = -(BotsBetsDetails[i].Andar + BotsBetsDetails[i].Bahar + BotsBetsDetails[i].oneToFive + BotsBetsDetails[i].sixToTen + BotsBetsDetails[i].elevenToFifteen + BotsBetsDetails[i].sixteenToTwentyFive + BotsBetsDetails[i].twentySixToThirty + BotsBetsDetails[i].thirtyOneToThirtyFive + BotsBetsDetails[i].thirtySixToFouty + BotsBetsDetails[i].fortyOneAndMore);
	        }
	    }
	}



	async function PlayersWinAmountCalculator(winningSpot) {
		// winningSpot = [0,2]  //testing
		// let BetHolder =   {
		// 	_vw87cwPlzB27Uj9AAAB: {
		// 	    '0': 10,'1': 0,'2': 0,'3': 0, '4': 30, '5': 0,'6': 0, '7': 0,'8': 0, '9': 0, win: 0, playerId: '1',
		// 	}
        //}
	    for (let socketId in BetHolder) {

	        let betData = BetHolder[socketId];

	        winningSpot.forEach((spot) => {
	        	let betAmount = betData[spot];
	        	let rate  =  winningRate[spot];
	        	let winningAmt = betAmount * (rate - (commonVar.adminCommisionRate));
	        	winningAmt = parseFloat((winningAmt).toFixed(2));
                betData[commonVar.win] += winningAmt;
	        })

	        if (betData[commonVar.win] > 0) {
	            let winAmount = betData[commonVar.win]
	            betData[commonVar.socket].emit(events.OnPlayerWin,{winAmount});
	        }
	    }
	    //$- Update user winning amount to Database
	    const playerWiningBalance = await service.updateWinningAmount({ winningspot: winningSpot, room_id: timeStamp,game_id:gameId });
	    BetHolder = new Object();
	}
//End OnwinningAmount =========================END============================================








//Create a bot, place and save bot bets=================================================================
    const MAX_CHIPS_DATA = chipDataJson.length;
	const MAX_BOTS_ON_SCREEN = 6;
	const MAX_ITERATION = 8;
	const Min_Wait_Time = 1;
	const Max_Wait_Time = 2.5;
	const BOT_CHIP_LIMIT = 500;
	const MAX_TIME_BOTS_CAN_PLACE_BETS_IN_SINGLE_ROUND = 2;


	function RegisterBots() { // register new bots only 
	    return (new Promise(function (myResolve, myReject) {
	        BotsBetsDetails = [];
	        for (let i = 0; i < botManager.GetBots(gameId).length; i++) {
	            let botBetTemplate = {
	                name: "",
	                Andar:0,
			        Bahar:0,
			        oneToFive:0,
			        sixToTen:0,
			        elevenToFifteen:0,
			        sixteenToTwentyFive:0,
			        twentySixToThirty:0,
			        thirtyOneToThirtyFive:0,
			        thirtySixToFouty:0,
			        fortyOneAndMore:0,
	                balance: 0,//this will assign just before the loops starts
	                win: 0,
	                avatarNumber: 0
	            }
	            let botObj = botManager.GetBots(gameId)[i];
	            botBetTemplate.balance = botObj.balance;
	            botBetTemplate.name = botObj.name;
	            botBetTemplate.avatarNumber = botObj.avatarNumber;
	            BotsBetsDetails.push(botBetTemplate);
	        }
	    }))
	}


	/**
	* Here  we add dulicate bets by bots
	* update bots balance and save bot bet on each spot 
	* in BotsBetsDetails Array
	*/
	async function SendBotData() {
	    let _andarBets = 0;
        let _baharBets= 0;
        let _oneToFiveBets= 0;
        let _sixToTenBets= 0;
        let _elevenToFifteenBets= 0;
        let _sixteenToTwentyFiveBets= 0;
        let _twentySixToThirtyBets= 0;
        let _thirtyOneToThirtyFiveBets= 0;
        let _thirtySixToFoutyBets= 0;
        let _fortyOneAndMoreBets = 0;
	    let _botsBetCountBets = 0;
	    let _botsBetCount = 0;

	    while (!isTimeUp) {
	        //this array contain random no from 0 to MAX_BOTS_DATA
	        //this random number will used in frontent for bots
	        let fakeOnlinePlayersBets = []
	        //SET BETS FOR ONLINE PLAYERS
	        //IT WILL SHOW IN FRONTENT THAT ONLINE PLAYERS IS BETTING
	        for (let i = 0; i < MAX_ITERATION; i++) {
	            if (isTimeUp) break;
	            let randomNO = Math.floor(GetRandomNo(0, MAX_CHIPS_DATA));
	            fakeOnlinePlayersBets.push(randomNO);

	            let spot = chipDataJson[randomNO].spot;
	            let chip = chipDataJson[randomNO].chip;
	            switch (spot) {
	                case 0:  _andarBets += chip;
	                    break;
	                case 1: _baharBets += chip;
	                    break;
	                case 2: _oneToFiveBets += chip;
	                    break;
	                case 3: _sixToTenBets += chip;
	                    break;
	                case 4: _elevenToFifteenBets += chip;
	                    break;
	                case 5: _sixteenToTwentyFiveBets += chip;
	                    break;
	                case 6: _twentySixToThirtyBets += chip;
	                    break;
	                case 7: _thirtyOneToThirtyFiveBets += chip;
	                    break;
	                case 8: _thirtySixToFoutyBets += chip;
	                    break;
	                case 9: _fortyOneAndMoreBets += chip;
	                    break;                            
	                default:
	                    break;
	            }
	        }


	        let botsBetHolder = [];

	        let temp = {};
	        let bots = Math.floor(GetRandomNo(0, MAX_BOTS_ON_SCREEN));
	        _botsBetCount++;
	        //SET BETS FOR BOTS
	        if (_botsBetCount > MAX_TIME_BOTS_CAN_PLACE_BETS_IN_SINGLE_ROUND) {

	            for (let i = 0; i < bots; i++) {
	                if (isTimeUp) break;

	                let botIndex = Math.floor(GetRandomNo(0, MAX_BOTS_ON_SCREEN));

	                let dataIndex = Math.floor(GetRandomNo(0, MAX_CHIPS_DATA));
	                while (chipDataJson[dataIndex].chip > BOT_CHIP_LIMIT) {
	                    dataIndex = Math.floor(GetRandomNo(0, MAX_CHIPS_DATA));
	                }
	                let botData = {
	                    botIndex,//this is just to identify bot on frontend
	                    dataIndex//this will identify the index of chipdata index
	                }

	                botsBetHolder.push(botData);
	                let spot = chipDataJson[dataIndex].spot;
	                let chip = chipDataJson[dataIndex].chip;
	                //this will only get from the fist six bots
	                temp[i] = chipDataJson[dataIndex]
	                BotsBetsDetails[botIndex].balance -= chip;
	                switch (spot) {
	                    case 0:  _andarBets += chip;
	                        BotsBetsDetails[botIndex].Andar += chip
		                    break;
		                case 1: _baharBets += chip;
		                    BotsBetsDetails[botIndex].Bahar += chip
		                    break;
		                case 2: _oneToFiveBets += chip;
		                    BotsBetsDetails[botIndex].oneToFive += chip
		                    break;
		                case 3: _sixToTenBets += chip;
		                    BotsBetsDetails[botIndex].sixToTen += chip
		                    break;
		                case 4: _elevenToFifteenBets += chip;
		                    BotsBetsDetails[botIndex].elevenToFifteen += chip
		                    break;
		                case 5: _sixteenToTwentyFiveBets += chip;
		                    BotsBetsDetails[botIndex].sixteenToTwentyFive += chip
		                    break;
		                case 6: _twentySixToThirtyBets += chip;
		                    BotsBetsDetails[botIndex].twentySixToThirty += chip
		                    break;
		                case 7: _thirtyOneToThirtyFiveBets += chip;
		                    BotsBetsDetails[botIndex].thirtyOneToThirtyFive += chip
		                    break;
		                case 8: _thirtySixToFoutyBets += chip;
		                    BotsBetsDetails[botIndex].thirtySixToFouty += chip
		                    break;
		                case 9: _fortyOneAndMoreBets += chip;
		                    BotsBetsDetails[botIndex].fortyOneAndMore += chip
		                    break;                            
		                default:
		                    break;    
	                }
	            }
	        }

	        Sockets.to(gameRoom).emit(events.OnBotsData, {onlinePlayersBets: fakeOnlinePlayersBets, botsBets: botsBetHolder })
	        let waitFor = GetRandomNo(Min_Wait_Time, Max_Wait_Time) * 800;
	        await sleep(waitFor)
	    }
	    //debug(BotsBetsDetails);
	    // fakeLeftBets = _leftBets;
	    // fakeMiddleBets = _middleBets;
	    // fakeRightBets = _rightBets;

	}


	function ResetBotsBets() {
	    for (let i = 0; i < BotsBetsDetails.length; i++) {
	        BotsBetsDetails[i].Andar = 0;
	        BotsBetsDetails[i].Bahar = 0;
	        BotsBetsDetails[i].oneToFive = 0;
	        BotsBetsDetails[i].sixToTen = 0;
	        BotsBetsDetails[i].elevenToFifteen = 0;
	        BotsBetsDetails[i].sixteenToTwentyFive = 0;
	        BotsBetsDetails[i].twentySixToThirty = 0;
	        BotsBetsDetails[i].thirtyOneToThirtyFive = 0;
	        BotsBetsDetails[i].thirtySixToFouty = 0;
	        BotsBetsDetails[i].fortyOneAndMore = 0;
	        BotsBetsDetails[i].win = 0;
	    }
	}

	async function SuffleBots() {
	    if (ROUND_COUNT % 5 === 0) {
	        botManager.SuffleBots(gameId);
	        await sleep(5);
	        //register bots again
	        RegisterBots();
	    }
	}

//Create a bot and player bot===================END=====================================================







//game timers------------------------------------------

	//helper functions
	let i = timerVar.bettingTimer;
	let j = timerVar.ABHCalculationTimer;
	let k = timerVar.waitTimer;
	let isTimeUp = false;
	let canPlaceBets = true;



	function ResetTimers() {
		let D=new Date();
        timeStamp=D.getTime();
        Joker_Card_No = generateRandomNo(4,10);
        Joker_Card_Type = generateRandomNo(CardsSet.Zero,CardsSet.Three);
        service.saveJokerCard({joker_card_no:Joker_Card_No,room_id:timeStamp,game_id:gameId}); //db

        ROUND_COUNT = (ROUND_COUNT === 5) ? 0 : ++ROUND_COUNT;  //used in bot

		i = timerVar.bettingTimer;
	    j = timerVar.betCalculationTimer;
	    k = timerVar.waitTimer;

	    LeftBets = [];
        MiddleBets = [];
        RightBets = [];

        ResetBotsBets();
        
	    Sockets.to(gameRoom).emit(events.OnTimerStart,{Joker_Card_No,Joker_Card_Type});
	    debug("betting...");
	    isTimeUp = false;
	    OnTimerStart();
	    SendBotData();
	}



	async function OnTimerStart() {
	    gameState = state.canBet;
	    canPlaceBets = true;
	    i--;

	    //this will help to stop bots betting just before the round end
	    if (i === 2) isTimeUp = true;
	    if (i == 0) {
	        await sleep(timerVar.intervalDalay);
	        debug("timeUp...");
	        Sockets.to(gameRoom).emit(events.OnTimeUp);
	        isTimeUp = true;
	        OnTimeUp();
	        return;
	    };
	    await sleep(timerVar.delay);
	    OnTimerStart();
	}

	async function OnTimeUp() {
	    canPlaceBets = false;
	    gameState = state.cannotBet;

	    await sleep(timerVar.intervalDalay);

	    let showTime  = await OnSendWinNo(); //get card display time

	    //debug('show time' , showTime)

	    await sleep(showTime);
	    debug("wait...");

	    Sockets.to(gameRoom).emit(events.OnWait);
	    OnWait();

	    return;
	}


	async function OnWait() {
	    gameState = state.wait;
	    canPlaceBets = false;
	    k--;

	    if (k == 0) {
	        //round ended restart the timers
	        await sleep(timerVar.intervalDalay);
	        ResetTimers();
	        return;
	    };
	    await sleep(timerVar.delay);
	    OnWait();
	}

//game timers-----------------END-------------------------







function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function generateRandomNo(min, max) { //min & max include
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}


//this even is only for debugging purposes
function OnTest(data) {
    let socket = data[commonVar.socket];
    socket.on(commonVar.test, (data) => {
    	socket.emit(commonVar.test , {'timer':timerVar.percardDisplayTime, MAX_ITERATION});
    	//service.updateWinningAmount({ spot:2, room_id:'1628516811811' });
    	//SendBotData()
    	//OnSendWinNo()
    	//CalculateBotsWinAmount([0,4]) 
    	//PlayersWinAmountCalculator([0,4])
        //console.table(BetHolder);
        // console.table(currentRoundData);
    })
}

module.exports.StartAndarbharGame = StartAndarbharGame;
module.exports.GetSocket = GetSocket;