"use strict"
const debug = require("debug")("test");
const DB_debug = require("debug")("db");
const service = require("../services/DragonGameService");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const state = require("../Constants").state;
const spot = require("../Constants").spot;
const timerVar = require("../Constants").timerVar;
const gameId   = 2;
const gameRoom = require("../Constants").selectGame[gameId];
const CardsSet = require("../Constants").setOfCards;


const botManager = require('../utils/BotManager');
const playerManager = require('../utils/PlayerDataManager');

//json
const chipDataJson = require("../jsonfiles/ChipsData.json");
const RandomWinAmounts = require('../jsonfiles/wins.json')


const LEFT_RIGHT_WIN_RATE = 2;
const MIDDLE_WIN_RATE = 8;



let Sockets;
let gameState;

let currentRoundData = {}//this will users bets, playerId and spot
let BetHolder = new Object();  //user bet on each spot sum
let LeftBets = [];
let MiddleBets = [];
let RightBets = [];
let fakeLeftBets;     //bot fake bet     
let fakeMiddleBets;      
let fakeRightBets;

let timeStamp;         //as room id(change after 30 sec)
let ROUND_COUNT = 0;   //reset to 0 after 5 round


let previousWins = new Array(20);
let BotsBetsDetails = [];   //Array of 6 bots with amount of bet on each spot (array filled by RegisterBots ↓)
RegisterBots();
SetInitialData();



function GetSocket(SOCKET) {
    Sockets = SOCKET;
    ResetTimers(); 
}

async function SetInitialData() {//THIS WILL RUN ONLY ONCE
    previousWins =  await service.lastWinningNo();  //db
    let D=new Date();
    timeStamp=D.getTime();
}



function StartDragonVsTigerGame(data){
	SendCurrentRoundInfo(data);
	OnChipMove(data);
	OnBetsPlaced(data);
	//OnDissConnected(data);
	gameHistoryRecord(data)
	OnleaveRoom(data)
	OnTest(data);
}

function OnleaveRoom(data){
	let socket = data[commonVar.socket];
	socket.on(events.onleaveRoom,function(data){  
	    try{
		    socket.leave(gameRoom);
		    socket.removeAllListeners(events.OnChipMove);
            socket.removeAllListeners(commonVar.test);
            socket.removeAllListeners(events.onleaveRoom);
            socket.removeAllListeners(events.OnHistoryRecord);
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
        botsBetsDetails: BotsBetsDetails,
        balance : player.balance,
    }
    
    socket.emit(events.OnCurrentTimer, obj)
}



//Game History Record=====================================================================
	function gameHistoryRecord(data){
		let socket = data[commonVar.socket];
		socket.on(events.OnHistoryRecord, async function(data){
			let matrixRecord = await service.gameMartixRecords();
			let slotRecord = await service.gameSlotRecords();
			socket.emit(events.OnHistoryRecord,{matrixRecord,slotRecord});
		})
	}
//====================================END=================================================




//On Chip Move =>Save all user Bet==================================================

	function OnChipMove(D) {

	    let socket = D[commonVar.socket];
	    socket.on(events.OnChipMove, (data) => {
	        AddBalanceToDatabase(data);
	        switch (data[commonVar.spot]) {
	            case spot.left:
	                LeftBets.push(data[commonVar.chip]);
	                break;
	            case spot.middle:
	                MiddleBets.push(data[commonVar.chip]);
	                break;
	            case spot.right:
	                RightBets.push(data[commonVar.chip]);
	                break;
	            default:
	                break;
	        }

	        let obj = {
	            chip: data[commonVar.chip],
	            position: data[commonVar.position]
	        }
	        if (currentRoundData[data[socket.id]] === undefined) {
	            currentRoundData[data[socket.id]] = {
	                //following are the spots
	                0: [],//left bets
	                1: [],//middle bets
	                2: [],//right bets
	                playerId: data[commonVar.playerId]
	            }
	            currentRoundData[data[socket.id]][data[commonVar.spot]].push(obj);
	        } else {
	            currentRoundData[data[socket.id]][data[commonVar.spot]].push(obj);
	        }



	        //this will help add bets
	        if (BetHolder[socket.id] === undefined) {
	            let Obj = {
	                0: 0,//left bet
	                1: 0,//middle bet
	                2: 0,//right bet
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
		let winNo = result.winNo;
		let winningSpot = result.spot;
		let data = { room_id: timeStamp, game_id:2,winNo1:winNo[0],winNo2:winNo[1],spot:winningSpot }
		let WinningCards = createWinningCards(winNo);

		const saveWinningNo = await service.updateWinningNo(data); //db

	    // //ADD WIN NO TO ARRAY
	    previousWins = PushWinNo(winningSpot);
	    //debug(`L :${fakeLeftBets}, M : ${fakeMiddleBets}, R :${fakeRightBets}`);

	    CalculateBotsWinAmount(winningSpot);
	    await PlayersWinAmountCalculator(winningSpot);
	    let RandomWinAmount = RandomWinAmounts[Math.floor(GetRandomNo(0, RandomWinAmounts.length))];
	    //debug("random win no:" + RandomWinAmount);

	    Sockets.to(gameRoom).emit(events.OnWinNo, {WinningCards,winNo,winningSpot,previousWins, botsBetsDetails: BotsBetsDetails,RandomWinAmount });
	    SuffleBots();
	}

	function createWinningCards(cards) {
		let andarCardType = generateRandomNo(CardsSet.Zero,CardsSet.Three);
		let baharCardType = generateRandomNo(CardsSet.Zero,CardsSet.Three);
		let winCardArr = [{card:cards[0],type:andarCardType}, {card:cards[1],type:baharCardType}];
		return winCardArr;
	}

	function WinNosCalculator() {
		let totalLeftBets   = SumOfARRAY(LeftBets) * 2;
	    let totalMiddleBets = SumOfARRAY(MiddleBets) * 8;
	    let totalRightBets  = SumOfARRAY(RightBets) * 2;

	    let winNo;
        let leastBetSpot;

	    let bets = [totalLeftBets, totalMiddleBets, totalRightBets];

	    if (totalLeftBets === totalMiddleBets && totalMiddleBets === totalRightBets) {
	        leastBetSpot = Math.floor(Math.random() * 3);//caculate random no form 0 to 2
	        winNo =generateSpotWinningNo(leastBetSpot)
	    } else {
	    	let leastBet = Math.min.apply(Math,bets);      //minimum amount bet
		    leastBetSpot = bets.indexOf(leastBet)          //minimum  bet amount spot
	        winNo =generateSpotWinningNo(leastBetSpot)
	    }
	    return {winNo:winNo,spot:leastBetSpot};
	}



	function generateSpotWinningNo(leastBetSpot){
	    let win1;
	    let win2;
	     switch (leastBetSpot) {
	        case spot.left:
	            win1 = Math.floor( GetRandomNo(2,14) )       
	            win2 = Math.floor(GetRandomNo(1,win1))        
	            break;
	        case spot.middle:
	            win1 = Math.floor( GetRandomNo(1,14))        
	            win2 = win1      
	            break;
	        case spot.right:
	            win2 = Math.floor( GetRandomNo(2,14) )       
	            win1 = Math.floor(GetRandomNo(1,win2))        
	            break;
	        default:break;
	    }
	    return [win1,win2]
	}



	function SumOfARRAY(array) {
	    return array.reduce(function (a, b) { return a + b; }, 0);
	}
	function GetRandomNo(min, max) {
	    return Math.random() * (max - min) + min;
	}

	function PushWinNo(leastBetSpot){
		if(previousWins!=undefined){
			previousWins.shift();
		    previousWins.push(leastBetSpot)
		    return previousWins;
		}    
	}

//OnSendWinNo=================================END============================================


//OnwinningAmount =>Calcuate winning Amount  =================================================

	function CalculateBotsWinAmount(winningSpot) {
	    for (let i = 0; i < BotsBetsDetails.length; i++) {
	        //reset win no to zero
	        let win = 0;
	        if (winningSpot == 0) {
	            BotsBetsDetails[i].win = BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
	            BotsBetsDetails[i].balance += BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
	            win = BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
	        } else if (winningSpot === 1) {
	            BotsBetsDetails[i].win = BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
	            BotsBetsDetails[i].balance += BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
	            win = BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
	        } else {
	            BotsBetsDetails[i].win = BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
	            BotsBetsDetails[i].balance += BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
	            win = BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
	        }

	        if (win === 0) {
	            BotsBetsDetails[i].win = -(BotsBetsDetails[i].left + BotsBetsDetails[i].middle + BotsBetsDetails[i].right);
	        }

	    }
	}

	async function PlayersWinAmountCalculator(winningSpot) {

	    for (let socketId in BetHolder) {
	        let betData = BetHolder[socketId];

	        if (winningSpot === 0 ) {
	            betData[commonVar.win] = betData[0] * LEFT_RIGHT_WIN_RATE;
	        } else if (winningSpot === 1) {
	            betData[commonVar.win] = betData[1] * MIDDLE_WIN_RATE;
	        } else {
	            betData[commonVar.win] = betData[2] * LEFT_RIGHT_WIN_RATE;
	        }

	        BetHolder[socketId] = betData;

            // let winAmount = betData[commonVar.win] - (betData[0]+betData[1]+betData[2])
            // betData[commonVar.socket].emit(events.OnPlayerWin,{winAmount});

            if (betData[commonVar.win] > 0) {
	            let winAmount=betData[commonVar.win]-betData[commonVar.win]*commonVar.adminCommisionRate;
	            debug("player "+betData[commonVar.playerId]+` wins amount ${winAmount}`);
	            betData[commonVar.socket].emit(events.OnPlayerWin,{winAmount});
	        }else{
	            debug(`player ${betData[commonVar.playerId]} lost ${betData[0]+betData[1]+betData[2]} `)
	        }
	    }

	    //$- Add bet info to Database
	    const playerWiningBalance = await service.updateWinningAmount({ spot: winningSpot, room_id: timeStamp });
	    debug("Player bet info:");
	    BetHolder = new Object();
	}
//End OnwinningAmount =========================END============================================



//Create a bot, place and save bot bets=================================================================
    const MAX_CHIPS_DATA = chipDataJson.length;
	const MAX_BOTS_ON_SCREEN = 6;
	const MAX_ITERATION = 8;
	const Min_Wait_Time = 0.5;
	const Max_Wait_Time = 2.5;
	const BOT_CHIP_LIMIT = 500;
	const MAX_TIME_BOTS_CAN_PLACE_BETS_IN_SINGLE_ROUND = 2;


	function RegisterBots() { // register new bots only 
	    return (new Promise(function (myResolve, myReject) {
	        BotsBetsDetails = [];
	        for (let i = 0; i < botManager.GetBots(gameId).length; i++) {
	            let botBetTemplate = {
	                name: "",
	                left: 0,//this is left bets
	                middle: 0,//this is middle bets
	                right: 0,//this is right bets
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
	    let _leftBets = 0;
	    let _middleBets = 0;
	    let _rightBets = 0;
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
	                case 0: _leftBets += chip;
	                    break;
	                case 1: _middleBets += chip;
	                    break;
	                case 2: _rightBets += chip;
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
	                    case 0: _leftBets += chip;
	                        BotsBetsDetails[botIndex].left += chip
	                        break;
	                    case 1: _middleBets += chip;
	                        BotsBetsDetails[botIndex].middle += chip
	                        break;
	                    case 2: _rightBets += chip;
	                        BotsBetsDetails[botIndex].right += chip
	                        break;
	                    default:
	                        break;
	                }
	            }
	        }

	        Sockets.to(gameRoom).emit(events.OnBotsData, {onlinePlayersBets: fakeOnlinePlayersBets, botsBets: botsBetHolder })
	        let waitFor = GetRandomNo(Min_Wait_Time, Max_Wait_Time) * 500;
	        await sleep(waitFor)
	    }
	    //debug(BotsBetsDetails);
	    fakeLeftBets = _leftBets;
	    fakeMiddleBets = _middleBets;
	    fakeRightBets = _rightBets;

	}


	function ResetBotsBets() {
	    for (let i = 0; i < BotsBetsDetails.length; i++) {
	        BotsBetsDetails[i].left = 0;
	        BotsBetsDetails[i].middle = 0;
	        BotsBetsDetails[i].right = 0;
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
	let j = timerVar.betCalculationTimer;
	let k = timerVar.waitTimer;
	let isTimeUp = false;
	let canPlaceBets = true;



	function ResetTimers() {
		let D=new Date();
        timeStamp=D.getTime();

        ROUND_COUNT = (ROUND_COUNT === 5) ? 0 : ++ROUND_COUNT;

		i = timerVar.bettingTimer;
	    j = timerVar.betCalculationTimer;
	    k = timerVar.waitTimer;

	    LeftBets = [];
        MiddleBets = [];
        RightBets = [];

        ResetBotsBets();
	    Sockets.to(gameRoom).emit(events.OnTimerStart);
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
	    //SendBotData();
	}

	async function OnTimeUp() {
	    canPlaceBets = false;
	    gameState = state.cannotBet;

	    j--;

	    if (j === 8) OnSendWinNo();

	    if (j === 0) {
	        //round ended restart the timers
	        await sleep(timerVar.intervalDalay);
	        debug("wait...");
	        Sockets.to(gameRoom).emit(events.OnWait);
	        OnWait();
	        return;
	    };
	    await sleep(timerVar.delay);
	    OnTimeUp();
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
    	//service.updateWinningAmount({ spot:2, room_id:'1628516811811' });
    	//SendBotData()
    	//OnSendWinNo()
        console.table(BetHolder);
        // console.table(currentRoundData);
    })
}

module.exports.StartDVsTGame = StartDragonVsTigerGame;
module.exports.GetSocket = GetSocket;