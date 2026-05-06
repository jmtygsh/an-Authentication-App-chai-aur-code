import './style.css'
import homePage from './pages/home.html?raw'
import registerPage from './pages/register.html?raw'
import loginPage from './pages/login.html?raw'
import userPage from './pages/user.html?raw'

const REGISTER_ENDPOINT = 'https://api.freeapi.app/api/v1/users/register'
const LOGIN_ENDPOINT = 'https://api.freeapi.app/api/v1/users/login'
const LOGOUT_ENDPOINT = 'https://api.freeapi.app/api/v1/users/logout'
const CURRENT_USER_ENDPOINT = 'https://api.freeapi.app/api/v1/users/current-user'

const app = document.querySelector('#app')


// homepage
function renderHome() {
  app.innerHTML = homePage
}

// register user
function renderRegister() {
  app.innerHTML = registerPage

  const form = document.querySelector('#register-form')
  const status = document.querySelector('#register-status')
  const button = document.querySelector('#register-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const formData = new FormData(form)

    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (password !== confirmPassword) {
      status.className = 'status error show'
      status.textContent = 'Passwords do not match.'
      setTimeout(() => {
        status.className = 'status'
        status.textContent = ''
      }, 3000)
      return
    }

    const body = {
      email: formData.get('email'),
      password: password,
      role: formData.get('role'),
      username: formData.get('username'),
    }

    button.disabled = true
    status.className = 'status show'
    status.textContent = 'Creating account...'

    try {
      const response = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const messageFromApi = data && data.message

      if (!response.ok) {
        const message = messageFromApi || 'Registration failed. Please try again.'
        throw new Error(message)
      }

      status.className = 'status success show'
      status.textContent = messageFromApi || 'Registration successful.'
      form.reset()

      // Hide success message after 3 seconds
      setTimeout(() => {
        status.className = 'status'
        status.textContent = ''
      }, 3000)
    } catch (error) {
      status.className = 'status error show'
      status.textContent = error instanceof Error ? error.message : 'Something went wrong.'

      // Hide error message after 3 seconds
      setTimeout(() => {
        status.className = 'status'
        status.textContent = ''
      }, 3000)
    } finally {
      button.disabled = false
    }
  })
}

// login user
function renderLogin() {
  app.innerHTML = loginPage

  const form = document.querySelector('#login-form')
  const status = document.querySelector('#login-status')
  const button = document.querySelector('#login-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const formData = new FormData(form)

    const body = {
      password: formData.get('password'),
      username: formData.get('username'),
    }

    button.disabled = true
    status.className = 'status show'
    status.textContent = 'Logging in...'

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const messageFromApi = data && data.message

      if (!response.ok) {
        const message = messageFromApi || 'Login failed. Please try again.'
        throw new Error(message)
      }

      if (data.data && data.data.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken)
      }

      status.className = 'status success show'
      status.textContent = messageFromApi || 'Login successful. Redirecting...'
      form.reset()

      // Redirect to /user after successful login
      setTimeout(() => {
        status.className = 'status'
        status.textContent = ''
        window.history.pushState({}, '', '/user')
        router()
      }, 1000)
    } catch (error) {
      status.className = 'status error show'
      status.textContent = error instanceof Error ? error.message : 'Something went wrong.'
      
      // Hide error after 3 seconds
      setTimeout(() => {
        status.className = 'status'
        status.textContent = ''
      }, 3000)
    } finally {
      button.disabled = false
    }
  })
}

// user
async function renderUser() {
  app.innerHTML = userPage

  const status = document.querySelector('#user-status')
  const welcome = document.querySelector('#user-welcome')
  const details = document.querySelector('#user-details')
  const logoutBtn = document.querySelector('#logout-btn')

  try {
    const accessToken = localStorage.getItem('accessToken')
    const response = await fetch(CURRENT_USER_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    })

    const data = await response.json()

    console.log('User data:', data)

    if (!response.ok) {
      if (response.status === 401) {
        window.history.pushState({}, '', '/login')
        router()
        return
      }
      throw new Error(data.message || 'Failed to fetch user data. Please login again.')
    }

    const user = data.data
    welcome.textContent = `Welcome back, ${user.username}!`
    
    // Set Avatar if available, otherwise show fallback with first character of username
    const avatarImg = document.querySelector('#user-avatar')
    const avatarFallback = document.querySelector('#user-avatar-fallback')
    
    const showFallback = () => {
      avatarImg.style.display = 'none'
      avatarFallback.style.display = 'flex'
      avatarFallback.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U'
    }

    if (user.avatar && user.avatar.url) {
      avatarImg.src = user.avatar.url
      avatarImg.style.display = 'block'
      avatarFallback.style.display = 'none'
      
      // If the image fails to load, fallback to initial
      avatarImg.onerror = showFallback
    } else {
      showFallback()
    }

    // Set other details
    document.querySelector('#display-id').textContent = user._id || 'N/A'
    document.querySelector('#display-username').textContent = user.username || 'N/A'
    document.querySelector('#display-email').textContent = user.email || 'N/A'
    document.querySelector('#display-role').textContent = user.role || 'N/A'
    document.querySelector('#display-login-type').textContent = user.loginType || 'N/A'
    document.querySelector('#display-email-verified').textContent = user.isEmailVerified ? 'Yes' : 'No'
    
    // Format Dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleString()
    }
    
    document.querySelector('#display-created').textContent = formatDate(user.createdAt)
    document.querySelector('#display-updated').textContent = formatDate(user.updatedAt)

    details.style.display = 'block'
  } catch (error) {
    status.className = 'status error'
    status.textContent = error instanceof Error ? error.message : 'Something went wrong.'
    welcome.textContent = 'Authentication Error'
  }

  logoutBtn.addEventListener('click', async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      })
      localStorage.removeItem('accessToken')
      window.history.pushState({}, '', '/login')
      router()
    } catch (error) {
      console.error('Logout failed', error)
      localStorage.removeItem('accessToken')
      window.history.pushState({}, '', '/login')
      router()
    }
  })
}

function router() {
  const path = window.location.pathname
  const accessToken = localStorage.getItem('accessToken')

  // Redirect to /user if token exists and user tries to access auth pages
  if (accessToken && (path === '/login' || path === '/register')) {
    window.history.replaceState({}, '', '/user')
    renderUser()
    return
  }

  if (path === '/register') {
    renderRegister()
  } else if (path === '/login') {
    renderLogin()
  } else if (path === '/user') {
    renderUser()
  } else {
    renderHome()
  }
}

// Handle browser navigation (back/forward)
window.addEventListener('popstate', router)

// Intercept anchor clicks for SPA routing
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="/"]')
  if (link) {
    e.preventDefault()
    window.history.pushState({}, '', link.getAttribute('href'))
    router()
  }
})

// Initial route
router()
