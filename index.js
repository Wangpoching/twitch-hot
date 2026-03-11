let cursor
let observer
let twitchEmbed
let isLoading = false
const main = document.querySelector('.channels')
const navs = [...document.querySelector('.navbar-list').querySelectorAll('li')]

// 打開直播頁面
function openModal(userLogin) {
  document.querySelector('.modal-overlay').classList.add('active')
  twitchEmbed = new Twitch.Embed('twitch-embed', {
      width: 854,
      height: 480,
      channel: userLogin,  // 帶入主播的 user_login
      parent: ['localhost'],
      autoplay: false
  })
}

// 關閉直播頁面
function closeModal() {
  document.querySelector('.modal-overlay').classList.remove('active')
  document.querySelector('#twitch-embed').innerHTML = '' // destroy embed
  twitchEmbed = null
}

// Ajax
function xhr(params, cb) {
  var xhr = new XMLHttpRequest()
  xhr.onload = function() {
    cb(null, xhr.responseText)
  }
  xhr.onerror = function() {
    cb(new Error('網路連線失敗'))
  }
  xhr.open(params.method, params.url, true)
  if (Object.keys(params).includes('header')) {
    for (const [key, value] of Object.entries(params.header)) {
      xhr.setRequestHeader(key, value)
    }
  }
  xhr.send()
}

// 獲取熱門遊戲列表
function getStreams(gameId, cursor, number, cb) {
  // 獲取 Top20 熱門的 Channel
  xhr({
    method: 'GET',
    header: {
      Authorization: CONFIG.TWITCH_TOKEN,
      'Client-Id': CONFIG.TWITCH_CLIENT_ID
    },
    url: `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=${number}&after=${cursor || ''}`
  }, (err, res) => {
    if (err) {
      cb(new Error('網路連線失敗'))
    } else {
      let jsonResponse
      try {
        jsonResponse = JSON.parse(res)
      } catch (err) {
        cb(new Error('解析資料發生問題'))
        return
      }

      cb(null, jsonResponse)
    }
  })
}

// 新增遊戲實況到 DOM
function appendChannels(channelInfos, users = []) {
  for (let channelInfo of channelInfos) {
    const channel = document.createElement('div')
    channel.classList.add('channel')
    channel.innerHTML = `<img class="thumb_nail" />
<div class="channel__info">
<div class="avatar">
  <img />
</div>
<div class="channel__detail">
  <div class="channel__name"></div>
  <div class="author__name"></div>
</div>
</div>`
    channel.querySelector('.thumb_nail').src = channelInfo.thumbnail_url.replace('{width}', 900).replace('{height}', 900)
    channel.querySelector('.channel__name').innerText = channelInfo.title
    channel.querySelector('.author__name').innerText = channelInfo.user_name
    channel.querySelector('.avatar img').src = users.find(user => user.id === channelInfo.user_id)?.profile_image_url || ''
    channel.dataset.userLogin = channelInfo.user_login
    main.appendChild(channel)
  }
  const sentinel = document.querySelector('.sentinel')
  if (sentinel) {
    main.appendChild(sentinel)
  }
}

// 監聽滾動到底事件
function addSentinel() {
  if (observer) observer.disconnect()
  // 無限滾動
  const sentinel = document.createElement('div')
  main.appendChild(sentinel)
  sentinel.classList.add('sentinel')
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const activeGameId = document.querySelector('.navbar-list li.active').dataset.gameId
      loadStreams(activeGameId, cursor, 20, false)
    }
  }, { rootMargin: '0px 0px -100px 0px' })
  observer.observe(sentinel)
}

// 載入實況以及相關資源
function loadStreams(gameId, afterCursor, number, isFirst) {
  if (isLoading) return  // 還在載入中就不重複發
  isLoading = true
  getStreams(gameId, afterCursor, number, (err, streamsData) => {
    if (err) {
      isLoading = false
      alert('載入熱門實況發生問題')
      return
    }
    const channelInfos = streamsData.data
    if (channelInfos.length) {
      cursor = streamsData.pagination.cursor
      const userIds = channelInfos.map(info => info.user_id)
      // 獲得頭貼
      xhr({
        method: 'GET',
        header: {
          Authorization: CONFIG.TWITCH_TOKEN,
          'Client-Id': CONFIG.TWITCH_CLIENT_ID
        },
        url: `https://api.twitch.tv/helix/users?id=${userIds.join('&id=')}`
      }, (err, res) => {
        isLoading = false
        let jsonResponse
        try {
          jsonResponse = JSON.parse(res)
        } catch (err) {
          // 抓不到頭貼就留空
          appendChannels(channelInfos)
          if (isFirst) {
            addSentinel()
          }
          return
        }
        const users = jsonResponse.data
        appendChannels(channelInfos, users)
        if (isFirst) {
          addSentinel()
        }
      })
    } else {
      isLoading = false  // 沒有更多資料了
      const sentinel = document.querySelector('.sentinel')
      if (sentinel) sentinel.remove()  // 沒資料了，不需要再觀察
    }
  })
}

// 第一次載入實況(切換遊戲)
function initializeStreams(gameId, gameName) {
  isLoading = false
  const gameNameEle = document.querySelector('.game__name')
  gameNameEle.innerText = gameName
  cursor = ''
  main.innerHTML = ''
  for (let nav of navs) {
    if (nav.classList.contains('active')) {
      nav.classList.remove('active')
    }
    if (nav.dataset.gameId === gameId) {
      nav.classList.add('active')
    }
  }
  loadStreams(gameId, cursor, 20, true)  
}

xhr({
  method: 'GET',
  header: {
    Authorization: CONFIG.TWITCH_TOKEN,
    'Client-Id': CONFIG.TWITCH_CLIENT_ID
  },
  url: 'https://api.twitch.tv/helix/games/top?first=5'
}, (err, res) => {
  if (err) {
    alert('系統發生問題')
  } else {
    let jsonResponse
    try {
      jsonResponse = JSON.parse(res)
    } catch (err) {
      alert('解析資料發生問題')
      return
    }
    const gameNames = jsonResponse.data.map(ele => ele.name)
    const gameIds = jsonResponse.data.map(ele => ele.id)
    for (let i = 0; i < gameNames.length; i++) {
      navs[i].querySelector('a').innerText = gameNames[i]
      navs[i].dataset.gameId = gameIds[i]
      navs[i].dataset.gameName = gameNames[i]
    }
    initializeStreams(gameIds[0], gameNames[0])
  }
})

// 切換遊戲
document.querySelector('.navbar-list').addEventListener('click', (e) => {
  const li = e.target.closest('li')
  if (!li) return
  initializeStreams(li.dataset.gameId, li.dataset.gameName)
})

// 點 channel 卡片
main.addEventListener('click', (e) => {
  const channel = e.target.closest('.channel')
  if (!channel) return
  const userLogin = channel.dataset.userLogin // 等一下要記得在 appendChannels 塞這個
  openModal(userLogin)
})

// 點 overlay 關閉
document.querySelector('.modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal() // 只有點到 overlay 本身才關閉
})

// 點 X 關閉
document.querySelector('.modal__close').addEventListener('click', closeModal)
