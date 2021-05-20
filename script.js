const baseUrl = 'https://musicbrainz.org/ws/2'
const apiConfig = '&limit=100&offset=0&fmt=json'
let selectedFilter = null

// Set filter  for specific data
function setFilter(filter) {
  return (selectedFilter = filter)
}
// Search with query and return results
function callApi(query) {
  let searchUrl

  switch (selectedFilter) {
    default:
      searchUrl =
        baseUrl + `/recording/?query=recording:${query}%20OR%20artistname:${query}%20OR%20release:${query}` + apiConfig
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
// Function fired on search button click get value from search and calls API
async function search() {
  const query = document.getElementById('search-query').value

  const result = await callApi(query)
  const resultJSON = JSON.parse(result)
  // Get Results Table Element
  const resultsTableHTML = document.getElementById('results-table-body')
  // Clear Results Table from old results
  //   resultsTableHTML.innerHTML = ''
  // Map over Results, Create HTML Elements and add them to Results Table
  resultJSON.recordings.map((recording, index) => {
    const HTMLnode = createTableCellHTML(recording, index)
    resultsTableHTML.appendChild(HTMLnode)
  })
}

function createTableCellHTML(recording, index) {
  const tableCell = document.createElement('tr')

  const numberTh = document.createElement('td')
  const numberText = document.createTextNode(index)

  const titleTh = document.createElement('td')
  const titleText = document.createTextNode(recording.title)

  const artistTh = document.createElement('td')
  const artistText = document.createTextNode(recording['artist-credit'][0]['name'])

  const albumTh = document.createElement('td')
  const albumText = document.createTextNode(recording.releases[0].title)

  const actionTh = document.createElement('td')
  const actionButton = document.createElement('button')
  actionButton.textContent = '+'
  actionButton.className = 'action-button'

  numberTh.appendChild(numberText)
  titleTh.appendChild(titleText)
  artistTh.appendChild(artistText)
  albumTh.appendChild(albumText)
  actionTh.appendChild(actionButton)

  tableCell.appendChild(numberTh)
  tableCell.appendChild(titleTh)
  tableCell.appendChild(artistTh)
  tableCell.appendChild(albumTh)
  tableCell.appendChild(actionTh)

  return tableCell
}
