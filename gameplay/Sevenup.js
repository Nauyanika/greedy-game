"use strict"
const debug = require("debug")("test");
const DB_debug = require("debug")("db");
const service = require("../services/SevnupGameService");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const state = require("../Constants").state;
const spot = require("../Constants").spot;
const timerVar = require("../Constants").timerVar;
const gameId   = 1;
const gameRoom = require("../Constants").selectGame[gameId];


const botManager = require('../utils/BotManager');
const playerManager = require('../utils/PlayerDataManager');

//json
const chipDataJson = require("../jsonfiles/ChipsData.json");
const RandomWinAmounts = require('../jsonfiles/wins.json');


const LEFT_RIGHT_WIN_RATE = 2;
const MIDDLE_WIN_RATE = 5;
const SUFFLE_BOTS_AFTER_ROUNDS = 5;


let Sockets;
let gameState;

let currentRoundData = {}//this will users bets, playerId and spot
let BetHolder = new Object();
let LeftBets = [];
let MiddleBets = [];
let RightBets = [];
let totalBets = 0;
let fakeLeftBets;
let fakeMiddleBets;
let fakeRightBets;

let timeStamp;
let ROUND_COUNT = 0;


let Bots = new Array(6);
let todaysDate;
todaysDate = new Date();



let previousWins = new Array(20);
let BotsBetsDetails = [];   //Array of 6 bots with amount of bet on each spot (array filled by RegisterBots ↓)
RegisterBots();
SetInitialData();



//$- add round count code================================================================

    function GetSocket(SOCKET) {
        Sockets = SOCKET;
        ResetTimers();
    }

    //THIS WILL RUN ONLY ONCE
    async function SetInitialData() {
        previousWins =  await service.lastWinningNo();  //db
        let D=new Date();
        timeStamp=D.getTime();
    }

    function StartGame(data) {
        SendCurrentRoundInfo(data);
        OnChipMove(data);
        OnBetsPlaced(data);
        //OnDissConnected(data);
        OnTest(data);
        OnleaveRoom(data)
    }

    function OnleaveRoom(data){
        let socket = data[commonVar.socket];
        socket.on(events.onleaveRoom,function(data){  
            try{
                socket.leave(gameRoom);
                socket.removeAllListeners(events.OnChipMove);
                socket.removeAllListeners(commonVar.test);
                socket.removeAllListeners(events.onleaveRoom);
                socket.emit(events.onleaveRoom,{success:`successfully leave ${gameRoom} game.`});
            }catch(err){
                debug(err);
            }
        })
    }

    function OnDissConnected(data) {
        let socket = data[commonVar.socket];
        socket.on("disconnect", (data) => {
            debug("player got dissconnected " + socket.id);
            playerManager.RemovePlayer(socket.id);
        });
    }

    //Game events for client
    function OnBetsPlaced(data) {
        let socket = data[commonVar.socket];
        socket.on(events.OnBetsPlaced, (data) => {
            socket.to(commonVar.gameplay).emit(events.OnChipMove, data);
        });
    }

    function OnTest(data) { //only for debugging purposes
        let socket = data[commonVar.socket];
        socket.on(commonVar.test, (data) => {
            // debug(currentRoundData);
            // console.table(BetHolder);
            // console.table(currentRoundData);
        })
    }
//$- End initial code=============================================




//Send Round data==================================================

    async function SendCurrentRoundInfo(data) {
        let socket = data[commonVar.socket];
        let timer = 0;
        switch (gameState) {
            case state.canBet: timer = i; break;
            case state.cannotBet: timer = j; break;
            case state.wait: timer = k; break;
        }

        let balance = await service.getUserBalance(data.playerId);   //db

        let o = {
            socketId: socket.id,
            balance,//this value will come from database
            avatarNumber: 0,//this value wil come from frontend
            playerId: 0,//this value will come from database
        }
        
        playerManager.AddPlayer(o)
        let obj = {
            previousWins,
            botsBetsDetails: BotsBetsDetails,
            balance
        }
        socket.emit(events.OnCurrentTimer, obj)
    }

//========================END===================================== 




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
            if (BetHolder[data[socket.id]] === undefined) {
                let Obj = {
                    0: 0,//left bet
                    1: 0,//middle bet
                    2: 0,//right bet
                    win: 0,
                    playerId: data[commonVar.playerId],
                    socket,
                }
                BetHolder[data[socket.id]] = Obj;
                BetHolder[data[socket.id]][data[commonVar.spot]] = data[commonVar.chip];
            } else {
                BetHolder[data[socket.id]][data[commonVar.spot]] += data[commonVar.chip];
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

    function OnSendWinNo() {
        let diceWinNos = WinNosCalculator();
        //ADD WIN NO TO ARRAY
        PushWinNo(diceWinNos);
        //debug(`L :${fakeLeftBets}, M : ${fakeMiddleBets}, R :${fakeRightBets}`);

        CalculateBotsWinAmount(SumOfARRAY(diceWinNos));
        PlayersWinAmountCalculator(SumOfARRAY(diceWinNos));
        let RandomWinAmount = RandomWinAmounts[Math.floor(GetRandomNo(0, RandomWinAmounts.length))];
        //debug("random win no:" + RandomWinAmount);
        Sockets.to(gameRoom).emit(events.OnWinNo, { diceWinNos, previousWins, botsBetsDetails: BotsBetsDetails, RandomWinAmount });
        SuffleBots();
    }


    //database stuff

    //bet calculation
    const leftDiceCombinations = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 4], [3, 3]];
    const middleDiceCombinations = [[6, 1], [5, 2], [4, 3]];
    const rightDiceCombinations = [[4, 4], [4, 5], [4, 6], [5, 3], [5, 5], [5, 6], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6]];
    const DiceCombinations = new Array(leftDiceCombinations, middleDiceCombinations, rightDiceCombinations);

    function WinNosCalculator() {
        let totalLeftBets = fakeLeftBets; //SumOfARRAY(LeftBets);
        let totalMiddleBets = fakeMiddleBets * 50;//SumOfARRAY(MiddleBets);
        let totalRightBets = fakeRightBets;//SumOfARRAY(RightBets);

        let bets = [totalLeftBets, totalMiddleBets, totalRightBets];

        if (totalLeftBets === totalMiddleBets && totalMiddleBets === totalRightBets) {
            let RandomwinIndex = Math.floor(Math.random() * 3);//caculate random no form 0 to 2
            let winIndex = Math.floor(Math.random() * DiceCombinations[RandomwinIndex].length);//get the winning dice array 
            return DiceCombinations[RandomwinIndex][winIndex];//send array of dice combom
        }

        let leastBets = bets[0];
        for (let i = 0; i < bets.length; i++) {
            if (leastBets > bets[i]) leastBets = bets[i];
        }

        let dicesNoIndex = 0;
        for (let i = 0; i < bets.length; i++) {
            if (leastBets === bets[i]) dicesNoIndex = i;
        }

        let winIndex = Math.floor(Math.random() * DiceCombinations[dicesNoIndex].length);
        //return dice numbers

        //$- push win number to Database
        let winningCombinations = DiceCombinations[dicesNoIndex][winIndex];
        let winNo = SumOfARRAY(winningCombinations)
        const saveWinningNo = service.updateWinningNo({ room_id: timeStamp, game_id: 1, win_no: winNo, spot: dicesNoIndex }); //db

        return DiceCombinations[dicesNoIndex][winIndex];
    }
    function CalculateBotsWinAmount(winNo) {
        for (let i = 0; i < BotsBetsDetails.length; i++) {
            //reset win no to zero
            let win = 0;
            if (winNo < 7) {
                BotsBetsDetails[i].win = BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
                BotsBetsDetails[i].balance += BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
                win = BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
            } else if (winNo === 7) {

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
    async function PlayersWinAmountCalculator(winNo) {
        let winSpot; //db

        for (let socketId in BetHolder) {
            let betData = BetHolder[socketId];

            if (winNo < 7) {
                winSpot = 0;
                betData[commonVar.win] = betData[0] * LEFT_RIGHT_WIN_RATE;
            } else if (winNo === 7) {
                winSpot = 1;
                betData[commonVar.win] = betData[1] * MIDDLE_WIN_RATE;
            } else {
                winSpot = 2;
                betData[commonVar.win] = betData[2] * LEFT_RIGHT_WIN_RATE;
            }
            BetHolder[socketId] = betData;
            if (betData[commonVar.win] > 0) {
                let winAmount=betData[commonVar.win]-betData[commonVar.win]*commonVar.adminCommisionRate;
                debug("player "+betData[commonVar.playerId]+` wins amount ${winAmount}`);
                betData[commonVar.socket].emit(events.OnPlayerWin,{winAmount});
            }else{
                debug(`player ${betData[commonVar.playerId]} lost ${betData[0]+betData[1]+betData[2]} `)
            }
        }

        //$- Add bet info to Database
        const playerWiningBalance = await service.updateWinningAmount({ spot: winSpot, room_id: timeStamp });

        debug("Player bet info:");
        BetHolder = new Object();
    }

    function SumOfARRAY(array) {
        return array.reduce(function (a, b) { return a + b; }, 0);
    }
    function GetRandomNo(min, max) {
        return Math.random() * (max - min) + min;
    }
    function PushWinNo(winNos) {
        let win = new Array(10);
        for (let i = 0; i < previousWins.length - 1; i++) {
            win[i] = previousWins[i + 1];
        }
        win[9] = SumOfARRAY(winNos);
        previousWins = win;
    }

//EndSendWinNo=================================END=======================================================   




//bots stuff------------------------------------------------

    //this function will used to change reset ROUND_COUNT
    function IsOneDayPassed() {

        let today = new Date()
        let tomorrow = new Date(todaysDate);
        tomorrow.setDate(tomorrow.getDate() + CHANGE_ROUND_COUNT_ATFER_DAYS)
        let isDesignatedDaysPassed = tomorrow.getTime() < today.getTime();
        return isDesignatedDaysPassed;
    }

    const MAX_CHIPS_DATA = chipDataJson.length;
    const MAX_BOTS_ON_SCREEN = 6;
    const MAX_ITERATION = 8;
    const Min_Wait_Time = 0.5;
    const Max_Wait_Time = 2.5;
    const BOT_CHIP_LIMIT = 500;
    const MAX_TIME_BOTS_CAN_PLACE_BETS_IN_SINGLE_ROUND = 2;
    //this will hold all the deatils of current round bets
    function RegisterBots() {
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
    //this function noting bet a bot with OnlinePlayer Name
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

            Sockets.to(gameRoom).emit(events.OnBotsData, { onlinePlayersBets: fakeOnlinePlayersBets, botsBets: botsBetHolder })
            let waitFor = GetRandomNo(Min_Wait_Time, Max_Wait_Time) * 500;
            await sleep(waitFor)
        }
        // debug(botsBetsDetails);
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
        if (ROUND_COUNT % SUFFLE_BOTS_AFTER_ROUNDS === 0) {
            botManager.SuffleBots();
            await sleep(5);
            //register bots again
            RegisterBots();
        }
    }

//bots stuff-----------------------END-------------------------



//game timers------------------------------------------

    let i = timerVar.bettingTimer;
    let j = timerVar.betCalculationTimer;
    let k = timerVar.waitTimer;
    let isTimeUp = false;
    let canPlaceBets = true;

    function ResetTimers() {

        // if (IsOneDayPassed()) {
        //     todaysDate = new Date();
        //     ROUND_COUNT = 0;
        // }
        // ROUND_COUNT++;

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


module.exports.StartGame = StartGame;
module.exports.GetSocket = GetSocket;