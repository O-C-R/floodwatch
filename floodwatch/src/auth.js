import 'whatwg-fetch'

function url(path) {
  return 'http://localhost:8080' + path
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    if(response.headers.get('content-type') === 'application/json') {
      return response.json()
    }
    return response.text()
  }

  if (response.status === 401) {
    delete localStorage.loggedIn
  }
  
  var error = new Error(response.statusText)
  error.response = response
  throw error
}

module.exports = {
  login(username, password) {
    return this.post('/api/v1/login', {
      username: username,
      password: password
    }).then((data) => {
      localStorage.loggedIn = true
      return data
    })
  },

  logout() {
    return this.get('/api/v1/logout')
      .then(() => {
        delete localStorage.loggedIn
      })
  },

  get(path, data) {
    var urlSearchParams = new URLSearchParams()
    for(const key in data) {
      if(Object.hasOwnProperty.call(data, key)) {
        urlSearchParams.set(key, data[key])
      }
    }

    return fetch(url(path) + '?' + urlSearchParams.toString(), {
      method: 'GET',
      credentials: 'include'
    }).then(checkStatus)
  },

  post: function(path, data) {
    var formData = new FormData()
    for(const key in data) {
      if(Object.hasOwnProperty.call(data, key)) {
        formData.append(key, data[key])
      }
    }

    return fetch(url(path), {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }).then(checkStatus)
  },

  loggedIn() {
    return localStorage.loggedIn
  }
}

