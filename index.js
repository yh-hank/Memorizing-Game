//設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]
const view = {
  getCardElement(index) {// 蓋牌的樣式;  data-set 的技巧把卡片索引綁到 HTML 元素上，才能讓 JavaScript 取得索引數字來進一步運算。
    return `<div data-index=${index} class="card back"></div>`
  },
  getCardContent(index) {// 顯示卡片內容
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  }, transformNumber(number) {//(7)
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  /* displayCards()抽換卡片的內容*/
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index =>
      this.getCardElement(index)).join('')
  },
  // 翻牌動作,將每張卡片設定監聽,另外再getCardElement建立卡片元素的地方增加back的樣式設定(蓋牌時的樣式)
  //點擊一張覆蓋的卡片 → 回傳牌面內容 (數字和花色)
  //點擊一張翻開的卡片 → 重新覆蓋卡片，意即把牌面內容清除，重新呼叫牌背樣式(背景)
  // 需要將原先的getCardElement拆成兩部分,一個是蓋牌時的樣式(getCardElement),一個是翻牌後的樣式(getCardContent)

  // ... 讓接收參數不在是一個,可以一次接收多個,且可以將接收值轉為陣列
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')//是要求在事件執行一次之後，就要卸載這個監聽器。因為同一張卡片可能會被點錯好幾次，每一次都需要動態地掛上一個新的監聽器，並且用完就要卸載。
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  //遊戲結束時呼叫這個函式來顯示遊戲結束畫面：
  showGameFinished () {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}


const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())// count:傳入的參數;產生所需的陣列資料數
    for (let index = number.length - 1; index > 0; index--) {   // 取出最後一項;直到第二個元素 
      let randomIndex = Math.floor(Math.random() * (index + 1)) // 1
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}



const model = {// 存放翻開過的牌
  revealedCards: [],
  isRevealedCardsMatched() {// 比對兩張翻開的牌是否相同
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  // 新增分數及嘗試次數
  score: 0,
  triedTimes: 0
}

//由 controller 啟動遊戲初始化，在 controller 內部呼叫 view.displayCards
//由 controller 來呼叫 utility.getRandomNumberArray，避免 view 和 utility 產生接觸

const controller = {
  // 遊戲初始狀態為等待翻開第一張牌
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  // 依照不同的遊戲狀態, 做不同的行為
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes((++model.triedTimes))
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore((model.score += 10))// 在model中的score加上10
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {// 翻完全不牌後的分數為260
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished// 當前狀態變為結束遊戲
            view.showGameFinished()// 從view中呼叫結束遊戲畫面的函式
            return
          }
          this.currentState = GAME_STATE.SecondCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }

}
controller.generateCards()


// querySelectorAll 來抓到所有與 .card 選擇器匹配的元素，此時會回傳一個陣列，再使用 forEach 來迭代陣列，為每張卡牌加上事件監聽器：
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    // console.log(card)
    // view.flipCard(card)
    controller.dispatchCardAction(card)
  })
})



//透過 displayCards() 來生成卡片了，但考慮到之後要動態渲染 52 張牌，每張牌都有不一樣的數字和花色。我們現在可以再進一步拆解函式：
//displayCards - 負責選出 #cards 並抽換內容
//getCardElement - 負責生成卡片內容，包括花色和數字
//圖片來源存在 Symbols 變數中 
//根據參數 index 來計算現在是哪一個花色：
//卡片的數字大小不能為0故需+1
//卡片花色 每種花色共13張
//
//將原先的const number = (index % 13) + 1 改寫this.transformNumber((index % 13) + 1) ;this 指的是view這個物件中的

// 產生52張牌
/* displayCards () {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join('')
  } */
//Arr(52)回傳[empty × 52]只有陣列的長度屬性,也就是類陣列
//    利用Array.from 可以從「類似陣列」的物件來建立陣列
//     Array.from(Array(52)) 會產生一個有52個undefined的陣列;
//    .keys()方法會回傳一個包含陣列中的每一個索引之鍵（keys）的新 Array Iterator(陣列迭代器) 物件。
//     Array.from(Array(52).keys())會產生一個含有0~51數字的陣列
//    .map迭代陣列，並依序將數字丟進 view.getCardElement()，會變成有 52 張卡片的陣列；
//    接著要用 join("") 把陣列合併成一個大字串，才能當成 HTML template 來使用
// const utility 洗牌
// 1.先乘除後加減有括弧先算，確實如果沒加上（）會造成永遠換不到第一張(random = 0）的情況
// 如果是這樣子的寫法 Math.floor(Math.random() * index + 1);
// Math.random() * index 後再加上1;當今天 Math.random() 為0;假設第一張牌是 0 你的數列開頭永遠會是 0
// 所以必須寫成 Math.floor(Math.random() * (index + 1) ) 如果今天Math.random() 是0;乘上任一數還是0
// 也就可以避免無法出現0的問題
//
// 回到displayCards 將剛剛前面設定的 Array.from 替換成 getRandomNumberArray 
// 原先rootElement.innerHTML = Array.from(Array(52).keys()).map(index =>
// 改為rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => 
/* 當物件的屬性與函式/變數名稱相同時
原本的寫法
const view = {
  displayCards: function displayCards() { ...  }
}
省略後的寫法
const view = {
  displayCards() { ...  }
}
*/

/* 利用controller 控制洗牌 將原先的display改寫*/
// 將原先設定在view中的洗牌動作從controller去執行,執行完的結果再傳入displayCards做顯示
//  displayCards()參數以indexes帶入,也就是打散過後的陣列傳入
//  先前顯示的結果是由utility.getRandomNumberArray的洗牌結果後顯示
// 現在由controller中執行後,傳入indexes參數,因此顯示內容變為indexes
/* displayCards() {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = utility.getRandomNumberArray(52).map(index =>
      this.getCardElement(index)).join('')
  }
  改寫
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index =>
      this.getCardElement(index)).join('')
  }

  */

/* 為了優化程式碼將改寫flipCard 和 pairCard
原先
 flipCard(card) {
  console.log(card)
  if (card.classList.contains('back')) {
    // 當今天點選的目標含有back選擇器的樣式時(表示目前是蓋牌的)
    // 回傳正面
    card.classList.remove('back')// 移除樣式後顯示卡片內容
    card.innerHTML = this.getCardContent(Number(card.dataset.index)) // 改這裡
    return
  }
  // 回傳背面
  card.classList.add('back') // 顯示蓋牌的樣式
  card.innerHTML = null // 將卡片內容清空
}
改寫為。...展開陣列,可以讓原本的card參數不在侷限只能傳入一個,可以傳入許多個,並且能將傳入的參數轉變成陣列型態,用map 來迭代將傳入的每個值都去做設定
flipCards (...cards) {
  cards.map(card => {
    if (card.classList.contains('back')) {
      card.classList.remove('back')
      card.innerHTML = this.getCardContent(Number(card.dataset.index))
      return
    }
    card.classList.add('back')
    card.innerHTML = null
  })
},
原先在
 dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCard(card)// 翻牌
        model.revealedCards.push(card)// 將翻過的排放入 model.revealedCards中,才可以與第二張牌做比較
        this.currentState = GAME_STATE.SecondCardAwaits// 狀態從等待翻第一張牌改變成等待翻第二張牌
        break
      case GAME_STATE.SecondCardAwaits:
        view.flipCard(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功 因為翻開的卡片存在model中的revealedCards 由 model 管理
        if (model.isRevealedCardsMatched()) {// 配對正確
          this.currentState = GAME_STATE.CardsMatched
          view.pairCard(model.revealedCards[0])// 將model中存放的兩張牌組加上樣式
          view.pairCard(model.revealedCards[1])
          model.revealedCards = []// 清空原先儲存的內容
        } else {// 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          setTimeout(() => {// 讓卡片翻回去的時間延一秒
            view.flipCard(model.revealedCards[0])
            view.flipCard(model.revealedCards[1])
            model.revealedCards = [] //如果沒清空,再次翻牌時會顯時上一次所儲存的牌
            this.currentState = GAME_STATE.FirstCardAwaits
          }, 1000);
        }
        break
    }
    //console.log('this.currentState', this.currentState)
    //console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  }
  將許多重複出現的 view.flipCard(model.revealedCards[0]) view.flipCard(model.revealedCards[1])
  利用...改寫過flipCards (...cards)後
  可以將其改寫為view.flipCard(...model.revealedCards)
改寫前
pairCard(card) {
    card.classList.add('paired')
  }
}
改寫後
  pairCard(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  }
*/