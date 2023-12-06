"use strict";
const debug = require("debug")("test");
const DB_debug = require("debug")("db");
const service = require("../services/LuckyBallService");
const events = require("../Constants").events;
const commonVar = require("../Constants").commonVar;
const state = require("../Constants").state;
const spot = require("../Constants").spot;
const timerVar = require("../Constants").timerVar;
const gameId = 5;
const gameRoom = require("../Constants").selectGame[gameId];
const CardsSet = require("../Constants").setOfCards;

const botManager = require("../utils/BotManager");
const playerManager = require("../utils/PlayerDataManager");

//json
const chipDataJson = require("../jsonfiles/ChipsData.json");
const RandomWinAmounts = require("../jsonfiles/wins.json");

const LEFT_RIGHT_WIN_RATE = 2;
const MIDDLE_WIN_RATE = 8;

let Sockets;
let gameState;

let currentRoundData = {}; //this will users bets, playerId and spot
let BetHolder = new Object(); //user bet on each spot sum
let LeftBets = [];
let MiddleBets = [];
let RightBets = [];
let fakeLeftBets; //bot fake bet
let fakeMiddleBets;
let fakeRightBets;

let timeStamp; //as room id(change after 30 sec)
let ROUND_COUNT = 0; //reset to 0 after 5 round

let previousWin_single = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let playerName = "";

let winPoint = 0;
//let singleNoBet = 0;
let doubleNoBet = 0;
let zeroNoBet = 0;
let singleNoBet = 0;
let tripleNoBet = 0;
let fourNoBet = 0;
let fiveNoBet = 0;
let sixNoBet = 0;
let sevenNoBet = 0;
let eightNoBet = 0;
let nineNoBet = 0;
let oneFourNoBet = 0;
let zeroFiveNoBet = 0;
let sixNineNoBet = 0;
let isbetPlaced=false
let Win_singleNo = 0;
let Win_TwoNo = 0;

let usersingleNoChoice = -1;

let previousWins = new Array(20);
let BotsBetsDetails = []; //Array of 6 bots with amount of bet on each spot (array filled by RegisterBots ↓)
RegisterBots();
SetInitialData();

function GetSocket(SOCKET) {
  Sockets = SOCKET;
  ResetTimers();
}

async function SetInitialData() {
  //THIS WILL RUN ONLY ONCE
  previousWins = await service.lastWinningNo(); //db
  let D = new Date();
  timeStamp = D.getTime();
}

function StartLuckyBall(data) {
  SendCurrentRoundInfo(data);
  //OnChipMove(data);
  OnBetsPlaced(data);
  OnWinAmount(data);

  //OnDissConnected(data);
  gameHistoryRecord(data);
  OnleaveRoom(data);
  OnTest(data);
}

function OnleaveRoom(data) {
  let socket = data[commonVar.socket];
  socket.on(events.onleaveRoom, function (data) {
    try {
      socket.leave(gameRoom);
      socket.removeAllListeners(events.OnChipMove);
      socket.removeAllListeners(commonVar.test);
      socket.removeAllListeners(events.onleaveRoom);
      socket.removeAllListeners(events.OnHistoryRecord);
      playerManager.RemovePlayer(socket.id);
      socket.emit(events.onleaveRoom, {
        success: `successfully leave ${gameRoom} game.`,
      });
    } catch (err) {
      debug(err);
    }
  });
}

//Game events
function OnBetsPlaced(data) {
  let socket = data[commonVar.socket];
  socket.on(events.OnBetsPlaced, async (data) => {
    // socket.to(gameRoom).emit(events.OnChipMove, data);
    console.log("bet request", data);
    // singleNoBet = data.bet_amount_
    zeroNoBet = data.bet_amount_zeroVal;
    singleNoBet = data.bet_amount_oneVal;
    doubleNoBet = data.bet_amount_twoVal;
    tripleNoBet = data.bet_amount_threeVal;

    fourNoBet = data.bet_amount_fourVal;
    fiveNoBet = data.bet_amount_fiveVal;
    sixNoBet = data.bet_amount_sixVal;
    sevenNoBet = data.bet_amount_sevenVal;
    eightNoBet = data.bet_amount_eightVal;
    nineNoBet = data.bet_amount_nineVal;
    oneFourNoBet = data.bet_amount_onefourVal;
    zeroFiveNoBet = data.bet_amount_zerofiveVal;
    sixNineNoBet = data.bet_amount_sixnineVal;


    var array=[]
  array.push(data.bet_amount_zeroVal)
  array.push(data.bet_amount_oneVal)
  array.push(data.bet_amount_twoVal)
  array.push(data.bet_amount_threeVal)
  array.push(data.bet_amount_fourVal)
  array.push(data.bet_amount_fiveVal)
  array.push(data.bet_amount_sixVal)
  array.push(data.bet_amount_sevenVal)
  array.push(data.bet_amount_eightVal)
  array.push(data.bet_amount_nineVal)
  array.push(data.bet_amount_onefourVal)
  array.push(data.bet_amount_zerofiveVal)
  array.push(data.bet_amount_sixnineVal)
  isbetPlaced=true
  
  Win_singleNo=array.indexOf(Math.min(...array))


    playerName = data.playerId;
    /*  data.bet_amount_two_six +
      data.bet_amount_seven +
      data.bet_amount_eight_twelve;
 */

    usersingleNoChoice = data.category;

    let point = await service.getUserPoint(
      data.playerId,
      data.bet_amount_zeroVal +
        data.bet_amount_oneVal +
        data.bet_amount_twoVal +
        data.bet_amount_threeVal +
        data.bet_amount_fourVal +
        data.bet_amount_fiveVal +
        data.bet_amount_sixVal +
        data.bet_amount_sevenVal +
        data.bet_amount_eightVal +
        data.bet_amount_nineVal +
        data.bet_amount_onefourVal +
        data.bet_amount_zerofiveVal +
        data.bet_amount_sixnineVal
    );
    console.log("Point", point);
    if (
      data.bet_amount_zeroVal +
        data.bet_amount_oneVal +
        data.bet_amount_twoVal +
        data.bet_amount_threeVal +
        data.bet_amount_fourVal +
        data.bet_amount_fiveVal +
        data.bet_amount_sixVal +
        data.bet_amount_sevenVal +
        data.bet_amount_eightVal +
        data.bet_amount_nineVal +
        data.bet_amount_onefourVal +
        data.bet_amount_zerofiveVal +
        data.bet_amount_sixnineVal ==
      0
    ) {
      /* && data.doubleNo.length==0 && data.triple.length==0) */ socket.emit(
        events.OnBetsPlaced,
        {
          status: 400,
          message: "Bet not Confirmed",
          data: {
            playerId: data.playerId,
            balance:
              point -
              (data.bet_amount_zeroVal +
                data.bet_amount_oneVal +
                data.bet_amount_twoVal +
                data.bet_amount_threeVal +
                data.bet_amount_fourVal +
                data.bet_amount_fiveVal +
                data.bet_amount_sixVal +
                data.bet_amount_sevenVal +
                data.bet_amount_eightVal +
                data.bet_amount_nineVal +
                data.bet_amount_onefourVal +
                data.bet_amount_zerofiveVal +
                data.bet_amount_sixnineVal),
          },
        }
      );
    } else {
      socket.emit(events.OnBetsPlaced, {
        status: 200,
        message: "Bet Confirmed",
        data: {
          playerId: data.playerId,
          balance:
            point -
            (data.bet_amount_zeroVal +
              data.bet_amount_oneVal +
              data.bet_amount_twoVal +
              data.bet_amount_threeVal +
              data.bet_amount_fourVal +
              data.bet_amount_fiveVal +
              data.bet_amount_sixVal +
              data.bet_amount_sevenVal +
              data.bet_amount_eightVal +
              data.bet_amount_nineVal +
              data.bet_amount_onefourVal +
              data.bet_amount_zerofiveVal +
              data.bet_amount_sixnineVal),
        },
      });
    }
  });
}

function OnWinAmount(data) {
  let socket = data[commonVar.socket];
  socket.on(events.OnWinAmount, async (data) => {
    console.log("winAmount hit", data);
    await service.updateUserPoint(data.playerId, data.win_points);
    socket.emit(events.OnWinAmount, {
      win_no: Win_singleNo,
      RoundCount: ROUND_COUNT,
      win_point: winPoint,
      playerId: playerName,
    });
  });
}

async function addPlayerToRoom(data) {
  let socket = data[commonVar.socket];
  let balance = await service.getUserBalance(data.playerId); //db
  let obj = {
    socketId: socket.id,
    balance, //this value will come from database
    avatarNumber: 0, //this value wil come from frontend
    playerId: data.playerId, //this value will come from database
  };
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
    case state.canBet:
      timer = i;
      break;
    case state.cannotBet:
      timer = j;
      break;
    case state.wait:
      timer = k;
      break;
  }

  let player = await addPlayerToRoom(data);

  let obj = {
    gametimer: i,

    // timer,
    // gameState,
    // socketId : player.socketId,
    previousWins: previousWin_single,
    botsBetsDetails: BotsBetsDetails,

    balance: player.balance,
  };

  socket.emit(events.OnCurrentTimer, obj);
}

//Game History Record=====================================================================
function gameHistoryRecord(data) {
  let socket = data[commonVar.socket];
  socket.on(events.OnHistoryRecord, async function (data) {
    let matrixRecord = await service.gameMartixRecords();
    let slotRecord = await service.gameSlotRecords();
    socket.emit(events.OnHistoryRecord, {
      matrixRecord: previousWins,
      slotRecord,
    });
  });
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
      position: data[commonVar.position],
    };
    if (currentRoundData[data[socket.id]] === undefined) {
      currentRoundData[data[socket.id]] = {
        //following are the spots
        0: [], //left bets
        1: [], //middle bets
        2: [], //right bets
        playerId: data[commonVar.playerId],
      };
      currentRoundData[data[socket.id]][data[commonVar.spot]].push(obj);
    } else {
      currentRoundData[data[socket.id]][data[commonVar.spot]].push(obj);
    }

    //this will help add bets
    if (BetHolder[socket.id] === undefined) {
      let Obj = {
        0: 0, //left bet
        1: 0, //middle bet
        2: 0, //right bet
        win: 0,
        playerId: data[commonVar.playerId],
        socket,
      };

      BetHolder[socket.id] = Obj;
      BetHolder[socket.id][data[commonVar.spot]] = data[commonVar.chip];
    } else {
      BetHolder[socket.id][data[commonVar.spot]] += data[commonVar.chip];
    }

    socket.to(gameRoom).emit(events.OnChipMove, data);
  });
}

async function AddBalanceToDatabase(data) {
  data[commonVar.gameId] = gameId;
  const saveBet = await service.JoinGame(data, timeStamp); //db
}

//End On Chip Move =>Save all user Bet ==============================================

//On OnSendWinNo =>Calcuate game Winning No when j==8 ======================================

async function OnSendWinNo() {
  let result = await WinNosCalculator();
  let winNo = result.winNo;
  let winningSpot = result.spot;
  let singleNo = result.singleNo;

  let winPoint = result.win_point;

  let data = {
    room_id: timeStamp,
    game_id: 5,
    winNo1: winNo[0],
    winNo2: winNo[1],
    spot: winningSpot,
  };
  let WinningCards = createWinningCards(winNo);

  const saveWinningNo = await service.updateWinningNo(data); //db

  // //ADD WIN NO TO ARRAY
  previousWins = PushWinNo(winningSpot);
  //debug(`L :${fakeLeftBets}, M : ${fakeMiddleBets}, R :${fakeRightBets}`);

  CalculateBotsWinAmount(winningSpot);
  await PlayersWinAmountCalculator(winningSpot);
  let RandomWinAmount =
    RandomWinAmounts[Math.floor(GetRandomNo(0, RandomWinAmounts.length))];
  //debug("random win no:" + RandomWinAmount);
  usersingleNoChoice = [];
  if (playerName != "") {
    var result1 = await service.onbalance(playerName);
  } else {
    var result1 = [{ point: 0 }];
  }

  //var arstr =["00","0","1","2","3","4","5","6"," 7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"," 23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]
  Sockets.to(gameRoom).emit(events.OnWinNo, {
    RoundCount: ROUND_COUNT,
    playerId: playerName,
    // winNo: singleNo,

    winNo,
    previousWin_single: previousWin_single,
    winPoint: winPoint,
    Balance: result1[0].point,
  });
  SuffleBots();
}

function createWinningCards(cards) {
  let andarCardType = generateRandomNo(CardsSet.Zero, CardsSet.Three);
  let baharCardType = generateRandomNo(CardsSet.Zero, CardsSet.Three);
  let winCardArr = [
    { card: cards[0], type: andarCardType },
    { card: cards[1], type: baharCardType },
  ];
  return winCardArr;
}

async function WinNosCalculator() {
  let totalLeftBets = SumOfARRAY(LeftBets) * 2;
  let totalMiddleBets = SumOfARRAY(MiddleBets) * 8;
  let totalRightBets = SumOfARRAY(RightBets) * 2;

  let winNo;
  let leastBetSpot;

  let bets = [totalLeftBets, totalMiddleBets, totalRightBets];

  if (totalLeftBets === totalMiddleBets && totalMiddleBets === totalRightBets) {
    leastBetSpot = Math.floor(Math.random() * 2); //caculate random no form 2 to 12
    winNo = generateSpotWinningNo(leastBetSpot);
    leastBetSpot = Math.floor(Math.random() * 2); // for winning spot 2 to 12
  } else {
    let leastBet = Math.min.apply(Math, bets); //minimum amount bet
    leastBetSpot = bets.indexOf(leastBet); //minimum  bet amount spot
    winNo = generateSpotWinningNo(leastBetSpot);
    leastBetSpot = Math.floor(Math.random() * 2); // for winning spot 2 to 12
  }
  if(isbetPlaced==false){
  Win_singleNo = Math.floor(Math.random() * 10); ///Dice 1
}
isbetPlaced=false
  // Win_TwoNo = Math.floor(Math.random() * 6) + 1; ////Dice 2
  previousWin_single.pop;

  previousWin_single.push(Win_singleNo);

  //previousWin_single.push(Win_TwoNo);

  winPoint = 0;
  /* --------------------CartegoriesTypes Bets---------------------------*/
  if (zeroFiveNoBet != 0 && (Win_singleNo == 0 || Win_singleNo == 5)) {
    winPoint = winPoint + zeroFiveNoBet * 4.5; /*------------x9*/
  }

  if (zeroNoBet != 0 && Win_singleNo == 0) {
    winPoint = winPoint + zeroNoBet * 9; /*------------x9*/
  }

  if (fiveNoBet != 0 && Win_singleNo == 5) {
    winPoint = winPoint + fiveNoBet * 9; /*------------x9*/
  }

  /*----------- --------------------------------------------------------------------     ---------------*/

  if (
    zeroFiveNoBet != 0 &&
    (Win_singleNo == 1 ||
      Win_singleNo == 2 ||
      Win_singleNo == 3 ||
      Win_singleNo == 4)
  ) {
    winPoint = winPoint + zeroFiveNoBet * 2.3; /*------------x9*/
  }

  if (singleNoBet != 0 && Win_singleNo == 1) {
    winPoint = winPoint + singleNoBet * 9; /*------------x9*/
  }

  if (fiveNoBet != 0 && Win_singleNo == 4) {
    winPoint = winPoint + fourNoBet * 9; /*------------x9*/
  }

  /*----------------------------------------*/

  if (
    zeroFiveNoBet != 0 &&
    (Win_singleNo == 6 ||
      Win_singleNo == 7 ||
      Win_singleNo == 8 ||
      Win_singleNo == 9)
  ) {
    winPoint = winPoint + zeroFiveNoBet * 2.3; /*------------x9*/
  }

  if (sixNoBet != 0 && Win_singleNo == 6) {
    winPoint = winPoint + zeroNoBet * 9; /*------------x9*/
  }

  /* if (fiveNoBet!=0&& Win_singleNo==7){
  winPoint=winPoint+fiveNoBet*9         /*------------x9
}

if (singleNoBet!=0&& Win_singleNo==8){
  winPoint=winPoint+zeroNoBet*9/*------------x9
}
 */

  if (nineNoBet != 0 && Win_singleNo == 9) {
    winPoint = winPoint + fiveNoBet * 9; /*------------x9*/
  }

  singleNoBet = 0;
  doubleNoBet = 0;
  tripleNoBet = 0;
  fourNoBet = 0;
  fiveNoBet = 0;
  sixNineNoBet = 0;
  sixNoBet = 0;
  sevenNoBet = 0;
  eightNoBet = 0;
  nineNoBet = 0;
  oneFourNoBet = 0;
  zeroFiveNoBet = 0;
  zeroNoBet = 0;

  //    win_ = Math.floor(Math.random() * 6) + 1
  if (playerName != "") {
    await service.addwinningpoint(playerName, winPoint);
  } //db

  return {
    win_point: winPoint,
    singleNo: Win_singleNo,
    winNo: Win_singleNo,
    spot: leastBetSpot,
  };
}

function generateSpotWinningNo(leastBetSpot) {
  let win1;
  let win2;
  switch (leastBetSpot) {
    case spot.left:
      win1 = Math.floor(GetRandomNo(2, 12));
      win2 = Math.floor(GetRandomNo(1, win1));
      break;
    case spot.middle:
      win1 = Math.floor(GetRandomNo(1, 10));
      win2 = win1;
      break;
    case spot.right:
      win2 = Math.floor(GetRandomNo(2, 12));
      win1 = Math.floor(GetRandomNo(1, win2));
      break;
    default:
      break;
  }
  return [win1, win2];
}

function SumOfARRAY(array) {
  return array.reduce(function (a, b) {
    return a + b;
  }, 0);
}
function GetRandomNo(min, max) {
  return Math.random() * (max - min) + min;
}

function PushWinNo(leastBetSpot) {
  if (previousWins != undefined) {
    previousWins.shift();
    previousWins.push(leastBetSpot);
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
      BotsBetsDetails[i].balance +=
        BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
      win = BotsBetsDetails[i].left * LEFT_RIGHT_WIN_RATE;
    } else if (winningSpot === 1) {
      BotsBetsDetails[i].win = BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
      BotsBetsDetails[i].balance += BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
      win = BotsBetsDetails[i].middle * MIDDLE_WIN_RATE;
    } else {
      BotsBetsDetails[i].win = BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
      BotsBetsDetails[i].balance +=
        BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
      win = BotsBetsDetails[i].right * LEFT_RIGHT_WIN_RATE;
    }

    if (win === 0) {
      BotsBetsDetails[i].win = -(
        BotsBetsDetails[i].left +
        BotsBetsDetails[i].middle +
        BotsBetsDetails[i].right
      );
    }
  }
}

async function PlayersWinAmountCalculator(winningSpot) {
  for (let socketId in BetHolder) {
    let betData = BetHolder[socketId];

    if (winningSpot === 0) {
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
      let winAmount =
        betData[commonVar.win] -
        betData[commonVar.win] * commonVar.adminCommisionRate;
      debug(
        "player " + betData[commonVar.playerId] + ` wins amount ${winAmount}`
      );
      betData[commonVar.socket].emit(events.OnPlayerWin, { winAmount });
    } else {
      debug(
        `player ${betData[commonVar.playerId]} lost ${
          betData[0] + betData[1] + betData[2]
        } `
      );
    }
  }

  //$- Add bet info to Database
  const playerWiningBalance = await service.updateWinningAmount({
    spot: winningSpot,
    room_id: timeStamp,
  });
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

function RegisterBots() {
  // register new bots only
  return new Promise(function (myResolve, myReject) {
    BotsBetsDetails = [];
    for (let i = 0; i < botManager.GetBots(gameId).length; i++) {
      let botBetTemplate = {
        name: "",
        left: 0, //this is left bets
        middle: 0, //this is middle bets
        right: 0, //this is right bets
        balance: 0, //this will assign just before the loops starts
        win: 0,
        avatarNumber: 0,
      };
      let botObj = botManager.GetBots(gameId)[i];
      botBetTemplate.balance = botObj.balance;
      botBetTemplate.name = botObj.name;
      botBetTemplate.avatarNumber = botObj.avatarNumber;
      BotsBetsDetails.push(botBetTemplate);
    }
  });
}

/*
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
    let fakeOnlinePlayersBets = [];
    //SET BETS FOR ONLINE PLAYERS
    //IT WILL SHOW IN FRONTENT THAT ONLINE PLAYERS IS BETTING
    for (let i = 0; i < MAX_ITERATION; i++) {
      if (isTimeUp) break;
      let randomNO = Math.floor(GetRandomNo(0, MAX_CHIPS_DATA));
      fakeOnlinePlayersBets.push(randomNO);

      let spot = chipDataJson[randomNO].spot;
      let chip = chipDataJson[randomNO].chip;
      switch (spot) {
        case 0:
          _leftBets += chip;
          break;
        case 1:
          _middleBets += chip;
          break;
        case 2:
          _rightBets += chip;
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
          botIndex, //this is just to identify bot on frontend
          dataIndex, //this will identify the index of chipdata index
        };

        botsBetHolder.push(botData);
        let spot = chipDataJson[dataIndex].spot;
        let chip = chipDataJson[dataIndex].chip;
        //this will only get from the fist six bots
        temp[i] = chipDataJson[dataIndex];
        BotsBetsDetails[botIndex].balance -= chip;
        switch (spot) {
          case 0:
            _leftBets += chip;
            BotsBetsDetails[botIndex].left += chip;
            break;
          case 1:
            _middleBets += chip;
            BotsBetsDetails[botIndex].middle += chip;
            break;
          case 2:
            _rightBets += chip;
            BotsBetsDetails[botIndex].right += chip;
            break;
          default:
            break;
        }
      }
    }

    Sockets.to(gameRoom).emit(events.OnBotsData, {
      onlinePlayersBets: fakeOnlinePlayersBets,
      botsBets: botsBetHolder,
    });
    let waitFor = GetRandomNo(Min_Wait_Time, Max_Wait_Time) * 500;
    await sleep(waitFor);
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
let i = timerVar.bettingRoulette;
let j = timerVar.betCalculationTimer;
let k = timerVar.waitTimer;
let isTimeUp = false;
let canPlaceBets = true;

function ResetTimers() {
  let D = new Date();
  timeStamp = D.getTime();

  //  ROUND_COUNT = (ROUND_COUNT === 5) ? 0 : ++ROUND_COUNT;
  ROUND_COUNT = ROUND_COUNT + 1;

  i = timerVar.bettingRoulette;
  j = timerVar.betCalculationTimer;
  k = timerVar.waitTimer;

  LeftBets = [];
  MiddleBets = [];
  RightBets = [];

  ResetBotsBets();
  Sockets.to(gameRoom).emit(events.OnTimerStart, { result: i });
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
  }
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
    /*  await sleep(timerVar.intervalDalay);
	        debug("wait...");
	        Sockets.to(gameRoom).emit(events.OnWait);
	        OnWait(); */
    ResetTimers();

    return;
  }
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
  }
  await sleep(timerVar.delay);
  OnWait();
}

//game timers-----------------END-------------------------

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function generateRandomNo(min, max) {
  //min & max include
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  });
}

module.exports.StartLuckyBall = StartLuckyBall;
module.exports.GetSocket = GetSocket;
