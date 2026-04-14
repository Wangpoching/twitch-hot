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
    channel: userLogin,
    parent: ['localhost'],
    autoplay: false
  })
}

// 關閉直播頁面
function closeModal() {
  document.querySelector('.modal-overlay').classList.remove('active')
  document.querySelector('#twitch-embed').innerHTML = ''
  twitchEmbed = null
}

// Ajax
async function ajax(params) {
  const response = await fetch(params.url, {
    method: params.method,
    headers: params.header || {}
  })
  if (!response.ok) throw new Error('網路連線失敗')
  return response.json()
}

// 獲取熱門遊戲列表
async function getStreams(gameId, afterCursor, number) {
  return ajax({
    method: 'GET',
    header: {
      Authorization: CONFIG.TWITCH_TOKEN,
      'Client-Id': CONFIG.TWITCH_CLIENT_ID
    },
    url: `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=${number}&after=${afterCursor || ''}`
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
async function loadStreams(gameId, afterCursor, number, isFirst) {
  if (isLoading) return
  isLoading = true
  try {
    const streamsData = await getStreams(gameId, afterCursor, number)
    const channelInfos = streamsData.data
    if (channelInfos.length) {
      cursor = streamsData.pagination.cursor
      const userIds = channelInfos.map(info => info.user_id)
      try {
        const usersData = await ajax({
          method: 'GET',
          header: {
            Authorization: CONFIG.TWITCH_TOKEN,
            'Client-Id': CONFIG.TWITCH_CLIENT_ID
          },
          url: `https://api.twitch.tv/helix/users?id=${userIds.join('&id=')}`
        })
        appendChannels(channelInfos, usersData.data)
      } catch (err) {
        // 抓不到頭貼就留空
        appendChannels(channelInfos)
      }
      if (isFirst) addSentinel()
    } else {
      // 沒有更多資料，移除 sentinel
      const sentinel = document.querySelector('.sentinel')
      if (sentinel) sentinel.remove()
    }
  } catch (err) {
    alert('載入熱門實況發生問題')
  } finally {
    isLoading = false
  }
}

// 第一次載入實況(切換遊戲)
async function initializeStreams(gameId, gameName) {
  isLoading = false
  document.querySelector('.game__name').innerText = gameName
  cursor = ''
  main.innerHTML = ''
  for (let nav of navs) {
    nav.classList.toggle('active', nav.dataset.gameId === gameId)
  }
  await loadStreams(gameId, cursor, 20, true)
}

// 初始化：獲取熱門遊戲並載入第一個遊戲的實況
;(async () => {
  try {
    const jsonResponse = await ajax({
      method: 'GET',
      header: {
        Authorization: CONFIG.TWITCH_TOKEN,
        'Client-Id': CONFIG.TWITCH_CLIENT_ID
      },
      url: 'https://api.twitch.tv/helix/games/top?first=5'
    })
    const gameNames = jsonResponse.data.map(ele => ele.name)
    const gameIds = jsonResponse.data.map(ele => ele.id)
    for (let i = 0; i < gameNames.length; i++) {
      navs[i].querySelector('a').innerText = gameNames[i]
      navs[i].dataset.gameId = gameIds[i]
      navs[i].dataset.gameName = gameNames[i]
    }
    initializeStreams(gameIds[0], gameNames[0])
  } catch (err) {
    alert('系統發生問題')
  }
})()

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
  openModal(channel.dataset.userLogin)
})

// 點 overlay 關閉
document.querySelector('.modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal()
})

// 點 X 關閉
document.querySelector('.modal__close').addEventListener('click', closeModal)
