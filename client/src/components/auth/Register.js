import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <Fragment>
      <h1 className="large text-primary">
      Sign Up
      </h1>
      <p className="lead">
        <i className="fas fa-user"></i>
        Create Your Account
      </p>
      <form action="dashboard.html" className="form">
        <div className="form-group">
          <input 
            type="text" 
            placeholder="Name" 
            required 
          />
        </div>
        <div className="form-group">
          <input 
            type="email" 
            placeholder="Email" 
          />
          <small className="form-text">
            This site uses Gravatar, use an associated email if you want a Profile Image.
          </small>
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Password" 
            minlength="6" 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Confirm Password" 
            minlength="6" 
          />
        </div>
        <input 
          type="submit" 
          value="Register" 
          className="btn btn-primary" 
        />
      </form>
      <p className="my-1">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </Fragment>
  );
};

export default Register;
