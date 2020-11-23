import React from 'react'
import { Link } from 'react-router-dom';

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
            <Link to="/register" class="btn btn-primary">Sign Up</Link>
            <Link to="/login" class="btn">Login</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Landing;
