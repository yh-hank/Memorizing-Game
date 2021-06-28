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
  showGameFinished() {
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


