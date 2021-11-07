// Base url for API
const baseUrl = 'https://musicbrainz.org/ws/2'
// Currently Selected filter for search
let selectedFilter = null
// Offset of data (pagination) for infinite loading
let offset = 0
// Total Searched Results
let totalResultsIndex = 0
// if new results have been automatically loaded
let newResultsLoaded = false

// Set filter  for specific data
function setFilter() {
  const selectedValue = document.getElementById('filter-input').value
  return (selectedFilter = selectedValue)
}

// Function fired on search button click get value from search and calls API
function search() {
  window.scrollTo(0, 0)
  // Get Results Table Element
  const resultsTableHTML = document.getElementById('results-table-body')
  // Clear Results Table from old results
  resultsTableHTML.innerHTML = ''

  // Reset all search vairables
  offset = 0
  totalResultsIndex = 0
  newResultsLoaded = false

  const headings = ['#', 'Title', 'Artist', 'Album', 'Action']
  const tableHeaderHTML = createTableHeading(headings)
  resultsTableHTML.appendChild(tableHeaderHTML)

  buildResultsTable()

  const loadMoreButton = document.getElementById('load-more-button')
  loadMoreButton.style.display = 'block'
}
// Build HTML table from results of api
async function buildResultsTable() {
  const query = document.getElementById('search-query').value

  const result = await callApi(query)
  const resultJSON = JSON.parse(result)
  const resultsTableHTML = document.getElementById('results-table-body')

  const totalResultsText = document.getElementById('total-results-text')
  totalResultsText.textContent = `Total Results : ${resultJSON.count}`
  // Map over Results, Create HTML Elements and add them to Results Table
  resultJSON.recordings.map(recording => {
    totalResultsIndex += 1
    const HTMLnode = createSearchResultTableHTML(recording, totalResultsIndex)
    resultsTableHTML.appendChild(HTMLnode)
  })
}

// Search with query and return results
function callApi(query) {
  let searchUrl
  switch (selectedFilter) {
    case 'artist':
      searchUrl = baseUrl + `/recording/?query=artistname:%22${query}%22` + `&limit=100&offset=${offset}&fmt=json`
      break
    case 'title':
      searchUrl = baseUrl + `/recording/?query=recording:%22${query}%22` + `&limit=100&offset=${offset}&fmt=json`
      break
    case 'album':
      searchUrl = baseUrl + `/recording/?query=release:%22${query}%22` + `&limit=100&offset=${offset}&fmt=json`
    default:
      searchUrl =
        baseUrl +
        `/recording/?query=recording:${query}%20OR%20artistname:${query}%20OR%20release:${query}` +
        `&limit=100&offset=${offset}&fmt=json`
      break
  }

  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', searchUrl)
    req.onload = () => (req.status === 200 ? resolve(req.response) : reject(Error(req.statusText)))
    req.onerror = e => reject(Error(`Network Error: ${e}`))
    req.send()
  })
}

// Creating HTML Elements with map() function
function createTableHeading(headings) {
  const tableRow = document.createElement('tr')

  headings.map(heading => {
    const headingNode = document.createElement('th')
    const headingText = document.createTextNode(heading)

    headingNode.appendChild(headingText)
    tableRow.appendChild(headingNode)
  })

  return tableRow
}
// Creating HTML Elements manually (old way more customizable)
function createSearchResultTableHTML(recording, index) {
  const tableCell = document.createElement('tr')

  const numberTd = document.createElement('td')
  const titleTd = document.createElement('td')
  const artistTd = document.createElement('td')
  const albumTd = document.createElement('td')
  const actionTd = document.createElement('td')

  const numberText = document.createTextNode(index)
  const titleText = document.createTextNode(recording.title)
  const artistText = document.createTextNode(recording['artist-credit'][0]['name'])
  const hasAlbums = recording.releases
  const albumText = document.createTextNode(hasAlbums ? recording.releases[0].title : '-')

  const actionButton = document.createElement('button')
  actionButton.textContent = '+'
  actionButton.className = 'action-button'
  actionButton.onclick = function () {
    createModal(recording)
  }

  numberTd.appendChild(numberText)
  titleTd.appendChild(titleText)
  artistTd.appendChild(artistText)
  albumTd.appendChild(albumText)
  actionTd.appendChild(actionButton)

  tableCell.appendChild(numberTd)
  tableCell.appendChild(titleTd)
  tableCell.appendChild(artistTd)
  tableCell.appendChild(albumTd)
  tableCell.appendChild(actionTd)

  return tableCell
}

// Infintie Loading
async function loadMore() {
  offset += 100
  await buildResultsTable()
  newResultsLoaded = false
}

// Create Modal HTML and set it to be visible
async function createModal(recording) {
  modal = document.getElementById('modal')
  overlay = document.getElementById('modal-overlay')
  modal.style.display = 'block'
  overlay.style.visibility = 'visible'

  const modalTableBody = document.getElementById('modal-table-body')
  headings = ['Title', 'Artist', 'Albums', 'Duration', 'Note', 'Genre']
  modalTableHeadings = createTableHeading(headings)
  modalTableBody.appendChild(modalTableHeadings)

  const tableCell = document.createElement('tr')

  const titleTd = document.createElement('td')
  const artistTd = document.createElement('td')
  const albumsTd = document.createElement('td')
  const durationTd = document.createElement('td')
  const noteTd = document.createElement('td')
  const genreTd = document.createElement('td')

  const titleText = document.createTextNode(recording.title)
  const artistText = document.createTextNode(recording['artist-credit'][0]['name'])
  const hasAlbums = recording.releases
  const albumText = document.createTextNode(hasAlbums ? recording.releases[0].title : '-')
  const duratioonToMins = millisToMinutesAndSeconds(recording.length)
  const durationText = document.createTextNode(duratioonToMins)
  const noteRating = await getRating(recording.id)
  const noteText = document.createTextNode(
    noteRating.value ? `${noteRating.value}/5 (${noteRating['votes-count']})` : 'No Rating'
  )
  const hasGenres = recording.tags && recording.tags.length
  const genresText = document.createTextNode(hasGenres ? recording.tags.map(genre => genre.name).join(' ') : '-')

  titleTd.appendChild(titleText)
  artistTd.appendChild(artistText)
  albumsTd.appendChild(albumText)
  durationTd.appendChild(durationText)
  noteTd.appendChild(noteText)
  genreTd.appendChild(genresText)

  tableCell.appendChild(titleTd)
  tableCell.appendChild(artistTd)
  tableCell.appendChild(albumsTd)
  tableCell.appendChild(durationTd)
  tableCell.appendChild(noteTd)
  tableCell.appendChild(genreTd)

  modalTableBody.appendChild(tableCell)

  const result = await getImage(recording.releases[0]['release-group'].id)
  const albumImageJSON = JSON.parse(result)
  albumImageUrl = albumImageJSON.images[0].image
  const albumImg = document.getElementById('album-image')
  albumImg.src = albumImageUrl
  albumImg.width = 150
}
// Set modal to invisible and destroy all html
function destroyModal() {
  const modal = document.getElementById('modal')
  const albumImg = document.getElementById('album-image')

  const overlay = document.getElementById('modal-overlay')
  modal.style.display = 'none'
  overlay.style.visibility = 'hidden'
  modalTableBody = document.getElementById('modal-table-body')
  modalTableBody.innerHTML = ''
  albumImg.src = ''
}

// Helper Functions

async function getRating(id) {
  const recordingRating = await fetch(`${baseUrl}/recording/${id}?inc=genres+ratings&fmt=json`)
  const recordingJSON = await recordingRating.json()
  console.log(recordingJSON.rating)
  return recordingJSON.rating
}

async function getImage(id) {
  const url = `http://coverartarchive.org/release-group/${id}`
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', url)
    req.onload = () => (req.status === 200 ? resolve(req.response) : reject(Error(req.statusText)))
    req.onerror = e => reject(Error(`Network Error: ${e}`))
    req.send()
  })
}

// Called when the window is scrolled.
window.onscroll = function (e) {
  const loadMoreButton = document.getElementById('load-more-button')
  const isVisible = isInViewport(loadMoreButton)
  if (isVisible && !newResultsLoaded) {
    loadMore()
    newResultsLoaded = true
  }
}

// Check if passed element is visible on screen
function isInViewport(elem) {
  var bounding = elem.getBoundingClientRect()
  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// Convert miliseconds to Minutes and Seconds
function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000)
  const seconds = ((millis % 60000) / 1000).toFixed(0)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}
