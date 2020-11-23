import React from 'react'

const Landing = () => {
  return (
    <section class="landing">
      <div class="dark-overlay">
        <div class="landing-inner">
          <h1 class="x-large">Social network theme</h1>
          <p class="lead">
            Create a profile/portfolio, share posts and chat.
          </p>
          <div class="buttons">
            <a href="/register" class="btn btn-primary">Sign Up</a>
            <a href="/login" class="btn">Login</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Landing;
